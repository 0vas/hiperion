import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileText, Package } from 'lucide-react';
import type { Artifact } from '../domain/artifacts';
import type { Step } from '../domain/workflow';
import { t, useLocale } from './i18n';
const fileUrl = (runId: string, artifact: Artifact) =>
  `/api/runs/${encodeURIComponent(runId)}/artifacts/${artifact.id}`;
function Preview({ runId, artifact }: { runId: string; artifact: Artifact }) {
  useLocale();
  const [text, setText] = useState<string>();
  const [error, setError] = useState(false);
  const image = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
    artifact.mediaType,
  );
  const url = fileUrl(runId, artifact);
  useEffect(() => {
    if (image) return;
    const controller = new AbortController();
    void fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unavailable');
        return response.text();
      })
      .then(setText)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [url, image]);
  if (error)
    return (
      <p role="alert">
        {t('No se pudo abrir el artefacto. Puedes intentar descargarlo.')}
      </p>
    );
  if (image)
    return (
      <img
        className="artifact-image"
        src={`${url}?preview=1`}
        alt={artifact.name}
        onError={() => setError(true)}
      />
    );
  return (
    <pre className="artifact-text">{text ?? t('Cargando artefacto…')}</pre>
  );
}
function ArtifactCard({
  runId,
  artifact,
  attempt,
}: {
  runId: string;
  artifact: Artifact;
  attempt: number;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const preview =
    !artifact.url &&
    (/^image\/(png|jpeg|gif|webp)$/.test(artifact.mediaType) ||
      ((/^text\//.test(artifact.mediaType) ||
        ['application/json', 'image/svg+xml'].includes(artifact.mediaType)) &&
        (artifact.size || 0) <= 256 * 1024));
  return (
    <li className="artifact-card">
      <div className="artifact-heading">
        <FileText size={19} />
        <strong>{artifact.name}</strong>
      </div>
      <p className="muted">
        {artifact.url
          ? new URL(artifact.url).hostname
          : `${artifact.mediaType} · ${((artifact.size || 0) / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KiB`}{' '}
        · {new Date(artifact.createdAt).toLocaleString(locale)}
      </p>
      {artifact.attempt !== attempt && (
        <p className="muted">
          {t('Intento anterior: {0}', { 0: artifact.attempt })}
        </p>
      )}
      <div className="artifact-actions">
        {preview && (
          <button
            className="secondary"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? t('Ocultar vista previa') : t('Ver artefacto')}
          </button>
        )}
        <a
          className="secondary"
          href={artifact.url || fileUrl(runId, artifact)}
          {...(artifact.url
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : { download: artifact.name })}
        >
          {artifact.url ? <ExternalLink size={16} /> : <Download size={16} />}
          {artifact.url ? t('Abrir enlace') : t('Descargar')}
        </a>
      </div>
      {open && <Preview runId={runId} artifact={artifact} />}
    </li>
  );
}
export function Artifacts({ runId, step }: { runId: string; step: Step }) {
  useLocale();
  return (
    <section className="step-artifacts" aria-label={t('Artefactos del paso')}>
      <h3>
        <Package size={18} /> {t('Artefactos')}{' '}
        <span>{step.artifacts?.length || 0}</span>
      </h3>
      {step.artifacts?.length ? (
        <ul>
          {step.artifacts.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              runId={runId}
              artifact={artifact}
              attempt={step.attempt}
            />
          ))}
        </ul>
      ) : (
        <p className="muted">
          {t(
            'Los archivos y enlaces que genere el agente aparecerán aquí cuando los registre.',
          )}
        </p>
      )}
    </section>
  );
}
