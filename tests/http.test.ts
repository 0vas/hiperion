import { test } from 'node:test';
import { request as httpRequest } from 'node:http';
import assert from 'node:assert/strict';
import { createApp } from '../src/server/app.js';
import { Store } from '../src/server/store.js';

test('HTTP enforces auth, origin, human-only approvals, input validation and revisions', async () => {
  const store = new Store(':memory:');
  const app = createApp({
    store,
    agentToken: 'test-agent',
    humanToken: 'test-human',
    agentId: 'codex',
  });
  const url = await app.listen(0);
  const post = (
    path: string,
    data: unknown,
    token = 'test-agent',
    extra: Record<string, string> = {},
  ) =>
    fetch(url + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...extra,
      },
      body: JSON.stringify(data),
    });
  try {
    assert.equal((await fetch(url + '/api/runs')).status, 401);
    assert.equal(
      (
        await post('/api/runs', {}, 'test-agent', {
          origin: 'https://evil.example',
        })
      ).status,
      403,
    );
    assert.equal((await post('/api/runs', {})).status, 400);
    const response = await post('/api/runs', {
      commandId: 'create',
      plan: {
        title: 'HTTP test',
        steps: [{ id: 'gate', title: 'Approve', kind: 'approval' }],
      },
    });
    assert.equal(response.status, 201);
    const run = await response.json();
    const endpoint = `/api/runs/${run.id}/commands`;
    assert.equal(
      (
        await post(endpoint, {
          commandId: 'approve',
          type: 'approve',
          stepId: 'gate',
          expectedRevision: 1,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await post(
          endpoint,
          { commandId: 'approve-human', type: 'approve', stepId: 'gate' },
          'test-human',
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await post(
          endpoint,
          {
            commandId: 'approve-human',
            type: 'approve',
            stepId: 'gate',
            expectedRevision: 0,
          },
          'test-human',
        )
      ).status,
      409,
    );
    const approved = await post(
      endpoint,
      {
        commandId: 'approve-human',
        type: 'approve',
        stepId: 'gate',
        expectedRevision: 1,
      },
      'test-human',
    );
    assert.equal(approved.status, 200);
    assert.equal((await approved.json()).status, 'completed');
    const deniedHost = await new Promise<number | undefined>((done, reject) => {
      const req = httpRequest(
        url + '/api/runs',
        {
          headers: {
            host: 'attacker.example',
            authorization: 'Bearer test-agent',
          },
        },
        (res) => {
          res.resume();
          done(res.statusCode);
        },
      );
      req.on('error', reject);
      req.end();
    });
    assert.equal(deniedHost, 403);
  } finally {
    await app.close();
    store.close();
  }
});

test('HTTP rejects oversized, malformed and cross-site input without exposing internal details', async () => {
  const store = new Store(':memory:');
  const app = createApp({
    store,
    agentToken: 'test-agent',
    humanToken: 'test-human',
    agentId: 'codex',
  });
  const url = await app.listen(0);
  const headers = {
    authorization: 'Bearer test-agent',
    'content-type': 'application/json',
  };
  try {
    const large = await fetch(url + '/api/runs', {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: 'x'.repeat(150000) }),
    });
    assert.equal(large.status, 413);
    const invalid = await fetch(url + '/api/runs', {
      method: 'POST',
      headers,
      body: '{',
    });
    assert.equal(invalid.status, 400);
    assert.equal(
      (await fetch(url + '/api/session', { headers: { origin: 'null' } }))
        .status,
      403,
    );
    assert.equal(
      (
        await fetch(url + '/api/session', {
          headers: { 'sec-fetch-site': 'cross-site' },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(url + '/api/runs', {
          headers: { authorization: 'Bearer éééééééééé' },
        })
      ).status,
      401,
    );
  } finally {
    await app.close();
    store.close();
  }
});
