/** Draw the Offline Empowerment paper canvas (arXiv 2610.24461) as one blackboard SVG in two layouts.
 *
 * Numbers come from scripts/offline-empowerment-figures.json, which scripts/offline-empowerment-figures.py
 * reads out of the paper: the Fig. 1b empowerment map and the Fig. 4 antmaze-medium / navigate curves.
 * Panels 2 and 5 are schematics. Run `node scripts/offline-empowerment-canvas.mjs` to rewrite
 * content/papers/offline-empowerment.html, then build the site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/offline-empowerment-figures.json'), 'utf8'));
export const OUTPUT = path.join(ROOT, 'content/papers/offline-empowerment.html');

// The RL series palette after its dark-mode filter, invert(.9) hue-rotate(180deg), so the canvas matches it.
const C = {
  bg: '#1d1d1b', ink: '#d6d7d2', muted: '#a2a69e', grid: '#72746d', wall: '#3d3f38',
  red: '#dc896f', blue: '#70a2bf', pink: '#ffa5b9', green: '#8fbf94', yellow: '#f0d98a',
  panel: { blue: '#222a2f', green: '#232b1f', red: '#372925', yellow: '#2d270c', gray: '#272722' },
};
const HAND = "'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive";
const SANS = 'Arial, Helvetica, sans-serif';
const MATH = "Georgia, 'Times New Roman', serif";
export const PANEL = { w: 560, h: 460 };
const HEAT = ['#2c3a4a', '#6e4a6a', '#c9785e', '#f3dc92'];
export const MAP_RANGE = [0.6, 1.4];

const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = (v) => Math.round(v * 10) / 10;

/** Seeded generator, so every build draws the same chalk wobble. */
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function heat(value) {
  const t = Math.max(0, Math.min(1, (value - MAP_RANGE[0]) / (MAP_RANGE[1] - MAP_RANGE[0]))) * (HEAT.length - 1);
  const i = Math.min(HEAT.length - 2, Math.floor(t)), f = t - i;
  const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  const a = rgb(HEAT[i]), b = rgb(HEAT[i + 1]);
  return '#' + a.map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, '0')).join('');
}

// ── Chalk primitives ────────────────────────────────────────────────────────────

