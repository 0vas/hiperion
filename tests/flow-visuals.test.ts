import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
import { routeState, nodeState } from '../src/client/flow-visuals.js';
const agent = { id: 'codex', role: 'agent' as const };
test('routes show execution, human handoff and history without animating pending work', () => {
  let run = createRun(
    {
      title: 'Visual',
      steps: [
        { id: 'a', title: 'A', kind: 'agent' },
        { id: 'b', title: 'B', kind: 'agent', dependencies: ['a'] },
        { id: 'c', title: 'C', kind: 'manual', dependencies: ['b'] },
      ],
    },
    'codex',
  );
  assert.equal(routeState(run, 'a', 'b'), 'pending');
  run = transition(run, { type: 'start', stepId: 'a' }, agent);
  assert.equal(routeState(run, 'a', 'b'), 'pending');
  run = transition(
    run,
    { type: 'complete', stepId: 'a', message: 'A done' },
    agent,
  );
  assert.equal(routeState(run, 'a', 'b'), 'ready');
  run = transition(run, { type: 'start', stepId: 'b' }, agent);
  assert.equal(routeState(run, 'a', 'b'), 'active');
  assert.equal(routeState({ ...run, status: 'paused' }, 'a', 'b'), 'paused');
  assert.equal(nodeState(run.steps[1]!, 'paused'), 'paused');
  assert.equal(
    routeState({ ...run, status: 'cancelled' }, 'a', 'b'),
    'stopped',
  );
  run = transition(
    run,
    { type: 'complete', stepId: 'b', message: 'B done' },
    agent,
  );
  assert.equal(routeState(run, 'a', 'b'), 'completed');
  assert.equal(routeState(run, 'b', 'c'), 'attention');
  run.steps[2]!.status = 'failed';
  assert.equal(routeState(run, 'b', 'c'), 'error');
  run.steps[2]!.status = 'skipped';
  assert.equal(routeState(run, 'b', 'c'), 'skipped');
});
test('collapsed routes follow real crossing dependencies instead of an aggregated job status', () => {
  let run = createRun(
    {
      title: 'Jobs',
      jobs: [
        { id: 'one', title: 'One' },
        { id: 'two', title: 'Two' },
      ],
      steps: [
        { id: 'a', title: 'A', kind: 'agent', jobId: 'one' },
        {
          id: 'b',
          title: 'B',
          kind: 'agent',
          jobId: 'two',
          dependencies: ['a'],
        },
        {
          id: 'c',
          title: 'C',
          kind: 'agent',
          jobId: 'two',
          dependencies: ['b'],
        },
      ],
    },
    'codex',
  );
  run = transition(run, { type: 'start', stepId: 'a' }, agent);
  run = transition(run, { type: 'complete', stepId: 'a', message: 'A' }, agent);
  run = transition(run, { type: 'start', stepId: 'b' }, agent);
  assert.equal(routeState(run, 'job:one', 'job:two'), 'active');
  run = transition(run, { type: 'complete', stepId: 'b', message: 'B' }, agent);
  run = transition(run, { type: 'start', stepId: 'c' }, agent);
  assert.equal(routeState(run, 'job:one', 'job:two'), 'completed');
});

test('information current traverses reached routes up to the frontier, and stops with the process', async () => {
  const { carriesCurrent } = await import('../src/client/flow-visuals.js');
  for (const state of ['completed', 'ready', 'active', 'attention'] as const) {
    assert.equal(carriesCurrent(state, 'active', true, false), true);
    for (const status of [
      'paused',
      'completed',
      'cancelled',
      'rejected',
    ] as const)
      assert.equal(carriesCurrent(state, status, true, false), false);
    assert.equal(carriesCurrent(state, 'active', false, false), false);
    assert.equal(carriesCurrent(state, 'active', true, true), false);
  }
  for (const state of [
    'pending',
    'skipped',
    'error',
    'paused',
    'stopped',
  ] as const)
    assert.equal(carriesCurrent(state, 'active', true, false), false);
});
