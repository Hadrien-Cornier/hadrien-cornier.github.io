// Draws the six inline SVG figures of content/robotics/can-you-zero-shot-robotics-with-a-coding-agent.md
// in the shared chalk style (assets/robotics/chalk/chalk.css) and splices each one over the <svg> that
// carries the same aria-labelledby ids. Run from the repository root:
//   node scripts/zero-shot-figures.mjs           writes the six figures into the article
//   node scripts/zero-shot-figures.mjs --print   prints the markup and changes nothing
// Every value below is the value that the old light figures printed. Those come from the ASPIRE paper,
// which the figure notes cite as "P2": Table 6 (Robosuite), Table 5 (LIBERO-Pro), Table 18 (models,
// agent time), Sec. 3.7 and Fig. 6(b) (Rubik's Cube). Bar lengths are computed from the values; a 0% bar
// keeps the 1-unit stub of the old figures so that the row still shows a bar.
// The page must load chalk.css and the #bb-chalk filter once (see assets/robotics/chalk/README.md).
import { readFileSync, writeFileSync } from 'node:fs';
import { esc, n } from './chalk.mjs';

const W = 480;
const ARTICLE = new URL('../content/robotics/can-you-zero-shot-robotics-with-a-coding-agent.md', import.meta.url);

// Fill for each series. chalk.css has a --bb-slate token but no c-slate class, so pi0.5 uses the token.
const PAINT = {
  red: 'class="c-red"', blue: 'class="c-blue"', dim: 'class="c-dim"', slate: 'style="fill:var(--bb-slate)"',
};

// halo: a board-colored stroke under the letters, so a grid line that runs behind a label breaks around it.
function text(x, y, value, { size = 15, cls = 'c-chalk', anchor = 'start', halo = false } = {}) {
  const paint = halo ? `class="${cls} s-board" stroke-width="5" paint-order="stroke"` : `class="${cls}"`;
  return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" ${paint}${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${esc(value)}</text>`;
}

function svg({ id, height, style, title, desc, body }) {
  return `<svg class="chalk chalk-filter" viewBox="0 0 ${W} ${n(height)}" role="img" aria-labelledby="${id}-t ${id}-d" style="${style}" xmlns="http://www.w3.org/2000/svg">`
    + `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${body}</svg>`;
}

/** Centered lines (title or notes) from baseline y, with a fixed line step. Returns [markup, last baseline]. */
function lines(list, y, { size = 15, cls = 'c-dim', step = 21 } = {}) {
  const out = list.map((line, i) => text(W / 2, y + i * step, line, { size, cls, anchor: 'middle' })).join('');
  return [out, y + (list.length - 1) * step];
}

/** Horizontal bars: one group per category, one bar per series, a value label after each bar. */
function hbars(spec) {
  const { id, style, title, desc, heading, legend = [], groups, max, ticks, tickLabel, notes,
    labelX, x0, length, bar, gap = 2, groupGap } = spec;
  const scale = (v) => (v / max) * length;
  let body = '';
  const [head, headY] = lines(heading, 30, { size: 17.5, cls: 'chalk-title', step: 23 });
  body += head;
  let top = headY + 18;
  if (legend.length) {
    let x = x0;
    const y = headY + 30;
    for (const item of legend) {
      body += `<rect x="${n(x)}" y="${n(y - 11)}" width="13" height="13" ${PAINT[item.paint]}/>` + text(x + 19, y, item.label);
      x += 19 + item.width + 18;
    }
    top = y + 16;
  }
  const k = groups[0].bars.length;
  const gh = k * bar + (k - 1) * gap;
  const bottom = top + groups.length * (gh + groupGap);
  for (const t of ticks) {
    const x = x0 + scale(t);
    body += `<line x1="${n(x)}" y1="${n(top)}" x2="${n(x)}" y2="${n(bottom)}" class="s-faint" stroke-width="1"/>`
      + text(x, bottom + 19, tickLabel(t), { cls: 'c-dim', anchor: 'middle' });
  }
  groups.forEach((group, gi) => {
    const gy = top + groupGap / 2 + gi * (gh + groupGap);
    body += text(labelX, gy + gh / 2 + 5.5, group.label, { anchor: 'end' });
    group.bars.forEach((b, bi) => {
      const y = gy + bi * (bar + gap);
      const w = Math.max(scale(b.value), 1);
      body += `<rect x="${x0}" y="${n(y)}" width="${n(w)}" height="${bar}" ${PAINT[b.paint]}/>`
        + text(x0 + w + 6, y + bar / 2 + 5, b.label, { halo: true });
    });
  });
  const [foot, footY] = lines(notes, bottom + 46);
  body += foot;
  return svg({ id, height: footY + 15, style, title, desc, body });
}

