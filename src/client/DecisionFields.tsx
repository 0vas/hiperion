import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { fieldError, fieldLabel, type FormPort } from './decision-form';
export function DecisionFields({
  ports,
  values,
  onChange,
  singleQuestion = false,
}: {
  ports: FormPort[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  singleQuestion?: boolean;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const required = ports.filter((p) => p.required);
  const optional = ports.filter((p) => !p.required);
  const answered = required.filter(
    (p) => !fieldError(p, values[p.name] || ''),
  ).length;
  const render = (port: FormPort, index: number) => {
    const label = fieldLabel(port);
    const value = values[port.name] || '';
    const error = touched[port.name] ? fieldError(port, value) : undefined;
    const id = `output-${port.name}`;
    const hint = port.form?.hint;
    const describedBy =
      [hint && `${id}-hint`, error && `${id}-error`]
        .filter(Boolean)
        .join(' ') || undefined;
    const change = (text: string) => onChange({ ...values, [port.name]: text });
    const blur = () => setTouched((t) => ({ ...t, [port.name]: true }));
    const hideLabel = singleQuestion && required.length === 1 && port.required;
    return (
      <li
        key={port.name}
        className="decision-item"
        data-answered={!!value.trim() && !fieldError(port, value)}
      >
        {required.length > 1 && port.required && (
          <span
            className="decision-check"
            role="img"
            aria-label={value.trim() && !error ? 'Resuelto' : 'Pendiente'}
          >
            {value.trim() && !error ? <Check size={13} /> : index + 1}
          </span>
        )}
        <div className="decision-field">
          {port.type === 'boolean' ? (
            <fieldset aria-describedby={describedBy}>
              <legend className={hideLabel ? 'form-sr-only' : undefined}>
                {label}
              </legend>
              {hint && (
                <p id={`${id}-hint`} className="field-hint">
                  {hint}
                </p>
              )}
              <div className="decision-choices">
                {(['true', 'false'] as const).map((v) => (
                  <label key={v}>
                    <input
                      type="radio"
                      name={id}
                      value={v}
                      checked={value === v}
                      required={port.required}
                      onChange={() => change(v)}
                      onBlur={blur}
                    />
                    {v === 'true' ? (
                      <Check size={17} aria-hidden="true" />
                    ) : (
                      <X size={17} aria-hidden="true" />
                    )}
                    <span>
                      {v === 'true'
                        ? port.form?.trueLabel || 'Sí'
                        : port.form?.falseLabel || 'No'}
                    </span>
                  </label>
                ))}
                {!port.required && value && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => change('')}
                  >
                    Quitar respuesta
                  </button>
                )}
              </div>
            </fieldset>
          ) : (
            <>
              <label
                className={hideLabel ? 'form-sr-only' : undefined}
                htmlFor={id}
              >
                {label}
              </label>
              {hint && (
                <p id={`${id}-hint`} className="field-hint">
                  {hint}
                </p>
              )}
              {port.type === 'number' ? (
                <input
                  id={id}
                  type="number"
                  step="any"
                  value={value}
                  required={port.required}
                  onChange={(e) => change(e.target.value)}
                  onBlur={blur}
                  aria-invalid={!!error}
                  aria-describedby={describedBy}
                  placeholder={port.form?.placeholder || 'Escribe una cantidad'}
                />
              ) : (
                <textarea
                  id={id}
                  rows={port.type === 'string' ? 2 : 3}
                  value={value}
                  required={port.required}
                  onChange={(e) => change(e.target.value)}
                  onBlur={blur}
                  aria-invalid={!!error}
                  aria-describedby={describedBy}
                  placeholder={
                    port.form?.placeholder ||
                    (port.type === 'string'
                      ? 'Escribe una respuesta breve…'
                      : port.type === 'array'
                        ? '["Primer elemento", "Segundo elemento"]'
                        : '{"nombre": "valor"}')
                  }
                />
              )}
            </>
          )}
          {error && (
            <p className="field-error" id={`${id}-error`} role="alert">
              {error}
            </p>
          )}
        </div>
      </li>
    );
  };
  return (
    <section className="decision-checklist">
      {required.length > 1 && (
        <div className="checklist-progress">
          <span>Tu lista</span>
          <span aria-live="polite">
            {answered} de {required.length} resueltos
          </span>
        </div>
      )}
      {required.length > 0 && (
        <ol aria-label="Lista de decisiones">{required.map(render)}</ol>
      )}
      {optional.length > 0 &&
        (required.length ? (
          <details className="optional-fields">
            <summary>
              <Plus size={15} />
              <span>
                {optional.length === 1
                  ? fieldLabel(optional[0]!)
                  : 'Añadir detalles'}{' '}
                <small>Opcional</small>
              </span>
            </summary>
            <ol aria-label="Datos opcionales">{optional.map(render)}</ol>
          </details>
        ) : (
          <>
            <p className="field-hint">
              Completa al menos un dato para continuar.
            </p>
            <ol aria-label="Lista de decisiones">{optional.map(render)}</ol>
          </>
        ))}
    </section>
  );
}
