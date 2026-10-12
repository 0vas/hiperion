import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/server/store.js';
const agent = { role: 'agent' as const, id: 'hermes' };
const plan = {
  title: 'Original',
  request: 'Prepara una guía',
  steps: [{ id: 'draft', title: 'Borrador', kind: 'agent' }],
};
const command = (store: Store, id: string, type: string) =>
  store.command(
    id,
    {
      type,
      stepId: 'draft',
      message: 'Evidencia real',
      commandId: crypto.randomUUID(),
    },
    agent,
  );
test('artifacts are immutable attempt-bound results, persist independently of snapshots, and replay exactly once', () => {
  const store = new Store(':memory:');
  try {
    const run = store.create(plan, agent, 'create');
    command(store, run.id, 'start');
    const upload = {
      commandId: 'artifact',
      stepId: 'draft',
      attempt: 1,
      name: 'guia.md',
      mediaType: 'text/markdown',
      contentBase64: Buffer.from('# Mi guía').toString('base64'),
    };
    const first = store.addArtifact(run.id, upload, agent);
    assert.deepEqual(store.addArtifact(run.id, upload, agent), first);
    assert.equal(first.steps[0]!.artifacts?.length, 1);
    const artifact = first.steps[0]!.artifacts![0]!;
    assert.equal(
      Buffer.from(
        store.artifactContent(run.id, artifact.id).content,
      ).toString(),
      '# Mi guía',
    );
    assert.equal(store.get(run.id).steps[0]!.artifacts![0]!.sha256?.length, 64);
    assert.throws(
      () => store.addArtifact(run.id, { ...upload, name: 'other.md' }, agent),
      /Idempotency/,
    );
    assert.throws(
      () =>
        store.addArtifact(
          run.id,
          { ...upload, commandId: 'other' },
          { role: 'human', id: 'person' },
        ),
      /coordinator/,
    );
    command(store, run.id, 'fail');
    command(store, run.id, 'retry');
    command(store, run.id, 'start');
    assert.throws(
      () => store.addArtifact(run.id, { ...upload, commandId: 'stale' }, agent),
      /attempt/,
    );
    assert.equal(store.get(run.id).steps[0]!.artifacts!.length, 1);
  } finally {
    store.close();
  }
});
test('a requested new cycle links completed runs without rewriting history and remains idempotent', () => {
  const store = new Store(':memory:');
  try {
    const run = store.create(plan, agent, 'parent');
    assert.throws(
      () => store.create(plan, agent, 'too-early', run.id),
      /completed/,
    );
    command(store, run.id, 'start');
    command(store, run.id, 'complete');
    const before = store.get(run.id);
    const next = {
      ...plan,
      title: 'Publicar guía',
      request: 'Ahora prepara una versión para compartir',
    };
    const child = store.create(next, agent, 'next', run.id);
    assert.deepEqual(store.get(run.id), before);
    assert.deepEqual(store.create(next, agent, 'next', run.id), child);
    assert.equal(child.origin?.runId, run.id);
    assert.equal(store.links(run.id).next.length, 1);
    assert.equal(store.links(child.id).previous?.id, run.id);
    assert.throws(
      () =>
        store.create(
          { ...next, request: undefined },
          agent,
          'no-request',
          run.id,
        ),
      /request/,
    );
    assert.throws(
      () =>
        store.create(next, { role: 'human', id: 'person' }, 'human', run.id),
      /agent/,
    );
    assert.equal(child.status, 'active');
  } finally {
    store.close();
  }
});