const pct = (v) => `${v}%`;
const STYLE = 'display:block;width:100%;height:auto;max-width:600px;margin:0 auto';

// P2 Table 6: success over 100 held-out trials per task, CaP-Agent0 against ASPIRE (Opus 4.6).
const ROBOSUITE = [
  ['cube_lift', 97, 97], ['cube_stack', 98, 99], ['cube_restack', 89, 100], ['spill_wipe', 100, 99],
  ['two_arm_handover', 20, 92], ['two_arm_lift', 74, 71], ['nut_assembly', 0, 9],
];

function robosuite() {
  return hbars({
    id: 'fig-robosuite', style: STYLE,
    title: 'Robosuite: ASPIRE and the CaP-Agent0 baseline, seven tasks',
    desc: 'Paired horizontal bars of success on seven Robosuite tasks for the CaP-Agent0 baseline and for ASPIRE with Claude Opus 4.6. The largest gap is two_arm_handover, 20 percent against 92 percent. ASPIRE is lower on two_arm_lift, 74 against 71, and on spill_wipe, 100 against 99.',
    heading: ['Robosuite: ASPIRE and the CaP-Agent0 baseline, seven tasks'],
    legend: [{ label: 'CaP-Agent0', paint: 'dim', width: 64 }, { label: 'ASPIRE (Opus 4.6)', paint: 'red', width: 100 }],
    groups: ROBOSUITE.map(([label, cap, aspire]) => ({ label, bars: [
      { value: cap, paint: 'dim', label: pct(cap) }, { value: aspire, paint: 'red', label: pct(aspire) },
    ] })),
    max: 100, ticks: [0, 25, 50, 75, 100], tickLabel: pct,
    labelX: 124, x0: 132, length: 296, bar: 15, gap: 4, groupGap: 16,
    notes: ['Success over 100 held-out trials per task. Mean: 68% against 81%.',
      'P2 Table 6. CaP-Agent0 regenerates a program per seed, with retries.'],
  });
}

// P2 Table 5: LIBERO-Pro macro-average success, pi0.5, CaP-Agent0 and ASPIRE (Opus 4.6).
const LIBERO = [
  ['Object, position', 17, 22, 98], ['Object, task', 1, 18, 95], ['Goal, position', 38, 26, 81],
  ['Goal, task', 0, 17, 45], ['Spatial, position', 20, 12, 51], ['Spatial, task', 1, 14, 60],
];

function libero() {
  return hbars({
    id: 'fig-libero', style: STYLE,
    title: 'LIBERO-Pro: three methods, six conditions',
    desc: 'Grouped horizontal bars of success on LIBERO-Pro Object, Goal and Spatial suites under position and task perturbations for pi0.5, CaP-Agent0 and ASPIRE with Claude Opus 4.6. ASPIRE leads in every condition. Its Goal task perturbation score of 45 percent is the lowest, and pi0.5 scores near zero under task perturbations.',
    heading: ['LIBERO-Pro: three methods, six conditions'],
    legend: [{ label: 'pi0.5', paint: 'slate', width: 30 }, { label: 'CaP-Agent0', paint: 'dim', width: 64 },
      { label: 'ASPIRE (Opus 4.6)', paint: 'red', width: 100 }],
    groups: LIBERO.map(([label, pi, cap, aspire]) => ({ label, bars: [
      { value: pi, paint: 'slate', label: pct(pi) }, { value: cap, paint: 'dim', label: pct(cap) },
      { value: aspire, paint: 'red', label: pct(aspire) },
    ] })),
    max: 100, ticks: [0, 25, 50, 75, 100], tickLabel: pct,
    labelX: 116, x0: 124, length: 304, bar: 15, gap: 4, groupGap: 16,
    notes: ['Macro-average over 10 tasks x 50 held-out seeds per condition.',
      'P2 Table 5. OpenVLA and pi0 scored 0% in all six conditions.'],
  });
}

