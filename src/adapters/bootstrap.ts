import { VERSION } from '../version.js';
import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCredentials } from '../server/config.js';
import { HyperionClient } from './client.js';
import {
  olderRuntime,
  replaceOlderRuntime,
  withRuntimeLock,
} from './runtime-upgrade.js';

/** Reuses the authenticated instance or starts one loopback service. Never writes to MCP stdout. */
export async function ensureServer(
  options: { directory?: string; url?: string; agentId?: string } = {},
): Promise<{
  started: boolean;
  pid?: number;
  upgraded?: boolean;
  backup?: string;
}> {
  const config = loadCredentials(options.directory);
  const client = new HyperionClient({
    ...options,
    directory: config.directory,
  });
  const target = new URL(client.url);
  const serverArgs = import.meta.url.endsWith('.ts')
    ? [
        '--import',
        import.meta.resolve('tsx'),
        fileURLToPath(new URL('../server/main.ts', import.meta.url)),
      ]
    : [fileURLToPath(new URL('../server/main.js', import.meta.url))];
  const probe = async () => {
    let response: Response;
    try {
      response = await fetch(client.url + '/api/health', {
        signal: AbortSignal.timeout(3000),
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
    if (
      !response.ok ||
      health.ok !== true ||
      typeof health.version !== 'string'
    )
      throw new Error(
        'The configured port belongs to another service. No process was stopped.',
      );
    await client.list(); // Authenticate before considering ANY replacement.
    return health.version;
  };
  return withRuntimeLock(config.directory, async () => {
    const running = await probe();
    if (running === VERSION) return { started: false };
    let backup: string | undefined;
    if (running) {
      if (!olderRuntime(running, VERSION))
        throw new Error(
          `A newer or unrecognized Hyperion service (${running}) is already running. Open the newer installed app; it was not stopped.`,
        );
      backup = await replaceOlderRuntime({
        directory: config.directory,
        url: client.url,
        command: [process.execPath, ...serverArgs],
        authenticate: async () => {
          if ((await probe()) !== running)
            throw new Error('Hyperion changed during update; retry.');
        },
      });
    }
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const log = resolve(config.directory, 'server.log');
    const descriptor = openSync(log, 'a', 0o600);
    const child = spawn(process.execPath, serverArgs, {
      cwd: root,
      detached: true,
      stdio: ['ignore', descriptor, descriptor],
      env: {
        ...process.env,
        ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        HYPERION_DATA_DIR: config.directory,
        HYPERION_PORT: target.port || '80',
      },
    });
    closeSync(descriptor);
    let spawnError: Error | undefined;
    child.once('error', (error) => {
      spawnError = error;
    });
    child.unref();
    for (let attempt = 0; attempt < 60; attempt++) {
      if (spawnError) throw spawnError;
      if ((await probe()) === VERSION)
        return {
          started: true,
          pid: child.pid,
          ...(backup ? { upgraded: true, backup } : {}),
        };
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Hyperion did not start. Review ${log}`);
  });
}
