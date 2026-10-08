import { Check, Play, UserRound, Pause, AlertCircle } from 'lucide-react';
import { BpmnSymbol } from './BpmnSymbol';
export function FlowLegend() {
  return (
    <div className="flow-legend">
      <span className="eyebrow">LEE EL RECORRIDO</span>
      <h2 id="popup-title">Colores del flujo</h2>
      <p>El color, el símbolo y la etiqueta indican dónde está cada paso.</p>
      <ul>
        <li data-flow-state="completed">
          <Check />
          <div>
            <strong>Verde · Completado</strong>
            <span>
              Las cintas ondulantes recorren lo hecho hasta la siguiente tarea.
            </span>
          </div>
        </li>
        <li data-flow-state="active">
          <Play />
          <div>
            <strong>Azul · En curso</strong>
            <span>
              La corriente llega a la tarea disponible. «En curso» indica
              ejecución; «Listo» aún espera al agente.
            </span>
          </div>
        </li>
        <li data-flow-state="attention">
          <UserRound />
          <div>
            <strong>Ámbar · Tu turno</strong>
            <span>
              La corriente llega hasta aquí y espera tu respuesta. Abre la
              tarea.
            </span>
          </div>
        </li>
        <li data-flow-state="paused">
          <Pause />
          <div>
            <strong>Ámbar · En pausa</strong>
            <span>La animación se detiene hasta reanudar.</span>
          </div>
        </li>
        <li data-flow-state="error">
          <AlertCircle />
          <div>
            <strong>Rojo · Requiere revisión</strong>
            <span>Abre el paso para consultar el error o rechazo.</span>
          </div>
        </li>
        <li data-flow-state="pending">
          <span className="legend-line" />
          <div>
            <strong>Gris · Pendiente</strong>
            <span>
              La ruta discontinua todavía no se ha recorrido. «Omitido»
              identifica una rama no elegida.
            </span>
          </div>
        </li>
      </ul>
      <div className="gateway-legend">
        <h3>Compuertas del proceso</h3>
        <p>
          Las compuertas son amarillas. «Dividir» abre ramas; «unir» las reúne.
        </p>
        <div>
          <BpmnSymbol kind="parallel" />
          <span>
            <strong>Paralela · todas</strong>Ejecuta todas las ramas; la unión
            espera que terminen.
          </span>
        </div>
        <div>
          <BpmnSymbol kind="exclusive" />
          <span>
            <strong>Exclusiva · una</strong>Elige una ruta según la decisión.
          </span>
        </div>
        <div>
          <BpmnSymbol kind="inclusive" />
          <span>
            <strong>Inclusiva · una o más</strong>Activa las rutas que cumplen
            condiciones; espera solo esas ramas.
          </span>
        </div>
      </div>
      <p className="legend-events">
        <BpmnSymbol kind="start" /> Inicio <span>→</span>
        <BpmnSymbol kind="end" /> Fin
      </p>
      <p className="guide-note">
        Inicio verde y fin rojo identifican los extremos; el fin rojo no indica
        error. La corriente representa información disponible, no actividad del
        agente. Se detiene al terminar, pausar, perder conexión o reducir
        movimiento.
      </p>
    </div>
  );
}
