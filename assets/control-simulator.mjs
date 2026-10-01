/** Deterministic teaching simulator. Every planner below is a taught rule. */
export const MODES = Object.freeze([
  {id:'scripted', label:'Scripted path', short:'Replay a fixed taught path.'},
  {id:'chunks', label:'Synchronous chunks', short:'Wait for each frozen action batch before moving.'},
  {id:'realtime', label:'Real-time chunks', short:'Plan the next batch while the committed batch keeps moving.'},
  {id:'diffusion', label:'Diffusion plans', short:'Refine noisy action plans, then execute a short prefix.'},
  {id:'generalist', label:'Generalist policy', short:'Use a taught red/blue instruction mapping and obstacle rule.'},
  {id:'world', label:'World-model lookahead', short:'Predict candidate futures, then execute one waypoint.'},
].map(Object.freeze));

const STEP = 1 / 120;
const MAX_DT = .25;
const MAX_TIME = 12;
const SPEED = .27;
const HORIZON = .60;
const TIP_RADIUS = .009;
const GRASP_RADIUS = .035;
const EPS = 1e-10;
const WORKSPACE = {left:.06, right:.94, top:.08, bottom:.90};
const TAUGHT_PICKUP = {x:.55, y:.43};
const INITIAL_ROBOT = {x:.15, y:.75};
const FINISHED = new Set(['success', 'miss', 'collision', 'wrong-object', 'timeout']);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const point = ({x, y}) => ({x, y});
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const inside = ({x, y}) => ({x:clamp(x, WORKSPACE.left, WORKSPACE.right), y:clamp(y, WORKSPACE.top, WORKSPACE.bottom)});
const length = (route) => route.slice(1).reduce((sum, p, i) => sum + distance(route[i], p), 0);

function random(state) {
  state._rng = (state._rng + 0x6D2B79F5) >>> 0;
  let n = state._rng;
  n = Math.imul(n ^ (n >>> 15), n | 1);
  n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
  return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
}

function segmentDistance(a, b, center) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const squared = dx * dx + dy * dy;
  const t = squared ? clamp(((center.x - a.x) * dx + (center.y - a.y) * dy) / squared, 0, 1) : 0;
  return Math.hypot(a.x + t * dx - center.x, a.y + t * dy - center.y);
}

function collides(route, obstacle, padding = TIP_RADIUS) {
  return obstacle.enabled && route.slice(1).some((p, i) => segmentDistance(route[i], p, obstacle) <= obstacle.r + padding);
}

/** First physical contact along this segment, independent of controller mode. */
function contact(a, b, obstacle) {
  if (!obstacle.enabled) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - obstacle.x;
  const fy = a.y - obstacle.y;
  const radius = obstacle.r + TIP_RADIUS;
  const c = fx * fx + fy * fy - radius * radius;
  if (c <= EPS) return 0;
  const qa = dx * dx + dy * dy;
  if (qa <= EPS * EPS) return null;
  const qb = 2 * (fx * dx + fy * dy);
  const discriminant = qb * qb - 4 * qa * c;
  if (discriminant < 0) return null;
  const t = (-qb - Math.sqrt(discriminant)) / (2 * qa);
  return t >= -EPS && t <= 1 + EPS ? clamp(t, 0, 1) : null;
}