function rect(r, x, y, w, h, { stroke = C.ink, width = 2.4, fill = null, jitter = 2.4 } = {}) {
  const j = () => (r() - 0.5) * 2 * jitter;
  const pass = () => `M${n(x + j())},${n(y + j())} Q${n(x + w / 2 + j())},${n(y + j())} ${n(x + w + j())},${n(y + j())} Q${n(x + w + j())},${n(y + h / 2 + j())} ${n(x + w + j())},${n(y + h + j())} Q${n(x + w / 2 + j())},${n(y + h + j())} ${n(x + j())},${n(y + h + j())} Q${n(x + j())},${n(y + h / 2 + j())} ${n(x + j())},${n(y + j())}`;
  return `${fill ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>` : ''}<path d="${pass()} ${pass()}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function head(x, y, angle, color, width, size = 13) {
  const a = (d) => `M${n(x)},${n(y)} L${n(x - size * Math.cos(angle + d))},${n(y - size * Math.sin(angle + d))}`;
  return `<path d="${a(0.45)} ${a(-0.45)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function line(r, x1, y1, x2, y2, { stroke = C.ink, width = 2.2, arrow = false, dash = null, passes = 2 } = {}) {
  const j = (k = 1) => (r() - 0.5) * 2.2 * k;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const d = Array.from({ length: passes }, () => `M${n(x1 + j())},${n(y1 + j())} Q${n(mx + j(1.6))},${n(my + j(1.6))} ${n(x2 + j())},${n(y2 + j())}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${arrow ? head(x2, y2, Math.atan2(y2 - y1, x2 - x1), stroke, width) : ''}`;
}

/** Smooth chalk curve through points (Catmull-Rom as cubic Béziers). */
function curve(points, { stroke = C.ink, width = 2.4, arrow = false, dash = null, opacity = 1 } = {}) {
  let d = `M${n(points[0][0])},${n(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    d += ` C${n(p1[0] + (p2[0] - p0[0]) / 6)},${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)},${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])},${n(p2[1])}`;
  }
  const [a, b] = points.slice(-2);
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>${arrow ? head(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), stroke, width) : ''}`;
}

function text(x, y, value, { size = 22, fill = C.ink, anchor = 'start', font = SANS, weight = null, italic = false, extra = '' } = {}) {
  return `<text x="${n(x)}" y="${n(y)}" font-family="${esc(font)}" font-size="${size}" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${weight ? ` font-weight="${weight}"` : ''}${italic ? ' font-style="italic"' : ''}${extra}>${esc(value)}</text>`;
}

/** Math label: strings stay on the baseline, [text, 'sup' | 'sub'] pieces shift. */
function math(x, y, parts, { size = 24, fill = C.ink, anchor = 'start' } = {}) {
  let shift = 0, body = '';
  for (const part of parts) {
    const [value, kind] = typeof part === 'string' ? [part, null] : part;
    const target = kind === 'sup' ? -0.36 * size : kind === 'sub' ? 0.24 * size : 0;
    const dy = n(target - shift);
    body += `<tspan${dy ? ` dy="${dy}"` : ''}${kind ? ` font-size="${Math.round(size * 0.68)}"` : ''}>${esc(value)}</tspan>`;
    shift = target;
  }
  return `<text x="${n(x)}" y="${n(y)}" font-family="${esc(MATH)}" font-size="${size}" font-style="italic" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${body}</text>`;
}

function tag(r, label, { x = 16, y = -21, size = 27 } = {}) {
  const w = Math.round(label.length * size * 0.5 + 30);
  return rect(r, x, y, w, 42, { fill: C.bg, width: 2 }) + text(x + 14, y + 30, label, { font: HAND, size, weight: 700 });
}

// ── Maze helpers (Fig. 1b orientation: row 0 is the top of the maze) ─────────────

const MAZE = DATA.map.maze;
const open = (row, col) => row >= 0 && row < 6 && col >= 0 && col < 6 && !MAZE[row][col];

function walls(r, x0, y0, cell) {
  let out = '';
  MAZE.forEach((row, i) => row.forEach((wall, j) => {
    if (!wall) return;
    const x = x0 + j * cell, y = y0 + i * cell;
    out += `<rect x="${n(x)}" y="${n(y)}" width="${cell}" height="${cell}" fill="${C.wall}"/>`;
    const hatch = [];
    for (let k = 1; k <= 3; k++) {
      const t = (cell * k) / 3;
      hatch.push(`M${n(x + t)},${n(y + 2)} L${n(x + 2)},${n(y + t)}`);
      if (k < 3) hatch.push(`M${n(x + cell - 2)},${n(y + t)} L${n(x + t)},${n(y + cell - 2)}`);
    }
    out += `<path d="${hatch.join(' ')}" stroke="${C.grid}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  }));
  return out + rect(r, x0, y0, cell * 6, cell * 6, { width: 2.6 });
}

function route(from, to) {
  const key = ([a, b]) => `${a},${b}`, previous = new Map([[key(from), null]]), queue = [from];
  while (queue.length) {
    const cell = queue.shift();
    if (key(cell) === key(to)) break;
    for (const [di, dj] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const next = [cell[0] + di, cell[1] + dj];
      if (open(...next) && !previous.has(key(next))) { previous.set(key(next), cell); queue.push(next); }
    }
  }
  const path = [];
  for (let cell = to; cell; cell = previous.get(key(cell))) path.unshift(cell);
  return path;
}

/** Empowerment read from the Fig. 1b grid at a maze position given in cell units. */
export function mapValue(row, col) {
  const sub = DATA.map.sub, grid = DATA.map.grid;
  const i = Math.max(0, Math.min(grid.length - 1, Math.floor(row * sub))), j = Math.max(0, Math.min(grid.length - 1, Math.floor(col * sub)));
  return grid[i][j];
}

