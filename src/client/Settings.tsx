import type { Preferences } from './preferences';
export function Settings({
  value,
  onChange,
}: {
  value: Preferences;
  onChange: (value: Preferences) => void;
}) {
  return (
    <div className="settings-panel">
      <span className="eyebrow">TU ESPACIO</span>
      <h2 id="popup-title">Ajustes</h2>
      <p className="muted">Se guardan en este navegador.</p>
      <fieldset>
        <legend>Apariencia</legend>
        <label htmlFor="setting-theme">Tema</label>
        <select
          id="setting-theme"
          value={value.theme}
          onChange={(e) =>
            onChange({
              ...value,
              theme: e.target.value as Preferences['theme'],
            })
          }
        >
          <option value="system">Sistema</option>
          <option value="light">Mármol claro</option>
          <option value="dark">Noche del Egeo</option>
        </select>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={value.reduceMotion}
            onChange={(e) =>
              onChange({ ...value, reduceMotion: e.target.checked })
            }
          />
          Reducir movimiento
        </label>
        <p className="muted">
          La preferencia de accesibilidad del sistema siempre se respeta.
        </p>
      </fieldset>
      <fieldset>
        <legend>Navegación</legend>
        <label htmlFor="setting-view">Vista del flujo</label>
        <select
          id="setting-view"
          value={value.view}
          onChange={(e) =>
            onChange({ ...value, view: e.target.value as Preferences['view'] })
          }
        >
          <option value="steps">Pasos · detalle de ejecución</option>
          <option value="jobs">Trabajos · resumen del plan</option>
        </select>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={value.follow}
            onChange={(e) => onChange({ ...value, follow: e.target.checked })}
          />
          Seguir al abrir un flujo
        </label>
        <p className="muted">
          Centra la tarea que necesita atención. Puedes mover el canvas para
          explorar.
        </p>
      </fieldset>
      <p className="guide-note">
        Estos ajustes cambian la vista. Las decisiones del proceso siguen siendo
        tuyas.
      </p>
    </div>
  );
}
