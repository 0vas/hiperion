import { useCallback, useEffect, useState } from 'react';
import { t, useLocale } from './i18n';

export type ConnectionStatusId =
  'configured' | 'missing' | 'conflict' | 'unknown';

export type ConnectionRow = {
  id: string;
  name: string;
  status: ConnectionStatusId;
  path?: string;
  detail?: string;
};

export type ConnectionInventory = {
  version: string;
  channel: string;
  serviceUrl: string;
  integrations: ConnectionRow[];
  summary: { configured: number; conflicts: number; total: number };
};

const STATUS_LABEL: Record<ConnectionStatusId, string> = {
  configured: 'Configurada',
  missing: 'Sin configurar',
  conflict: 'Conflicto · no sobrescrita',
  unknown: 'No se pudo comprobar',
};

export function connectionsSummaryLine(summary: {
  configured: number;
  conflicts: number;
  total: number;
}) {
  if (summary.conflicts > 0 && summary.configured > 0)
    return t('{0} listas · {1} en conflicto', {
      0: summary.configured,
      1: summary.conflicts,
    });
  if (summary.conflicts > 0)
    return t('{0} en conflicto — Hyperion no sobrescribió esas entradas.', {
      0: summary.conflicts,
    });
  if (summary.configured === 0)
    return t('Ninguna aplicación tiene Hyperion configurado todavía.');
  if (summary.configured === summary.total)
    return t('Las {0} integraciones conocidas están configuradas.', {
      0: summary.configured,
    });
  return t(
    '{0} de {1} aplicaciones listas. Reinicia el cliente y abre un chat nuevo para cargar herramientas.',
    { 0: summary.configured, 1: summary.total },
  );
}

function truncatePath(path: string) {
  if (path.length <= 42) return path;
  return `${path.slice(0, 18)}…${path.slice(-18)}`;
}

async function fetchInventory(
  signal?: AbortSignal,
): Promise<ConnectionInventory> {
  const res = await fetch('/api/connections', { signal });
  const body = await res.json();
  if (!res.ok)
    throw new Error(body.message || t('No se pudo completar la solicitud.'));
  return body as ConnectionInventory;
}

export function useConnectionInventory(enabled: boolean) {
  const [inventory, setInventory] = useState<ConnectionInventory | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      setInventory(await fetchInventory());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('No se pudo completar la solicitud.'),
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetchInventory(controller.signal)
      .then(setInventory)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : t('No se pudo completar la solicitud.'),
        );
      });
    return () => controller.abort();
  }, [enabled]);
  return { inventory, error, busy, refresh, setInventory };
}

function calVerLabel(inventory: ConnectionInventory | null) {
  if (!inventory?.version) return '';
  return t('Hyperion {0} UTC · {1}', {
    0: inventory.version,
    1: inventory.channel || 'preview',
  });
}