function heatCells(x0, y0, cell, opacity = 1) {
  const sub = DATA.map.sub, size = cell / sub;
  let out = '';
  DATA.map.grid.forEach((row, i) => row.forEach((value, j) => {
    if (value === null) return;
    out += `<rect x="${n(x0 + j * size)}" y="${n(y0 + i * size)}" width="${n(size + 0.4)}" height="${n(size + 0.4)}" fill="${heat(value)}"/>`;
  }));
  return opacity < 1 ? `<g opacity="${opacity}">${out}</g>` : out;
}

// ── Panels (local coordinates, 560 × 460) ─────────────────────────────────────────

function frame(r, title, fill) {
  return rect(r, 0, 0, PANEL.w, PANEL.h, { fill, width: 2.6 }) + tag(r, title);
}

function panelData() {
  const r = random(11), x0 = 24, y0 = 58, cell = 52;
  const c = ([i, j]) => [x0 + (j + 0.5) * cell, y0 + (i + 0.5) * cell];
  let out = frame(r, '1 · unlabeled data', C.panel.blue) + walls(r, x0, y0, cell);
  const trips = [[[5, 0], [0, 2]], [[0, 5], [4, 1]], [[5, 5], [1, 0]], [[2, 5], [5, 1]], [[0, 0], [3, 3]]];
  for (const [from, to] of trips) {
    const pts = route(from, to).map(c).map(([x, y], k, all) => (k === 0 || k === all.length - 1 ? [x, y] : [x + (r() - 0.5) * 16, y + (r() - 0.5) * 16]));
    out += `<circle cx="${n(pts[0][0])}" cy="${n(pts[0][1])}" r="4" fill="${C.ink}" opacity=".85"/>` + curve(pts, { width: 2.2, arrow: true, opacity: 0.85 });
  }
  out += rect(r, 354, 88, 188, 72, { width: 2.2 }) + math(448, 135, ['(s, a, s′)'], { size: 34, anchor: 'middle' });
  const struck = (y, label) => text(448, y, label, { size: 27, anchor: 'middle' }) + line(r, 448 - label.length * 7.4, y - 9, 448 + label.length * 7.4, y - 9, { stroke: C.red, width: 2.4 });
  out += struck(222, 'reward') + struck(276, 'skill label');
  out += text(x0, 412, 'OGBench · antmaze-medium-navigate', { size: 23, fill: C.muted });
  return out;
}

const SKILLS = [C.blue, C.red, C.green, C.pink];

function cloud(x, y, rx, ry, color) {
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${rx}" ry="${ry}" fill="${color}" fill-opacity=".32" stroke="${color}" stroke-width="2" stroke-dasharray="3 4"/>`;
}

function panelSkills() {
  const r = random(23);
  let out = frame(r, '2 · skills → futures', C.panel.green);
  out += math(280, 84, ['Ê(s) = I(s', ['+', 'sup'], ' ; z | s)'], { size: 34, anchor: 'middle' });
  const block = (x, y, w, h) => `<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" fill="${C.wall}"/>` + rect(r, x, y, w, h, { stroke: C.grid, width: 1.6, jitter: 1.4 });
  // Junction: four corridors, so each skill can reach a different future.
  const [jx, jy] = [145, 238];
  for (const [dx, dy] of [[-100, -100], [32, -100], [-100, 32], [32, 32]]) out += block(jx + dx, jy + dy, 68, 68);
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([ux, uy], k) => {
    out += cloud(jx + ux * 80, jy + uy * 80, ux ? 22 : 26, ux ? 26 : 22, SKILLS[k]) + line(r, jx + ux * 12, jy + uy * 12, jx + ux * 62, jy + uy * 62, { stroke: SKILLS[k], width: 2.6, arrow: true });
  });
  out += `<circle cx="${jx}" cy="${jy}" r="7" fill="${C.ink}"/>`;
  // Dead end: one way out, so every skill reaches the same place.
  const [dx0, dy0] = [415, 238];
  out += block(dx0 - 100, dy0 - 100, 68, 200) + block(dx0 + 32, dy0 - 100, 68, 200) + block(dx0 - 32, dy0 - 100, 64, 22);
  [-12, -4, 4, 12].forEach((offset, k) => {
    out += cloud(dx0 + offset * 0.5, dy0 + 66, 24, 26, SKILLS[k]) + line(r, dx0 + offset * 0.4, dy0 - 40, dx0 + offset, dy0 + 34, { stroke: SKILLS[k], width: 2.6, arrow: true });
  });
  out += `<circle cx="${dx0}" cy="${dy0 - 50}" r="7" fill="${C.ink}"/>`;
  out += math(jx, 380, ['high Ê'], { size: 30, anchor: 'middle', fill: C.yellow }) + math(dx0, 380, ['low Ê'], { size: 30, anchor: 'middle', fill: C.muted });
  out += line(r, 30, 424, 70, 424, { stroke: C.blue, width: 2.6, arrow: true }) + math(80, 433, ['π(a | s, z)'], { size: 27 });
  out += cloud(316, 424, 18, 13, C.red) + math(344, 433, ['V', ['z', 'sup'], '(s', ['+', 'sup'], ' | s)'], { size: 27 });
  return out;
}

