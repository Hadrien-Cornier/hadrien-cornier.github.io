/** Draw the MolmoBot paper canvas (arXiv 2603.16861) as one blackboard SVG in three layouts.
 *
 * Numbers come from scripts/molmobot-figures.json, which scripts/molmobot-figures.py reads out of the
 * paper's tables and its Fig. 7. Panels 1, 2, 3 and 5 are schematics of the method; panels 4 and 6 plot
 * the paper's numbers. Run `node scripts/molmobot-canvas.mjs` to rewrite content/papers/molmobot.html,
 * then build the site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import katex from 'katex';
import { C, HAND, esc, n, random, rect, line, curve, text, tag, snowflake } from './chalk.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/molmobot-figures.json'), 'utf8'));
export const OUTPUT = path.join(ROOT, 'content/papers/molmobot.html');
export const PANEL = { w: 560, h: 460 };

// Blue for the simulator, yellow for the real world, lavender for the scripted expert, pink for MolmoBot (the paper's own bar color).
const S = { sim: C.blue, real: C.yellow, expert: C.lavender, ours: C.pink, base: C.muted };

/** "1.7M", "94.2k", "5,704 h" as numbers. */
export function count(cell) {
  const m = String(cell).replace(/,/g, '').match(/([\d.]+)\s*([kM]?)/);
  if (!m) throw new Error(`Not a count: ${cell}`);
  return Number(m[1]) * ({ k: 1e3, M: 1e6 }[m[2]] || 1);
}
const column = (table, name) => {
  const k = table.columns.findIndex((c) => c.trim().startsWith(name));
  if (k < 0) throw new Error(`No column ${name}`);
  return k;
};
const row = (table, name) => table.rows.find((cells) => cells[0].trim().startsWith(name));

// Table 1 total against Table 2's DROID row: the largest real dataset the baselines fine-tune on.
const total = row(DATA.dataset, 'Total'), droid = row(DATA.prior, 'DROID');
export const SCALE = [
  { label: 'demos', droid: droid[column(DATA.prior, 'Episodes')], ours: total[column(DATA.dataset, 'Episodes')] },
  { label: 'hours of robot time', droid: droid[column(DATA.prior, 'Hours')], ours: total[column(DATA.dataset, 'Total Length')] },
  { label: 'environments', droid: droid[column(DATA.prior, 'Unique Envs')], ours: total[column(DATA.dataset, 'Envs')] },
].map((r) => ({ ...r, droid: String(r.droid).replace(/\s*h$/, ''), ours: String(r.ours).replace(/\s*h$/, '') }));

// Fig. 7: real tabletop pick-and-place, 4 rooms, 120 trials per policy.
const FIG7 = DATA.real.bars;
export const RESULT = [
  { label: 'π0-DROID', key: 'π0-DROID' },
  { label: 'π0.5-DROID', key: 'π0.5-DROID' },
  { label: 'MolmoBot-Pi0', key: 'MolmoBot-Pi0' },
  { label: 'MolmoBot-Img', key: 'MolmoBot-Img' },
  { label: 'MolmoBot', key: 'MolmoBot (F=2)' },
].map((r) => ({ ...r, value: FIG7[r.key].percent, wins: FIG7[r.key].successes, real: FIG7[r.key].real_data }));
export const TRIALS = DATA.real.trials;
const pct = (v) => `${v.toFixed(1)}%`;

// ── Small drawings ──────────────────────────────────────────────────────────────

function frame(r, title, fill) {
  return rect(r, 0, 0, PANEL.w, PANEL.h, { fill, width: 2.6 }) + tag(r, title);
}

function box(r, x, y, w, h, lines, { stroke = C.ink, size = 21, fill = C.bg, color = C.ink } = {}) {
  const top = y + h / 2 - ((lines.length - 1) * (size + 4)) / 2 + size * 0.35;
  return rect(r, x, y, w, h, { stroke, fill, width: 2.2, jitter: 1.4 }) +
    lines.map((value, k) => text(x + w / 2, top + k * (size + 4), value, { font: HAND, size, weight: 700, anchor: 'middle', fill: color })).join('');
}

