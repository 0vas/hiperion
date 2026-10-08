import type { Step } from '../domain/workflow.js';
const control = (s: Step) => ['start', 'end', 'gateway'].includes(s.kind);
/** Structured blocks retain their lanes through nested splits and matching joins. */
export function layoutSteps(
  steps: Step[],
  structured = true,
): Record<string, { x: number; y: number }> {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const depth = new Map<string, number>();
  const level = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    const s = byId.get(id)!;
    const value = s.dependencies.length
      ? Math.max(...s.dependencies.map(level)) + 1
      : 0;
    depth.set(id, value);
    return value;
  };
  steps.forEach((s) => level(s.id));
  const groups = new Map<number, Step[]>();
  for (const s of steps)
    groups.set(depth.get(s.id)!, [...(groups.get(depth.get(s.id)!) || []), s]);
  const y = new Map<number, number>();
  let offset = 0;
  for (const [d, items] of [...groups].sort(([a], [b]) => a - b)) {
    y.set(d, offset);
    offset += Math.max(
      ...items.map(
        (s) =>
          (control(s) ? 150 : 250) +
          Math.max(0, Math.ceil(s.title.length / 25) - 2) * 24,
      ),
    );
  }
  const centers = new Map<string, number>();
  const start = steps.find((s) => s.kind === 'start');
  const end = steps.find((s) => s.kind === 'end');
  if (structured && start && end) {
    const next = (id: string) =>
      steps.find((s) => s.dependencies.includes(id))!.id;
    const joinFor = (id: string) =>
      steps.find(
        (s) => s.gateway?.splitId === id && s.gateway.direction === 'join',
      )!;
    const widths = new Map<string, number>();
    const measure = (from: string, stop: string): number => {
      let id = from,
        width = 340;
      while (id !== stop) {
        const s = byId.get(id)!;
        if (s.gateway?.direction === 'split') {
          const join = joinFor(id);
          const w =
            s.gateway.routes!.reduce(
              (sum, r) => sum + measure(r.target, join.id),
              0,
            ) +
            60 * (s.gateway.routes!.length - 1);
          widths.set(id, w);
          width = Math.max(width, w);
          id = next(join.id);
        } else id = next(id);
      }
      return width;
    };
    const place = (from: string, stop: string, left: number, width: number) => {
      let id = from;
      while (id !== stop) {
        const s = byId.get(id)!;
        centers.set(id, left + width / 2);
        if (s.gateway?.direction === 'split') {
          const join = joinFor(id);
          const total = widths.get(id)!;
          let cursor = left + (width - total) / 2;
          for (const r of s.gateway.routes!) {
            const w = measure(r.target, join.id);
            place(r.target, join.id, cursor, w);
            cursor += w + 60;
          }
          centers.set(join.id, left + width / 2);
          id = next(join.id);
        } else id = next(id);
      }
    };
    const width = measure(start.id, end.id);
    place(start.id, end.id, 0, width);
    centers.set(end.id, width / 2);
  } else {
    for (const items of groups.values())
      items
        .sort((a, b) => a.id.localeCompare(b.id))
        .forEach((s, i) =>
          centers.set(s.id, i * 360 - (items.length - 1) * 180),
        );
  }
  return Object.fromEntries(
    steps.map((s) => [
      s.id,
      {
        x: centers.get(s.id)! - (control(s) ? 90 : 140),
        y: y.get(depth.get(s.id)!)!,
      },
    ]),
  );
}
