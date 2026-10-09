import { Check, LoaderCircle } from 'lucide-react';
import type { Step } from '../domain/workflow';
import { DecisionFields } from './DecisionFields';
import { fieldError } from './decision-form';
export function HumanForm({
  step,
  answer,
  onAnswer,
  values,
  onValues,
  busy,
  online,
  onSubmit,
  onReject,
}: {
  step: Step;
  answer: string;
  onAnswer: (answer: string) => void;
  values: Record<string, string>;
  onValues: (values: Record<string, string>) => void;
  busy: boolean;
  online: boolean;
  onSubmit: () => void;
  onReject: () => void;
}) {
  const manual = step.kind === 'manual';
  const ports = step.outputs || [];
  const question =
    step.interaction?.question ||
    (manual
      ? ports.length
        ? 'Completa lo necesario para continuar'
        : '¿Qué necesitas para este paso?'
      : '¿Apruebas este resultado?');
  const context = step.interaction?.context || step.description;
  const invalid =
    ports.some((p) => fieldError(p, values[p.name] || '')) ||
    (manual &&
      (ports.length
        ? !Object.values(values).some((v) => v.trim())
        : !answer.trim()));
  return (
    <form
      className="human-action"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid && !busy && online) onSubmit();
      }}
      aria-label="Tu decisión"
    >
      <h3 className="action-title">{question}</h3>
      {context &&
        (context.length <= 160 ? (
          <p className="decision-context">{context}</p>
        ) : (
          <details className="decision-help">
            <summary>Ver instrucciones</summary>
            <p>{context}</p>
          </details>
        ))}
      {ports.length > 0 && (
        <DecisionFields
          ports={ports}
          values={values}
          onChange={onValues}
          singleQuestion={!!step.interaction?.question}
        />
      )}
      {manual && !ports.length && (
        <div className="free-answer">
          <label htmlFor="human-answer">Tu respuesta</label>
          <textarea
            id="human-answer"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            maxLength={8000}
            rows={3}
            required
            placeholder="Describe lo que necesitas para este paso…"
          />
        </div>
      )}
      {!manual && (
        <details className="optional-fields">
          <summary>
            Añadir comentario <small>Opcional</small>
          </summary>
          <label htmlFor="human-answer" className="form-sr-only">
            Comentario (opcional al aprobar)
          </label>
          <textarea
            id="human-answer"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            maxLength={8000}
            rows={2}
            placeholder="Añade contexto a tu decisión…"
          />
        </details>
      )}
      <div className="decision-footer">
        <button
          type="submit"
          className="primary full"
          disabled={!!invalid || busy || !online}
        >
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <Check size={16} />
          )}
          {manual
            ? ports.length
              ? 'Guardar elección'
              : 'Enviar respuesta'
            : 'Aprobar paso'}
        </button>
        {!online ? (
          <p className="field-error" role="status">
            Sin conexión. Tus respuestas siguen aquí.
          </p>
        ) : (
          <p className="decision-return">
            Después de guardar, vuelve al chat para continuar.
          </p>
        )}
        {!manual && (
          <button
            type="button"
            className="text-button reject"
            disabled={busy || !online}
            onClick={onReject}
          >
            Rechazar y detener este flujo
          </button>
        )}
      </div>
      {step.interaction?.next && (
        <details className="decision-help decision-next">
          <summary>Qué sucede después</summary>
          <p>{step.interaction.next}</p>
        </details>
      )}
    </form>
  );
}
