import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DATA, OUTPUT, PANEL, LAYOUTS, MAP_RANGE, EPISODE, INTRO, MATH_NOTE, mapValue, episodeValues, render} from './offline-empowerment-canvas.mjs';

const finalOf = (family, series) => DATA.curves[family].series[series].at(-1)[1];

test('the committed page is the current generator output', () => {
 assert.equal(fs.readFileSync(OUTPUT, 'utf8'), render(), 'run node scripts/offline-empowerment-canvas.mjs');
});

test('the math paragraph prerenders its equations and the built page loads the KaTeX stylesheet', () => {
 const html = render();
 assert.equal((html.match(/class="katex-display"/g) || []).length, 1);
 assert.ok(!html.includes('katex-error') && !MATH_NOTE.includes('PLACEHOLDER'));
 assert.ok(!/[\u2013\u2014]/.test(INTRO + MATH_NOTE), 'no en or em dashes');
 const page = fs.readFileSync(new URL('../papers/offline-empowerment/index.html', import.meta.url), 'utf8');
 assert.ok(page.includes('<link rel="stylesheet" href="/assets/vendor/katex/katex.min.css">'));
});

test('the empowerment map follows the medium maze and peaks at a junction', () => {
 const {grid, maze, sub} = DATA.map;
 assert.equal(grid.length, 6 * sub);
 grid.forEach((row, i) => row.forEach((value, j) => assert.equal(value === null, maze[Math.floor(i / sub)][Math.floor(j / sub)] === 1)));
 const values = grid.flat().filter((value) => value !== null);
 assert.ok(Math.min(...values) >= MAP_RANGE[0] - 0.05 && Math.max(...values) <= MAP_RANGE[1], 'the colour bar covers the map');
 // The centre cell joins three corridors and holds the peak; the bottom-left corner, where the online ant starts, holds the minimum.
 const open = (i, j) => i >= 0 && i < 6 && j >= 0 && j < 6 && !maze[i][j];
 const exits = (i, j) => [[0, 1], [1, 0], [0, -1], [-1, 0]].filter(([a, b]) => open(i + a, j + b)).length;
 const cell = (i, j) => grid.slice(i * sub, (i + 1) * sub).flatMap((row) => row.slice(j * sub, (j + 1) * sub));
 assert.equal(exits(3, 3), 3);
 assert.equal(Math.max(...cell(3, 3)), Math.max(...values));
 assert.equal(Math.min(...cell(5, 0)), Math.min(...values));
 assert.ok(mapValue(5.5, 0.5) < 0.95);
});

test('the sketched episode is a legal walk from the start corner and peaks before its end', () => {
 assert.deepEqual(EPISODE[0], [5, 0]);
 for (let k = 1; k < EPISODE.length; k++) {
  const [a, b] = [EPISODE[k - 1], EPISODE[k]];
  assert.equal(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]), 1);
  assert.equal(DATA.map.maze[b[0]][b[1]], 0);
 }
 const values = episodeValues(), best = values.indexOf(Math.max(...values));
 assert.ok(best > 0 && best < values.length - 1);
});

test('Fig. 4 curves stay in range and the bonus lifts every baseline on antmaze-medium navigate', () => {
 for (const family of Object.values(DATA.curves)) for (const points of Object.values(family.series)) {
  points.forEach(([x, y], k) => {
   assert.ok(x >= 0 && x <= 1 && y >= -0.01 && y <= 1);
   if (k) assert.ok(x >= points[k - 1][0]);
  });
 }
 assert.ok(finalOf('crl', 'CRL + Emp') > finalOf('crl', 'CRL') + 0.1);
 assert.ok(finalOf('crl', 'CRL + RND + Emp') > finalOf('crl', 'CRL + RND') + 0.1);
 assert.ok(finalOf('supe', 'SUPE + Emp') > finalOf('supe', 'SUPE') + 0.1);
 assert.deepEqual(DATA.tally.map((row) => row.vs_crl).sort(), ['better', 'better', 'better', 'better', 'better', 'on par', 'on par', 'on par', 'on par']);
});

test('the text alternative quotes the plotted numbers', () => {
 const html = render();
 for (const [family, without, withBonus] of [['crl', 'CRL', 'CRL + Emp'], ['crl', 'CRL + RND', 'CRL + RND + Emp'], ['supe', 'SUPE', 'SUPE + Emp']]) {
  assert.ok(html.includes(`from ${finalOf(family, without).toFixed(2)} to ${finalOf(family, withBonus).toFixed(2)}`), `${without} numbers`);
 }
});

test('both layouts keep every panel inside the drawing and use unique ids', () => {
 for (const layout of Object.values(LAYOUTS)) {
  assert.equal(layout.panels.length, 6);
  for (const [x, y] of layout.panels) assert.ok(x >= 0 && y >= 30 && x + PANEL.w <= layout.width && y + PANEL.h <= layout.height - 10);
 }
 const ids = [...render().matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
 assert.equal(new Set(ids).size, ids.length);
});
