import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/server/store.js';
const agent = { role: 'agent' as const, id: 'codex' };
const plan = {
  title: 'Durable work',
  steps: [{ id: 'one', title: 'One', kind: 'agent' }],
};

test('SQLite persists execution across restarts and deduplicates exact commands', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hyperion-test-'));
  let db = new Store(join(dir, 'test.sqlite'));
  try {
    const run = db.create(plan, agent, 'create-1');
    assert.equal(db.create(plan, agent, 'create-1').id, run.id);
    const command = { type: 'start', stepId: 'one', commandId: 'command-1' };
    const started = db.command(run.id, command, agent);
    assert.deepEqual(db.command(run.id, command, agent), started);
    assert.throws(
      () =>
        db.command(
          run.id,
          { ...command, type: 'complete', message: 'Result' },
          agent,
        ),
      /idempotency/i,
    );
    db.close();
    db = new Store(join(dir, 'test.sqlite'));
    assert.equal(db.get(run.id).steps[0]!.status, 'running');
    assert.equal(db.get(run.id).events.length, started.events.length);
    assert.equal(db.list().length, 1);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('failed commands roll back and do not consume the idempotency key', () => {
  const db = new Store(':memory:');
  try {
    const run = db.create(plan, agent, 'create');
    assert.throws(() =>
      db.command(
        run.id,
        {
          type: 'complete',
          stepId: 'one',
          message: 'Done',
          commandId: 'retryable',
        },
        agent,
      ),
    );
    db.command(
      run.id,
      { type: 'start', stepId: 'one', commandId: 'start' },
      agent,
    );
    assert.equal(
      db.command(
        run.id,
        {
          type: 'complete',
          stepId: 'one',
          message: 'Done',
          commandId: 'retryable',
        },
        agent,
      ).status,
      'completed',
    );
  } finally {
    db.close();
  }
});
