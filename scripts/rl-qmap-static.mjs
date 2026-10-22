// Prints the no-JavaScript fallback drawing for the Q-table map in rl-1-q-learning.md and
// splices it between the data-qm markers. Run after editing assets/robotics/rl/qmap.js:
//   node scripts/rl-qmap-static.mjs
// The page script redraws the same groups from the same data when JavaScript runs.
import { readFileSync, writeFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const dataSrc = read('assets/robotics/rl/qtable-data.js');
const D = JSON.parse(dataSrc.slice(dataSrc.indexOf('{'), dataSrc.lastIndexOf('}') + 1));
const module = { exports: {} };
new Function('module', read('assets/robotics/rl/qmap.js'))(module);
const M = module.exports, Q = M.make(D);
const frame = (t) => Q.frames.find((f) => f.t === t);
const parts = {
  map: M.renderMap(Q, 10000, M.START, { update: true }),
  status: M.statusText(Q, frame(10000)),
  cell: M.renderCell(Q, 10000, M.START),
  math: M.renderMath(Q, frame(6)),
  credit: M.renderCredit(Q, 24),
};
const file = new URL('../content/robotics/rl-1-q-learning.md', import.meta.url);
let md = readFileSync(file, 'utf8');
for (const [k, v] of Object.entries(parts)) {
  const re = new RegExp('(data-qm="' + k + '"[^>]*>)[\\s\\S]*?(</(?:g|text)><!--/qm-' + k + '-->)');
  if (!re.test(md)) throw new Error('marker missing for ' + k);
  md = md.replace(re, (m, a, b) => a + v + b);
}
writeFileSync(file, md);
console.log('qmap static fallback written');

// The article thumbnail: the finished table on the grid, with chalk colors written into the file
// (page CSS cannot reach inside an <img>).
const CHALK = { chalk: '#f4f1e8', dim: '#c3c9bd', faint: '#6f7d75', red: '#ff9f88', pink: '#ff93b8', blue: '#93d4ff', green: '#a8e2a0', yellow: '#ffe17c', board: '#1d2824', none: 'none' };
const bake = (svg) => svg
  .replace(/<path [^>]*class="qm-arrow-big[^"]*"[^>]*\/>/g, '')
  .replace(/class="qm-arrow s-([a-z]+)"/g, (m, k) => 'stroke="' + CHALK[k] + '"')
  .replace(/class="qm-sel s-red"/g, 'stroke="' + CHALK.red + '"')
  .replace(/class="s-([a-z]+)"/g, (m, k) => 'stroke="' + CHALK[k] + '"')
  .replace(/class="c-([a-z]+)"/g, (m, k) => 'fill="' + CHALK[k] + '"')
  .replace(/ class="qm-cell"/g, '');
const thumb = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 495" role="img" aria-labelledby="t d">' +
  '<title id="t">The Q table drawn on the cliff grid</title><desc id="d">A 4 by 12 cliff grid. Each cell is cut into four triangles that hold the learned score of each move after 10,000 recorded updates; arrows trace the 13-move route along the cliff edge.</desc>' +
  '<rect width="840" height="495" fill="' + CHALK.board + '"/>' +
  '<g font-family="Patrick Hand, Chalkboard SE, Comic Neue, Arial, sans-serif" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 50)">' +
  '<text x="36" y="20" font-size="30" fill="' + CHALK.yellow + '">Q-learning: the table, drawn on the cliff grid</text>' +
  bake(M.renderMap(Q, 10000, -1, { update: false, numbers: false })) + '</g></svg>';
writeFileSync(new URL('../assets/robotics/rl/rl-1-q-learning-whole.svg', import.meta.url), thumb + '\n');
console.log('thumbnail written');
