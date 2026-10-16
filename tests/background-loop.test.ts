import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVideoLoop } from '../docs/site/.vitepress/components/video-loop.js';

function player() {
  return {
    currentTime: 0,
    duration: 10,
    readyState: 4,
    paused: true,
    style: { opacity: '', zIndex: '' },
    play() {
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
  };
}
test('background overlaps the end with a moving start, only rewinding hidden media', () => {
  const a = player(),
    b = player();
  const loop = createVideoLoop([a, b]);
  loop.setEnabled(true);
  a.currentTime = 8;
  loop.tick();
  assert.equal(b.paused, false);
  assert.equal(b.style.opacity, '0');
  b.currentTime = 1;
  loop.tick();
  assert.equal(Number(b.style.opacity), 0.5);
  assert.equal(a.style.opacity, '1');
  loop.setEnabled(false);
  assert.equal(a.paused, true);
  assert.equal(b.paused, true);
  loop.tick();
  assert.equal(Number(b.style.opacity), 0.5);
  loop.setEnabled(true);
  b.currentTime = 2;
  loop.tick();
  assert.equal(b.style.opacity, '1');
  assert.equal(a.style.opacity, '0');
  assert.equal(a.paused, true);
  assert.equal(b.currentTime, 2); // Never seek the visible layer back to zero.
  b.currentTime = 8;
  loop.tick();
  assert.equal(a.currentTime, 0);
  assert.equal(a.style.opacity, '0');
  a.currentTime = 2;
  loop.tick();
  assert.equal(a.style.opacity, '1');
  assert.equal(b.style.opacity, '0');
});
test('an unready buffer holds the last frame rather than exposing a restart', () => {
  const a = player(),
    b = player();
  b.readyState = 1;
  const loop = createVideoLoop([a, b]);
  loop.setEnabled(true);
  a.currentTime = 10;
  loop.tick();
  assert.equal(a.style.opacity, '1');
  assert.equal(b.style.opacity, '0');
  b.readyState = 4;
  loop.tick();
  assert.equal(b.style.opacity, '0');
  assert.equal(b.paused, false);
});

test('reduced motion restores the poster layer after the second player takes over', () => {
  const a = player(),
    b = player();
  const loop = createVideoLoop([a, b]);
  loop.setEnabled(true);
  a.currentTime = 8;
  loop.tick();
  b.currentTime = 2;
  loop.tick();
  loop.reset();
  assert.equal(a.style.opacity, '1');
  assert.equal(b.style.opacity, '0');
  assert.equal(a.paused, true);
  assert.equal(b.paused, true);
});
