import release from './release.json' with { type: 'json' };
export const VERSION = release.version;
export const RELEASE_CHANNEL = release.channel;