function panelMap() {
  const r = random(37), x0 = 24, y0 = 58, cell = 52;
  let out = frame(r, '3 · empowerment map', C.panel.gray) + heatCells(x0, y0, cell) + walls(r, x0, y0, cell);
  const [bx, by, bw, bh, steps] = [384, 92, 26, 250, 25];
  for (let k = 0; k < steps; k++) {
    const value = MAP_RANGE[1] - ((k + 0.5) / steps) * (MAP_RANGE[1] - MAP_RANGE[0]);
    out += `<rect x="${bx}" y="${n(by + (k * bh) / steps)}" width="${bw}" height="${n(bh / steps + 0.5)}" fill="${heat(value)}"/>`;
  }
  out += rect(r, bx, by, bw, bh, { width: 2 });
  out += math(bx + bw / 2, by - 20, ['Ê(s)'], { size: 30, anchor: 'middle' });
  out += text(bx + bw + 10, by + 9, MAP_RANGE[1].toFixed(1), { size: 24 }) + text(bx + bw + 10, by + bh + 5, MAP_RANGE[0].toFixed(1), { size: 24 });
  out += text(bx + bw + 10, by + bh + 34, 'nats', { size: 24, fill: C.muted });
  out += text(x0, 412, 'read from paper Fig. 1b', { size: 23, fill: C.muted });
  return out;
}

export const EPISODE = [[5, 0], [4, 0], [4, 1], [3, 1], [3, 2], [3, 3], [2, 3], [2, 4], [2, 5], [1, 5], [0, 5]];

/** Empowerment along the sketched episode, sampled from the Fig. 1b grid. */
export function episodeValues(samples = 4) {
  const values = [];
  for (let k = 0; k < EPISODE.length - 1; k++) {
    const [a, b] = [EPISODE[k], EPISODE[k + 1]];
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      values.push(mapValue(a[0] + 0.5 + (b[0] - a[0]) * t, a[1] + 0.5 + (b[1] - a[1]) * t));
    }
  }
  const last = EPISODE.at(-1);
  values.push(mapValue(last[0] + 0.5, last[1] + 0.5));
  return values;
}