/** A small visibility graph supplies the obstacle rule used by the toy planners. */
function avoidRoute(from, goal, obstacle, side = 'either') {
  const direct = [point(from), point(goal)];
  if (!collides(direct, obstacle)) return direct;
  const ringRadius = obstacle.r + TIP_RADIUS + .032;
  const nodes = [point(from), point(goal)];
  for (let i = 0; i < 32; i++) {
    const angle = i * Math.PI * 2 / 32;
    const p = {x:obstacle.x + Math.cos(angle) * ringRadius, y:obstacle.y + Math.sin(angle) * ringRadius};
    if (p.x < WORKSPACE.left || p.x > WORKSPACE.right || p.y < WORKSPACE.top || p.y > WORKSPACE.bottom) continue;
    if (side === 'top' && p.y > obstacle.y + EPS) continue;
    if (side === 'bottom' && p.y < obstacle.y - EPS) continue;
    nodes.push(p);
  }
  const costs = nodes.map(() => Infinity);
  const previous = nodes.map(() => -1);
  const visited = new Set();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    }
    if (current < 0 || !Number.isFinite(costs[current])) break;
    if (current === 1) {
      const route = [];
      for (let cursor = 1; cursor >= 0; cursor = previous[cursor]) route.unshift(point(nodes[cursor]));
      return route;
    }
    visited.add(current);
    for (let next = 0; next < nodes.length; next++) {
      if (visited.has(next) || next === current) continue;
      if (segmentDistance(nodes[current], nodes[next], obstacle) <= obstacle.r + TIP_RADIUS + .002) continue;
      const cost = costs[current] + distance(nodes[current], nodes[next]);
      if (cost + EPS < costs[next]) { costs[next] = cost; previous[next] = current; }
    }
  }
  // An unreachable target still goes through the same physical collision check.
  return direct;
}

function smoothRoute(route, obstacle) {
  if (route.length < 3) return route;
  const result = [point(route[0])];
  for (let i = 1; i < route.length - 1; i++) {
    const a = route[i - 1];
    const b = route[i];
    const c = route[i + 1];
    const beforeLength = distance(a, b);
    const afterLength = distance(b, c);
    const trim = Math.min(.02, beforeLength / 4, afterLength / 4);
    if (trim <= EPS) { result.push(point(b)); continue; }
    const before = {x:b.x + (a.x - b.x) * trim / beforeLength, y:b.y + (a.y - b.y) * trim / beforeLength};
    const after = {x:b.x + (c.x - b.x) * trim / afterLength, y:b.y + (c.y - b.y) * trim / afterLength};
    result.push(before);
    for (let j = 1; j <= 4; j++) {
      const t = j / 4;
      result.push({x:(1-t)**2 * before.x + 2*(1-t)*t*b.x + t*t*after.x, y:(1-t)**2 * before.y + 2*(1-t)*t*b.y + t*t*after.y});
    }
  }
  result.push(point(route.at(-1)));
  return collides(result, obstacle) ? route : result;
}

function candidateRoutes(from, goal, obstacle, smoothing = true) {
  const direct = [point(from), point(goal)];
  const shape = (route) => smoothing ? smoothRoute(route, obstacle) : route;
  if (collides(direct, obstacle)) return [direct, shape(avoidRoute(from, goal, obstacle, 'top')), shape(avoidRoute(from, goal, obstacle, 'bottom'))];
  const d = distance(from, goal);
  const middle = {x:(from.x + goal.x) / 2, y:(from.y + goal.y) / 2};
  const bend = (sign) => inside({x:middle.x - sign * (goal.y - from.y) * .06 / (d || 1), y:middle.y + sign * (goal.x - from.x) * .06 / (d || 1)});
  return [direct, shape([point(from), bend(1), point(goal)]), shape([point(from), bend(-1), point(goal)])];
}

function denseRoute(route) {
  const result = [point(route[0])];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const count = Math.max(1, Math.ceil(distance(a, b) / .035));
    for (let j = 1; j <= count; j++) result.push({x:a.x + (b.x - a.x) * j / count, y:a.y + (b.y - a.y) * j / count});
  }
  return result;
}

function chooseRoute(routes, obstacle) {
  let chosen = -1;
  for (let i = 0; i < routes.length; i++) {
    if (collides(routes[i], obstacle)) continue;
    if (chosen < 0 || length(routes[i]) < length(routes[chosen])) chosen = i;
  }
  return chosen < 0 ? 0 : chosen;
}

function atDistance(route, requested) {
  let remaining = requested;
  for (let i = 1; i < route.length; i++) {
    const d = distance(route[i - 1], route[i]);
    if (remaining <= d && d > EPS) return {x:route[i - 1].x + (route[i].x - route[i - 1].x) * remaining / d, y:route[i - 1].y + (route[i].y - route[i - 1].y) * remaining / d};
    remaining -= d;
  }
  return point(route.at(-1));
}

