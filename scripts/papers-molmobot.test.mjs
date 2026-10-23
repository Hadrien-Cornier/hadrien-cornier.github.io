import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DATA, OUTPUT, PANEL, LAYOUTS, SCALE, RESULT, TRIALS, PHASES, count, INTRO, MATH_BEFORE, EQUATION, MATH_AFTER, render} from './molmobot-canvas.mjs';

test('the committed page is the current generator output', () => {
 assert.equal(fs.readFileSync(OUTPUT, 'utf8'), render(), 'run node scripts/molmobot-canvas.mjs');
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
 for (const term of ['sim-to-real', 'zero-shot', 'domain randomization', 'Scripted experts']) assert.ok(INTRO.includes(term), `the intro defines ${term}`);
 for (const value of ['79.2%', '39.2%', '120 trials', '10,000 hours']) assert.ok(INTRO.includes(value), `the intro quotes ${value}`);
 // The released code (molmobot.py) mixes xt = (1 - t) noise + t actions and regresses on actions - noise.
 assert.ok(EQUATION.includes('(A - \\epsilon)') && EQUATION.includes('\\tau A + (1-\\tau)\\,\\epsilon'));
 for (const symbol of ['\\mathcal{D}', '$o$', '\\ell', '$q$', '$A$', '\\epsilon', '\\tau', 'A^\\tau', 'v_\\theta']) assert.ok(MATH_AFTER.includes(symbol), `defines ${symbol}`);
});