function panelBonus() {
  const r = random(41), x0 = 24, y0 = 58, cell = 52;
  const c = ([i, j]) => [x0 + (j + 0.5) * cell, y0 + (i + 0.5) * cell];
  let out = frame(r, '4 · bonus', C.panel.red) + heatCells(x0, y0, cell, 0.42) + walls(r, x0, y0, cell);
  const pts = EPISODE.map(c).map(([x, y], k, all) => (k === 0 || k === all.length - 1 ? [x, y] : [x + (r() - 0.5) * 12, y + (r() - 0.5) * 12]));
  out += curve(pts, { width: 3.2, arrow: true });
  const values = episodeValues(), best = values.indexOf(Math.max(...values));
  const bestCell = Math.floor(best / 4), bestPoint = pts[bestCell];
  out += star(bestPoint[0], bestPoint[1], 12, C.yellow);
  out += `<circle cx="${n(pts[0][0])}" cy="${n(pts[0][1])}" r="8" fill="none" stroke="${C.ink}" stroke-width="2.4"/>` + text(pts[0][0], 396, 'start', { size: 23, anchor: 'middle', fill: C.muted });
  // Ê along the episode, and the single regression target every step receives.
  const [px, py, pw, ph] = [372, 96, 166, 150];
  const yv = (v) => py + ph - ((v - MAP_RANGE[0]) / (MAP_RANGE[1] - MAP_RANGE[0])) * ph;
  const xv = (k) => px + (k / (values.length - 1)) * pw;
  out += line(r, px, py - 8, px, py + ph, { width: 2 }) + line(r, px, py + ph, px + pw + 8, py + ph, { width: 2 });
  out += curve(values.map((v, k) => [xv(k), yv(v)]), { stroke: C.ink, width: 2.4 });
  out += line(r, px + 2, yv(values[best]), px + pw, yv(values[best]), { stroke: C.pink, width: 3, dash: '8 6', passes: 1 });
  out += star(xv(best), yv(values[best]), 10, C.yellow);
  out += math(px + 4, py - 18, ['Ê(s', ['k', 'sub'], ')'], { size: 27 }) + math(px + pw + 6, py + ph + 30, ['k'], { size: 27, anchor: 'end' });
  out += math(px + pw + 4, yv(values[best]) - 10, ['B'], { size: 27, fill: C.pink, anchor: 'end' });
  out += math(x0, 442, ['B(s', ['t', 'sub'], ', a', ['t', 'sub'], ')  ←  max', ['k', 'sub'], ' Ê(s', ['k', 'sub'], ')'], { size: 30, fill: C.pink });
  return out;
}

function star(x, y, size, color) {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? size * 0.45 : size;
    return `${n(x + rr * Math.cos(a))},${n(y + rr * Math.sin(a))}`;
  });
  return `<polygon points="${pts.join(' ')}" fill="${color}" stroke="${C.bg}" stroke-width="1.2"/>`;
}

function cylinder(r, x, y, w, h, label, fill) {
  return `<rect x="${x}" y="${y + 8}" width="${w}" height="${h - 8}" fill="${fill}"/><ellipse cx="${x + w / 2}" cy="${y + h}" rx="${w / 2}" ry="8" fill="${fill}"/>` +
    `<path d="M${x},${y + 8} L${x},${y + h} A${w / 2},8 0 0 0 ${x + w},${y + h} L${x + w},${y + 8}" fill="none" stroke="${C.ink}" stroke-width="2.2"/>` +
    `<ellipse cx="${x + w / 2}" cy="${y + 8}" rx="${w / 2}" ry="8" fill="${fill}" stroke="${C.ink}" stroke-width="2.2"/>` +
    text(x + w / 2, y + h / 2 + 15, label, { size: 24, anchor: 'middle' });
}

