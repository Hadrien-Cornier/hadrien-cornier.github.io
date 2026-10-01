import test from 'node:test';
import assert from 'node:assert/strict';
import { armPose, gripperGeometry, ARM_LINK_LENGTH, WRIST_OFFSET, capturePlanningView, candidateView, planningViewPriority } from '../assets/control-visuals.mjs';
import { createSimulation, startSimulation, stepSimulation, setObjectPosition, toggleObstacle, setInferenceDelay } from '../assets/control-simulator.mjs';

test('the illustrated arm reaches the full simulator workspace with three fixed links', () => {
  for (const x of [.06, .15, .5, .84, .94]) {
    for (const y of [.08, .22, .5, .75, .9]) {
      const tip = { x: 20 + x * 400, y: 15 + y * 215 };
      const pose = armPose(tip);
      assert.ok(pose, `Unreachable point ${x},${y}`);
      assert.ok(Math.abs(Math.hypot(pose.shoulder.x - pose.base.x, pose.shoulder.y - pose.base.y) - 95) < 1e-7);
      assert.ok(Math.abs(Math.hypot(pose.elbow.x - pose.shoulder.x, pose.elbow.y - pose.shoulder.y) - ARM_LINK_LENGTH) < 1e-7);
      assert.ok(Math.abs(Math.hypot(pose.tip.x - pose.elbow.x, pose.tip.y - pose.elbow.y) - ARM_LINK_LENGTH) < 1e-7);
      assert.ok(pose.elbow.x >= 13 && pose.elbow.x <= 427 && pose.elbow.y >= 13 && pose.elbow.y <= 242, `Clipped elbow at ${x},${y}`);
      assert.ok(Math.abs(Math.hypot(pose.wrist.x - pose.tip.x, pose.wrist.y - pose.tip.y) - WRIST_OFFSET) < 1e-7);
      assert.deepEqual(pose.tip, tip);
    }
  }
});

test('rotated jaws and rear wrist clear every corner of the axis-aligned carried cube', () => {
  for (let angle = 0; angle < 360; angle++) {
    const closed = gripperGeometry(angle, true);
    const open = gripperGeometry(angle, false);
    assert.ok(open.gap > closed.gap);
    const radians = angle * Math.PI / 180;
    for (const x of [-9.5, 9.5]) for (const y of [-9.5, 9.5]) {
      const localX = x * Math.cos(radians) + y * Math.sin(radians);
      const localY = -x * Math.sin(radians) + y * Math.cos(radians);
      assert.ok(Math.abs(localY) + 1.5 + .9 < closed.gap, `Jaw clips cube at ${angle} degrees`);
      assert.ok(localX > closed.palmX + 2 + 1, `Palm clips cube at ${angle} degrees`);
      assert.ok(localX > closed.wristX + 6 + .5 + 1, `Wrist clips cube at ${angle} degrees`);
    }
  }
});

test('default red and blue trials keep the same elbow branch without jumps', () => {
  for (const target of [{ x: 240, y: 107.45 }, { x: 308, y: 156.9 }]) {
    let previous = null;
    let priorSide = null;
    for (const [from, to] of [[{ x: 80, y: 176.25 }, target], [target, { x: 356, y: 62.3 }]]) {
      for (let index = 0; index <= 1000; index++) {
        const tip = { x: from.x + (to.x - from.x) * index / 1000, y: from.y + (to.y - from.y) * index / 1000 };
        const pose = armPose(tip, previous);
        assert.ok(pose);
        if (previous) assert.ok(Math.hypot(pose.elbow.x - previous.x, pose.elbow.y - previous.y) < 3, 'Discontinuous elbow move');
        const side = Math.sign((tip.x - pose.shoulder.x) * (pose.elbow.y - pose.shoulder.y) - (tip.y - pose.shoulder.y) * (pose.elbow.x - pose.shoulder.x));
        if (priorSide !== null) assert.equal(side, priorSide, 'The elbow branch changed');
        priorSide = side;
        previous = pose.elbow;
      }
    }
  }
  assert.equal(armPose({ x: Infinity, y: 0 }), null);
});

