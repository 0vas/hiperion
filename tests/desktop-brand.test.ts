import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('Desktop and canvas ship the same solar titan logo as the public site', () => {
  const original = readFileSync('docs/site/public/brand/hyperion-titan.png');
  for (const file of ['desktop/icon.png', 'src/client/brands/hyperion.png'])
    assert.deepEqual(readFileSync(file), original);
});
