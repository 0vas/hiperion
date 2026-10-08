import type { Step, StepStatus } from '../domain/workflow.js';
/** Presentation priority only; task execution remains entirely in the domain. */
export function attentionStep(
  steps: Step[],
  current?: string,
): Step | undefined {
  const tasks = steps.filter((s) =>
    ['agent', 'manual', 'approval'].includes(s.kind),
  );
  for (const status of [
    'failed',
    'waiting',
    'running',
    'ready',
  ] as StepStatus[]) {
    const candidates = tasks.filter((s) => s.status === status);
    if (candidates.length)
      return candidates.find((s) => s.id === current) || candidates[0];
  }
}
