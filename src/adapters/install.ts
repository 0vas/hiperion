import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export function defaultDirectory(home = homedir()) {
  return (
    process.env.HYPERION_DATA_DIR ||
    (existsSync(resolve(root, '.hyperion/credentials.json'))
      ? resolve(root, '.hyperion')
      : resolve(home, '.hyperion'))
  );
}
export function installSkill(
  options: { home?: string; directory?: string; destination?: string } = {},
) {
  const home = options.home || homedir();
  const directory = resolve(options.directory || defaultDirectory(home));
  const paths = options.destination
    ? [resolve(options.destination, 'hyperion')]
    : [
        resolve(home, '.agents/skills/hyperion'),
        ...(existsSync(resolve(home, '.claude'))
          ? [resolve(home, '.claude/skills/hyperion')]
          : []),
      ];
  const files: Record<string, string> = {
    'SKILL.md': readFileSync(resolve(root, 'skills/hyperion/SKILL.md'), 'utf8'),
    'scripts/hyperion.mjs': readFileSync(
      resolve(root, 'skills/hyperion/scripts/hyperion.mjs'),
      'utf8',
    ),
    'references/process-contract.md': readFileSync(
      resolve(root, 'docs/process-contract.md'),
      'utf8',
    ),
    'references/protocol.md': readFileSync(
      resolve(root, 'docs/protocol.md'),
      'utf8',
    ),
    'SECURITY.md': readFileSync(resolve(root, 'SECURITY.md'), 'utf8'),
    'examples/process-review.json': readFileSync(
      resolve(root, 'examples/process-review.json'),
      'utf8',
    ),
    'examples/process-gateways.json': readFileSync(
      resolve(root, 'examples/process-gateways.json'),
      'utf8',
    ),
    'runtime.json':
      JSON.stringify(
        {
          node: process.execPath,
          cli: resolve(root, 'dist/adapters/cli.js'),
          directory,
          url: process.env.HYPERION_URL || 'http://127.0.0.1:4317',
        },
        null,
        2,
      ) + '\n',
  };
  // Preflight every destination before writing any file. Only replace our unmodified installation.
  for (const path of paths) {
    const manifestPath = resolve(path, '.hyperion-skill.json');
    const manifest = existsSync(manifestPath)
      ? (JSON.parse(readFileSync(manifestPath, 'utf8')) as {
          owner: string;
          hashes: Record<string, string>;
        })
      : undefined;
    for (const name of Object.keys(files)) {
      const target = resolve(path, name);
      if (
        existsSync(target) &&
        (manifest?.owner !== 'hyperion' ||
          manifest.hashes?.[name] !== hash(readFileSync(target, 'utf8')))
      )
        throw new Error(
          `Skill conflict: ${target} is not managed by Hyperion or was modified. It was not overwritten.`,
        );
    }
  }
  for (const path of paths) {
    for (const [name, content] of Object.entries({
      ...files,
      '.hyperion-skill.json':
        JSON.stringify({
          owner: 'hyperion',
          hashes: Object.fromEntries(
            Object.entries(files).map(([name, content]) => [
              name,
              hash(content),
            ]),
          ),
        }) + '\n',
    })) {
      const target = resolve(path, name);
      mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
      const temporary = target + `.${crypto.randomUUID()}.tmp`;
      writeFileSync(temporary, content, { mode: 0o600, flag: 'wx' });
      renameSync(temporary, target);
    }
  }
  return {
    paths,
    directory,
    message:
      'Hyperion skill installed. Reload skills or open a new agent session, then say: Usa Hyperion para ... . Local shell access is required; MCP remains optional.',
  };
}