function predictionsFor(routes, snapshot, speed) {
  return routes.flatMap((route, candidate) => {
    const duration = length(route) / speed;
    const frames = Math.max(2, Math.ceil(duration / .25));
    let hitDistance = Infinity;
    let traveled = 0;
    for (let i = 1; i < route.length; i++) {
      const hit = contact(route[i - 1], route[i], snapshot.obstacle);
      if (hit !== null) { hitDistance = traveled + distance(route[i - 1], route[i]) * hit; break; }
      traveled += distance(route[i - 1], route[i]);
    }
    return Array.from({length:frames + 1}, (_, i) => {
      const offset = duration * i / frames;
      const requested = speed * offset;
      const p = atDistance(route, Math.min(requested, hitDistance));
      return {...p, t:snapshot.startTime + snapshot.latency + offset, candidate, collision:requested + EPS >= hitDistance};
    });
  });
}

function prefix(route, budget, stage, targetId) {
  const queue = [];
  let remaining = budget;
  let complete = true;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const d = distance(a, b);
    if (d > remaining + EPS) {
      if (remaining > EPS) queue.push({x:a.x + (b.x - a.x) * remaining / d, y:a.y + (b.y - a.y) * remaining / d, stage, targetId});
      complete = false;
      break;
    }
    queue.push({...point(b), stage, targetId});
    remaining -= d;
  }
  if (!queue.length) queue.push({...point(route.at(-1)), stage, targetId});
  if (complete) queue.at(-1).action = stage === 'approach' ? 'grasp' : 'release';
  return queue;
}

function blendEntry(route, direction, obstacle) {
  if (!direction || route.length < 2 || distance(route[0], route.at(-1)) < .04) return route;
  const desired = route[1];
  const d = distance(route[0], desired);
  if (d < EPS) return route;
  const vx = .55 * direction.x + .45 * (desired.x - route[0].x) / d;
  const vy = .55 * direction.y + .45 * (desired.y - route[0].y) / d;
  const norm = Math.hypot(vx, vy);
  if (norm < EPS) return route;
  const transition = inside({x:route[0].x + vx * .024 / norm, y:route[0].y + vy * .024 / norm});
  const result = [route[0], transition, ...route.slice(1)];
  return collides(result, obstacle) && !collides(route, obstacle) ? route : result;
}

function plannerResult(state, snapshot) {
  let route = [point(snapshot.from), point(snapshot.goal)];
  let candidates = [];
  let predictions = [];
  let noisy = null;
  let selectedCandidate = 0;
  if (state.mode === 'generalist') route = smoothRoute(avoidRoute(snapshot.from, snapshot.goal, snapshot.obstacle), snapshot.obstacle);
  if (state.mode === 'realtime') route = blendEntry(route, snapshot.direction, snapshot.obstacle);
  if (state.mode === 'diffusion' || state.mode === 'world') {
    candidates = candidateRoutes(snapshot.from, snapshot.goal, snapshot.obstacle, state.mode !== 'world');
    if (state.mode === 'diffusion') {
      candidates = candidates.map(denseRoute);
      noisy = candidates.map((candidate) => candidate.map((p, i) => {
        const taper = Math.sin(Math.PI * i / (candidate.length - 1 || 1));
        return inside({x:p.x + (random(state) - .5) * .16 * taper, y:p.y + (random(state) - .5) * .16 * taper});
      }));
    } else predictions = predictionsFor(candidates, snapshot, state.settings.speed);
    selectedCandidate = chooseRoute(candidates, snapshot.obstacle);
    route = candidates[selectedCandidate];
  }
  const budget = state.settings.speed * state.settings.chunkDuration;
  let queue = prefix(route, budget, snapshot.stage, snapshot.targetId);
  if (state.mode === 'world') queue = queue.slice(0, 1);
  // Both chunk variants can include a grasp followed by delivery in one batch.
  // This keeps an otherwise short final approach batch from creating an RTC gap.
  if (['chunks', 'realtime'].includes(state.mode) && snapshot.stage === 'approach' && queue.at(-1).action === 'grasp') {
    const remaining = budget - length([route[0], ...queue.map(point)]);
    if (remaining > EPS) {
      const delivery = [point(route.at(-1)), point(state.tray)];
      queue.push(...prefix(delivery, remaining, 'delivery', snapshot.targetId));
      route = [...route, point(state.tray)];
    }
  }
  return {route, candidates, predictions, noisy, selectedCandidate, queue};
}