function panelExplore() {
  const r = random(53);
  let out = frame(r, '5 · explore: CRL + RLPD', C.panel.yellow);
  // A small goal-reaching world: the reward arrives only at the flag g.
  const [ex, ey, ec] = [30, 58, 38];
  [[0, 0, 0], [1, 1, 0], [0, 0, 0]].forEach((row, i) => row.forEach((wall, j) => {
    if (wall) out += `<rect x="${ex + j * ec}" y="${ey + i * ec}" width="${ec}" height="${ec}" fill="${C.wall}"/>`;
  }));
  out += rect(r, ex, ey, ec * 3, ec * 3, { width: 2.4 });
  out += `<circle cx="${ex + ec / 2}" cy="${ey + ec * 2.5}" r="7" fill="${C.ink}"/>`;
  out += `<path d="M${ex + ec * 0.4},${ey + ec * 0.85} L${ex + ec * 0.4},${ey + 8} L${ex + ec * 0.9},${ey + 15} L${ex + ec * 0.4},${ey + 22}" fill="${C.red}" stroke="${C.red}" stroke-width="2.2" stroke-linejoin="round"/>`;
  out += math(ex + ec * 1.1, ey + ec * 0.66, ['g'], { size: 30, fill: C.red });
  out += line(r, ex + ec * 1.5, ey + ec * 3 + 6, ex + ec * 1.5, 226, { arrow: true });
  out += cylinder(r, 20, 232, 150, 64, 'online', '#2c3a4a') + cylinder(r, 20, 340, 150, 64, 'offline data', C.panel.gray);
  // Each update batch: half online replay, half offline data (RLPD).
  const [bx, by] = [204, 300];
  out += `<rect x="${bx}" y="${by}" width="52" height="46" fill="#2c3a4a"/><rect x="${bx + 52}" y="${by}" width="52" height="46" fill="#3a3a33"/>` + rect(r, bx, by, 104, 46, { width: 2.2 });
  out += text(bx + 26, by + 32, '½', { size: 26, anchor: 'middle' }) + text(bx + 78, by + 32, '½', { size: 26, anchor: 'middle' });
  out += text(bx + 52, by - 14, 'batch', { size: 26, anchor: 'middle', font: HAND, weight: 700 });
  out += line(r, 174, 272, bx - 6, by + 14, { arrow: true }) + line(r, 174, 368, bx - 6, by + 36, { arrow: true });
  // The actor gets the bonus; the critic stays the CRL critic.
  const [ax, ay, aw, ah] = [332, 168, 212, 140];
  out += rect(r, ax, ay, aw, ah, { width: 2.6, fill: C.bg });
  out += text(ax + aw / 2, ay + 32, 'actor', { size: 27, anchor: 'middle', font: HAND, weight: 700 });
  out += math(ax + 14, ay + 76, ['Q(s, a, g)'], { size: 29 }) + math(ax + 14, ay + 118, ['+ β · B(s, a)'], { size: 29, fill: C.pink });
  out += line(r, bx + 108, by + 18, ax - 6, ay + ah - 30, { arrow: true });
  out += curve([[ax + 40, ay - 4], [ax - 30, 96], [ex + ec * 3 + 10, ey + ec * 1.2]], { width: 2.4, arrow: true });
  out += math(ax - 34, 112, ['a'], { size: 30, anchor: 'end' });
  // β fades to zero by the middle of training.
  const [sx, sy, sw, sh] = [366, 346, 170, 52];
  out += line(r, sx, sy + sh, sx + sw, sy + sh, { width: 2 }) + line(r, sx, sy - 4, sx, sy + sh, { width: 2 });
  out += `<path d="M${sx},${sy} L${sx + sw / 2},${sy + sh} L${sx + sw},${sy + sh}" fill="none" stroke="${C.pink}" stroke-width="3" stroke-linecap="round"/>`;
  out += math(sx - 10, sy + 14, ['β'], { size: 30, anchor: 'end', fill: C.pink }) + text(sx + sw / 2, sy + sh + 28, '½', { size: 24, anchor: 'middle', fill: C.muted }) + text(sx + sw, sy + sh + 28, 'steps', { size: 24, anchor: 'end', fill: C.muted });
  return out;
}

export const FAMILIES = [
  { name: 'CRL', color: C.blue, plot: 'crl', without: 'CRL', with: 'CRL + Emp' },
  { name: 'CRL + RND', color: C.red, plot: 'crl', without: 'CRL + RND', with: 'CRL + RND + Emp' },
  { name: 'SUPE', color: C.pink, plot: 'supe', without: 'SUPE', with: 'SUPE + Emp' },
];

