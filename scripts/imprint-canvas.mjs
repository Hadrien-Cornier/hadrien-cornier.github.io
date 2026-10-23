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
export const SCATTER = [
  { name: 'π0.5 alone', ms: DATA.latency.ms.pi05, success: avg(RM['\\pi_{0.5} (no memory)']), kind: 'base' },
  { name: 'HAMLET', ms: DATA.latency.ms.hamlet, success: avg(RM.HAMLET), kind: 'memory' },
  { name: 'MemoryVLA', ms: DATA.latency.ms.memoryvla, success: avg(RM['MemoryVLA†']), kind: 'memory' },
  { name: 'EventVLA', ms: DATA.latency.ms.eventvla, success: avg(RM['EventVLA†']), kind: 'memory', reported: true },
  { name: 'Imprint', ms: DATA.latency.ms.imprint_recurrent, success: avg(RM['IMPRINT (recurrent)']), kind: 'imprint' },
];
const recipe = DATA.recipe.rows.Average;
export const RECIPE = [
  { label: 'action loss only', value: recipe[0], color: C.muted },
  { label: 'stage 1, frozen', value: recipe[1], color: C.lavender },
  { label: 'stage 1 + stage 2', value: recipe[2], color: S.mem },
];
const probe = DATA.probe.rows;
export const PROBE = [
  { label: 'action loss only', value: probe.E2E[0], color: C.muted },
  { label: 'after stage 1', value: probe.Frozen[0], color: S.mem },
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
    out += text(labelX, top + h - 5, row.label, { size, anchor: 'end', fill: C.muted });
    out += `<rect x="${x}" y="${n(top)}" width="${n(len)}" height="${h}" fill="${row.color}" fill-opacity=".85"/>` + rect(r, x, top, len, h, { stroke: row.color, width: 1.6, jitter: 1 });
    out += text(x + len + 8, top + h - 5, pct(row.value), { size, fill: row.color === C.muted ? C.ink : row.color, weight: 700 });
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
  for (const [key, top, label] of [['A', 94, ['H', ['t', 'sub']]], ['B', 246, ['H′', ['t', 'sub']]]]) {
    const order = ORDERS[key];
    out += math(34, top + 56, label, { size: 27, anchor: 'middle' });
    out += scene(r, 62, top, 170, 96, order, 0);
    out += line(r, 242, top + 52, 294, top + 52, { arrow: true, width: 2.4 });
    out += text(268, top + 40, 'cover', { font: HAND, size: 18, anchor: 'middle', fill: C.muted });
    out += scene(r, 304, top, 170, 96, order, 3, { lift: order.indexOf('R') });
    out += math(512, top + 58, key === 'A' ? ['a', ['t', 'sub']] : ['a′', ['t', 'sub']], { size: 27, anchor: 'middle', fill: BLOCK.R });
  }
  // The two current views are the same picture.
  out += line(r, 372, 212, 406, 212, { width: 3, passes: 1 }) + line(r, 372, 224, 406, 224, { width: 3, passes: 1 });
  out += text(418, 225, 'same view', { font: HAND, size: 20, weight: 700, fill: C.muted });
  out += text(268, 372, 'uncover red first:', { font: HAND, size: 22, weight: 700, anchor: 'middle' });
  out += text(268, 400, 'the right lid depends on the past', { font: HAND, size: 22, weight: 700, anchor: 'middle' });
  out += text(24, 440, 'RMBench · Cover Blocks', { size: 19, fill: C.muted });
  return out;
}

// Episode drawn in panel 2: eight frames, with the lids going on in frames 4 to 6.
const FRAMES = { x: 108, y: 70, w: 46, h: 36, gap: 7, count: 8 };
const frameX = (k) => FRAMES.x + k * (FRAMES.w + FRAMES.gap);
const LANE_END = frameX(FRAMES.count - 1) + FRAMES.w;

