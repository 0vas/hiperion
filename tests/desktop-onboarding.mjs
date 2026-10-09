import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectWithDialog } from '../desktop/onboarding.mjs';

test('connection picker configures only the chosen client and gives a plain-language next step', async () => {
  for (const [response, client] of [
    'codex',
    'cursor',
    'claude-desktop',
    'claude-code',
  ].entries()) {
    const calls = [],
      dialogs = [],
      copied = [];
    const result = await connectWithDialog({
      dialog: {
        showMessageBox: async (_window, options) => {
          dialogs.push(options);
          return { response: dialogs.length === 1 ? response : 0 };
        },
      },
      clipboard: { writeText: (text) => copied.push(text) },
      setup: async (id) => {
        calls.push(id);
      },
      options: { directory: '/isolated' },
    });
    assert.equal(result, true);
    assert.deepEqual(calls, [client]);
    assert.match(dialogs[1].detail, /Reinicia|nueva conversación/);
    assert.equal(
      copied[0],
      'Usa Hyperion para preparar una guía breve de bienvenida a mi proyecto.',
    );
  }
});
test('cancel and setup failures never claim success or copy a prompt', async () => {
  let calls = 0;
  const cancelled = await connectWithDialog({
    dialog: { showMessageBox: async () => ({ response: 4 }) },
    setup: async () => {
      calls++;
    },
  });
  assert.equal(cancelled, false);
  assert.equal(calls, 0);
  await assert.rejects(
    connectWithDialog({
      dialog: { showMessageBox: async () => ({ response: 0 }) },
      setup: async () => {
        throw new Error('conflict');
      },
    }),
    /conflict/,
  );
});
