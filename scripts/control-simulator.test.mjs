import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODES, createSimulation, stepSimulation, setObjectPosition, setInstruction,
  toggleObstacle, setInferenceDelay, resetSimulation, startSimulation, pauseSimulation,
} from '../assets/control-simulator.mjs';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be near ${expected}`);
const separation = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function advance(state, seconds, dt = 1 / 60) {
  const count = Math.round(seconds / dt);
  for (let i = 0; i < count; i++) stepSimulation(state, dt);
  return state;
}
function run(state) {
  startSimulation(state);
  for (let i = 0; i < 900 && state.running; i++) stepSimulation(state);
  assert.equal(state.running, false, 'the 12-second limit must stop every run');
  return state;
}

test('a fixed taught path succeeds, then misses when the user moves its object', () => {
  const original = run(createSimulation());
  assert.equal(original.phase, 'success');
  near(separation(original.objects[0], original.tray), 0);
  assert.equal(original.robot.carrying, null);
  const moved = createSimulation();
  assert.equal(setObjectPosition(moved, 'red', .30, .25), true);
  run(moved);
  assert.equal(moved.phase, 'miss');
  near(moved.objects[0].x, .30);
  near(moved.objects[0].y, .25);
  assert.ok(moved.trail.some((p) => separation(p, {x:.55, y:.43}) < .007), 'the arm still visits its taught pickup point');
});

test('synchronous and real-time chunks share speed, horizon, and inference cost', () => {
  const chunks = run(createSimulation({mode:'chunks'}));
  const realtime = run(createSimulation({mode:'realtime'}));
  assert.equal(chunks.phase, 'success');
  assert.equal(realtime.phase, 'success');
  assert.deepEqual(chunks.settings, realtime.settings);
  near(chunks.settings.speed, .27);
  near(chunks.settings.chunkDuration, .60);
  near(chunks.stats.waitTime, chunks.stats.replans * .30);
  near(realtime.stats.waitTime, .30);
  near(chunks.stats.distance, realtime.stats.distance);
  assert.ok(chunks.stats.elapsed > realtime.stats.elapsed + 1);
});

test('real-time planning overlaps motion and never rewrites its committed prefix', () => {
  const state = createSimulation({mode:'realtime'});
  startSimulation(state);
  for (let i = 0; i < 200 && !state.committed.length; i++) stepSimulation(state);
  assert.ok(state.committed.length >= 2);
  const before = structuredClone(state.committed);
  const destination = before.at(-1);
  const position = {...state.robot};
  const wait = state.stats.waitTime;
  assert.equal(setObjectPosition(state, 'red', .30, .20), true);
  advance(state, .10);
  assert.ok(separation(position, state.robot) > .02, 'the current batch keeps executing during inference');
  near(state.stats.waitTime, wait);
  near(state.committed.at(-1).x, destination.x);
  near(state.committed.at(-1).y, destination.y);
  assert.equal(state.phase, 'moving');
});

test('zero and maximum inference delay work without an extra RTC stall', () => {
  for (const latency of [0, .60]) {
    const state = run(createSimulation({mode:'realtime', latency}));
    assert.equal(state.phase, 'success');
    near(state.stats.waitTime, latency);
  }
  const zeroChunks = run(createSimulation({mode:'chunks', latency:0}));
  assert.equal(zeroChunks.phase, 'success');
  near(zeroChunks.stats.waitTime, 0);
});

test('an in-flight inference keeps its old delay; changes affect later requests', () => {
  const state = createSimulation({mode:'chunks'});
  startSimulation(state);
  advance(state, .10);
  assert.equal(setInferenceDelay(state, 0), true);
  advance(state, .10);
  assert.equal(state.phase, 'planning');
  assert.equal(state.stats.distance, 0);
  run(state);
  assert.equal(state.phase, 'success');
  near(state.stats.waitTime, .30);
  assert.equal(setInferenceDelay(state, 99), true);
  near(state.settings.latency, .60);
  assert.equal(setInferenceDelay(state, -2), true);
  near(state.settings.latency, 0);
  assert.equal(setInferenceDelay(state, NaN), false);
});

test('a carried object follows the arm in every mode and cannot be detached by dragging', () => {
  for (const {id:mode} of MODES) {
    const state = createSimulation({mode});
    startSimulation(state);
    let observedCarry = false;
    while (state.running) {
      stepSimulation(state);
      if (!state.robot.carrying) continue;
      observedCarry = true;
      const carried = state.objects.find((object) => object.id === state.robot.carrying);
      near(separation(carried, state.robot), 0);
      assert.equal(setObjectPosition(state, carried.id, .1, .1), false);
      near(separation(carried, state.robot), 0);
    }
    assert.ok(observedCarry, `${mode} must physically pick up an object`);
    assert.equal(state.phase, 'success');
  }
});

test('collision comes from the executed geometry, including an obstacle added during a run', () => {
  const blocked = createSimulation();
  toggleObstacle(blocked);
  run(blocked);
  assert.equal(blocked.phase, 'collision');
  near(separation(blocked.robot, blocked.obstacle), blocked.obstacle.r + .009);
  assert.equal(blocked.robot.carrying, null);
  const toggled = createSimulation();
  startSimulation(toggled);
  advance(toggled, .8);
  toggleObstacle(toggled);
  run(toggled);
  assert.equal(toggled.phase, 'collision');
  for (const mode of ['diffusion', 'generalist', 'world']) {
    const routed = createSimulation({mode});
    toggleObstacle(routed);
    run(routed);
    assert.equal(routed.phase, 'success', `${mode} uses its taught obstacle route`);
    assert.ok(routed.trail.every((p) => separation(p, routed.obstacle) > routed.obstacle.r + .009));
  }
});

test('task-specific controllers deliver the wrong object for blue, while the taught generalist mapping follows blue', () => {
  for (const mode of ['scripted', 'chunks', 'realtime', 'diffusion', 'world', 'generalist']) {
    const state = createSimulation({mode});
    assert.equal(setInstruction(state, 'blue'), true);
    run(state);
    assert.equal(state.phase, mode === 'generalist' ? 'success' : 'wrong-object');
    const deliveredId = mode === 'generalist' ? 'blue' : 'red';
    near(separation(state.objects.find((p) => p.id === deliveredId), state.tray), 0);
  }
  const state = createSimulation({mode:'generalist'});
  assert.equal(setInstruction(state, 'anything else'), false);
  assert.equal(state.instruction, 'red');
});

test('world predictions include a collision and stop at the same physical contact boundary', () => {
  const state = createSimulation({mode:'world'});
  toggleObstacle(state);
  startSimulation(state);
  assert.equal(state.candidates.length, 3);
  const direct = state.predictions.filter((prediction) => prediction.candidate === 0);
  const collision = direct.findIndex((prediction) => prediction.collision);
  assert.ok(collision > 0);
  const stopped = direct[collision];
  near(separation(stopped, state.obstacle), state.obstacle.r + .009);
  for (const future of direct.slice(collision)) {
    near(future.x, stopped.x);
    near(future.y, stopped.y);
    assert.equal(future.collision, true);
  }
  assert.notEqual(state.selectedCandidate, 0);
  assert.ok(state.predictions.filter((p) => p.candidate === state.selectedCandidate).every((p) => !p.collision));
  assert.ok(state.predictions.every((p) => p.t >= state.time + state.settings.latency));
  advance(state, .32);
  assert.equal(state._queue.length, 1, 'lookahead commits only its next waypoint');
});

test('diffusion refines seeded candidate plans without shaking the robot during inference', () => {
  const state = createSimulation({mode:'diffusion', seed:7});
  startSimulation(state);
  const noisy = structuredClone(state.candidates);
  const robot = {...state.robot};
  advance(state, .15);
  assert.notDeepEqual(state.candidates, noisy);
  assert.deepEqual(state.robot, robot);
  assert.equal(state.stats.distance, 0);
  const other = createSimulation({mode:'diffusion', seed:8});
  startSimulation(other);
  assert.notDeepEqual(other.candidates, noisy);
  const replay = createSimulation({mode:'diffusion', seed:7});
  startSimulation(replay);
  assert.deepEqual(replay.candidates, noisy);
});

test('fixed-step physics gives the same replay for different display frame rates', () => {
  for (const {id:mode} of MODES) {
    const states = [1/30, 1/60, 1/120].map((dt) => {
      const state = createSimulation({mode, seed:42});
      toggleObstacle(state);
      startSimulation(state);
      advance(state, 2, dt);
      return state;
    });
    assert.deepEqual(states[0], states[1], `${mode}: 30Hz versus 60Hz`);
    assert.deepEqual(states[1], states[2], `${mode}: 60Hz versus 120Hz`);
  }
  const large = createSimulation();
  startSimulation(large);
  stepSimulation(large, 10);
  near(large.time, .25, 1/120);
});

test('pause preserves the pending plan and clock; reset restores the seeded initial state', () => {
  const state = createSimulation({mode:'diffusion', seed:99});
  startSimulation(state);
  advance(state, .1);
  pauseSimulation(state);
  const paused = structuredClone(state);
  advance(state, 4);
  assert.deepEqual(state, paused);
  startSimulation(state);
  advance(state, .3);
  const uninterrupted = createSimulation({mode:'diffusion', seed:99});
  startSimulation(uninterrupted);
  advance(uninterrupted, .4);
  assert.deepEqual(state, uninterrupted);
  setObjectPosition(state, 'blue', .1, .1);
  setInstruction(state, 'blue');
  toggleObstacle(state);
  resetSimulation(state);
  assert.deepEqual(state, createSimulation({mode:'diffusion', seed:99}));
});

test('restart after a result preserves the edited scene, instruction, obstacle, and delay', () => {
  const state = createSimulation();
  setObjectPosition(state, 'red', .3, .2);
  setInstruction(state, 'blue');
  run(state);
  assert.equal(state.phase, 'miss');
  toggleObstacle(state);
  setInferenceDelay(state, .45);
  const objects = structuredClone(state.objects);
  startSimulation(state);
  assert.deepEqual(state.objects, objects);
  assert.equal(state.instruction, 'blue');
  assert.equal(state.obstacle.enabled, true);
  near(state.settings.latency, .45);
  assert.equal(state.time, 0);
  assert.equal(state.mode, 'scripted');
  near(state.robot.x, .15);
  near(state.robot.y, .75);
});

test('edited positions stay inside the workspace and invalid inputs leave the scene intact', () => {
  const state = createSimulation();
  assert.equal(setObjectPosition(state, 'red', -3, 4), true);
  assert.deepEqual(state.objects[0], {id:'red', x:.06, y:.90});
  const objects = structuredClone(state.objects);
  assert.equal(setObjectPosition(state, 'missing', .5, .5), false);
  assert.equal(setObjectPosition(state, 'red', NaN, .5), false);
  assert.deepEqual(state.objects, objects);
  assert.throws(() => createSimulation({mode:'missing'}), RangeError);
  assert.throws(() => stepSimulation(state, NaN), TypeError);
});
