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

export function integrationsChipLabel(summary: {
  configured: number;
  conflicts: number;
  total: number;
}) {
  if (summary.conflicts > 0)
    return t('{0} listas · {1} conflictos', {
      0: summary.configured,
      1: summary.conflicts,
    });
  if (summary.configured === 0) return t('Ninguna configurada');
  return t('{0}/{1} listas', {
    0: summary.configured,
    1: summary.total,
  });
}

export function integrationsAriaLabel(summary: {
  configured: number;
  conflicts: number;
  total: number;
}) {
  if (summary.conflicts > 0)
    return t('Integraciones: {0} configuradas, {1} en conflicto', {
      0: summary.configured,
      1: summary.conflicts,
    });
  if (summary.configured === 0) return t('Integraciones: ninguna configurada');
  if (summary.configured === summary.total)
    return t('Integraciones: {0} configuradas', { 0: summary.configured });
  return t('Integraciones: {0} de {1} configuradas', {
    0: summary.configured,
    1: summary.total,
  });
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

function truncatePath(path: string) {
  if (path.length <= 42) return path;
  return `${path.slice(0, 18)}…${path.slice(-18)}`;
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

export function ConnectionsPanel({
  online,
  inventory,
  error,
  busy,
  onRefresh,
  onSetup,
  onConflict,
  onHelp,
}: {
  online: boolean;
  inventory: ConnectionInventory | null;
  error: string;
  busy: boolean;
  onRefresh: () => void;
  onSetup: (clientId: string) => void;
  onConflict: (row: ConnectionRow) => void;
  onHelp: () => void;
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
  const versionLabel =
    inventory?.version &&
    `${inventory.version} UTC${inventory.channel ? ` · ${inventory.channel}` : ''}`;
  return (
    <fieldset className="connections-fieldset">
      <legend>{t('Conexiones')}</legend>
      <p className="muted">
        {t(
          'Revisa el servicio local y las integraciones instaladas en tus aplicaciones de IA.',
        )}
      </p>
      <div className="connection-service-row">
        <div>
          <strong>{t('Servicio local')}</strong>
          <p className="muted">
            {online ? t('Conectado') : t('Sin conexión')}
            {inventory?.serviceUrl
              ? ` · ${inventory.serviceUrl.replace(/^https?:\/\//, '')}`
              : ''}
          </p>
          <p className="muted connection-honesty">
            {t(
              'El servicio local de Hyperion responde en este equipo. No indica que tu aplicación de IA tenga herramientas cargadas.',
            )}
          </p>
        </div>
        <span
          className={`connection-status-badge ${online ? 'is-online' : 'is-offline'}`}
        >
          {online ? t('Conectado') : t('Sin conexión')}
        </span>
      </div>
      <div className="connection-integrations-head">
        <strong>{t('Integraciones con tu IA')}</strong>
        <button
          type="button"
          className="ghost-button"
          disabled={busy}
          onClick={onRefresh}
        >
          {t('Volver a comprobar')}
        </button>
      </div>
      <p className="muted">
        {t(
          'Una integración «Configurada» significa que Hyperion encontró su entrada en el archivo del cliente. Reinicia esa aplicación y abre un chat nuevo para cargar las herramientas.',
        )}
      </p>
      <ul className="connection-list" aria-live="polite">
        {(inventory?.integrations || []).map((row) => (
          <li key={row.id} className={`connection-row status-${row.status}`}>
            <div className="connection-row-main">
              <strong>{row.name}</strong>
              <span className={`connection-status-badge status-${row.status}`}>
                {t(STATUS_LABEL[row.status])}
              </span>
            </div>
            {row.path && (
              <p className="connection-path" title={row.path}>
                <span className="eyebrow">{t('Archivo de configuración')}</span>
                {truncatePath(row.path)}
              </p>
            )}
            {!row.path && (
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
      <p className="muted">
        {t(
          'Hyperion no sobrescribe una entrada distinta. Si hay conflicto, resuélvelo en el cliente o retira la entrada antigua y vuelve a conectar.',
        )}
      </p>
      {error && (
        <p role="alert" className="popup-error">
          {error}
        </p>
      )}
      {versionLabel && (
        <p className="connection-version" title={t('Versión de Hyperion')}>
          Hyperion {versionLabel}
        </p>
      )}
    </fieldset>
  );
}
