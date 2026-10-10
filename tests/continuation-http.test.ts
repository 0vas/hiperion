import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/server/store.js';
import { createApp } from '../src/server/app.js';
import { HyperionClient } from '../src/adapters/client.js';
import { dispatchOnce } from '../src/adapters/continuation-worker.js';

test('HTTP continuation resumes saved input through an independent connector without a waiting chat', async () => {
  const store = new Store(':memory:');
  const app = createApp({
    store,
    agentToken: 'agent',
    humanToken: 'human',
    agentId: 'hermes',
  });
  const url = await app.listen(0);
  const client = new HyperionClient({ url, token: 'agent' });
  const human = new HyperionClient({ url, token: 'human' });
  try {
    const run = await client.create({
      title: 'Resume',
      steps: [
        {
          id: 'choice',
          title: 'Choose',
          kind: 'manual',
          outputs: [
            {
              name: 'choice',
              type: 'string',
              required: true,
              form: {
                options: [
                  { value: 'a', label: 'A' },
                  { value: 'b', label: 'B' },
                ],
              },
            },
          ],
        },
        {
          id: 'use',
          title: 'Use decision',
          kind: 'agent',
          dependencies: ['choice'],
          inputs: [
            {
              name: 'choice',
              type: 'string',
              required: true,
              source: { stepId: 'choice', output: 'choice' },
            },
          ],
        },
      ],
    });
    await assert.rejects(
      () =>
        human.suspend(run.id, {
          expectedRevision: run.revision,
          connector: {
            id: 'connector',
            harness: 'hermes',
            sessionId: 'private-session',
            scope: 'managed-session',
            capabilities: { resume: true, idempotentDelivery: true },
          },
        }),
      /coordinator|agent/,
    );
    const suspended = await client.suspend(run.id, {
      expectedRevision: run.revision,
      connector: {
        id: 'connector',
        harness: 'hermes',
        sessionId: 'private-session',
        scope: 'managed-session',
        capabilities: { resume: true, idempotentDelivery: true },
      },
    });
    assert.equal(suspended.continuation?.status, 'waiting');
    assert.equal(suspended.agentWaiting, false);
    assert.ok(
      !JSON.stringify(await human.get(run.id)).includes('private-session'),
    );
    await human.command(run.id, {
      type: 'submit',
      stepId: 'choice',
      expectedRevision: run.revision,
      commandId: 'answer',
      outputs: { choice: 'b' },
    });
    assert.equal((await client.get(run.id)).continuation?.status, 'queued');
    await assert.rejects(() => human.claimContinuation('connector'), /agent/);
    let turns = 0;
    const connector = {
      id: 'connector',
      async resume(
        delivery: { sessionId: string },
        current: Awaited<ReturnType<typeof client.get>>,
      ) {
        turns++;
        assert.equal(delivery.sessionId, 'private-session');
        assert.equal(current.steps[1]?.inputValues?.choice, 'b');
        return { outcome: 'accepted' as const };
      },
    };
    assert.equal(await dispatchOnce(client, connector), true);
    assert.equal(await dispatchOnce(client, connector), false);
    assert.equal(turns, 1);
    assert.equal((await human.get(run.id)).continuation?.status, 'delivered');
    // Acceptance alone never fabricates an execution.
    assert.equal((await human.get(run.id)).steps[1]?.status, 'ready');
  } finally {
    await app.close();
    store.close();
  }
});

test('ambiguous connector exceptions retain the lease instead of triggering another turn', async () => {
  let settlements = 0;
  const client = {
    claimContinuation: async () => ({
      id: 'delivery',
      runId: 'run',
      leaseToken: 'lease',
    }),
    get: async () => ({
      status: 'active',
      steps: [{ kind: 'agent', status: 'ready' }],
    }),
    settleContinuation: async () => {
      settlements++;
    },
  };
  await assert.rejects(
    () =>
      dispatchOnce(client as unknown as HyperionClient, {
        id: 'connector',
        async resume() {
          throw new Error('connection lost after send');
        },
      }),
    /connection lost/,
  );
  assert.equal(settlements, 0);
});
