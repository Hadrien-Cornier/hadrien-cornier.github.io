/** Draw the Imprint paper canvas (arXiv 2610.14406) as one blackboard SVG in two layouts.
 *
 * Numbers come from scripts/imprint-figures.json, which scripts/imprint-figures.py reads out of the
 * paper's tables. Panels 1 to 5 are schematics of the method; panel 6 and the small bar charts plot the
 * paper's numbers. Run `node scripts/imprint-canvas.mjs` to rewrite content/papers/imprint.html, then
 * build the site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import katex from 'katex';
import { C, HAND, esc, n, random, rect, line, curve, text, math, tag, star, snowflake } from './chalk.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/imprint-figures.json'), 'utf8'));
export const OUTPUT = path.join(ROOT, 'content/papers/imprint.html');
export const PANEL = { w: 560, h: 460 };

// The paper's own colour code: yellow for vision, blue for actions, green for joint states, orange for memory.
const S = { video: C.yellow, act: C.blue, state: C.green, mem: C.red, prog: C.pink };
const BLOCK = { R: '#e8655b', G: '#7fd08a', B: '#6aa8e8' };
const LID = { fill: '#5b4935', stroke: '#c8a679' };

// Numbers quoted on the canvas, by table row.
const RM = DATA.rmbench.methods;
const avg = (row) => row.at(-1);
// Fig. 6 points. EventVLA and MemoryVLA success values come from prior work on other backbones (Table 10 †),
// and EventVLA's latency is reported, not measured (App. C.5).
export const SCATTER = [
  { name: 'π0.5 alone', ms: DATA.latency.ms.pi05, success: avg(RM['\\pi_{0.5} (no memory)']), kind: 'base' },
  { name: 'HAMLET', ms: DATA.latency.ms.hamlet, success: avg(RM.HAMLET), kind: 'memory' },
  { name: 'MemoryVLA', ms: DATA.latency.ms.memoryvla, success: avg(RM['MemoryVLA†']), kind: 'memory', priorSuccess: true },
  { name: 'EventVLA', ms: DATA.latency.ms.eventvla, success: avg(RM['EventVLA†']), kind: 'memory', priorSuccess: true, priorLatency: true },
  { name: 'Imprint', ms: DATA.latency.ms.imprint_recurrent, success: avg(RM['IMPRINT (recurrent)']), kind: 'imprint' },
];
// Table 15 training recipes (full-attention encoder), after the no-memory π0.5 of Table 10. Every recipe runs stage 2;
// they differ in whether the encoder starts from stage 1 and whether stage 2 updates it (App. A.3).
const recipe = DATA.recipe.rows.Average;
export const RECIPE = [
  { label: 'no memory', value: avg(RM['\\pi_{0.5} (no memory)']), color: C.grid },
  { label: 'no stage 1', value: recipe[0], color: C.muted },
  { label: 'stage 1, then frozen', value: recipe[1], color: C.lavender },
  { label: 'stage 1, then tuned', value: recipe[2], color: S.mem },
];
// Table 17 balanced accuracy, the measure that matches the 1/6 chance line (the six color orders are unbalanced).
const probe = DATA.probe.rows;
export const PROBE = [
  { label: 'no stage 1', value: probe.E2E[1], color: C.muted },
  { label: 'after stage 1', value: probe.Frozen[1], color: S.mem },
];
export const CHANCE = 100 / 6;
const casa = DATA.robocasa.rows['Overall average'].values;
const real = DATA.real.methods;
export const TRANSFER = [
  { label: 'real robot · π0', base: real['\\pi_{0}'].average, imprint: real.IMPRINT.average },
  { label: 'RoboCasa · π0.5', base: casa[0], imprint: casa[4] },
];
const pct = (v) => `${v.toFixed(1)}%`;

// ── Small drawings ──────────────────────────────────────────────────────────────

/** Token grid: the memory drawn as a block of small squares. */
function tokens(r, x, y, cols, rows, size, color, gap = 3) {
  let out = '';
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    out += `<rect x="${n(x + j * (size + gap) + (r() - 0.5))}" y="${n(y + i * (size + gap) + (r() - 0.5))}" width="${size}" height="${size}" rx="1.5" fill="${color}" fill-opacity=".82"/>`;
  }
  return out;
}

function lid(cx, floor, w = 46, h = 36) {
  return `<path d="M${n(cx - w / 2)},${n(floor)} L${n(cx - w * 0.4)},${n(floor - h)} L${n(cx + w * 0.4)},${n(floor - h)} L${n(cx + w / 2)},${n(floor)} Z" fill="${LID.fill}" stroke="${LID.stroke}" stroke-width="2" stroke-linejoin="round"/>`;
}

function block(cx, floor, color, size = 20) {
  return `<rect x="${n(cx - size / 2)}" y="${n(floor - size)}" width="${size}" height="${size}" rx="2" fill="${color}"/>`;
}

