import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NodeChange, NodePositionChange } from '@xyflow/react';
type Positions = Record<string, { x: number; y: number }>;
const storageKey = (key: string) => `hyperion.node-positions.v1:${key}`;
function read(key: string): Positions {
  try {
    const entries = Object.entries(
      JSON.parse(localStorage.getItem(storageKey(key)) || '{}'),
    );
    return Object.fromEntries(
      entries.filter(([, p]) => {
        const point = p as { x?: unknown; y?: unknown } | null;
        return (
          point &&
          typeof point.x === 'number' &&
          Number.isFinite(point.x) &&
          typeof point.y === 'number' &&
          Number.isFinite(point.y)
        );
      }),
    ) as Positions;
  } catch {
    return {};
  }
}
/** Presentation only: never writes coordinates into recorded process state. */
export function useNodePositions(key: string) {
  const initial = useMemo(() => read(key), [key]);
  const [state, setState] = useState({ key, positions: initial });
  const positions = state.key === key ? state.positions : initial;
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (Object.keys(positions).length)
          localStorage.setItem(storageKey(key), JSON.stringify(positions));
        else localStorage.removeItem(storageKey(key));
      } catch {
        /* Arrangement remains usable when storage is unavailable. */
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [key, positions]);
  const change = useCallback(
    (changes: NodeChange[]) => {
      const moves = changes.filter(
        (c): c is NodePositionChange => c.type === 'position' && !!c.position,
      );
      if (!moves.length) return;
      setState((previous) => ({
        key,
        positions: Object.fromEntries([
          ...Object.entries(
            previous.key === key ? previous.positions : initial,
          ),
          ...moves.map((c) => [c.id, c.position!]),
        ]),
      }));
    },
    [key, initial],
  );
  const reset = useCallback(() => setState({ key, positions: {} }), [key]);
  return { positions, change, reset };
}
