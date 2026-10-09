import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/domain/workflow.js';
import { fieldError, parseField } from '../src/client/decision-form.js';

test('field guidance is optional and never changes output types or selects an answer', () => {
  const run = createRun(
    {
      title: 'Review',
      steps: [
        {
          id: 'review',
          title: 'Choose',
          kind: 'manual',
          outputs: [
            {
              name: 'include',
              type: 'boolean',
              required: true,
              description: 'Include examples',
              form: {
                label: '¿Añadimos ejemplos?',
                hint: 'Se incluirán en la guía.',
                trueLabel: 'Incluir',
                falseLabel: 'Omitir',
              },
            },
          ],
        },
      ],
    },
    'codex',
  );
  const port = run.steps[0]!.outputs![0]!;
  assert.equal(port.form?.label, '¿Añadimos ejemplos?');
  assert.equal(run.steps[0]!.outputValues, undefined);
  assert.equal(fieldError(port, ''), 'Elige una opción.');
  assert.equal(fieldError(port, 'false'), undefined);
  assert.equal(parseField(port, 'false'), false);
});
test('form validation preserves zero and flags malformed typed data before submission', () => {
  const number = {
    name: 'count',
    type: 'number' as const,
    required: true,
    description: '',
  };
  assert.equal(fieldError(number, '0'), undefined);
  assert.equal(parseField(number, '01'), 1);
  assert.equal(fieldError(number, 'no'), 'Escribe un número válido.');
  const object = { ...number, type: 'object' as const };
  assert.ok(fieldError(object, '[]'));
  assert.ok(fieldError(object, '{'));
  assert.equal(fieldError(object, '{"ok":true}'), undefined);
  assert.equal(fieldError({ ...object, required: false }, ''), undefined);
});
