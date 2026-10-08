import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useReactFlow,
  useStore,
  getNodesBounds,
  getViewportForBounds,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react';
import {
  ArrowUpRight,
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Copy,
  GitBranch,
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
import type { Run, Step, StepStatus } from '../domain/workflow';

const labels: Record<StepStatus, string> = {
  blocked: 'En espera',
  ready: 'Listo',
  running: 'En curso',
  waiting: 'Tu turno',
  completed: 'Completado',
  failed: 'Falló',
  rejected: 'Rechazado',
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
};
const eventLabels: Record<string, string> = {
  created: 'Plan registrado',
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
type StepNodeData = {
  step: Step;
  index: number;
  coordinator: string;
  selected: boolean;
  onSelect: (id: string) => void;
};
function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  const { step } = data;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <button
        className={`step-node ${step.status} ${data.selected ? 'selected' : ''}`}
        aria-label={`Ver paso: ${step.title}`}
        aria-haspopup="dialog"
        onClick={() => data.onSelect(step.id)}
      >
        <div className="node-top">
          <span className="node-number">
            {String(data.index + 1).padStart(2, '0')}
          </span>
          <span className={`status-tag ${step.status}`}>
            <StatusIcon status={step.status} />
            {labels[step.status]}
          </span>
        </div>
        <strong>{step.title}</strong>
        <div className="node-owner">
          {step.kind === 'agent' ? (
            <Bot size={14} />
          ) : step.kind === 'approval' ? (
            <ShieldCheck size={14} />
          ) : (
            <UserRound size={14} />
          )}{' '}
          {step.kind === 'agent' ? titleCase(data.coordinator) : 'Tú'}
          <span>· {kindLabels[step.kind]}</span>
        </div>
        <span className="node-action">
          {step.status === 'waiting'
            ? step.kind === 'approval'
              ? 'Revisar y aprobar'
              : 'Responder'
            : 'Abrir detalle'}{' '}
          <ArrowUpRight size={12} />
        </span>
      </button>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
const nodeTypes = { step: StepNode };
function FitCanvas() {
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
    const size = `${width}:${height}`;
    if (initialized && fittedSize.current !== size) {
      fittedSize.current = size;
      const bounds = getNodesBounds(
        getNodes().map((node) => getInternalNode(node.id)!),
      );
      void setViewport(
        getViewportForBounds(bounds, width, height, 0.15, 1, 0.12),
      );
    }
  }, [getNodes, getInternalNode, setViewport, initialized, width, height]);
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
            'button:not(:disabled),textarea,a[href],[tabindex="0"]',
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
  const popupTrigger = useRef<HTMLElement | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState(
    new URLSearchParams(location.search).get('run') || '',
  );
  const [stepId, setStepId] = useState('');
  const [popup, setPopup] = useState<
    'step' | 'activity' | 'request' | 'runs' | null
  >(null);
  const [online, setOnline] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmation, setConfirmation] = useState<'cancel' | 'reject' | null>(
    null,
  );
  const run = runId ? runs.find((r) => r.id === runId) : runs[0];
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
      setRuns(data);
      setOnline(true);
      setLoaded(true);
    } catch {
      setOnline(false);
      setLoaded(true);
    }
  }, [runId]);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await refresh();
      if (active) timer = setTimeout(tick, 1000);
    };
    void api('/api/session')
      .then(tick)
      .catch(() => {
        setLoaded(true);
        setOnline(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [refresh]);
  useEffect(() => {
    setAnswer('');
    setError('');
    setConfirmation(null);
  }, [step?.id, run?.id]);
  const selectRun = (id: string) => {
    setRunId(id);
    setStepId('');
    setPopup(null);
    history.replaceState(null, '', id ? `/?run=${id}` : '/');
  };
  const selectStep = useCallback((id: string) => {
    setStepId(id);
    setPopup('step');
  }, []);
  const graph = useMemo(() => {
    if (!run) return { nodes: [], edges: [] };
    const levels = new Map<string, number>();
    function level(id: string): number {
      if (levels.has(id)) return levels.get(id)!;
      const item = run!.steps.find((s) => s.id === id)!;
      const depth = item.dependencies.length
        ? Math.max(...item.dependencies.map(level)) + 1
        : 0;
      levels.set(id, depth);
      return depth;
    }
    run.steps.forEach((s) => level(s.id));
    const groups = new Map<number, Step[]>();
    for (const item of run.steps) {
      const depth = levels.get(item.id)!;
      groups.set(depth, [...(groups.get(depth) || []), item]);
    }
    const nodes: Node<StepNodeData>[] = run.steps.map((item, index) => {
      const depth = levels.get(item.id)!;
      const group = groups.get(depth)!;
      return {
        id: item.id,
        type: 'step',
        position: {
          x: (group.indexOf(item) - (group.length - 1) / 2) * 285 + 280,
          y: depth * 190,
        },
        data: {
          step: item,
          index,
          coordinator: run.coordinator,
          selected: popup === 'step' && step?.id === item.id,
          onSelect: selectStep,
        },
        draggable: false,
        focusable: false,
      };
    });
    const edges: Edge[] = run.steps.flatMap((item) =>
      item.dependencies.map((id) => ({
        id: `${id}-${item.id}`,
        source: id,
        target: item.id,
        type: 'smoothstep',
        animated: item.status === 'running',
        style: {
          stroke:
            run.steps.find((s) => s.id === id)?.status === 'completed'
              ? '#857af0'
              : '#d0d5df',
          strokeWidth: 1.8,
        },
      })),
    );
    return { nodes, edges };
  }, [run, step?.id, selectStep, popup]);
  async function act(type: string, target?: string) {
    if (!run || busy) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/runs/${run.id}/commands`, {
        type,
        ...(target ? { stepId: target } : {}),
        ...(answer.trim() ? { message: answer.trim() } : {}),
        commandId: crypto.randomUUID(),
        expectedRevision: run.revision,
      });
      setAnswer('');
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
          : 'Usa Hyperion para guiarme paso a paso. Crea un flujo con tareas automáticas, una tarea manual y una aprobación.',
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
  const running = run?.steps.filter((s) => s.status === 'running').length || 0;
  const waiting = run?.steps.filter((s) => s.status === 'waiting').length || 0;
  const ready = run?.steps.filter((s) => s.status === 'ready').length || 0;
  const live = run?.status === 'active';
  const blockedReason = step?.dependencies
    .filter((id) => run?.steps.find((s) => s.id === id)?.status !== 'completed')
    .map((id) => run?.steps.find((s) => s.id === id)?.title)
    .join(', ');

  const dialogOpen = Boolean(popup || help || confirmation);
  return (
    <div className="app-shell canvas-app">
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
                <GitBranch size={22} />
              </span>
              <span className="brand-word">hyperion</span>
            </a>
            <button
              className="secondary"
              aria-haspopup="dialog"
              onClick={() => setPopup('runs')}
            >
              <Workflow size={15} /> Mis flujos
            </button>
            {run && (
              <div className="canvas-title">
                <h1>{run.title}</h1>
                <span>
                  Creado desde {titleCase(run.coordinator)} ·{' '}
                  {run.id.slice(0, 8)}
                </span>
              </div>
            )}
          </div>
          <div className="topbar-right">
            <span className={`connection ${online ? 'online' : ''}`}>
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
              <div className="canvas-tools">
                <div className="canvas-tools-group">
                  <span
                    className={`run-status ${run.status}`}
                    data-testid="run-status"
                  >
                    <span className="tiny-dot" />
                    {runLabels[run.status]}
                  </span>
                  <button
                    className="secondary"
                    aria-haspopup="dialog"
                    onClick={() => setPopup('request')}
                  >
                    <MessageSquareText size={15} />
                    Petición original
                  </button>
                  <button
                    className="secondary"
                    aria-haspopup="dialog"
                    onClick={() => setPopup('activity')}
                  >
                    <History size={15} />
                    Actividad
                  </button>
                </div>
                <div className="canvas-tools-group">
                  <button
                    className="secondary continue-button"
                    onClick={copyPrompt}
                  >
                    <Copy size={15} />
                    {copied
                      ? 'Copiado'
                      : `Continuar en ${titleCase(run.coordinator)}`}
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
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="graph">
                <ReactFlow
                  key={run.id}
                  nodes={graph.nodes}
                  edges={graph.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
                  minZoom={0.15}
                  maxZoom={1.5}
                  nodesConnectable={false}
                  nodesDraggable={false}
                  elementsSelectable
                  zoomOnDoubleClick={false}
                >
                  <FitCanvas />
                  <Background color="#d3d5e4" gap={22} size={1.1} />
                  <Controls showInteractive={false} />
                </ReactFlow>
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
                    <Bot size={17} />
                    <span>
                      <strong>
                        Listo para que {titleCase(run.coordinator)} continúe
                      </strong>
                      {copied
                        ? 'Petición copiada'
                        : 'Copiar petición para volver al chat'}
                    </span>
                    <Copy size={15} />
                  </button>
                )}
              </div>
              <nav className="mobile-steps" aria-label="Pasos del flujo">
                {run.steps.map((item) => (
                  <button key={item.id} onClick={() => selectStep(item.id)}>
                    <StatusIcon status={item.status} />
                    {item.title}
                  </button>
                ))}
              </nav>
              <footer className="canvas-footer">
                <span>
                  <GitBranch size={14} />
                  Flujo vertical
                </span>
                <span>
                  {completed}/{run.steps.length} completados · {running} en
                  curso
                </span>
                <span className="canvas-tip">
                  Pulsa un nodo para ver información y acciones
                </span>
                <span className="canvas-coordinator">
                  <Bot size={14} />
                  {titleCase(run.coordinator)}
                </span>
              </footer>
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
            className={`modal canvas-popup ${popup === 'step' || popup === 'activity' ? 'step-popup' : ''}`}
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
            {(popup === 'step' || popup === 'activity') && run && (
              <>
                <div className="inspector-tabs">
                  <button
                    className={popup === 'step' ? 'active' : ''}
                    onClick={() => setPopup('step')}
                  >
                    <Layers3 size={15} />
                    Detalle del paso
                  </button>
                  <button
                    className={popup === 'activity' ? 'active' : ''}
                    onClick={() => setPopup('activity')}
                  >
                    <History size={15} />
                    Actividad
                  </button>
                </div>
                {popup === 'step' && step ? (
                  <div className="step-detail">
                    <div className="detail-eyebrow">
                      PASO{' '}
                      {String(run.steps.indexOf(step) + 1).padStart(2, '0')}
                      <span className={`status-tag ${step.status}`}>
                        <StatusIcon status={step.status} />
                        {labels[step.status]}
                      </span>
                    </div>
                    <h2 id="popup-title">{step.title}</h2>
                    <p className="step-description">
                      {step.description ||
                        (step.kind === 'manual'
                          ? 'Comparte la información que necesita el agente para avanzar.'
                          : step.kind === 'approval'
                            ? 'Revisa los resultados anteriores y decide si el proceso puede continuar.'
                            : 'El agente ejecutará este paso y registrará su resultado aquí.')}
                    </p>
                    <dl className="step-meta">
                      <div>
                        <dt>Responsable</dt>
                        <dd>
                          {step.kind === 'agent' ? (
                            <Bot size={14} />
                          ) : (
                            <UserRound size={14} />
                          )}{' '}
                          {step.kind === 'agent'
                            ? titleCase(run.coordinator)
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
                          El agente tiene este paso en curso. Puedes revisar sus
                          avances en Actividad.
                        </p>
                      </div>
                    )}
                    {step.status === 'ready' && live && (
                      <div className="step-hint">
                        <Bot size={17} />
                        <p>
                          El paso está habilitado. Pide a{' '}
                          {titleCase(run.coordinator)} que continúe desde el
                          chat.
                        </p>
                      </div>
                    )}
                    {step.status === 'waiting' && live && (
                      <div className="human-action">
                        <div className="action-title">
                          {step.kind === 'manual' ? (
                            <MessageSquareText size={18} />
                          ) : (
                            <ShieldCheck size={18} />
                          )}
                          <strong>
                            {step.kind === 'manual'
                              ? 'Comparte tu respuesta'
                              : 'Tu aprobación es necesaria'}
                          </strong>
                        </div>
                        <label htmlFor="human-answer">
                          {step.kind === 'manual'
                            ? 'Tu respuesta'
                            : 'Comentario (opcional al aprobar)'}
                        </label>
                        <textarea
                          id="human-answer"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          maxLength={8000}
                          rows={4}
                          placeholder={
                            step.kind === 'manual'
                              ? 'Escribe aquí lo que quieres conseguir…'
                              : 'Añade contexto a tu decisión…'
                          }
                        />
                        <button
                          className="primary full"
                          disabled={
                            busy ||
                            !online ||
                            (step.kind === 'manual' && !answer.trim())
                          }
                          onClick={() =>
                            void act(
                              step.kind === 'manual' ? 'submit' : 'approve',
                              step.id,
                            )
                          }
                        >
                          {busy ? (
                            <LoaderCircle className="spin" size={16} />
                          ) : (
                            <Check size={16} />
                          )}{' '}
                          {step.kind === 'manual'
                            ? 'Enviar respuesta'
                            : 'Aprobar paso'}
                        </button>
                        {step.kind === 'approval' && (
                          <button
                            className="text-button reject"
                            disabled={busy || !online}
                            onClick={() => setConfirmation('reject')}
                          >
                            Rechazar y detener este flujo
                          </button>
                        )}
                        <small>
                          Tu decisión quedará en el historial del proceso.
                        </small>
                      </div>
                    )}
                    {step.status === 'failed' && live && (
                      <button
                        className="secondary full"
                        disabled={busy || !online}
                        onClick={() => void act('retry', step.id)}
                      >
                        Habilitar otro intento
                      </button>
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
                              <strong>{eventLabels[e.type] || e.type}</strong>
                              <small>
                                {e.actor} · {time(e.at)}
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
                  </div>
                ) : (
                  <div className="activity-list">
                    <h2 id="popup-title">Historial del flujo</h2>
                    <p className="muted">Decisiones y acciones observables.</p>
                    {[...run.events].reverse().map((e) => (
                      <article key={e.sequence}>
                        <span
                          className={`activity-symbol ${e.type === 'submit' || e.type === 'approve' ? 'human' : ''}`}
                        >
                          {['submit', 'approve', 'reject'].includes(e.type) ? (
                            <UserRound size={14} />
                          ) : (
                            <Bot size={14} />
                          )}
                        </span>
                        <div>
                          <strong>{eventLabels[e.type] || e.type}</strong>
                          <small>
                            {e.actor} · {time(e.at)}
                          </small>
                          {e.stepId && (
                            <button onClick={() => selectStep(e.stepId!)}>
                              {run.steps.find((s) => s.id === e.stepId)?.title}
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
              CLI: npm run hyperion -- --help
              <br />
              Codex, Claude, Cursor: consulta docs/manual-uso.md
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
