import { z } from 'zod';

const identifier = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/);
export const stepSchema = z
  .object({
    id: identifier,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(4000).default(''),
    kind: z.enum(['agent', 'manual', 'approval']),
    dependencies: z.array(identifier).max(100).default([]),
  })
  .strict();
export const planSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().max(4000).default(''),
    steps: z.array(stepSchema).min(1).max(100),
  })
  .strict();
export const commandSchema = z
  .object({
    type: z.enum([
      'start',
      'complete',
      'fail',
      'log',
      'approve',
      'reject',
      'submit',
      'retry',
      'pause',
      'resume',
      'cancel',
    ]),
    stepId: identifier.optional(),
    message: z.string().trim().max(8000).optional(),
    expectedRevision: z.number().int().nonnegative().optional(),
    commandId: z.string().min(1).max(128).optional(),
  })
  .strict();
export type Plan = z.infer<typeof planSchema>;
export type Command = z.infer<typeof commandSchema>;
export type Principal = { role: 'agent' | 'human'; id: string };
export type StepStatus =
  | 'blocked'
  | 'ready'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'rejected';
export type Step = Plan['steps'][number] & {
  status: StepStatus;
  attempt: number;
  result?: string;
  startedAt?: string;
  completedAt?: string;
};
export type RunEvent = {
  sequence: number;
  type: string;
  actor: string;
  at: string;
  stepId?: string;
  message: string;
};
export type Run = {
  id: string;
  title: string;
  description: string;
  coordinator: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'rejected';
  revision: number;
  createdAt: string;
  updatedAt: string;
  steps: Step[];
  events: RunEvent[];
};
export class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
function requireCondition(
  ok: unknown,
  code: string,
  message: string,
  status = 409,
): asserts ok {
  if (!ok) throw new WorkflowError(code, message, status);
}
function refresh(run: Run) {
  for (const step of run.steps) {
    if (!['blocked', 'ready', 'waiting'].includes(step.status)) continue;
    const enabled = step.dependencies.every(
      (id) => run.steps.find((s) => s.id === id)!.status === 'completed',
    );
    step.status = enabled
      ? step.kind === 'agent'
        ? 'ready'
        : 'waiting'
      : 'blocked';
  }
  if (run.steps.every((step) => step.status === 'completed'))
    run.status = 'completed';
}
export function createRun(input: unknown, coordinator: string): Run {
  const plan = planSchema.parse(input);
  const byId = new Map(plan.steps.map((step) => [step.id, step]));
  requireCondition(
    byId.size === plan.steps.length,
    'INVALID_PLAN',
    'Duplicate step IDs',
    400,
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    requireCondition(
      !visiting.has(id),
      'INVALID_PLAN',
      'Dependency cycle detected',
      400,
    );
    if (visited.has(id)) return;
    const step = byId.get(id);
    requireCondition(step, 'INVALID_PLAN', `Missing dependency: ${id}`, 400);
    requireCondition(
      new Set(step.dependencies).size === step.dependencies.length,
      'INVALID_PLAN',
      'Duplicate dependencies',
      400,
    );
    visiting.add(id);
    step.dependencies.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }
  plan.steps.forEach((step) => visit(step.id));
  const now = new Date().toISOString();
  const run: Run = {
    ...plan,
    id: crypto.randomUUID(),
    coordinator,
    status: 'active',
    revision: 1,
    createdAt: now,
    updatedAt: now,
    steps: plan.steps.map((step) => ({
      ...step,
      status: 'blocked',
      attempt: 0,
    })),
    events: [
      {
        sequence: 1,
        type: 'created',
        actor: coordinator,
        at: now,
        message: 'Plan registrado. Esperando ejecución.',
      },
    ],
  };
  refresh(run);
  return run;
}
export function transition(
  current: Run,
  input: unknown,
  actor: Principal,
): Run {
  const command = commandSchema.parse(input);
  const { type, stepId, message = '' } = command;
  requireCondition(
    !['completed', 'cancelled', 'rejected'].includes(current.status),
    'TERMINAL',
    'Run is terminal',
  );
  if (command.expectedRevision !== undefined)
    requireCondition(
      command.expectedRevision === current.revision,
      'REVISION_CONFLICT',
      'Revision changed; reload before deciding',
    );
  if (actor.role === 'agent')
    requireCondition(
      actor.id === current.coordinator,
      'FORBIDDEN',
      'Only the designated coordinator may execute this run',
      403,
    );
  const humanActions = [
    'approve',
    'reject',
    'submit',
    'pause',
    'resume',
    'cancel',
  ];
  if (humanActions.includes(type))
    requireCondition(
      actor.role === 'human',
      'FORBIDDEN',
      'This action requires a human',
      403,
    );
  if (['start', 'complete', 'fail', 'log'].includes(type))
    requireCondition(
      actor.role === 'agent',
      'FORBIDDEN',
      'This action requires an agent',
      403,
    );
  if (current.status === 'paused')
    requireCondition(
      ['resume', 'cancel', 'complete', 'fail', 'log'].includes(type),
      'PAUSED',
      'Run is paused',
    );
  const run = structuredClone(current);
  const now = new Date().toISOString();
  if (['pause', 'resume', 'cancel'].includes(type)) {
    requireCondition(
      !stepId,
      'INVALID_COMMAND',
      'Run commands must not include a step ID',
      400,
    );
    if (type === 'pause') {
      requireCondition(
        run.status === 'active',
        'INVALID_STATE',
        'Run must be active',
      );
      run.status = 'paused';
    }
    if (type === 'resume') {
      requireCondition(
        run.status === 'paused',
        'INVALID_STATE',
        'Run must be paused',
      );
      run.status = 'active';
    }
    if (type === 'cancel') run.status = 'cancelled';
  } else {
    const step = run.steps.find((s) => s.id === stepId);
    requireCondition(step, 'NOT_FOUND', 'Step not found', 404);
    if (['start', 'complete', 'fail', 'log', 'retry'].includes(type))
      requireCondition(
        step.kind === 'agent',
        'INVALID_KIND',
        'This action requires an agent step',
      );
    if (['complete', 'fail', 'submit', 'reject', 'log'].includes(type))
      requireCondition(
        message.length > 0,
        'EVIDENCE_REQUIRED',
        'A non-empty result or explanation is required',
        400,
      );
    switch (type) {
      case 'start':
        requireCondition(
          step.status === 'ready',
          'NOT_READY',
          'Step must be ready',
        );
        step.status = 'running';
        step.attempt += 1;
        step.startedAt = now;
        break;
      case 'complete':
      case 'fail':
      case 'log':
        requireCondition(
          step.status === 'running',
          'NOT_RUNNING',
          'Step must be running',
        );
        if (type !== 'log') {
          step.status = type === 'complete' ? 'completed' : 'failed';
          step.result = message;
          step.completedAt = now;
        }
        break;
      case 'submit':
      case 'approve':
      case 'reject':
        requireCondition(
          step.kind === (type === 'submit' ? 'manual' : 'approval'),
          'INVALID_KIND',
          'Wrong human action for step kind',
        );
        requireCondition(
          step.status === 'waiting',
          'NOT_WAITING',
          'Step must be waiting for human input',
        );
        step.status = type === 'reject' ? 'rejected' : 'completed';
        step.result = message || 'Aprobado por el usuario';
        step.completedAt = now;
        if (type === 'reject') run.status = 'rejected';
        break;
      case 'retry':
        requireCondition(
          step.status === 'failed',
          'NOT_FAILED',
          'Only a failed step can be retried',
        );
        step.status = 'blocked';
        delete step.result;
        delete step.startedAt;
        delete step.completedAt;
        break;
    }
  }
  if (!['cancelled', 'rejected'].includes(run.status)) refresh(run);
  run.revision += 1;
  run.updatedAt = now;
  run.events.push({
    sequence: run.revision,
    type,
    actor: actor.id,
    at: now,
    ...(stepId ? { stepId } : {}),
    message,
  });
  return run;
}
