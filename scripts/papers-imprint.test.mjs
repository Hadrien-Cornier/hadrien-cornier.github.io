import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DATA, OUTPUT, PANEL, LAYOUTS, SCATTER, RECIPE, PROBE, CHANCE, TRANSFER, ORDERS, PLOT, plotX, plotY, INTRO, MATH_BEFORE, MATH_AFTER, QA_TITLE, QA_ITEMS, IMPRINT_CODE, render} from './imprint-canvas.mjs';

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

test('the committed page is the current generator output', () => {
 assert.equal(fs.readFileSync(OUTPUT, 'utf8'), render(), 'run node scripts/imprint-canvas.mjs');
});

test('the tables read from the paper agree with their own averages', () => {
 const rm = DATA.rmbench.methods;
 assert.equal(DATA.rmbench.tasks.length, 9);
 // Rows marked † are copied from prior work and print a truncated average (EventVLA 67.89 as 67.8).
 for (const [method, row] of Object.entries(rm)) assert.ok(Math.abs(mean(row.slice(0, 9)) - row[9]) < (method.endsWith('†') ? 0.1 : 0.06), `Table 10 ${method}`);
 const casa = DATA.robocasa.rows, tasks = Object.values(casa).filter((row) => row.type !== '–');
 assert.equal(tasks.length, 12);
 for (const [type, label] of [['Memory', 'Memory task average'], ['Non-memory', 'Non-memory task average']]) {
  DATA.robocasa.columns.forEach((column, k) => assert.ok(Math.abs(mean(tasks.filter((row) => row.type === type).map((row) => row.values[k])) - casa[label].values[k]) < 0.06, `Table 11 ${label} ${column}`));
 }
 for (const [method, row] of Object.entries(DATA.real.methods)) assert.ok(Math.abs(mean(row.tasks.map(([won, total]) => (100 * won) / total)) - row.average) < 0.06, `Table 12 ${method}`);
 const recipe = Object.entries(DATA.recipe.rows).filter(([task]) => task !== 'Average').map(([, row]) => row);
 DATA.recipe.columns.forEach((column, k) => assert.ok(Math.abs(mean(recipe.map((row) => row[k])) - DATA.recipe.rows.Average[k]) < 0.06, `Table 15 ${column}`));
 const backbones = Object.entries(DATA.backbones.rows).filter(([task]) => task !== 'Average').map(([, row]) => row);
 DATA.backbones.columns.forEach((column, k) => assert.ok(Math.abs(mean(backbones.map((row) => row[k])) - DATA.backbones.rows.Average[k]) < 0.06, `Table 16 ${column}`));
});

test('every plotted number is a table value or a quoted latency', () => {
 const rm = DATA.rmbench.methods, ms = DATA.latency.ms;
 assert.deepEqual(SCATTER.map((p) => [p.name, p.success, p.ms]), [
  ['π0.5 alone', rm['\\pi_{0.5} (no memory)'][9], ms.pi05], ['HAMLET', rm.HAMLET[9], ms.hamlet], ['MemoryVLA', rm['MemoryVLA†'][9], ms.memoryvla],
  ['EventVLA', rm['EventVLA†'][9], ms.eventvla], ['Imprint', rm['IMPRINT (recurrent)'][9], ms.imprint_recurrent],
 ]);
 for (const [name, quote] of Object.entries(DATA.latency.quotes)) assert.ok(quote.includes(String(ms[name])), name);
 assert.deepEqual(DATA.latency.reported, ['eventvla']);
 // Only EventVLA's latency is reported rather than measured; its success and MemoryVLA's come from prior work (Table 10 †).
 assert.deepEqual(SCATTER.filter((p) => p.priorLatency).map((p) => p.name), ['EventVLA']);
 assert.deepEqual(SCATTER.filter((p) => p.priorSuccess).map((p) => p.name), ['MemoryVLA', 'EventVLA']);
 assert.deepEqual(RECIPE.map((row) => row.value), [rm['\\pi_{0.5} (no memory)'][9], ...DATA.recipe.rows.Average.slice(0, 3)]);
 // Balanced accuracy, the measure that matches a 1/6 chance line.
 assert.deepEqual(PROBE.map((row) => row.value), [DATA.probe.rows.E2E[1], DATA.probe.rows.Frozen[1]]);
 assert.ok(Math.abs(CHANCE - 100 / 6) < 1e-12);
 assert.deepEqual(TRANSFER.map((row) => [row.base, row.imprint]), [[25.6, 75.6], [52.2, 66.7]]);
});

