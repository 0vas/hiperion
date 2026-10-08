import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installSkill } from '../src/adapters/install.js';

test('portable install works without a vendor CLI and preserves unrelated skills', () => {
  const home = mkdtempSync(join(tmpdir(), 'hyperion-install-'));
  try {
    mkdirSync(join(home, '.claude'), { recursive: true });
    const other = join(home, '.agents/skills/other');
    mkdirSync(other, { recursive: true });
    writeFileSync(join(other, 'SKILL.md'), 'keep');
    const result = installSkill({ home, directory: join(home, 'data') });
    assert.equal(result.paths.length, 2);
    for (const path of result.paths) {
      assert.match(
        readFileSync(join(path, 'SKILL.md'), 'utf8'),
        /name: hyperion/,
      );
      const config = JSON.parse(
        readFileSync(join(path, 'runtime.json'), 'utf8'),
      );
      assert.equal(config.directory, join(home, 'data'));
      assert.ok(config.cli.endsWith('/dist/adapters/cli.js'));
      assert.equal('token' in config, false);
    }
    installSkill({ home, directory: join(home, 'data') });
    assert.equal(readFileSync(join(other, 'SKILL.md'), 'utf8'), 'keep');
    writeFileSync(join(result.paths[0]!, 'SKILL.md'), 'user edit');
    assert.throws(
      () => installSkill({ home, directory: join(home, 'data') }),
      /modified|conflict/i,
    );
    assert.equal(
      readFileSync(join(result.paths[0]!, 'SKILL.md'), 'utf8'),
      'user edit',
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