function panelResult() {
  const r = random(67);
  let out = frame(r, '6 · antmaze-medium result', C.panel.gray);
  out += text(PANEL.w - 16, 52, 'Fig. 4 · navigate data · 5 seeds', { size: 21, anchor: 'end', fill: C.muted });
  const plots = { crl: [80, 78], supe: [340, 78] }, [pw, ph] = [182, 160];
  for (const [key, [px, py]] of Object.entries(plots)) {
    for (const level of [0.5]) out += `<path d="M${px},${n(py + ph * (1 - level))} H${px + pw}" stroke="${C.grid}" stroke-width="1.2" stroke-dasharray="2 5"/>`;
    out += line(r, px, py - 4, px, py + ph, { width: 2 }) + line(r, px, py + ph, px + pw + 4, py + ph, { width: 2 });
    out += text(px - 9, py + 8, '1', { size: 24, anchor: 'end' }) + text(px - 9, py + ph + 7, '0', { size: 24, anchor: 'end' });
    out += text(px, py + ph + 30, '0', { size: 24, anchor: 'middle', fill: C.muted }) + text(px + pw, py + ph + 30, DATA.curves[key].xmax, { size: 24, anchor: 'middle', fill: C.muted });
    for (const family of FAMILIES.filter((f) => f.plot === key)) {
      for (const [series, dash] of [[family.without, '9 7'], [family.with, null]]) {
        const pts = DATA.curves[key].series[series].map(([x, y]) => `${n(px + x * pw)},${n(py + ph * (1 - y))}`);
        out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${family.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
      }
    }
  }
  out += text(32, 158, 'success', { size: 22, anchor: 'middle', fill: C.muted, extra: ' transform="rotate(-90 32 158)"' });
  out += text(PANEL.w / 2 + 4, 298, 'env steps', { size: 22, anchor: 'middle', fill: C.muted });
  out += line(r, 28, 328, 72, 328, { width: 3, dash: '9 7', passes: 1 }) + math(82, 337, ['without Ê'], { size: 27 });
  out += line(r, 262, 328, 306, 328, { width: 3, passes: 1 }) + math(316, 337, ['with Ê'], { size: 27 });
  out += text(28, 376, 'CRL', { size: 26, fill: C.blue, weight: 700 }) + text(108, 376, 'CRL + RND', { size: 26, fill: C.red, weight: 700 }) + text(268, 376, 'SUPE', { size: 26, fill: C.pink, weight: 700 });
  // Section 6.3 verdicts for adding Ê to CRL on all nine task and dataset pairs.
  const verdicts = [...DATA.tally].sort((a, b) => (a.vs_crl === b.vs_crl ? 0 : a.vs_crl === 'better' ? -1 : 1));
  verdicts.forEach((v, k) => {
    const x = 44 + k * 32, y = 420, better = v.vs_crl === 'better';
    out += `<circle cx="${x}" cy="${y}" r="14" fill="${better ? C.yellow : 'none'}" stroke="${better ? C.yellow : C.muted}" stroke-width="2"/>`;
    out += text(x, y + 7, better ? '↑' : '=', { size: 20, anchor: 'middle', fill: better ? C.bg : C.muted, weight: 700 });
  });
  out += math(334, 414, ['+ Ê vs CRL'], { size: 25 }) + text(334, 443, '9 task · data pairs', { size: 22, fill: C.muted });
  return out;
}

export const PANELS = [panelData, panelSkills, panelMap, panelBonus, panelExplore, panelResult];

// ── Layouts ──────────────────────────────────────────────────────────────────────

function snowflake(x, y, size, color) {
  const arms = [0, 60, 120].map((deg) => {
    const a = (deg * Math.PI) / 180, dx = size * Math.cos(a), dy = size * Math.sin(a);
    return `M${n(x - dx)},${n(y - dy)} L${n(x + dx)},${n(y + dy)}`;
  });
  return `<path d="${arms.join(' ')}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
}

export const LAYOUTS = {
  wide: {
    width: 1860, height: 1180,
    panels: [[40, 80], [650, 80], [1260, 80], [40, 696], [650, 696], [1260, 696]],
    overlay(r) {
      let out = tag(r, 'offline · logged data only, no environment', { x: 40, y: 10, size: 28 });
      for (const [x, y] of [[600, 310], [1210, 310], [600, 926], [1210, 926]]) out += line(r, x + 6, y, x + 44, y, { width: 2.6, arrow: true });
      out += `<path d="M40,596 H1820" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'online · sparse-reward goals', { x: 40, y: 610, size: 28 });
      out += curve([[1540, 546], [1420, 600], [1000, 606], [620, 620], [500, 688]], { stroke: C.yellow, width: 3, arrow: true });
      out += math(1040, 580, ['Ê'], { size: 34, fill: C.yellow, anchor: 'end' }) + text(1052, 580, 'frozen', { size: 28, fill: C.yellow, font: HAND, weight: 700 }) + snowflake(1168, 570, 12, C.yellow);
      return out;
    },
  },
  tall: {
    width: 640, height: 3310,
    panels: [[40, 80], [40, 600], [40, 1120], [40, 1770], [40, 2290], [40, 2810]],
    overlay(r) {
      let out = tag(r, 'offline · logged data only', { x: 40, y: 10, size: 28 });
      for (const y of [540, 1060, 2230, 2750]) out += line(r, 480, y + 6, 480, y + 54, { width: 2.6, arrow: true });
      out += `<path d="M40,1660 H600" stroke="${C.muted}" stroke-width="2" stroke-dasharray="10 9"/>`;
      out += tag(r, 'online · sparse-reward goals', { x: 40, y: 1682, size: 28 });
      out += line(r, 480, 1586, 480, 1764, { stroke: C.yellow, width: 3, arrow: true });
      out += math(462, 1632, ['Ê'], { size: 34, fill: C.yellow, anchor: 'end' }) + snowflake(504, 1622, 12, C.yellow) + text(520, 1632, 'frozen', { size: 28, fill: C.yellow, font: HAND, weight: 700 });
      return out;
    },
  },
};

