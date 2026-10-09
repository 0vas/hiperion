import { contextForStep, routeLabel } from '../domain/context';
import { HarnessIcon } from './HarnessIcon';
import { useReceiptActivity, mergeRuns } from './receipt-activity';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  useStore,
  getNodesBounds,
  getViewportForBounds,
  type NodeProps,
  type NodeChange,
  type Node,
  type Edge,
} from '@xyflow/react';
import {
  Ellipsis,
  RotateCcw,
  ExternalLink,
  Route,
  Settings2,
  ArrowUpRight,
  Focus,
  BookOpen,
  ArrowRightLeft,
  ListTree,
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Copy,
  History,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Pause,
  Play,
  ShieldCheck,
  Square,
  UserRound,
  Workflow,
  X,
  XCircle,
} from 'lucide-react';
import { TaskNavigation, type FocusRequest } from './TaskNavigation';
import { jobProgress, projectJobs } from '../domain/jobs';
import {
  carriesCurrent,
  nodeState,
  routeState,
  flowLabels,
  type FlowState,
} from './flow-visuals';
import { CurrentEdge } from './CurrentEdge';
import { BpmnSymbol } from './BpmnSymbol';
import { HumanForm } from './HumanForm';
import { parseField } from './decision-form';
import { canvasInsets } from './viewport';
import { FlowLegend } from './FlowLegend';
import { JobNode } from './JobNode';
import { Settings } from './Settings';
import { usePreferences } from './preferences';
import { layoutSteps } from './layout';
import type { Run, Step, StepStatus } from '../domain/workflow';

const labels: Record<StepStatus, string> = {
  blocked: 'En espera',
  ready: 'Espera al agente',
  running: 'En curso',
  waiting: 'Tu turno',
  completed: 'Completado',
  failed: 'Falló',
  rejected: 'Rechazado',
  skipped: 'Omitido',
};
const runLabels: Record<Run['status'], string> = {
  active: 'En progreso',
  paused: 'En pausa',
  completed: 'Completado',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
};
const kindLabels = {
  agent: 'Agente',
  manual: 'Intervención manual',
  approval: 'Aprobación',
  start: 'Inicio',
  end: 'Fin',
  gateway: 'Compuerta',
};
const eventLabels: Record<string, string> = {
  created: 'Plan registrado',
  route: 'Motor de proceso',
  start: 'Comenzó un paso',
  complete: 'Completó un paso',
  fail: 'Reportó un error',
  log: 'Registró actividad',
  approve: 'Aprobó un paso',
  reject: 'Rechazó un paso',
  submit: 'Envió una respuesta',
  retry: 'Solicitó un reintento',
  pause: 'Pausó el flujo',
  resume: 'Reanudó el flujo',
  cancel: 'Canceló el flujo',
};
const time = (value: string) =>
  new Date(value).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });
const clientLabels = new Map([
  ['codex', 'Codex'],
  ['claude', 'Claude'],
  ['cursor', 'Cursor'],
]);
const titleCase = (value: string) => clientLabels.get(value) || value;
function StatusIcon({
  status,
  size = 15,
}: {
  status: StepStatus;
  size?: number;
}) {
  if (status === 'completed') return <Check size={size} />;
  if (status === 'running')
    return <LoaderCircle size={size} className="spin" />;
  if (status === 'waiting') return <UserRound size={size} />;
  if (status === 'failed' || status === 'rejected')
    return <XCircle size={size} />;
  if (status === 'blocked') return <LockKeyhole size={size} />;
  return <Play size={size} />;
}
type StepView = 'step' | 'io' | 'trace';
const isControl = (step: Step) =>
  ['start', 'end', 'gateway'].includes(step.kind);
