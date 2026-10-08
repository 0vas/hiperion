import {
  Check,
  Play,
  UserRound,
  Pause,
  AlertCircle,
  Flag,
  Square,
} from 'lucide-react';
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
            <span>La línea continua muestra el recorrido completado.</span>
          </div>
        </li>
        <li data-flow-state="active">
          <Play />
          <div>
            <strong>Azul · En curso</strong>
            <span>
              Los trazos avanzan hacia el paso que se está ejecutando. «Listo»
              aún espera al agente.
            </span>
          </div>
        </li>
        <li data-flow-state="attention">
          <UserRound />
          <div>
            <strong>Ámbar · Tu turno</strong>
            <span>El flujo espera tu respuesta o aprobación.</span>
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
      <p className="legend-events">
        <Flag size={17} /> Inicio <span>→</span>
        <Square size={15} /> Fin
      </p>
      <p className="guide-note">
        Se muestra el estado que registró el agente. Sin conexión, en pausa o
        con movimiento reducido, las flechas permanecen quietas.
      </p>
    </div>
  );
}