// P2 Table 18: LIBERO-Pro Goal, position perturbation, 10 tasks x 50 held-out seeds, empty library, no search.
// [model, held-out success %, estimated cost of the 10 tasks in $, agent time per task in min, bar color].
// The old success chart colored bars by tier: red 95% or higher, blue 68% to 94.4%, gray 59.2% or lower.
const MODELS = [
  ['Claude Opus 5.5', 99.2, 183, 51, 'red'], ['Claude Sonnet 5.5', 98.8, 121, 56, 'red'],
  ['Claude Fable 5.1', 96.6, 422, 68, 'red'], ['GPT-6 Astra', 94.4, 354, 31, 'blue'],
  ['Claude Opus 5', 90.6, 597, 76, 'blue'], ['GPT-6.1 Sol', 88, 95, 49, 'blue'],
  ['Kimi K3 (open)', 78.4, 582, 139, 'blue'], ['Claude Haiku 5.5', 68, 40, 54, 'blue'],
  ['GPT-6 Sol', 59.2, 76, 42, 'dim'], ['Qwen 3.8 Max (open)', 56, 398, 103, 'dim'],
  ['Claude Opus 4.6', 55.6, 236, 61, 'dim'], ['GPT-6 Luna', 14.8, 8, 47, 'dim'],
];

function models() {
  return hbars({
    id: 'fig-models', style: STYLE,
    title: 'Same robot loop, twelve models: held-out success and cost',
    desc: 'Horizontal bars of held-out success for twelve language models on the ten LIBERO-Pro Goal tasks under position perturbation, with the estimated total API cost for the ten tasks. Success runs from 14.8 percent for GPT-6 Luna to 99.2 percent for Claude Opus 5.5. Cost does not track success.',
    heading: ['Same robot loop, twelve models: held-out success and cost'],
    groups: MODELS.map(([label, success, cost, , paint]) => ({ label, bars: [
      { value: success, paint, label: `${success}%  ·  $${cost}` },
    ] })),
    max: 100, ticks: [0, 25, 50, 75, 100], tickLabel: pct,
    labelX: 128, x0: 136, length: 256, bar: 17, groupGap: 9,
    notes: ['Bar: held-out success. Label: success and estimated cost of all 10 tasks.',
      'LIBERO-Pro Goal, 10 tasks x 50 seeds, empty library. P2 Table 18.'],
  });
}

function time() {
  // The old chart sorts the models from the shortest to the longest agent time.
  const rows = [...MODELS].sort((a, b) => a[3] - b[3]);
  return hbars({
    id: 'fig-time', style: STYLE,
    title: 'Agent time to build and debug one task program',
    desc: 'Horizontal bars of mean agent time per task, in minutes, for twelve models in the ASPIRE debugging loop on LIBERO-Pro Goal, position perturbation. Times run from 31 minutes for GPT-6 Astra to 139 minutes for Kimi K3.',
    heading: ['Agent time to build and debug one task program'],
    groups: rows.map(([label, , , minutes]) => ({ label, bars: [{ value: minutes, paint: 'blue', label: `${minutes} min` }] })),
    max: 150, ticks: [0, 50, 100, 150], tickLabel: (t) => `${t} min`,
    labelX: 128, x0: 136, length: 300, bar: 17, groupGap: 9,
    notes: ['Mean wall-clock agent time per task, before the program runs.',
      'Same runs as the model chart. P2 Table 18, column "Agent time / task".'],
  });
}

// P2 Sec. 3.7 and Fig. 6(b): cost per completed face turn over three real-robot episodes.
// The middle token value (5.56M) is read from Fig. 6(b); the other values are in the text.
const RUBIK = [
  { heading: 'Minutes per turn', max: 18, values: ['16.97', '7.80', '3.09'] },
  { heading: 'Tokens per turn (millions)', max: 12, values: ['11.27', '5.56', '2.01'] },
];

