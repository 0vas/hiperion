import { setTimeout } from 'node:timers/promises';
import type { Delivery } from '../domain/continuation.js';
import type { Run } from '../domain/workflow.js';
import type { HyperionClient } from './client.js';

/** Trusted host integration, configured outside model-generated plans. */
export type ResumeConnector = {
  id: string;
  /** Query the provider's durable dispatch receipt. null means still unknown. */
  reconcile?(
    delivery: Delivery,
    run: Run,
  ): Promise<{ outcome: 'accepted' | 'failed'; message?: string } | null>;
  /** Use delivery.id for durable deduplication. Return after dispatch acknowledgement,
   * not after generation. Return failed ONLY if no remote turn was started.
   * Throw on ambiguous network failures: these require reconciliation. */
  resume(
    delivery: Delivery,
    run: Run,
  ): Promise<{ outcome: 'accepted' | 'failed'; message?: string }>;
};
export async function dispatchOnce(
  client: HyperionClient,
  connector: ResumeConnector,
): Promise<boolean> {
  if (connector.reconcile) {
    for (const pending of await client.pendingContinuations(connector.id)) {
      const result = await connector.reconcile(
        pending,
        await client.get(pending.runId),
      );
      if (result)
        await client.settleContinuation(pending.id, {
          leaseToken: pending.leaseToken,
          ...result,
          reconciled: true,
        });
    }
  }
  const delivery = await client.claimContinuation(connector.id);
  if (!delivery) return false;
  const run = await client.get(delivery.runId);
  // A human may have paused or cancelled between claiming and fetching.
  if (
    run.status !== 'active' ||
    !run.steps.some((s) => s.kind === 'agent' && s.status === 'ready')
  )
    return true;
  const result = await connector.resume(delivery, run);
  await client.settleContinuation(delivery.id, {
    leaseToken: delivery.leaseToken,
    ...result,
  });
  return true;
}
/** Only this small IO worker stays alive; no LLM request runs while awaiting input. */
export async function runContinuationWorker(
  client: HyperionClient,
  connector: ResumeConnector,
  options: {
    signal: AbortSignal;
    onError: (error: unknown) => void;
    intervalMs?: number;
  },
) {
  const interval = options.intervalMs ?? 1000;
  if (!Number.isFinite(interval) || interval < 100 || interval > 60000)
    throw new Error('Invalid worker interval');
  while (!options.signal.aborted) {
    try {
      await dispatchOnce(client, connector);
    } catch (error) {
      options.onError(error);
    }
    try {
      await setTimeout(interval, undefined, { signal: options.signal });
    } catch (error) {
      if (!options.signal.aborted) throw error;
    }
  }
}