test('the result panel shows what the paper claims: best success at the lowest memory latency', () => {
 const imprint = SCATTER.find((p) => p.kind === 'imprint'), others = SCATTER.filter((p) => p.kind === 'memory');
 for (const p of others) assert.ok(imprint.success > p.success && imprint.ms < p.ms, p.name);
 for (const p of SCATTER) {
  const [x, y] = [plotX(p.ms), plotY(p.success)];
  assert.ok(x > PLOT.x && x < PLOT.x + PLOT.w && y > PLOT.y && y < PLOT.y + PLOT.h, `${p.name} inside the plot`);
 }
 for (let k = 1; k < RECIPE.length; k++) assert.ok(RECIPE[k - 1].value < RECIPE[k].value, `${RECIPE[k].label} adds success`);
 assert.ok(PROBE[0].value < CHANCE + 5 && PROBE[1].value > 80, 'stage 1 alone puts the color order in memory');
});

test('the two Cover Blocks pasts end in the same view but need different first lids', () => {
 assert.deepEqual([...ORDERS.A].sort(), ['B', 'G', 'R']);
 assert.deepEqual([...ORDERS.B].sort(), ['B', 'G', 'R']);
 assert.notEqual(ORDERS.A.indexOf('R'), ORDERS.B.indexOf('R'));
});

test('every layout keeps every panel inside the drawing and use unique ids', () => {
 for (const layout of Object.values(LAYOUTS)) {
  assert.equal(layout.panels.length, 6);
  for (const [x, y] of layout.panels) assert.ok(x >= 0 && y >= 30 && x + PANEL.w <= layout.width && y + PANEL.h <= layout.height - 10);
 }
 const ids = [...render().matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
 assert.equal(new Set(ids).size, ids.length);
});

test('the prose renders its math and keeps to the house style', () => {
 const html = render();
 assert.match(html, /class="katex-display"/);
 assert.doesNotMatch(html, /katex-error|<script/);
 for (const value of [INTRO, MATH_BEFORE, MATH_AFTER, html]) assert.doesNotMatch(value, /—/, 'no em dashes');
 for (const symbol of ['m_t', 'K', '\\lambda', '\\rho_t', 'z^v_k', 'a_k', 'q_k']) assert.ok(`${MATH_BEFORE} ${MATH_AFTER}`.includes(symbol), `defines ${symbol}`);
 assert.ok(html.includes('25.4%') || INTRO.includes('25.4'), 'the intro quotes the base success');
});

test('the questions drawer starts closed and cites the paper and pinned code for every answer', () => {
 const html = render();
 assert.match(html, /<details class="im-qa"><summary>/, 'the drawer has no open attribute');
 assert.equal(QA_ITEMS.length, 3);
 assert.match(IMPRINT_CODE, /\/blob\/[0-9a-f]{40}\/$/, 'code links pin one commit');
 for (const item of QA_ITEMS) {
  assert.match(item.paper, /(Sec|App)\. /);
  for (const [label, target] of item.code) assert.match(`${label} ${target}`, /:\d+(-\d+)? .+#L\d+(-L\d+)?$/, label);
 }
 // The paper is silent on rates in Hz and on real-robot timing; the answer must say so instead of guessing.
 assert.match(QA_ITEMS[1].answer, /doesn't say|not stated/);
 assert.match(html, /not stated in the paper/);
 for (const value of [QA_TITLE, ...QA_ITEMS.flatMap((item) => [item.question, item.answer])]) assert.doesNotMatch(value, /[—–]/, 'no em or en dashes');
});
