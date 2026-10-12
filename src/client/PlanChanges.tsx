import { t, useLocale } from './i18n';
import type { PlanChange } from '../domain/workflow';
export function PlanChanges({
  changes,
  revision,
}: {
  changes: PlanChange[];
  revision: number;
}) {
  useLocale();
  return (
    <section className="plan-changes" aria-label={t('Cambios del plan')}>
      {[...changes].reverse().map((change) => (
        <details key={change.revision} open={change.revision === revision}>
          <summary>
            {t('Plan actualizado · revisión')} {change.revision}
          </summary>
          <p>{change.reason}</p>
          {(['added', 'changed', 'removed'] as const).map(
            (kind) =>
              change[kind].length > 0 && (
                <div key={kind}>
                  <strong>
                    {
                      {
                        added: t('Añadido'),
                        changed: t('Modificado'),
                        removed: t('Retirado'),
                      }[kind]
                    }
                  </strong>
                  <ul>
                    {change[kind].map((id) => {
                      const before = change.previousPlan.steps.find(
                        (s) => s.id === id,
                      );
                      const after = change.nextPlan.steps.find(
                        (s) => s.id === id,
                      );
                      const item = kind === 'removed' ? before : after;
                      return (
                        <li key={id}>
                          {item?.title || id}
                          {kind === 'changed' && before && after && (
                            <details className="plan-step-change">
                              <summary>{t('Ver qué cambió')}</summary>
                              {before.title !== after.title && (
                                <p>
                                  {t('Antes:')} {before.title}
                                </p>
                              )}
                              {before.description !== after.description && (
                                <p>
                                  {t('Instrucción:')}{' '}
                                  {after.description ||
                                    t('Sin instrucción adicional')}
                                </p>
                              )}
                              {JSON.stringify(before.dependencies) !==
                                JSON.stringify(after.dependencies) && (
                                <p>
                                  {t('Después de:')}{' '}
                                  {after.dependencies
                                    .map(
                                      (dep) =>
                                        change.nextPlan.steps.find(
                                          (s) => s.id === dep,
                                        )?.title || dep,
                                    )
                                    .join(', ') || t('Inicio')}
                                </p>
                              )}
                              {before.kind !== after.kind && (
                                <p>
                                  {t(
                                    'Responsable o tipo de tarea actualizado.',
                                  )}
                                </p>
                              )}
                              {(['inputs', 'outputs'] as const).map(
                                (direction) =>
                                  JSON.stringify(before[direction]) !==
                                    JSON.stringify(after[direction]) && (
                                    <p key={direction}>
                                      {direction === 'inputs'
                                        ? t('Entradas actualizadas')
                                        : t('Salidas actualizadas')}
                                      :{' '}
                                      {after[direction]
                                        ?.map(
                                          (p) =>
                                            p.form?.label ||
                                            p.description ||
                                            p.name,
                                        )
                                        .join(', ') || t('Sin campos')}
                                    </p>
                                  ),
                              )}
                              <details>
                                <summary>
                                  {t('Contrato anterior y nuevo')}
                                </summary>
                                <h4>{t('Antes')}</h4>
                                <pre>{JSON.stringify(before, null, 2)}</pre>
                                <h4>{t('Ahora')}</h4>
                                <pre>{JSON.stringify(after, null, 2)}</pre>
                              </details>
                            </details>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ),
          )}
          {change.previousPlan.title !== change.nextPlan.title && (
            <p>
              {t('Título:')} {change.previousPlan.title} →{' '}
              {change.nextPlan.title}
            </p>
          )}
          <p className="muted">{t('El trabajo ejecutado se conserva.')}</p>
        </details>
      ))}
    </section>
  );
}
