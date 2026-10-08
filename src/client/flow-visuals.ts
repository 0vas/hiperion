import type { Run, Step } from '../domain/workflow';
export type FlowState =
  | 'pending'
  | 'ready'
  | 'active'
  | 'attention'
  | 'completed'
  | 'error'
  | 'skipped'
  | 'paused'
  | 'stopped';
export const flowLabels: Record<FlowState, string> = {
  pending: 'Pendiente',
  ready: 'Listo',
  active: 'En curso',
  attention: 'Tu turno',
  completed: 'Completado',
  error: 'Requiere revisión',
  skipped: 'Omitido',
  paused: 'En pausa',
  stopped: 'Detenido',
};
export function nodeState(
  step: Pick<Step, 'status'>,
  status: Run['status'],
): FlowState {
  if (step.status === 'completed') return 'completed';
  if (step.status === 'skipped') return 'skipped';
  if (['failed', 'rejected'].includes(step.status)) return 'error';
  if (status === 'cancelled' || status === 'rejected') return 'stopped';
  if (step.status === 'blocked') return 'pending';
  if (status === 'paused') return 'paused';
  return step.status === 'running'
    ? 'active'
    : step.status === 'waiting'
      ? 'attention'
      : 'ready';
}
function crossingState(
  source: Step,
  target: Step,
  status: Run['status'],
): FlowState {
  if (source.status === 'skipped' || target.status === 'skipped')
    return 'skipped';
  if (source.status !== 'completed') return 'pending';
  return nodeState(target, status);
}
/** For collapsed jobs, inspect the actual edges crossing each group boundary. */
export function routeState(
  run: Run,
  sourceId: string,
  targetId: string,
): FlowState {
  const matches = (step: Step, id: string) =>
    id.startsWith('job:') ? step.jobId === id.slice(4) : step.id === id;
  const states: FlowState[] = [];
  for (const target of run.steps.filter((s) => matches(s, targetId))) {
    for (const dep of target.dependencies) {
      const source = run.steps.find((s) => s.id === dep);
      if (source && matches(source, sourceId))
        states.push(crossingState(source, target, run.status));
    }
  }
  return (
    (
      [
        'error',
        'paused',
        'stopped',
        'attention',
        'active',
        'ready',
        'completed',
        'pending',
        'skipped',
      ] as const
    ).find((s) => states.includes(s)) || 'pending'
  );
}

/** Information can reach this connection; motion never claims agent execution. */
export function carriesCurrent(
  state: FlowState,
  status: Run['status'],
  online: boolean,
  reduceMotion: boolean,
): boolean {
  return (
    status === 'active' &&
    online &&
    !reduceMotion &&
    ['completed', 'ready', 'active', 'attention'].includes(state)
  );
}