function panelStreams() {
  const r = random(23);
  let out = frame(r, '2 · keep every stream', C.panel.green);
  const lanes = [['video', S.video, 94], ['actions', S.act, 150], ['joints', S.state, 202]];
  for (const [label, color, y] of lanes) out += text(24, y, label, { font: HAND, size: 22, weight: 700, fill: color });
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
  out += text(FRAMES.x, 260, '0', { size: 21, anchor: 'middle', fill: C.muted }) + math(LANE_END, 262, ['t'], { size: 23, anchor: 'middle', fill: C.muted });
  // What a last-frames memory would hold here: only the lids.
  const last = frameX(FRAMES.count - 2) - 5;
  out += rect(r, last, FRAMES.y - 6, LANE_END + 5 - last, FRAMES.h + 12, { stroke: C.muted, width: 2, jitter: 1, dash: '6 5' });
  out += text((last + LANE_END) / 2, 44, 'last frames', { size: 18, anchor: 'middle', fill: C.muted }) + line(r, (last + LANE_END) / 2, 49, (last + LANE_END) / 2, FRAMES.y - 8, { stroke: C.muted, width: 1.6, passes: 1 });
  // Imprint keeps the whole box.
  out += rect(r, FRAMES.x - 10, 54, LANE_END - FRAMES.x + 24, 170, { stroke: S.mem, width: 2.6, jitter: 1.6 });
  out += text(24, 306, 'others keep', { font: HAND, size: 22, weight: 700, fill: C.muted });
  const struck = (y, label) => text(24, y, label, { size: 21 }) + line(r, 20, y - 7, 28 + label.length * 10.4, y - 7, { stroke: C.red, width: 2.4 });
  out += struck(338, 'last frames') + struck(368, 'keyframes') + struck(398, 'a text summary') + struck(428, 'vision alone');
  out += text(400, 318, 'Imprint keeps', { font: HAND, size: 26, weight: 700, anchor: 'middle', fill: S.mem });
  out += text(400, 350, 'all three', { font: HAND, size: 26, weight: 700, anchor: 'middle', fill: S.mem });
  out += text(400, 392, 'and learns', { font: HAND, size: 22, weight: 700, anchor: 'middle', fill: C.muted });
  out += text(400, 420, 'what matters', { font: HAND, size: 22, weight: 700, anchor: 'middle', fill: C.muted });
  return out;
}

function stateGrid(r, x, y, size) {
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${C.panel.gray}"/>`;
  for (let k = 1; k < 4; k++) {
    out += `<path d="M${n(x + (k * size) / 4)},${y} V${y + size} M${x},${n(y + (k * size) / 4)} H${x + size}" stroke="${C.grid}" stroke-width="1.2"/>`;
  }
  return out + rect(r, x, y, size, size, { width: 2.2, jitter: 1.2 });
}