/** A tiny arm on a pedestal: the real robot. */
function arm(r, x, y, color = C.ink) {
  return `<path d="M${x - 14},${y} H${x + 14} M${x},${y} V${y - 18} L${x + 16},${y - 38} L${x + 36},${y - 26}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${x}" cy="${y - 18}" r="3.6" fill="${color}"/><circle cx="${x + 16}" cy="${y - 38}" r="3.6" fill="${color}"/>` +
    `<path d="M${x + 36},${y - 32} v12 M${x + 42},${y - 32} v12" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
}

/** One rendered view of a tabletop: wall, table, a bowl and a banana, with its own light, colors and camera. */
function view(r, x, y, w, h, v) {
  const { wall, stripes, table, bowl, light, glow, eye } = v;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/>`;
  if (stripes) for (let k = 1; k < 8; k++) out += `<path d="M${n(x + (k * w) / 8)},${y} V${n(y + h * 0.48)}" stroke="${stripes}" stroke-width="5" opacity=".55"/>`;
  // Camera: eye moves the horizon and tilts the table top.
  const top = y + h * eye.horizon, near = y + h - 4, left = x + w * eye.left, right = x + w * eye.right;
  out += `<path d="M${n(left)},${n(top)} L${n(right)},${n(top + eye.tilt)} L${x + w - 4},${near} L${x + 4},${near} Z" fill="${table}"/>`;
  const lx = x + w * light, spread = w * 0.3;
  if (glow) out += `<path d="M${n(lx - 5)},${y + 12} L${n(Math.max(x, lx - spread))},${near} L${n(Math.min(x + w, lx + spread))},${near} L${n(lx + 5)},${y + 12} Z" fill="${glow}" opacity=".22"/>`;
  out += `<circle cx="${n(lx)}" cy="${y + 10}" r="5" fill="${C.yellow}"/>`;
  const by = n(top + (near - top) * 0.55), bx = n(x + w * eye.bowl);
  out += `<path d="M${n(bx - 30)},${by} A30,18 0 0 0 ${n(bx + 30)},${by} Z" fill="${bowl}"/>`;
  const nx = n(x + w * eye.banana), ny = n(top + (near - top) * 0.62);
  out += `<path d="M${n(nx - 20)},${n(ny - 4)} Q${nx},${n(ny + 14)} ${n(nx + 20)},${n(ny - 4)} Q${nx},${n(ny + 5)} ${n(nx - 20)},${n(ny - 4)} Z" fill="${C.yellow}" stroke="#8a7330" stroke-width="1.6"/>`;
  return out + rect(r, x, y, w, h, { stroke: S.sim, width: 2, jitter: 1.2 });
}

/** Horizontal bars on a 0 to 100 % scale with the value after each bar. */
function bars(r, rows, { x, y, w, h = 24, gap = 14, size = 19 }) {
  let out = '';
  rows.forEach((row, k) => {
    const top = y + k * (h + gap), len = (row.value / 100) * w, color = row.real ? S.base : S.ours;
    out += text(x - 12, top + h - 5, row.label, { size, anchor: 'end', fill: row.real ? C.muted : C.ink });
    out += `<rect x="${x}" y="${n(top)}" width="${n(len)}" height="${h}" fill="${color}" fill-opacity="${row.real ? 0.55 : 0.85}"/>` + rect(r, x, top, len, h, { stroke: color, width: 1.6, jitter: 1 });
    out += text(x + len + 8, top + h - 5, pct(row.value), { size, weight: 700, fill: row.real ? C.ink : S.ours });
  });
  return out;
}

// ── Panels (local coordinates, 560 × 460) ─────────────────────────────────────────

function panelBet() {
  const r = random(11);
  let out = frame(r, '1 · the bet: no real data', C.panel.blue);
  out += text(24, 78, 'the usual recipe', { font: HAND, size: 22, weight: 700, fill: C.muted });
  out += box(r, 24, 92, 140, 62, ['simulator'], { stroke: S.sim });
  out += line(r, 170, 123, 198, 123, { arrow: true, width: 2.4, size: 10 });
  out += box(r, 204, 92, 172, 62, ['real demos or', 'fine-tuning'], { stroke: S.real, size: 19 });
  out += line(r, 382, 123, 410, 123, { arrow: true, width: 2.4, size: 10 });
  out += box(r, 416, 92, 120, 62, ['real robot'], { stroke: S.real, size: 20 });
  out += text(24, 206, 'MolmoBot', { font: HAND, size: 25, weight: 700, fill: S.ours });
  out += box(r, 24, 222, 140, 62, ['simulator,', 'at scale'], { stroke: S.sim, size: 20 });
  out += line(r, 170, 253, 410, 253, { arrow: true, width: 3, size: 13, stroke: S.ours });
  out += text(290, 240, 'zero-shot', { font: HAND, size: 23, weight: 700, anchor: 'middle', fill: S.ours });
  out += text(290, 278, 'nothing real in between', { size: 17, anchor: 'middle', fill: C.muted });
  out += box(r, 416, 222, 120, 62, ['real robot'], { stroke: S.real, size: 20 });
  out += text(24, 338, 'sim-to-real', { font: HAND, size: 22, weight: 700, fill: S.sim }) + text(156, 338, 'train in a simulator, run on a real robot', { size: 17, fill: C.ink });
  out += text(24, 372, 'zero-shot', { font: HAND, size: 22, weight: 700, fill: S.ours }) + text(156, 372, 'no real data, no fine-tuning beforehand', { size: 17, fill: C.ink });
  out += text(280, 428, 'can simulation alone be enough?', { font: HAND, size: 25, weight: 700, anchor: 'middle' });
  return out;
}

