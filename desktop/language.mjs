import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  resolveLocale,
  translate,
  validPreference,
} from '../dist/i18n/core.js';
/** A desktop-wide preference; no workflow data lives in this file. */
export function createLanguageStore({ file, systemLanguages }) {
  let preference = 'system';
  try {
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    if (validPreference(saved.language)) preference = saved.language;
  } catch {
    /* A missing or corrupt preference falls back to the system. */
  }
  return {
    get: () => preference,
    snapshot: () => ({
      preference,
      locale: resolveLocale(preference, systemLanguages()),
    }),
    set(value) {
      if (!validPreference(value)) throw new TypeError('Unsupported language');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file + '.tmp', JSON.stringify({ language: value }) + '\n', {
        mode: 0o600,
      });
      renameSync(file + '.tmp', file);
      preference = value;
    },
    t(message, values) {
      return translate(
        resolveLocale(preference, systemLanguages()),
        message,
        values,
      );
    },
  };
}
