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
    form: z
      .object({
        label: z.string().trim().min(1).max(160).optional(),
        hint: z.string().trim().min(1).max(240).optional(),
        placeholder: z.string().trim().min(1).max(160).optional(),
        trueLabel: z.string().trim().min(1).max(80).optional(),
        falseLabel: z.string().trim().min(1).max(80).optional(),
      })
      .strict()
      .optional(),
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
export { matchesType } from './value-types.js';
