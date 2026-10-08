import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Run, Command } from '../domain/workflow.js';
export class HyperionClient {
  readonly url: string;
  private token: string;
  constructor(options: { url?: string; token?: string } = {}) {
    this.url =
      options.url || process.env.HYPERION_URL || 'http://127.0.0.1:4317';
    const target = new URL(this.url);
    if (target.protocol !== 'http:' || target.hostname !== '127.0.0.1')
      throw new Error('This local edition only connects to http://127.0.0.1');
    if (options.token || process.env.HYPERION_TOKEN)
      this.token = options.token || process.env.HYPERION_TOKEN!;
    else {
      try {
        this.token = JSON.parse(
          readFileSync(
            resolve(
              process.env.HYPERION_DATA_DIR || '.hyperion',
              'credentials.json',
            ),
            'utf8',
          ),
        ).agentToken;
      } catch {
        throw new Error(
          'Start Hyperion first, or set HYPERION_DATA_DIR / HYPERION_TOKEN.',
        );
      }
    }
  }
  private async request<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(this.url + path, {
      method: data ? 'POST' : 'GET',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`${body.error}: ${body.message}`);
    return body as T;
  }
  list() {
    return this.request<Run[]>('/api/runs');
  }
  get(id: string) {
    return this.request<Run>(`/api/runs/${encodeURIComponent(id)}`);
  }
  create(plan: unknown, commandId: string = crypto.randomUUID()) {
    return this.request<Run>('/api/runs', { plan, commandId });
  }
  command(id: string, command: Command) {
    return this.request<Run>(`/api/runs/${encodeURIComponent(id)}/commands`, {
      ...command,
      commandId: command.commandId || crypto.randomUUID(),
    });
  }
  async wait(id: string, afterRevision: number, timeoutSeconds = 30) {
    if (
      !Number.isFinite(timeoutSeconds) ||
      timeoutSeconds < 0 ||
      timeoutSeconds > 55
    )
      throw new Error('timeoutSeconds must be finite and between 0 and 55');
    if (!Number.isInteger(afterRevision) || afterRevision < 0)
      throw new Error('afterRevision must be a nonnegative integer');
    const until = Date.now() + timeoutSeconds * 1000;
    do {
      const run = await this.get(id);
      if (
        run.revision > afterRevision ||
        ['completed', 'cancelled', 'rejected'].includes(run.status)
      )
        return run;
      if (Date.now() >= until) return run;
      await new Promise((done) => setTimeout(done, 500));
    } while (true);
  }
  link(run: Run) {
    return `${this.url}/?run=${run.id}`;
  }
}