function targetId(state) { return state.mode === 'generalist' ? state.instruction : 'red'; }

function snapshotFor(state, background) {
  let stage = state._stage;
  let from = point(state.robot);
  let expectedPickup = false;
  let direction = null;
  if (background && state._queue.length) {
    const end = state._queue.at(-1);
    const previous = state._queue.length > 1 ? state._queue.at(-2) : state.robot;
    const d = distance(previous, end);
    if (d > EPS) direction = {x:(end.x - previous.x) / d, y:(end.y - previous.y) / d};
    from = point(end);
    if (end.action === 'grasp') { stage = 'delivery'; expectedPickup = true; }
    else if (end.stage === 'delivery') { stage = 'delivery'; expectedPickup = !state.robot.carrying; }
  }
  const id = targetId(state);
  const goal = stage === 'delivery' ? point(state.tray) : point(state.objects.find((object) => object.id === id));
  return {from, goal, stage, targetId:id, direction, expectedPickup, background, obstacle:{...state.obstacle}, latency:state.settings.latency, startTime:state.time};
}

function requestPlan(state, background = false) {
  const snapshot = snapshotFor(state, background);
  const result = plannerResult(state, snapshot);
  state._pending = {snapshot, result, requestedTick:state._ticks, dueTick:state._ticks + Math.ceil(snapshot.latency / STEP - EPS)};
  state.committed = background ? [point(state.robot), ...state._queue.map(point)] : [];
  state.plan = background ? [point(state.robot), ...state._queue.map(point), ...result.route.slice(1).map(point)] : result.route.map(point);
  state.candidates = result.noisy ? result.noisy.map((route) => route.map(point)) : result.candidates.map((route) => route.map(point));
  state.predictions = result.predictions;
  state.selectedCandidate = result.selectedCandidate;
  if (!background) state.phase = 'planning';
  state.message = background ? 'Moving on a committed batch while the next batch is planned.' : {
    chunks:`Waiting ${snapshot.latency.toFixed(2)} s for the next frozen batch.`,
    realtime:`Waiting ${snapshot.latency.toFixed(2)} s for the first action batch.`,
    diffusion:'Refining three noisy action plans.',
    generalist:`Planning for the ${snapshot.targetId} object using taught rules.`,
    world:'Comparing predicted futures before the next action.',
  }[state.mode];
}

function finishPending(state) {
  const pending = state._pending;
  if (!pending || pending.dueTick > state._ticks) return;
  state._pending = null;
  state.committed = [];
  if (pending.snapshot.expectedPickup && !state.robot.carrying && !state._queue.some((p) => p.action === 'grasp')) return;
  if (pending.snapshot.stage === 'approach' && state.robot.carrying) return;
  state._queue.push(...pending.result.queue);
  state.candidates = pending.result.candidates.map((route) => route.map(point));
  state.stats.replans++;
  state.phase = state.robot.carrying ? 'carrying' : 'moving';
  state.message = {
    chunks:'Executing a frozen action batch.', realtime:'Executing a committed action batch.',
    diffusion:'Executing the first part of the refined action plan.',
    generalist:`Following the instruction to move the ${pending.snapshot.targetId} object.`,
    world:'Executing one waypoint from the safest predicted route.',
  }[state.mode];
}

function updateDenoising(state) {
  const pending = state._pending;
  if (!pending?.result.noisy) return;
  const total = pending.dueTick - pending.requestedTick;
  const fraction = total ? clamp((state._ticks - pending.requestedTick) / total, 0, 1) : 1;
  const blend = fraction * fraction * (3 - 2 * fraction);
  state.candidates = pending.result.noisy.map((route, index) => route.map((p, i) => ({x:p.x + (pending.result.candidates[index][i].x - p.x) * blend, y:p.y + (pending.result.candidates[index][i].y - p.y) * blend})));
}