/** One camera view of the Cover Blocks table: blocks in `order`, the first `covered` of them under lids. */
function scene(r, x, y, w, h, order, covered, { lift = -1, scale = 1, frame = C.grid } = {}) {
  const floor = y + h - 12 * scale;
  let out = rect(r, x, y, w, h, { stroke: frame, width: 1.6 * Math.min(1, scale + 0.3), jitter: 1.2 * scale });
  out += line(r, x + 8 * scale, floor, x + w - 8 * scale, floor, { stroke: C.muted, width: 1.6, passes: 1 });
  order.forEach((color, k) => {
    const cx = x + (w * (k + 0.5)) / 3;
    out += k < covered ? lid(cx, floor, 46 * scale, 36 * scale) : block(cx, floor, BLOCK[color], 20 * scale);
    if (k === lift) out += line(r, cx, floor - 42 * scale, cx, y + 8, { stroke: BLOCK.R, width: 3.2, arrow: true, passes: 1 });
  });
  return out;
}

function frame(r, title, fill) {
  return rect(r, 0, 0, PANEL.w, PANEL.h, { fill, width: 2.6 }) + tag(r, title);
}

/** Horizontal bars on a 0 to 100 % scale, with the value printed after each bar. */
function bars(r, rows, { x, y, w, h = 22, gap = 12, labelX = x - 12, size = 19 }) {
  let out = '';
  rows.forEach((row, k) => {
    const top = y + k * (h + gap), len = (row.value / 100) * w;
    out += text(labelX, top + h - 4, row.label, { size, anchor: 'end', fill: C.muted });
    out += `<rect x="${x}" y="${n(top)}" width="${n(len)}" height="${h}" fill="${row.color}" fill-opacity=".85"/>` + rect(r, x, top, len, h, { stroke: row.color, width: 1.6, jitter: 1 });
    out += text(x + len + 8, top + h - 4, pct(row.value), { size, fill: row.color === S.mem || row.color === C.lavender ? row.color : C.ink, weight: 700 });
  });
  return out;
}

// ── Panels (local coordinates, 560 × 460) ─────────────────────────────────────────

export const ORDERS = { A: ['G', 'B', 'R'], B: ['R', 'G', 'B'] };

function panelProblem() {
  const r = random(11);
  let out = frame(r, '1 · same view, two pasts', C.panel.blue);
  out += text(147, 80, 'start', { font: HAND, size: 24, weight: 700, anchor: 'middle', fill: C.muted });
  out += text(389, 80, 'now', { font: HAND, size: 24, weight: 700, anchor: 'middle', fill: C.muted });
  for (const [key, top] of [['A', 94], ['B', 246]]) {
    const order = ORDERS[key];
    out += text(34, top + 60, key, { font: HAND, size: 32, weight: 700, anchor: 'middle', fill: C.muted });
    out += scene(r, 62, top, 170, 96, order, 0);
    out += line(r, 242, top + 52, 294, top + 52, { arrow: true, width: 2.4 });
    out += text(268, top + 40, 'lids on', { font: HAND, size: 19, weight: 700, anchor: 'middle', fill: C.muted });
    out += scene(r, 304, top, 170, 96, order, 3, { lift: order.indexOf('R') });
    out += text(514, top + 58, 'lift', { font: HAND, size: 24, weight: 700, anchor: 'middle', fill: BLOCK.R });
  }
  // The two current views are the same picture.
  out += line(r, 372, 212, 406, 212, { width: 3, passes: 1 }) + line(r, 372, 224, 406, 224, { width: 3, passes: 1 });
  out += text(418, 225, 'same view', { font: HAND, size: 21, weight: 700, fill: C.muted });
  out += text(268, 378, 'uncover red first: which lid?', { font: HAND, size: 24, weight: 700, anchor: 'middle' });
  out += text(268, 408, 'only the past can tell', { font: HAND, size: 24, weight: 700, anchor: 'middle', fill: BLOCK.R });
  out += text(24, 442, 'RMBench · Cover Blocks', { size: 19, fill: C.muted });
  return out;
}

// Episode drawn in panel 2: eight frames, with the lids going on in frames 4 to 6.
const FRAMES = { x: 132, y: 70, w: 44, h: 36, gap: 7, count: 8 };
const frameX = (k) => FRAMES.x + k * (FRAMES.w + FRAMES.gap);
const LANE_END = frameX(FRAMES.count - 1) + FRAMES.w;

