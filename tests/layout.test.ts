import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRun } from '../src/domain/workflow.js';
import { layoutSteps } from '../src/client/layout.js';

test('nested process blocks are separated, centered and independent of plan order', () => {
  const run = createRun(
    JSON.parse(readFileSync('examples/process-gateways.json', 'utf8')),
    'codex',
  );
  const positions = layoutSteps(run.steps);
  assert.deepEqual(layoutSteps([...run.steps].reverse()), positions);
  const center = (id: string) =>
    positions[id]!.x +
    (run.steps.find((s) => s.id === id)!.kind === 'agent' ||
    id === 'scope' ||
    id === 'approve'
      ? 140
      : 90);
  assert.equal(center('exclusive'), (center('docs') + center('noDocs')) / 2);
  assert.equal(center('xorJoin'), center('exclusive'));
  assert.equal(center('inclusive'), (center('code') + center('noChecks')) / 2);
  assert.ok(center('noDocs') + 300 < center('code'));
  for (const step of run.steps)
    for (const dep of step.dependencies)
      assert.ok(positions[step.id]!.y > positions[dep]!.y);
});

test('horizontal process preserves branch separation and puts every successor to the right', () => {
  const run = createRun(
    JSON.parse(readFileSync('examples/process-gateways.json', 'utf8')),
    'codex',
  );
  const positions = layoutSteps(run.steps, true, 'horizontal');
  assert.deepEqual(
    layoutSteps([...run.steps].reverse(), true, 'horizontal'),
    positions,
  );
  for (const s of run.steps)
    for (const dep of s.dependencies)
      assert.ok(positions[s.id]!.x >= positions[dep]!.x + 300);
  assert.ok(Math.abs(positions.docs!.y - positions.noDocs!.y) > 180);
});
