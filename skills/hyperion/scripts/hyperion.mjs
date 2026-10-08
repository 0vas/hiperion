#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
let config;
try {
  config = JSON.parse(
    readFileSync(new URL('../runtime.json', import.meta.url), 'utf8'),
  );
} catch {
  console.error('Install this skill with hyperion install before invoking it.');
  process.exit(1);
}
if (!existsSync(config.cli)) {
  console.error(
    'Hyperion moved or was removed. Run hyperion install again from its new location.',
  );
  process.exit(1);
}
const result = spawnSync(config.node, [config.cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    HYPERION_DATA_DIR: config.directory,
    HYPERION_URL: config.url,
  },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