function panelStreams() {
  const r = random(23);
  let out = frame(r, '2 · keep every stream', C.panel.green);
  const lanes = [['video', S.video, 94], ['actions', S.act, 150], ['joint states', S.state, 202]];
  for (const [label, color, y] of lanes) out += text(20, y, label, { font: HAND, size: 21, weight: 700, fill: color });
  for (let k = 0; k < FRAMES.count; k++) {
    out += scene(r, frameX(k), FRAMES.y, FRAMES.w, FRAMES.h, ORDERS.A, Math.max(0, Math.min(3, k - 2)), { scale: 0.32, frame: S.video });
  }
  const wave = (y, amp, freq, phase, jag) => Array.from({ length: 33 }, (_, k) => {
    const x = FRAMES.x + (k / 32) * (LANE_END - FRAMES.x);
    return [x, y + amp * Math.sin(k * freq + phase) + jag * Math.sin(k * 2.7 + 1)];
  });
  out += curve(wave(144, 11, 0.55, 0.4, 5), { stroke: S.act, width: 2.6 });
  out += curve(wave(196, 13, 0.32, 2.1, 0), { stroke: S.state, width: 2.6 });
  out += line(r, FRAMES.x, 236, LANE_END + 8, 236, { width: 2, arrow: true });
  out += text(FRAMES.x, 260, '0', { size: 21, anchor: 'middle', fill: C.muted }) + text(LANE_END, 262, 'now', { size: 20, anchor: 'middle', fill: C.muted });
  // What a last-frames memory would hold here: only the lids.
  const last = frameX(FRAMES.count - 2) - 5;
  out += rect(r, last, FRAMES.y - 6, LANE_END + 5 - last, FRAMES.h + 12, { stroke: C.ink, width: 2.2, jitter: 1, dash: '6 5' });
  out += text(LANE_END + 6, 44, 'last frames: only lids', { size: 19, anchor: 'end' }) + line(r, (last + LANE_END) / 2, 50, (last + LANE_END) / 2, FRAMES.y - 8, { width: 1.6, passes: 1 });
  // Imprint keeps the whole box.
  out += rect(r, FRAMES.x - 10, 54, LANE_END - FRAMES.x + 24, 170, { stroke: S.mem, width: 2.6, jitter: 1.6 });
  out += text(24, 306, 'others keep one of', { font: HAND, size: 22, weight: 700, fill: C.muted });
  ['last frames', 'keyframes', 'a text summary', 'video alone'].forEach((label, k) => {
    out += text(24, 340 + k * 29, `· ${label}`, { size: 20, fill: C.muted });
  });
  out += text(400, 324, 'Imprint keeps', { font: HAND, size: 27, weight: 700, anchor: 'middle', fill: S.mem });
  out += text(400, 356, 'all three', { font: HAND, size: 27, weight: 700, anchor: 'middle', fill: S.mem });
  out += text(400, 398, 'and learns', { font: HAND, size: 22, weight: 700, anchor: 'middle', fill: C.muted });
  out += text(400, 426, 'what matters', { font: HAND, size: 22, weight: 700, anchor: 'middle', fill: C.muted });
  return out;
}

function stateGrid(r, x, y, size) {
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${C.panel.gray}"/>`;
  for (let k = 1; k < 4; k++) {
    out += `<path d="M${n(x + (k * size) / 4)},${y} V${y + size} M${x},${n(y + (k * size) / 4)} H${x + size}" stroke="${C.grid}" stroke-width="1.2"/>`;
  }
  return out + rect(r, x, y, size, size, { width: 2.2, jitter: 1.2 });
}

function signals(x, y, count, step) {
  let out = '';
  for (let f = 0; f < count; f++) out += `<circle cx="${x + f * step}" cy="${y}" r="3.4" fill="${S.act}"/><circle cx="${x + f * step}" cy="${y + 11}" r="3.4" fill="${S.state}"/>`;
  return out;
}

