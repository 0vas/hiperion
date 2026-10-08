import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
import { attentionStep } from '../src/client/attention.js';
test('attention keeps parallel focus, yields to human input and ends without inventing work', () => {
  let run = createRun(
    {
      title: 'Focus',
      steps: [
        { id: 'a', title: 'A', kind: 'agent' },
        { id: 'b', title: 'B', kind: 'agent' },
        { id: 'human', title: 'Choose', kind: 'manual', dependencies: ['a'] },
      ],
    },
    'codex',
  );
  assert.equal(attentionStep(run.steps, 'b')?.id, 'b');
  run = transition(
    run,
    { type: 'start', stepId: 'a' },
    { id: 'codex', role: 'agent' },
  );
  assert.equal(attentionStep(run.steps, 'b')?.id, 'a');
  run = transition(
    run,
    { type: 'complete', stepId: 'a', message: 'Done' },
    { id: 'codex', role: 'agent' },
  );
  assert.equal(attentionStep(run.steps, 'b')?.id, 'human');
  assert.equal(
    attentionStep(
      run.steps.map((s) => ({ ...s, status: 'completed' as const })),
    ),
    undefined,
  );
});