test('a fully folded singularity preserves the previous elbow and can cross smoothly', () => {
  let previous = armPose({ x: 209.9, y: 130 }).elbow;
  for (const x of [209.99, 210, 210.01, 210.1]) {
    const pose = armPose({ x, y: 130 }, previous);
    assert.ok(Math.hypot(pose.elbow.x - previous.x, pose.elbow.y - previous.y) < 1);
    previous = pose.elbow;
  }
});

test('a retained plan keeps actual engine predictions and scene without later mutation', () => {
  const state = createSimulation({ mode: 'world' });
  startSimulation(state);
  stepSimulation(state, .1);
  const view = capturePlanningView(state);
  assert.ok(view);
  const before = structuredClone(view);
  for (let index = 0; index < 70; index++) stepSimulation(state, .1);
  assert.deepEqual(view, before);
  assert.ok(planningViewPriority(view) > 0);
  for (let index = 0; index < 3; index++) {
    const candidate = candidateView(view, index);
    assert.equal(candidate.samples.length, 3);
    assert.ok(candidate.samples.every(p => view.predictions.some(source => source.candidate === index && source.t === p.t && source.x === p.x && source.y === p.y)));
    assert.ok(candidate.samples[0].t <= candidate.samples[1].t && candidate.samples[1].t <= candidate.samples[2].t);
  }
});

test('candidate captions follow the collision and choice recorded by the engine', () => {
  const view = { time: 0, selected: 1, routes: [[], [], []], predictions: [
    { x: 0, y: 0, t: 0, candidate: 0, collision: true },
    { x: 0, y: 0, t: 0, candidate: 1, collision: false },
    { x: 0, y: 0, t: 0, candidate: 2, collision: false },
  ] };
  assert.equal(candidateView(view, 0).cue, 'Blocked');
  assert.equal(candidateView(view, 1).cue, 'Chosen');
  assert.equal(candidateView(view, 2).cue, 'Alternative');
  assert.match(candidateView(view, 1).reason, /Shortest/);
  view.selected = 0;
  view.predictions.forEach(p => { p.collision = true; });
  assert.equal(candidateView(view, 0).cue, 'Chosen, but risky');
});

test('future comparison uses the exact request scene after many display ticks and edits', () => {
  const state = createSimulation({ mode: 'world', scenario: 'moving-target', latency: .3 });
  startSimulation(state);
  const request = state.predictionContext;
  const sourceObjects = structuredClone(state.objects);
  assert.equal(request.time, 0);
  assert.equal(state.predictions[0].t, request.time + request.latency);
  stepSimulation(state, .1);
  assert.equal(state.time, .1);
  assert.notDeepEqual(state.objects, sourceObjects);
  setObjectPosition(state, 'blue', .2, .2);
  toggleObstacle(state);
  setInferenceDelay(state, .6);
  const view = capturePlanningView(state);
  assert.equal(view.time, 0);
  assert.deepEqual(view.objects, sourceObjects);
  assert.equal(view.obstacle.enabled, false);
  assert.equal(view.predictions[0].t - view.time, .3);
  assert.equal(view.trailIndex, request.trailIndex);
  assert.ok(Object.isFrozen(request));
  assert.ok(Object.isFrozen(request.objects));
  assert.ok(request.objects.every(Object.isFrozen));
  assert.ok(Object.isFrozen(request.obstacle));
  assert.throws(() => { request.objects[0].x = 0; }, TypeError);
  for (let index = 0; index < 8; index++) stepSimulation(state, .1);
  assert.deepEqual(view.objects, sourceObjects);
  assert.equal(view.time, 0);
  assert.deepEqual(request.objects, sourceObjects);
});
