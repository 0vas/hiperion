import { Check } from 'lucide-react';
import type { Step } from '../domain/workflow';
export function DecisionFields({
  ports,
  values,
  onChange,
}: {
  ports: NonNullable<Step['outputs']>;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  const answered = ports.filter((p) => values[p.name]?.trim()).length;
  return (
    <section className="decision-checklist">
      <div className="checklist-progress">
        <strong>Por resolver</strong>
        <span aria-live="polite">
          {answered} de {ports.length} resueltos
        </span>
      </div>
      <progress
        aria-label="Progreso de decisiones"
        value={answered}
        max={ports.length}
      />
      <ol aria-label="Lista de decisiones">
        {ports.map((port, index) => {
          const label = port.description || port.name;
          const value = values[port.name] || '';
          const change = (text: string) =>
            onChange({ ...values, [port.name]: text });
          return (
            <li
              key={port.name}
              className="decision-item"
              data-answered={!!value.trim()}
            >
              <span
                className="decision-check"
                role="img"
                aria-label={value.trim() ? 'Resuelto' : 'Pendiente'}
              >
                {value.trim() ? <Check size={14} /> : index + 1}
              </span>
              <div className="decision-field">
                {port.type === 'boolean' ? (
                  <fieldset>
                    <legend>
                      {label}
                      {!port.required && <small>Opcional</small>}
                    </legend>
                    <div className="decision-choices">
                      {[
                        ['true', 'Sí'],
                        ['false', 'No'],
                      ].map(([v, text]) => (
                        <label key={v}>
                          <input
                            type="radio"
                            name={`output-${port.name}`}
                            value={v}
                            checked={value === v}
                            onChange={() => change(v!)}
                          />
                          <span>{text}</span>
                        </label>
                      ))}
                      {!port.required && (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => change('')}
                        >
                          Omitir
                        </button>
                      )}
                    </div>
                  </fieldset>
                ) : (
                  <>
                    <label htmlFor={`output-${port.name}`}>
                      {label}
                      {!port.required && <small>Opcional</small>}
                    </label>
                    {port.type === 'number' ? (
                      <input
                        id={`output-${port.name}`}
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => change(e.target.value)}
                        placeholder="Escribe un número"
                      />
                    ) : (
                      <textarea
                        id={`output-${port.name}`}
                        rows={port.type === 'string' ? 2 : 3}
                        value={value}
                        onChange={(e) => change(e.target.value)}
                        placeholder={
                          port.type === 'string'
                            ? 'Escribe aquí…'
                            : `Datos estructurados (${port.type === 'array' ? 'lista JSON' : 'objeto JSON'})`
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
