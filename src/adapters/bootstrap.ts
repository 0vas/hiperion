import { VERSION } from '../version.js';
import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCredentials } from '../server/config.js';
import { HyperionClient } from './client.js';

/** Reuses the authenticated instance or starts one loopback service. Never writes to MCP stdout. */
export async function ensureServer(
  options: { directory?: string; url?: string; agentId?: string } = {},
) {
  const config = loadCredentials(options.directory);
  const client = new HyperionClient({
    ...options,
    directory: config.directory,
  });
  const target = new URL(client.url);
  const probe = async () => {
    let response: Response;
    try {
      response = await fetch(client.url + '/api/health', {
        signal: AbortSignal.timeout(800),
      });
    } catch (error) {
      // Only an unavailable listener authorizes starting a process; other failures are reported.
      if (
        error instanceof TypeError &&
        (error.cause as { code?: string })?.code === 'ECONNREFUSED'
      )
        return false;
      throw new Error(`Cannot reach Hyperion at ${client.url}`);
    }
    const health = (await response.json()) as {
      ok?: boolean;
      version?: string;
    };
    if (!response.ok || !health.ok || health.version !== VERSION)
      throw new Error(
        'The configured port has another service or an older Hyperion version. Stop that instance before reconnecting.',
      );
    await client.list(); // Also verifies that the running service uses these credentials.
    return true;
  };
  if (await probe()) return { started: false };
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const log = resolve(config.directory, 'server.log');
  const descriptor = openSync(log, 'a', 0o600);
  const child = spawn(
    process.execPath,
    import.meta.url.endsWith('.ts')
      ? [
          '--import',
          import.meta.resolve('tsx'),
          fileURLToPath(new URL('../server/main.ts', import.meta.url)),
        ]
      : [fileURLToPath(new URL('../server/main.js', import.meta.url))],
    {
      cwd: root,
      detached: true,
      stdio: ['ignore', descriptor, descriptor],
      env: {
        ...process.env,
        ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        HYPERION_DATA_DIR: config.directory,
        HYPERION_PORT: target.port || '80',
      },
    },
  );
  closeSync(descriptor);
  let spawnError: Error | undefined;
  child.once('error', (error) => {
    spawnError = error;
  });
  child.unref();
  for (let attempt = 0; attempt < 60; attempt++) {
    if (spawnError) throw spawnError;
    if (await probe()) return { started: true, pid: child.pid };
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Hyperion did not start. Review ${log}`);
}
