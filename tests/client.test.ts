import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HyperionClient } from '../src/adapters/client.js';

test('adapter rejects remote targets and unbounded/invalid waits before contacting a server', async () => {
  assert.throws(
    () => new HyperionClient({ url: 'https://example.com', token: 'test' }),
    /local/i,
  );
  const client = new HyperionClient({
    url: 'http://127.0.0.1:1',
    token: 'test',
  });
  for (const seconds of [NaN, Infinity, -1, 56]) {
    await assert.rejects(client.wait('anything', 0, seconds), /timeout/i);
  }
  await assert.rejects(client.wait('anything', NaN, 0), /revision/i);
});
