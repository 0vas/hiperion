import { randomBytes } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
  rmdirSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
const schema = z.object({
  agentToken: z.string().min(32),
  humanToken: z.string().min(32),
  agentId: z.string().min(1).max(80),
  agents: z.record(z.string(), z.string().min(32)).optional(),
});
const agentIdSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9-]{0,63}$/,
    'Use a lowercase agent ID, letters, numbers and hyphens',
  );
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
  const parsed = schema.parse(JSON.parse(readFileSync(file, 'utf8')));
  return {
    ...parsed,
    agents: { ...parsed.agents, [parsed.agentId]: parsed.agentToken },
    directory: path,
  };
}
/** Atomic replacement prevents readers observing partially written credentials. */
export function registerAgent(
  input: string,
  directory = process.env.HYPERION_DATA_DIR || '.hyperion',
) {
  const id = agentIdSchema.parse(input);
  const path = loadCredentials(directory).directory;
  const lock = resolve(path, 'credentials.lock');
  try {
    mkdirSync(lock, { mode: 0o700 });
  } catch {
    throw new Error(
      'Another credential registration is in progress. Retry after it finishes.',
    );
  }
  try {
    const current = loadCredentials(path);
    if (!Object.hasOwn(current.agents, id)) {
      current.agents[id] = randomBytes(32).toString('hex');
      const { directory: _directory, ...credentials } = current;
      const temporary = resolve(lock, 'credentials.json');
      writeFileSync(temporary, JSON.stringify(credentials, null, 2), {
        mode: 0o600,
      });
      renameSync(temporary, resolve(path, 'credentials.json'));
    }
    return current;
  } finally {
    rmdirSync(lock);
  }
}