function panelEncode() {
  const r = random(37);
  let out = frame(r, '3 · squeeze it as you go', C.panel.gray);
  out += text(24, 54, 'chunks of 4 frames, with their actions and joint states', { size: 17, fill: C.muted });
  // History arrives in chunks of four kept frames with their actions and joint states.
  const chunkX = (k) => 24 + k * 88, cw = 76;
  for (let k = 0; k < 4; k++) {
    const x = chunkX(k);
    out += rect(r, x, 66, cw, 54, { stroke: C.grid, width: 1.8, jitter: 1.2 });
    for (let f = 0; f < 4; f++) out += `<rect x="${x + 6 + f * 17}" y="72" width="13" height="20" fill="${S.video}" fill-opacity=".75"/>`;
    out += signals(x + 12, 101, 4, 17);
  }
  // The newest frames, before their chunk is complete, skip the state and go to the memory directly.
  out += rect(r, 384, 66, 152, 54, { stroke: S.video, width: 1.8, jitter: 1.2, dash: '5 5' });
  for (let f = 0; f < 3; f++) out += `<rect x="${400 + f * 22}" y="72" width="16" height="20" fill="${S.video}" fill-opacity=".75"/>`;
  out += signals(408, 101, 3, 22);
  out += text(460, 140, 'newest', { size: 18, anchor: 'middle', fill: C.muted });
  // A frozen video model first turns each chunk's frames into a few tokens.
  out += rect(r, 24, 140, 352, 30, { stroke: S.video, width: 1.8, jitter: 1, fill: C.bg }) + snowflake(42, 155, 9, C.ink);
  out += text(58, 161, 'frozen video model: 4 frames → 12 tokens', { size: 16, fill: C.ink });
  // A fixed-size recurrent state takes one update per chunk.
  const gy = 196, gs = 44;
  for (let k = 0; k < 4; k++) {
    const cx = chunkX(k) + cw / 2;
    out += line(r, cx, 122, cx, 138, { width: 1.8, passes: 1 }) + line(r, cx, 172, cx, gy - 4, { arrow: true, width: 2, size: 9 });
    out += stateGrid(r, cx - gs / 2, gy, gs);
    if (k < 3) out += line(r, cx + gs / 2 + 4, gy + gs / 2, chunkX(k + 1) + cw / 2 - gs / 2 - 4, gy + gs / 2, { arrow: true, width: 2.2, size: 9 });
  }
  const lastX = chunkX(3) + cw / 2;
  out += text(lastX + gs / 2 + 12, gy + 18, 'running state', { font: HAND, size: 21, weight: 700 });
  out += text(lastX + gs / 2 + 12, gy + 42, 'same size', { size: 18, fill: C.muted });
  // Learned queries, guided by the task, read the state and the newest frames into the memory.
  const mx = 150, my = 300, cols = 16, rows = 4, size = 12;
  const memRight = mx + cols * (size + 3);
  out += curve([[lastX, gy + gs + 6], [lastX - 12, my - 30], [memRight - 70, my - 8]], { arrow: true, width: 2.2 });
  out += curve([[520, 148], [530, 240], [memRight - 10, my - 8]], { arrow: true, width: 2.2, stroke: S.video });
  out += tokens(r, mx, my, cols, rows, size, S.mem);
  out += rect(r, mx - 6, my - 6, cols * (size + 3) + 9, rows * (size + 3) + 9, { stroke: S.mem, width: 2.2, jitter: 1.4 });
  out += text(mx - 66, my + 36, 'task', { font: HAND, size: 22, weight: 700, anchor: 'middle' }) + line(r, mx - 40, my + 29, mx - 12, my + 29, { arrow: true, width: 2, size: 10 });
  out += text(memRight + 16, my + 22, 'memory', { font: HAND, size: 24, weight: 700, fill: S.mem }) + math(memRight + 108, my + 22, ['m', ['t', 'sub']], { size: 27, fill: S.mem });
  out += text(memRight + 16, my + 48, '256 tokens', { size: 18, fill: C.muted });
  out += text(280, 420, 'one update per chunk:', { font: HAND, size: 23, weight: 700, anchor: 'middle' });
  out += text(280, 448, 'the memory never grows', { font: HAND, size: 23, weight: 700, anchor: 'middle', fill: S.mem });
  return out;
}

function panelPretrain() {
  const r = random(41);
  let out = frame(r, '4 · stage 1: rebuild the past', C.panel.red);
  // A decoder that sees only the memory.
  out += tokens(r, 24, 62, 10, 3, 10, S.mem) + math(160, 92, ['m', ['t', 'sub']], { size: 27, fill: S.mem });
  out += line(r, 196, 82, 222, 82, { arrow: true, width: 2.2, size: 9 });
  out += `<path d="M228,74 L268,58 L268,108 L228,92 Z" fill="${C.panel.gray}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  out += text(282, 80, 'decoder', { font: HAND, size: 21, weight: 700 }) + text(282, 102, 'sees only the memory', { size: 17, fill: C.muted });
  // ...must rebuild the recording at random past steps, and say how far along the task is.
  const t0 = 170, t1 = 536, ty = 148, cols = [250, 350, 450];
  out += line(r, t0, ty, t1, ty, { width: 2, passes: 1 });
  out += text(t0, ty - 10, '0', { size: 18, anchor: 'middle', fill: C.muted }) + text(t1, ty - 10, 'now', { size: 18, anchor: 'end', fill: C.muted });
  out += text(350, ty - 10, 'random past steps', { size: 17, anchor: 'middle', fill: S.prog });
  const rows = [['image features', S.video, 184], ['action', S.act, 214], ['joint state', S.state, 244], ['progress', S.prog, 282]];
  for (const [label, color, y] of rows) out += text(24, y, label, { size: 19, fill: color, weight: 700 });
  cols.forEach((cx, k) => {
    out += `<circle cx="${cx}" cy="${ty}" r="6" fill="${S.prog}"/>`;
    out += `<path d="M${cx},${ty + 8} V${ty + 104}" stroke="${C.grid}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out += `<rect x="${cx - 17 + j * 12}" y="${164 + i * 9}" width="10" height="7" fill="${S.video}" fill-opacity="${0.45 + 0.18 * ((i + j + k) % 3)}"/>`;
    out += curve([[cx - 18, 214], [cx - 4, 202], [cx + 8, 212], [cx + 20, 202]], { stroke: S.act, width: 2.4, arrow: true });
    out += `<path d="M${cx - 16},${246} L${cx - 2},${230} L${cx + 16},${238}" fill="none" stroke="${S.state}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cx - 2}" cy="230" r="3.6" fill="${S.state}"/>`;
  });
  const [bx, by, bw] = [t0, 270, t1 - t0], now = 0.62;
  out += `<rect x="${bx}" y="${by}" width="${n(bw * now)}" height="14" fill="${S.prog}" fill-opacity=".8"/>` + rect(r, bx, by, bw, 14, { width: 1.8, jitter: 1 });
  out += text(bx - 8, by + 13, '0', { size: 17, anchor: 'end', fill: C.muted }) + text(bx + bw + 6, by + 13, '1', { size: 17, fill: C.muted });
  out += text(24, 318, 'no policy, no labels: the recording is the target', { font: HAND, size: 20, weight: 700, fill: C.muted });
  // Cover Blocks: a linear probe reads the color order out of the memory.
  out += text(24, 350, 'color order read from', { size: 19 }) + math(214, 350, ['m', ['t', 'sub']], { size: 22, fill: S.mem }) + text(244, 350, '· Cover Blocks', { size: 19, fill: C.muted });
  out += text(24, 372, 'linear probe · full-attention encoder', { size: 17, fill: C.muted });
  const [px, pw, py] = [178, 300, 382];
  out += bars(r, PROBE, { x: px, y: py, w: pw, h: 20, gap: 8, labelX: px - 10, size: 18 });
  const cx = px + (CHANCE / 100) * pw;
  out += `<path d="M${n(cx)},${py - 6} V${py + 52}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="4 4"/>` + text(cx, py + 68, `chance ${pct(CHANCE)}`, { size: 17, anchor: 'middle', fill: C.muted });
  return out;
}

