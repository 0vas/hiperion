import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
const agent = { role: 'agent' as const, id: 'codex' };
const human = { role: 'human' as const, id: 'local-user' };
const plan = {
  title: 'Recover a task',
  steps: [
    {
      id: 'answer',
      title: 'Decide',
      kind: 'manual',
      outputs: [{ name: 'choice', type: 'string', required: true }],
    },
    {
      id: 'work',
      title: 'Work',
      kind: 'agent',
      dependencies: ['answer'],
      inputs: [
        {
          name: 'choice',
          type: 'string',
          required: true,
          source: { stepId: 'answer', output: 'choice' },
        },
      ],
    },
    { id: 'review', title: 'Review', kind: 'approval', dependencies: ['work'] },
  ],
};
test('recovery preserves the human answer and fences late results from the interrupted attempt', () => {
  let run = createRun(plan, agent.id);
  assert.throws(() =>
    transition(run, { type: 'retry', stepId: 'work' }, human),
  );
  run = transition(
    run,
    { type: 'submit', stepId: 'answer', outputs: { choice: 'Chosen by user' } },
    human,
  );
  run = transition(run, { type: 'retry', stepId: 'work' }, human);
  assert.equal(run.steps[1]!.status, 'ready');
  run = transition(run, { type: 'start', stepId: 'work' }, agent);
  run = transition(
    run,
    { type: 'log', stepId: 'work', message: 'Attempt one evidence' },
    agent,
  );
  run = transition(run, { type: 'retry', stepId: 'work' }, human);
  assert.equal(run.steps[1]!.status, 'ready');
  assert.equal(run.steps[2]!.status, 'blocked');
  assert.deepEqual(run.steps[0]!.outputValues, { choice: 'Chosen by user' });
  assert.ok(run.events.some((e) => e.message === 'Attempt one evidence'));
  run = transition(run, { type: 'start', stepId: 'work' }, agent);
  assert.equal(run.steps[1]!.attempt, 2);
  for (const type of ['complete', 'fail', 'log'] as const) {
    assert.throws(
      () =>
        transition(
          run,
          { type, stepId: 'work', message: 'Old result', attempt: 1 },
          agent,
        ),
      /attempt/i,
    );
    assert.throws(
      () =>
        transition(
          run,
          { type, stepId: 'work', message: 'Unidentified result' },
          agent,
        ),
      /attempt/i,
    );
  }
  run = transition(
    run,
    {
      type: 'complete',
      stepId: 'work',
      message: 'Recovered result',
      attempt: 2,
    },
    agent,
  );
  assert.equal(run.steps[2]!.status, 'waiting');
  assert.throws(() =>
    transition(run, { type: 'retry', stepId: 'answer' }, human),
  );
  assert.throws(() =>
    transition(run, { type: 'retry', stepId: 'work' }, human),
  );
});