function rubik() {
  const panel = 228, barW = 56, barH = 150;
  const [head, headY] = lines(["Rubik's Cube: cost per completed turn falls over three episodes"], 30, { size: 17.5, cls: 'chalk-title' });
  let body = head;
  const titleY = headY + 34, base = titleY + 34 + barH;
  RUBIK.forEach((p, pi) => {
    const px = 8 + pi * (panel + 8);
    body += text(px + panel / 2, titleY, p.heading, { size: 16, anchor: 'middle' })
      + `<line x1="${px + 4}" y1="${base}" x2="${px + panel - 4}" y2="${base}" class="s-faint" stroke-width="1.5"/>`;
    p.values.forEach((value, i) => {
      const cx = px + panel / 2 + (i - 1) * 76, h = (Number(value) / p.max) * barH;
      body += `<rect x="${cx - barW / 2}" y="${n(base - h)}" width="${barW}" height="${n(h)}" class="c-red"/>`
        + text(cx, base - h - 7, value, { anchor: 'middle' })
        + text(cx, base + 21, `Ep ${i + 1}`, { cls: 'c-dim', anchor: 'middle' });
    });
  });
  const [foot, footY] = lines(['Full-episode amortized, including failed attempts,', 'recovery and context compaction.',
    'Episodes completed 3, 5 and 25 face turns.', 'P2 Sec 3.7 and Fig 6(b); one real session.'], base + 52);
  body += foot;
  return svg({
    id: 'fig-rubik', height: footY + 15, style: STYLE, body,
    title: "Rubik's Cube: cost per completed turn falls over three episodes",
    desc: 'Two bar panels over three real-robot episodes. Time per completed face turn falls from 16.97 minutes to 7.80 minutes to 3.09 minutes. Tokens per completed turn fall from 11.27 million to 5.56 million to 2.01 million.',
  });
}