// Three random draws of the same kind of scene: light, textures, colors and camera all change.
export const VIEWS = [
  { wall: '#3b3a33', stripes: null, table: '#6b5238', bowl: '#5d8fb0', light: 0.22, glow: C.yellow, eye: { horizon: 0.5, tilt: 0, left: 0.08, right: 0.92, bowl: 0.66, banana: 0.3 } },
  { wall: '#26343a', stripes: '#3e5560', table: '#c9c3b2', bowl: '#c0584a', light: 0.82, glow: '#9ec3ff', eye: { horizon: 0.42, tilt: 18, left: 0.18, right: 0.98, bowl: 0.36, banana: 0.7 } },
  { wall: '#3d2f3f', stripes: '#57425a', table: '#3c4a33', bowl: '#e2ddd0', light: 0.5, glow: null, eye: { horizon: 0.3, tilt: -10, left: 0.02, right: 0.84, bowl: 0.62, banana: 0.26 } },
];

function panelRandomize() {
  const r = random(23);
  let out = frame(r, '2 · randomize everything', C.panel.green);
  VIEWS.forEach((v, k) => { out += view(r, 24 + k * 178, 60, 160, 112, v); });
  out += text(280, 196, 'one task, three random draws', { size: 17, anchor: 'middle', fill: C.muted });
  const rows = [
    ['looks', S.real, 'lights, textures, camera pose and lens'],
    ['physics', C.green, 'friction, object mass, joint damping'],
    ['setup', S.expert, 'which objects, where, the arm’s start pose'],
    ['moves', S.ours, 'noise added to the expert’s actions'],
  ];
  rows.forEach(([label, color, detail], k) => {
    out += text(24, 238 + k * 34, label, { font: HAND, size: 22, weight: 700, fill: color }) + text(116, 238 + k * 34, detail, { size: 18 });
  });
  out += text(24, 392, 'each demo starts in one of 200k+ generated', { size: 17, fill: C.muted });
  out += text(24, 414, 'houses (MolmoSpaces), rendered in MuJoCo', { size: 17, fill: C.muted });
  out += text(536, 446, 'variety over photorealism', { font: HAND, size: 23, weight: 700, anchor: 'end', fill: S.ours });
  return out;
}

// Phase points of a pick-and-place demo, seen from the side.
export const PHASES = [
  ['pregrasp', 176, 160], ['grasp', 176, 236], ['lift', 222, 150], ['preplace', 400, 140], ['place', 420, 222], ['postplace', 432, 164], ['stow', 508, 112],
];

