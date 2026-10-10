#!/usr/bin/env node
import { VERSION } from '../version.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { openPresentation } from './desktop.js';
import { HyperionClient } from './client.js';
import { outputValuesSchema, traceSchema } from '../domain/contracts.js';
import { planSchema } from '../domain/workflow.js';
const client = new HyperionClient();
const server = new McpServer(
  { name: 'hyperion', version: VERSION },
  {
    instructions:
      'Turn the given request into a specific plan, preserve the original text in plan.request, and show the returned URL. Do not require the human to write JSON or reuse a canned demo. Start only ready agent steps, execute actual work, then report evidence. Human input and approvals must happen in the Hyperion UI. After showing the canvas URL in a progress message, use hyperion_wait to receive human decisions before ending your turn. On a changed revision, continue ready work in the same turn. If you end your turn, explain that an idle chat needs the canvas continuation message. For known choices use string output form.options [{value,label}], never a free-text list. Never impersonate the human or bypass a blocked step. This server does not execute the work for you.',
  },
);
const output = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
});
const safe = (action: () => Promise<unknown>) =>
  action()
    .then(output)
    .catch((error: unknown) => ({
      isError: true,
      ...output({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }));
server.registerTool(
  'hyperion_create_run',
  {
    description:
      'Create a workflow derived from the user request. Include the original text in plan.request; generate the steps yourself and obtain a URL for the human. Use jobs metadata and step.jobId to group executable steps. Human steps should declare interaction.question/context/next and clear output descriptions. Use typed inputs/outputs on tasks. For process notation set profile=bpmn-lite and use one start/end and structured pairs of parallel, exclusive or inclusive gateways; conditional splits need a defaultTarget. Read the plan schema. Reuse commandId on retries.',
    inputSchema: { plan: planSchema, commandId: z.string().min(1).max(128) },
  },
  ({ plan, commandId }) =>
    safe(async () => {
      const run = await client.create(plan, commandId);
      return { ...run, url: client.link(run) };
    }),
);
server.registerTool(
  'hyperion_open',
  {
    description:
      'Open an existing run in the presentation explicitly chosen by the user in the chat. split returns its browser URL; desktop launches the registered local Hyperion Desktop. Does not create a run or execute work. If Desktop is absent, keep the browser URL available and explain that the app must be installed/opened once.',
    inputSchema: {
      runId: z.string().uuid(),
      presentation: z.enum(['split', 'desktop']),
    },
    annotations: { destructiveHint: false, openWorldHint: false },
  },
  ({ runId, presentation }) =>
    safe(() => openPresentation(client, runId, presentation)),
);
server.registerTool(
  'hyperion_list_runs',
  {
    description: 'List recent local workflow executions.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  () => safe(() => client.list()),
);
server.registerTool(
  'hyperion_get_run',
  {
    description:
      'Read the current workflow, human input, approvals and evidence.',
    inputSchema: { runId: z.string().uuid() },
    annotations: { readOnlyHint: true },
  },
  ({ runId }) => safe(() => client.get(runId)),
);
server.registerTool(
  'hyperion_step',
  {
    description:
      'Start a ready agent step or report real progress/results. complete, fail and log require evidence in message. Supply declared output values when completing tasks. Send the attempt returned by start with every complete/fail/log; required after a retry. Recovery invalidates old attempts but cannot cancel external tools; inspect their effects before repeating work. For log use trace.kind summary (public decision summary), action or observation, optionally trace.tool. Never request private chain-of-thought. Human decisions are deliberately unavailable.',
    inputSchema: {
      runId: z.string().uuid(),
      stepId: z.string(),
      action: z.enum(['start', 'complete', 'fail', 'log', 'retry']),
      message: z.string().max(8000).optional(),
      outputs: outputValuesSchema.optional(),
      trace: traceSchema.optional(),
      attempt: z.number().int().positive().optional(),
      commandId: z.string().min(1).max(128),
    },
  },
  ({ runId, stepId, action, message, commandId, outputs, trace, attempt }) =>
    safe(() =>
      client.command(runId, {
        type: action,
        stepId,
        message,
        commandId,
        outputs,
        trace,
        attempt,
      }),
    ),
);
server.registerTool(
  'hyperion_revise_plan',
  {
    description:
      'Exceptionally revise unstarted future work after the user changes scope. Read the current run first and submit the complete revised plan, preserving original request/context/profile, executed or presented steps and their jobs. No task may be running. Requires the current revision and a clear reason. Archives the change and pauses the run for human review; only the person can resume in the canvas. Never use this to bypass a human decision.',
    inputSchema: {
      runId: z.string().uuid(),
      plan: planSchema,
      reason: z.string().trim().min(1).max(8000),
      expectedRevision: z.number().int().nonnegative(),
      commandId: z.string().min(1).max(128),
    },
  },
  ({ runId, plan, reason, expectedRevision, commandId }) =>
    safe(() =>
      client.command(runId, {
        type: 'revise',
        plan,
        message: reason,
        expectedRevision,
        commandId,
      }),
    ),
);
server.registerTool(
  'hyperion_wait',
  {
    description:
      'Subscribe for up to 55 seconds. A human confirmation or retry delivers the new state immediately without polling. Continue ready work in this turn, without requesting another chat message. A timeout does not mean approval. Resume only according to returned state.',
    inputSchema: {
      runId: z.string().uuid(),
      afterRevision: z.number().int().nonnegative(),
      timeoutSeconds: z.number().min(0).max(55).default(30),
    },
    annotations: { readOnlyHint: true },
  },
  ({ runId, afterRevision, timeoutSeconds }) =>
    safe(() => client.wait(runId, afterRevision, timeoutSeconds)),
);
await server.connect(new StdioServerTransport());