function finished(state, phase, message) {
  state.phase = phase;
  state.message = message;
  state.running = false;
  state._queue = [];
  state._pending = null;
  state.committed = [];
  state._accumulator = 0;
}

function followCarriedObject(state) {
  if (!state.robot.carrying) return;
  const object = state.objects.find((item) => item.id === state.robot.carrying);
  object.x = state.robot.x;
  object.y = state.robot.y;
}

function recordTrail(state, force = false) {
  if (force || distance(state.trail.at(-1), state.robot) >= .006) state.trail.push(point(state.robot));
  if (state.trail.length > 600) state.trail.shift();
}

function actionAtWaypoint(state, waypoint) {
  if (waypoint.action === 'grasp') {
    const nearest = [...state.objects].sort((a, b) => distance(state.robot, a) - distance(state.robot, b))[0];
    if (distance(state.robot, nearest) <= GRASP_RADIUS) {
      state.robot.carrying = nearest.id;
      followCarriedObject(state);
      state._stage = 'delivery';
      state.phase = 'carrying';
      state.message = `Picked up the ${nearest.id} object. Moving toward the tray.`;
      if (state._pending?.snapshot.stage === 'approach') state._pending = null;
    } else if (state.mode === 'scripted') state._stage = 'delivery';
    else {
      // A stale grasp position failed. Observe again at the next request boundary.
      state._queue = [];
      state._pending = null;
      state._stage = 'approach';
      state.message = 'The object moved away from the frozen grasp position. Planning again.';
    }
  }
  if (waypoint.action === 'release') {
    const carried = state.robot.carrying;
    state.robot.carrying = null;
    state._stage = 'done';
    if (!carried) finished(state, 'miss', 'The taught pickup position was empty. Nothing reached the tray.');
    else if (carried !== state.instruction) finished(state, 'wrong-object', `The ${carried} object reached the tray, but the instruction asked for ${state.instruction}.`);
    else finished(state, 'success', `The ${carried} object reached the tray.`);
  }
}

function move(state) {
  let available = state.settings.speed * STEP;
  while (state._queue.length && state.running) {
    const waypoint = state._queue[0];
    const d = distance(state.robot, waypoint);
    if (d <= EPS) {
      state._queue.shift();
      actionAtWaypoint(state, waypoint);
      continue;
    }
    if (available <= EPS) break;
    const travel = Math.min(d, available);
    const next = {x:state.robot.x + (waypoint.x - state.robot.x) * travel / d, y:state.robot.y + (waypoint.y - state.robot.y) * travel / d};
    const collision = contact(state.robot, next, state.obstacle);
    if (collision !== null) {
      next.x = state.robot.x + (next.x - state.robot.x) * collision;
      next.y = state.robot.y + (next.y - state.robot.y) * collision;
    }
    state.stats.distance += distance(state.robot, next);
    state.robot.x = next.x;
    state.robot.y = next.y;
    followCarriedObject(state);
    recordTrail(state);
    if (collision !== null) {
      recordTrail(state, true);
      finished(state, 'collision', 'The arm hit the obstacle. Its route crossed the obstacle boundary.');
      break;
    }
    available -= travel;
    if (travel + EPS >= d) {
      state._queue.shift();
      actionAtWaypoint(state, waypoint);
    }
  }
}

function queueDuration(state) {
  return length([point(state.robot), ...state._queue.map(point)]) / state.settings.speed;
}

function tick(state) {
  finishPending(state);
  if (!state._queue.length && !state._pending) requestPlan(state);
  finishPending(state);
  if (state.mode === 'realtime' && state._queue.length && !state._pending && state._queue.at(-1).action !== 'release' && queueDuration(state) <= state.settings.latency + .05 + EPS) requestPlan(state, true);
  finishPending(state);
  if (state._queue.length) move(state);
  else state.stats.waitTime += STEP;
  state._ticks++;
  state.time = state._ticks * STEP;
  state.stats.elapsed = state.time;
  state.committed = state._pending?.snapshot.background ? [point(state.robot), ...state._queue.map(point)] : [];
  updateDenoising(state);
  if (state.running && state.time >= MAX_TIME) finished(state, 'timeout', 'The run reached 12 seconds before completing the task.');
}

