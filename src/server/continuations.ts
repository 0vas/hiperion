import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  claimSchema,
  settleSchema,
  suspendSchema,
  type Connector,
  type ContinuationState,
  type Delivery,
} from '../domain/continuation.js';
import { WorkflowError, type Principal, type Run } from '../domain/workflow.js';

type Binding = {
  runId: string;
  owner: string;
  connector: Connector;
  armed: boolean;
  updatedAt: number;
};
type Job = Delivery & {
  owner: string;
  status: ContinuationState['status'];
  updatedAt: number;
  message?: string;
};
const ready = (run: Run) =>
  run.steps.some((s) => s.kind === 'agent' && s.status === 'ready');
const denied = (message: string) =>
  new WorkflowError('CONTINUATION_CONFLICT', message);

/** Durable outbox. Snapshot, receipt and enqueue share Store's transaction. */
export class ContinuationQueue {
  constructor(
    private db: DatabaseSync,
    private getRun: (id: string) => Run,
    private now: () => number = Date.now,
  ) {
    db.exec(`CREATE TABLE IF NOT EXISTS continuation_bindings (run_id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS continuation_jobs (id TEXT PRIMARY KEY, run_id TEXT NOT NULL, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS continuation_run ON continuation_jobs(run_id);`);
  }
  private atomic<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  private binding(id: string): Binding | undefined {
    const row = this.db
      .prepare('SELECT data FROM continuation_bindings WHERE run_id=?')
      .get(id);
    return row ? (JSON.parse(row.data as string) as Binding) : undefined;
  }
  private saveBinding(value: Binding) {
    this.db
      .prepare(
        'INSERT INTO continuation_bindings VALUES(?,?) ON CONFLICT(run_id) DO UPDATE SET data=excluded.data',
      )
      .run(value.runId, JSON.stringify(value));
  }
  private jobs(runId?: string): Job[] {
    const rows = runId
      ? this.db
          .prepare(
            'SELECT data FROM continuation_jobs WHERE run_id=? ORDER BY rowid',
          )
          .all(runId)
      : this.db
          .prepare('SELECT data FROM continuation_jobs ORDER BY rowid')
          .all();
    return rows.map((row) => JSON.parse(row.data as string) as Job);
  }
  private save(job: Job) {
    this.db
      .prepare(
        'INSERT INTO continuation_jobs VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
      )
      .run(job.id, job.runId, JSON.stringify(job));
  }
  private authorize(actor: Principal, owner?: string) {
    if (actor.role !== 'agent')
      throw new WorkflowError(
        'FORBIDDEN',
        'Only an agent can consume continuations',
        403,
      );
    if (owner && actor.id !== owner)
      throw new WorkflowError(
        'FORBIDDEN',
        'Only the coordinator can manage continuation',
        403,
      );
  }
  suspend(runId: string, input: unknown, actor: Principal): ContinuationState {
    const data = suspendSchema.parse(input);
    return this.atomic(() => {
      const run = this.getRun(runId);
      this.authorize(actor, run.coordinator);
      if (run.revision !== data.expectedRevision)
        throw denied('Current revision required');
      if (
        run.status !== 'active' ||
        ready(run) ||
        run.steps.some((s) => s.status === 'running') ||
        !run.steps.some((s) => s.status === 'waiting')
      )
        throw denied(
          'Suspend only while waiting for human input, with no ready or running agent work',
        );
      const binding = this.binding(runId);
      const last = this.jobs(runId).at(-1);
      if (last && ['queued', 'leased', 'uncertain'].includes(last.status))
        throw denied('Reconcile outstanding delivery before suspending');
      if (
        binding?.armed &&
        JSON.stringify(binding.connector) !== JSON.stringify(data.connector)
      )
        throw denied('An armed connector cannot be replaced');
      this.saveBinding({
        runId,
        owner: actor.id,
        connector: data.connector,
        armed: true,
        updatedAt: this.now(),
      });
      return this.state(runId)!;
    });
  }
  /** Called only within the workflow transaction; receipt replays skip this hook. */
  onRunChanged(run: Run, command?: string) {
    const binding = this.binding(run.id);
    if (!binding) return;
    const jobs = this.jobs(run.id);
    const last = jobs.at(-1);
    if (run.status !== 'active') {
      for (const job of jobs)
        if (['queued', 'leased', 'uncertain'].includes(job.status)) {
          if (run.status === 'completed' && job.status !== 'queued') continue;
          // A pause cannot undo a dispatched turn: fence it and require reconciliation.
          job.status =
            run.status === 'paused' && job.status !== 'queued'
              ? 'uncertain'
              : 'cancelled';
          job.updatedAt = this.now();
          this.save(job);
        }
      binding.armed =
        run.status === 'paused' &&
        (binding.armed || last?.status === 'cancelled');
      binding.updatedAt = this.now();
      this.saveBinding(binding);
      return;
    }
    if (command === 'retry' && last?.status === 'failed') binding.armed = true;
    if (
      binding.armed &&
      ready(run) &&
      !jobs.some((j) => ['queued', 'leased', 'uncertain'].includes(j.status))
    ) {
      const c = binding.connector;
      this.save({
        id: randomUUID(),
        runId: run.id,
        revision: run.revision,
        owner: binding.owner,
        connectorId: c.id,
        harness: c.harness,
        sessionId: c.sessionId,
        scope: c.scope,
        status: 'queued',
        leaseToken: '',
        leaseUntil: 0,
        updatedAt: this.now(),
      });
      binding.armed = false;
      binding.updatedAt = this.now();
      this.saveBinding(binding);
    }
  }
  state(runId: string): ContinuationState | undefined {
    const b = this.binding(runId);
    if (!b) return undefined;
    const job = this.jobs(runId).at(-1);
    const status = b.armed
      ? 'waiting'
      : job?.status === 'leased' && job.leaseUntil <= this.now()
        ? 'uncertain'
        : job?.status || 'cancelled';
    return {
      status,
      connectorId: b.connector.id,
      harness: b.connector.harness,
      scope: b.connector.scope,
      updatedAt: Math.max(b.updatedAt, job?.updatedAt || 0),
    };
  }
  pending(connectorId: string, actor: Principal): Delivery[] {
    claimSchema.parse({ connectorId });
    this.authorize(actor);
    return this.jobs()
      .filter(
        (job) =>
          job.owner === actor.id &&
          job.connectorId === connectorId &&
          (job.status === 'uncertain' ||
            (job.status === 'leased' && job.leaseUntil <= this.now())),
      )
      .map(
        ({
          owner: _owner,
          status: _status,
          updatedAt: _at,
          message: _message,
          ...delivery
        }) => delivery,
      );
  }
  claim(connectorId: string, actor: Principal): Delivery | null {
    claimSchema.parse({ connectorId });
    this.authorize(actor);
    return this.atomic(() => {
      let claimed: Delivery | null = null;
      for (const job of this.jobs()) {
        if (job.owner !== actor.id || job.connectorId !== connectorId) continue;
        if (job.status === 'leased' && job.leaseUntil <= this.now()) {
          job.status = 'uncertain';
          job.updatedAt = this.now();
          this.save(job);
        }
        if (claimed || job.status !== 'queued') continue;
        const run = this.getRun(job.runId);
        if (
          run.status !== 'active' ||
          !ready(run) ||
          run.steps.some((s) => s.status === 'running')
        ) {
          job.status = 'cancelled';
          job.updatedAt = this.now();
          this.save(job);
          continue;
        }
        job.status = 'leased';
        job.leaseToken = randomUUID();
        job.leaseUntil = this.now() + 300000;
        job.updatedAt = this.now();
        this.save(job);
        const {
          owner: _owner,
          status: _status,
          updatedAt: _at,
          message: _message,
          ...delivery
        } = job;
        claimed = delivery;
      }
      return claimed;
    });
  }
  settle(
    id: string,
    input: unknown,
    actor: Principal,
  ): { runId: string; state: ContinuationState } {
    const data = settleSchema.parse(input);
    return this.atomic(() => {
      const row = this.db
        .prepare('SELECT data FROM continuation_jobs WHERE id=?')
        .get(id);
      if (!row) throw new WorkflowError('NOT_FOUND', 'Delivery not found', 404);
      const job = JSON.parse(row.data as string) as Job;
      this.authorize(actor, job.owner);
      if (data.leaseToken !== job.leaseToken)
        throw denied('Invalid lease token');
      const target = data.outcome === 'accepted' ? 'delivered' : 'failed';
      if (job.status === target)
        return { runId: job.runId, state: this.state(job.runId)! };
      if (!['leased', 'uncertain'].includes(job.status))
        throw denied('Delivery cancelled or already settled');
      if (
        (job.status === 'uncertain' || job.leaseUntil <= this.now()) &&
        !data.reconciled
      )
        throw denied('Expired delivery requires reconciliation');
      if (['cancelled', 'rejected'].includes(this.getRun(job.runId).status))
        throw denied('Run no longer accepts delivery');
      job.status = target;
      job.updatedAt = this.now();
      job.message = data.message;
      this.save(job);
      return { runId: job.runId, state: this.state(job.runId)! };
    });
  }
}
