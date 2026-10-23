import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import matter from 'gray-matter';
import {DATA, OUTPUT, PANEL, LAYOUTS, SCALE, RESULT, TRIALS, PHASES, count, INTRO, MATH_BEFORE, EQUATION, MATH_AFTER, render} from './molmobot-canvas.mjs';

test('the committed page is the current generator output', () => {
 assert.equal(fs.readFileSync(OUTPUT, 'utf8'), render(), 'run node scripts/molmobot-canvas.mjs');
});

test('the title is the paper\'s exact name, MolmoBot first, and the first line under it gives the paper date and link', () => {
 const {data} = matter(fs.readFileSync(new URL('../content/robotics/molmobot.md', import.meta.url), 'utf8'));
 // The arXiv abstract page of 2603.16861: the title draws the O as a robot face, the text writes MolmoBot. We read v2, 26 Mar 2026.
 assert.equal(data.paper.title, 'MolmoBot: Large-Scale Simulation Enables Zero-Shot Manipulation');
 assert.equal(data.title, data.paper.title);
 assert.doesNotMatch(data.title, /[—–]/, 'no em or en dashes');
 assert.equal(data.paper.date, '2026-03-26');
 const page = fs.readFileSync(new URL('../robotics/molmobot/index.html', import.meta.url), 'utf8');
 assert.match(page, /<h1>MolmoBot: Large-Scale Simulation Enables Zero-Shot Manipulation<\/h1><p class="paper-source">Posted to arXiv on 26 March 2026 · <a href="https:\/\/arxiv\.org\/abs\/2603\.16861v2">arXiv 2603\.16861v2 ↗<\/a><\/p><p class="post-description">/);
});

test('Table 1 adds up to its own total row', () => {
 const {columns, rows} = DATA.dataset, col = (name) => columns.findIndex((c) => c.startsWith(name));
 const tasks = rows.filter((cells) => cells[0] !== 'Total'), total = rows.find((cells) => cells[0] === 'Total');
 assert.equal(tasks.length, 8);
 const sum = (name) => tasks.reduce((s, cells) => s + count(cells[col(name)]), 0);
 // The episodes add up to 1.75M, which the paper prints as 1.7M (and the arXiv listing as 1.8M).
 assert.ok(sum('Episodes') >= 1.7e6 && sum('Episodes') < 1.8e6, `episodes ${sum('Episodes')}`);
 assert.equal(total[col('Episodes')], '1.7M');
 assert.ok(Math.abs(sum('Total Length') - count(total[col('Total Length')])) <= 2, 'hours');
 assert.ok(Math.abs(sum('Frames') - count(total[col('Frames')])) <= 0.2e6, 'frames');
});

test('every plotted number is a table value or a Fig. 7 bar', () => {
 assert.deepEqual(SCALE.map((row) => [row.label, row.droid, row.ours]), [
  ['demos', '76k', '1.7M'], ['hours of robot time', '350', '5,704'], ['environments', '564', '94.2k'],
 ]);
 assert.equal(TRIALS, 120);
 for (const row of RESULT) assert.ok(Math.abs((100 * row.wins) / TRIALS - row.value) < 0.05, `${row.label} is a count out of ${TRIALS}`);
 assert.deepEqual(RESULT.map((row) => [row.label, row.wins]), [['π0-DROID', 11], ['π0.5-DROID', 47], ['MolmoBot-Pi0', 56], ['MolmoBot-Img', 87], ['MolmoBot', 95]]);
 // Fig. 7 agrees with Table 6 for the MolmoBot policies. Table 6 prints π0.5 at 31.3; the abstract, Sec. 1 and Fig. 7 give 39.2.
 const real = DATA.sim.columns.indexOf('Real');
 for (const [label, model] of [['MolmoBot-Pi0', 'MolmoBot-Pi0'], ['MolmoBot-Img', 'MolmoBot-Img'], ['MolmoBot', 'MolmoBot (F=2)']]) {
  assert.ok(Math.abs(RESULT.find((row) => row.label === label).value - DATA.sim.rows[model][real]) < 0.05, label);
 }
 assert.ok(Math.abs(RESULT[1].value - 39.2) < 0.05);
 // Appendix Table 10 gives every trial: 4 rooms, 30 per room, and its sums are the Fig. 7 counts.
 assert.equal(Object.keys(DATA.real.rooms).length, 4);
 for (const row of RESULT) assert.equal(Object.values(DATA.real.rooms).reduce((sum, room) => sum + room[row.key], 0), row.wins, `${row.label} Table 10`);
});

test('the result panel shows what the paper claims', () => {
 assert.deepEqual(RESULT.filter((row) => row.real).map((row) => row.label), ['π0-DROID', 'π0.5-DROID']);
 const [pi0, pi05, pi0Sim, , ours] = RESULT;
 assert.ok(ours.value > 2 * pi05.value, 'MolmoBot more than doubles π0.5-DROID');
 assert.ok(pi0Sim.value > pi0.value, 'the same π0 architecture does better on the simulated data');
 for (let k = 1; k < RESULT.length; k++) assert.ok(RESULT[k - 1].value < RESULT[k].value);
});

test('the scripted expert follows the paper’s pick-and-place phases', () => {
 assert.deepEqual(PHASES.map(([name]) => name), ['pregrasp', 'grasp', 'lift', 'preplace', 'place', 'postplace', 'stow']);
});

test('every layout keeps every panel inside the drawing and uses unique ids', () => {
 for (const layout of Object.values(LAYOUTS)) {
  assert.equal(layout.panels.length, 6);
  for (const [x, y] of layout.panels) assert.ok(x >= 0 && y >= 30 && x + PANEL.w <= layout.width && y + PANEL.h <= layout.height - 10);
 }
 const ids = [...render().matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
 assert.equal(new Set(ids).size, ids.length);
});

test('the prose renders its math, defines its terms and keeps to the house style', () => {
 const html = render();
 assert.match(html, /class="katex-display"/);
 assert.doesNotMatch(html, /katex-error|<script/);
 for (const value of [INTRO, MATH_BEFORE, MATH_AFTER, html]) assert.doesNotMatch(value, /—/, 'no em dashes');
 for (const term of ['sim-to-real', 'zero-shot', 'domain randomization', 'scripted experts']) assert.ok(INTRO.toLowerCase().includes(term), `the intro defines ${term}`);
 assert.doesNotMatch(INTRO, /no real data/, 'the pretrained models saw real images, so say no real robot data');
 for (const value of ['79.2%', '39.2%', '120 trials', '10,000 hours']) assert.ok(INTRO.includes(value), `the intro quotes ${value}`);
 // The released code (molmobot.py) mixes xt = (1 - t) noise + t actions and regresses on actions - noise.
 assert.ok(EQUATION.includes('(A - \\epsilon)') && EQUATION.includes('\\tau A + (1-\\tau)\\,\\epsilon'));
 for (const symbol of ['\\mathcal{D}', '$o$', '\\ell', '$q$', '$A$', '\\epsilon', '\\tau', 'A^\\tau', 'v_\\theta']) assert.ok(MATH_AFTER.includes(symbol), `defines ${symbol}`);
});
