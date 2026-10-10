import { WorkflowError, type Plan } from './workflow.js';

/** Authoring guard, not an NLP parser: do not guess values from free prose. */
function listsChoices(text: string, selection: boolean): boolean {
  return text.split(/[.!?\n]/).some((sentence) => {
    if (!selection && /^\s*(?:escribe|enter)\s/i.test(sentence)) return false;
    const list =
      /^(?:\s*)(?:escribe|elige|selecciona|escoge|choose|select|pick|enter)\s+(.+)$/i.exec(
        sentence,
      )?.[1];
    return !!list && list.includes(',') && /\s(?:o|u|or)\s/i.test(list);
  });
}

/** Only validate newly authored forms. Existing answers and receipts are immutable. */
export function validateHumanForms(plan: Plan, previous?: Plan) {
  for (const step of plan.steps) {
    if (!['manual', 'approval'].includes(step.kind)) continue;
    const old = previous?.steps.find((item) => item.id === step.id);
    if (old && JSON.stringify(old.outputs) === JSON.stringify(step.outputs))
      continue;
    const selection =
      /\b(?:elegir|elige|escoger|escoge|seleccionar|selecciona|choose|select|pick)\b/i.test(
        step.title,
      );
    for (const port of step.outputs || []) {
      if (port.type !== 'string' || port.form?.options) continue;
      if (
        [port.form?.hint, port.form?.placeholder, port.description].some(
          (text) => text && listsChoices(text, selection),
        )
      )
        throw new WorkflowError(
          'CHOICES_REQUIRE_OPTIONS',
          `CHOICES_REQUIRE_OPTIONS: step ${step.id}, output ${port.name}: declare form.options [{value,label}] for the listed choices. Use a separate optional field or a follow-up step for Other / help. Do not ask the user to type a known option.`,
          400,
        );
    }
  }
}