function panelAdapt() {
  const r = random(53);
  let out = frame(r, '5 · stage 2: plug it into the VLA', C.panel.yellow);
  // The VLA: camera view and task in, actions out.
  out += scene(r, 34, 54, 92, 48, ORDERS.A, 3, { scale: 0.42 });
  out += text(80, 122, 'camera', { size: 17, anchor: 'middle', fill: C.muted });
  out += text(180, 86, 'task', { font: HAND, size: 22, weight: 700, anchor: 'middle' });
  out += line(r, 80, 128, 100, 140, { arrow: true, width: 2, size: 9 }) + line(r, 176, 94, 152, 140, { arrow: true, width: 2, size: 9 });
  out += rect(r, 34, 144, 186, 36, { fill: C.bg, width: 2.4 }) + text(127, 170, 'VLM', { font: HAND, size: 23, weight: 700, anchor: 'middle' });
  out += line(r, 127, 182, 127, 194, { arrow: true, width: 2, size: 8 });
  out += rect(r, 34, 198, 186, 92, { fill: C.bg, width: 2.4 }) + text(127, 220, 'action expert', { font: HAND, size: 21, weight: 700, anchor: 'middle' });
  const layers = [230, 250, 270];
  for (const y of layers) out += `<rect x="48" y="${y}" width="158" height="12" fill="${C.panel.blue}" stroke="${C.muted}" stroke-width="1.4"/>`;
  out += curve([[127, 292], [127, 304], [146, 310], [164, 302], [182, 312]], { width: 2.4, arrow: true });
  out += text(190, 318, 'actions', { font: HAND, size: 21, weight: 700 });
  // Stage 1 hands over the encoder; its decoder is thrown away.
  out += rect(r, 300, 56, 124, 40, { fill: C.bg, width: 2.2 }) + text(362, 83, 'encoder', { font: HAND, size: 22, weight: 700, anchor: 'middle' });
  out += text(362, 114, 'from stage 1', { size: 17, anchor: 'middle', fill: C.muted });
  out += `<path d="M452,68 L490,56 L490,102 L452,90 Z" fill="${C.panel.gray}" stroke="${C.muted}" stroke-width="2" stroke-linejoin="round"/>` + line(r, 444, 104, 500, 54, { stroke: C.red, width: 2.6 });
  out += text(472, 124, 'decoder', { size: 17, anchor: 'middle', fill: C.muted }) + text(472, 142, 'dropped', { size: 17, anchor: 'middle', fill: C.muted });
  out += line(r, 362, 120, 362, 150, { arrow: true, width: 2.2, size: 9 });
  out += tokens(r, 318, 156, 8, 5, 10, S.mem);
  out += text(428, 178, 'memory', { font: HAND, size: 21, weight: 700, fill: S.mem }) + math(428, 204, ['m', ['t', 'sub']], { size: 25, fill: S.mem });
  // Every action-expert layer reads the memory: cross-attention, then a FiLM scale and shift.
  for (const y of layers) out += line(r, 314, 190, 212, y + 6, { stroke: S.mem, width: 2.2, arrow: true, size: 10, passes: 1 });
  out += text(318, 244, 'every layer reads it', { size: 17, fill: C.muted });
  out += text(318, 274, 'train encoder + policy', { font: HAND, size: 20, weight: 700, fill: S.prog });
  out += text(318, 298, 'together on the action loss', { font: HAND, size: 20, weight: 700, fill: S.prog });
  // RMBench success for the three training recipes (full-attention encoder), after π0.5 with no memory.
  out += text(24, 344, 'RMBench success · full-attention encoder', { size: 17, fill: C.muted });
  out += bars(r, RECIPE, { x: 196, y: 356, w: 280, h: 16, gap: 7, labelX: 186, size: 17 });
  return out;
}

