#!/usr/bin/env node
import { VERSION } from '../version.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { HyperionClient } from './client.js';
import { outputValuesSchema, traceSchema } from '../domain/contracts.js';
import { planSchema } from '../domain/workflow.js';
const client = new HyperionClient();
const server = new McpServer(
  { name: 'hyperion', version: VERSION },
  {
    instructions:
      'Turn the given request into a specific plan, preserve the original text in plan.request, and show the returned URL. Do not require the human to write JSON or reuse a canned demo. Start only ready agent steps, execute actual work, then report evidence. Human input and approvals must happen in the Hyperion UI. Use get/wait to read decisions. Never impersonate the human or bypass a blocked step. This server does not execute the work for you.',
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
      'Start a ready agent step or report real progress/results. complete, fail and log require evidence in message. Supply declared output values when completing tasks. For log use trace.kind summary (public decision summary), action or observation, optionally trace.tool. Never request private chain-of-thought. Human decisions are deliberately unavailable.',
    inputSchema: {
      runId: z.string().uuid(),
      stepId: z.string(),
      action: z.enum(['start', 'complete', 'fail', 'log', 'retry']),
      message: z.string().max(8000).optional(),
      outputs: outputValuesSchema.optional(),
      trace: traceSchema.optional(),
      commandId: z.string().min(1).max(128),
    },
  },
  ({ runId, stepId, action, message, commandId, outputs, trace }) =>
    safe(() =>
      client.command(runId, {
        type: action,
        stepId,
        message,
        commandId,
        outputs,
        trace,
      }),
    ),
);
server.registerTool(
  'hyperion_wait',
  {
    description:
      'Wait up to 55 seconds for a revision change. A timeout does not mean approval. Resume only according to returned state.',
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
