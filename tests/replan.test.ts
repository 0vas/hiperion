import { test } from 'node:test';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { createRun, transition } from '../src/domain/workflow.js';
import { Store } from '../src/server/store.js';
const agent = { role: 'agent' as const, id: 'codex' };
const human = { role: 'human' as const, id: 'user' };
const plan = {
  title: 'Report',
  request: 'Prepare a report',
  steps: [
    {
      id: 'read',
      title: 'Read',
      kind: 'agent',
      outputs: [{ name: 'facts', type: 'string', required: true }],
    },
    { id: 'write', title: 'Write', kind: 'agent', dependencies: ['read'] },
  ],
};
const revised = {
  ...plan,
  steps: [
    plan.steps[0],
    {
      id: 'write',
      title: 'Write summary',
      kind: 'agent',
      dependencies: ['read'],
      inputs: [
        {
          name: 'facts',
          type: 'string',
          required: true,
          source: { stepId: 'read', output: 'facts' },
        },
      ],
    },
    {
      id: 'review',
      title: 'Review summary',
      kind: 'approval',
      dependencies: ['write'],
    },
  ],
};
function prepared() {
  let r = createRun(plan, 'codex');
  r = transition(r, { type: 'start', stepId: 'read' }, agent);
  return transition(
    r,
    {
      type: 'complete',
      stepId: 'read',
      message: 'Verified',
      outputs: { facts: 'Evidence' },
    },
    agent,
  );
}
test('future plan revision preserves evidence, records a diff and waits for human resume', () => {
  const before = prepared();
  const next = transition(
    before,
    {
      type: 'revise',
      plan: revised,
      message: 'The user requested a shorter report',
      expectedRevision: before.revision,
    },
    agent,
  );
  assert.equal(next.status, 'paused');
  assert.deepEqual(next.steps[0], before.steps[0]);
  assert.equal(next.steps[1]!.inputValues?.facts, 'Evidence');
  assert.equal(next.planChanges?.length, 1);
  assert.deepEqual(next.planChanges?.[0]?.added, ['review']);
  assert.deepEqual(next.planChanges?.[0]?.changed, ['write']);
  assert.equal(next.planChanges?.[0]?.previousPlan.steps[1]?.title, 'Write');
  assert.equal(next.events.at(-1)?.type, 'revise');
  assert.throws(
    () => transition(next, { type: 'start', stepId: 'write' }, agent),
    /paused/i,
  );
  const resumed = transition(next, { type: 'resume' }, human);
  assert.equal(
    transition(resumed, { type: 'start', stepId: 'write' }, agent).steps[1]
      ?.status,
    'running',
  );
});
test('revision rejects stale state, active work, history edits and human impersonation', () => {
  const before = prepared();
  const cmd = {
    type: 'revise',
    plan: revised,
    message: 'Scope changed',
    expectedRevision: before.revision,
  };
  assert.throws(() => transition(before, cmd, human), /agent/i);
  assert.throws(
    () => transition(before, { ...cmd, expectedRevision: 0 }, agent),
    /revision/i,
  );
  assert.throws(
    () => transition(before, { ...cmd, expectedRevision: undefined }, agent),
    /revision/i,
  );
  assert.throws(
    () => transition(before, { ...cmd, message: '' }, agent),
    /reason/i,
  );
  assert.throws(() =>
    transition(
      before,
      { ...cmd, plan: { ...revised, steps: revised.steps.slice(1) } },
      agent,
    ),
  );
  assert.throws(
    () =>
      transition(
        before,
        {
          ...cmd,
          plan: {
            ...revised,
            steps: [
              { ...plan.steps[0], title: 'Rewritten' },
              ...revised.steps.slice(1),
            ],
          },
        },
        agent,
      ),
    /preserve/i,
  );
  const active = transition(before, { type: 'start', stepId: 'write' }, agent);
  assert.throws(
    () =>
      transition(active, { ...cmd, expectedRevision: active.revision }, agent),
    /running/i,
  );
  const waiting = createRun(
    {
      title: 'Decision',
      steps: [{ id: 'human', title: 'Your choice', kind: 'approval' }],
    },
    'codex',
  );
  assert.throws(
    () =>
      transition(
        waiting,
        {
          ...cmd,
          expectedRevision: waiting.revision,
          plan: {
            title: 'Decision',
            steps: [{ id: 'human', title: 'Skip approval', kind: 'agent' }],
          },
        },
        agent,
      ),
    /preserve/i,
  );
});
test('revisions are transactional and idempotent', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hyperion-replan-'));
  const filename = join(directory, 'state.sqlite');
  let db = new Store(filename);
  try {
    let r = db.create(plan, agent, 'create');
    r = db.command(
      r.id,
      { type: 'start', stepId: 'read', commandId: 'start' },
      agent,
    );
    r = db.command(
      r.id,
      {
        type: 'complete',
        stepId: 'read',
        message: 'Done',
        outputs: { facts: 'Data' },
        commandId: 'done',
      },
      agent,
    );
    const cmd = {
      type: 'revise',
      plan: revised,
      message: 'Shorter report',
      expectedRevision: r.revision,
      commandId: 'revise',
    };
    const changed = db.command(r.id, cmd, agent);
    db.close();
    db = new Store(filename);
    assert.deepEqual(db.command(r.id, cmd, agent), changed);
    assert.deepEqual(db.get(r.id).planChanges, changed.planChanges);
    assert.throws(() =>
      db.command(r.id, { ...cmd, commandId: 'stale' }, agent),
    );
    assert.deepEqual(db.get(r.id), changed);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a structured process accepts future branch work without reopening resolved gateways', () => {
  const input = JSON.parse(
    readFileSync('examples/process-review.json', 'utf8'),
  );
  let run = createRun(input, 'codex');
  run = transition(
    run,
    { type: 'submit', stepId: 'scope', outputs: { docs: true, code: false } },
    human,
  );
  const selected = structuredClone(run.steps.find((s) => s.id === 'split'));
  const next = structuredClone(input);
  next.steps.push({
    id: 'summary',
    title: 'Summarize documentation',
    kind: 'agent',
    dependencies: ['docs'],
    inputs: [
      {
        name: 'report',
        type: 'string',
        required: true,
        source: { stepId: 'docs', output: 'report' },
      },
    ],
  });
  next.steps.find((s: { id: string }) => s.id === 'join').dependencies = [
    'summary',
    'code',
    'fallback',
  ];
  run = transition(
    run,
    {
      type: 'revise',
      plan: next,
      message: 'Add a summary for the user',
      expectedRevision: run.revision,
    },
    agent,
  );
  assert.equal(run.status, 'paused');
  assert.deepEqual(
    run.steps.find((s) => s.id === 'split'),
    selected,
  );
  run = transition(run, { type: 'resume' }, human);
  run = transition(run, { type: 'start', stepId: 'docs' }, agent);
  run = transition(
    run,
    {
      type: 'complete',
      stepId: 'docs',
      message: 'Reviewed',
      outputs: { report: 'Source report' },
    },
    agent,
  );
  assert.equal(
    run.steps.find((s) => s.id === 'summary')?.inputValues?.report,
    'Source report',
  );
  run = transition(run, { type: 'start', stepId: 'summary' }, agent);
  run = transition(
    run,
    { type: 'complete', stepId: 'summary', message: 'Summary produced' },
    agent,
  );
  run = transition(run, { type: 'approve', stepId: 'approve' }, human);
  assert.equal(run.status, 'completed');
  assert.equal(run.steps.find((s) => s.id === 'code')?.status, 'skipped');
});