// Panel 6 plot: success against latency, latency on a log axis.
export const PLOT = { x: 104, y: 70, w: 400, h: 186, ms: [80, 1100], success: [0, 80] };
export const plotX = (ms) => PLOT.x + ((Math.log10(ms) - Math.log10(PLOT.ms[0])) / (Math.log10(PLOT.ms[1]) - Math.log10(PLOT.ms[0]))) * PLOT.w;
export const plotY = (success) => PLOT.y + PLOT.h - ((success - PLOT.success[0]) / (PLOT.success[1] - PLOT.success[0])) * PLOT.h;

function panelResult() {
  const r = random(67);
  let out = frame(r, '6 · better, and still fast', C.panel.gray);
  const { x, y, w, h } = PLOT;
  for (const s of [40, 80]) out += `<path d="M${x},${n(plotY(s))} H${x + w}" stroke="${C.grid}" stroke-width="1.2" stroke-dasharray="2 5"/>`;
  out += line(r, x, y - 8, x, y + h, { width: 2 }) + line(r, x, y + h, x + w + 8, y + h, { width: 2 });
  for (const s of [0, 40, 80]) out += text(x - 10, plotY(s) + 7, String(s), { size: 19, anchor: 'end', fill: C.muted });
  for (const ms of [100, 300, 1000]) out += text(plotX(ms), y + h + 23, String(ms), { size: 19, anchor: 'middle', fill: C.muted });
  out += text(x + w / 2, y + h + 47, '← faster · ms per 50-step action chunk, log scale', { size: 17, anchor: 'middle', fill: C.muted });
  out += text(48, y + h / 2, 'success % →', { size: 18, anchor: 'middle', fill: C.muted, extra: ` transform="rotate(-90 48 ${y + h / 2})"` });
  const place = { 'π0.5 alone': [10, 26, 'start'], HAMLET: [12, -12, 'start'], MemoryVLA: [0, -16, 'middle'], EventVLA: [-12, 26, 'end'], Imprint: [20, 6, 'start'] };
  for (const p of SCATTER) {
    const [px, py] = [plotX(p.ms), plotY(p.success)], [dx, dy, anchor] = place[p.name];
    if (p.kind === 'imprint') {
      out += star(px, py, 15, S.mem);
      out += text(px + dx, py + dy, p.name, { font: HAND, size: 26, weight: 700, fill: S.mem, anchor });
      out += text(px + dx, py + dy + 24, `${pct(p.success)} · ${p.ms} ms`, { size: 17, fill: S.mem, anchor });
      continue;
    }
    out += `<circle cx="${n(px)}" cy="${n(py)}" r="7" fill="${p.kind === 'base' ? 'none' : C.muted}" stroke="${C.muted}" stroke-width="2.2"/>`;
    out += text(px + dx, py + dy, `${p.name}${p.priorSuccess ? '†' : ''}${p.priorLatency ? '*' : ''}`, { size: 18, anchor, fill: C.ink });
  }
  out += text(x + w, y + h + 72, '† success from prior work, other backbone', { size: 17, anchor: 'end', fill: C.muted });
  out += text(x + w, y + h + 92, '* latency from prior work', { size: 17, anchor: 'end', fill: C.muted });
  // The same jump on a real robot and in a second simulator.
  const [bx, bw, top0] = [190, 250, 388];
  out += text(24, top0 - 12, 'gray: no memory · orange: with Imprint', { size: 17, fill: C.muted });
  TRANSFER.forEach((row, k) => {
    const top = top0 + k * 34;
    out += text(bx - 12, top + 18, row.label, { size: 18, anchor: 'end', fill: C.muted });
    out += `<rect x="${bx}" y="${top}" width="${n((row.base / 100) * bw)}" height="9" fill="${C.muted}"/>`;
    out += `<rect x="${bx}" y="${top + 11}" width="${n((row.imprint / 100) * bw)}" height="12" fill="${S.mem}"/>`;
    out += text(bx + (row.imprint / 100) * bw + 8, top + 21, `${pct(row.base)} → ${pct(row.imprint)}`, { size: 18, fill: C.ink, weight: 700 });
  });
  return out;
}

export const PANELS = [panelProblem, panelStreams, panelEncode, panelPretrain, panelAdapt, panelResult];

// ── Layouts ──────────────────────────────────────────────────────────────────────

