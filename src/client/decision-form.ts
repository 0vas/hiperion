import type { Step } from '../domain/workflow';
import { matchesType } from '../domain/value-types';
export type FormPort = NonNullable<Step['outputs']>[number];
export function fieldLabel(port: FormPort) {
  return (
    port.form?.label ||
    port.description ||
    port.name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ')
  );
}
export function parseField(port: FormPort, value: string): unknown {
  return port.type === 'string'
    ? value
    : port.type === 'number'
      ? Number(value)
      : JSON.parse(value);
}
export function fieldError(port: FormPort, value: string): string | undefined {
  if (!value.trim())
    return port.required
      ? port.type === 'boolean'
        ? 'Elige una opción.'
        : 'Completa este campo.'
      : undefined;
  try {
    if (matchesType(port.type, parseField(port, value))) return;
  } catch {
    /* Present a field-specific message below. */
  }
  return port.type === 'number'
    ? 'Escribe un número válido.'
    : port.type === 'boolean'
      ? 'Elige Sí o No.'
      : port.type === 'array'
        ? 'Usa una lista válida entre corchetes [ ].'
        : 'Usa un objeto válido entre llaves { }.';
}
