import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  createRun,
  transition,
  commandSchema,
  planSchema,
  WorkflowError,
  type Principal,
  type Run,
} from '../domain/workflow.js';
const keySchema = z.string().min(1).max(128);

/** One transaction covers the snapshot and its idempotent command receipt. */
export class Store {
  private db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts (scope TEXT NOT NULL, key TEXT NOT NULL, fingerprint TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(scope,key));
      PRAGMA user_version=1;`);
  }
  private transact(
    scope: string,
    key: string,
    payload: unknown,
    action: () => Run,
  ): Run {
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const previous = this.db
        .prepare(
          'SELECT fingerprint,response FROM receipts WHERE scope=? AND key=?',
        )
        .get(scope, key);
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new WorkflowError(
            'IDEMPOTENCY_CONFLICT',
            'Idempotency key reused with different content',
          );
        this.db.exec('COMMIT');
        return JSON.parse(previous.response as string) as Run;
      }
      const run = action();
      const data = JSON.stringify(run);
      this.db
        .prepare(
          'INSERT INTO runs(id,snapshot,created_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot',
        )
        .run(run.id, data, run.createdAt);
      this.db
        .prepare(
          'INSERT INTO receipts(scope,key,fingerprint,response) VALUES(?,?,?,?)',
        )
        .run(scope, key, fingerprint, data);
      this.db.exec('COMMIT');
      return run;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  create(input: unknown, actor: Principal, key: string): Run {
    if (actor.role !== 'agent')
      throw new WorkflowError('FORBIDDEN', 'An agent creates the plan', 403);
    const plan = planSchema.parse(input);
    return this.transact('create', keySchema.parse(key), { plan, actor }, () =>
      createRun(plan, actor.id),
    );
  }
  command(id: string, input: unknown, actor: Principal): Run {
    const command = commandSchema.parse(input);
    const key = keySchema.parse(command.commandId);
    return this.transact(id, key, { command, actor }, () =>
      transition(this.get(id), command, actor),
    );
  }
  get(id: string): Run {
    const row = this.db.prepare('SELECT snapshot FROM runs WHERE id=?').get(id);
    if (!row) throw new WorkflowError('NOT_FOUND', 'Run not found', 404);
    return JSON.parse(row.snapshot as string) as Run;
  }
  list(): Run[] {
    return this.db
      .prepare('SELECT snapshot FROM runs ORDER BY created_at DESC LIMIT 100')
      .all()
      .map((row) => JSON.parse(row.snapshot as string) as Run);
  }
  close() {
    this.db.close();
  }
}
