import { z } from 'zod';
export const identifier = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/);
export const valueType = z.enum([
  'string',
  'number',
  'boolean',
  'object',
  'array',
]);
export const referenceSchema = z
  .object({ stepId: identifier, output: identifier })
  .strict();
export const portSchema = z
  .object({
    name: identifier,
    type: valueType,
    required: z.boolean().default(false),
    description: z.string().max(1000).default(''),
  })
  .strict();
export const inputSchema = portSchema
  .extend({ source: referenceSchema.optional(), value: z.json().optional() })
  .strict();
export const gatewaySchema = z
  .object({
    type: z.enum(['parallel', 'exclusive', 'inclusive']),
    direction: z.enum(['split', 'join']),
    splitId: identifier.optional(),
    routes: z
      .array(
        z
          .object({
            target: identifier,
            when: referenceSchema
              .extend({
                equals: z.union([z.string(), z.number(), z.boolean()]),
              })
              .optional(),
          })
          .strict(),
      )
      .min(2)
      .max(100)
      .optional(),
    defaultTarget: identifier.optional(),
  })
  .strict();
export const outputValuesSchema = z.record(identifier, z.json());
export const traceSchema = z
  .object({
    kind: z.enum(['summary', 'action', 'observation']),
    tool: z.string().trim().min(1).max(120).optional(),
  })
  .strict();
export function matchesType(
  type: z.infer<typeof valueType>,
  value: unknown,
): boolean {
  if (type === 'array') return Array.isArray(value);
  if (type === 'object')
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type && (type !== 'number' || Number.isFinite(value));
}
