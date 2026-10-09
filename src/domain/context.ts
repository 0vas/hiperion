import type { Run, Step } from './workflow.js';
export type AvailableContext = {
  request?: string;
  general: Record<string, unknown>;
  previous: {
    stepId: string;
    title: string;
    result?: string;
    outputs: Record<string, unknown>;
  }[];
};
/** Read projection only. Contracts still control required data and readiness. */
export function contextForStep(run: Run, step: Step): AvailableContext {
  const ancestors = new Set<string>();
  const visit = (id: string) => {
    if (ancestors.has(id)) return;
    ancestors.add(id);
    run.steps.find((s) => s.id === id)?.dependencies.forEach(visit);
  };
  step.dependencies.forEach(visit);
  return {
    ...(run.request ? { request: run.request } : {}),
    general: run.context || {},
    previous: run.steps
      .filter(
        (s) =>
          ancestors.has(s.id) &&
          s.status === 'completed' &&
          !['start', 'end', 'gateway'].includes(s.kind),
      )
      .map((s) => ({
        stepId: s.id,
        title: s.title,
        ...(s.result ? { result: s.result } : {}),
        outputs: s.outputValues || {},
      })),
  };
}
export function presentRun(run: Run): Run {
  return {
    ...run,
    steps: run.steps.map((step) => ({
      ...step,
      availableContext: contextForStep(run, step),
    })),
  };
}
export function routeLabel(
  run: Run,
  source: Step | undefined,
  target: string,
): string | undefined {
  const gate = source?.gateway;
  const route = gate?.routes?.find((r) => r.target === target);
  if (route?.label) return route.label;
  let when = route?.when;
  let invert = false;
  if (
    !when &&
    gate?.defaultTarget === target &&
    gate.type === 'exclusive' &&
    gate.routes?.length === 2
  ) {
    when = gate.routes.find((r) => r.when)?.when;
    invert = true;
  }
  if (when && typeof when.equals === 'boolean') {
    const port = run.steps
      .find((s) => s.id === when.stepId)
      ?.outputs?.find((p) => p.name === when.output);
    const yes = invert ? !when.equals : when.equals;
    return (
      (yes ? port?.form?.trueLabel : port?.form?.falseLabel) ||
      (yes ? 'Sí' : 'No')
    );
  }
  if (gate?.defaultTarget === target) return 'Otra opción';
  if (when) return run.steps.find((s) => s.id === target)?.title || 'Continuar';
  return undefined;
}
