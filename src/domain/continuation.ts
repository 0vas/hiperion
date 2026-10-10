import { z } from 'zod';

const identifier = z.string().trim().min(1).max(128);
export const connectorSchema = z
  .object({
    id: identifier,
    harness: identifier,
    sessionId: z.string().min(1).max(512),
    scope: z.enum(['managed-session', 'native-chat']),
    capabilities: z
      .object({ resume: z.literal(true), idempotentDelivery: z.literal(true) })
      .strict(),
  })
  .strict();
export const suspendSchema = z
  .object({
    expectedRevision: z.number().int().positive(),
    connector: connectorSchema,
  })
  .strict();
export const claimSchema = z.object({ connectorId: identifier }).strict();
export const settleSchema = z
  .object({
    leaseToken: z.string().uuid(),
    outcome: z.enum(['accepted', 'failed']),
    reconciled: z.boolean().optional(),
    message: z.string().max(2000).optional(),
  })
  .strict();
export type Connector = z.infer<typeof connectorSchema>;
export type Suspension = z.infer<typeof suspendSchema>;
export type Settlement = z.infer<typeof settleSchema>;
export type ContinuationState = {
  status:
    | 'waiting'
    | 'queued'
    | 'leased'
    | 'delivered'
    | 'failed'
    | 'uncertain'
    | 'cancelled';
  connectorId: string;
  harness: string;
  scope: Connector['scope'];
  updatedAt: number;
};
export type Delivery = {
  id: string;
  runId: string;
  revision: number;
  connectorId: string;
  harness: string;
  sessionId: string;
  scope: Connector['scope'];
  leaseToken: string;
  leaseUntil: number;
};
