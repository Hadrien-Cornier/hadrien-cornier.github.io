// Toy 2D flow policy around a mug, seen from above. Each action is the point where the gripper passes the mug.
// The demonstrations are a mixture of Gaussian clusters, so the flow-matching velocity has a closed form:
// with a_t = (1 - t) a0 + t a1, a0 ~ N(0, I) and a1 ~ N(mu, s^2 I) inside one cluster,
//   E[a1 - a0 | a_t = x] = mu + c (x - t mu),  c = (t s^2 - (1 - t)) / ((1 - t)^2 + t^2 s^2),
// and the clusters are weighted by their posterior probability of having produced x.
// That is the field a perfect network trained with the CFM loss would learn.

export const MUG = {x: 0, y: 0, r: 0.42};

// The top 30% (the clean passes) are Good; the rest are Bad.
export const CLUSTERS = [
  {name: 'clean pass, left', mu: [-1.1, 0.35], s: 0.14, w: 0.15, good: true},
  {name: 'clean pass, right', mu: [1.1, 0.35], s: 0.14, w: 0.15, good: true},
  {name: 'crash', mu: [0, 0], s: 0.18, w: 0.40, good: false},
  {name: 'brush, left', mu: [-0.55, -0.4], s: 0.12, w: 0.15, good: false},
  {name: 'brush, right', mu: [0.55, -0.4], s: 0.12, w: 0.15, good: false},
];

function clusterTerms(x, y, t) {
  return CLUSTERS.map((c) => {
    const variance = (1 - t) ** 2 + t * t * c.s * c.s;
    const dx = x - t * c.mu[0], dy = y - t * c.mu[1];
    const logw = Math.log(c.w) - Math.log(variance) - (dx * dx + dy * dy) / (2 * variance);
    const k = (t * c.s * c.s - (1 - t)) / variance;
    return {logw, vx: c.mu[0] + k * dx, vy: c.mu[1] + k * dy, good: c.good};
  });
}

function mixture(terms, keep) {
  const kept = terms.filter(keep);
  const top = Math.max(...kept.map((term) => term.logw));
  let total = 0, vx = 0, vy = 0;
  for (const term of kept) {
    const p = Math.exp(term.logw - top);
    total += p; vx += p * term.vx; vy += p * term.vy;
  }
  return [vx / total, vy / total];
}

// beta = 0 is the unlabeled field v_all, beta = 1 is v_good, beta = 2 is RECAP's guided field.
export function velocity(x, y, t, beta) {
  const terms = clusterTerms(x, y, t);
  const all = mixture(terms, () => true);
  if (beta === 0) return all;
  const good = mixture(terms, (term) => term.good);
  return [all[0] + beta * (good[0] - all[0]), all[1] + beta * (good[1] - all[1])];
}

export function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noise(count, seed) {
  const r = random(seed), out = [];
  for (let i = 0; i < count; i++) {
    const u = Math.max(r(), 1e-12), v = r();
    const m = Math.sqrt(-2 * Math.log(u));
    out.push([m * Math.cos(2 * Math.PI * v), m * Math.sin(2 * Math.PI * v)]);
  }
  return out;
}

// K Euler steps of size 1/K from each noise point. Returns every path and a summary of where the paths end.
export function simulate({steps, beta, starts}) {
  const paths = starts.map(([x0, y0]) => {
    let x = x0, y = y0;
    const path = [[x, y]];
    for (let k = 0; k < steps; k++) {
      const [vx, vy] = velocity(x, y, k / steps, beta);
      x += vx / steps; y += vy / steps;
      path.push([x, y]);
    }
    return path;
  });
  let inMug = 0, nearBad = 0;
  for (const path of paths) {
    const [x, y] = path[path.length - 1];
    if (Math.hypot(x - MUG.x, y - MUG.y) < MUG.r) inMug++;
    let best = Infinity, good = true;
    for (const c of CLUSTERS) {
      const d = Math.hypot(x - c.mu[0], y - c.mu[1]);
      if (d < best) { best = d; good = c.good; }
    }
    if (!good) nearBad++;
  }
  return {paths, inMug: inMug / paths.length, nearBad: nearBad / paths.length};
}

// One drawing for the page and its static fallback: the same SVG markup from the same settings.
export const VIEW = {w: 600, h: 420, scale: 125};
const px = (x) => (VIEW.w / 2 + x * VIEW.scale).toFixed(1);
const py = (y) => (VIEW.h / 2 - y * VIEW.scale).toFixed(1);
const COLORS = {good: '#8fbf94', bad: '#dc896f', ink: '#f4f1e8', muted: '#b3b7ae', path: '#f0d98a', board: '#1d2824'};
const pct = (v) => `${Math.round(v * 100)}%`;

export function renderSim({steps, beta, seed, count = 160}) {
  const result = simulate({steps, beta, starts: noise(count, seed)});
  let out = `<rect width="${VIEW.w}" height="${VIEW.h}" fill="${COLORS.board}"/>`;
  for (const c of CLUSTERS) {
    const color = c.good ? COLORS.good : COLORS.bad;
    out += `<circle cx="${px(c.mu[0])}" cy="${py(c.mu[1])}" r="${(2.2 * c.s * VIEW.scale).toFixed(1)}" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  }
  out += `<circle cx="${px(MUG.x)}" cy="${py(MUG.y)}" r="${(MUG.r * VIEW.scale).toFixed(1)}" fill="none" stroke="${COLORS.ink}" stroke-width="2.5"/>`;
  out += `<path d="M${(+px(MUG.r) - 2).toFixed(1)} ${(+py(0.12)).toFixed(1)} q26 0 26 ${(0.12 * VIEW.scale).toFixed(1)} t-26 ${(0.12 * VIEW.scale).toFixed(1)}" fill="none" stroke="${COLORS.ink}" stroke-width="2.5"/>`;
  out += `<text x="${px(0)}" y="${(+py(0) + 5).toFixed(1)}" text-anchor="middle" fill="${COLORS.ink}" font-size="15">mug</text>`;
  for (const path of result.paths) {
    out += `<polyline points="${path.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}" fill="none" stroke="${COLORS.path}" stroke-opacity=".28" stroke-width="1.2"/>`;
  }
  for (const path of result.paths) {
    const [x, y] = path[path.length - 1];
    out += `<circle cx="${px(x)}" cy="${py(y)}" r="2.6" fill="${COLORS.path}"/>`;
  }
  const label = (x, y, value, color, anchor = 'middle') => `<text x="${px(x)}" y="${py(y)}" text-anchor="${anchor}" fill="${color}" font-size="15">${value}</text>`;
  out += label(-1.1, 0.78, 'Good: clean pass', COLORS.good) + label(1.1, 0.78, 'Good: clean pass', COLORS.good);
  out += label(-0.75, -0.86, 'Bad: brush', COLORS.bad) + label(0.75, -0.86, 'Bad: brush', COLORS.bad);
  out += label(0, -0.56, 'Bad: crash', COLORS.bad);
  out += `<text x="12" y="${VIEW.h - 12}" fill="${COLORS.muted}" font-size="14">sideways →</text><text x="12" y="22" fill="${COLORS.muted}" font-size="14">↑ forward</text>`;
  const readout = `K = ${steps} ${steps === 1 ? 'step' : 'steps'}, β = ${beta}: ${pct(result.inMug)} of the ${count} samples end in the mug, and ${pct(result.nearBad)} end nearest a Bad cluster.`;
  return {svg: out, readout, result};
}
