import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  desktopTarget,
  rememberDesktop,
  desktopLaunch,
  rememberWorkspace,
} from '../src/adapters/desktop.js';
test('desktop targets reuse one local run, reject remote navigation and launch without shell interpolation', () => {
  const directory = join(tmpdir(), 'local data');
  const target = desktopTarget([
    '--hyperion-run=abc-123',
    '--hyperion-url=http://127.0.0.1:4317',
    `--hyperion-directory=${directory}`,
  ]);
  assert.equal(target.url, 'http://127.0.0.1:4317/?run=abc-123');
  assert.throws(
    () => desktopTarget(['--hyperion-url=https://example.com']),
    /local/i,
  );
  assert.throws(() => desktopTarget(['--hyperion-run=../../bad']), /run/i);
  const home = mkdtempSync(join(tmpdir(), 'hyperion-desktop-'));
  try {
    assert.throws(() => desktopLaunch(target, home), /abre Hyperion/i);
    rememberWorkspace(target, home);
    const recovered = desktopTarget([], home);
    assert.equal(recovered.directory, target.directory);
    assert.equal(recovered.service, target.service);
    rememberDesktop({ executable: process.execPath, args: [] }, home);
    const launch = desktopLaunch(target, home);
    assert.equal(launch.executable, process.execPath);
    assert.deepEqual(launch.args, [
      '--hyperion-run=abc-123',
      '--hyperion-url=http://127.0.0.1:4317',
      `--hyperion-directory=${directory}`,
    ]);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
