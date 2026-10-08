import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createApp } from '../src/server/app.js';
import { Store } from '../src/server/store.js';

for (const coordinator of ['codex', 'claude', 'cursor'])
  test(`MCP stdio respects human gates with ${coordinator} identity`, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'hyperion-mcp-'));
    const store = new Store(':memory:');
    const app = createApp({
      store,
      agentToken: 'mcp-test-token',
      humanToken: 'human-test-token',
      agentId: 'codex',
      getAgentTokens: () => ({ [coordinator]: 'mcp-test-token' }),
    });
    const url = await app.listen(0);
    writeFileSync(
      join(dir, 'credentials.json'),
      JSON.stringify({ agentToken: 'mcp-test-token', agentId: coordinator }),
    );
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', resolve('src/adapters/mcp.ts')],
      env: {
        ...env,
        HYPERION_TOKEN: '',
        HYPERION_AGENT_ID: coordinator,
        HYPERION_URL: url,
        HYPERION_DATA_DIR: dir,
      },
      stderr: 'pipe',
    });
    const client = new Client({
      name: 'hyperion-contract-test',
      version: '1.0.0',
    });
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      assert.equal(tools.tools.length, 6);
      assert.ok(!tools.tools.some((t) => /approve|submit/.test(t.name)));
      const created = await client.callTool({
        name: 'hyperion_create_run',
        arguments: {
          commandId: 'mcp-create',
          plan: {
            title: 'MCP contract',
            steps: [
              { id: 'approval', title: 'Human decision', kind: 'approval' },
              {
                id: 'work',
                title: 'Agent work',
                kind: 'agent',
                dependencies: ['approval'],
                outputs: [{ name: 'report', type: 'string', required: true }],
              },
            ],
          },
        },
      });
      const run = JSON.parse((created.content as { text: string }[])[0]!.text);
      assert.match(run.url, /\?run=/);
      assert.equal(run.coordinator, coordinator);
      const presented = await client.callTool({
        name: 'hyperion_open',
        arguments: { runId: run.id, presentation: 'split' },
      });
      assert.equal(presented.isError, undefined);
      const view = JSON.parse(
        (presented.content as { text: string }[])[0]!.text,
      );
      assert.equal(view.runId, run.id);
      assert.equal(view.url, run.url);
      assert.equal(view.presentation, 'split');

      const blocked = await client.callTool({
        name: 'hyperion_step',
        arguments: {
          runId: run.id,
          stepId: 'work',
          action: 'start',
          commandId: 'early',
        },
      });
      assert.equal(blocked.isError, true);
      const approved = await fetch(url + `/api/runs/${run.id}/commands`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer human-test-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          type: 'approve',
          stepId: 'approval',
          expectedRevision: 1,
          commandId: 'human-choice',
        }),
      });
      assert.equal(approved.status, 200);
      const changed = await client.callTool({
        name: 'hyperion_wait',
        arguments: { runId: run.id, afterRevision: 1, timeoutSeconds: 1 },
      });
      assert.equal(
        JSON.parse((changed.content as { text: string }[])[0]!.text).revision,
        2,
      );
      const start = await client.callTool({
        name: 'hyperion_step',
        arguments: {
          runId: run.id,
          stepId: 'work',
          action: 'start',
          commandId: 'start',
        },
      });
      assert.ok(!start.isError);
      const trace = await client.callTool({
        name: 'hyperion_step',
        arguments: {
          runId: run.id,
          stepId: 'work',
          action: 'log',
          commandId: 'trace',
          message: 'Read the relevant files',
          trace: { kind: 'action', tool: 'read_file' },
        },
      });
      assert.equal(
        JSON.parse((trace.content as { text: string }[])[0]!.text).events.at(-1)
          .trace.tool,
        'read_file',
      );
      const done = await client.callTool({
        name: 'hyperion_step',
        arguments: {
          runId: run.id,
          stepId: 'work',
          action: 'complete',
          message: 'Contract test executed successfully',
          outputs: { report: 'Verified MCP output contract' },
          commandId: 'done',
        },
      });
      assert.equal(
        JSON.parse((done.content as { text: string }[])[0]!.text).steps.find(
          (s: { id: string }) => s.id === 'work',
        ).outputValues.report,
        'Verified MCP output contract',
      );
      assert.equal(
        JSON.parse((done.content as { text: string }[])[0]!.text).status,
        'completed',
      );
    } finally {
      await client.close();
      await app.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