export function ConnectionsView({
  online,
  inventory,
  error,
  busy,
  onClose,
  onRefresh,
  onSetup,
  onConflict,
  onHelp,
  onConnectAi,
}: {
  online: boolean;
  inventory: ConnectionInventory | null;
  error: string;
  busy: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSetup: (clientId: string) => void;
  onConflict: (row: ConnectionRow) => void;
  onHelp: () => void;
  onConnectAi: () => void;
}) {
  useLocale();
  const [copied, setCopied] = useState('');
  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  }
  const version = calVerLabel(inventory);
  const serviceHost = inventory?.serviceUrl
    ? inventory.serviceUrl.replace(/^https?:\/\//, '')
    : '';
  return (
    <div className="connections-view">
      <header className="connections-identity">
        <div>
          <span className="eyebrow">{t('CONEXIONES')}</span>
          <h2 id="popup-title">{t('Conexiones')}</h2>
          {version ? (
            <p className="connections-calver" title={t('Versión de Hyperion')}>
              <span className="form-sr-only">{t('Versión de Hyperion')}: </span>
              {version}
            </p>
          ) : (
            <p className="connections-calver muted">…</p>
          )}
        </div>
        <div className="connections-identity-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            {t('Volver al canvas')}
          </button>
          <button
            type="button"
            className="ghost-button"
            disabled={busy}
            onClick={onRefresh}
          >
            {t('Volver a comprobar')}
          </button>
        </div>
      </header>

      <div className="connection-service-strip">
        <div>
          <strong>{t('Servicio local')}</strong>
          <p>
            {online ? t('Conectado') : t('Sin conexión')}
            {serviceHost ? ` · ${serviceHost}` : ''}
          </p>
          <p className="muted connection-honesty">
            {t(
              'El servicio local responde en este equipo. No indica qué aplicación de IA está en uso.',
            )}
          </p>
        </div>
        <span
          className={`connection-status-badge ${online ? 'is-online' : 'is-offline'}`}
        >
          {online ? t('Conectado') : t('Sin conexión')}
        </span>
      </div>

      <section className="connections-hero" aria-live="polite">
        <span className="eyebrow">{t('Tus aplicaciones de IA')}</span>
        <p className="connections-summary">
          {inventory
            ? connectionsSummaryLine(inventory.summary)
            : busy
              ? '…'
              : t('Ninguna aplicación tiene Hyperion configurado todavía.')}
        </p>
        <p className="muted">
          {t(
            'Hyperion prepara la entrada local en cada aplicación. «Configurada» no significa que un chat abierto ya haya cargado las herramientas.',
          )}
        </p>
        <button type="button" className="primary" onClick={onConnectAi}>
          {t('Conectar con mi IA…')}
        </button>
      </section>

      <ul className="connection-card-grid" aria-live="polite">
        {(inventory?.integrations || []).map((row) => (
          <li key={row.id} className={`connection-card status-${row.status}`}>
            <div className="connection-card-head">
              <strong>{row.name}</strong>
              <span className={`connection-status-badge status-${row.status}`}>
                {t(STATUS_LABEL[row.status])}
              </span>
            </div>
            {row.path ? (
              <p className="connection-path" title={row.path}>
                <span className="eyebrow">{t('Archivo de configuración')}</span>
                {truncatePath(row.path)}
              </p>
            ) : (
              <p className="connection-path muted">{t('Ruta no disponible')}</p>
            )}
            {row.status === 'conflict' && row.detail && (
              <p className="connection-conflict-note">{row.detail}</p>
            )}
            <div className="connection-row-actions">
              {row.status === 'missing' && (
                <button type="button" onClick={() => onSetup(row.id)}>
                  {t('Configurar…')}
                </button>
              )}
              {row.status === 'configured' && row.path && (
                <button type="button" onClick={() => void copyPath(row.path!)}>
                  {copied === row.path ? t('Ruta copiada') : t('Copiar ruta')}
                </button>
              )}
              {row.status === 'configured' && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={onRefresh}
                >
                  {t('Volver a comprobar')}
                </button>
              )}
              {row.status === 'conflict' && (
                <button type="button" onClick={() => onConflict(row)}>
                  {t('Ver conflicto…')}
                </button>
              )}
              {row.status === 'conflict' && row.path && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void copyPath(row.path!)}
                >
                  {copied === row.path ? t('Ruta copiada') : t('Copiar ruta')}
                </button>
              )}
              {row.status === 'unknown' && (
                <button type="button" onClick={onRefresh}>
                  {t('Reintentar comprobación')}
                </button>
              )}
              <button type="button" className="ghost-button" onClick={onHelp}>
                {row.status === 'conflict'
                  ? t('Ayuda para resolver')
                  : t('Ayuda')}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="muted connections-footer-note">
        {t(
          'Hyperion no sobrescribe una entrada distinta. Si hay conflicto, resuélvelo en el cliente o retira la entrada antigua y vuelve a conectar.',
        )}
      </p>
      {error && (
        <p role="alert" className="popup-error">
          {error}
        </p>
      )}
      {version && (
        <footer
          className="connections-calver-footer"
          title={t('Versión de Hyperion')}
        >
          {version}
          {' · MIT'}
        </footer>
      )}
    </div>
  );
}