export const LAYOUTS = {
  wide: {
    width: 1860, height: 1180,
    panels: [[40, 80], [650, 80], [1260, 80], [40, 696], [650, 696], [1260, 696]],
    overlay(r) {
      let out = tag(r, 'the memory · every stream, a fixed size', { x: 40, y: 10, size: 28 });
      for (const [x, y] of [[600, 310], [1210, 310], [600, 926], [1210, 926]]) out += line(r, x + 6, y, x + 44, y, { width: 2.6, arrow: true });
      out += `<path d="M40,596 H1820" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'the training, then the result', { x: 40, y: 610, size: 28 });
      out += curve([[1540, 546], [1420, 600], [1000, 606], [620, 620], [500, 688]], { stroke: S.mem, width: 3, arrow: true });
      out += math(1060, 584, ['m', ['t', 'sub']], { size: 32, fill: S.mem, anchor: 'end' });
      return out;
    },
  },
  // Two columns for mid-size screens, where the wide drawing would shrink its labels below 10 px.
  mid: {
    width: 1250, height: 1790,
    panels: [[40, 80], [650, 80], [40, 690], [650, 690], [40, 1300], [650, 1300]],
    overlay(r) {
      let out = tag(r, 'the memory · every stream, a fixed size', { x: 40, y: 10, size: 28 });
      out += line(r, 606, 310, 644, 310, { width: 2.6, arrow: true }) + line(r, 606, 1530, 644, 1530, { width: 2.6, arrow: true });
      out += curve([[930, 548], [800, 574], [600, 586], [560, 610], [480, 678]], { width: 2.6, arrow: true });
      out += tag(r, 'the training, then the result', { x: 650, y: 610, size: 28 });
      out += line(r, 606, 920, 644, 920, { stroke: S.mem, width: 3, arrow: true }) + math(625, 900, ['m', ['t', 'sub']], { size: 30, fill: S.mem, anchor: 'middle' });
      out += curve([[930, 1158], [800, 1184], [600, 1196], [560, 1220], [480, 1288]], { width: 2.6, arrow: true });
      return out;
    },
  },
  tall: {
    width: 584, height: 3310,
    panels: [[12, 80], [12, 600], [12, 1120], [12, 1770], [12, 2290], [12, 2810]],
    overlay(r) {
      let out = tag(r, 'the memory', { x: 12, y: 10, size: 28 });
      for (const y of [540, 1060, 2230, 2750]) out += line(r, 452, y + 6, 452, y + 54, { width: 2.6, arrow: true });
      out += `<path d="M12,1660 H572" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'the training, then the result', { x: 12, y: 1682, size: 28 });
      out += line(r, 452, 1586, 452, 1764, { stroke: S.mem, width: 3, arrow: true });
      out += math(434, 1632, ['m', ['t', 'sub']], { size: 32, fill: S.mem, anchor: 'end' });
      return out;
    },
  },
};

const TITLE = 'Imprint: a robot memory that keeps every stream and learns what matters';
const DESC = [
  'Panel 1, the problem: in the RMBench Cover Blocks task, red, green and blue blocks sit in a random order and the robot covers them with three identical lids, then must uncover red first. Two episodes, A and B, that started in different orders end with the same camera view, yet the lid to lift differs, so only the past can tell.',
  'Panel 2: the history has three streams, camera video, the actions sent and the joint states. Other memory methods keep one of the last frames, keyframes, a text summary, or the video alone; the last frames here show only lids. Imprint keeps all three streams and learns what matters.',
  'Panel 3: the history arrives in chunks of four frames with their actions and joint states. A frozen video model turns each chunk of four frames into 12 tokens. Each chunk updates a fixed-size running state once (the recurrent encoder; a full-attention variant also exists), and learned queries guided by the task read that state plus the newest frames into the memory m_t, 256 tokens. The memory never grows.',
  `Panel 4, stage 1: with no policy and no human labels, a decoder that sees only m_t must rebuild image features, actions and joint states at random past steps, and estimate progress t/(T-1) through the demonstration. On Cover Blocks training demonstrations, a linear probe reads the color order from the memory of the full-attention encoder at ${pct(PROBE[1].value)} balanced accuracy after stage 1, against ${pct(PROBE[0].value)} for a memory trained on the action loss alone; chance is ${pct(CHANCE)}.`,
  `Panel 5, stage 2: the decoder is dropped and the stage 1 encoder is plugged into the vision-language-action model. Every layer of its action expert reads m_t through cross-attention and a FiLM scale and shift, and encoder and policy train together on the action loss. RMBench success with the full-attention encoder: ${RECIPE.map((row) => `${pct(row.value)} for ${row.label}`).join(', ')}.`,
  `Panel 6, the result on RMBench, success against latency per 50-step action chunk, log scale: ${SCATTER.map((p) => `${p.name} ${pct(p.success)} at ${p.ms} ms`).join(', ')}. Latency is measured on an L40S GPU except for EventVLA, whose latency is reported by its authors for its anchors-only variant; the EventVLA and MemoryVLA success rates come from prior work on other backbones. ${TRANSFER.map((row) => `${row.label}: ${pct(row.base)} without memory, ${pct(row.imprint)} with Imprint`).join('; ')}.`,
].join(' ');

export function svg(name) {
  const layout = LAYOUTS[name], r = random({ wide: 3, mid: 4, tall: 5 }[name]);
  const panels = PANELS.map((draw, k) => `<g transform="translate(${layout.panels[k][0]} ${layout.panels[k][1]})">${draw()}</g>`).join('');
  return `<svg class="im-${name}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="im-${name}-title im-${name}-desc" xmlns="http://www.w3.org/2000/svg">` +
    `<title id="im-${name}-title">${esc(TITLE)}</title><desc id="im-${name}-desc">${esc(DESC)}</desc>` +
    `<rect width="${layout.width}" height="${layout.height}" fill="${C.bg}"/>${panels}${layout.overlay(r)}</svg>`;
}

