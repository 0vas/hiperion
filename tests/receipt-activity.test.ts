import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
import { changedReceipts, mergeRuns } from '../src/client/receipt-activity.js';
test('only real new records and values trigger receipt signals; older snapshots never rewind state', () => {
  const agent = { role: 'agent' as const, id: 'codex' };
  const first = createRun(
    {
      title: 'Receipts',
      steps: [
        {
          id: 'a',
          title: 'A',
          kind: 'agent',
          outputs: [{ name: 'value', type: 'string', required: true }],
        },
        { id: 'b', title: 'B', kind: 'agent', dependencies: ['a'] },
      ],
    },
    'codex',
  );
  const running = transition(first, { type: 'start', stepId: 'a' }, agent);
  const log = transition(
    running,
    { type: 'log', stepId: 'a', message: 'Observed real work' },
    agent,
  );
  assert.deepEqual(changedReceipts(running, log, 100), {
    process: 100,
    logs: { a: 100 },
    io: {},
  });
  assert.deepEqual(changedReceipts(log, log, 200), {
    process: 0,
    logs: {},
    io: {},
  });
  const done = transition(
    log,
    {
      type: 'complete',
      stepId: 'a',
      message: 'Verified',
      outputs: { value: 'result' },
    },
    agent,
  );
  assert.deepEqual(Object.keys(changedReceipts(log, done, 300).io).sort(), [
    'a',
    'b',
  ]);
  assert.equal(mergeRuns([done], [first])[0]!.revision, done.revision);
});

test('live agent presence updates at the same workflow revision without replaying an older observation', () => {
  const base = createRun(
    { title: 'Presence', steps: [{ id: 'a', title: 'A', kind: 'agent' }] },
    'codex',
  );
  const initial = { ...base, agentWaiting: false, agentPresenceAt: 1 };
  const waiting = { ...base, agentWaiting: true, agentPresenceAt: 2 };
  const updated = mergeRuns([initial], [waiting]);
  assert.equal(updated[0]!.agentWaiting, true);
  assert.equal(updated[0]!.revision, base.revision);
  assert.equal(mergeRuns(updated, [initial])[0]!.agentWaiting, true);
});
