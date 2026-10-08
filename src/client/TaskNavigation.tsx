import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Controls,
  ControlButton,
  useReactFlow,
  useStore,
  getNodesBounds,
  getViewportForBounds,
  type Node,
} from '@xyflow/react';
import {
  Focus,
  Scan,
  ArrowUpRight,
  ArrowRightLeft,
  ListTree,
  LocateFixed,
} from 'lucide-react';
import type { Run, Step } from '../domain/workflow';
import { motionDuration } from './preferences';
import { attentionStep } from './attention';
const statuses: Record<string, string> = {
  blocked: 'En espera',
  ready: 'Lista',
  running: 'En curso',
  waiting: 'Tu turno',
  completed: 'Completada',
  failed: 'Falló',
  rejected: 'Rechazada',
  skipped: 'Omitida',
};
export type FocusRequest = { id: string; nonce: number } | null;
export function TaskNavigation({
  run,
  view,
  following,
  onFollowing,
  suspended,
  available,
  request,
  onSelect,
  onFocused,
}: {
  run: Run;
  view: string;
  following: boolean;
  onFollowing: (value: boolean) => void;
  suspended: boolean;
  available: boolean;
  request: FocusRequest;
  onSelect: (id: string, view?: 'step' | 'io' | 'trace') => void;
  onFocused: (id: string) => void;
}) {
  const { getNode, getNodes, getInternalNode, setViewport } =
    useReactFlow<Node<{ step: Step }>>();
  const width = useStore((s) => s.width),
    height = useStore((s) => s.height);
  const initialized = useStore(
    (s) =>
      s.nodeLookup.size > 0 &&
      [...s.nodeLookup.values()].every((n) =>
        Boolean(n.measured?.width && n.measured?.height),
      ),
  );
  const [focused, setFocused] = useState('');
  const current = attentionStep(run.steps, focused);
  const tasks = run.steps.filter((s) =>
    ['agent', 'manual', 'approval'].includes(s.kind),
  );
  const selected =
    tasks.find((s) => s.id === focused) || current || tasks.at(-1);
  const lastFollow = useRef('');
  const lastRequest = useRef(-1);
  const focus = useCallback(
    (id: string) => {
      const child = run.steps.find((s) => s.id === id);
      const n =
        getNode(id) ||
        (child?.jobId ? getNode(`job:${child.jobId}`) : undefined);
      if (!n) return;
      const nodeWidth = n.measured?.width || 280,
        nodeHeight = n.measured?.height || 200;
      const top = width <= 760 ? 255 : 140,
        bottom = width <= 760 ? 245 : 110;
      const visibleHeight = Math.max(80, height - top - bottom);
      const zoom = Math.min(
        1,
        Math.max(
          0.15,
          Math.min((width - 48) / nodeWidth, visibleHeight / nodeHeight),
        ),
      );
      const centerY = top + visibleHeight / 2;
      void setViewport(
        {
          x: width / 2 - (n.position.x + nodeWidth / 2) * zoom,
          y: centerY - (n.position.y + nodeHeight / 2) * zoom,
          zoom,
        },
        {
          duration: motionDuration(),
        },
      );
      setFocused(id);
      onFocused(id);
    },
    [getNode, setViewport, width, height, onFocused, run.steps],
  );
  useEffect(() => {
    if (!following) {
      lastFollow.current = '';
      return;
    }
    if (
      (!current && run.status !== 'paused') ||
      ['completed', 'cancelled', 'rejected'].includes(run.status)
    ) {
      onFollowing(false);
      return;
    }
    if (
      !current ||
      suspended ||
      !available ||
      run.status === 'paused' ||
      !initialized
    )
      return;
    const target = `${view}:${current.id}:${width}:${height}`;
    if (lastFollow.current !== target) {
      lastFollow.current = target;
      focus(current.id);
    }
  }, [
    following,
    view,
    suspended,
    available,
    run.status,
    width,
    height,
    initialized,
    current?.id,
    focus,
    onFollowing,
  ]);
  useEffect(() => {
    if (
      request &&
      initialized &&
      !suspended &&
      lastRequest.current !== request.nonce
    ) {
      lastRequest.current = request.nonce;
      focus(request.id);
    }
  }, [request, initialized, suspended, focus]);
  const overview = () => {
    onFollowing(false);
    onFocused('');
    const bounds = getNodesBounds(
      getNodes().map((n) => getInternalNode(n.id)!),
    );
    const viewport = getViewportForBounds(
      bounds,
      width,
      Math.max(180, height - (width <= 760 ? 485 : 200)),
      0.15,
      1,
      0.12,
    );
    void setViewport(
      { ...viewport, y: viewport.y + (width <= 760 ? 255 : 115) },
      {
        duration: motionDuration(),
      },
    );
  };
  const focusCurrent = () => {
    onFollowing(false);
    if (current || selected) focus((current || selected)!.id);
  };
  return (
    <>
      <Controls
        showInteractive={false}
        showFitView={false}
        onZoomIn={() => onFollowing(false)}
        onZoomOut={() => onFollowing(false)}
      >
        <ControlButton
          onClick={overview}
          aria-label="Vista general"
          title="Vista general"
        >
          <Scan style={{ fill: 'none' }} />
        </ControlButton>
        <ControlButton
          onClick={focusCurrent}
          aria-label="Enfocar paso actual"
          title="Tarea actual"
        >
          <Focus style={{ fill: 'none' }} />
        </ControlButton>
      </Controls>
      <section className="task-navigation" aria-label="Navegación de tareas">
        <div className="task-navigation-heading">
          <label htmlFor="focus-task">Ir a tarea</label>
          <span aria-live="polite">
            {following
              ? suspended || !available || run.status === 'paused'
                ? 'Seguimiento en pausa'
                : 'Siguiendo actividad'
              : 'Vista libre'}
          </span>
        </div>
        <select
          id="focus-task"
          value={selected?.id || ''}
          disabled={!tasks.length}
          onChange={(e) => {
            onFollowing(false);
            focus(e.target.value);
          }}
        >
          {!tasks.length && <option value="">Sin tareas</option>}
          {tasks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.jobId
                ? `${run.jobs?.find((j) => j.id === s.jobId)?.title} / `
                : ''}
              {s.title} · {statuses[s.status]}
            </option>
          ))}
        </select>
        <div className="task-navigation-actions">
          <button
            className="follow-toggle"
            aria-pressed={following}
            disabled={
              (!current && !following) ||
              ['completed', 'cancelled', 'rejected'].includes(run.status)
            }
            onClick={() => onFollowing(!following)}
          >
            <LocateFixed size={15} />
            Seguir actividad
          </button>
          <button
            aria-label="Abrir tarea enfocada"
            title="Abrir tarea"
            disabled={!selected}
            onClick={() => selected && onSelect(selected.id)}
          >
            <ArrowUpRight size={17} />
          </button>
          <button
            aria-label="Datos de la tarea enfocada"
            title="Datos"
            disabled={!selected}
            onClick={() => selected && onSelect(selected.id, 'io')}
          >
            <ArrowRightLeft size={17} />
          </button>
          <button
            aria-label="Logs de la tarea enfocada"
            title="Logs"
            disabled={!selected}
            onClick={() => selected && onSelect(selected.id, 'trace')}
          >
            <ListTree size={17} />
          </button>
        </div>
      </section>
    </>
  );
}
