import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
import {
  contextForStep,
  presentRun,
  routeLabel,
} from '../src/domain/context.js';
const agent = { role: 'agent' as const, id: 'codex' };
test('context inputs are typed and completed ancestors carry evidence across phases', () => {
  let run = createRun(
    {
      title: 'Context',
      request: 'Prepare a report',
      context: { audience: 'Team' },
      steps: [
        {
          id: 'a',
          title: 'Research',
          kind: 'agent',
          inputs: [
            {
              name: 'audience',
              type: 'string',
              required: true,
              contextKey: 'audience',
            },
          ],
          outputs: [{ name: 'report', type: 'string', required: true }],
        },
        {
          id: 'b',
          title: 'Publish',
          kind: 'agent',
          dependencies: ['a'],
          inputs: [
            {
              name: 'report',
              type: 'string',
              required: true,
              source: { stepId: 'a', output: 'report' },
            },
          ],
        },
        { id: 'other', title: 'Unrelated', kind: 'agent' },
      ],
    },
    'codex',
  );
  assert.deepEqual(run.steps[0]!.inputValues, { audience: 'Team' });
  assert.equal(contextForStep(run, run.steps[1]!).previous.length, 0);
  run = transition(run, { type: 'start', stepId: 'a' }, agent);
  run = transition(
    run,
    {
      type: 'complete',
      stepId: 'a',
      message: 'Research verified',
      outputs: { report: 'Evidence' },
    },
    agent,
  );
  assert.deepEqual(run.steps[1]!.inputValues, { report: 'Evidence' });
  const context = presentRun(run).steps[1]!.availableContext!;
  assert.equal(context.request, 'Prepare a report');
  assert.equal(context.previous.length, 1);
  assert.equal(context.previous[0]!.outputs.report, 'Evidence');
  const omitted = {
    ...run,
    steps: run.steps.map((s) =>
      s.id === 'a' ? { ...s, status: 'skipped' as const } : s,
    ),
  };
  assert.equal(contextForStep(omitted, omitted.steps[1]!).previous.length, 0);
  assert.throws(() =>
    createRun(
      {
        title: 'Invalid',
        context: { n: 4 },
        steps: [
          {
            id: 'a',
            title: 'A',
            kind: 'agent',
            inputs: [
              { name: 'n', type: 'string', required: true, contextKey: 'n' },
            ],
          },
        ],
      },
      'codex',
    ),
  );
  assert.throws(() =>
    createRun(
      {
        title: 'Ambiguous',
        context: { n: 4 },
        steps: [
          {
            id: 'a',
            title: 'A',
            kind: 'agent',
            inputs: [{ name: 'n', type: 'number', contextKey: 'n', value: 4 }],
          },
        ],
      },
      'codex',
    ),
  );
});
test('route labels explain choices without exposing predicates', () => {
  const run = createRun(
    {
      title: 'Labels',
      steps: [
        {
          id: 'choice',
          title: 'Choice',
          kind: 'manual',
          outputs: [
            {
              name: 'clear',
              type: 'boolean',
              form: {
                trueLabel: 'Sí, continuar',
                falseLabel: 'Necesito ayuda',
              },
            },
          ],
        },
      ],
    },
    'codex',
  );
  const source = {
    ...run.steps[0]!,
    gateway: {
      type: 'exclusive' as const,
      direction: 'split' as const,
      defaultTarget: 'no',
      routes: [
        {
          target: 'yes',
          when: { stepId: 'choice', output: 'clear', equals: true },
        },
        { target: 'no' },
      ],
    },
  };
  assert.equal(routeLabel(run, source, 'yes'), 'Sí, continuar');
  assert.equal(routeLabel(run, source, 'no'), 'Necesito ayuda');
});
