import { useState } from 'react';
import {
  t,
  useLocale,
  getLanguagePreference,
  setLanguagePreference,
  type LanguagePreference,
} from './i18n';
import type { Preferences } from './preferences';

export function Settings({
  value,
  onChange,
  onOpenConnections,
}: {
  value: Preferences;
  onChange: (value: Preferences) => void;
  onOpenConnections: () => void;
}) {
  useLocale();
  const [languageError, setLanguageError] = useState(false);
  return (
    <div className="settings-panel">
      <span className="eyebrow">{t('TU ESPACIO')}</span>
      <h2 id="popup-title">{t('Ajustes')}</h2>
      <p className="muted">{t('Personaliza tu interfaz.')}</p>
      <fieldset>
        <legend>{t('Idioma')}</legend>
        <select
          aria-label={t('Idioma')}
          value={getLanguagePreference()}
          onChange={(e) => {
            setLanguageError(false);
            void setLanguagePreference(
              e.target.value as LanguagePreference,
            ).catch(() => setLanguageError(true));
          }}
        >
          <option value="system">{t('Automático (sistema)')}</option>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        <p className="muted">
          {t(
            'El idioma de la interfaz no cambia tus tareas, respuestas ni logs.',
          )}
        </p>
        {languageError && (
          <p role="alert">
            {t('No se pudo guardar el idioma. Inténtalo de nuevo.')}
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend>{t('Apariencia')}</legend>
        <label htmlFor="setting-theme">{t('Tema')}</label>
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
          <option value="system">{t('Sistema')}</option>
          <option value="light">{t('Mármol claro')}</option>
          <option value="dark">{t('Noche del Egeo')}</option>
        </select>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={value.reduceMotion}
            onChange={(e) =>
              onChange({ ...value, reduceMotion: e.target.checked })
            }
          />
          {t('Reducir movimiento')}
        </label>
        <p className="muted">
          {t('La preferencia de accesibilidad del sistema siempre se respeta.')}
        </p>
      </fieldset>
      <fieldset className="settings-connections-link">
        <legend>{t('Conexiones e integraciones')}</legend>
        <p className="muted">
          {t(
            'Gestiona el servicio local y tus aplicaciones de IA en la vista Conexiones.',
          )}
        </p>
        <button type="button" className="secondary" onClick={onOpenConnections}>
          {t('Abrir conexiones')}
        </button>
      </fieldset>
      <fieldset>
        <legend>{t('Navegación')}</legend>
        <label htmlFor="setting-orientation">{t('Dirección')}</label>
        <select
          id="setting-orientation"
          value={value.orientation}
          onChange={(e) =>
            onChange({
              ...value,
              orientation: e.target.value as Preferences['orientation'],
            })
          }
        >
          <option value="vertical">{t('Vertical · arriba hacia abajo')}</option>
          <option value="horizontal">
            {t('Horizontal · izquierda a derecha')}
          </option>
        </select>
        <label htmlFor="setting-view">{t('Vista del flujo')}</label>
        <select
          id="setting-view"
          value={value.view}
          onChange={(e) =>
            onChange({ ...value, view: e.target.value as Preferences['view'] })
          }
        >
          <option value="steps">{t('Pasos · detalle de ejecución')}</option>
          <option value="jobs">{t('Trabajos · resumen del plan')}</option>
        </select>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={value.follow}
            onChange={(e) => onChange({ ...value, follow: e.target.checked })}
          />
          {t('Seguir al abrir un flujo')}
        </label>
        <p className="muted">
          {t(
            'Centra la tarea que necesita atención. Puedes mover el canvas para explorar.',
          )}
        </p>
      </fieldset>
      <p className="guide-note">
        {t(
          'Estos ajustes cambian la vista. Las decisiones del proceso siguen siendo tuyas.',
        )}
      </p>
    </div>
  );
}
