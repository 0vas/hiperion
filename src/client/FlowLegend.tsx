import { t, useLocale } from './i18n';
import { Check, Play, UserRound, Pause, AlertCircle } from 'lucide-react';
import { BpmnSymbol } from './BpmnSymbol';
export function FlowLegend() {
  useLocale();
  return (
    <div className="flow-legend">
      <span className="eyebrow">{t('LEE EL RECORRIDO')}</span>
      <h2 id="popup-title">{t('Colores del flujo')}</h2>
      <p>
        {t('El color, el símbolo y la etiqueta indican dónde está cada paso.')}
      </p>
      <ul>
        <li data-flow-state="completed">
          <Check />
          <div>
            <strong>{t('Verde · Completado')}</strong>
            <span>
              {t(
                'Las cintas ondulantes recorren lo hecho hasta la siguiente tarea.',
              )}
            </span>
          </div>
        </li>
        <li data-flow-state="active">
          <Play />
          <div>
            <strong>{t('Azul · En curso')}</strong>
            <span>
              {t(
                'La corriente llega a la tarea disponible. «En curso» indica ejecución; «Listo» aún espera al agente.',
              )}
            </span>
          </div>
        </li>
        <li data-flow-state="attention">
          <UserRound />
          <div>
            <strong>{t('Ámbar · Tu turno')}</strong>
            <span>
              {t(
                'La corriente llega hasta aquí y espera tu respuesta. Abre la tarea.',
              )}
            </span>
          </div>
        </li>
        <li data-flow-state="paused">
          <Pause />
          <div>
            <strong>{t('Ámbar · En pausa')}</strong>
            <span>{t('La animación se detiene hasta reanudar.')}</span>
          </div>
        </li>
        <li data-flow-state="error">
          <AlertCircle />
          <div>
            <strong>{t('Rojo · Requiere revisión')}</strong>
            <span>{t('Abre el paso para consultar el error o rechazo.')}</span>
          </div>
        </li>
        <li data-flow-state="pending">
          <span className="legend-line" />
          <div>
            <strong>{t('Gris · Pendiente')}</strong>
            <span>
              {t(
                'La ruta discontinua todavía no se ha recorrido. «Omitido» identifica una rama no elegida.',
              )}
            </span>
          </div>
        </li>
      </ul>
      <div className="gateway-legend">
        <h3>{t('Compuertas del proceso')}</h3>
        <p>
          {t(
            'Las compuertas son amarillas. «Dividir» abre ramas; «unir» las reúne.',
          )}
        </p>
        <div>
          <BpmnSymbol kind="parallel" />
          <span>
            <strong>{t('Paralela · todas')}</strong>
            {t('Ejecuta todas las ramas; la unión espera que terminen.')}
          </span>
        </div>
        <div>
          <BpmnSymbol kind="exclusive" />
          <span>
            <strong>{t('Exclusiva · una')}</strong>
            {t('Elige una ruta según la decisión.')}
          </span>
        </div>
        <div>
          <BpmnSymbol kind="inclusive" />
          <span>
            <strong>{t('Inclusiva · una o más')}</strong>
            {t(
              'Activa las rutas que cumplen condiciones; espera solo esas ramas.',
            )}
          </span>
        </div>
      </div>
      <p className="legend-events">
        <BpmnSymbol kind="start" /> {t('Inicio')} <span>→</span>
        <BpmnSymbol kind="end" /> {t('Fin')}
      </p>
      <p className="guide-note">
        {t(
          'Inicio verde y fin rojo identifican los extremos; el fin rojo no indica error. La corriente representa información disponible, no actividad del agente. Se detiene al terminar, pausar, perder conexión o reducir movimiento.',
        )}
      </p>
    </div>
  );
}
