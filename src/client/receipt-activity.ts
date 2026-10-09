import { useEffect, useRef, useState } from 'react';
import type { Run } from '../domain/workflow';
import { contextForStep } from '../domain/context';
export type ReceiptActivity = {
  logs: Record<string, number>;
  io: Record<string, number>;
  process: number;
};
const empty = (): ReceiptActivity => ({ logs: {}, io: {}, process: 0 });
export function mergeRuns(previous: Run[], incoming: Run[]): Run[] {
  const next = new Map(previous.map((r) => [r.id, r]));
  for (const run of incoming)
    if (!next.has(run.id) || next.get(run.id)!.revision < run.revision)
      next.set(run.id, run);
  return [...next.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
export function changedReceipts(
  before: Run,
  after: Run,
  stamp: number,
): ReceiptActivity {
  const next = empty();
  for (const e of after.events.filter(
    (e) => e.sequence > (before.events.at(-1)?.sequence || 0),
  )) {
    next.process = stamp;
    if (e.stepId) next.logs[e.stepId] = stamp;
  }
  for (const step of after.steps) {
    const old = before.steps.find((s) => s.id === step.id);
    if (
      old &&
      JSON.stringify([
        old.inputValues,
        old.outputValues,
        contextForStep(before, old),
      ]) !==
        JSON.stringify([
          step.inputValues,
          step.outputValues,
          contextForStep(after, step),
        ])
    )
      next.io[step.id] = stamp;
  }
  return next;
}
export function useReceiptActivity(run: Run | undefined) {
  const previous = useRef<Run | undefined>(undefined);
  const [activity, setActivity] = useState<ReceiptActivity>(empty);
  useEffect(() => {
    const before = previous.current;
    previous.current = run;
    if (!run || before?.id !== run.id) {
      setActivity(empty());
      return;
    }
    if (before.revision === run.revision) return;
    const fresh = changedReceipts(before, run, Date.now());
    setActivity((a) => ({
      logs: { ...a.logs, ...fresh.logs },
      io: { ...a.io, ...fresh.io },
      process: fresh.process || a.process,
    }));
  }, [run]);
  useEffect(() => {
    if (
      !activity.process &&
      !Object.keys(activity.logs).length &&
      !Object.keys(activity.io).length
    )
      return;
    const timestamps = [
      ...Object.values(activity.logs),
      ...Object.values(activity.io),
      ...(activity.process ? [activity.process] : []),
    ];
    const delay = Math.max(16, Math.min(...timestamps) + 3000 - Date.now());
    const timer = setTimeout(
      () =>
        setActivity((a) => ({
          logs: Object.fromEntries(
            Object.entries(a.logs).filter(([, at]) => Date.now() - at < 3000),
          ),
          io: Object.fromEntries(
            Object.entries(a.io).filter(([, at]) => Date.now() - at < 3000),
          ),
          process: Date.now() - a.process < 3000 ? a.process : 0,
        })),
      delay,
    );
    return () => clearTimeout(timer);
  }, [activity]);
  return activity;
}