// ── Prose around the canvas ──────────────────────────────────────────────────────

export const INTRO = String.raw`In the Cover Blocks task, red, green and blue blocks sit in a random order. The robot covers them with three lids, then must uncover them in red, green, blue order. Once they're covered, every order looks the same, so how does the policy know which to open first? It has to remember. Most memory methods pick what to keep, but Imprint compresses the video, actions and joint states into a fixed set of 256 memory tokens, updated as the episode runs. With Imprint, π0.5 goes from 25.4% to 72.8% success on RMBench's nine memory tasks, the best among memory methods compared.`;
export const MATH_BEFORE = String.raw`Stage 1 needs no policy and no human labels, since the recording itself is the target. The encoder packs the history and instruction into the memory $m_t$, 256 tokens of width 1024, and a decoder that sees only $m_t$ must rebuild the past by minimizing `;
// Eq. 4.4 of the paper. The narrow version breaks the same sum over three lines for phones.
export const EQUATION = String.raw`\mathcal{L}_{\text{mem}} = \frac{1}{K}\sum_{k}\Big[\lambda_v\big\|\hat z^{v}_{k}-z^{v}_{k}\big\|^{2}+\lambda_a\big\|\hat a_{k}-a_{k}\big\|^{2}+\lambda_q\big\|\hat q_{k}-q_{k}\big\|^{2}\Big]+\lambda_\rho\big(\hat\rho_t-\rho_t\big)^{2}`;
export const EQUATION_NARROW = String.raw`\begin{aligned}\mathcal{L}_{\text{mem}} = {}&\frac{1}{K}\sum_{k}\Big[\lambda_v\big\|\hat z^{v}_{k}-z^{v}_{k}\big\|^{2}\\&+\lambda_a\big\|\hat a_{k}-a_{k}\big\|^{2}+\lambda_q\big\|\hat q_{k}-q_{k}\big\|^{2}\Big]\\&+\lambda_\rho\big(\hat\rho_t-\rho_t\big)^{2}\end{aligned}`;
export const MATH_AFTER = String.raw` Here $k$ runs over $K$ random past steps, up to 16. Hats mark the decoder's predictions of the visual features $z^v_k$ (v for visual) from DINOv3, a frozen pretrained image model; the recorded action $a_k$ and joint state $q_k$; and progress $\rho_t = t/(T-1)$ in a $T$-step demonstration. Each squared error is averaged over its entries, then weighted: $\lambda_v=1$ and $\lambda_a=\lambda_q=\lambda_\rho=0.5$. Stage 2 drops the decoder and fine-tunes the encoder and policy $\pi_\theta$ together on $-\log \pi_\theta(\mathbf{a}_t \mid o_t, \ell, m_t)$, for action chunk $\mathbf{a}_t$, observation $o_t$ and instruction $\ell$. In practice, that's π0.5's flow-matching loss.`;

const tex = (source, displayMode = false) => katex.renderToString(source, { displayMode, throwOnError: true, output: 'htmlAndMathml' });

/** Escape prose and prerender each $...$ span with KaTeX, so the page needs no script.
 * Punctuation right after a formula ("$m_t$,") stays on its line, because browsers may break beside an inline block. */
export function prose(source) {
  return source.split(/(\$[^$]+\$[^\s$]*)/).map((part) => {
    if (!part.startsWith('$')) return esc(part);
    const end = part.lastIndexOf('$'), suffix = part.slice(end + 1), formula = tex(part.slice(1, end));
    return suffix ? `<span class="im-nobr">${formula}${esc(suffix)}</span>` : formula;
  }).join('');
}

export function render() {
  return `<!-- Generated by scripts/imprint-canvas.mjs from scripts/imprint-figures.json. -->
<p class="im-intro">${esc(INTRO)}</p>
<figure class="im-canvas">${svg('wide')}${svg('mid')}${svg('tall')}</figure>
<p class="im-math">${prose(MATH_BEFORE)}<span class="im-eq im-eq-wide">${tex(EQUATION, true)}</span><span class="im-eq im-eq-narrow">${tex(EQUATION_NARROW, true)}</span>${prose(MATH_AFTER)}</p>
<div class="im-after"><p class="im-credit">Wu, Shah, Huang, Sontakke, Bharadhwaj, Bajcsy, Simchowitz, Shi · Amazon FAR, CMU, UT Austin, JHU · arXiv · 9 Oct 2026</p><nav class="im-sources" aria-label="Original sources"><a href="https://arxiv.org/abs/2610.14406">Paper ↗</a><a href="https://yilin-wu98.github.io/imprint_website/">Project ↗</a><a href="https://github.com/amazon-far/imprint">Code ↗</a></nav></div>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  fs.writeFileSync(OUTPUT, render());
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
}