// The ASPIRE loop, redrawn from the paper's Fig. 1 and Sections 2.1 to 2.3 (labels from the old figure).
// Red boxes persist across tasks; blue boxes are the environment.
function aspire() {
  const bw = 140, bh = 80, col = [6, 170, 334], row = [44, 166, 288];
  const box = (c, r, kind, heading, body1, body2) => {
    const x = col[c], y = row[r];
    const paint = { red: 'fill="#f6e5e0" class="s-red"', blue: 'fill="#d7e5ee" class="s-blue"', plain: 'class="c-board s-chalk"' }[kind];
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" ${paint} stroke-width="1.8"/>`
      + text(x + bw / 2, y + 25, heading, { size: 17, anchor: 'middle' })
      + text(x + bw / 2, y + 48, body1, { cls: 'c-dim', anchor: 'middle' })
      + text(x + bw / 2, y + 68, body2, { cls: 'c-dim', anchor: 'middle' });
  };
  const arrow = (d, color = 'chalk', both = false) => {
    const m = color === 'red' ? 'fig-aspire-r' : 'fig-aspire-a';
    return `<path d="${d}" class="c-none s-${color}" stroke-width="1.8"${both ? ` marker-start="url(#${m})"` : ''} marker-end="url(#${m})"/>`;
  };
  const marker = (mid, cls) => `<marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" class="${cls}"/></marker>`;
  const mx = (c) => col[c] + bw / 2, my = (r) => row[r] + bh / 2;
  const bottom = (r) => row[r] + bh, right = (c) => col[c] + bw;
  let body = `<defs>${marker('fig-aspire-a', 'c-chalk')}${marker('fig-aspire-r', 'c-red')}</defs>`;
  body += box(0, 0, 'red', 'Skill library', 'one text note', 'per verified fix')
    + box(1, 0, 'plain', 'Actor', 'coding agent writes', 'a Python program')
    + box(2, 0, 'plain', 'Evolutionary search', 'K programs a round,', 'from top 3 + traces')
    + box(0, 1, 'plain', 'Verifier', 'fresh agent, proposal', 'only, 5 seeds')
    + box(1, 1, 'blue', 'Execution engine', 'runs perception, grasp', 'and motion planning')
    + box(0, 2, 'red', 'Proposed skill', 'from a validated fix:', 'signature, when, repair')
    + box(1, 2, 'blue', 'Trace per call', 'inputs, outputs, status,', 'RGB before and after');
  const loopY = bottom(0) + 16;
  body += arrow(`M${mx(1)},8 V${row[0] - 2}`)
    + arrow(`M${right(0) + 2},${my(0)} H${col[1] - 2}`, 'red')
    + arrow(`M${right(1) + 2},${my(0)} H${col[2] - 2}`, 'chalk', true)
    + arrow(`M${col[1] + 36},${bottom(0) + 2} V${row[1] - 2}`)
    + arrow(`M${mx(1)},${bottom(1) + 2} V${row[2] - 2}`)
    + arrow(`M${right(1) + 2},${my(2)} H${right(1) + 12} V${loopY} H${right(1) - 34} V${bottom(0) + 2}`)
    + arrow(`M${col[1]},${row[0] + 64} H${col[1] - 12} V${my(2)} H${right(0) + 2}`)
    + arrow(`M${mx(0)},${row[2] - 2} V${bottom(1) + 2}`)
    + arrow(`M${mx(0)},${row[1] - 2} V${bottom(0) + 2}`, 'red');
  const gap = (r) => (bottom(r) + row[r + 1]) / 2 + 5.5;
  body += text(mx(1) + 10, 27, 'task + debug seeds', { cls: 'c-dim' })
    + text(col[1] + 44, gap(0) + 6, 'program', { cls: 'c-dim' })
    + text(mx(1) + 8, gap(1), 'records', { cls: 'c-dim' })
    + text(right(1) + 20, my(1) - 14, 'diagnose,', { cls: 'c-dim' })
    + text(right(1) + 20, my(1) + 6, 'repair,', { cls: 'c-dim' })
    + text(right(1) + 20, my(1) + 26, 're-run', { cls: 'c-dim' })
    + text(mx(0) + 9, gap(1), 'verify', { cls: 'c-red' })
    + text(mx(0) + 9, gap(0), 'promote', { cls: 'c-red' });
  const [foot, footY] = lines(['Debug seeds drive the loop. Held-out seeds run once, at the end.',
    'Red: what persists between tasks. Blue: the environment.'], bottom(2) + 32);
  body += foot;
  return svg({
    id: 'fig-aspire', height: footY + 15, body,
    style: 'display:block;width:100%;height:auto;max-width:560px;margin:0 auto',
    title: 'The ASPIRE loop: write, execute, trace, repair, verify, remember',
    desc: 'A task enters the actor, a coding agent that writes a robot program. The program goes to the execution engine, which records a trace of every perception, grasp and planning call. The trace returns to the actor, which diagnoses, repairs and re-runs. The actor turns a validated fix into a proposed skill. A fresh verifier agent must reproduce the fix from the proposal alone, and only then does the skill enter the skill library. The library feeds the actor on later tasks. Evolutionary search lets the actor try several programs per round, seeded by the best programs and their traces.',
  });
}

const FIGURES = { 'fig-aspire': aspire, 'fig-robosuite': robosuite, 'fig-libero': libero, 'fig-models': models, 'fig-rubik': rubik, 'fig-time': time };

if (process.argv.includes('--print')) {
  for (const make of Object.values(FIGURES)) console.log(make() + '\n');
} else {
  let md = readFileSync(ARTICLE, 'utf8');
  for (const [id, make] of Object.entries(FIGURES)) {
    const re = new RegExp(`<svg\\b[^>]*aria-labelledby="${id}-t ${id}-d"[^>]*>[\\s\\S]*?</svg>`, 'g');
    const found = md.match(re) || [];
    if (found.length !== 1) throw new Error(`${id}: expected one <svg>, found ${found.length}`);
    md = md.replace(re, () => make());
  }
  writeFileSync(ARTICLE, md);
  console.log(`wrote ${Object.keys(FIGURES).length} figures into ${ARTICLE.pathname}`);
}