function panelEncode() {
  const r = random(37);
  let out = frame(r, '3 · squeeze it as you go', C.panel.gray);
  // History arrives in chunks of four kept frames with their actions and joint states.
  const chunkX = (k) => 28 + k * 90, cw = 76;
  for (let k = 0; k < 4; k++) {
    const x = chunkX(k);
    out += rect(r, x, 66, cw, 54, { stroke: C.grid, width: 1.8, jitter: 1.2 });
    for (let f = 0; f < 4; f++) {
      out += `<rect x="${x + 6 + f * 17}" y="72" width="13" height="20" fill="${S.video}" fill-opacity=".75"/>`;
      out += `<circle cx="${x + 12 + f * 17}" cy="101" r="3.4" fill="${S.act}"/><circle cx="${x + 12 + f * 17}" cy="112" r="3.4" fill="${S.state}"/>`;
    }
  }
  out += rect(r, 392, 66, 140, 54, { stroke: S.video, width: 1.8, jitter: 1.2, dash: '5 5' });
  for (let f = 0; f < 3; f++) out += `<rect x="${404 + f * 22}" y="76" width="16" height="22" fill="${S.video}" fill-opacity=".75"/>`;
  out += text(462, 115, 'recent', { size: 18, anchor: 'middle', fill: C.muted });
  out += line(r, 28, 134, 532, 134, { stroke: C.muted, width: 1.8, arrow: true, size: 10 });
  out += text(28, 54, 'chunks: 4 frames with their actions and joints', { size: 18, fill: C.muted });
  // A fixed-size recurrent state takes one update per chunk.
  const gy = 182, gs = 46;
  for (let k = 0; k < 4; k++) {
    const cx = chunkX(k) + cw / 2;
    out += line(r, cx, 140, cx, gy - 6, { arrow: true, width: 2, size: 10 });
    out += stateGrid(r, cx - gs / 2, gy, gs);
    if (k < 3) out += line(r, cx + gs / 2 + 4, gy + gs / 2, chunkX(k + 1) + cw / 2 - gs / 2 - 4, gy + gs / 2, { arrow: true, width: 2.2, size: 10 });
  }
  out += math(chunkX(3) + cw / 2 + gs / 2 + 10, gy + gs / 2 + 9, ['h', ['t', 'sub']], { size: 26 });
  out += text(chunkX(0) + cw / 2 - gs / 2, gy + gs + 24, 'same size every step', { size: 18, fill: C.muted });
  // Learned queries, guided by the instruction, read the state and the recent frames into the memory.
  const mx = 150, my = 296, cols = 16, rows = 4, size = 12;
  const memRight = mx + cols * (size + 3);
  out += curve([[chunkX(3) + cw / 2, gy + gs + 6], [chunkX(3) + cw / 2 - 14, my - 30], [memRight - 60, my - 8]], { arrow: true, width: 2.2 });
  out += curve([[462, 124], [478, 230], [memRight - 10, my - 6]], { arrow: true, width: 2.2, stroke: S.video });
  out += tokens(r, mx, my, cols, rows, size, S.mem);
  out += rect(r, mx - 6, my - 6, cols * (size + 3) + 9, rows * (size + 3) + 9, { stroke: S.mem, width: 2.2, jitter: 1.4 });
  out += math(mx - 52, my + 40, ['ℓ'], { size: 30, anchor: 'middle' }) + line(r, mx - 38, my + 31, mx - 12, my + 31, { arrow: true, width: 2, size: 10 });
  out += math(memRight + 16, my + 28, ['m', ['t', 'sub']], { size: 30, fill: S.mem });
  out += text(memRight + 16, my + 54, '256 tokens', { size: 18, fill: C.muted });
  out += math(280, 432, ['(m', ['t', 'sub'], ', h', ['t', 'sub'], ') = E', ['φ', 'sub'], '(e', ['t', 'sub'], ' ; h', ['t−1', 'sub'], ', ℓ)'], { size: 27, anchor: 'middle' });
  return out;
}

