import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { generateConnection } from './connections.js';

type SetupOptions = {
  directory?: string;
  home?: string;
  run?: (command: string, args: string[]) => void;
};
const execute = (command: string, args: string[]) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
    timeout: 30000,
  });
  if (result.error)
    throw new Error(
      `Cannot run ${command}. Install its CLI first: ${result.error.message}`,
    );
  if (result.status !== 0)
    throw new Error(
      `${command} registration failed: ${result.stderr || result.stdout}`,
    );
};
export async function setupClient(id: string, options: SetupOptions = {}) {
  if (!['codex', 'claude', 'cursor'].includes(id))
    throw new Error(
      'Use setup codex, claude or cursor. Other clients can use connect CLIENT_ID.',
    );
  const generated = generateConnection(id, options.directory, true);
  const server = generated.config.mcpServers.hyperion;
  const run = options.run || execute;
  if (id === 'codex')
    run('codex', [
      'mcp',
      'add',
      'hyperion',
      ...Object.entries(server.env).flatMap(([key, value]) => [
        '--env',
        `${key}=${value}`,
      ]),
      '--',
      server.command,
      ...server.args,
    ]);
  if (id === 'claude')
    run('claude', [
      'mcp',
      'add-json',
      '--scope',
      'user',
      'hyperion',
      JSON.stringify(server),
    ]);
  if (id === 'cursor') {
    const path = resolve(options.home || homedir(), '.cursor/mcp.json');
    const config = existsSync(path)
      ? JSON.parse(readFileSync(path, 'utf8'))
      : {};
    if (
      !config ||
      typeof config !== 'object' ||
      Array.isArray(config) ||
      (config.mcpServers &&
        (typeof config.mcpServers !== 'object' ||
          Array.isArray(config.mcpServers)))
    )
      throw new Error(
        'Cursor configuration is not a JSON object. It was not modified.',
      );
    config.mcpServers ??= {};
    if (
      config.mcpServers.hyperion &&
      JSON.stringify(config.mcpServers.hyperion) !== JSON.stringify(server)
    )
      throw new Error(
        'Cursor already has a different hyperion entry. Resolve that conflict before setup; nothing was overwritten.',
      );
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const temp = path + `.${crypto.randomUUID()}.tmp`;
    writeFileSync(
      temp,
      JSON.stringify(
        { ...config, mcpServers: { ...config.mcpServers, hyperion: server } },
        null,
        2,
      ) + '\n',
      { mode: 0o600, flag: 'wx' },
    );
    renameSync(temp, path);
  }
  return {
    client: id,
    configFile: generated.configFile,
    message:
      'Connected. Reload MCP tools or open a new session in your client. Hyperion starts locally on demand.',
  };
}