export function createSimulation({mode = 'scripted', seed = 7, latency = .30} = {}) {
  if (!MODES.some((item) => item.id === mode)) throw new RangeError(`Unknown control mode: ${mode}`);
  if (typeof seed !== 'number' || !Number.isFinite(seed)) throw new TypeError('Seed must be a finite number');
  if (typeof latency !== 'number' || !Number.isFinite(latency)) throw new TypeError('Inference delay must be a finite number');
  const normalizedSeed = Math.trunc(seed) >>> 0;
  return {
    mode, seed:normalizedSeed, time:0, running:false, phase:'ready',
    robot:{...INITIAL_ROBOT, carrying:null},
    objects:[{id:'red', ...TAUGHT_PICKUP}, {id:'blue', x:.72, y:.66}],
    tray:{x:.84, y:.22}, instruction:'red', obstacle:{enabled:false, x:.48, y:.50, r:.085},
    trail:[point(INITIAL_ROBOT)], plan:[], candidates:[], predictions:[], committed:[], selectedCandidate:0,
    settings:{latency:clamp(latency, 0, .60), speed:SPEED, chunkDuration:HORIZON},
    stats:{elapsed:0, replans:0, waitTime:0, distance:0},
    message:mode === 'scripted' ? 'Ready to replay a fixed path to the taught red position and tray.' : 'Ready. Move an object, choose a target, then start.',
    _rng:normalizedSeed, _ticks:0, _accumulator:0, _stage:'approach', _queue:[], _pending:null, _pausedMessage:null,
  };
}

export function stepSimulation(state, dt = 1 / 60) {
  if (typeof dt !== 'number' || !Number.isFinite(dt)) throw new TypeError('Time step must be a finite number');
  if (!state.running || dt <= 0) return state;
  state._accumulator += Math.min(dt, MAX_DT);
  while (state.running && state._accumulator + EPS >= STEP) {
    const remainder = state._accumulator - STEP;
    state._accumulator = remainder < EPS ? 0 : remainder;
    tick(state);
  }
  return state;
}

export function setObjectPosition(state, id, x, y) {
  const object = state.objects.find((item) => item.id === id);
  if (!object || state.robot.carrying === id || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  Object.assign(object, inside({x, y}));
  return true;
}

export function setInstruction(state, id) {
  if (!state.objects.some((object) => object.id === id)) return false;
  state.instruction = id;
  return true;
}

export function toggleObstacle(state) {
  state.obstacle.enabled = !state.obstacle.enabled;
  return true;
}

export function setInferenceDelay(state, seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return false;
  state.settings.latency = clamp(seconds, 0, .60);
  return true;
}

export function resetSimulation(state) {
  const fresh = createSimulation({mode:state.mode, seed:state.seed, latency:state.settings.latency});
  for (const key of Object.keys(state)) delete state[key];
  return Object.assign(state, fresh);
}

export function startSimulation(state) {
  if (state.running) return state;
  if (FINISHED.has(state.phase)) {
    const scene = {objects:state.objects.map((object) => ({...object})), instruction:state.instruction, obstacle:{...state.obstacle}};
    resetSimulation(state);
    state.objects = scene.objects;
    state.instruction = scene.instruction;
    state.obstacle = scene.obstacle;
  }
  state.running = true;
  if (state.phase !== 'ready') {
    state.message = state._pausedMessage || state.message;
    state._pausedMessage = null;
    return state;
  }
  if (state.mode === 'scripted') {
    state._queue = [{...TAUGHT_PICKUP, stage:'approach', targetId:'red', action:'grasp'}, {...point(state.tray), stage:'delivery', targetId:'red', action:'release'}];
    state.plan = [point(state.robot), ...state._queue.map(point)];
    state.phase = 'moving';
    state.message = 'Replaying the same taught pickup and delivery path.';
  } else {
    requestPlan(state);
    finishPending(state);
  }
  return state;
}

export function pauseSimulation(state) {
  if (state.running) {
    state.running = false;
    state._pausedMessage = state.message;
    state.message = 'Paused. Resume to continue from the same state.';
  }
  return state;
}
