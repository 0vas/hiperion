import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { defaultDirectory } from '../src/adapters/install.js';

test('Electron Desktop always uses ~/.hyperion, never a portable checkout next to the app', () => {
  const previous = process.versions.electron;
  const home = mkdtempSync(join(tmpdir(), 'hyperion-home-'));
  const portable = mkdtempSync(join(tmpdir(), 'hyperion-portable-'));
  try {
    mkdirSync(join(portable, '.hyperion'), { recursive: true });
    writeFileSync(join(portable, '.hyperion/credentials.json'), '{}');
    Object.defineProperty(process.versions, 'electron', {
      value: '38.0.0',
      configurable: true,
    });
    assert.equal(defaultDirectory(home), resolve(home, '.hyperion'));
    assert.notEqual(defaultDirectory(home), resolve(portable, '.hyperion'));
  } finally {
    Object.defineProperty(process.versions, 'electron', {
      value: previous,
      configurable: true,
    });
    rmSync(home, { recursive: true, force: true });
    rmSync(portable, { recursive: true, force: true });
  }
});

test('HYPERION_DATA_DIR still wins over Electron sticky home', () => {
  const previous = process.versions.electron;
  const home = mkdtempSync(join(tmpdir(), 'hyperion-env-home-'));
  const custom = join(home, 'custom-data');
  const prior = process.env.HYPERION_DATA_DIR;
  try {
    Object.defineProperty(process.versions, 'electron', {
      value: '38.0.0',
      configurable: true,
    });
    process.env.HYPERION_DATA_DIR = custom;
    assert.equal(defaultDirectory(home), resolve(custom));
  } finally {
    if (prior === undefined) delete process.env.HYPERION_DATA_DIR;
    else process.env.HYPERION_DATA_DIR = prior;
    Object.defineProperty(process.versions, 'electron', {
      value: previous,
      configurable: true,
    });
    rmSync(home, { recursive: true, force: true });
  }
});

test('non-Electron CLI may reuse a checkout .hyperion when credentials already exist', () => {
  if (process.versions.electron) return;
  assert.match(defaultDirectory(homedir()), /\.hyperion$/);
});