function panelPretrain() {
  const r = random(41);
  let out = frame(r, '4 · stage 1: rebuild the past', C.panel.red);
  out += math(72, 92, ['m', ['t', 'sub']], { size: 28, anchor: 'middle', fill: S.mem });
  out += tokens(r, 32, 104, 6, 8, 10, S.mem);
  out += line(r, 112, 150, 138, 150, { arrow: true, width: 2.2, size: 10 });
  out += `<path d="M142,128 L190,106 L190,194 L142,172 Z" fill="${C.panel.gray}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
  out += text(166, 222, 'decoder', { size: 18, anchor: 'middle', fill: C.muted });
  // The past steps it must rebuild, sampled at random before now.
  const t0 = 232, t1 = 530, ty = 70, cols = [282, 372, 462];
  out += line(r, t0, ty, t1, ty, { width: 2, passes: 1 });
  out += text(t0, ty - 10, '0', { size: 18, anchor: 'middle', fill: C.muted }) + math(t1, ty - 10, ['t'], { size: 21, anchor: 'middle', fill: C.muted });
  out += math(t0 + 2, ty + 128, ['ẑ'], { size: 25, fill: S.video, anchor: 'middle' }) + math(t0 + 2, ty + 160, ['â'], { size: 25, fill: S.act, anchor: 'middle' }) + math(t0 + 2, ty + 190, ['q̂'], { size: 25, fill: S.state, anchor: 'middle' });
  out += line(r, 194, 150, t0 - 16, 150, { arrow: true, width: 2.2, size: 10 });
  cols.forEach((cx, k) => {
    out += `<circle cx="${cx}" cy="${ty}" r="6" fill="${S.prog}"/>` + math(cx, ty - 12, ['k', [String(k + 1), 'sub']], { size: 20, anchor: 'middle', fill: S.prog });
    out += `<path d="M${cx},${ty + 8} V${ty + 92}" stroke="${C.grid}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out += `<rect x="${cx - 17 + j * 12}" y="${ty + 100 + i * 9}" width="10" height="7" fill="${S.video}" fill-opacity="${0.45 + 0.18 * ((i + j + k) % 3)}"/>`;
    out += curve([[cx - 18, ty + 158], [cx - 4, ty + 146], [cx + 8, ty + 156], [cx + 20, ty + 146]], { stroke: S.act, width: 2.4, arrow: true });
    out += `<path d="M${cx - 16},${ty + 192} L${cx - 2},${ty + 176} L${cx + 16},${ty + 184}" fill="none" stroke="${S.state}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cx - 2}" cy="${ty + 176}" r="3.6" fill="${S.state}"/>`;
  });
  // Plus a guess of how far along the task is.
  const [bx, by, bw] = [t0 + 26, 288, t1 - t0 - 26], now = 0.62;
  out += `<rect x="${bx}" y="${by - 14}" width="${n(bw * now)}" height="14" fill="${S.prog}" fill-opacity=".8"/>` + rect(r, bx, by - 14, bw, 14, { width: 1.8, jitter: 1 });
  out += math(t0 + 2, by, ['ρ̂', ['t', 'sub']], { size: 25, fill: S.prog, anchor: 'middle' });
  out += text(bx, by + 22, '0', { size: 18, anchor: 'middle', fill: C.muted }) + text(bx + bw, by + 22, '1', { size: 18, anchor: 'middle', fill: C.muted });
  out += text(bx + bw / 2, by + 22, 'progress', { size: 18, anchor: 'middle', fill: C.muted });
  out += text(32, 270, 'no policy,', { font: HAND, size: 21, weight: 700, fill: C.muted }) + text(32, 296, 'no labels', { font: HAND, size: 21, weight: 700, fill: C.muted });
  // Cover Blocks: a linear probe reads the hidden color order out of the memory.
  out += text(24, 346, 'color order read from', { size: 19 }) + math(214, 346, ['m', ['t', 'sub']], { size: 22, fill: S.mem }) + text(244, 346, '· Cover Blocks', { size: 19, fill: C.muted });
  const [px, pw, py] = [196, 280, 362];
  out += bars(r, PROBE, { x: px, y: py, w: pw, h: 22, gap: 10, size: 18 });
  const cx = px + (CHANCE / 100) * pw;
  out += `<path d="M${n(cx)},${py - 8} V${py + 62}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="4 4"/>` + text(cx, py + 82, 'chance', { size: 18, anchor: 'middle', fill: C.muted });
  return out;
}

function panelAdapt() {
  const r = random(53);
  let out = frame(r, '5 · stage 2: plug it into the VLA', C.panel.yellow);
  // The VLA: current view and instruction in, action chunk out.
  out += scene(r, 34, 60, 92, 52, ORDERS.A, 3, { scale: 0.42 });
  out += math(80, 132, ['o', ['t', 'sub']], { size: 22, anchor: 'middle' });
  out += math(180, 96, ['ℓ'], { size: 30, anchor: 'middle' });
  out += line(r, 80, 138, 104, 156, { arrow: true, width: 2, size: 10 }) + line(r, 178, 106, 150, 156, { arrow: true, width: 2, size: 10 });
  out += rect(r, 34, 160, 186, 40, { fill: C.bg, width: 2.4 }) + text(127, 188, 'VLM', { font: HAND, size: 24, weight: 700, anchor: 'middle' });
  out += line(r, 127, 202, 127, 220, { arrow: true, width: 2, size: 9 });
  out += rect(r, 34, 224, 186, 104, { fill: C.bg, width: 2.4 }) + text(127, 248, 'action expert', { font: HAND, size: 21, weight: 700, anchor: 'middle' });
  const layers = [258, 282, 306];
  for (const y of layers) out += `<rect x="48" y="${y}" width="158" height="14" fill="${C.panel.blue}" stroke="${C.muted}" stroke-width="1.4"/>`;
  out += curve([[127, 330], [127, 346], [150, 352], [170, 344], [190, 354]], { width: 2.4, arrow: true });
  out += math(206, 360, ['a', ['t', 'sub']], { size: 25 });
  // Stage 1 hands over the encoder; its decoder is thrown away.
  out += rect(r, 300, 60, 120, 44, { fill: C.bg, width: 2.2 }) + math(360, 90, ['E', ['φ', 'sub']], { size: 26, anchor: 'middle' });
  out += text(360, 124, 'from stage 1', { size: 18, anchor: 'middle', fill: C.muted });
  out += `<path d="M448,72 L488,60 L488,108 L448,96 Z" fill="${C.panel.gray}" stroke="${C.muted}" stroke-width="2" stroke-linejoin="round"/>` + line(r, 440, 106, 498, 58, { stroke: C.red, width: 2.6 });
  out += text(470, 132, 'decoder', { size: 18, anchor: 'middle', fill: C.muted }) + text(470, 150, 'dropped', { size: 18, anchor: 'middle', fill: C.muted });
  out += line(r, 360, 130, 360, 168, { arrow: true, width: 2.2, size: 10 });
  out += tokens(r, 318, 176, 8, 6, 10, S.mem);
  out += math(426, 216, ['m', ['t', 'sub']], { size: 28, fill: S.mem });
  // Every action-expert layer reads the memory: cross-attention, then a FiLM scale and shift.
  for (const y of layers) out += line(r, 314, 206, 212, y + 7, { stroke: S.mem, width: 2.2, arrow: true, size: 10, passes: 1 });
  out += text(258, 300, 'cross-attn', { size: 18, fill: C.muted }) + text(258, 318, '+ FiLM', { size: 18, fill: C.muted });
  out += text(372, 268, 'train both', { font: HAND, size: 21, weight: 700, fill: S.prog });
  out += text(372, 292, 'on the action loss', { font: HAND, size: 21, weight: 700, fill: S.prog });
  // RMBench success for the three training recipes (full-attention encoder).
  out += text(536, 368, 'RMBench success', { size: 18, anchor: 'end', fill: C.muted });
  out += bars(r, RECIPE, { x: 186, y: 380, w: 300, h: 16, gap: 8, labelX: 176, size: 18 });
  return out;
}

