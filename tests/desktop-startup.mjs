import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recoverStartup } from '../desktop/startup.mjs';
test('failed startup keeps diagnostics and update recovery available until an explicit retry', async () => {
  let starts = 0,
    logs = 0,
    updates = 0,
    records = 0;
  const choices = [1, 2, 0];
  const result = await recoverStartup({
    start: async () => {
      if (++starts === 1) throw new Error('Port occupied');
    },
    record: async () => records++,
    showLogs: async () => logs++,
    checkUpdates: async () => updates++,
    dialog: { showMessageBox: async () => ({ response: choices.shift() }) },
  });
  assert.equal(result, true);
  assert.deepEqual([starts, logs, updates, records], [2, 1, 1, 1]);
});
test('startup recovery exits only on user choice without retrying in a loop', async () => {
  let starts = 0;
  assert.equal(
    await recoverStartup({
      start: async () => {
        starts++;
        throw new Error('failure');
      },
      record: async () => {},
      dialog: { showMessageBox: async () => ({ response: 3 }) },
    }),
    false,
  );
  assert.equal(starts, 1);
});
