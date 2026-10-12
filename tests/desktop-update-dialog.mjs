import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUpdateController } from '../desktop/update-dialog.mjs';
const app = {
  getVersion: () => '0.5.1-preview.1',
  getPath: () => '/downloads',
};
const update = {
  version: '0.5.2',
  asset: { name: 'Hyperion-0.5.2-mac-arm64.dmg' },
};
test('updates require consent and a save destination, report progress and never execute the installer', async () => {
  const calls = [],
    progress = [];
  let count = 0;
  const controller = createUpdateController({
    app,
    getWindow: () => ({
      isDestroyed: () => false,
      setProgressBar: (p) => progress.push(p),
    }),
    check: async () => update,
    dialog: {
      showMessageBox: async () => ({ response: ++count === 1 ? 0 : 0 }),
      showSaveDialog: async () => ({
        filePath: '/downloads/new.dmg',
        canceled: false,
      }),
    },
    download: async (info, file, { onProgress }) => {
      calls.push([info.version, file]);
      onProgress(0.5);
      onProgress(1);
    },
    shell: { showItemInFolder: (path) => calls.push(path) },
  });
  await controller.check();
  assert.deepEqual(calls, [
    ['0.5.2', '/downloads/new.dmg'],
    '/downloads/new.dmg',
  ]);
  assert.deepEqual(progress, [0.5, 1, -1]);
});
test('dismissed updates and cancelled save dialogs do not download', async () => {
  for (const response of [0, 1]) {
    let downloads = 0;
    const controller = createUpdateController({
      app,
      getWindow: () => undefined,
      check: async () => update,
      dialog: {
        showMessageBox: async () => ({ response }),
        showSaveDialog: async () => ({ canceled: true }),
      },
      download: async () => downloads++,
    });
    await controller.check();
    assert.equal(downloads, 0);
  }
});
test('background network failures stay quiet and manual failures report an error', async () => {
  const messages = [];
  const controller = createUpdateController({
    app,
    getWindow: () => undefined,
    check: async () => {
      throw new Error('offline');
    },
    dialog: { showMessageBox: async (m) => messages.push(m) },
  });
  await controller.check(false);
  assert.equal(messages.length, 0);
  await controller.check(true);
  assert.equal(messages.length, 1);
});
