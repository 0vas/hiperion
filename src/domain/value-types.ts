import type { z } from 'zod';
import type { valueType } from './contracts.js';

export function matchesType(
  type: z.infer<typeof valueType>,
  value: unknown,
): boolean {
  if (type === 'array') return Array.isArray(value);
  if (type === 'object')
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type && (type !== 'number' || Number.isFinite(value));
}

export function matchesPort(
  port: {
    type: z.infer<typeof valueType>;
    form?: { options?: { value: string; label: string }[] };
  },
  value: unknown,
): boolean {
  return (
    matchesType(port.type, value) &&
    (!port.form?.options ||
      port.form.options.some((option) => option.value === value))
  );
}