function gripper(x, y, color) {
  return `<path d="M${x - 11},${y - 16} V${y} M${x + 11},${y - 16} V${y} M${x - 11},${y - 16} H${x + 11} M${x},${y - 16} V${y - 30}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
}

function panelExpert() {
  const r = random(37);
  let out = frame(r, '3 · a scripted expert shows how', C.panel.red);
  out += text(24, 62, 'it reads the simulator: true poses, a list of grasps', { size: 17, fill: C.muted });
  // The table, a banana and a bowl.
  out += line(r, 30, 262, 530, 262, { width: 2.4, passes: 2 });
  for (let k = 0; k < 12; k++) out += `<path d="M${46 + k * 40},${266} l-12,12" stroke="${C.grid}" stroke-width="1.4"/>`;
  out += `<path d="M150,252 Q176,270 202,252 Q176,262 150,252 Z" fill="${C.yellow}" stroke="#8a7330" stroke-width="1.6"/>`;
  out += `<path d="M368,240 A52,22 0 0 0 472,240 Z" fill="${C.blue}" fill-opacity=".75" stroke="${C.blue}" stroke-width="2"/>`;
  // The demo path through its phases.
  const pts = Object.fromEntries(PHASES.map(([name, x, y]) => [name, [x, y]]));
  const seg = (a, b, opts = {}) => line(r, pts[a][0], pts[a][1], pts[b][0], pts[b][1], { stroke: S.expert, width: 2.6, arrow: true, size: 10, passes: 1, ...opts });
  out += seg('pregrasp', 'grasp');
  out += curve([pts.grasp, [196, 190], pts.lift], { stroke: S.expert, width: 2.6, arrow: true });
  out += curve([pts.lift, [314, 108], pts.preplace], { stroke: S.expert, width: 2.6, arrow: true });
  out += seg('preplace', 'place') + seg('place', 'postplace') + curve([pts.postplace, [480, 150], pts.stow], { stroke: S.expert, width: 2.6, arrow: true });
  for (const [, x, y] of PHASES) out += `<circle cx="${x}" cy="${y}" r="5" fill="${S.expert}"/>`;
  out += gripper(176, 152, C.ink);
  const label = { pregrasp: [0, -50, 'middle'], grasp: [14, 0, 'start'], lift: [12, -12, 'start'], preplace: [-6, -16, 'middle'], place: [14, 6, 'start'], postplace: [12, 22, 'start'], stow: [0, -14, 'middle'] };
  for (const [name, x, y] of PHASES) {
    const [dx, dy, anchor] = label[name];
    out += text(x + dx, y + dy, name, { size: 17, anchor, fill: S.expert });
  }
  // A missed grasp sends the expert back to the first phase.
  out += curve([[164, 232], [112, 214], [118, 172], [162, 162]], { stroke: C.red, width: 2.4, arrow: true, dash: '7 6' });
  out += text(24, 192, 'slipped?', { size: 18, fill: C.red }) + text(24, 214, 'retry', { size: 18, fill: C.red });
  // What the expert has against what the policy will have.
  out += text(24, 316, 'the expert has', { font: HAND, size: 22, weight: 700, fill: S.expert });
  out += text(24, 344, '· exact object poses', { size: 18 }) + text(24, 370, '· grasps checked in sim', { size: 18 });
  out += text(296, 316, 'the policy gets', { font: HAND, size: 22, weight: 700, fill: S.ours });
  out += text(296, 344, '· images from 2 cameras', { size: 18 }) + text(296, 370, '· joint angles, instruction', { size: 18 });
  out += text(280, 420, 'the policy learns to copy the expert', { font: HAND, size: 23, weight: 700, anchor: 'middle' });
  out += text(280, 446, 'more than 3 retries: the demo is thrown out', { size: 16, anchor: 'middle', fill: C.muted });
  return out;
}

function panelScale() {
  const r = random(41);
  let out = frame(r, '4 · then 1.7 million of them', C.panel.yellow);
  out += `<rect x="24" y="58" width="16" height="12" fill="${S.base}" fill-opacity=".55"/>` + text(48, 70, 'DROID, real', { size: 17, fill: C.muted });
  out += `<rect x="190" y="58" width="16" height="12" fill="${S.ours}"/>` + text(214, 70, 'MolmoBot-Data, simulated', { size: 17, fill: C.muted });
  const [x, w] = [24, 400];
  SCALE.forEach((row, k) => {
    const top = 104 + k * 84, droid = count(row.droid), ours = count(row.ours), len = Math.max(3, (droid / ours) * w);
    out += text(x, top, row.label, { font: HAND, size: 22, weight: 700 });
    out += `<rect x="${x}" y="${top + 10}" width="${n(len)}" height="14" fill="${S.base}" fill-opacity=".55"/>` + text(x + len + 8, top + 23, row.droid, { size: 18, fill: C.muted });
    out += `<rect x="${x}" y="${top + 30}" width="${w}" height="18" fill="${S.ours}" fill-opacity=".85"/>` + rect(r, x, top + 30, w, 18, { stroke: S.ours, width: 1.6, jitter: 1 });
    out += text(x + w + 10, top + 46, row.ours, { size: 20, weight: 700, fill: S.ours });
  });
  out += text(24, 368, 'generated in about 6,500 GPU-hours on 100 A100s', { size: 17 });
  out += text(24, 410, 'for picking: more demos helped;', { font: HAND, size: 21, weight: 700, fill: C.muted });
  out += text(24, 438, 'more houses, at 50k demos, did not', { font: HAND, size: 21, weight: 700, fill: C.muted });
  return out;
}

function layers(x, y, w, count, gap, fill) {
  let out = '';
  for (let k = 0; k < count; k++) out += `<rect x="${x}" y="${y + k * gap}" width="${w}" height="12" fill="${fill}" stroke="${C.muted}" stroke-width="1.4"/>`;
  return out;
}

function panelPolicy() {
  const r = random(53);
  let out = frame(r, '5 · the policy: MolmoBot', C.panel.gray);
  // Inputs: two cameras, two frames each (now and about 0.5 s ago), the instruction and the joint angles.
  for (const [x, label] of [[24, 'wrist'], [116, 'external']]) {
    out += `<rect x="${x + 8}" y="58" width="62" height="40" fill="${C.panel.gray}" stroke="${C.grid}" stroke-width="1.6"/>`;
    out += `<rect x="${x}" y="66" width="62" height="40" fill="${C.bg}" stroke="${S.real}" stroke-width="1.8"/>`;
    out += text(x + 31, 126, label, { size: 17, anchor: 'middle', fill: C.muted });
  }
  out += text(24, 146, 'now + 0.5 s ago', { size: 16, fill: C.muted });
  out += text(222, 80, '“put the banana', { font: HAND, size: 20, weight: 700 }) + text(222, 104, 'in the black bowl”', { font: HAND, size: 20, weight: 700 });
  out += text(420, 126, 'joint angles', { size: 17, fill: C.muted }) + arm(r, 444, 106, C.green);
  // Frozen vision encoder, then the language model, whose layers each feed the action head's matching layer.
  out += line(r, 100, 152, 100, 166, { arrow: true, width: 2, size: 8 }) + line(r, 270, 112, 204, 212, { arrow: true, width: 2, size: 9 });
  out += rect(r, 24, 170, 152, 30, { stroke: S.real, width: 1.8, jitter: 1, fill: C.bg }) + snowflake(40, 185, 8, C.ink) + text(56, 191, 'SigLIP2 vision', { size: 16 });
  out += line(r, 100, 202, 100, 214, { arrow: true, width: 2, size: 8 });
  out += rect(r, 24, 218, 200, 120, { width: 2.2, jitter: 1.2, fill: C.bg }) + text(124, 238, 'Molmo2-4B', { font: HAND, size: 20, weight: 700, anchor: 'middle' });
  out += layers(38, 250, 172, 4, 20, C.panel.blue);
  out += rect(r, 316, 218, 220, 120, { stroke: S.ours, width: 2.2, jitter: 1.2, fill: C.bg }) + text(426, 238, 'action head (DiT)', { font: HAND, size: 20, weight: 700, anchor: 'middle', fill: S.ours });
  out += layers(330, 250, 192, 4, 20, C.panel.red);
  for (let k = 0; k < 4; k++) out += line(r, 212, 256 + k * 20, 328, 256 + k * 20, { stroke: S.ours, width: 1.8, arrow: true, size: 8, passes: 1 });
  out += line(r, 452, 134, 452, 214, { stroke: C.green, width: 2, arrow: true, size: 9 });
  out += text(270, 352, 'layer by layer', { size: 16, anchor: 'middle', fill: C.muted });
  // Flow matching: start from noise, step toward a smooth chunk of 16 joint targets, run 8 of them.
  const nx = 40, ny = 400;
  const noise = Array.from({ length: 16 }, (_, k) => [nx + k * 9, ny + 16 * Math.sin(k * 2.3 + 0.5) * (k % 3 ? 1 : -0.7)]);
  out += curve(noise, { stroke: C.grid, width: 2.2 });
  out += text(nx + 66, ny + 44, 'noise', { size: 17, anchor: 'middle', fill: C.muted });
  out += line(r, 200, ny, 270, ny, { arrow: true, width: 2.4, size: 10, stroke: S.ours });
  out += text(235, ny - 12, 'denoise', { size: 16, anchor: 'middle', fill: S.ours });
  const chunk = Array.from({ length: 16 }, (_, k) => [290 + k * 15, ny + 18 - 30 * Math.sin((k / 15) * Math.PI * 0.9)]);
  out += curve(chunk, { stroke: S.ours, width: 2.6 });
  chunk.forEach(([x, y], k) => { out += `<circle cx="${n(x)}" cy="${n(y)}" r="${k < 8 ? 4.4 : 3}" fill="${k < 8 ? S.ours : 'none'}" stroke="${S.ours}" stroke-width="1.6"/>`; });
  out += text(410, ny + 44, '16 steps of joint targets, run 8', { size: 17, anchor: 'middle', fill: C.ink });
  return out;
}

function panelResult() {
  const r = random(67);
  let out = frame(r, '6 · the real test', C.panel.gray);
  out += text(24, 62, `Franka arm, 4 real rooms, ${TRIALS} pick-and-place trials each`, { size: 17, fill: C.muted });
  out += bars(r, RESULT, { x: 176, y: 82, w: 280, h: 24, gap: 14 });
  // Same π0 architecture, different data.
  const [y0, y2] = [82 + 12, 82 + 2 * 38 + 12];
  out += curve([[176 + RESULT[0].value * 2.8 + 66, y0], [500, (y0 + y2) / 2 - 6], [176 + RESULT[2].value * 2.8 + 66, y2 - 4]], { stroke: S.ours, width: 2.2, arrow: true });
  out += `<rect x="24" y="290" width="16" height="12" fill="${S.base}" fill-opacity=".55"/>` + text(48, 302, 'trained on >10k hours of real demos', { size: 17, fill: C.muted });
  out += `<rect x="24" y="314" width="16" height="12" fill="${S.ours}"/>` + text(48, 326, 'trained only in simulation', { size: 17, fill: C.muted });
  out += text(24, 372, 'same π0 model, only the data changed:', { font: HAND, size: 21, weight: 700 });
  out += text(24, 400, `${pct(RESULT[0].value)} → ${pct(RESULT[2].value)}`, { font: HAND, size: 24, weight: 700, fill: S.ours });
  out += text(24, 444, 'mobile robot, real pull doors: 2 of 9 opened', { size: 16, fill: C.muted });
  return out;
}

export const PANELS = [panelBet, panelRandomize, panelExpert, panelScale, panelPolicy, panelResult];

// ── Layouts ──────────────────────────────────────────────────────────────────────

export const LAYOUTS = {
  wide: {
    width: 1860, height: 1180,
    panels: [[40, 80], [650, 80], [1260, 80], [40, 696], [650, 696], [1260, 696]],
    overlay(r) {
      let out = tag(r, 'the data · made only in simulation', { x: 40, y: 10, size: 28 });
      for (const [x, y] of [[600, 310], [1210, 310], [600, 926], [1210, 926]]) out += line(r, x + 6, y, x + 44, y, { width: 2.6, arrow: true });
      out += `<path d="M40,596 H1820" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'scale it, learn from it, test it for real', { x: 40, y: 610, size: 28 });
      out += curve([[1540, 546], [1420, 600], [1000, 606], [620, 620], [500, 688]], { stroke: S.expert, width: 3, arrow: true });
      out += text(1060, 574, '× 1.7 million', { font: HAND, size: 28, weight: 700, anchor: 'end', fill: S.expert });
      return out;
    },
  },
  // Two columns for mid-size screens, where the wide drawing would shrink its labels below 10 px.
  mid: {
    width: 1250, height: 1790,
    panels: [[40, 80], [650, 80], [40, 690], [650, 690], [40, 1300], [650, 1300]],
    overlay(r) {
      let out = tag(r, 'the data · made only in simulation', { x: 40, y: 10, size: 28 });
      out += line(r, 606, 310, 644, 310, { width: 2.6, arrow: true }) + line(r, 606, 1530, 644, 1530, { width: 2.6, arrow: true });
      out += curve([[930, 548], [800, 574], [600, 586], [560, 610], [480, 678]], { width: 2.6, arrow: true });
      out += tag(r, 'scale it, learn from it', { x: 650, y: 610, size: 28 });
      out += line(r, 606, 920, 644, 920, { stroke: S.expert, width: 3, arrow: true });
      out += curve([[930, 1158], [800, 1184], [600, 1196], [560, 1220], [480, 1288]], { width: 2.6, arrow: true });
      out += tag(r, 'test it for real', { x: 650, y: 1220, size: 28 });
      return out;
    },
  },
  tall: {
    width: 584, height: 3310,
    panels: [[12, 80], [12, 600], [12, 1120], [12, 1770], [12, 2290], [12, 2810]],
    overlay(r) {
      let out = tag(r, 'the data · only simulated', { x: 12, y: 10, size: 28 });
      for (const y of [540, 1060, 2230, 2750]) out += line(r, 452, y + 6, 452, y + 54, { width: 2.6, arrow: true });
      out += `<path d="M12,1660 H572" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'scale, learn, test for real', { x: 12, y: 1682, size: 28 });
      out += line(r, 452, 1586, 452, 1764, { stroke: S.expert, width: 3, arrow: true });
      out += text(434, 1632, '× 1.7M', { font: HAND, size: 26, weight: 700, anchor: 'end', fill: S.expert });
      return out;
    },
  },
};

const TITLE = 'MolmoBot: a robot policy trained only in simulation, tested on real robots';
const DESC = [
  'Panel 1, the bet: the usual recipe goes from a simulator through real demonstrations or fine-tuning to the real robot. MolmoBot goes from a simulator at scale straight to the real robot, zero-shot, with nothing real in between. Sim-to-real means training in a simulator and running on a real robot; zero-shot here means no real data and no fine-tuning beforehand. The question: can simulation alone be enough?',
  'Panel 2, randomize everything: three random draws of the same tabletop task differ in lights, textures, colors and camera angle. The paper randomizes looks (lights, textures, camera pose and lens), physics (friction, object mass, joint damping), setup (which objects, where, the arm start pose) and moves (noise added to the expert actions). Each demonstration starts in one of more than 200,000 generated houses from MolmoSpaces, rendered in MuJoCo. The paper favors variety over photorealism.',
  'Panel 3, a scripted expert: a hand-written planner reads the simulator’s true object poses and a list of grasps checked in simulation, then moves through phases: pregrasp, grasp, lift, preplace, place, postplace, stow. If the grasp slips, it goes back and retries; after more than 3 retries the demonstration is thrown out. The policy gets only images from two cameras, the joint angles and the instruction, and learns to copy the expert.',
  `Panel 4, the scale: ${SCALE.map((row) => `${row.label}, ${row.droid} in DROID (real) against ${row.ours} in MolmoBot-Data (simulated)`).join('; ')}. The data took about 6,500 GPU-hours on 100 A100 GPUs. For picking, more demonstrations helped; more houses, at 50,000 demonstrations, did not.`,
  'Panel 5, the policy: a wrist camera and an external camera, each with the current frame and one from about 0.5 seconds before, go through a frozen SigLIP2 vision encoder into the Molmo2-4B language model with the instruction, for example “put the banana in the black bowl”. Each layer of a DiT action head reads the matching language-model layer, and the joint angles join the action head. The head turns noise into a chunk of 16 steps of joint targets; the robot runs 8, then asks again.',
  `Panel 6, the real test: Franka arm, 4 real rooms, ${TRIALS} pick-and-place trials per policy. ${RESULT.map((row) => `${row.label} ${pct(row.value)} (${row.wins} of ${TRIALS})`).join(', ')}. The two DROID baselines trained on more than 10,000 hours of real demonstrations; the MolmoBot policies trained only in simulation. The same π0 model goes from ${pct(RESULT[0].value)} to ${pct(RESULT[2].value)} when only the data changes. On the mobile robot, the policy opened 2 of 9 real pull doors.`,
].join(' ');

export function svg(name) {
  const layout = LAYOUTS[name], r = random({ wide: 3, mid: 4, tall: 5 }[name]);
  const panels = PANELS.map((draw, k) => `<g transform="translate(${layout.panels[k][0]} ${layout.panels[k][1]})">${draw()}</g>`).join('');
  return `<svg class="mb-${name}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="mb-${name}-title mb-${name}-desc" xmlns="http://www.w3.org/2000/svg">` +
    `<title id="mb-${name}-title">${esc(TITLE)}</title><desc id="mb-${name}-desc">${esc(DESC)}</desc>` +
    `<rect width="${layout.width}" height="${layout.height}" fill="${C.bg}"/>${panels}${layout.overlay(r)}</svg>`;
}

// ── Prose around the canvas ──────────────────────────────────────────────────────

export const INTRO = String.raw`Say you want a robot arm to put a banana in a black bowl, in a room it's never seen. Can a policy trained only in simulation do that with no real data at all? That's the sim-to-real problem: train in a simulator, then run on a physical robot. MolmoBot goes for zero-shot, which here means no real-world data and no fine-tuning beforehand. The authors take MolmoSpaces houses, generated by a program rather than built by hand, and add domain randomization: random lighting, textures, camera pose, friction and more, betting that variety matters more than photorealism. Scripted experts, hand-written planners that read the simulator's true object poses, record 1.7 million demonstrations for the policy to imitate. On real tabletop pick-and-place with a Franka arm, across 4 rooms and 120 trials, MolmoBot succeeds 79.2% of the time. π0.5-DROID, trained on more than 10,000 hours of real demonstrations, gets 39.2%.`;
export const MATH_BEFORE = String.raw`MolmoBot learns by behavior cloning: it imitates the expert's actions, here with flow matching. Training minimizes `;
// The sign convention follows the released code (molmobot.py): tau = 0 is pure noise and the target velocity is actions minus noise.
export const EQUATION = String.raw`\mathcal{L}(\theta) = \mathbb{E}_{(o,\ell,q,A)\sim\mathcal{D},\;\tau,\;\epsilon}\Big[\big\|v_\theta(A^\tau, \tau, o, \ell, q) - (A - \epsilon)\big\|^2\Big], \quad A^\tau = \tau A + (1-\tau)\,\epsilon`;
export const EQUATION_NARROW = String.raw`\begin{aligned}\mathcal{L}(\theta) &= \mathbb{E}_{(o,\ell,q,A)\sim\mathcal{D},\;\tau,\;\epsilon}\Big[\big\|v_\theta(A^\tau, \tau, o, \ell, q) - (A - \epsilon)\big\|^2\Big]\\ A^\tau &= \tau A + (1-\tau)\,\epsilon\end{aligned}`;
export const MATH_AFTER = String.raw` Here $\mathcal{D}$ is the simulated Franka demonstrations, $o$ the images from a wrist camera and one external camera, $\ell$ the instruction, for example “put the banana in the black bowl”, and $q$ the joint angles. $A$ is the expert's next 16 actions, each a set of joint-position targets, called an action chunk. A mixing time $\tau$ between 0 and 1 blends it with Gaussian noise $\epsilon$ of the same shape into the noisy chunk $A^\tau$. At $\tau = 0$ the chunk is pure noise, and at $\tau = 1$ it's the expert's chunk. The action head $v_\theta$, a DiT (diffusion transformer) that reads the Molmo2 vision-language model layer by layer, predicts the direction from the noise toward the clean chunk. At run time, the policy follows $v_\theta$ in small steps from pure noise to a clean chunk, runs 8 of its 16 actions, then predicts a new chunk. The action head is cheap next to the vision-language model, so the authors draw 8 values of $\tau$ per example and train on them in parallel. Nothing in the loss mentions the real world. The policy only imitates a scripted expert in randomized simulations, so whatever works on the real robot was learned from simulated data.`;

const tex = (source, displayMode = false) => katex.renderToString(source, { displayMode, throwOnError: true, output: 'htmlAndMathml' });

/** Escape prose and prerender each $...$ span with KaTeX, so the page needs no script.
 * Punctuation right after a formula ("$A$,") stays on its line, because browsers may break beside an inline block. */
export function prose(source) {
  return source.split(/(\$[^$]+\$[^\s$]*)/).map((part) => {
    if (!part.startsWith('$')) return esc(part);
    const end = part.lastIndexOf('$'), suffix = part.slice(end + 1), formula = tex(part.slice(1, end));
    return suffix ? `<span class="mb-nobr">${formula}${esc(suffix)}</span>` : formula;
  }).join('');
}

export function render() {
  return `<!-- Generated by scripts/molmobot-canvas.mjs from scripts/molmobot-figures.json. -->
<p class="mb-intro">${prose(INTRO)}</p>
<figure class="mb-canvas">${svg('wide')}${svg('mid')}${svg('tall')}</figure>
<p class="mb-math">${prose(MATH_BEFORE)}<span class="mb-eq mb-eq-wide">${tex(EQUATION, true)}</span><span class="mb-eq mb-eq-narrow">${tex(EQUATION_NARROW, true)}</span>${prose(MATH_AFTER)}</p>
<div class="mb-after"><p class="mb-credit">Deshpande, Guru, Hendrix, Jauhri and 22 coauthors · Ai2, UW, UCLA, TU Darmstadt, Princeton · arXiv · 17 Mar 2026</p><nav class="mb-sources" aria-label="Original sources"><a href="https://arxiv.org/abs/2603.16861">Paper ↗</a><a href="https://allenai.github.io/MolmoBot/">Project ↗</a><a href="https://github.com/allenai/MolmoBot">Code ↗</a></nav></div>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  fs.writeFileSync(OUTPUT, render());
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
}
