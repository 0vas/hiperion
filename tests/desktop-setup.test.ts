import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setupDesktopClient } from '../src/adapters/desktop-setup.js';

test('desktop connects Codex, Cursor and Claude Desktop without vendor CLIs and preserves existing configuration', async () => {
  const home = mkdtempSync(join(tmpdir(), 'hyperion-desktop-setup-'));
  try {
    for (const [id, relative, original] of [
      [
        'codex',
        '.codex/config.toml',
        '# Keep my preferences\nmodel = "my-model"\n[mcp_servers.other]\ncommand = "keep-me"\n',
      ],
      [
        'cursor',
        '.cursor/mcp.json',
        '{"preferences":{"keep":true},"mcpServers":{"other":{"command":"keep-me"}}}\n',
      ],
      [
        'claude-desktop',
        'Library/Application Support/Claude/claude_desktop_config.json',
        '{"preferences":{"keep":true},"mcpServers":{"other":{"command":"keep-me"}}}\n',
      ],
    ] as const) {
      const file = join(home, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, original);
      const options = {
        home,
        directory: join(home, 'data'),
        platform: 'darwin' as const,
        url: 'http://127.0.0.1:4341',
      };
      const result = await setupDesktopClient(id, options);
      assert.equal(result.configFile, file);
      const text = readFileSync(file, 'utf8');
      assert.match(text, /keep-me/);
      assert.match(text, /mcp-launcher\.js/);
      assert.match(text, /4341/);
      assert.equal(readFileSync(result.backupFile!, 'utf8'), original);
      if (id === 'codex') assert.ok(text.startsWith(original));
      else assert.equal(JSON.parse(text).preferences.keep, true);
      await setupDesktopClient(id, options);
      assert.equal(readFileSync(file, 'utf8'), text);
      assert.doesNotMatch(text, /agentToken|humanToken/);
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('desktop setup refuses conflicts and malformed configuration without changing user files', async () => {
  const home = mkdtempSync(join(tmpdir(), 'hyperion-setup-conflict-'));
  try {
    for (const [id, relative, contents] of [
      [
        'codex',
        '.codex/config.toml',
        '[mcp_servers.hyperion]\ncommand="different"\n',
      ],
      ['codex', '.codex/config.toml', 'invalid TOML = ['],
      [
        'cursor',
        '.cursor/mcp.json',
        '{"mcpServers":{"hyperion":{"command":"different"}}}',
      ],
      ['cursor', '.cursor/mcp.json', '{"mcpServers":[]}'],
      [
        'claude-desktop',
        'Library/Application Support/Claude/claude_desktop_config.json',
        'invalid JSON',
      ],
    ] as const) {
      const file = join(home, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, contents);
      await assert.rejects(
        setupDesktopClient(id, {
          home,
          directory: join(home, 'data'),
          platform: 'darwin',
        }),
      );
      assert.equal(readFileSync(file, 'utf8'), contents);
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('Claude Desktop uses Windows roaming data and Claude Code receives its own skill', async () => {
  const home = mkdtempSync(join(tmpdir(), 'hyperion-setup-platform-'));
  try {
    const result = await setupDesktopClient('claude-desktop', {
      home,
      directory: join(home, 'data'),
      platform: 'win32',
      appData: join(home, 'Roaming'),
    });
    assert.equal(
      result.configFile,
      join(home, 'Roaming/Claude/claude_desktop_config.json'),
    );
    const code = await setupDesktopClient('claude-code', {
      home,
      directory: join(home, 'data'),
      url: 'http://127.0.0.1:4341',
    });
    assert.equal(
      code.configFile,
      join(home, '.claude/skills/hyperion/SKILL.md'),
    );
    assert.match(readFileSync(code.configFile, 'utf8'), /name: hyperion/);
    assert.equal(
      JSON.parse(
        readFileSync(join(dirname(code.configFile), 'runtime.json'), 'utf8'),
      ).url,
      'http://127.0.0.1:4341',
    );
    await assert.rejects(
      setupDesktopClient('unknown', { home }),
      /cliente|client/i,
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