const gatewayLabels = {
  parallel: 'Paralela',
  exclusive: 'Exclusiva',
  inclusive: 'Inclusiva',
};
const traceLabels = {
  summary: 'Resumen de decisión',
  action: 'Acción',
  observation: 'Observación',
};
type StepNodeData = {
  step: Step;
  index: number;
  coordinator: string;
  jobTitle?: string;
  logActivity: number;
  ioActivity: number;
  logCount: number;
  contextCount: number;
  selected: boolean;
  horizontal: boolean;
  canRetry: boolean;
  onRetry: (id: string) => void;
  flowState: FlowState;
  onSelect: (id: string, view?: StepView) => void;
};
function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  const { step } = data;
  const tools = (
    <div className="node-tools">
      {step.status === 'failed' && (
        <button
          aria-label={`Reintentar: ${step.title}`}
          title="Reintentar paso"
          disabled={!data.canRetry}
          onClick={() => data.onRetry(step.id)}
        >
          <RotateCcw size={14} />
          <span>Reintentar</span>
        </button>
      )}

      <button
        aria-label={`Ver datos: ${step.title}`}
        title="Entradas, contexto y salidas"
        data-receiving={!!data.ioActivity}
        onClick={() => data.onSelect(step.id, 'io')}
        aria-haspopup="dialog"
      >
        <ArrowRightLeft size={13} />
        <span>
          I/O {(step.inputs?.length || 0) + data.contextCount}/
          {step.outputs?.length || 0}
        </span>
      </button>
      <button
        aria-label={`Ver trazas: ${step.title}`}
        title="Logs y trazas públicas"
        data-receiving={!!data.logActivity}
        onClick={() => data.onSelect(step.id, 'trace')}
        aria-haspopup="dialog"
      >
        <ListTree size={14} />
        <span>Logs {data.logCount || ''}</span>
      </button>
    </div>
  );
  return (
    <>
      {step.kind !== 'start' && (
        <Handle
          type="target"
          position={data.horizontal ? Position.Left : Position.Top}
        />
      )}
      {isControl(step) ? (
        <div
          className={`control-node flow-node ${step.status}`}
          data-flow-state={data.flowState}
        >
          <button
            className="control-main"
            aria-label={`Ver paso: ${step.title}`}
            aria-haspopup="dialog"
            onClick={() => data.onSelect(step.id)}
          >
            {step.kind !== 'gateway' && (
              <span className="event-label">
                {step.kind === 'start' ? 'INICIO' : 'FIN'}
              </span>
            )}
            <BpmnSymbol
              kind={
                step.gateway?.type || (step.kind === 'start' ? 'start' : 'end')
              }
            />
            <strong>{step.title}</strong>
            <small>
              {step.gateway
                ? `${gatewayLabels[step.gateway.type]} · ${step.gateway.direction === 'split' ? 'dividir' : 'unir'}`
                : flowLabels[data.flowState]}
            </small>
          </button>
          {tools}
        </div>
      ) : (
        <div
          className={`step-node flow-node ${step.status} ${data.selected ? 'selected' : ''}`}
          data-flow-state={data.flowState}
        >
          <button
            className="node-main"
            aria-label={`Ver paso: ${step.title}`}
            aria-haspopup="dialog"
            onClick={() => data.onSelect(step.id)}
          >
            <div className="node-top">
              <span className="node-identity">
                <span className="node-kind-icon">
                  {step.kind === 'agent' ? (
                    <HarnessIcon name={data.coordinator} />
                  ) : step.kind === 'approval' ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <UserRound size={17} />
                  )}
                </span>
                <span className="node-number">
                  {String(data.index + 1).padStart(2, '0')}
                </span>
              </span>
              <span className={`status-tag ${step.status}`}>
                {data.flowState === 'paused' ? (
                  <Pause size={13} />
                ) : data.flowState === 'stopped' ? (
                  <Square size={13} />
                ) : (
                  <StatusIcon status={step.status} />
                )}
                {data.flowState === 'error'
                  ? labels[step.status]
                  : flowLabels[data.flowState]}
              </span>
            </div>
            {(data.jobTitle || step.phase) && (
              <span className="node-phase">{data.jobTitle || step.phase}</span>
            )}
            <strong>{step.title}</strong>
            <div className="node-owner">
              {step.kind === 'agent' ? (
                <span className="muted">Agente</span>
              ) : (
                'Tú'
              )}
              <ArrowUpRight size={13} />
            </div>
          </button>
          {tools}
        </div>
      )}
      {step.kind !== 'end' && (
        <Handle
          type="source"
          position={data.horizontal ? Position.Right : Position.Bottom}
        />
      )}
    </>
  );
}
function ContractView({ step, run }: { step: Step; run: Run }) {
  const context = contextForStep(run, step);
  return (
    <div className="step-detail contract-view">
      <h2 id="popup-title">Entradas y salidas</h2>
      <p className="muted">{step.title}</p>
      <section className="context-sources">
        <h3>Contexto disponible</h3>
        {context.request && (
          <details>
            <summary>Petición original</summary>
            <p>{context.request}</p>
          </details>
        )}
        {!!Object.keys(context.general).length && (
          <details>
            <summary>Contexto del proceso</summary>
            <pre>{JSON.stringify(context.general, null, 2)}</pre>
          </details>
        )}
        {context.previous.map((previous) => (
          <details key={previous.stepId}>
            <summary>{previous.title}</summary>
            {previous.result && <p>{previous.result}</p>}
            {!!Object.keys(previous.outputs).length && (
              <pre>{JSON.stringify(previous.outputs, null, 2)}</pre>
            )}
          </details>
        ))}
        {!context.request &&
          !Object.keys(context.general).length &&
          !context.previous.length && (
            <p className="muted">Aún no hay resultados anteriores.</p>
          )}
      </section>
      {(['inputs', 'outputs'] as const).map((direction) => (
        <section key={direction}>
          <h3>
            {direction === 'inputs' ? 'Inputs · Entradas' : 'Outputs · Salidas'}
          </h3>
          {!(step[direction] || []).length ? (
            <p className="muted">Sin campos declarados.</p>
          ) : (
            (step[direction] || []).map((port) => {
              const source =
                direction === 'inputs'
                  ? step.inputs?.find((input) => input.name === port.name)
                      ?.source
                  : undefined;
              const values =
                direction === 'inputs' ? step.inputValues : step.outputValues;
              const present = values && Object.hasOwn(values, port.name);
              return (
                <article key={port.name} className="port">
                  <div>
                    <strong>
                      {port.form?.label || port.description || port.name}
                    </strong>
                    <code>
                      {port.name} · {port.type}
                    </code>
                    <span>{port.required ? 'Obligatorio' : 'Opcional'}</span>
                  </div>
                  {port.description && port.form?.label && (
                    <p>{port.description}</p>
                  )}
                  <small>
                    {source
                      ? `Origen: ${source.stepId}.${source.output}`
                      : direction === 'inputs'
                        ? step.inputs?.find((input) => input.name === port.name)
                            ?.contextKey
                          ? `Origen: contexto del proceso · ${step.inputs?.find((input) => input.name === port.name)?.contextKey}`
                          : 'Origen: valor del plan'
                        : 'Origen: resultado de la tarea'}
                  </small>
                  <pre>
                    {present
                      ? JSON.stringify(values[port.name], null, 2)
                      : 'Sin valor registrado'}
                  </pre>
                </article>
              );
            })
          )}
        </section>
      ))}
    </div>
  );
}
function TraceView({ step, run }: { step: Step; run: Run }) {
  const [scope, setScope] = useState('step');
  const events = [...run.events]
    .filter((e) => scope === 'all' || e.stepId === step.id)
    .reverse();
  return (
    <div className="step-detail trace-view">
      <h2 id="popup-title">Trazas del paso</h2>
      <p>{step.title}</p>
      <label className="trace-scope">
        Mostrar{' '}
        <select
          aria-label="Alcance de logs"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="step">Este paso</option>
          <option value="all">Todo el proceso</option>
        </select>
      </label>
      <p className="muted">
        Resumen público → acción → observación. Se muestra lo que el agente o el
        motor registra.
      </p>
      {step.result && isControl(step) && (
        <div className="result">
          <p>{step.result}</p>
        </div>
      )}
      {events.length ? (
        events.map((event) => (
          <article className="trace-event" key={event.sequence}>
            <div>
              <strong>
                {event.trace
                  ? traceLabels[event.trace.kind]
                  : eventLabels[event.type] || event.type}
              </strong>
              <small>
                <HarnessIcon name={event.actor} /> · {time(event.at)}
              </small>
            </div>
            {event.trace?.tool && <code>{event.trace.tool}</code>}
            <p>{event.message || 'Cambio de estado registrado'}</p>
          </article>
        ))
      ) : (
        <p className="muted">Todavía no hay trazas registradas.</p>
      )}
    </div>
  );
}
const edgeTypes = { current: CurrentEdge };
const nodeTypes = { step: StepNode, job: JobNode };
function FitCanvas({ view }: { view: string }) {
  const { getNodes, getInternalNode, setViewport } = useReactFlow();
  const initialized = useStore(
    (state) =>
      state.nodeLookup.size > 0 &&
      Array.from(state.nodeLookup.values()).every((node) =>
        Boolean(node.measured?.width && node.measured?.height),
      ),
  );
  const fittedSize = useRef('');
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  useEffect(() => {
    const size = `${view}:${width}:${height}`;
    if (initialized && fittedSize.current !== size) {
      fittedSize.current = size;
      const bounds = getNodesBounds(
        getNodes().map((node) => getInternalNode(node.id)!),
      );
      const viewport = getViewportForBounds(
        bounds,
        width - canvasInsets.side * 2,
        Math.max(100, height - canvasInsets.top - canvasInsets.bottom),
        0.15,
        1,
        0.12,
      );
      void setViewport({
        ...viewport,
        x: viewport.x + canvasInsets.side,
        y: viewport.y + canvasInsets.top,
      });
    }
  }, [
    getNodes,
    getInternalNode,
    setViewport,
    initialized,
    width,
    height,
    view,
  ]);
  return null;
}
async function api<T>(path: string, data?: unknown): Promise<T> {
  const res = await fetch(path, {
    ...(data
      ? {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'content-type': 'application/json' },
        }
      : {}),
    signal: AbortSignal.timeout(8000),
  });
  const body = await res.json();
  if (!res.ok) {
    const messages: Record<string, string> = {
      REVISION_CONFLICT:
        'El flujo cambió mientras decidías. Revisa el estado actualizado y vuelve a intentarlo.',
      PAUSED: 'El flujo está en pausa.',
      TERMINAL: 'Este flujo ya terminó.',
      FORBIDDEN: 'Esta acción corresponde a otro participante.',
      EVIDENCE_REQUIRED: 'Escribe una respuesta antes de continuar.',
    };
    throw new Error(
      messages[body.error] ||
        body.message ||
        'No se pudo completar la solicitud.',
    );
  }
  return body as T;
}
function Modal({
  children,
  onClose,
  returnFocus,
}: {
  returnFocus?: HTMLElement | null;
  children: ReactNode;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous =
      returnFocus || (document.activeElement as HTMLElement | null);
    root.current?.querySelector<HTMLElement>('button,textarea')?.focus();
    return () => {
      // React Flow remeasures changed nodes on the next frame. Restore focus
      // after those nodes become visible again, and after inert is removed.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (previous?.isConnected) previous.focus({ preventScroll: true });
        }),
      );
    };
  }, []);
  return (
    <div
      ref={root}
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
        if (event.key !== 'Tab') return;
        const items = Array.from(
          root.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),textarea,select,input,a[href],[tabindex="0"]',
          ) || [],
        );
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      {children}
    </div>
  );
}
export function App() {
  const [preferences, setPreferences] = usePreferences();
  const [notice, setNotice] = useState('');
  const popupTrigger = useRef<HTMLElement | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState(
    new URLSearchParams(location.search).get('run') || '',
  );
  const [stepId, setStepId] = useState('');
  const [following, setFollowing] = useState(false);
  const [focusedStepId, setFocusedStepId] = useState('');
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const focusNonce = useRef(0);
  const [popup, setPopup] = useState<
    | StepView
    | 'activity'
    | 'request'
    | 'runs'
    | 'guide'
    | 'settings'
    | 'legend'
    | 'options'
    | null
  >(null);
  useLayoutEffect(() => {
    if (popup && document.activeElement === document.body)
      document.querySelector<HTMLButtonElement>('.modal-close')?.focus();
  }, [popup]);
  const [online, setOnline] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamConnected = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [outputDraft, setOutputDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmation, setConfirmation] = useState<'cancel' | 'reject' | null>(
    null,
  );
  const run = runId ? runs.find((r) => r.id === runId) : runs[0];
  const activity = useReceiptActivity(run);
  useEffect(() => {
    setFollowing(preferences.follow);
    setNotice('');
    setFocusedStepId('');
    setFocusRequest(null);
  }, [run?.id, preferences.follow]);
  const step =
    run?.steps.find((s) => s.id === stepId) ||
    run?.steps.find((s) => s.status === 'waiting') ||
    run?.steps.find((s) => s.status === 'running' || s.status === 'ready') ||
    run?.steps[0];
  const refresh = useCallback(async () => {
    try {
      const data = await api<Run[]>('/api/runs');
      if (runId && !data.some((item) => item.id === runId)) {
        const requested = await fetch(
          `/api/runs/${encodeURIComponent(runId)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (requested.ok) data.unshift((await requested.json()) as Run);
        else if (requested.status !== 404)
          throw new Error('Unable to read selected run');
      }
      setRuns((previous) => mergeRuns(previous, data));
      setOnline(true);
      setLoaded(true);
    } catch {
      setOnline(streamConnected.current);
      setLoaded(true);
    }
  }, [runId]);
  useEffect(() => {
    let active = true;
    let events: EventSource | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await refresh();
      if (active) timer = setTimeout(tick, 1000);
    };
    const connect = () => {
      events?.close();
      if (!active) return;
      events = new EventSource('/api/events');
      events.onopen = () => {
        streamConnected.current = true;
      };
      const receive = (event: MessageEvent, snapshot: boolean) => {
        if (!active) return;
        try {
          const value = JSON.parse(event.data);
          setRuns((previous) =>
            mergeRuns(previous, snapshot ? value : [value]),
          );
          setOnline(true);
          setStreaming(true);
          setLoaded(true);
        } catch {
          setStreaming(false);
        }
      };
      events.addEventListener('snapshot', (e) =>
        receive(e as MessageEvent, true),
      );
      events.addEventListener('run', (e) => receive(e as MessageEvent, false));
      events.onerror = () => {
        if (active) {
          streamConnected.current = false;
          setStreaming(false);
        }
      };
    };
    const disconnect = () => {
      events?.close();
      streamConnected.current = false;
      setOnline(false);
      setStreaming(false);
    };
    window.addEventListener('offline', disconnect);
    window.addEventListener('online', connect);
    void api('/api/session')
      .then(() => {
        if (!active) return;
        connect();
        void tick();
      })
      .catch(() => {
        setLoaded(true);
        setOnline(false);
      });
    return () => {
      active = false;
      window.removeEventListener('offline', disconnect);
      window.removeEventListener('online', connect);
      events?.close();
      streamConnected.current = false;
      clearTimeout(timer);
    };
  }, [refresh]);
  useEffect(() => {
    setAnswer('');
    setOutputDraft({});
    setError('');
    setConfirmation(null);
  }, [step?.id, run?.id]);
  const selectRun = (id: string) => {
    setRunId(id);
    setStepId('');
    setPopup(null);
    history.replaceState(null, '', id ? `/?run=${id}` : '/');
  };
  const selectStep = useCallback((id: string, view: StepView = 'step') => {
    setStepId(id);
    setPopup(view);
  }, []);
  // Controlled nodes must retain React Flow's measurements between snapshots.
  // Dropping them invalidates handles and unmounts every connected edge.
  const measurementKey = `${run?.id}:${preferences.view}:${preferences.orientation}`;
  const [measurements, setMeasurements] = useState<{
    key: string;
    nodes: Record<string, { width: number; height: number }>;
  }>({ key: '', nodes: {} });
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setMeasurements((previous) => {
        let next = previous.key === measurementKey ? previous.nodes : {};
        for (const change of changes) {
          if (change.type !== 'dimensions' || !change.dimensions) continue;
          const measured = next[change.id];
          if (
            measured?.width === change.dimensions.width &&
            measured?.height === change.dimensions.height
          )
            continue;
          next = { ...next, [change.id]: change.dimensions };
        }
        return next === previous.nodes
          ? previous
          : { key: measurementKey, nodes: next };
      });
    },
    [measurementKey],
  );
  const graph = useMemo(() => {
    if (!run) return { nodes: [], edges: [] };
    const collapsed = preferences.view === 'jobs' && !!run.jobs?.length;
    const displayed = collapsed ? projectJobs(run) : run.steps;
    const positions = layoutSteps(
      displayed,
      !collapsed,
      preferences.orientation,
    );
    const nodes: Node[] = displayed.map((item, index) => {
      const measured =
        measurements.key === measurementKey
          ? measurements.nodes[item.id]
          : undefined;
      if (item.id.startsWith('job:')) {
        const id = item.id.slice(4);
        const progress = jobProgress(run, id);
        return {
          id: item.id,
          type: 'job',
          measured,
          position: positions[item.id]!,
          draggable: false,
          focusable: false,
          data: {
            title: item.title,
            horizontal: preferences.orientation === 'horizontal',
            ...progress,
            flowState: nodeState(progress, run.status),
            statusLabel: flowLabels[nodeState(progress, run.status)],
            onExpand: () => {
              setPreferences((p) => ({ ...p, view: 'steps' }));
              setFollowing(false);
              const child =
                progress.steps.find((s) =>
                  ['waiting', 'running', 'ready', 'failed'].includes(s.status),
                ) || progress.steps[0];
              if (child)
                setFocusRequest({ id: child.id, nonce: ++focusNonce.current });
            },
          },
        };
      }
      return {
        id: item.id,
        type: 'step',
        measured,
        position: positions[item.id]!,
        data: {
          step: item,
          logActivity:
            online && !preferences.reduceMotion
              ? activity.logs[item.id] || 0
              : 0,
          ioActivity:
            online && !preferences.reduceMotion ? activity.io[item.id] || 0 : 0,
          logCount: run.events.filter((e) => e.stepId === item.id).length,
          contextCount: (() => {
            const c = contextForStep(run, item);
            return (
              Number(!!c.request) +
              Object.keys(c.general).length +
              c.previous.length
            );
          })(),
          horizontal: preferences.orientation === 'horizontal',
          canRetry: online && run.status === 'active' && !busy,
          onRetry: (id: string) => void act('retry', id),
          flowState: nodeState(item, run.status),
          index,
          coordinator: run.coordinator,
          jobTitle: run.jobs?.find((j) => j.id === item.jobId)?.title,
          selected:
            focusedStepId === item.id ||
            (['step', 'io', 'trace'].includes(popup || '') &&
              step?.id === item.id),
          onSelect: selectStep,
        },
        draggable: false,
        focusable: false,
      };
    });
    const edges: Edge[] = displayed.flatMap((item) =>
      item.dependencies.map((id) => {
        const state = routeState(run, id, item.id);
        const color = `var(--route-${state})`;
        return {
          id: `${id}-${item.id}`,
          source: id,
          target: item.id,
          type: 'current',
          data: {
            state,
            current: carriesCurrent(
              state,
              run.status,
              online,
              preferences.reduceMotion,
            ),
          },
          className: `route-${state}`,
          ariaLabel: `${displayed.find((s) => s.id === id)?.title} → ${item.title}: ${flowLabels[state]}`,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color,
          },
          label: routeLabel(
            run,
            run.steps.find((s) => s.id === id),
            item.id,
          ),
          labelStyle: { fontSize: 11, fill: '#655e50' },
          labelBgStyle: { fill: '#f7f5ef', fillOpacity: 0.95 },
          animated: carriesCurrent(
            state,
            run.status,
            online,
            preferences.reduceMotion,
          ),
          style: {
            stroke: color,
            strokeWidth: state === 'pending' || state === 'skipped' ? 1.5 : 2.2,
          },
        };
      }),
    );
    return { nodes, edges };
  }, [
    run,
    activity,
    measurements,
    measurementKey,
    step?.id,
    selectStep,
    popup,
    focusedStepId,
    preferences.view,
    preferences.orientation,
    busy,
    preferences.reduceMotion,
    online,
  ]);
  async function act(type: string, target?: string) {
    if (!run || busy) return;
    setBusy(true);
    setError('');
    try {
      const outputs =
        step && ['submit', 'approve'].includes(type) && step.outputs?.length
          ? Object.fromEntries(
              step.outputs
                .filter((port) => !!outputDraft[port.name]?.trim())
                .map((port) => {
                  const raw = outputDraft[port.name]!;
                  return [port.name, parseField(port, raw)];
                }),
            )
          : undefined;
      const updated = await api<Run>(`/api/runs/${run.id}/commands`, {
        type,
        ...(outputs ? { outputs } : {}),
        ...(target ? { stepId: target } : {}),
        ...(answer.trim() ? { message: answer.trim() } : {}),
        commandId: crypto.randomUUID(),
        expectedRevision: run.revision,
      });
      setAnswer('');
      if (['submit', 'approve'].includes(type))
        setNotice(
          updated.status === 'completed'
            ? 'Elección guardada. El proceso terminó.'
            : updated.steps.some((s) => s.status === 'ready')
              ? 'Elección guardada. El siguiente paso espera al agente. Copia la continuación y envíala en tu chat.'
              : 'Elección guardada. Sigue el estado de la siguiente tarea en el canvas.',
        );
      if (type === 'retry')
        setNotice(
          `Reintento habilitado. Pide a ${titleCase(run.coordinator)} continuar desde el chat. La ejecución aún no ha empezado.`,
        );
      setConfirmation(null);
      if (['submit', 'approve', 'reject', 'cancel', 'retry'].includes(type))
        setPopup(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(
        run
          ? `Continúa el flujo de Hyperion ${run.id}. Lee su estado y mi respuesta; ejecuta solo los pasos habilitados y registra resultados reales.`
          : 'Quiero usar Hyperion. Pregúntame qué actividad quiero realizar y crea el flujo desde mi respuesta.',
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        'No se pudo copiar. Puedes seleccionar y copiar el ID del flujo.',
      );
    }
  }
  const completed =
    run?.steps.filter((s) => s.status === 'completed').length || 0;
  const skipped = run?.steps.filter((s) => s.status === 'skipped').length || 0;
  const running = run?.steps.filter((s) => s.status === 'running').length || 0;
  const waiting = run?.steps.filter((s) => s.status === 'waiting').length || 0;
  const ready = run?.steps.filter((s) => s.status === 'ready').length || 0;
  const live = run?.status === 'active';
  const blockedReason = step?.dependencies
    .filter((id) => run?.steps.find((s) => s.id === id)?.status !== 'completed')
    .map((id) => run?.steps.find((s) => s.id === id)?.title)
    .join(', ');

  const openPanel = (panel: typeof popup) => {
    setPopup(panel);
  };
  const openWindow = () => {
    const detached = window.open(
      location.href,
      'hyperion-workspace',
      'popup=yes,width=1200,height=820',
    );
    if (!detached) {
      setError(
        'El navegador bloqueó la ventana. Permite abrir ventanas para Hyperion y vuelve a intentarlo.',
      );
      return;
    }
    detached.opener = null;
    setPopup(null);
  };
  const runTools = run && (
    <div className="canvas-tools">
      <div className="canvas-tools-group">
        <button
          className="secondary"
          aria-haspopup="dialog"
          onClick={() => openPanel('request')}
        >
          <MessageSquareText size={15} />
          Petición original
        </button>
        <button
          className="secondary"
          data-receiving={
            online && !preferences.reduceMotion && !!activity.process
          }
          aria-haspopup="dialog"
          onClick={() => openPanel('activity')}
        >
          <History size={15} />
          Actividad
        </button>
      </div>
      <div className="canvas-tools-group">
        {!!run.jobs?.length && (
          <button
            className="secondary"
            onClick={() =>
              setPreferences((p) => ({
                ...p,
                view: p.view === 'steps' ? 'jobs' : 'steps',
              }))
            }
          >
            <Layers3 size={15} />
            {preferences.view === 'steps' ? 'Ver trabajos' : 'Ver pasos'}
          </button>
        )}
        <button className="secondary continue-button" onClick={copyPrompt}>
          <Copy size={15} />
          {copied ? 'Pega la petición en tu chat' : 'Copiar continuación'}
        </button>
        {(live || run.status === 'paused') && (
          <>
            <button
              className="secondary"
              disabled={busy || !online}
              onClick={() => void act(live ? 'pause' : 'resume')}
            >
              {live ? <Pause size={14} /> : <Play size={14} />}
              {live ? 'Pausar' : 'Reanudar'}
            </button>
            <button
              className="secondary icon-button"
              aria-label="Cancelar flujo"
              aria-haspopup="dialog"
              disabled={busy || !online}
              onClick={() => setConfirmation('cancel')}
            >
              <Square size={14} />
              <span className="options-only">Cancelar flujo</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
  const dialogOpen = Boolean(popup || help || confirmation);
  return (
    <div className="app-shell canvas-app" data-connected={online}>
      <div
        className="canvas-shell"
        inert={dialogOpen}
        onClickCapture={(event) => {
          const button = (event.target as HTMLElement).closest('button');
          if (button) popupTrigger.current = button;
        }}
      >
        <header className="topbar canvas-topbar">
          <div className="canvas-identity">
            <a className="brand" href="/" aria-label="Hyperion, inicio">
              <span className="brand-mark">
                <svg
                  viewBox="0 0 40 40"
                  width="32"
                  height="32"
                  aria-hidden="true"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M20 2v7m0 22v7M2 20h7m22 0h7M7 7l5 5m16 16 5 5M7 33l5-5m16-16 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 15v10m8-10v10m-8-5h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <span className="brand-word">hyperion</span>
            </a>
            <button
              className="secondary flows-button"
              aria-label="Mis flujos"
              title="Mis flujos"
              aria-haspopup="dialog"
              onClick={() => setPopup('runs')}
            >
              <Workflow size={15} />
              <span className="flows-label">Mis flujos</span>
            </button>
            {run && (
              <div className="canvas-title">
                <h1 title={run.title}>{run.title}</h1>
                <span
                  className={`run-status ${run.status}`}
                  data-testid="run-status"
                >
                  <span className="tiny-dot" />
                  {runLabels[run.status]}
                </span>
              </div>
            )}
          </div>
          <div className="topbar-right">
            <button
              className="icon-button more-options"
              aria-label="Más opciones"
              title="Más opciones"
              aria-haspopup="dialog"
              onClick={() => setPopup('options')}
            >
              <Ellipsis size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Ajustes"
              aria-haspopup="dialog"
              onClick={() => setPopup('settings')}
            >
              <Settings2 size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Guía de uso"
              aria-haspopup="dialog"
              onClick={() => setPopup('guide')}
            >
              <BookOpen size={18} />
            </button>
            <span
              className={`connection ${online ? 'online' : ''}`}
              title={streaming ? 'Eventos en directo' : 'Consultando conexión'}
            >
              <span />
              {online ? 'Conectado' : loaded ? 'Sin conexión' : 'Conectando'}
            </span>
            <button
              className="icon-button"
              aria-label="Ayuda de conexión"
              aria-haspopup="dialog"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </header>
        <main className="canvas-main">
          {!loaded ? (
            <div className="empty-state">
              <LoaderCircle className="spin" />
              <h1>Cargando tu espacio…</h1>
            </div>
          ) : !run ? (
            <div className="empty-state">
              <span className="empty-symbol">
                <Workflow size={34} />
              </span>
              <span className="eyebrow">DE LA INTENCIÓN A LA ACCIÓN</span>
              <h1>
                {runId
                  ? 'No encontramos ese flujo'
                  : 'Tu trabajo, paso a paso.'}
              </h1>
              <p>
                {runId
                  ? 'Comprueba el enlace o vuelve a tus flujos recientes.'
                  : 'Conecta tu herramienta de IA y transforma una petición en un proceso que puedes ver, guiar y aprobar.'}
              </p>
              <button
                className="primary"
                onClick={() => (runId ? selectRun('') : setHelp(true))}
              >
                {runId ? 'Ver mis flujos' : 'Conectar mi agente'}{' '}
                <ArrowUpRight size={16} />
              </button>
              {!online && (
                <p role="alert">
                  No pudimos conectar con Hyperion. Comprueba que el servidor
                  está activo.
                </p>
              )}
            </div>
          ) : (
            <section
              className="canvas-workspace"
              aria-label="Canvas del workflow"
            >
              {runTools}
              <div className="graph">
                <ReactFlow
                  key={run.id}
                  nodes={graph.nodes}
                  onNodesChange={onNodesChange}
                  edges={graph.edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
                  minZoom={0.15}
                  maxZoom={1.5}
                  nodesConnectable={false}
                  nodesDraggable={false}
                  elementsSelectable
                  zoomOnDoubleClick={false}
                  onMoveStart={(event) => {
                    if (event) setFollowing(false);
                  }}
                >
                  <FitCanvas
                    view={`${preferences.view}:${preferences.orientation}`}
                  />
                  <Background color="#c6c0b2" gap={28} size={0.8} />
                  <TaskNavigation
                    orientation={preferences.orientation}
                    onOrientation={() =>
                      setPreferences((p) => ({
                        ...p,
                        orientation:
                          p.orientation === 'vertical'
                            ? 'horizontal'
                            : 'vertical',
                      }))
                    }
                    run={run}
                    view={`${preferences.view}:${preferences.orientation}`}
                    following={following}
                    onFollowing={setFollowing}
                    suspended={dialogOpen}
                    available={online}
                    request={focusRequest}
                    onSelect={selectStep}
                    onFocused={setFocusedStepId}
                  />
                </ReactFlow>
                {notice && !dialogOpen && (
                  <div className="canvas-notice" role="status">
                    <Check size={16} />
                    <span>{notice}</span>
                    <button
                      aria-label="Cerrar aviso"
                      onClick={() => setNotice('')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {error && !dialogOpen && (
                  <div role="alert" className="canvas-alert popup-error">
                    {error}
                    <button
                      aria-label="Cerrar error"
                      onClick={() => setError('')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {live && waiting > 0 && (
                  <button
                    className="canvas-next human"
                    onClick={() =>
                      selectStep(
                        run.steps.find((s) => s.status === 'waiting')!.id,
                      )
                    }
                    aria-haspopup="dialog"
                  >
                    <UserRound size={17} />
                    <span>
                      <strong>
                        Tu turno · {waiting} {waiting === 1 ? 'paso' : 'pasos'}
                      </strong>
                      Responder en el canvas
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                )}
                {live && !waiting && ready > 0 && (
                  <button className="canvas-next" onClick={copyPrompt}>
                    <HarnessIcon name={run.coordinator} />
                    <span>
                      <strong>Espera al agente</strong>
                      {copied
                        ? 'Pégala en tu chat para continuar'
                        : 'Copiar continuación para tu chat'}
                    </span>
                    <Copy size={15} />
                  </button>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
      {popup && !confirmation && !help && (
        <Modal
          returnFocus={popupTrigger.current}
          onClose={() => setPopup(null)}
        >
          <section
            className={`modal canvas-popup ${['step', 'activity', 'io', 'trace'].includes(popup || '') ? 'step-popup' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
          >
            <button
              className="modal-close icon-button"
              aria-label="Cerrar popup"
              onClick={() => setPopup(null)}
            >
              <X size={19} />
            </button>
            {error && (
              <p role="alert" className="popup-error">
                {error}
              </p>
            )}
            {['step', 'activity', 'io', 'trace'].includes(popup || '') &&
              run && (
                <>
                  <div className="inspector-tabs">
                    <button
                      className={popup === 'step' ? 'active' : ''}
                      onClick={() => setPopup('step')}
                    >
                      <Layers3 size={15} />
                      Detalle
                    </button>
                    <button
                      className={popup === 'activity' ? 'active' : ''}
                      onClick={() => setPopup('activity')}
                    >
                      <History size={15} />
                      Actividad
                    </button>
                    <button
                      className={popup === 'io' ? 'active' : ''}
                      onClick={() => setPopup('io')}
                    >
                      <ArrowRightLeft size={15} />
                      I/O
                    </button>
                    <button
                      className={popup === 'trace' ? 'active' : ''}
                      onClick={() => setPopup('trace')}
                    >
                      <ListTree size={15} />
                      Logs
                    </button>
                  </div>
                  {popup === 'io' && step ? (
                    <ContractView step={step} run={run} />
                  ) : popup === 'trace' && step ? (
                    <TraceView step={step} run={run} />
                  ) : popup === 'step' && step ? (
                    <div
                      className={`step-detail ${step.status === 'waiting' && live ? 'answering-step' : ''}`}
                    >
                      <div className="detail-eyebrow">
                        {step.jobId
                          ? `${run.jobs?.find((j) => j.id === step.jobId)?.title} · `
                          : ''}
                        PASO{' '}
                        {String(run.steps.indexOf(step) + 1).padStart(2, '0')}
                        <span className={`status-tag ${step.status}`}>
                          <StatusIcon status={step.status} />
                          {labels[step.status]}
                        </span>
                      </div>
                      <h2 id="popup-title">{step.title}</h2>
                      <button
                        className="text-button focus-detail"
                        onClick={() => {
                          setFollowing(false);
                          setFocusRequest({
                            id: step.id,
                            nonce: ++focusNonce.current,
                          });
                          setPopup(null);
                        }}
                      >
                        <Focus size={15} />
                        Enfocar tarea
                      </button>
                      {!step.interaction &&
                        !(step.status === 'waiting' && live) && (
                          <p className="step-description">
                            {step.description ||
                              (isControl(step)
                                ? 'El motor aplica este nodo automáticamente al cumplirse sus condiciones y dependencias.'
                                : step.kind === 'manual'
                                  ? 'Comparte la información que necesita el agente para avanzar.'
                                  : step.kind === 'approval'
                                    ? 'Revisa los resultados anteriores y decide si el proceso puede continuar.'
                                    : 'El agente ejecutará este paso y registrará su resultado aquí.')}
                          </p>
                        )}
                      {step.status === 'failed' && live && (
                        <button
                          className="secondary full"
                          disabled={busy || !online}
                          onClick={() => void act('retry', step.id)}
                        >
                          <RotateCcw size={16} /> Reintentar paso
                        </button>
                      )}
                      {step.status === 'waiting' && live && (
                        <HumanForm
                          key={step.id}
                          step={step}
                          answer={answer}
                          onAnswer={setAnswer}
                          values={outputDraft}
                          onValues={setOutputDraft}
                          busy={busy}
                          online={online}
                          onSubmit={() =>
                            void act(
                              step.kind === 'manual' ? 'submit' : 'approve',
                              step.id,
                            )
                          }
                          onReject={() => setConfirmation('reject')}
                        />
                      )}
                      <details
                        className="step-secondary"
                        open={!(step.status === 'waiting' && live)}
                      >
                        <summary>Detalles del paso</summary>
                        <dl className="step-meta">
                          <div>
                            <dt>Responsable</dt>
                            <dd>
                              {step.kind === 'agent' ? (
                                <HarnessIcon name={run.coordinator} />
                              ) : (
                                <UserRound size={14} />
                              )}{' '}
                              {isControl(step)
                                ? 'Hyperion'
                                : step.kind === 'agent'
                                  ? null
                                  : 'Tú'}
                            </dd>
                          </div>
                          <div>
                            <dt>Tipo de paso</dt>
                            <dd>{kindLabels[step.kind]}</dd>
                          </div>
                          {step.attempt > 0 && (
                            <div>
                              <dt>Intento</dt>
                              <dd>#{step.attempt}</dd>
                            </div>
                          )}
                        </dl>
                        {step.dependencies.length > 0 && (
                          <div className="dependencies">
                            <h3>Depende de</h3>
                            {step.dependencies.map((id) => {
                              const dependency = run.steps.find(
                                (s) => s.id === id,
                              )!;
                              return (
                                <button key={id} onClick={() => selectStep(id)}>
                                  <span
                                    className={`dependency-icon ${dependency.status}`}
                                  >
                                    <StatusIcon
                                      status={dependency.status}
                                      size={13}
                                    />
                                  </span>
                                  <span>{dependency.title}</span>
                                  <ChevronRight size={13} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {step.result && (
                          <div className="result">
                            <h3>
                              <CheckCheck size={15} />
                              {step.status === 'failed'
                                ? 'Error registrado'
                                : 'Resultado registrado'}
                            </h3>
                            <p>{step.result}</p>
                          </div>
                        )}
                        {step.status === 'blocked' && (
                          <div className="step-hint">
                            <LockKeyhole size={16} />
                            <p>
                              Este paso se habilitará cuando termine:{' '}
                              {blockedReason}.
                            </p>
                          </div>
                        )}
                        {step.status === 'running' && (
                          <div className="step-hint">
                            <LoaderCircle className="spin" size={17} />
                            <p>
                              El agente tiene este paso en curso. Puedes revisar
                              sus avances en Actividad.
                            </p>
                          </div>
                        )}
                        {step.status === 'ready' && live && (
                          <div className="step-hint">
                            <Bot size={17} />
                            <p>
                              El agente aún no ha retomado este paso.
                              <button
                                className="secondary"
                                onClick={copyPrompt}
                              >
                                {copied
                                  ? 'Pega la petición en tu chat'
                                  : 'Copiar continuación'}
                              </button>
                            </p>
                          </div>
                        )}
                        <div className="step-history">
                          <h3>Actividad de este paso</h3>
                          {run.events
                            .filter((e) => e.stepId === step.id)
                            .slice(-4)
                            .reverse()
                            .map((e) => (
                              <div key={e.sequence}>
                                <span className="history-dot" />
                                <p>
                                  <strong>
                                    {eventLabels[e.type] || e.type}
                                  </strong>
                                  <small>
                                    <HarnessIcon name={e.actor} /> ·{' '}
                                    {time(e.at)}
                                  </small>
                                  {e.message && <span>{e.message}</span>}
                                </p>
                              </div>
                            ))}
                          {!run.events.some((e) => e.stepId === step.id) && (
                            <p className="muted">
                              Todavía no hay actividad registrada.
                            </p>
                          )}
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="activity-list">
                      <h2 id="popup-title">Historial del flujo</h2>
                      <p className="muted">
                        {streaming
                          ? 'En directo · acciones y decisiones registradas'
                          : 'Actualización periódica · reconectando eventos'}
                      </p>
                      {[...run.events].reverse().map((e) => (
                        <article key={e.sequence}>
                          <span
                            className={`activity-symbol ${e.type === 'submit' || e.type === 'approve' ? 'human' : ''}`}
                          >
                            {['submit', 'approve', 'reject'].includes(
                              e.type,
                            ) ? (
                              <UserRound size={14} />
                            ) : (
                              <Bot size={14} />
                            )}
                          </span>
                          <div>
                            <strong>{eventLabels[e.type] || e.type}</strong>
                            <small>
                              <HarnessIcon name={e.actor} /> · {time(e.at)}
                            </small>
                            {e.stepId && (
                              <button onClick={() => selectStep(e.stepId!)}>
                                {
                                  run.steps.find((s) => s.id === e.stepId)
                                    ?.title
                                }
                              </button>
                            )}
                            {e.message && <p>{e.message}</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            {popup === 'options' && (
              <div className="options-panel">
                <span className="eyebrow">ESPACIO DE TRABAJO</span>
                <h2 id="popup-title">Más opciones</h2>
                {run && (
                  <p className="muted">
                    {completed}/{run.steps.length} completados · {running} en
                    curso{skipped > 0 ? ` · ${skipped} omitidos` : ''}
                  </p>
                )}
                {runTools}
                <div className="workspace-options">
                  <button onClick={() => openPanel('legend')}>
                    <Route size={17} />
                    Colores del flujo
                  </button>
                  <button onClick={() => openPanel('guide')}>
                    <BookOpen size={17} />
                    Guía de uso
                  </button>
                  <button
                    onClick={() => {
                      setPopup(null);
                      setHelp(true);
                    }}
                  >
                    <CircleHelp size={17} />
                    Ayuda de conexión
                  </button>
                  {!navigator.userAgent.includes('Electron/') && (
                    <button onClick={openWindow}>
                      <ExternalLink size={17} />
                      Abrir en ventana
                    </button>
                  )}
                </div>
                <p className="muted">
                  La ventana independiente mantiene este mismo flujo. Puedes
                  dejarla junto a tu chat.
                </p>
              </div>
            )}
            {popup === 'legend' && <FlowLegend />}
            {popup === 'settings' && (
              <Settings value={preferences} onChange={setPreferences} />
            )}
            {popup === 'guide' && (
              <div className="usage-guide">
                <span className="eyebrow">GUÍA DE USO</span>
                <h2 id="popup-title">De la conversación al flujo</h2>
                <ol>
                  <li>
                    <strong>Pide en tu chat</strong>
                    <span>
                      «Usa Hyperion para [actividad]». Tu agente crea el plan y
                      comparte el enlace.
                    </span>
                  </li>
                  <li>
                    <strong>Explora trabajos y pasos</strong>
                    <span>
                      En «Más opciones», «Ver trabajos» resume el plan. Pulsa un
                      trabajo para desplegar el detalle. «Ajustes» permite
                      elegir tema y navegación.
                    </span>
                  </li>
                  <li>
                    <strong>Enfoca una tarea</strong>
                    <span>
                      Elige en «Ir a tarea». Abre detalles, datos o logs desde
                      sus botones. «Vista general» muestra todo el flujo.
                    </span>
                  </li>
                  <li>
                    <strong>Sigue el avance</strong>
                    <span>
                      Activa «Seguir actividad». La vista avanza a la tarea que
                      requiere atención. Mover o ampliar el canvas vuelve a
                      vista libre.
                    </span>
                  </li>
                  <li>
                    <strong>Participa</strong>
                    <span>
                      En «Tu turno», lee la pregunta y guarda tu elección. I/O
                      muestra entradas y salidas; Logs muestra acciones y
                      resultados.
                    </span>
                  </li>
                  <li>
                    <strong>Continúa en tu chat</strong>
                    <span>
                      «Continuar en…» copia una petición. Pégala en el mismo
                      chat para que el agente retome el flujo.
                    </span>
                  </li>
                </ol>
                <p className="guide-note">
                  El seguimiento mueve la vista. La ejecución continúa en tu
                  herramienta de IA.
                </p>
              </div>
            )}
            {popup === 'request' && run && (
              <div className="request-popup">
                <span className="eyebrow">
                  <Bot size={16} />
                  Creado desde {titleCase(run.coordinator)}
                </span>
                <h2 id="popup-title">Petición original</h2>
                <p>
                  {run.request ||
                    'Este flujo anterior no conserva la petición original.'}
                </p>
                {run.description && (
                  <p className="request-description">{run.description}</p>
                )}
                <div className="code-note">ID del flujo: {run.id}</div>
                <p className="muted">
                  El agente registra los pasos desde tu petición. Cada nodo
                  mantiene sus instrucciones, resultados y acciones en este
                  canvas.
                </p>
              </div>
            )}
            {popup === 'runs' && (
              <>
                <h2 id="popup-title">Mis flujos</h2>
                <p>Elige el workflow que quieres abrir en el canvas.</p>
                <div className="popup-run-list">
                  {runs.map((item) => (
                    <button
                      className={run?.id === item.id ? 'selected' : ''}
                      key={item.id}
                      onClick={() => selectRun(item.id)}
                    >
                      <span className={`tiny-dot ${item.status}`} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {titleCase(item.coordinator)} ·{' '}
                          {runLabels[item.status]}
                        </small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                  {!runs.length && (
                    <p>
                      Tus flujos aparecerán aquí cuando tu agente los registre.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </Modal>
      )}
      {help && (
        <Modal
          returnFocus={popupTrigger.current}
          onClose={() => setHelp(false)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Cerrar ayuda"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <span className="empty-symbol">
              <Bot size={27} />
            </span>
            <h2 id="help-title">Tu agente, conectado a Hyperion.</h2>
            <p>
              Haz la petición en Codex, Claude, Cursor o tu herramienta
              conectada. El agente registra un plan y ejecuta sus tareas; tú
              respondes y apruebas aquí.
            </p>
            <ol>
              <li>
                <strong>Plantea tu objetivo</strong>
                <span>«Usa Hyperion para guiarme paso a paso…»</span>
              </li>
              <li>
                <strong>Participa desde el flujo</strong>
                <span>Selecciona los pasos que indiquen «Tu turno».</span>
              </li>
              <li>
                <strong>Continúa en el chat</strong>
                <span>
                  Tras responder, pide al agente que lea el estado y continúe.
                </span>
              </li>
            </ol>
            <div className="code-note">
              Escribe en tu chat: «Usa Hyperion para [tu actividad]». El agente
              conecta el canvas y crea el plan. Aquí no necesitas escribir
              comandos.
            </div>
            <p className="muted">
              Esta versión coordina a un agente externo. No inicia agentes ni
              conversaciones automáticamente.
            </p>
            <button className="primary full" onClick={copyPrompt}>
              <Copy size={16} />
              {copied ? 'Petición copiada' : 'Copiar petición para mi agente'}
            </button>
          </section>
        </Modal>
      )}
      {confirmation && (
        <Modal
          returnFocus={popupTrigger.current}
          onClose={() => setConfirmation(null)}
        >
          <section
            className="modal compact"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">
              {confirmation === 'cancel'
                ? 'Cancelar este flujo'
                : 'Rechazar este paso'}
            </h2>
            <p>
              El flujo quedará cerrado. Esta decisión no deshace acciones que el
              agente ya haya ejecutado.
            </p>
            {confirmation === 'reject' && (
              <>
                <label htmlFor="rejection-reason">Motivo del rechazo</label>
                <textarea
                  id="rejection-reason"
                  rows={3}
                  maxLength={8000}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </>
            )}
            {error && (
              <p role="alert" className="popup-error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => setConfirmation(null)}
              >
                Volver
              </button>
              <button
                className="danger"
                disabled={
                  busy ||
                  !online ||
                  (confirmation === 'reject' && !answer.trim())
                }
                onClick={() =>
                  void act(
                    confirmation,
                    confirmation === 'reject' ? step?.id : undefined,
                  )
                }
              >
                Confirmar{' '}
                {confirmation === 'cancel' ? 'cancelación' : 'rechazo'}
              </button>
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}
