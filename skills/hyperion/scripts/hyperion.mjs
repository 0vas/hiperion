#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
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
// The portable skill is interactive: keep creation attached to human decisions,
// including invocations from conversations that cached older skill instructions.
const args = process.argv.slice(2);
const operationIndex = args[0] === '--agent' ? 2 : 0;
if (args[operationIndex] === 'create') args[operationIndex] = 'guide';
const child = spawn(config.node, [config.cli, ...args], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    ...config.nodeEnv,
    HYPERION_DATA_DIR: config.directory,
    HYPERION_URL: config.url,
  },
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
