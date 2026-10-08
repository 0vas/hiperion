import { useEffect, useState } from 'react';
export type Preferences = {
  theme: 'system' | 'light' | 'dark';
  reduceMotion: boolean;
  follow: boolean;
  view: 'steps' | 'jobs';
};
const defaults: Preferences = {
  theme: 'system',
  reduceMotion: false,
  follow: false,
  view: 'steps',
};
const key = 'hyperion.preferences.v1';
export function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return {
      theme: ['system', 'light', 'dark'].includes(value?.theme)
        ? value.theme
        : 'system',
      reduceMotion: value?.reduceMotion === true,
      follow: value?.follow === true,
      view: value?.view === 'jobs' ? 'jobs' : 'steps',
    };
  } catch {
    return defaults;
  }
}
export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      /* Session preferences still work when storage is unavailable. */
    }
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        preferences.theme === 'system'
          ? media.matches
            ? 'dark'
            : 'light'
          : preferences.theme;
      document.documentElement.dataset.motion = preferences.reduceMotion
        ? 'reduce'
        : 'system';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preferences]);
  return [preferences, setPreferences] as const;
}
export function motionDuration() {
  return document.documentElement.dataset.motion === 'reduce' ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : 240;
}