const final = (plot, series) => DATA.curves[plot].series[series].at(-1)[1].toFixed(2);
const TITLE = 'Offline empowerment, from logged data to online exploration';
const DESC = 'Offline: from unlabeled OGBench transitions (s, a, s′) with no reward and no skill labels, the method learns a skill-conditioned policy and where each skill leads, V^z(s+ | s). '
  + 'Empowerment Ê(s) = I(s+; z | s) is high at a junction, where skills reach different futures, and low in a dead end, where all futures overlap. '
  + 'The map read from the paper (Fig. 1b, antmaze-medium) peaks near 1.4 nats at the corridor junctions and falls to about 0.6 in the corners. '
  + 'Online: the frozen estimator scores each state of an episode. A bonus network B(s, a) learns the episode maximum of Ê. The actor maximizes Q(s, a, g) + β·B(s, a); '
  + 'the critic is contrastive RL (CRL), each batch is half online and half offline data (RLPD), and β falls to zero by mid-training. '
  + `Result on antmaze-medium with navigate data (Fig. 4, 5 seeds): final success rises ${FAMILIES.map((f) => `from ${final(f.plot, f.without)} to ${final(f.plot, f.with)} for ${f.name}`).join(', ')}. `
  + 'Across all nine task and dataset pairs, adding Ê helps CRL on five and is on par on four.';

export function svg(name) {
  const layout = LAYOUTS[name], r = random(name === 'wide' ? 3 : 5);
  const panels = PANELS.map((draw, k) => `<g transform="translate(${layout.panels[k][0]} ${layout.panels[k][1]})">${draw()}</g>`).join('');
  return `<svg class="oe-${name}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="oe-${name}-title oe-${name}-desc" xmlns="http://www.w3.org/2000/svg">` +
    `<title id="oe-${name}-title">${esc(TITLE)}</title><desc id="oe-${name}-desc">${esc(DESC)}</desc>` +
    `<rect width="${layout.width}" height="${layout.height}" fill="${C.bg}"/>${panels}${layout.overlay(r)}</svg>`;
}

export function render() {
  return `<!-- Generated by scripts/offline-empowerment-canvas.mjs from scripts/offline-empowerment-figures.json. -->
<figure class="oe-canvas">${svg('wide')}${svg('tall')}</figure>
<div class="oe-after"><p class="oe-credit">Garg, Myers, Li, Ji, Eysenbach, Levine · arXiv · 17 Oct 2026</p><nav class="oe-sources" aria-label="Original sources"><a href="https://arxiv.org/abs/2610.24461">Paper ↗</a><a href="https://github.com/ishirgarg/offline-empowerment">Code ↗</a></nav></div>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  fs.writeFileSync(OUTPUT, render());
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
}
