import english from './en.json' with { type: 'json' };
export type Locale = 'es' | 'en';
export type LanguagePreference = Locale | 'system';
export const languages = { es: 'Español', en: 'English' } as const;
export function validPreference(value: unknown): value is LanguagePreference {
  return value === 'system' || value === 'es' || value === 'en';
}
export function resolveLocale(
  preference: LanguagePreference,
  system: readonly string[] = [],
): Locale {
  if (preference !== 'system') return preference;
  for (const language of system) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (base === 'es' || base === 'en') return base;
  }
  return 'en';
}
export function translate(
  locale: Locale,
  message: string,
  values: Record<string, string | number> = {},
): string {
  const text =
    locale === 'en' && Object.hasOwn(english, message)
      ? ((english as Record<string, string>)[message] ?? message)
      : message;
  return text.replace(/\{(\d+)\}/g, (match, key) =>
    values[key] === undefined ? match : String(values[key]),
  );
}
