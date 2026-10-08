import type { Plan, Run, Step, StepStatus } from './workflow.js';

/** A job is a projection of executable steps, never a second execution state. */
export function jobProgress(run: Pick<Run, 'steps' | 'jobs'>, jobId: string) {
  const steps = run.steps.filter((s) => s.jobId === jobId);
  const completed = steps.filter((s) => s.status === 'completed').length;
  const skipped = steps.filter((s) => s.status === 'skipped').length;
  const priority: StepStatus[] = [
    'rejected',
    'failed',
    'waiting',
    'running',
    'ready',
    'blocked',
  ];
  const status =
    priority.find((state) => steps.some((s) => s.status === state)) ||
    (completed ? 'completed' : 'skipped');
  return { steps, completed, skipped, total: steps.length, status };
}

export function projectJobs(run: Pick<Run, 'steps' | 'jobs'>): Step[] {
  const idFor = (s: Step) => (s.jobId ? `job:${s.jobId}` : s.id);
  const byId = new Map(run.steps.map((s) => [s.id, s]));
  const items = run.steps
    .filter((s) => !s.jobId)
    .map((s) => ({
      ...s,
      dependencies: [
        ...new Set(s.dependencies.map((id) => idFor(byId.get(id)!))),
      ],
    }));
  for (const job of run.jobs || []) {
    const progress = jobProgress(run, job.id);
    const id = `job:${job.id}`;
    items.push({
      id,
      title: job.title,
      description: job.description || '',
      kind: 'agent',
      status: progress.status,
      attempt: 0,
      dependencies: [
        ...new Set(
          progress.steps
            .flatMap((s) => s.dependencies.map((dep) => idFor(byId.get(dep)!)))
            .filter((dep) => dep !== id),
        ),
      ],
    });
  }
  return items;
}

export function validateJobs(plan: Plan) {
  const ids = new Set(plan.jobs?.map((j) => j.id));
  if (ids.size !== (plan.jobs?.length || 0))
    throw new Error('Duplicate job IDs');
  for (const step of plan.steps) {
    if (step.jobId && !ids.has(step.jobId))
      throw new Error(`Unknown job: ${step.jobId}`);
    if (step.interaction && !['manual', 'approval'].includes(step.kind))
      throw new Error('Interaction belongs to a human step');
  }
  for (const id of ids)
    if (!plan.steps.some((s) => s.jobId === id))
      throw new Error(`Empty job: ${id}`);
  // Contraction must remain acyclic so the overview tells the same story.
  const projected = projectJobs({
    ...plan,
    steps: plan.steps.map((s) => ({ ...s, status: 'blocked', attempt: 0 })),
  });
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const byId = new Map(projected.map((s) => [s.id, s]));
  const visit = (id: string) => {
    if (visiting.has(id))
      throw new Error(
        'A job must not be reentered; split it into successive jobs',
      );
    if (visited.has(id)) return;
    visiting.add(id);
    byId.get(id)?.dependencies.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  projected.forEach((s) => visit(s.id));
}
