import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { createApp } from './app.js';
import { loadCredentials } from './config.js';
const config = loadCredentials();
const store = new Store(resolve(config.directory, 'hyperion.sqlite'));
const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const app = createApp({
  store,
  ...config,
  getAgentTokens: () => loadCredentials(config.directory).agents,
  publicDir: resolve(root, 'dist/client'),
});
const port = Number(process.env.HYPERION_PORT || 4317);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('HYPERION_PORT must be between 1 and 65535');
try {
  console.log(`Hyperion ready: ${await app.listen(port)}`);
} catch (error) {
  store.close();
  console.error(error);
  process.exitCode = 1;
}
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await app.close();
  store.close();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
