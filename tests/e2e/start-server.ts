import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
// Reset test-only data before the server opens its database or credentials.
const directory = resolve('.hyperion-e2e');
rmSync(directory, { recursive: true, force: true });
process.env.HYPERION_DATA_DIR = directory;
process.env.HYPERION_PORT = '4318';
await import(pathToFileURL(resolve('dist/server/main.js')).href);
