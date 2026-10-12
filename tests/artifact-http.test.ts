import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../src/server/app.js';
import { Store } from '../src/server/store.js';
import { HyperionClient } from '../src/adapters/client.js';
test('artifact transport requires auth, scopes content, bounds uploads and never renders active files as documents', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'hyperion-artifact-'));
  const store = new Store(join(directory, 'state.sqlite'));
  const app = createApp({
    store,
    agentToken: 'agent',
    humanToken: 'human',
    agentId: 'claude',
  });
  const url = await app.listen(0);
  const client = new HyperionClient({ url, token: 'agent' });
  try {
    const plan = {
      title: 'Artifacts',
      request: 'Create a report',
      steps: [{ id: 'write', title: 'Write', kind: 'agent' }],
    };
    const run = await client.create(plan);
    await client.command(run.id, { type: 'start', stepId: 'write' });
    const path = join(directory, 'report.html');
    writeFileSync(path, '<script>window.attacked = true</script>');
    const updated = await client.attachFile(run.id, path, {
      stepId: 'write',
      attempt: 1,
      commandId: 'upload',
    });
    const artifact = updated.steps[0]!.artifacts![0]!;
    const endpoint = `/api/runs/${run.id}/artifacts/${artifact.id}`;
    assert.equal((await fetch(url + endpoint)).status, 401);
    const res = await fetch(url + endpoint + '?preview=1', {
      headers: { authorization: 'Bearer human' },
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-disposition')!, /^attachment/);
    assert.match(res.headers.get('content-security-policy')!, /sandbox/);
    assert.equal(res.headers.get('content-type'), 'application/octet-stream');
    assert.equal(await res.text(), '<script>window.attacked = true</script>');
    const other = await client.create(plan);
    assert.equal(
      (
        await fetch(`${url}/api/runs/${other.id}/artifacts/${artifact.id}`, {
          headers: { authorization: 'Bearer human' },
        })
      ).status,
      404,
    );
    await assert.rejects(
      client.addArtifact(run.id, {
        stepId: 'write',
        attempt: 1,
        commandId: 'bad-url',
        name: 'bad',
        url: 'javascript:alert(1)',
      }),
      /VALIDATION/,
    );
    for (const url of ['not a URL', 'https://user:secret@example.com/report'])
      await assert.rejects(
        client.addArtifact(run.id, {
          stepId: 'write',
          attempt: 1,
          commandId: 'invalid-url',
          name: 'report',
          url,
        }),
        /VALIDATION/,
      );
    await assert.rejects(
      client.addArtifact(run.id, {
        stepId: 'write',
        attempt: 1,
        commandId: 'bad-path',
        name: '../secret',
        contentBase64: '',
      }),
      /VALIDATION/,
    );
    await assert.rejects(
      client.addArtifact(run.id, {
        stepId: 'write',
        attempt: 1,
        commandId: 'huge',
        name: 'huge',
        contentBase64: Buffer.alloc(10 * 1024 * 1024 + 1).toString('base64'),
      }),
      /TOO_LARGE/,
    );
    await client.command(run.id, {
      type: 'complete',
      stepId: 'write',
      message: 'Report saved',
      attempt: 1,
    });
    const child = await client.create(
      { ...plan, request: 'Now translate the report' },
      'next',
      run.id,
    );
    assert.equal((await client.get(run.id)).links!.next[0]!.id, child.id);
    assert.equal((await client.get(child.id)).links!.previous!.id, run.id);
    const reopened = new Store(join(directory, 'state.sqlite'));
    try {
      assert.equal(
        reopened.artifactContent(run.id, artifact.id).artifact.name,
        'report.html',
      );
      assert.equal(reopened.links(run.id).next[0]!.id, child.id);
    } finally {
      reopened.close();
    }
  } finally {
    await app.close();
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
