import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
const schema = z.object({
  agentToken: z.string().min(32),
  humanToken: z.string().min(32),
  agentId: z.string().min(1).max(80),
});
export function loadCredentials(
  directory = process.env.HYPERION_DATA_DIR || '.hyperion',
) {
  const path = resolve(directory);
  mkdirSync(path, { recursive: true, mode: 0o700 });
  const file = resolve(path, 'credentials.json');
  if (!existsSync(file))
    writeFileSync(
      file,
      JSON.stringify(
        {
          agentToken: randomBytes(32).toString('hex'),
          humanToken: randomBytes(32).toString('hex'),
          agentId: process.env.HYPERION_AGENT_ID || 'codex',
        },
        null,
        2,
      ),
      { mode: 0o600, flag: 'wx' },
    );
  return {
    ...schema.parse(JSON.parse(readFileSync(file, 'utf8'))),
    directory: path,
  };
}
