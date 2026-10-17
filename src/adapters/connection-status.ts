/**
 * Read-only inventory of local AI client Hyperion entries.
 * File presence ≠ tools loaded in an open chat.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'smol-toml';
import { generateConnection } from './connections.js';
import { defaultDirectory } from './install.js';

export const DESKTOP_CLIENTS = [
  'codex',
  'cursor',
  'claude-desktop',
  'claude-code',
  'antigravity',
] as const;

export type DesktopClientId = (typeof DESKTOP_CLIENTS)[number];

export type ConnectionStatusId =
  'configured' | 'missing' | 'conflict' | 'unknown';

export type ConnectionRow = {
  id: DesktopClientId;
  name: string;
  status: ConnectionStatusId;
  path?: string;
  detail?: string;
};

export type ConnectionInventory = {
  version: string;
  channel: string;
  serviceUrl: string;
  integrations: ConnectionRow[];
  summary: {
    configured: number;
    conflicts: number;
    total: number;
  };
};

type Options = {
  home?: string;
  directory?: string;
  platform?: NodeJS.Platform;
  appData?: string;
  codexHome?: string;
  url?: string;
  version?: string;
  channel?: string;
};

const NAMES: Record<DesktopClientId, string> = {
  codex: 'Codex',
  cursor: 'Cursor',
  'claude-desktop': 'Claude Desktop',
  'claude-code': 'Claude Code',
  antigravity: 'Antigravity',
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('invalid');
  return value as Record<string, unknown>;
}

export function desktopClientConfigPath(
  id: DesktopClientId,
  options: Options = {},
): { path: string } | { error: string } {
  const home = options.home || process.env.HYPERION_HOME || homedir();
  const platform = options.platform || process.platform;
  if (id === 'codex')
    return {
      path: resolve(
        options.codexHome ||
          (!options.home && process.env.CODEX_HOME) ||
          resolve(home, '.codex'),
        'config.toml',
      ),
    };
  if (id === 'cursor') return { path: resolve(home, '.cursor/mcp.json') };
  if (id === 'antigravity')
    return { path: resolve(home, '.gemini/config/mcp_config.json') };
  if (id === 'claude-code')
    return { path: resolve(home, '.claude/skills/hyperion/SKILL.md') };
  if (platform === 'darwin')
    return {
      path: resolve(
        home,
        'Library/Application Support/Claude/claude_desktop_config.json',
      ),
    };
  if (platform === 'win32')
    return {
      path: resolve(
        options.appData ||
          (!options.home && process.env.APPDATA) ||
          resolve(home, 'AppData/Roaming'),
        'Claude/claude_desktop_config.json',
      ),
    };
  return {
    error:
      'La conexión de Claude Desktop está disponible para macOS y Windows. Usa Claude Code en este sistema.',
  };
}

function expectedServer(
  id: DesktopClientId,
  directory: string,
  url: string,
): Record<string, unknown> {
  const agentId = id === 'claude-desktop' ? 'claude' : id;
  const generated = generateConnection(agentId, directory, true, url);
  const { type: _type, ...server } = generated.config.mcpServers.hyperion;
  return server;
}

function inspectMcpClient(
  id: Exclude<DesktopClientId, 'claude-code'>,
  options: Options,
): ConnectionRow {
  const name = NAMES[id];
  const located = desktopClientConfigPath(id, options);
  if ('error' in located)
    return { id, name, status: 'unknown', detail: located.error };
  const path = located.path;
  if (!existsSync(path)) return { id, name, status: 'missing', path };
  let config: Record<string, unknown>;
  try {
    const text = readFileSync(path, 'utf8');
    config = object(id === 'codex' ? parse(text) : JSON.parse(text));
  } catch {
    return {
      id,
      name,
      status: 'unknown',
      path,
      detail: `No se pudo leer la configuración de ${id}.`,
    };
  }
  const key = id === 'codex' ? 'mcp_servers' : 'mcpServers';
  let servers: Record<string, unknown>;
  try {
    servers = config[key] === undefined ? {} : object(config[key]);
  } catch {
    return {
      id,
      name,
      status: 'unknown',
      path,
      detail: `No se pudo leer la configuración de ${id}.`,
    };
  }
  if (servers.hyperion === undefined)
    return { id, name, status: 'missing', path };
  const home = options.home || process.env.HYPERION_HOME || homedir();
  const directory = options.directory || defaultDirectory(home);
  const url =
    options.url || process.env.HYPERION_URL || 'http://127.0.0.1:4317';
  try {
    const existing = object(servers.hyperion);
    const { type: existingType, ...comparable } = existing;
    const expected = expectedServer(id, directory, url);
    if (
      (!existingType || existingType === 'stdio') &&
      isDeepStrictEqual(JSON.parse(JSON.stringify(comparable)), expected)
    )
      return { id, name, status: 'configured', path };
  } catch {
    /* Fall through to conflict. */
  }
  return {
    id,
    name,
    status: 'conflict',
    path,
    detail: `Ya existe otra conexión Hyperion en ${id}. No se sobrescribió.`,
  };
}

function inspectClaudeCode(options: Options): ConnectionRow {
  const id = 'claude-code';
  const name = NAMES[id];
  const located = desktopClientConfigPath(id, options);
  if ('error' in located)
    return { id, name, status: 'unknown', detail: located.error };
  const path = located.path;
  const skillDir = resolve(path, '..');
  const manifestPath = resolve(skillDir, '.hyperion-skill.json');
  if (!existsSync(path)) return { id, name, status: 'missing', path };
  try {
    if (existsSync(manifestPath)) {
      const manifest = object(JSON.parse(readFileSync(manifestPath, 'utf8')));
      if (manifest.owner === 'hyperion')
        return { id, name, status: 'configured', path };
      return {
        id,
        name,
        status: 'conflict',
        path,
        detail: `Ya existe otra conexión Hyperion en ${id}. No se sobrescribió.`,
      };
    }
    const skill = readFileSync(path, 'utf8');
    if (/^name:\s*hyperion\b/m.test(skill))
      return { id, name, status: 'configured', path };
    return {
      id,
      name,
      status: 'conflict',
      path,
      detail: `Ya existe otra conexión Hyperion en ${id}. No se sobrescribió.`,
    };
  } catch {
    return {
      id,
      name,
      status: 'unknown',
      path,
      detail: `No se pudo leer la configuración de ${id}.`,
    };
  }
}

export function inspectDesktopClient(
  id: DesktopClientId,
  options: Options = {},
): ConnectionRow {
  if (id === 'claude-code') return inspectClaudeCode(options);
  return inspectMcpClient(id, options);
}

export function inspectDesktopConnections(
  options: Options = {},
): ConnectionInventory {
  const integrations = DESKTOP_CLIENTS.map((id) =>
    inspectDesktopClient(id, options),
  );
  const configured = integrations.filter(
    (i) => i.status === 'configured',
  ).length;
  const conflicts = integrations.filter((i) => i.status === 'conflict').length;
  return {
    version: options.version || '',
    channel: options.channel || '',
    serviceUrl:
      options.url || process.env.HYPERION_URL || 'http://127.0.0.1:4317',
    integrations,
    summary: {
      configured,
      conflicts,
      total: integrations.length,
    },
  };
}
