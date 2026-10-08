import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAgent } from '../server/config.js';

export function generateConnection(agentId: string, directory?: string) {
  const credentials = registerAgent(agentId, directory);
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const config = {
    mcpServers: {
      hyperion: {
        type: 'stdio',
        command: process.execPath,
        args: [resolve(root, 'dist/adapters/mcp.js')],
        env: {
          HYPERION_AGENT_ID: agentId,
          HYPERION_DATA_DIR: credentials.directory,
          HYPERION_URL: process.env.HYPERION_URL || 'http://127.0.0.1:4317',
        },
      },
    },
  };
  const outputDirectory = resolve(credentials.directory, 'connections');
  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  const configFile = resolve(outputDirectory, `${agentId}.mcp.json`);
  writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
  return {
    agentId,
    configFile,
    config,
    note: 'Merge this server into your client configuration. No client configuration was overwritten; no credentials are included in this file.',
  };
}
