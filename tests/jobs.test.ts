import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
import { jobProgress, projectJobs } from '../src/domain/jobs.js';
const plan = {
  title: 'Preparar una guía',
  jobs: [
    { id: 'prepare', title: 'Preparación' },
    { id: 'review', title: 'Revisión' },
  ],
  steps: [
    { id: 'draft', title: 'Redactar', kind: 'agent', jobId: 'prepare' },
    {
      id: 'check',
      title: 'Verificar',
      kind: 'agent',
      jobId: 'prepare',
      dependencies: ['draft'],
    },
    {
      id: 'choose',
      title: 'Elegir formato',
      kind: 'manual',
      jobId: 'review',
      dependencies: ['check'],
      interaction: {
        question: '¿Quieres ejemplos?',
        context: 'Adaptaremos la guía.',
        next: 'Codex prepara la versión elegida.',
      },
      outputs: [
        {
          name: 'examples',
          description: 'Incluir ejemplos',
          type: 'boolean',
          required: true,
        },
      ],
    },
  ],
};
test('jobs retain executable children and collapse their real dependencies', () => {
  let run = createRun(plan, 'codex');
  assert.equal(run.jobs?.length, 2);
  assert.deepEqual(
    projectJobs(run).map((s) => [s.id, s.dependencies]),
    [
      ['job:prepare', []],
      ['job:review', ['job:prepare']],
    ],
  );
  assert.equal(jobProgress(run, 'prepare').status, 'ready');
  run = transition(
    run,
    { type: 'start', stepId: 'draft' },
    { role: 'agent', id: 'codex' },
  );
  assert.equal(jobProgress(run, 'prepare').status, 'running');
  run = transition(
    run,
    { type: 'complete', stepId: 'draft', message: 'Borrador guardado' },
    { role: 'agent', id: 'codex' },
  );
  assert.equal(jobProgress(run, 'prepare').completed, 1);
  assert.equal(run.steps.find((s) => s.id === 'check')?.status, 'ready');
  assert.throws(() =>
    transition(
      run,
      { type: 'start', stepId: 'job:prepare' },
      { role: 'agent', id: 'codex' },
    ),
  );
});
test('job validation rejects dangling, duplicate, empty and reentrant groups', () => {
  for (const jobs of [
    [{ id: 'other', title: 'Other' }],
    [...plan.jobs, plan.jobs[0]],
    [...plan.jobs, { id: 'empty', title: 'Empty' }],
  ])
    assert.throws(() => createRun({ ...plan, jobs }, 'codex'));
  assert.throws(() =>
    createRun(
      {
        ...plan,
        steps: plan.steps.map((s, i) => ({
          ...s,
          jobId: i === 1 ? 'review' : 'prepare',
        })),
      },
      'codex',
    ),
  );
});
test('a human submits typed decisions without an unrelated free-text answer', () => {
  const run = createRun(
    {
      title: 'Decidir',
      steps: [{ ...plan.steps[2], jobId: undefined, dependencies: [] }],
    },
    'codex',
  );
  assert.throws(() =>
    transition(
      run,
      { type: 'submit', stepId: 'choose', outputs: { examples: true } },
      { role: 'agent', id: 'codex' },
    ),
  );
  assert.throws(() =>
    transition(
      run,
      { type: 'submit', stepId: 'choose', outputs: {} },
      { role: 'human', id: 'user' },
    ),
  );
  const result = transition(
    run,
    { type: 'submit', stepId: 'choose', outputs: { examples: false } },
    { role: 'human', id: 'user' },
  );
  assert.equal(result.status, 'completed');
  assert.equal(result.steps[0]!.outputValues?.examples, false);
  assert.match(result.events.at(-1)!.message, /decisión/i);
  const legacy = createRun(
    {
      title: 'Legacy',
      steps: [{ id: 'manual', title: 'Indica tu objetivo', kind: 'manual' }],
    },
    'codex',
  );
  assert.throws(() =>
    transition(
      legacy,
      { type: 'submit', stepId: 'manual' },
      { role: 'human', id: 'user' },
    ),
  );
});