// Panel 6 plot: success against latency, latency on a log axis.
export const PLOT = { x: 104, y: 74, w: 400, h: 206, ms: [80, 1100], success: [0, 80] };
export const plotX = (ms) => PLOT.x + ((Math.log10(ms) - Math.log10(PLOT.ms[0])) / (Math.log10(PLOT.ms[1]) - Math.log10(PLOT.ms[0]))) * PLOT.w;
export const plotY = (success) => PLOT.y + PLOT.h - ((success - PLOT.success[0]) / (PLOT.success[1] - PLOT.success[0])) * PLOT.h;

function panelResult() {
  const r = random(67);
  let out = frame(r, '6 · better and faster', C.panel.gray);
  const { x, y, w, h } = PLOT;
  for (const s of [40, 80]) out += `<path d="M${x},${n(plotY(s))} H${x + w}" stroke="${C.grid}" stroke-width="1.2" stroke-dasharray="2 5"/>`;
  out += line(r, x, y - 8, x, y + h, { width: 2 }) + line(r, x, y + h, x + w + 8, y + h, { width: 2 });
  for (const s of [0, 40, 80]) out += text(x - 10, plotY(s) + 7, String(s), { size: 19, anchor: 'end', fill: C.muted });
  for (const ms of [100, 300, 1000]) out += text(plotX(ms), y + h + 24, String(ms), { size: 19, anchor: 'middle', fill: C.muted });
  out += text(x + w / 2, y + h + 50, 'ms per 50-step action chunk', { size: 18, anchor: 'middle', fill: C.muted });
  out += text(46, y + h / 2, 'success %', { size: 18, anchor: 'middle', fill: C.muted, extra: ` transform="rotate(-90 46 ${y + h / 2})"` });
  const place = { 'π0.5 alone': [10, 26, 'start'], HAMLET: [12, -12, 'start'], MemoryVLA: [0, -16, 'middle'], EventVLA: [-12, 26, 'end'], Imprint: [18, 8, 'start'] };
  for (const p of SCATTER) {
    const [px, py] = [plotX(p.ms), plotY(p.success)], [dx, dy, anchor] = place[p.name];
    if (p.kind === 'imprint') out += star(px, py, 15, S.mem);
    else out += `<circle cx="${n(px)}" cy="${n(py)}" r="7" fill="${p.kind === 'base' ? 'none' : C.muted}" stroke="${C.muted}" stroke-width="2.2"/>`;
    const label = p.reported ? `${p.name}*` : p.name;
    out += text(px + dx, py + dy, label, p.kind === 'imprint' ? { font: HAND, size: 25, weight: 700, fill: S.mem, anchor } : { size: 18, anchor, fill: C.ink });
  }
  out += text(x + w, y + h + 74, '* latency reported by its authors', { size: 17, anchor: 'end', fill: C.muted });
  // The same jump on a real robot and in a second simulator.
  const [bx, bw] = [196, 250];
  TRANSFER.forEach((row, k) => {
    const top = 382 + k * 36;
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
      out += tag(r, 'the training · two stages', { x: 40, y: 610, size: 28 });
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
      out += tag(r, 'the training · two stages', { x: 650, y: 610, size: 28 });
      out += line(r, 606, 920, 644, 920, { stroke: S.mem, width: 3, arrow: true }) + math(625, 900, ['m', ['t', 'sub']], { size: 30, fill: S.mem, anchor: 'middle' });
      out += curve([[930, 1158], [800, 1184], [600, 1196], [560, 1220], [480, 1288]], { width: 2.6, arrow: true });
      return out;
    },
  },
  tall: {
    width: 640, height: 3310,
    panels: [[40, 80], [40, 600], [40, 1120], [40, 1770], [40, 2290], [40, 2810]],
    overlay(r) {
      let out = tag(r, 'the memory', { x: 40, y: 10, size: 28 });
      for (const y of [540, 1060, 2230, 2750]) out += line(r, 480, y + 6, 480, y + 54, { width: 2.6, arrow: true });
      out += `<path d="M40,1660 H600" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'the training', { x: 40, y: 1682, size: 28 });
      out += line(r, 480, 1586, 480, 1764, { stroke: S.mem, width: 3, arrow: true });
      out += math(462, 1632, ['m', ['t', 'sub']], { size: 32, fill: S.mem, anchor: 'end' });
      return out;
    },
  },
};

const TITLE = 'Imprint: a robot memory that keeps every stream and learns what matters';
const DESC = [
  'Panel 1, the problem: in the RMBench Cover Blocks task, red, green and blue blocks sit in a random order and the robot covers them with three identical lids, left to right, then must uncover red first. Two episodes that started in different orders end with the same camera view, yet the right lid to lift differs, so the policy needs the past.',
  'Panel 2: the history has three streams, camera video, the actions sent and the joint states. Memory methods often keep only the last frames, keyframes, a text summary, or the video alone; the last frames here show only lids. Imprint keeps all three streams and learns what matters.',
  'Panel 3: the history arrives in chunks of four frames with their actions and joint states. Each chunk updates a fixed-size recurrent state h once, and learned queries guided by the instruction read that state plus the few most recent frames into the memory m_t, 256 tokens. (m_t, h_t) = E_phi(e_t; h_t-1, instruction).',
  `Panel 4, stage 1: with no policy and no labels, a decoder that sees only m_t must rebuild image features, actions and joint states at randomly sampled past steps, and estimate progress, the current step over the episode length. On Cover Blocks, a linear probe reads the hidden color order from the memory at ${pct(PROBE[1].value)} accuracy after stage 1, against ${pct(PROBE[0].value)} for a memory trained on the action loss alone; chance is ${pct(CHANCE)}.`,
  `Panel 5, stage 2: the decoder is dropped and the stage 1 encoder is plugged into the vision-language-action model. Every layer of its action expert reads m_t through cross-attention and a FiLM scale and shift, and encoder and policy train together on the action loss. RMBench success with the full-attention encoder: ${RECIPE.map((row) => `${pct(row.value)} for ${row.label}`).join(', ')}.`,
  `Panel 6, the result on RMBench, success against latency per 50-step action chunk on an L40S GPU: ${SCATTER.map((p) => `${p.name} ${pct(p.success)} at ${p.ms} ms${p.reported ? ' (latency reported by its authors)' : ''}`).join(', ')}. ${TRANSFER.map((row) => `${row.label}: ${pct(row.base)} without memory, ${pct(row.imprint)} with Imprint`).join('; ')}.`,
].join(' ');

export function svg(name) {
  const layout = LAYOUTS[name], r = random({ wide: 3, mid: 4, tall: 5 }[name]);
  const panels = PANELS.map((draw, k) => `<g transform="translate(${layout.panels[k][0]} ${layout.panels[k][1]})">${draw()}</g>`).join('');
  return `<svg class="im-${name}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="im-${name}-title im-${name}-desc" xmlns="http://www.w3.org/2000/svg">` +
    `<title id="im-${name}-title">${esc(TITLE)}</title><desc id="im-${name}-desc">${esc(DESC)}</desc>` +
    `<rect width="${layout.width}" height="${layout.height}" fill="${C.bg}"/>${panels}${layout.overlay(r)}</svg>`;
}

// ── Prose around the canvas ──────────────────────────────────────────────────────

export const INTRO = String.raw`In the Cover Blocks task, red, green and blue blocks sit in a random order. The robot covers them left to right, then must uncover them in red, green, blue order. Once they're covered, every order looks the same, so how does the policy know which to open first? It has to remember. Most memory methods for vision-language-action (VLA) policies pick what to keep: recent frames, keyframes, text summaries, or a learned video-only summary. Imprint doesn't pick. It compresses the video, the robot's actions and its joint positions into 256 memory tokens, updated as the episode runs, so cost stays bounded. On RMBench's nine memory tasks, π0.5 goes from 25.4% to 72.8% success, the best of the memory methods compared and the fastest, at 122.8 ms per action chunk.`;
export const MATH_BEFORE = String.raw`Stage 1 needs no policy or labels. The encoder packs the history and instruction into the memory $m_t$, 256 tokens of width 1024, and a decoder that sees only $m_t$ has to rebuild the past by minimizing `;
// Eq. 4.4 of the paper. The narrow version breaks the same sum over three lines for phones.
export const EQUATION = String.raw`\mathcal{L}_{\text{mem}} = \frac{1}{K}\sum_{k}\Big[\lambda_v\big\|\hat z^{v}_{k}-z^{v}_{k}\big\|^{2}+\lambda_a\big\|\hat a_{k}-a_{k}\big\|^{2}+\lambda_q\big\|\hat q_{k}-q_{k}\big\|^{2}\Big]+\lambda_\rho\big(\hat\rho_t-\rho_t\big)^{2}`;
export const EQUATION_NARROW = String.raw`\begin{aligned}\mathcal{L}_{\text{mem}} = {}&\frac{1}{K}\sum_{k}\Big[\lambda_v\big\|\hat z^{v}_{k}-z^{v}_{k}\big\|^{2}\\&+\lambda_a\big\|\hat a_{k}-a_{k}\big\|^{2}+\lambda_q\big\|\hat q_{k}-q_{k}\big\|^{2}\Big]\\&+\lambda_\rho\big(\hat\rho_t-\rho_t\big)^{2}\end{aligned}`;
export const MATH_AFTER = String.raw` Here $k$ runs over $K$ random past steps, up to 16, and the weights are $\lambda_v=1$ and $\lambda_a=\lambda_q=\lambda_\rho=0.5$. The decoder predicts camera features $\hat z^v_k$ (target $z^v_k$: frozen DINOv3 features), action $\hat a_k$, joint state $\hat q_k$, and progress $\hat\rho_t$, with target $\rho_t = t/(T-1)$ in a $T$-step episode. Stage 2 drops the decoder and fine-tunes the encoder and policy $\pi_\theta$ together on $-\log \pi_\theta(\mathbf{a}_t \mid o_t, \ell, m_t)$, for action chunk $\mathbf{a}_t$, observation $o_t$ and instruction $\ell$. Rebuilding is only a warm-up, though. With 1,024 tokens the decoder rebuilds best, yet RMBench success drops to 70.0% from 72.7% at 256 (full-attention encoder).`;

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
<div class="im-after"><p class="im-credit">Wu, Shah, Huang, Sontakke, Bharadhwaj, Bajcsy, Simchowitz, Shi · Amazon FAR · arXiv · 9 Oct 2026</p><nav class="im-sources" aria-label="Original sources"><a href="https://arxiv.org/abs/2610.14406">Paper ↗</a><a href="https://yilin-wu98.github.io/imprint_website/">Project ↗</a><a href="https://github.com/amazon-far/imprint">Code ↗</a></nav></div>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  fs.writeFileSync(OUTPUT, render());
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
}
