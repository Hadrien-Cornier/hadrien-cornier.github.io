/** Draw the blackboard for "Why LLM reinforcement learning breaks on robots" and its flow simulator fallback.
 *
 * Fifteen panels follow the article, one idea each. Numbers on the board are the article's worked examples.
 * Run `node scripts/flow-rl-canvas.mjs` to rewrite the board, the simulator fallback and the thumbnail,
 * then build the site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, HAND, MATH, esc, n, random, rect, line, curve, text, math } from './chalk.mjs';
import { renderSim, VIEW } from '../assets/robotics/why-llm-rl-breaks-on-robots/flow-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'why-llm-rl-breaks-on-robots';
export const ARTICLE = path.join(ROOT, `content/robotics/${SLUG}.md`);
export const THUMB = path.join(ROOT, `assets/robotics/${SLUG}/thumbnail.svg`);
export const SIM_DEFAULT = { steps: 10, beta: 0, seed: 7 };

const BOARD = '#1d2824';
const F = { one: C.blue, two: C.green, three: C.yellow, four: C.pink };
const PW = 400, PH = 440, GAP = 12, TOP = 76;
const ORDER = ['tree', 'cliff', 'clip', 'pathwise', 'needs', 'mug', 'flow', 'funnel', 'chain', 'patches', 'cfg', 'gvc', 'beyond', 'memory', 'imagine'];
// Three columns keep the drawn board under 4,096 px on a desktop: WebKit clamps a larger chalk-filter buffer and paints the wrong panel.
const COLS = 3;
const origin = (i) => [14 + (i % COLS) * (PW + GAP), TOP + Math.floor(i / COLS) * (PH + GAP)];
const WHOLE = [0, 0, 14 * 2 + PW * COLS + GAP * (COLS - 1), TOP + Math.ceil(ORDER.length / COLS) * (PH + GAP) + 8];

const r = random(20261027);
const t = (x, y, value, opts = {}) => text(x, y, value, { size: 14, ...opts });
const small = (x, y, value, opts = {}) => text(x, y, value, { size: 12.5, fill: C.muted, ...opts });
const head = (x, y, value, opts = {}) => text(x, y, value, { size: 15, weight: 700, ...opts });
const eq = (x, y, parts, opts = {}) => math(x, y, parts, { size: 17, ...opts });
const arrow = (x1, y1, x2, y2, opts = {}) => line(r, x1, y1, x2, y2, { arrow: true, width: 2, size: 10, ...opts });
const box = (x, y, w, h, opts = {}) => rect(r, x, y, w, h, { width: 1.8, jitter: 1.4, ...opts });
const dot = (x, y, rad, fill, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${rad}" fill="${fill}"${extra}/>`;
const ring = (x, y, rad, stroke, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${rad}" fill="none" stroke="${stroke}" stroke-width="2"${extra}/>`;
const poly = (pts, stroke, extra = '') => `<polyline points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;

function panel(id, title, body) {
  const [x, y] = origin(ORDER.indexOf(id));
  return `<g class="rc-panel" data-panel="${id}" transform="translate(${x},${y})">${rect(r, 0, 0, PW, PH, { width: 2.2, jitter: 1.6 })}${text(16, 32, title, { font: HAND, size: 22, weight: 700, fill: C.yellow })}${body}</g>`;
}

// 0. The map: four families and when they arrived.
function tree() {
  let s = box(16, 178, 92, 64) + t(62, 204, 'improve', { anchor: 'middle', weight: 700 }) + t(62, 222, 'the policy', { anchor: 'middle', weight: 700 });
  const fams = [
    [F.one, '1 · score-function', 'REINFORCE 1992 · PPO 2017', 'GRPO 2024', 'A · ∇θ log π'],
    [F.two, '2 · pathwise (continuous Q)', 'DDPG 2015 · TD3 2018', 'SAC 2018', '∇a Q · ∇θ a'],
    [F.three, '3 · conditioned BC', 'RECAP (π*0.6) 2025 · π0.7 2026', 'GVC 2026', 'reward → prompt'],
    [F.four, '4 · manifold search, flow tilting', 'Policy Decorator 2024 · DSRL 2025', 'QF3 2026 · world model + GVC', 'steer a0 · tilt v · imagine'],
  ];
  fams.forEach(([color, name, l1, l2, gist], i) => {
    const y = 50 + i * 84;
    s += line(r, 108, 210, 132, y + 38, { stroke: color, width: 2 });
    s += box(132, y, 254, 78, { stroke: color });
    s += head(142, y + 19, name, { fill: color }) + t(142, y + 37, l1, { size: 13 }) + t(142, y + 53, l2, { size: 13 }) + small(142, y + 70, gist, { fill: color });
  });
  const X = (year) => ({ 1992: 32, 2015: 110, 2017: 168, 2018: 222, 2024: 282, 2025: 328, 2026: 372 })[year];
  s += line(r, 22, 404, 388, 404, { stroke: C.ink, width: 1.8 });
  s += line(r, 64, 397, 70, 411, { stroke: C.ink, width: 1.6 }) + line(r, 70, 397, 76, 411, { stroke: C.ink, width: 1.6 });
  [[1992, F.one], [2015, F.two], [2017, F.one], [2018, F.two], [2024, F.one], [2024, F.four], [2025, F.three], [2025, F.four], [2026, F.three], [2026, F.four]].forEach(([year, color], i) => {
    const off = [1992, 2015, 2017, 2018].includes(year) ? 0 : (i % 2 ? 6 : -6);
    s += dot(X(year) + off, 404, 5, color);
  });
  [1992, 2015, 2017, 2018, 2024, 2025, 2026].forEach((year) => { s += small(X(year), 428, String(year), { anchor: 'middle' }); });
  return panel('tree', 'Four families of robot RL', s);
}

// 1. The cliff paradox: one sample, two opposite updates.
const Q = (a) => a <= 1.5 ? 8 - (6 / 2.25) * (a - 1.5) ** 2 : a <= 2 ? 8 - 4 * (a - 1.5) ** 2 : Math.max(-4, 7 - 44 * (a - 2));
function cliffPlot(y0, family) {
  const X = (a) => 30 + (a + 1) * 92, Y = (q) => y0 + 20 + (9 - q) * 9;
  let s = '';
  const pts = []; for (let a = -0.3; a <= 2.24; a += 0.02) pts.push([X(a), Y(Math.max(-1, Q(a)))]);
  s += poly(pts, C.ink) + small(X(2.25) + 6, Y(-1) - 2, 'cliff', { fill: C.red });
  s += line(r, X(-1), Y(2), X(2.6), Y(2), { stroke: C.muted, width: 1.2, dash: '5 5' }) + small(X(-0.95), Y(2) - 6, 'V(s) = 2');
  s += dot(X(0), Y(2), 4, C.ink);
  const base = y0 + 146, bell = []; for (let a = -1; a <= 1; a += 0.04) bell.push([X(a), base - 30 * Math.exp(-(a * a) / (2 * 0.16))]);
  s += line(r, X(-1), base, X(2.6), base, { stroke: C.muted, width: 1 }) + poly(bell, family === 'ppo' ? F.one : F.two);
  s += line(r, X(0), base, X(0), Y(2), { stroke: C.muted, width: 1, dash: '3 3' }) + small(X(0), base + 14, 'μ = 0', { anchor: 'middle' });
  s += dot(X(2), Y(7), 5, C.yellow) + small(X(2) - 8, Y(7) + 18, 'Q(2.0) = 7', { anchor: 'end', fill: C.yellow });
  s += small(X(1.5) - 10, Y(8) + 2, 'peak 8 at 1.5', { anchor: 'end' });
  s += line(r, X(2), base + 4, X(2), base - 8, { stroke: C.yellow, width: 2 }) + small(X(2), base + 14, 'a = 2.0', { anchor: 'middle', fill: C.yellow });
  if (family === 'ppo') {
    s += arrow(X(0.05), base - 38, X(0.75), base - 38, { stroke: F.one });
    s += head(16, y0 - 6, 'PPO: A = 7 − 2 = +5 > 0', { fill: F.one }) + small(16, y0 + 11, '→ pick 2.0 more often: the bell slides toward the cliff');
  } else {
    s += line(r, X(1.75), Y(8), X(2.25), Y(6), { stroke: F.two, width: 2.4 });
    s += arrow(X(-0.05), base - 38, X(-0.75), base - 38, { stroke: F.two });
    s += head(16, y0 - 6, 'SAC: slope ∂Q/∂a < 0 at 2.0', { fill: F.two }) + small(16, y0 + 11, '→ go back uphill: the bell slides toward the peak at 1.5');
  }
  return s;
}
function cliff() {
  let s = cliffPlot(70, 'ppo') + cliffPlot(254, 'sac');
  s += eq(16, 432, ['A · ∇', ['θ', 'sub'], ' log π   vs   ∂Q/∂a · ∂a/∂θ'], { size: 16 });
  return panel('cliff', 'The cliff paradox', s);
}

// 2. PPO's clipped objective, and where old samples land.
function clip() {
  const X = (q) => 48 + q * 132, Y = (l) => 214 - l * 62;
  let s = eq(16, 60, ['r(θ) = π', ['θ', 'sub'], '(a|s) / π', ['old', 'subword'], '(a|s)'], { size: 16 });
  s += `<rect x="${X(0.8)}" y="${Y(1.9)}" width="${X(1.2) - X(0.8)}" height="${Y(-2.6) - Y(1.9)}" fill="${C.ink}" fill-opacity=".09"/>`;
  s += small(X(1), Y(1.9) - 6, '[0.8, 1.2]', { anchor: 'middle' });
  s += arrow(X(0) - 6, Y(0), X(2.5) + 8, Y(0), { stroke: C.muted, width: 1.4 }) + small(X(2.5), Y(0) + 18, 'ratio r', { anchor: 'end' });
  s += line(r, X(0), Y(-2.6), X(0), Y(1.9), { stroke: C.muted, width: 1.4 });
  [0, 1, 2].forEach((q) => { s += small(X(q), Y(0) + 18, String(q), { anchor: 'middle' }); });
  s += poly([[X(0), Y(0)], [X(1.2), Y(1.2)], [X(2.5), Y(1.2)]], C.green);
  s += poly([[X(0), Y(-0.8)], [X(0.8), Y(-0.8)], [X(2.5), Y(-2.5)]], C.red);
  s += t(X(1.5), Y(1.2) - 12, 'A > 0: flat past 1.2', { fill: C.green }) + t(X(0.02), Y(-0.8) + 24, 'A < 0: flat', { fill: C.red }) + t(X(0.02), Y(-0.8) + 41, 'below 0.8', { fill: C.red });
  [1.8, 2.3].forEach((q) => { s += ring(X(q), Y(1.2), 6, C.yellow); });
  [0.15, 0.45].forEach((q) => { s += ring(X(q), Y(-0.8), 6, C.yellow); });
  s += t(X(1.6), Y(1.2) + 26, '∇ = 0', { fill: C.yellow, weight: 700 }) + t(X(0.12), Y(-0.8) - 12, '∇ = 0', { fill: C.yellow, weight: 700 });
  s += eq(16, 384, ['L = min( r A, clip(r, 0.8, 1.2) A )'], { size: 16 });
  s += t(16, 408, '○ 3-day-old samples: r far from 1, on a plateau', { fill: C.yellow, size: 13 });
  s += small(16, 428, 'fresh rollouts: r ≈ 1, and the critic never scores untried actions');
  return panel('clip', "PPO's clip on a stale buffer", s);
}

// 3. Pathwise shapes, the reparameterization, and the mirage loop.
function pathwise() {
  let s = '';
  const cells = 29, cw = 2.4;
  for (let i = 0; i < cells; i++) s += `<rect x="${n(18 + i * cw)}" y="64" width="${cw - 0.4}" height="10" fill="${r() < 0.5 ? C.green : C.red}" fill-opacity=".85"/>`;
  s += box(18, 64, cells * cw, 10, { width: 1.2, jitter: 0.6 }) + small(18, 92, '∂Q/∂a: 1 × 29', { fill: C.ink }) + small(18, 108, 'a sign per joint');
  s += t(100, 74, '×', { size: 18 });
  s += box(118, 50, 116, 40, { stroke: F.two }) + small(176, 74, 'actor Jacobian', { anchor: 'middle', fill: F.two }) + small(124, 108, '29 × N weights');
  s += t(244, 74, '=', { size: 18 });
  s += box(264, 64, 116, 10, { stroke: C.yellow }) + small(264, 92, 'gradient', { fill: C.yellow }) + small(264, 108, '1 × N weights');
  s += eq(16, 140, ['a', ['θ', 'sub'], '(s, ε) = μ', ['θ', 'sub'], '(s) + σ', ['θ', 'sub'], '(s) · ε,   ε ~ N(0, I)'], { size: 16 });
  // the loop around a black hole
  const cx = 200, cy = 252;
  for (let k = 0; k < 3; k++) s += `<circle cx="${cx}" cy="${cy}" r="${26 - k * 8}" fill="none" stroke="${C.red}" stroke-opacity="${0.35 + k * 0.25}" stroke-width="2" stroke-dasharray="${6 - k} 4"/>`;
  s += small(cx, cy + 44, 'mirage', { anchor: 'middle', fill: C.red });
  s += box(112, 156, 176, 40, { stroke: C.red }) + t(200, 173, '1 critic grows a spike', { anchor: 'middle', size: 13 }) + small(200, 189, 'at an action no data covers', { anchor: 'middle' });
  s += box(242, 278, 146, 52, { stroke: F.two }) + t(315, 298, '2 actor climbs', { anchor: 'middle', size: 13 }) + t(315, 316, '∇a Q onto it', { anchor: 'middle', size: 13 });
  s += box(12, 278, 156, 52, { stroke: C.ink }) + t(90, 297, '3 backup pulls', { anchor: 'middle', size: 13 }) + small(90, 316, 'y = r + γ Q(s′, aθ(s′))', { anchor: 'middle', fill: C.ink });
  s += arrow(272, 194, 312, 274, { stroke: C.muted }) + arrow(240, 318, 172, 318, { stroke: C.muted }) + arrow(78, 274, 126, 198, { stroke: C.muted });
  s += head(16, 360, 'band-aids', { fill: C.yellow });
  s += t(16, 381, 'DDPG 2015  bare loop', { size: 13 });
  s += t(16, 400, 'TD3 2018  min(Q1, Q2), slower actor updates', { size: 13 });
  s += t(16, 419, 'SAC 2018  entropy −α log π keeps σ > 0', { size: 13 });
  return panel('pathwise', 'Climbing the critic', s);
}

// 3b. The core idea: what each family needs, why a flow gives neither, and the third way.
function needs() {
  let s = box(16, 52, 180, 96, { stroke: F.one }) + box(204, 52, 180, 96, { stroke: F.two });
  s += head(26, 74, '1 · score-function', { fill: F.one }) + t(26, 96, 'needs log π(a|s)', { size: 13.5 });
  s += eq(26, 130, ['A · ∇', ['θ', 'sub'], ' log π'], { size: 16 });
  s += head(214, 74, '2 · pathwise', { fill: F.two }) + t(214, 96, 'needs ∂Q/∂a back to θ', { size: 13.5 });
  s += eq(214, 130, ['∇', ['a', 'sub'], 'Q · ∇', ['θ', 'sub'], ' a'], { size: 16 });
  s += box(100, 200, 200, 58, { stroke: C.ink });
  s += t(200, 223, 'flow policy (π0)', { anchor: 'middle', weight: 700 }) + small(200, 244, 'noise → 10 Euler steps → a1', { anchor: 'middle' });
  s += arrow(150, 200, 106, 152, { stroke: C.red }) + arrow(250, 200, 294, 152, { stroke: C.red });
  s += t(92, 186, '✗', { size: 22, weight: 700, fill: C.red }) + t(296, 186, '✗', { size: 22, weight: 700, fill: C.red });
  s += t(16, 290, '✗ 1: log π = log p0 − ∫ tr(∂v/∂a) dt: intractable', { fill: C.red, size: 13 });
  s += t(16, 312, '✗ 2: ten Jacobians multiply → critic mirage', { fill: C.red, size: 13 });
  s += arrow(200, 324, 200, 352, { stroke: F.three });
  s += box(16, 356, 368, 70, { stroke: F.three });
  s += head(26, 378, '3 · reward → prompt, plain BC', { fill: F.three }) + small(374, 378, 'needs neither', { anchor: 'end', fill: F.three });
  s += eq(26, 408, ['‖ v', ['θ', 'sub'], '(a', ['t', 'sub'], ', t, s, I) − (a', ['1', 'sub'], ' − a', ['0', 'sub'], ') ‖²'], { size: 15 });
  return panel('needs', 'Two needs a flow cannot meet', s);
}

// 4. Two good routes around a mug, and the softmax two-for-one.
function mug() {
  let s = '';
  const sx = 150, sy = 214, gx = 150, gy = 58, mx = 150, my = 136;
  s += ring(mx, my, 24, C.ink) + `<path d="M${mx + 23} ${my - 8} q14 0 14 9 t-14 9" fill="none" stroke="${C.ink}" stroke-width="2"/>` + small(mx, my + 4, 'mug', { anchor: 'middle', fill: C.ink });
  s += dot(sx, sy, 5, C.ink) + small(sx + 10, sy + 4, 'start') + dot(gx, gy, 5, C.ink) + small(gx + 10, gy + 2, 'goal');
  s += curve([[sx, sy], [sx - 54, my + 30], [sx - 62, my], [sx - 50, my - 36], [gx, gy]], { stroke: C.green, width: 2.4, arrow: true });
  s += curve([[sx, sy], [sx + 54, my + 30], [sx + 62, my], [sx + 50, my - 36], [gx, gy]], { stroke: C.green, width: 2.4, arrow: true });
  s += line(r, sx, sy - 8, gx, gy + 8, { stroke: C.red, width: 2.2, dash: '6 5' });
  s += t(sx - 104, my + 4, 'a = −1', { fill: C.green }) + t(sx + 68, my + 4, 'a = +1', { fill: C.green });
  s += t(sx + 26, sy - 12, 'Gaussian mean a = 0: crash', { fill: C.red, size: 13 });
  // square peg, round hole
  s += ring(330, 108, 22, C.muted) + rect(r, 312, 62, 36, 36, { stroke: C.yellow, width: 2, jitter: 1 });
  s += small(330, 150, 'discrete LLM RL', { anchor: 'middle', fill: C.yellow }) + small(330, 166, 'on torques', { anchor: 'middle' });
  // softmax bars
  const base = 352, bw = 14;
  s += line(r, 16, base, 300, base, { stroke: C.muted, width: 1.2 });
  const hs = [18, 26, 14, 30, 22, 70, 16, 24, 12, 20, 28, 15];
  hs.forEach((h, i) => {
    const x = 20 + i * (bw + 6), good = i === 5;
    s += `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" fill="${good ? C.green : C.ink}" fill-opacity="${good ? 0.85 : 0.45}"/>`;
    s += good ? arrow(x + bw / 2, base - h - 6, x + bw / 2, base - h - 30, { stroke: C.green }) : arrow(x + bw / 2, base - h - 22, x + bw / 2, base - h - 6, { stroke: C.red, width: 1.6, size: 7 });
  });
  s += t(258, base - 8, '… 1,024', { size: 13 });
  s += head(16, 240, 'softmax over 1,024 bins', { fill: C.green });
  s += eq(16, 266, ['Σ', ['k', 'sub'], ' π(k|s) = 1'], { size: 16 });
  s += t(180, 266, 'push 1 up → 1,023 go down', { size: 13 });
  s += small(16, 376, 'loss gradient on logit k: π(k|s) − 1 if correct, π(k|s) if wrong');
  s += t(16, 400, '+ two modes fit · + exact log π in one pass (FAST)', { size: 13 });
  s += t(16, 424, 'flow: no automatic push-down elsewhere', { size: 13, fill: C.red });
  return panel('mug', 'Two good answers', s);
}

// 5. Flow matching: crossing training lines, splitting Euler paths, the speedometer.
function flow1d(x, tt) {
  const comps = [[1, 0.06], [-1, 0.06]];
  let tot = 0, v = 0;
  for (const [mu, sd] of comps) {
    const variance = (1 - tt) ** 2 + tt * tt * sd * sd;
    const w = Math.exp(-((x - tt * mu) ** 2) / (2 * variance)) / Math.sqrt(variance);
    const k = (tt * sd * sd - (1 - tt)) / variance;
    tot += w; v += w * (mu + k * (x - tt * mu));
  }
  return v / tot;
}
function flowPanel() {
  let s = '';
  const plot = (y0, h) => ({ X: (q) => 52 + q * 312, Y: (a) => y0 + h / 2 - a * (h / 2 - 8) / 1.6 });
  const A = plot(52, 140), B = plot(212, 140);
  const starts = [-1.3, -0.8, -0.45, -0.15, 0.1, 0.35, 0.7, 1.2];
  const ends = [1, -1, 1, -1, 1, -1, 1, -1];
  for (const p of [A, B]) {
    s += line(r, p.X(0), p.Y(1.6), p.X(0), p.Y(-1.6), { stroke: C.muted, width: 1.2 }) + line(r, p.X(1), p.Y(1.6), p.X(1), p.Y(-1.6), { stroke: C.muted, width: 1.2, dash: '4 4' });
    s += t(p.X(1) + 6, p.Y(1) + 4, '+1', { size: 13 }) + t(p.X(1) + 6, p.Y(-1) + 4, '−1', { size: 13 });
    s += dot(p.X(1), p.Y(1), 4, C.green) + dot(p.X(1), p.Y(-1), 4, C.green);
  }
  s += small(A.X(0), A.Y(-1.6) + 14, 't = 0', { anchor: 'middle' }) + small(A.X(1), A.Y(-1.6) + 14, 't = 1', { anchor: 'middle' });
  starts.forEach((a0, i) => { s += line(r, A.X(0), A.Y(a0), A.X(1), A.Y(ends[i]), { stroke: C.ink, width: 1.3, passes: 1 }) + dot(A.X(0), A.Y(a0), 3, C.ink); });
  s += head(16, 50, 'training pairs: straight lines cross', { size: 14 });
  s += eq(150, 112, ['a', ['t', 'sub'], ' = (1−t) a', ['0', 'sub'], ' + t a', ['1', 'sub']], { size: 15, fill: C.yellow, extra: ` stroke="${BOARD}" stroke-width="5" paint-order="stroke"` });
  s += head(16, 210, '10 Euler steps of 0.1 v: the streams split', { size: 14 });
  for (const a0 of starts) {
    let a = a0; const pts = [[B.X(0), B.Y(a)]];
    for (let k = 0; k < 10; k++) { a += 0.1 * flow1d(a, k / 10); pts.push([B.X((k + 1) / 10), B.Y(a)]); }
    s += poly(pts, C.yellow, ' stroke-width="1.8"') + pts.map(([x, y]) => dot(x, y, 2, C.yellow)).join('');
  }
  s += small(B.X(0.02), B.Y(-1.6) + 14, '1 step from t = 0 lands on the average: 0, the mug');
  s += head(16, 376, 'v is a speedometer', { fill: C.yellow, size: 14 });
  s += t(16, 398, '60 mph at t = 0, 0.5 and 0.9 · target a1 − a0', { size: 13 });
  s += t(16, 420, 'mile 54 + 0.1 h × 60 mph = mile 60', { size: 13 });
  return panel('flow', 'Flow matching in 10 steps', s);
}

// 6. Squeezed volume and the Jacobian trace.
function funnel() {
  let s = '';
  const X = (q) => 30 + q * 200, top0 = 70, bot0 = 170, mid1 = 132;
  s += `<path d="M${X(0)} ${top0} C${X(0.5)} ${top0} ${X(0.75)} ${mid1 - 1} ${X(1)} ${mid1 - 0.5} L${X(1)} ${mid1 + 0.5} C${X(0.75)} ${mid1 + 1} ${X(0.5)} ${bot0} ${X(0)} ${bot0} Z" fill="${C.yellow}" fill-opacity=".22" stroke="${C.yellow}" stroke-width="1.6"/>`;
  [[top0 + 12, -1], [bot0 - 12, 1]].forEach(([y, sgn]) => { s += arrow(X(0.25), y, X(0.62), mid1 - sgn * 14, { stroke: C.ink, width: 1.6, size: 8 }); });
  s += arrow(X(0.25), (top0 + bot0) / 2, X(0.62), mid1 - 3, { stroke: C.ink, width: 1.6, size: 8 });
  s += line(r, X(0) - 10, top0, X(0) - 10, bot0, { stroke: C.ink, width: 1.4 }) + small(X(0) - 4, bot0 + 18, 'Δa0 = 1.0, 30% of mass');
  s += small(X(1), mid1 + 26, 'Δa1 = 0.01', { anchor: 'middle', fill: C.ink });
  s += small(X(0), top0 - 10, 't = 0') + small(X(1), top0 - 10, 't = 1', { anchor: 'end' });
  s += t(16, 220, 'density = mass / width: 0.3 → 30, ×100', { fill: C.yellow });
  s += t(16, 242, '1-D: ∫ ∂v/∂a dt = ln 0.01 ≈ −4.6', { size: 13 });
  // 29 x 29 Jacobian
  const gx = 286, gy = 64, cs = 3.6;
  s += `<rect x="${gx}" y="${gy}" width="${29 * cs}" height="${29 * cs}" fill="${C.ink}" fill-opacity=".1" stroke="${C.ink}" stroke-width="1"/>`;
  for (let i = 0; i < 29; i++) s += `<rect x="${n(gx + i * cs)}" y="${n(gy + i * cs)}" width="${cs}" height="${cs}" fill="${C.yellow}"/>`;
  s += small(gx + 40, gy + 29 * cs + 18, '∂v/∂a: 29 × 29 per action', { anchor: 'middle', fill: C.ink }) + small(gx + 52, gy + 29 * cs + 34, 'trace = diagonal sum', { anchor: 'middle' });
  s += head(16, 290, 'log-likelihood of a flow', { size: 14 });
  s += eq(16, 322, ['log π(a', ['1', 'sub'], '|s) = log p', ['0', 'sub'], '(a', ['0', 'sub'], ') − ∫ tr(∂v/∂a', ['t', 'sub'], ') dt'], { size: 16 });
  s += t(16, 360, 'each diagonal entry: 1 backward pass', { size: 13 });
  s += t(16, 382, '29 passes × 10 ODE steps per sample', { size: 13 });
  s += t(16, 404, 'then PPO differentiates it again in θ', { size: 13 });
  s += t(16, 426, '→ intractable at VLA scale', { size: 13, fill: C.red });
  return panel('funnel', 'Squeezed volume', s);
}

// 7. Ten nested steps: the gradient multiplies and leaves the data.
function chain() {
  let s = '';
  for (let k = 0; k < 10; k++) {
    const x = 20 + k * 36;
    s += box(x, 66, 28, 28, { stroke: C.ink, width: 1.5 }) + small(x + 14, 85, `f${k + 1}`, { anchor: 'middle', fill: C.ink });
    if (k < 9) s += line(r, x + 28, 80, x + 36, 80, { stroke: C.muted, width: 1.4 });
  }
  s += small(20, 58, 'a0 →', { fill: C.ink }) + small(380, 58, '→ a1', { anchor: 'end', fill: C.ink });
  for (let k = 9; k >= 0; k--) {
    const x = 20 + k * 36, w = 1 + (9 - k) * 0.55;
    s += arrow(x + 34, 118, x + 6, 118, { stroke: C.red, width: w, size: 6 + (9 - k) * 0.6 });
  }
  s += small(380, 138, '← ∇a1 Q, through 9 factors (I + 0.1 ∂v/∂a)', { anchor: 'end', fill: C.red });
  s += t(16, 166, '1.3⁹ ≈ 10.6', { fill: C.yellow, size: 15 }) + t(140, 166, '0.7⁹ ≈ 0.04', { fill: C.yellow, size: 15 });
  s += small(16, 186, 'a 10-layer RNN: gradients explode or vanish');
  // manifold and mirage
  const pts = [[30, 360], [110, 330], [200, 340], [290, 310], [372, 322]];
  s += curve(pts, { stroke: C.green, width: 7, opacity: 0.35 }) + curve(pts, { stroke: C.green, width: 1.5 });
  s += small(36, 384, 'real chunks: a thin manifold in 1,450-D', { fill: C.green });
  s += dot(150, 334, 5, C.yellow) + small(156, 356, 'a1', { fill: C.yellow });
  s += curve([[150, 330], [164, 284], [186, 248], [212, 228]], { stroke: C.red, width: 2.2, arrow: true });
  s += poly([[180, 300], [206, 300], [216, 212], [226, 300], [252, 300]], C.red, ' stroke-width="1.8"');
  s += t(240, 226, 'critic mirage', { fill: C.red, size: 13 }) + small(240, 244, 'Q looks huge here,') + small(240, 260, 'no real chunk nearby');
  s += t(16, 424, 'section 1 black hole, now behind 10 amplifiers', { size: 13 });
  return panel('chain', 'Ten Jacobians multiply', s);
}

// 8. Two PPO patches: a 10x horizon and a lying proxy.
function patches() {
  let s = head(16, 58, 'πRL / DPPO: noise in every step', { fill: F.one });
  for (let e = 0; e < 5; e++) {
    const x = 18 + e * 74;
    s += box(x, 72, 64, 30, { stroke: C.ink, width: 1.5 });
    for (let d = 0; d < 10; d++) s += `<line x1="${x + 4 + d * 6}" y1="${92}" x2="${x + 4 + d * 6}" y2="${100}" stroke="${C.yellow}" stroke-width="2"/>`;
    s += small(x + 32, 87, `step ${e + 1}`, { anchor: 'middle', fill: C.ink });
  }
  s += small(388, 120, '… 50 steps', { anchor: 'end' });
  s += t(16, 142, '50 steps × 10 denoising steps = 500 MDP steps', { size: 13 });
  s += t(16, 162, 'σ > 0 gives a Gaussian log π, credit over 500 steps', { size: 13, fill: C.red });
  s += head(16, 204, 'FPO: flow-loss proxy inside the clip', { fill: F.one });
  const cx = 200, cy = 344, R = 104;
  const ang = (q) => Math.PI * (1 - q / 3);
  const P = (q, rad) => [cx + rad * Math.cos(ang(q)), cy - rad * Math.sin(ang(q))];
  const arc = (q0, q1, rad) => { const [x0, y0] = P(q0, rad), [x1, y1] = P(q1, rad); return `M${n(x0)} ${n(y0)} A${rad} ${rad} 0 0 1 ${n(x1)} ${n(y1)}`; };
  s += `<path d="${arc(0, 3, R)}" fill="none" stroke="${C.ink}" stroke-width="2.2"/><path d="${arc(0.8, 1.2, R - 6)}" fill="none" stroke="${C.green}" stroke-width="12" stroke-opacity=".7"/>`;
  [0, 1, 2, 3].forEach((q) => { const [x, y] = P(q, R + 14); s += small(x, y + 4, String(q), { anchor: 'middle' }); });
  const [px, py] = P(1.05, R - 18), [tx, ty] = P(2.4, R - 18);
  s += line(r, cx, cy, px, py, { stroke: C.yellow, width: 3 }) + line(r, cx, cy, tx, ty, { stroke: C.red, width: 2.4, dash: '6 4' }) + dot(cx, cy, 5, C.ink);
  s += small(cx - 98, cy + 22, 'proxy: inside [0.8, 1.2]', { fill: C.yellow }) + small(cx + 30, cy + 22, 'true ratio: outside', { fill: C.red });
  s += t(16, 400, 'clip never fires → pretrained VLA wrecked', { size: 13, fill: C.red });
  s += small(16, 420, 'π*0.6 Appendix D, real-robot laundry folding');
  return panel('patches', 'Two PPO patches that failed', s);
}

// 9. Classifier-free guidance as vector arithmetic.
function cfg() {
  let s = eq(16, 62, ['v', ['guided', 'subword'], ' = v', ['all', 'subword'], ' + β (v', ['good', 'subword'], ' − v', ['all', 'subword'], ')'], { size: 17 });
  s += eq(16, 88, ['v', ['all', 'subword'], ' = 0.3 v', ['good', 'subword'], ' + 0.7 v', ['bad', 'subword'], ' = (0, 1)'], { size: 15, fill: C.muted });
  const ox = 120, oy = 320, k = 110, P = (x, y) => [ox + x * k, oy - y * k];
  s += line(r, 24, oy, 388, oy, { stroke: C.muted, width: 1.2 }) + small(388, oy + 18, 'sideways', { anchor: 'end' });
  s += line(r, ox, oy + 10, ox, 120, { stroke: C.muted, width: 1.2 }) + small(ox + 6, 128, 'forward');
  const vec = (x, y, color, w = 2.4) => { const [x1, y1] = P(x, y); return arrow(ox, oy, x1, y1, { stroke: color, width: w, size: 11 }); };
  s += vec(-0.3, 1, C.red) + vec(0, 1, C.ink) + vec(0.7, 1, C.green) + vec(1.4, 1, C.yellow, 3);
  const [ax, ay] = P(0, 1), [gx, gy] = P(0.7, 1), [hx, hy] = P(1.4, 1);
  s += line(r, ax, ay, gx, gy, { stroke: C.green, width: 1.4, dash: '4 4' }) + line(r, gx, gy, hx, hy, { stroke: C.yellow, width: 1.4, dash: '4 4' });
  s += t(16, 274, 'bad (−0.3, 1)', { fill: C.red, size: 13 }) + t(ax - 6, ay - 14, 'all (0, 1)', { anchor: 'end', size: 13 });
  s += t(gx, gy - 14, 'good (0.7, 1)', { anchor: 'middle', fill: C.green, size: 13 }) + t(hx + 8, hy + 4, 'guided (1.4, 1)', { fill: C.yellow, size: 13 });
  s += t(236, 254, 'β = 2: past good,', { fill: C.yellow, size: 13 }) + t(236, 272, 'away from bad', { fill: C.yellow, size: 13 });
  s += head(16, 364, 'RECAP (π*0.6)', { fill: F.three, size: 14 });
  s += t(16, 384, 'Good = top 30% by advantage (201-bin V)', { size: 13 });
  s += t(16, 403, 'BC on 100% of the data, weight 1.0', { size: 13 });
  s += small(16, 424, 'AWR: w = e^(A/β) must stay > 0, drops 80 to 90%');
  return panel('cfg', 'Classifier-free guidance', s);
}

// 10. A critic supervises one number; GVC supervises 1,450.
function gvc() {
  let s = '';
  const col = (x, title, inLabel, inTall, outLabel, outTall, loss, color) => {
    let c = head(x, 58, title, { fill: color, size: 14 });
    const inH = inTall ? 96 : 14, outH = outTall ? 96 : 14;
    c += `<rect x="${x + 4}" y="${120 - inH / 2}" width="14" height="${inH}" fill="${C.ink}" fill-opacity=".55"/>` + small(x, 186, inLabel, { fill: C.ink });
    c += arrow(x + 24, 120, x + 52, 120, { stroke: C.muted, width: 1.6, size: 8 }) + box(x + 56, 98, 54, 44, { stroke: color }) + small(x + 83, 124, 'net', { anchor: 'middle', fill: C.ink });
    c += arrow(x + 114, 120, x + 138, 120, { stroke: C.muted, width: 1.6, size: 8 });
    c += `<rect x="${x + 142}" y="${120 - outH / 2}" width="14" height="${outH}" fill="${color}" fill-opacity=".85"/>` + small(x + 172, 186, outLabel, { anchor: 'end', fill: color });
    c += small(x, 206, loss, { fill: C.muted });
    return c;
  };
  s += col(16, 'standard critic', 's, a: 1,450-D', true, 'R̂: 1', false, 'loss (R̂ − R)²: 1 number', C.red);
  s += col(208, 'GVC', 's, z_i: return bin', false, 'v: 1,450-D', true, 'loss ‖v − (a1 − a0)‖²', C.green);
  s += t(16, 234, 'inputs teach nothing; outputs in the loss do', { size: 13 });
  s += t(16, 254, '→ 1,450× more supervision per sample', { size: 13, fill: C.green });
  s += head(16, 290, 'test time: best of 16', { fill: F.three, size: 14 });
  const rr = random(16), hs = Array.from({ length: 16 }, () => 18 + rr() * 50);
  const best = hs.indexOf(Math.max(...hs));
  hs.forEach((h, i) => { s += `<rect x="${20 + i * 22}" y="${370 - h}" width="15" height="${h}" fill="${i === best ? C.green : C.ink}" fill-opacity="${i === best ? 0.9 : 0.4}"/>`; });
  s += line(r, 16, 371, 376, 371, { stroke: C.muted, width: 1.2 });
  s += small(20 + best * 22 + 7, 384, 'execute', { anchor: 'middle', fill: C.green });
  s += eq(16, 410, ['Q', ['GVC', 'subword'], ' = Σ', ['i', 'sub'], ' p(z', ['i', 'sub'], '|s, a) z', ['i', 'sub']], { size: 15 });
  s += small(16, 430, 'p(z|s, a) by Bayes over K bins; TD anchor (Q − y_TD)²');
  return panel('gvc', 'A critic versus GVC', s);
}

// 11. Family 4A steers a frozen flow; 4B tilts the velocity with a one-step preview.
function beyond() {
  let s = head(16, 58, '4A · steer a frozen VLA', { fill: F.four, size: 14 });
  s += `<circle cx="70" cy="128" r="44" fill="${C.ink}" fill-opacity=".08" stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="5 4"/>` + small(70, 188, 'noise ball a0', { anchor: 'middle' });
  s += dot(86, 112, 5, F.four) + small(90, 102, 'RL picks a0', { fill: F.four });
  s += arrow(118, 128, 168, 128, { stroke: C.muted }) + box(172, 104, 82, 48, { stroke: C.ink }) + small(213, 124, 'frozen flow', { anchor: 'middle', fill: C.ink }) + small(213, 141, 'θ locked', { anchor: 'middle' });
  s += arrow(258, 128, 300, 128, { stroke: C.muted });
  s += curve([[296, 160], [322, 140], [350, 132], [384, 118]], { stroke: C.green, width: 5, opacity: 0.4 }) + dot(330, 136, 5, C.yellow);
  s += arrow(330, 136, 352, 116, { stroke: C.yellow, width: 1.6, size: 7 }) + small(354, 108, '+Δa', { fill: C.yellow });
  s += small(388, 176, 'always a real motion', { anchor: 'end', fill: C.green });
  s += small(16, 208, 'DSRL, FRS: choose a0 · Policy Decorator, PLD, MiDAS: add Δa', { fill: C.ink });
  s += head(16, 246, '4B · tilt with a one-step preview', { fill: F.four, size: 14 });
  const ax = 64, ay = 372;
  s += dot(ax, ay, 5, C.ink) + small(ax - 8, ay + 20, 'a_t', { fill: C.ink });
  s += arrow(ax, ay, ax + 90, ay - 40, { stroke: C.ink }) + small(ax + 52, ay - 10, 'v', { fill: C.ink });
  s += line(r, ax + 90, ay - 40, ax + 210, ay - 92, { stroke: C.muted, width: 1.4, dash: '5 4' });
  s += ring(ax + 210, ay - 92, 6, C.yellow) + small(ax + 222, ay - 88, 'â1 = a_t + (1 − t) v', { fill: C.yellow });
  s += arrow(ax + 210, ay - 92, ax + 220, ay - 132, { stroke: C.green }) + small(ax + 228, ay - 124, '∇a Q at â1', { fill: C.green });
  s += arrow(ax, ay, ax + 86, ay - 58, { stroke: C.yellow, width: 2.6 }) + small(ax + 18, ay - 50, 'tilted v', { fill: C.yellow });
  s += small(16, 410, 'QF3, FlowDPG (Q-score matching line)', { fill: C.ink });
  s += small(16, 428, 'gradient through 1 step, never through 10');
  return panel('beyond', 'Steer a frozen flow, or tilt it', s);
}

// 12. Latent subgoals, coarse tags and a memory imprint.
function memory() {
  let s = head(16, 58, 'subgoals', { fill: F.three, size: 14 });
  const chip = (x, y, w, label, color, sub) => box(x, y, w, 36, { stroke: color, width: 1.5 }) + small(x + w / 2, y + (sub ? 15 : 22), label, { anchor: 'middle', fill: C.ink }) + (sub ? small(x + w / 2, y + 30, sub, { anchor: 'middle' }) : '');
  s += chip(16, 70, 92, '14B image', C.red, '1.25 s, 4× H100') + arrow(110, 88, 128, 88, { stroke: C.muted, size: 7 });
  s += chip(130, 70, 60, 'RGB', C.red) + arrow(192, 88, 210, 88, { stroke: C.muted, size: 7 }) + chip(212, 70, 80, 'ViT tokens', C.red) + arrow(294, 88, 312, 88, { stroke: C.muted, size: 7 }) + chip(314, 70, 72, 'policy', C.ink);
  s += line(r, 18, 112, 290, 66, { stroke: C.red, width: 1.6 });
  s += chip(16, 128, 276, 'latent subgoal in ViT space', C.green, '≈ 100× faster') + arrow(294, 146, 312, 104, { stroke: C.green, size: 7 });
  s += small(16, 186, 'HER: wrong corner, grabbed smoothly →', { fill: C.ink });
  s += small(16, 202, 'subgoal Mistake: true · controller Quality: 5');
  s += small(16, 226, 'tags: Quality, Speed label whole episodes, not steps', { fill: C.yellow });
  s += head(16, 262, 'memory', { fill: F.three, size: 14 });
  const frame = (x, label) => {
    let f = box(x, 274, 104, 70, { stroke: C.ink, width: 1.4 });
    f += line(r, x + 8, 330, x + 96, 330, { stroke: C.muted, width: 1.2 }) + `<rect x="${x + 60}" y="${312}" width="22" height="18" fill="${C.yellow}" fill-opacity=".7"/>`;
    f += line(r, x + 30, 282, x + 46, 306, { stroke: C.ink, width: 2 }) + line(r, x + 46, 306, x + 40, 316, { stroke: C.ink, width: 2 }) + line(r, x + 46, 306, x + 54, 314, { stroke: C.ink, width: 2 });
    return f + small(x + 52, 360, label, { anchor: 'middle' });
  };
  s += frame(16, 'before the grasp') + t(128, 314, '=', { size: 20 }) + frame(146, 't = 2 s, box slipped');
  s += arrow(256, 310, 286, 310, { stroke: C.muted });
  s += box(290, 280, 96, 60, { stroke: C.green }) + small(338, 300, 'imprint', { anchor: 'middle', fill: C.green }) + small(338, 316, 'tried actions', { anchor: 'middle' }) + small(338, 332, 'surprise ΔV', { anchor: 'middle' });
  s += t(16, 392, 'same frame → same failed grasp, forever', { size: 13, fill: C.red });
  s += t(16, 414, 'state + imprint → adapt in context', { size: 13, fill: C.green });
  return panel('memory', 'Subgoals, tags, memory', s);
}

// 13. Propose, simulate, score, act, distill.
function imagine() {
  let s = '';
  s += `<path d="M60 236 C20 230 18 180 52 170 C40 120 100 96 136 116 C160 70 250 70 268 110 C310 88 372 116 360 166 C394 186 380 240 334 238 C320 270 250 276 228 252 C200 280 120 278 104 248 C88 256 70 250 60 236 Z" fill="${C.ink}" fill-opacity=".06" stroke="${C.ink}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
  s += ring(86, 268, 5, C.ink) + ring(72, 290, 3.5, C.ink);
  const root = [92, 196], rr = random(13);
  let bestY = 0;
  for (let i = 0; i < 16; i++) {
    const y = 122 + i * 7.6, win = i === 10, x2 = 300 + rr() * 30;
    s += curve([root, [170, 196 + (y - 196) * 0.5], [230, y], [x2, y]], { stroke: win ? C.green : C.ink, width: win ? 2.6 : 1.1, opacity: win ? 1 : 0.5 });
    if (win) bestY = y;
  }
  s += small(326, bestY + 4, '0.91', { fill: C.green }) + small(116, 136, 'latent world model', { fill: C.ink }) + small(240, 112, 'GVC scores', { fill: C.yellow });
  // robot and table
  s += line(r, 40, 400, 360, 400, { stroke: C.ink, width: 2 }) + box(170, 368, 40, 32, { stroke: C.yellow, width: 1.5 }) + ring(270, 386, 13, C.ink) + box(300, 376, 22, 24, { stroke: C.pink, width: 1.5 });
  s += line(r, 60, 400, 60, 330, { stroke: C.ink, width: 3 }) + line(r, 60, 330, 120, 300, { stroke: C.ink, width: 3 }) + line(r, 120, 300, 168, 344, { stroke: C.ink, width: 3 }) + dot(60, 330, 5, C.ink) + dot(120, 300, 5, C.ink);
  s += curve([[168, 348], [210, 330], [250, 352], [280, 360]], { stroke: C.green, width: 2.4, arrow: true });
  s += small(218, 322, 'execute the best of 16', { fill: C.green });
  s += curve([[300, 372], [360, 330], [370, 280], [340, 250]], { stroke: C.yellow, width: 1.8, arrow: true, dash: '6 5' });
  s += small(388, 300, 'distill:', { anchor: 'end', fill: C.yellow }) + small(388, 316, 'Quality 5', { anchor: 'end', fill: C.yellow });
  s += small(16, 60, 'pause, simulate three jumps, take the winner (Bennett)', { fill: C.ink });
  s += small(16, 428, 'propose 16 → simulate in latent space → score → act → distill');
  return panel('imagine', 'Imagine, score, act', s);
}

export function board() {
  const views = Object.fromEntries(ORDER.map((id, i) => { const [x, y] = origin(i); return [id, [x - 6, y - 6, PW + 12, PH + 12]]; }));
  const [W, H] = [WHOLE[2], WHOLE[3]];
  const legend = `<text x="${W / 2}" y="58" text-anchor="middle" font-family="${esc("Arial, Helvetica, sans-serif")}" font-size="14"><tspan fill="${F.one}">1 score-function</tspan><tspan fill="${C.muted}"> · </tspan><tspan fill="${F.two}">2 pathwise</tspan><tspan fill="${C.muted}"> · </tspan><tspan fill="${F.three}">3 conditioned BC</tspan><tspan fill="${C.muted}"> · </tspan><tspan fill="${F.four}">4 manifold search</tspan></text>`;
  const body = [tree(), cliff(), clip(), pathwise(), needs(), mug(), flowPanel(), funnel(), chain(), patches(), cfg(), gvc(), beyond(), memory(), imagine()].join('');
  return `<svg id="rc-flowrl" class="rc-svg flowrl-board" viewBox="${WHOLE.join(' ')}" role="img" aria-label="Blackboard with fifteen panels: four families of robot reinforcement learning, the cliff paradox, the PPO clip on stale data, climbing the critic, what each family needs and why a flow policy gives neither, two good answers around a mug, flow matching in ten steps, squeezed volume, ten Jacobians multiplying, two PPO patches, classifier-free guidance, a critic versus GVC, steering a frozen flow, subgoals and memory, and imagining before acting" data-whole="${WHOLE.join(' ')}" data-views='${JSON.stringify(views)}'><rect width="${W}" height="${H}" fill="${BOARD}"/>${text(W / 2, 36, 'Why LLM RL breaks on robots, and the fixes', { font: HAND, size: 26, weight: 700, anchor: 'middle' })}${legend}${body}</svg>`;
}

export function simFigure() {
  const { svg, readout } = renderSim(SIM_DEFAULT);
  return `<figure class="fsim" id="flow-sim" data-flow-sim data-steps="${SIM_DEFAULT.steps}" data-beta="${SIM_DEFAULT.beta}" data-seed="${SIM_DEFAULT.seed}"><svg class="fsim-plot" viewBox="0 0 ${VIEW.w} ${VIEW.h}" role="img" aria-label="Top-down view of a mug with five clusters of demonstrations and the paths of 160 noise samples under the flow">${svg}</svg><div class="fsim-controls" hidden><label>Euler steps K <input type="range" min="1" max="20" step="1" value="${SIM_DEFAULT.steps}" data-k="steps"> <output data-o="steps">${SIM_DEFAULT.steps}</output></label><label>guidance β <input type="range" min="0" max="3" step="0.5" value="${SIM_DEFAULT.beta}" data-k="beta"> <output data-o="beta">${SIM_DEFAULT.beta}</output></label><button type="button" data-k="noise">New noise</button></div><figcaption class="fsim-readout" aria-live="polite">${readout}</figcaption></figure>`;
}

export function thumbnail() {
  const { svg } = renderSim({ steps: 10, beta: 2, seed: 7 });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="424" viewBox="-9 -1 618 422" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Blackboard drawing: noise samples flow around a mug into two clean routes, pushed away from the bad demonstrations by classifier-free guidance"><rect x="-9" y="-1" width="618" height="422" fill="${BOARD}"/>${svg}</svg>`;
}

function splice(source, name, content) {
  const start = `<!-- ${name}:start -->`, end = `<!-- ${name}:end -->`;
  const a = source.indexOf(start), b = source.indexOf(end);
  if (a < 0 || b < a) throw new Error(`missing ${name} markers in ${ARTICLE}`);
  return source.slice(0, a + start.length) + content + source.slice(b);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let md = fs.readFileSync(ARTICLE, 'utf8');
  md = splice(md, 'board', board());
  md = splice(md, 'sim', simFigure());
  fs.writeFileSync(ARTICLE, md);
  fs.writeFileSync(THUMB, thumbnail());
  console.log(`wrote ${path.relative(ROOT, ARTICLE)} and ${path.relative(ROOT, THUMB)}`);
}
