import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';

const agent = { role: 'agent' as const, id: 'codex' };
const human = { role: 'human' as const, id: 'local-user' };
const plan = {
  title: 'A human-guided workflow',
  steps: [
    { id: 'research', title: 'Research', kind: 'agent', dependencies: [] },
    { id: 'checks', title: 'Checks', kind: 'agent', dependencies: [] },
    {
      id: 'input',
      title: 'Choose a direction',
      kind: 'manual',
      dependencies: ['research', 'checks'],
    },
    {
      id: 'approve',
      title: 'Approve delivery',
      kind: 'approval',
      dependencies: ['input'],
    },
    {
      id: 'deliver',
      title: 'Deliver',
      kind: 'agent',
      dependencies: ['approve'],
    },
  ],
};
const state = (run: ReturnType<typeof createRun>, id: string) =>
  run.steps.find((s) => s.id === id)!.status;
const cmd = (
  type: string,
  stepId?: string,
  message = 'Evidence from actual execution',
) => ({ type, stepId, message });

test('independent steps can run concurrently; joins wait for both results', () => {
  let run = createRun(plan, agent.id);
  run = transition(run, cmd('start', 'research'), agent);
  run = transition(run, cmd('start', 'checks'), agent);
  assert.equal(state(run, 'research'), 'running');
  assert.equal(state(run, 'checks'), 'running');
  run = transition(run, cmd('complete', 'research'), agent);
  assert.equal(state(run, 'input'), 'blocked');
  run = transition(run, cmd('complete', 'checks'), agent);
  assert.equal(state(run, 'input'), 'waiting');
});

test('human input and approval gate agent execution through the whole workflow', () => {
  let run = createRun(plan, agent.id);
  for (const id of ['research', 'checks']) {
    run = transition(run, cmd('start', id), agent);
    run = transition(run, cmd('complete', id), agent);
  }
  assert.throws(() => transition(run, cmd('submit', 'input'), agent), /human/i);
  run = transition(
    run,
    cmd('submit', 'input', 'Build a local prototype'),
    human,
  );
  assert.throws(
    () => transition(run, cmd('approve', 'approve'), agent),
    /human/i,
  );
  assert.throws(
    () => transition(run, cmd('start', 'deliver'), agent),
    /ready/i,
  );
  run = transition(run, cmd('approve', 'approve'), human);
  run = transition(run, cmd('start', 'deliver'), agent);
  run = transition(run, cmd('complete', 'deliver'), agent);
  assert.equal(run.status, 'completed');
  assert.equal(
    run.steps.find((s) => s.id === 'input')!.result,
    'Build a local prototype',
  );
});

test('invalid plans reject duplicate IDs, cycles, missing dependencies and empty steps', () => {
  for (const steps of [
    [],
    [plan.steps[0], plan.steps[0]],
    [{ id: 'a', title: 'A', kind: 'agent', dependencies: ['a'] }],
    [
      { id: 'a', title: 'A', kind: 'agent', dependencies: ['b'] },
      { id: 'b', title: 'B', kind: 'agent', dependencies: ['a'] },
    ],
    [{ id: 'a', title: 'A', kind: 'agent', dependencies: ['missing'] }],
  ]) {
    assert.throws(() => createRun({ title: 'Invalid', steps }, agent.id));
  }
});

test('coordinator identity and step kind are enforced', () => {
  const run = createRun(plan, agent.id);
  assert.throws(
    () =>
      transition(run, cmd('start', 'research'), { role: 'agent', id: 'other' }),
    /coordinator/i,
  );
  assert.throws(
    () => transition(run, cmd('start', 'research'), human),
    /agent/i,
  );
  assert.throws(() => transition(run, cmd('approve', 'research'), human));
});

test('running steps require evidence, and cannot be started twice', () => {
  const run = transition(
    createRun(plan, agent.id),
    cmd('start', 'research'),
    agent,
  );
  assert.throws(() => transition(run, cmd('start', 'research'), agent));
  assert.throws(() =>
    transition(run, cmd('complete', 'research', '  '), agent),
  );
  const logged = transition(
    run,
    cmd('log', 'research', 'Read repository files'),
    agent,
  );
  assert.equal(logged.events.at(-1)!.message, 'Read repository files');
  assert.equal(run.events.length + 1, logged.events.length);
});

test('pause blocks dispatch, allows an in-flight result, and resumes explicitly', () => {
  let run = transition(
    createRun(plan, agent.id),
    cmd('start', 'research'),
    agent,
  );
  run = transition(run, cmd('pause'), human);
  assert.throws(
    () => transition(run, cmd('start', 'checks'), agent),
    /paused/i,
  );
  run = transition(run, cmd('complete', 'research'), agent);
  assert.equal(run.status, 'paused');
  run = transition(run, cmd('resume'), human);
  assert.equal(
    state(transition(run, cmd('start', 'checks'), agent), 'checks'),
    'running',
  );
});

test('failure and retry preserve attempt history and block dependents', () => {
  let run = transition(
    createRun(plan, agent.id),
    cmd('start', 'research'),
    agent,
  );
  run = transition(run, cmd('fail', 'research', 'Tool failed'), agent);
  assert.equal(state(run, 'input'), 'blocked');
  run = transition(run, cmd('retry', 'research'), agent);
  run = transition(run, cmd('start', 'research'), agent);
  assert.equal(run.steps.find((s) => s.id === 'research')!.attempt, 2);
  assert.ok(
    run.events.some((e) => e.type === 'fail' && e.message === 'Tool failed'),
  );
});

test('rejection and cancellation are terminal and revision conflicts are rejected', () => {
  let run = createRun(
    {
      title: 'Approval',
      steps: [{ id: 'gate', title: 'Gate', kind: 'approval' }],
    },
    agent.id,
  );
  assert.throws(
    () =>
      transition(
        run,
        { ...cmd('approve', 'gate'), expectedRevision: 0 },
        human,
      ),
    /revision/i,
  );
  run = transition(run, cmd('reject', 'gate', 'Needs changes'), human);
  assert.equal(run.status, 'rejected');
  assert.throws(
    () => transition(run, cmd('approve', 'gate'), human),
    /terminal/i,
  );
  run = transition(createRun(plan, agent.id), cmd('cancel'), human);
  assert.throws(
    () => transition(run, cmd('start', 'research'), agent),
    /terminal/i,
  );
});

test('untrusted payload properties and unknown commands are rejected', () => {
  assert.throws(() => createRun({ ...plan, status: 'completed' }, agent.id));
  assert.throws(() =>
    transition(createRun(plan, agent.id), { type: 'delete-everything' }, agent),
  );
});
