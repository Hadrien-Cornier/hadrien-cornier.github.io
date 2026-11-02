/** Draw the blackboard for "Why LLM reinforcement learning breaks on robots", its flow simulator fallback and
 * the static fallbacks of its four small widgets.
 *
 * Sixteen panels follow the article, one idea each. Numbers on the board are the article's worked examples.
 * Run `node scripts/flow-rl-canvas.mjs` to rewrite the board, the figures and the thumbnail, then build the site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, HAND, esc, n, random, rect, line, curve, text, math } from './chalk.mjs';
import { renderSim, VIEW } from '../assets/robotics/why-llm-rl-breaks-on-robots/flow-sim.mjs';
import { renderClocks, renderTrace, renderLogTrick, renderCliff, drawSamples } from '../assets/robotics/why-llm-rl-breaks-on-robots/widgets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'why-llm-rl-breaks-on-robots';
export const ARTICLE = path.join(ROOT, `content/robotics/${SLUG}.md`);
export const THUMB = path.join(ROOT, `assets/robotics/${SLUG}/thumbnail.svg`);
export const SIM_DEFAULT = { steps: 10, beta: 0, seed: 7 };

const BOARD = '#1d2824';
const F = { one: C.blue, two: C.green, three: C.yellow, four: C.pink };
const PW = 400, PH = 440, GAP = 12, TOP = 76;
const ORDER = ['walls', 'mug', 'tokens', 'flow', 'sum', 'clip', 'pathwise', 'cliff', 'funnel', 'chain', 'patches', 'cfg', 'gvc', 'beyond', 'escape', 'imagine'];
// Three columns keep the drawn board narrow; article.css chalks each panel on its own, because WebKit clamps a
// filter buffer larger than 4,096 device pixels and this board is taller than that on a 2x screen.
const COLS = 3;
const origin = (i) => [14 + (i % COLS) * (PW + GAP), TOP + Math.floor(i / COLS) * (PH + GAP)];
const WHOLE = [0, 0, 14 * 2 + PW * COLS + GAP * (COLS - 1), TOP + Math.ceil(ORDER.length / COLS) * (PH + GAP) + 8];

const r = random(20261102);
const t = (x, y, value, opts = {}) => text(x, y, value, { size: 14, ...opts });
const small = (x, y, value, opts = {}) => text(x, y, value, { size: 12.5, fill: C.muted, ...opts });
const head = (x, y, value, opts = {}) => text(x, y, value, { size: 15, weight: 700, ...opts });
const eq = (x, y, parts, opts = {}) => math(x, y, parts, { size: 17, ...opts });
const lab = (x, y, parts, opts = {}) => math(x, y, parts, { size: 12.5, fill: C.muted, ...opts });
const arrow = (x1, y1, x2, y2, opts = {}) => line(r, x1, y1, x2, y2, { arrow: true, width: 2, size: 10, ...opts });
const box = (x, y, w, h, opts = {}) => rect(r, x, y, w, h, { width: 1.8, jitter: 1.4, ...opts });
const dot = (x, y, rad, fill, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${rad}" fill="${fill}"${extra}/>`;
const ring = (x, y, rad, stroke, extra = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${rad}" fill="none" stroke="${stroke}" stroke-width="2"${extra}/>`;
const poly = (pts, stroke, extra = '') => `<polyline points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const mugAt = (x, y, rad = 22) => ring(x, y, rad, C.ink) + `<path d="M${x + rad - 1} ${y - 8} q14 0 14 9 t-14 9" fill="none" stroke="${C.ink}" stroke-width="2"/>`;

function panel(id, title, body) {
  const [x, y] = origin(ORDER.indexOf(id));
  return `<g class="rc-panel" data-panel="${id}" transform="translate(${x},${y})">${rect(r, 0, 0, PW, PH, { width: 2.2, jitter: 1.6 })}${text(16, 32, title, { font: HAND, size: 22, weight: 700, fill: C.yellow })}${body}</g>`;
}

// 0. Opening: the environment wall falls to a simulator; the architecture wall does not.
function walls() {
  let s = box(16, 50, 368, 160, { stroke: C.green });
  s += head(28, 74, '1 · environment wall', { fill: C.green });
  s += t(28, 98, 'PPO: fresh rollouts for every update', { size: 13 });
  s += t(28, 118, 'GRPO: a group of rollouts from one start state', { size: 13 });
  s += t(28, 146, 'simulator: 4,096 robots in parallel,', { size: 13, fill: C.green }) + t(28, 164, 'copy the start state as often as you like', { size: 13, fill: C.green });
  s += small(28, 194, 'real robot: replay + bootstrapping + critic = deadly triad');
  s += box(16, 230, 368, 150, { stroke: C.red });
  s += head(28, 254, '2 · architecture wall', { fill: C.red });
  s += t(28, 278, 'flow VLA: noise → 10 steps → 1,450 numbers', { size: 13 });
  s += t(28, 300, '✗ family 1: no closed-form log π', { size: 13, fill: C.red });
  s += t(28, 320, '✗ family 2: ∂Q/∂a must cross 10 steps', { size: 13, fill: C.red });
  s += t(28, 352, 'breaks even inside a simulator', { size: 13, weight: 700 });
  s += small(16, 410, 'this article: wall 2 · the deadly triad: RL series, part 5');
  return panel('walls', 'Two walls', s);
}

// 1. Two good routes around a mug; a softmax keeps both.
function mug() {
  let s = '';
  const sx = 120, sy = 206, gx = 120, gy = 58, my = 132;
  s += mugAt(120, my) + small(120, my + 4, 'mug', { anchor: 'middle', fill: C.ink });
  s += dot(sx, sy, 5, C.ink) + small(sx + 10, sy + 4, 'start') + dot(gx, gy, 5, C.ink) + small(gx + 10, gy + 2, 'goal');
  s += curve([[sx, sy], [sx - 54, my + 30], [sx - 62, my], [sx - 50, my - 36], [gx, gy]], { stroke: C.green, width: 2.4, arrow: true });
  s += curve([[sx, sy], [sx + 54, my + 30], [sx + 62, my], [sx + 50, my - 36], [gx, gy]], { stroke: C.green, width: 2.4, arrow: true });
  s += line(r, sx, sy - 8, gx, gy + 8, { stroke: C.red, width: 2.2, dash: '6 5' });
  s += t(sx - 112, my + 4, 'a = −1', { fill: C.green }) + t(sx + 70, my + 4, 'a = +1', { fill: C.green });
  s += t(222, 96, 'squared error:', { size: 13 }) + t(222, 116, 'mean of −1, +1', { size: 13 }) + t(222, 136, '= 0 → crash', { size: 13, fill: C.red });
  s += head(16, 252, 'a softmax over bins keeps both', { fill: C.green, size: 14 });
  s += eq(16, 280, ['π(i | s) = e', ['zᵢ', 'sup'], ' / Σ', ['j', 'sub'], ' e', ['zⱼ', 'sup']], { size: 16 });
  const base = 382;
  s += line(r, 40, base, 280, base, { stroke: C.muted, width: 1.2 });
  [[-1, 0.5, C.green], [0, 0.0, C.red], [1, 0.5, C.green]].forEach(([bin, p, color], i) => {
    const x = 60 + i * 80, h = 4 + p * 120;
    s += `<rect x="${x}" y="${base - h}" width="36" height="${h}" fill="${color}" fill-opacity=".8"/>`;
    s += small(x + 18, base + 16, `bin ${bin > 0 ? '+' : ''}${bin}`, { anchor: 'middle', fill: C.ink }) + small(x + 18, base - h - 6, `${Math.round(p * 100)}%`, { anchor: 'middle' });
  });
  s += t(292, 318, 'raise z₋₁, z₊₁', { size: 13 }) + t(292, 338, '→ the sum grows', { size: 13 }) + t(292, 358, '→ bin 0 shrinks', { size: 13, fill: C.red });
  s += t(16, 424, '+ both answers · + exact log π in one forward pass', { size: 13 });
  return panel('mug', 'Two good answers', s);
}

// 2. Tokens decode one at a time; a flow refines everything at once.
function tokens() {
  let s = head(16, 58, 'parallel softmaxes tear the motion', { fill: C.red, size: 14 });
  const joints = ['shoulder', 'elbow', 'wrist'];
  joints.forEach((j, i) => { s += small(16, 84 + i * 20, j, { fill: C.ink }) + small(88, 84 + i * 20, ['left', 'right', 'left'][i], { fill: i === 1 ? C.red : C.green }); });
  s += t(150, 104, '✗ mixed modes', { fill: C.red, size: 13 });
  s += head(16, 168, 'so tokens come out one at a time', { fill: C.green, size: 14 });
  joints.forEach((j, i) => {
    const x = 20 + i * 104;
    s += box(x, 182, 86, 30, { stroke: C.green, width: 1.4 }) + small(x + 43, 202, `${j}: left`, { anchor: 'middle', fill: C.ink });
    if (i < 2) s += arrow(x + 88, 197, x + 102, 197, { stroke: C.muted, width: 1.4, size: 7 });
  });
  s += head(16, 250, 'tokens per 1-second chunk', { size: 14 });
  s += t(16, 274, 'naive bins: 50 × 29 = 1,450 tokens', { size: 13 });
  s += t(16, 294, 'FAST (DCT + BPE): about 30 per arm', { size: 13 });
  s += t(16, 314, 'flow: 10 steps, all 1,450 numbers each', { size: 13, fill: C.green });
  s += head(16, 352, 'training ≠ acting', { size: 14 });
  s += t(16, 376, 'train: known tokens, all in one pass', { size: 13, fill: C.green });
  s += t(16, 396, 'act: each token waits for the last', { size: 13, fill: C.red });
  s += small(220, 376, 'π0, RTX 4090:', { fill: C.ink }) + small(220, 396, 'flow < 100 ms', { fill: C.green }) + small(300, 396, 'FAST ≈ 750 ms', { fill: C.red });
  s += small(16, 424, 'π0.5: FAST tokens to pretrain, a flow expert to act');
  return panel('tokens', 'Why not tokens?', s);
}

// 3. Visual 1: straight training lines cross, so v needs t; the learned streams split and squeeze.
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
  const plot = (y0, h) => ({ X: (q) => 60 + q * 290, Y: (a) => y0 + h / 2 - a * (h / 2 - 6) / 1.25 });
  const A = plot(84, 140), B = plot(268, 140);
  for (const p of [A, B]) {
    s += line(r, p.X(0), p.Y(1.25), p.X(0), p.Y(-1.25), { stroke: C.muted, width: 1.2 }) + line(r, p.X(1), p.Y(1.25), p.X(1), p.Y(-1.25), { stroke: C.muted, width: 1.2, dash: '4 4' });
    s += small(p.X(0) - 8, p.Y(1) + 4, '+1', { anchor: 'end' }) + small(p.X(0) - 8, p.Y(-1) + 4, '−1', { anchor: 'end' }) + small(p.X(0) - 8, p.Y(0) + 4, 'a', { anchor: 'end', fill: C.ink });
    s += small(p.X(0), p.Y(-1.25) + 14, 't = 0', { anchor: 'middle' }) + small(p.X(1), p.Y(-1.25) + 14, 't = 1', { anchor: 'middle' });
  }
  s += lab(16, 60, ['a', ['t', 'sub'], ' = (1 − t) a', ['0', 'sub'], ' + t a', ['1', 'sub'], [' · target ', 'word'], 'a', ['1', 'sub'], ' − a', ['0', 'sub'], [', the same at every t', 'word']], { fill: C.ink, size: 13 });
  // straight training lines
  [[1, 1, C.muted], [-1, -1, C.muted], [1, -1, C.red], [-1, 1, C.blue]].forEach(([a0, a1, color]) => { s += line(r, A.X(0), A.Y(a0), A.X(1), A.Y(a1), { stroke: color, width: 1.8 }); });
  s += line(r, A.X(0), A.Y(0.5), A.X(1), A.Y(0.5), { stroke: C.yellow, width: 1.2, dash: '4 4' }) + small(A.X(1) + 6, A.Y(0.5) + 4, 'a = +0.5', { fill: C.yellow });
  s += dot(A.X(0.25), A.Y(0.5), 5, C.red) + dot(A.X(0.75), A.Y(0.5), 5, C.blue);
  s += small(A.X(0.25), A.Y(0.5) - 10, 't = 0.25: v = −2', { anchor: 'middle', fill: C.red }) + small(A.X(0.75), A.Y(0.5) + 20, 't = 0.75: v = +2', { anchor: 'middle', fill: C.blue });
  s += small(16, 246, 'same a, opposite v: without t the net averages them to 0', { fill: C.ink });
  // learned streams, with a band of starts squeezed into the top mode
  const band = [];
  for (let a0 = 0.15; a0 <= 1.0001; a0 += 0.05) {
    let a = a0; const pts = [[B.X(0), B.Y(a)]];
    for (let k = 0; k < 50; k++) { a += 0.02 * flow1d(a, k / 50); pts.push([B.X((k + 1) / 50), B.Y(a)]); }
    band.push(pts);
  }
  s += `<path d="M${band[0].map(([x, y]) => `${n(x)},${n(y)}`).join(' L')} L${band[band.length - 1].slice().reverse().map(([x, y]) => `${n(x)},${n(y)}`).join(' L')} Z" fill="${C.yellow}" fill-opacity=".16"/>`;
  for (const a0 of [-1.2, -0.85, -0.5, -0.2, -0.05, 0.05, 0.2, 0.5, 0.85, 1.2]) {
    let a = a0; const pts = [[B.X(0), B.Y(a)]];
    for (let k = 0; k < 10; k++) { a += 0.1 * flow1d(a, k / 10); pts.push([B.X((k + 1) / 10), B.Y(a)]); }
    s += poly(pts, C.yellow, ' stroke-width="1.6"');
  }
  s += ring(B.X(1) + 18, B.Y(0), 10, C.ink);
  s += small(16, 432, 'with t: streams curve apart and the shaded band squeezes', { fill: C.ink });
  return panel('flow', 'Lines cross, streams split', s);
}

// 4. One equation; where θ lives decides the family.
function sum() {
  let s = small(16, 58, 'family 0, Q-learning: a* = argmax Q(s, a)', { fill: C.ink });
  s += small(16, 76, '4 buttons: check all 4 ✓ · 29 joints × 10 bins: 10²⁹ ✗');
  s += eq(16, 112, ['J(θ) = Σ', ['a', 'sub'], ' π', ['θ', 'sub'], '(a|s) Q(s, a)'], { size: 18 });
  s += eq(16, 146, ['∇J = Σ', ['a', 'sub'], ' [ ∇π', ['θ', 'sub'], ' · Q + π', ['θ', 'sub'], ' · ∇Q ]'], { size: 16 });
  s += arrow(110, 160, 70, 196, { stroke: F.one }) + arrow(260, 160, 300, 196, { stroke: F.two });
  s += box(16, 200, 180, 150, { stroke: F.one }) + box(204, 200, 180, 150, { stroke: F.two });
  s += head(26, 222, 'family 1', { fill: F.one }) + small(26, 242, 'a is a fixed point', { fill: C.ink }) + small(26, 260, '→ ∇Q = 0');
  s += lab(26, 284, ['÷ π: ∇log π'], { fill: C.ink, size: 14 });
  s += eq(26, 318, ['E[ A ∇log π ]'], { size: 16, fill: F.one }) + small(26, 340, 'REINFORCE · PPO · GRPO');
  s += head(214, 222, 'family 2', { fill: F.two }) + lab(214, 242, ['a = a', ['θ', 'sub'], '(s, ε)'], { fill: C.ink }) + small(214, 260, '→ θ moves into Q');
  s += small(214, 284, 'chain rule', { fill: C.ink });
  s += eq(214, 318, ['E[ ∇', ['a', 'sub'], 'Q · ∇', ['θ', 'sub'], 'a ]'], { size: 16, fill: F.two }) + small(214, 340, 'DDPG · TD3 · SAC');
  s += head(16, 384, 'two actions', { size: 14 });
  s += lab(16, 406, ['J = (1 − θ)·2 + θ·10  ⇒  dJ/dθ = 8'], { fill: C.ink, size: 14 });
  s += small(16, 428, 'θ = π(right); left earns 2, right earns 10');
  return panel('sum', 'One equation, two families', s);
}

// 5. PPO's clipped objective, and where old samples land.
function clip() {
  const X = (q) => 48 + q * 132, Y = (l) => 214 - l * 62;
  let s = eq(16, 60, ['r(θ) = π', ['θ', 'sub'], '(a|s) / π', ['old', 'subword'], '(a|s)'], { size: 16 });
  s += `<rect x="${X(0.8)}" y="${Y(1.9)}" width="${X(1.2) - X(0.8)}" height="${Y(-2.6) - Y(1.9)}" fill="${C.ink}" fill-opacity=".09"/>`;
  s += small(X(1), Y(1.9) - 6, '[0.8, 1.2]', { anchor: 'middle' });
  s += arrow(X(0) - 6, Y(0), X(2.5) + 8, Y(0), { stroke: C.muted, width: 1.4 }) + small(X(2.5), Y(0) + 18, 'ratio r', { anchor: 'end' });
  s += line(r, X(0), Y(-2.6), X(0), Y(1.9), { stroke: C.muted, width: 1.4 }) + small(X(0) + 6, Y(1.9) + 4, 'objective');
  [0, 1, 2].forEach((q) => { s += small(X(q), Y(0) + 18, String(q), { anchor: 'middle' }); });
  s += poly([[X(0), Y(0)], [X(1.2), Y(1.2)], [X(2.5), Y(1.2)]], C.green);
  s += poly([[X(0), Y(-0.8)], [X(0.8), Y(-0.8)], [X(2.5), Y(-2.5)]], C.red);
  s += t(X(1.5), Y(1.2) - 12, 'A > 0: flat past 1.2', { fill: C.green }) + t(X(0.02), Y(-0.8) + 24, 'A < 0: flat', { fill: C.red }) + t(X(0.02), Y(-0.8) + 41, 'below 0.8', { fill: C.red });
  [1.8, 2.3].forEach((q) => { s += ring(X(q), Y(1.2), 6, C.yellow); });
  [0.15, 0.45].forEach((q) => { s += ring(X(q), Y(-0.8), 6, C.yellow); });
  s += t(X(1.6), Y(1.2) + 26, '∇ = 0', { fill: C.yellow, weight: 700 }) + t(X(0.12), Y(-0.8) - 12, '∇ = 0', { fill: C.yellow, weight: 700 });
  s += eq(16, 384, ['L = min( r A, clip(r, 0.8, 1.2) A )'], { size: 16 });
  s += t(16, 408, '○ old samples: r far from 1, on a plateau', { fill: C.yellow, size: 13 });
  s += small(16, 428, 'fresh rollouts start at r = 1, where the clip helps');
  return panel('clip', 'PPO needs fresh data', s);
}

// 6. Family 2: a deterministic actor needs no noise; a stochastic one moves its noise outside.
function pathwise() {
  let s = head(16, 58, 'DDPG, TD3: deterministic', { fill: F.two, size: 14 });
  s += lab(16, 82, ['a = μ', ['θ', 'sub'], '(s)   ∇J = ∂Q/∂a · ∇', ['θ', 'sub'], 'μ', ['θ', 'sub'], [' · no noise', 'word']], { fill: C.ink, size: 14 });
  s += head(16, 116, 'SAC: stochastic, noise moved outside', { fill: F.two, size: 14 });
  s += lab(16, 140, ['a = μ', ['θ', 'sub'], '(s) + σ', ['θ', 'sub'], '(s) ε,   ε ~ N(0, I)'], { fill: C.ink, size: 14 });
  s += lab(16, 162, [['flow policy: ', 'word'], 'a', ['1', 'sub'], ' = flow', ['θ', 'sub'], '(s, a', ['0', 'sub'], ')', [' · already this form, ε = a₀', 'word']], { size: 13 });
  // one scalar versus 1,450 slopes
  s += small(16, 196, 'family 1 gets: A = +5', { fill: F.one }) + `<rect x="170" y="186" width="10" height="12" fill="${F.one}"/>`;
  s += small(16, 218, 'family 2 gets: ∂Q/∂a', { fill: F.two });
  for (let i = 0; i < 58; i++) s += `<rect x="${n(170 + i * 3.6)}" y="208" width="3" height="12" fill="${r() < 0.5 ? C.green : C.red}" fill-opacity=".85"/>`;
  s += small(384, 236, 'one slope per number in the chunk', { anchor: 'end' });
  // the mirage loop
  const cx = 200, cy = 330;
  for (let k = 0; k < 3; k++) s += `<circle cx="${cx}" cy="${cy}" r="${24 - k * 7}" fill="none" stroke="${C.red}" stroke-opacity="${0.35 + k * 0.25}" stroke-width="2" stroke-dasharray="${6 - k} 4"/>`;
  s += small(cx, cy + 40, 'mirage', { anchor: 'middle', fill: C.red });
  s += box(112, 252, 176, 36, { stroke: C.red }) + t(200, 268, '1 critic grows a spike', { anchor: 'middle', size: 13 }) + small(200, 283, 'where no data is', { anchor: 'middle' });
  s += box(250, 352, 138, 46, { stroke: F.two }) + t(319, 371, '2 actor climbs', { anchor: 'middle', size: 13 }) + t(319, 389, 'the fake slope', { anchor: 'middle', size: 13 });
  s += box(12, 352, 150, 46, { stroke: C.ink }) + t(87, 371, '3 backup copies', { anchor: 'middle', size: 13 }) + t(87, 389, 'it to earlier states', { anchor: 'middle', size: 13 });
  s += arrow(272, 290, 312, 348, { stroke: C.muted }) + arrow(246, 376, 166, 376, { stroke: C.muted }) + arrow(78, 348, 126, 292, { stroke: C.muted });
  s += small(16, 428, 'TD3: min of twin critics · SAC: entropy bonus keeps σ > 0');
  return panel('pathwise', 'Family 2 climbs the critic', s);
}

// 7. The cliff paradox, the board's copy of the widget's default state.
function cliff() {
  const Q = (a) => 8 - (a - 1.5) ** 2;
  const X = (a) => 46 + (a + 2) * 56, Y = (q) => 214 - q * 18;
  let s = '';
  for (const [lo, hi] of [[-0.3, 0], [1.5, 3.3]]) s += `<rect x="${X(lo)}" y="${Y(9)}" width="${X(hi) - X(lo)}" height="${Y(-1.2) - Y(9)}" fill="#e0a458" fill-opacity=".14"/>`;
  s += line(r, X(-2), Y(-1.2), X(4.3), Y(-1.2), { stroke: C.muted, width: 1.2 }) + line(r, X(-2), Y(-1.2), X(-2), Y(9), { stroke: C.muted, width: 1.2 });
  s += small(X(4.3), Y(-1.2) + 16, 'action a (wrist torque) →', { anchor: 'end' }) + small(X(-2) + 6, Y(9) + 4, 'return Q');
  const pts = []; for (let a = -1.3; a <= 4.3; a += 0.05) pts.push([X(a), Y(Math.max(-1.2, Q(a)))]);
  s += poly(pts, C.ink);
  s += line(r, X(-2), Y(4.75), X(4.3), Y(4.75), { stroke: C.muted, width: 1.2, dash: '5 5' }) + small(X(-1.9), Y(4.75) - 6, 'V = 4.75');
  s += small(X(1.5), Y(8) - 8, 'peak 8 at 1.5', { anchor: 'middle' });
  s += line(r, X(2), Y(4.75), X(2), Y(7.75), { stroke: C.green, width: 2.4 }) + dot(X(2), Y(7.75), 5, C.yellow);
  s += small(X(2) + 8, Y(6.2), 'A = +3', { fill: C.green });
  s += line(r, X(1.5), Y(8.25), X(2.5), Y(7.25), { stroke: C.red, width: 2.2 }) + small(X(2.5) + 4, Y(7.25) + 4, 'slope −1', { fill: C.red });
  const bell = []; for (let a = -2; a <= 2; a += 0.05) bell.push([X(a), Y(-1.2) - 28 * Math.exp(-(a * a) / 2)]);
  s += poly(bell, C.blue, ' stroke-width="1.6"') + small(X(0), Y(-1.2) - 32, 'μ = 0, σ = 1', { anchor: 'middle', fill: C.blue });
  s += small(X(2.4), Y(-1.2) - 8, 'opposite in both bands', { anchor: 'middle', fill: '#e0a458' });
  s += head(16, 268, 'one sample, a = 2.0', { size: 14 });
  s += t(16, 292, 'family 1: A · (a − μ) = 3 × 2 = +6 → right', { fill: F.one, size: 13 });
  s += t(16, 314, 'family 2: ∂Q/∂a · ∂a/∂μ = −1 × 1 = −1 → left', { fill: F.two, size: 13 });
  s += head(16, 352, 'averaged over the whole bell', { size: 14 });
  s += t(16, 376, 'family 1: +3 · family 2: +3 · exact: +3', { fill: C.yellow, size: 13 });
  s += small(16, 400, 'height above average vs slope under the sample');
  s += small(16, 420, 'Q here is the true return, not a critic error');
  return panel('cliff', 'One sample, two directions', s);
}

// 8. Family 1 breaks: the density lives in the squeeze, and the trace costs 1,450 backward passes.
function funnel() {
  let s = '';
  const X = (q) => 30 + q * 200, top0 = 70, bot0 = 170, mid1 = 132;
  s += `<path d="M${X(0)} ${top0} C${X(0.5)} ${top0} ${X(0.75)} ${mid1 - 1} ${X(1)} ${mid1 - 0.5} L${X(1)} ${mid1 + 0.5} C${X(0.75)} ${mid1 + 1} ${X(0.5)} ${bot0} ${X(0)} ${bot0} Z" fill="${C.yellow}" fill-opacity=".22" stroke="${C.yellow}" stroke-width="1.6"/>`;
  [[top0 + 12, -1], [bot0 - 12, 1]].forEach(([y, sgn]) => { s += arrow(X(0.25), y, X(0.62), mid1 - sgn * 14, { stroke: C.ink, width: 1.6, size: 8 }); });
  s += line(r, X(0) - 10, top0, X(0) - 10, bot0, { stroke: C.ink, width: 1.4 }) + small(X(0) - 4, bot0 + 18, 'width 1.0, 30% of the mass');
  s += small(X(1) + 6, mid1 + 4, 'width 0.01', { fill: C.ink });
  s += small(X(0), top0 - 10, 't = 0') + small(X(1), top0 - 10, 't = 1', { anchor: 'end' });
  s += t(16, 220, 'density = mass / width: 0.3 → 30, ×100', { fill: C.yellow });
  s += head(16, 256, 'log-likelihood of a flow', { size: 14 });
  s += eq(16, 286, ['log π(a', ['1', 'sub'], '|s) = log p', ['0', 'sub'], '(a', ['0', 'sub'], ') − ∫ tr(∂v/∂a', ['t', 'sub'], ') dt'], { size: 16 });
  s += small(16, 306, 'no θ in p₀: all of θ sits in the squeeze');
  s += t(16, 334, '1 backward pass → 1 row → 1 diagonal entry', { size: 13 });
  s += t(16, 354, '1,450 passes × 10 Euler steps = 14,500', { size: 13, fill: C.red });
  s += t(16, 374, 'sampling the same chunk: 10 forward passes', { size: 13, fill: C.green });
  s += small(16, 402, 'two modes from one bell: stretch the middle,', { fill: C.ink });
  s += small(16, 420, 'squeeze the modes · the trace is the price of multimodality', { fill: C.ink });
  return panel('funnel', 'Family 1: the squeeze', s);
}

// 9. Family 2 breaks: one backward pass, nine multiplied factors, and a critic slope off the data.
function chain() {
  let s = '';
  for (let k = 0; k < 10; k++) {
    const x = 20 + k * 36;
    s += box(x, 66, 28, 28, { stroke: C.ink, width: 1.5 }) + small(x + 14, 85, `f${k + 1}`, { anchor: 'middle', fill: C.ink });
    if (k < 9) s += line(r, x + 28, 80, x + 36, 80, { stroke: C.muted, width: 1.4 });
  }
  s += small(20, 58, 'a₀ →', { fill: C.ink }) + small(380, 58, '→ a₁', { anchor: 'end', fill: C.ink });
  for (let k = 9; k >= 0; k--) {
    const x = 20 + k * 36, w = 1 + (9 - k) * 0.55;
    s += arrow(x + 34, 118, x + 6, 118, { stroke: C.red, width: w, size: 6 + (9 - k) * 0.6 });
  }
  s += lab(380, 140, ['← ∇', ['a₁', 'sub'], 'Q', [' through 9 factors ', 'word'], 'I + 0.1 ∂v/∂a'], { anchor: 'end', fill: C.red });
  s += t(16, 170, '1.3⁹ ≈ 10.6', { fill: C.yellow, size: 15 }) + t(140, 170, '0.7⁹ ≈ 0.04', { fill: C.yellow, size: 15 });
  s += small(16, 190, 'one backward pass, but a 10-layer RNN: explode or vanish');
  const pts = [[30, 360], [110, 330], [200, 340], [290, 310], [372, 322]];
  s += curve(pts, { stroke: C.green, width: 7, opacity: 0.35 }) + curve(pts, { stroke: C.green, width: 1.5 });
  s += small(36, 384, 'real chunks: a thin sheet in 1,450 dimensions', { fill: C.green });
  s += dot(150, 334, 5, C.yellow) + small(156, 356, 'a₁', { fill: C.yellow });
  s += curve([[150, 330], [164, 284], [186, 248], [212, 228]], { stroke: C.red, width: 2.2, arrow: true });
  s += poly([[180, 300], [206, 300], [216, 212], [226, 300], [252, 300]], C.red, ' stroke-width="1.8"');
  s += t(240, 226, 'critic mirage', { fill: C.red, size: 13 }) + small(240, 244, 'Q looks huge here,') + small(240, 260, 'no real chunk nearby');
  s += small(16, 424, 'the warped slope pulls a₁ off the sheet, toward the spike');
  return panel('chain', 'Family 2: nine Jacobians', s);
}

// 10. Two PPO patches: noise in every step, or a flow-loss proxy for the ratio.
function patches() {
  let s = head(16, 58, 'DPPO, πRL: noise in every denoising step', { fill: F.one, size: 14 });
  s += t(16, 82, 'deterministic step: θ_old → 0.200, θ → 0.201', { size: 13 });
  s += t(16, 102, 'p(0.200) = 0, log p = −∞', { size: 13, fill: C.red });
  const bx = 250, by = 104;
  s += line(r, 236, by, 380, by, { stroke: C.muted, width: 1.2 });
  const g = []; for (let x = -3; x <= 3; x += 0.1) g.push([bx + 40 + x * 16, by - 34 * Math.exp(-x * x / 2)]);
  s += poly(g, C.green, ' stroke-width="1.8"') + small(bx + 40, by + 16, 'σ > 0: a Gaussian log p', { anchor: 'middle', fill: C.green });
  for (let e = 0; e < 5; e++) {
    const x = 18 + e * 74;
    s += box(x, 136, 64, 30, { stroke: C.ink, width: 1.5 });
    for (let d = 0; d < 10; d++) s += `<line x1="${x + 4 + d * 6}" y1="156" x2="${x + 4 + d * 6}" y2="164" stroke="${C.yellow}" stroke-width="2"/>`;
    s += small(x + 32, 151, `chunk ${e + 1}`, { anchor: 'middle', fill: C.ink });
  }
  s += t(16, 192, '50 chunks × 10 denoising steps = 500 decisions', { size: 13, fill: C.red });
  s += head(16, 234, 'FPO: flow loss stands in for log π', { fill: F.one, size: 14 });
  s += lab(16, 258, ['r ≈ exp( L', ['old', 'subword'], ' − L', ['θ', 'sub'], ' ),   L = ‖v', ['θ', 'sub'], ' − (a', ['1', 'sub'], ' − a', ['0', 'sub'], ')‖²'], { fill: C.ink, size: 14 });
  const cx = 200, cy = 368, R = 84;
  const ang = (q) => Math.PI * (1 - q / 3);
  const P = (q, rad) => [cx + rad * Math.cos(ang(q)), cy - rad * Math.sin(ang(q))];
  const arc = (q0, q1, rad) => { const [x0, y0] = P(q0, rad), [x1, y1] = P(q1, rad); return `M${n(x0)} ${n(y0)} A${rad} ${rad} 0 0 1 ${n(x1)} ${n(y1)}`; };
  s += `<path d="${arc(0, 3, R)}" fill="none" stroke="${C.ink}" stroke-width="2.2"/><path d="${arc(0.8, 1.2, R - 6)}" fill="none" stroke="${C.green}" stroke-width="12" stroke-opacity=".7"/>`;
  [0, 1, 2, 3].forEach((q) => { const [x, y] = P(q, R + 14); s += small(x, y + 4, String(q), { anchor: 'middle' }); });
  const [px, py] = P(1.05, R - 18), [tx, ty] = P(2.4, R - 18);
  s += line(r, cx, cy, px, py, { stroke: C.yellow, width: 3 }) + line(r, cx, cy, tx, ty, { stroke: C.red, width: 2.4, dash: '6 4' }) + dot(cx, cy, 5, C.ink);
  s += small(cx - 108, cy + 22, 'proxy ratio: inside', { fill: C.yellow }) + small(cx + 24, cy + 22, 'true ratio: outside', { fill: C.red });
  s += small(16, 410, 'a loose proxy can leave the clip open');
  s += small(16, 428, 'π*0.6 laundry: a PPO variant and AWR fall far short of RECAP', { fill: C.ink });
  return panel('patches', 'Two PPO patches', s);
}

// 11. AWR can only pull; RECAP learns both and subtracts at test time.
function cfg() {
  let s = lab(16, 58, [['AWR: ', 'word'], 'w = e', ['A/β', 'sup'], ' > 0', [' · a negative w on ‖·‖² has no floor', 'word']], { fill: C.ink, size: 13 });
  s += eq(16, 90, ['v', ['guided', 'subword'], ' = v', ['all', 'subword'], ' + β (v', ['good', 'subword'], ' − v', ['all', 'subword'], ')'], { size: 17 });
  s += eq(16, 114, ['v', ['all', 'subword'], ' = 0.3 v', ['good', 'subword'], ' + 0.7 v', ['bad', 'subword'], ' = (0, 1)'], { size: 15, fill: C.muted });
  const ox = 120, oy = 320, k = 110, P = (x, y) => [ox + x * k, oy - y * k];
  s += line(r, 24, oy, 388, oy, { stroke: C.muted, width: 1.2 }) + small(388, oy + 18, 'sideways', { anchor: 'end' });
  s += line(r, ox, oy + 10, ox, 150, { stroke: C.muted, width: 1.2 }) + small(ox + 6, 158, 'forward');
  const vec = (x, y, color, w = 2.4) => { const [x1, y1] = P(x, y); return arrow(ox, oy, x1, y1, { stroke: color, width: w, size: 11 }); };
  s += vec(-0.3, 1, C.red) + vec(0, 1, C.ink) + vec(0.7, 1, C.green) + vec(1.4, 1, C.yellow, 3);
  const [ax, ay] = P(0, 1), [gx, gy] = P(0.7, 1), [hx, hy] = P(1.4, 1);
  s += line(r, ax, ay, gx, gy, { stroke: C.green, width: 1.4, dash: '4 4' }) + line(r, gx, gy, hx, hy, { stroke: C.yellow, width: 1.4, dash: '4 4' });
  s += t(16, 274, 'bad (−0.3, 1)', { fill: C.red, size: 13 }) + t(ax - 6, ay - 14, 'all (0, 1)', { anchor: 'end', size: 13 });
  s += t(gx, gy - 14, 'good (0.7, 1)', { anchor: 'middle', fill: C.green, size: 13 }) + t(hx + 8, hy + 4, 'guided', { fill: C.yellow, size: 13 }) + t(hx + 8, hy + 22, '(1.4, 1)', { fill: C.yellow, size: 13 });
  s += t(236, 254, 'β = 2: past good,', { fill: C.yellow, size: 13 }) + t(236, 272, 'away from bad', { fill: C.yellow, size: 13 });
  s += head(16, 364, 'RECAP (π*0.6)', { fill: F.three, size: 14 });
  s += t(16, 386, 'label each chunk: advantage positive or negative', { size: 13 });
  s += t(16, 406, 'plain flow-matching BC on all of it, weight 1', { size: 13 });
  s += small(16, 428, 'advantage from a 201-bin value net · 2 calls per Euler step');
  return panel('cfg', 'Learn both, subtract later', s);
}

// 12. A critic supervises one number; GVC supervises 1,450.
function gvc() {
  let s = '';
  const col = (x, title, inLabel, inTall, outLabel, outTall, loss, color) => {
    let c = head(x, 58, title, { fill: color, size: 14 });
    const inH = inTall ? 96 : 14, outH = outTall ? 96 : 14;
    c += `<rect x="${x + 4}" y="${120 - inH / 2}" width="14" height="${inH}" fill="${C.ink}" fill-opacity=".55"/>` + (Array.isArray(inLabel) ? lab(x, 186, inLabel, { fill: C.ink }) : small(x, 186, inLabel, { fill: C.ink }));
    c += arrow(x + 24, 120, x + 52, 120, { stroke: C.muted, width: 1.6, size: 8 }) + box(x + 56, 98, 54, 44, { stroke: color }) + small(x + 83, 124, 'net', { anchor: 'middle', fill: C.ink });
    c += arrow(x + 114, 120, x + 138, 120, { stroke: C.muted, width: 1.6, size: 8 });
    c += `<rect x="${x + 142}" y="${120 - outH / 2}" width="14" height="${outH}" fill="${color}" fill-opacity=".85"/>` + small(x + 172, 186, outLabel, { anchor: 'end', fill: color });
    c += small(x, 206, loss, { fill: C.muted });
    return c;
  };
  s += col(16, 'standard critic', 's, a: 1,450 numbers', true, 'R̂: 1', false, 'loss (R̂ − R)²: 1 number', C.red);
  s += col(208, 'GVC', [['s, ', 'word'], 'z', ['i', 'sub'], [': a return bin', 'word']], false, 'v: 1,450', true, 'loss ‖v − (a₁ − a₀)‖²', C.green);
  s += t(16, 238, 'the loss now checks 1,450 outputs per sample', { size: 13, fill: C.green });
  s += head(16, 276, 'test time: rank N policy samples', { fill: F.three, size: 14 });
  const rr = random(16), hs = Array.from({ length: 16 }, () => 18 + rr() * 50);
  const best = hs.indexOf(Math.max(...hs));
  hs.forEach((h, i) => { s += `<rect x="${20 + i * 22}" y="${360 - h}" width="15" height="${h}" fill="${i === best ? C.green : C.ink}" fill-opacity="${i === best ? 0.9 : 0.4}"/>`; });
  s += line(r, 16, 361, 376, 361, { stroke: C.muted, width: 1.2 });
  s += small(20 + best * 22 + 7, 374, 'execute', { anchor: 'middle', fill: C.green });
  s += eq(16, 404, ['Q', ['GVC', 'subword'], ' = Σ', ['i', 'sub'], ' p(z', ['i', 'sub'], '|s, a) z', ['i', 'sub']], { size: 15 });
  s += lab(16, 426, ['p(z|s, a)', [' from Bayes over the bins; low flow error = likely bin', 'word']]);
  return panel('gvc', 'A critic versus GVC', s);
}

// 13. Family 4: the cloning ceiling, DSRL steering the noise, QF3 tilting the velocity.
function beyond() {
  let s = head(16, 58, 'DSRL: steer the noise of a frozen flow', { fill: F.four, size: 14 });
  s += `<circle cx="70" cy="122" r="40" fill="${C.ink}" fill-opacity=".08" stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="5 4"/>` + small(70, 178, 'noise a₀', { anchor: 'middle' });
  s += dot(86, 108, 5, F.four) + small(90, 98, 'RL picks a₀', { fill: F.four });
  s += arrow(114, 122, 164, 122, { stroke: C.muted }) + box(168, 98, 82, 48, { stroke: C.ink }) + small(209, 118, 'frozen flow', { anchor: 'middle', fill: C.ink }) + small(209, 135, 'θ locked', { anchor: 'middle' });
  s += arrow(254, 122, 296, 122, { stroke: C.muted });
  s += curve([[296, 150], [322, 132], [350, 126], [384, 112]], { stroke: C.green, width: 5, opacity: 0.4 }) + dot(330, 130, 5, C.yellow);
  s += small(384, 170, 'always a motion the flow can make', { anchor: 'end', fill: C.green });
  s += head(16, 222, 'QF3: tilt v with a one-step preview', { fill: F.four, size: 14 });
  const ax = 56, ay = 352;
  s += dot(ax, ay, 5, C.ink) + lab(ax - 8, ay + 20, ['a', ['t', 'sub']], { fill: C.ink });
  s += arrow(ax, ay, ax + 90, ay - 40, { stroke: C.ink }) + small(ax + 52, ay - 10, 'v', { fill: C.ink });
  s += line(r, ax + 90, ay - 40, ax + 210, ay - 92, { stroke: C.muted, width: 1.4, dash: '5 4' });
  s += ring(ax + 210, ay - 92, 6, C.yellow) + lab(ax + 160, ay - 112, ['â', ['1', 'sub'], ' = a', ['t', 'sub'], ' + (1 − t) v'], { fill: C.yellow, size: 13 });
  s += arrow(ax + 210, ay - 92, ax + 232, ay - 128, { stroke: C.green }) + lab(ax + 238, ay - 124, ['∇', ['a', 'sub'], 'Q'], { fill: C.green, size: 13 });
  s += arrow(ax, ay, ax + 86, ay - 58, { stroke: C.yellow, width: 2.6 }) + small(ax + 18, ay - 50, 'tilted v', { fill: C.yellow });
  s += small(16, 404, 'gradient crosses 1 step, never 10', { fill: C.ink });
  s += small(16, 424, 'the flow-matching loss stays on as an anchor');
  return panel('beyond', 'Steer the noise, tilt the flow', s);
}

// 14. Visual 5: four ways around the two traps, compared on what each one needs and what it can reach.
function escape() {
  let s = '';
  const cell = (x, y, title, color, body, marks) => {
    let c = box(x, y, 180, 176, { stroke: color, width: 1.5 }) + head(x + 10, y + 20, title, { fill: color, size: 13.5 }) + body;
    marks.forEach(([ok, label], i) => { c += small(x + 10, y + 132 + i * 16, `${ok === 'y' ? '✓' : ok === 'n' ? '✗' : '~'} ${label}`, { fill: ok === 'y' ? C.green : ok === 'n' ? C.red : C.yellow }); });
    return c;
  };
  // RECAP + CFG
  let a = ''; const ox = 70, oy = 158, P = (vx, vy) => [ox + vx * 48, oy - 70 - vy * 0];
  a += arrow(ox, 140, ox - 14, 96, { stroke: C.red }) + arrow(ox, 140, ox, 92, { stroke: C.ink }) + arrow(ox, 140, ox + 34, 94, { stroke: C.green }) + arrow(ox, 140, ox + 66, 96, { stroke: C.yellow, width: 2.6 });
  a += small(ox + 78, 104, 'guided', { fill: C.yellow }) + small(ox + 78, 120, 'β = 2', { fill: C.yellow });
  void P;
  s += cell(16, 50, 'RECAP + CFG', F.three, a, [['y', 'no log π'], ['y', 'no ∂Q/∂a']]);
  // GVC best of N
  let g = ''; const pts = [[218, 150], [250, 128], [290, 136], [330, 116], [372, 122]];
  g += curve(pts, { stroke: C.green, width: 6, opacity: 0.3 });
  [[230, 142], [252, 128], [270, 133], [292, 136], [312, 126], [336, 116], [356, 119]].forEach(([x, y], i) => { g += dot(x, y, i === 5 ? 6 : 3.5, i === 5 ? C.green : C.ink); });
  g += small(336, 104, 'best', { anchor: 'middle', fill: C.green }) + small(214, 96, 'samples sit on', { fill: C.ink }) + small(214, 110, 'the data sheet', { fill: C.ink });
  s += cell(204, 50, 'GVC best of N', F.three, g, [['y', 'no log π'], ['y', 'critic never searches']]);
  // DSRL
  let d = `<circle cx="56" cy="306" r="24" fill="${C.ink}" fill-opacity=".08" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="4 3"/>` + dot(62, 300, 4, F.four);
  d += arrow(84, 306, 110, 306, { stroke: C.muted, width: 1.6, size: 8 }) + box(114, 290, 54, 32, { stroke: C.ink, width: 1.3 }) + small(141, 310, 'frozen', { anchor: 'middle', fill: C.ink });
  d += small(26, 352, 'RL moves a₀ only', { fill: F.four });
  s += cell(16, 236, 'DSRL', F.four, d, [['y', 'flow θ never updated'], ['~', 'only what the flow can make']]);
  // QF3
  let q = dot(222, 340, 4, C.ink) + arrow(222, 340, 268, 318, { stroke: C.ink, width: 1.6, size: 8 }) + line(r, 268, 318, 336, 286, { stroke: C.muted, width: 1.2, dash: '4 3' });
  q += ring(336, 286, 5, C.yellow) + arrow(336, 286, 350, 262, { stroke: C.green, width: 1.6, size: 8 }) + small(214, 300, 'one-step preview', { fill: C.yellow });
  s += cell(204, 236, 'QF3', F.four, q, [['y', '∂Q/∂a crosses 1 step'], ['y', 'can leave the data']]);
  s += small(16, 432, 'family 3: choose among what the data holds · family 4: reach past it');
  return panel('escape', 'Four ways around', s);
}

// 15. The author's synthesis: propose, imagine, score, act, distill.
function imagine() {
  let s = '';
  s += `<path d="M60 236 C20 230 18 180 52 170 C40 120 100 96 136 116 C160 70 250 70 268 110 C310 88 372 116 360 166 C394 186 380 240 334 238 C320 270 250 276 228 252 C200 280 120 278 104 248 C88 256 70 250 60 236 Z" fill="${C.ink}" fill-opacity=".06" stroke="${C.ink}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
  const root = [92, 196], rr = random(13);
  let bestY = 0;
  for (let i = 0; i < 16; i++) {
    const y = 122 + i * 7.6, win = i === 10, x2 = 300 + rr() * 30;
    s += curve([root, [170, 196 + (y - 196) * 0.5], [230, y], [x2, y]], { stroke: win ? C.green : C.ink, width: win ? 2.6 : 1.1, opacity: win ? 1 : 0.5 });
    if (win) bestY = y;
  }
  s += small(326, bestY + 4, 'best', { fill: C.green }) + small(100, 136, 'world model: 16 futures', { fill: C.ink }) + small(100, 152, 'from the same state', { fill: C.ink }) + small(240, 112, 'GVC scores', { fill: C.yellow });
  s += line(r, 40, 400, 360, 400, { stroke: C.ink, width: 2 }) + box(170, 368, 40, 32, { stroke: C.yellow, width: 1.5 }) + ring(270, 386, 13, C.ink);
  s += line(r, 60, 400, 60, 330, { stroke: C.ink, width: 3 }) + line(r, 60, 330, 120, 300, { stroke: C.ink, width: 3 }) + line(r, 120, 300, 168, 344, { stroke: C.ink, width: 3 }) + dot(60, 330, 5, C.ink) + dot(120, 300, 5, C.ink);
  s += curve([[168, 348], [210, 330], [250, 352], [280, 360]], { stroke: C.green, width: 2.4, arrow: true });
  s += small(218, 322, 'execute the best', { fill: C.green });
  s += curve([[300, 372], [360, 330], [370, 280], [340, 250]], { stroke: C.yellow, width: 1.8, arrow: true, dash: '6 5' });
  s += small(388, 300, 'distill with', { anchor: 'end', fill: C.yellow }) + small(388, 316, 'plain BC', { anchor: 'end', fill: C.yellow });
  s += small(16, 60, 'my synthesis, not a published method', { fill: C.pink });
  s += small(16, 428, 'GRPO in imagination: same-state group, no log π');
  return panel('imagine', 'My guess: imagine, then act', s);
}

export function board() {
  const views = Object.fromEntries(ORDER.map((id, i) => { const [x, y] = origin(i); return [id, [x - 6, y - 6, PW + 12, PH + 12]]; }));
  const [W, H] = [WHOLE[2], WHOLE[3]];
  const legend = `<text x="${W / 2}" y="58" text-anchor="middle" font-family="${esc('Arial, Helvetica, sans-serif')}" font-size="14"><tspan fill="${F.one}">1 score-function</tspan><tspan fill="${C.muted}"> · </tspan><tspan fill="${F.two}">2 pathwise</tspan><tspan fill="${C.muted}"> · </tspan><tspan fill="${F.three}">3 reward as input</tspan><tspan fill="${C.muted}"> · </tspan><tspan fill="${F.four}">4 beyond the data</tspan></text>`;
  const body = [walls(), mug(), tokens(), flowPanel(), sum(), clip(), pathwise(), cliff(), funnel(), chain(), patches(), cfg(), gvc(), beyond(), escape(), imagine()].join('');
  return `<svg id="rc-flowrl" class="rc-svg flowrl-board" viewBox="${WHOLE.join(' ')}" role="img" aria-label="Blackboard with sixteen panels: the environment and architecture walls, two good answers around a mug, why not tokens, crossing training lines and splitting flow streams, one equation that splits into two RL families, PPO's clip on old data, family 2 climbing the critic, one sample sending the two families opposite ways, the squeeze that hides a flow's density, nine multiplied Jacobians, two PPO patches, classifier-free guidance, a critic versus GVC, steering and tilting a flow, four ways around the two traps, and the author's imagine-then-act loop" data-whole="${WHOLE.join(' ')}" data-views='${JSON.stringify(views)}'><rect width="${W}" height="${H}" fill="${BOARD}"/>${text(W / 2, 36, 'Why LLM RL breaks on robots, and the fixes', { font: HAND, size: 26, weight: 700, anchor: 'middle' })}${legend}${body}</svg>`;
}

export function simFigure() {
  const { svg, readout } = renderSim(SIM_DEFAULT);
  return `<figure class="fsim" id="flow-sim" data-flow-sim data-steps="${SIM_DEFAULT.steps}" data-beta="${SIM_DEFAULT.beta}" data-seed="${SIM_DEFAULT.seed}"><svg class="fsim-plot" viewBox="0 0 ${VIEW.w} ${VIEW.h}" role="img" aria-label="Top-down view of a mug with five clusters of demonstrations and the paths of 160 noise samples under the flow">${svg}</svg><div class="fsim-controls" hidden><label>Euler steps K <input type="range" min="1" max="20" step="1" value="${SIM_DEFAULT.steps}" data-k="steps"> <output data-o="steps">${SIM_DEFAULT.steps}</output></label><label>guidance β <input type="range" min="0" max="3" step="0.5" value="${SIM_DEFAULT.beta}" data-k="beta"> <output data-o="beta">${SIM_DEFAULT.beta}</output></label><button type="button" data-k="noise">New noise</button></div><figcaption class="fsim-readout" aria-live="polite">${readout}</figcaption></figure>`;
}

// The four widgets share one figure shape: a static drawing of the default state, hidden controls, a live readout.
const widgetFigure = (kind, label, h, view, controls) => `<figure class="fsim fwid" id="w-${kind}" data-widget="${kind}"><svg class="fsim-plot" viewBox="0 0 420 ${h}" role="img" aria-label="${esc(label)}">${view.svg}</svg><div class="fsim-controls" hidden>${controls}</div><figcaption class="fsim-readout" aria-live="polite">${esc(view.readout)}</figcaption></figure>`;
export const WIDGETS = {
  clocks: () => widgetFigure('clocks', 'A 50 by 29 grid of numbers, one action chunk, shown at one denoising step, with three joint curves below', 330, renderClocks({ k: 0 }),
    '<label>denoising step k <input type="range" min="0" max="10" step="1" value="0" data-k="k" name="clocks-k"> <output>0</output></label>'),
  trace: () => widgetFigure('trace', 'The 1,450 by 1,450 Jacobian of one Euler step; each backward pass reveals one row and one diagonal entry', 350, renderTrace({ passes: 0 }),
    '<button type="button" data-k="1">1 backward pass</button><button type="button" data-k="100">100 more</button><button type="button" data-k="all">all 1,450</button><button type="button" data-k="reset">reset</button>'),
  logtrick: () => widgetFigure('logtrick', 'Bars for the update each sampled action gives, with the average and the true gradient of 8', 330, renderLogTrick({ mode: 'raw', samples: drawSamples(10, 11) }),
    '<span class="fwid-modes"><label><input type="radio" name="lt-mode" value="raw" checked> ∇π · Q</label><label><input type="radio" name="lt-mode" value="log"> divide by π</label><label><input type="radio" name="lt-mode" value="base"> and subtract V</label></span><button type="button" data-k="10">draw 10</button><button type="button" data-k="1000">draw 1,000</button>'),
  cliff: () => widgetFigure('cliff', 'The return curve Q of a, a Gaussian policy, one sampled action and the update each family gives it', 370, renderCliff({ mu: 0, a: 2 }),
    '<label>policy mean μ <input type="range" min="-1" max="3" step="0.1" value="0" data-k="mu" name="cliff-mu"> <output>0.0</output></label><label>sample a <input type="range" min="-2.5" max="4.5" step="0.1" value="2" data-k="a" name="cliff-a"> <output>2.0</output></label>'),
};

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
  for (const [name, figure] of Object.entries(WIDGETS)) md = splice(md, `w-${name}`, figure());
  fs.writeFileSync(ARTICLE, md);
  fs.writeFileSync(THUMB, thumbnail());
  console.log(`wrote ${path.relative(ROOT, ARTICLE)} and ${path.relative(ROOT, THUMB)}`);
}
