import assert from 'node:assert/strict';
import test from 'node:test';
import { RELEASE_CHANNEL, VERSION } from '../src/version.js';

test('public CalVer is available for the Menú header without opening Connections', () => {
  assert.match(VERSION, /^\d{4}\.\d{2}\.\d{2}\.\d{4}$/);
  assert.ok(RELEASE_CHANNEL);
  const label = `Hyperion ${VERSION} UTC · ${RELEASE_CHANNEL}`;
  assert.match(label, /Hyperion \d{4}\.\d{2}\.\d{2}\.\d{4} UTC ·/);
});
