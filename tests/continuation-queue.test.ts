import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/server/store.js';
const human = { role: 'human' as const, id: 'user' };
const plan = {
  title: 'Durable decision',
  steps: [
    {
      id: 'answer',
      title: 'Choose',
      kind: 'manual',
      outputs: [
        {
          name: 'choice',
          type: 'string',
          required: true,
          form: {
            options: [
              { value: 'yes', label: 'Sí' },
              { value: 'no', label: 'No' },
            ],
          },
        },
      ],
    },
    {
      id: 'work',
      title: 'Use saved input',
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
  ],
};
const connector = (harness: string) => ({
  id: 'bridge',
  harness,
  sessionId: 'session-123',
  scope: 'managed-session' as const,
  capabilities: { resume: true, idempotentDelivery: true },
});
for (const harness of [
  'codex',
  'chatgpt',
  'claude',
  'claude-code',
  'cursor',
  'hermes',
  'independent-tool',
]) {
  test(`durable continuation is independent of ${harness} and survives process restart`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'hyperion-outbox-'));
    const path = join(directory, 'db.sqlite');
    const actor = { role: 'agent' as const, id: harness };
    let store = new Store(path);
    try {
      const run = store.create(plan, actor, 'create');
      store.continuations.suspend(
        run.id,
        { expectedRevision: run.revision, connector: connector(harness) },
        actor,
      );
      assert.equal(store.continuations.state(run.id)?.status, 'waiting');
      store.close();
      store = new Store(path);
      const command = {
        type: 'submit',
        stepId: 'answer',
        outputs: { choice: 'no' },
        expectedRevision: run.revision,
        commandId: 'submit',
      };
      store.command(run.id, command, human);
      store.command(run.id, command, human);
      assert.equal(store.continuations.state(run.id)?.status, 'queued');
      assert.equal(store.get(run.id).steps[1]!.attempt, 0);
      store.close();
      store = new Store(path);
      assert.throws(
        () =>
          store.continuations.claim('bridge', { role: 'human', id: 'user' }),
        /agent/i,
      );
      assert.equal(
        store.continuations.claim('bridge', { role: 'agent', id: 'other' }),
        null,
      );
      const job = store.continuations.claim('bridge', actor)!;
      assert.equal(job.harness, harness);
      assert.equal(job.sessionId, 'session-123');
      assert.equal(store.continuations.claim('bridge', actor), null);
      assert.equal(store.get(job.runId).steps[1]!.inputValues!.choice, 'no');
      store.continuations.settle(
        job.id,
        { leaseToken: job.leaseToken, outcome: 'accepted' },
        actor,
      );
      store.continuations.settle(
        job.id,
        { leaseToken: job.leaseToken, outcome: 'accepted' },
        actor,
      );
      assert.equal(store.continuations.state(run.id)?.status, 'delivered');
      assert.equal(store.get(run.id).steps[1]!.status, 'ready'); // Delivery is not execution.
    } finally {
      store.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
test('suspension needs a declared resumable connector, current revision, and the owning agent', () => {
  const store = new Store(':memory:');
  const actor = { role: 'agent' as const, id: 'codex' };
  try {
    const run = store.create(plan, actor, 'create');
    assert.throws(
      () =>
        store.continuations.suspend(
          run.id,
          {
            expectedRevision: 1,
            connector: {
              ...connector('codex'),
              capabilities: { resume: false, idempotentDelivery: true },
            },
          },
          actor,
        ),
      /resume|capabilit/i,
    );
    assert.throws(
      () =>
        store.continuations.suspend(
          run.id,
          { expectedRevision: 0, connector: connector('codex') },
          actor,
        ),
      /revision/i,
    );
    assert.throws(
      () =>
        store.continuations.suspend(
          run.id,
          { expectedRevision: 1, connector: connector('codex') },
          { role: 'agent', id: 'cursor' },
        ),
      /coordinator/i,
    );
    store.command(
      run.id,
      {
        type: 'submit',
        stepId: 'answer',
        outputs: { choice: 'yes' },
        expectedRevision: 1,
        commandId: 'answer',
      },
      human,
    );
    assert.throws(
      () =>
        store.continuations.suspend(
          run.id,
          { expectedRevision: 2, connector: connector('codex') },
          actor,
        ),
      /ready|waiting/i,
    );
  } finally {
    store.close();
  }
});
test('pause cancels queued delivery, resume enqueues it once, and expired leases require reconciliation', () => {
  let now = 1000;
  const store = new Store(':memory:', { now: () => now });
  const actor = { role: 'agent' as const, id: 'codex' };
  try {
    let run = store.create(plan, actor, 'create');
    store.continuations.suspend(
      run.id,
      { expectedRevision: 1, connector: connector('codex') },
      actor,
    );
    run = store.command(
      run.id,
      {
        type: 'submit',
        stepId: 'answer',
        outputs: { choice: 'yes' },
        expectedRevision: 1,
        commandId: 'answer',
      },
      human,
    );
    run = store.command(
      run.id,
      { type: 'pause', expectedRevision: run.revision, commandId: 'pause' },
      human,
    );
    assert.equal(store.continuations.claim('bridge', actor), null);
    run = store.command(
      run.id,
      { type: 'resume', expectedRevision: run.revision, commandId: 'resume' },
      human,
    );
    const job = store.continuations.claim('bridge', actor)!;
    now += 301000;
    assert.equal(store.continuations.claim('bridge', actor), null);
    assert.equal(store.continuations.state(run.id)?.status, 'uncertain');
    assert.equal(store.continuations.pending('bridge', actor)[0]?.id, job.id);
    assert.equal(
      store.continuations.pending('bridge', { role: 'agent', id: 'other' })
        .length,
      0,
    );
    assert.throws(
      () =>
        store.continuations.settle(
          job.id,
          { leaseToken: job.leaseToken, outcome: 'accepted' },
          actor,
        ),
      /reconcil/i,
    );
    store.continuations.settle(
      job.id,
      {
        leaseToken: job.leaseToken,
        outcome: 'failed',
        reconciled: true,
        message: 'Verified no turn was started',
      },
      actor,
    );
    run = store.command(
      run.id,
      {
        type: 'retry',
        stepId: 'work',
        expectedRevision: run.revision,
        commandId: 'retry',
      },
      human,
    );
    const next = store.continuations.claim('bridge', actor)!;
    assert.notEqual(next.id, job.id);
    assert.throws(
      () =>
        store.continuations.settle(
          next.id,
          { leaseToken: job.leaseToken, outcome: 'accepted' },
          actor,
        ),
      /lease/i,
    );
    store.command(
      run.id,
      { type: 'cancel', expectedRevision: run.revision, commandId: 'cancel' },
      human,
    );
    assert.throws(
      () =>
        store.continuations.settle(
          next.id,
          { leaseToken: next.leaseToken, outcome: 'accepted' },
          actor,
        ),
      /cancel|deliver/i,
    );
  } finally {
    store.close();
  }
});

test('a fast execution can finish before dispatch acknowledgement without losing the receipt', () => {
  const store = new Store(':memory:');
  const actor = { role: 'agent' as const, id: 'codex' };
  try {
    let run = store.create(plan, actor, 'create');
    store.continuations.suspend(
      run.id,
      { expectedRevision: 1, connector: connector('codex') },
      actor,
    );
    run = store.command(
      run.id,
      {
        type: 'submit',
        stepId: 'answer',
        outputs: { choice: 'yes' },
        expectedRevision: 1,
        commandId: 'answer',
      },
      human,
    );
    const job = store.continuations.claim('bridge', actor)!;
    store.command(
      run.id,
      { type: 'start', stepId: 'work', commandId: 'start' },
      actor,
    );
    store.command(
      run.id,
      {
        type: 'complete',
        stepId: 'work',
        message: 'Used saved choice',
        commandId: 'done',
      },
      actor,
    );
    store.continuations.settle(
      job.id,
      { leaseToken: job.leaseToken, outcome: 'accepted' },
      actor,
    );
    assert.equal(store.continuations.state(run.id)?.status, 'delivered');
  } finally {
    store.close();
  }
});

test('a failed commit rolls back the human answer, command receipt and queued delivery together', () => {
  const store = new Store(':memory:');
  const actor = { role: 'agent' as const, id: 'codex' };
  try {
    const run = store.create(plan, actor, 'create');
    store.continuations.suspend(
      run.id,
      { expectedRevision: 1, connector: connector('codex') },
      actor,
    );
    const hook = store.continuations.onRunChanged.bind(store.continuations);
    store.continuations.onRunChanged = (updated, command) => {
      hook(updated, command);
      throw new Error('disk transaction failed');
    };
    const command = {
      type: 'submit',
      stepId: 'answer',
      outputs: { choice: 'yes' },
      expectedRevision: 1,
      commandId: 'answer',
    };
    assert.throws(
      () => store.command(run.id, command, human),
      /transaction failed/,
    );
    assert.equal(store.get(run.id).revision, 1);
    assert.equal(store.continuations.state(run.id)?.status, 'waiting');
    assert.equal(store.continuations.claim('bridge', actor), null);
    store.continuations.onRunChanged = hook;
    store.command(run.id, command, human);
    assert.equal(store.continuations.state(run.id)?.status, 'queued');
  } finally {
    store.close();
  }
});
