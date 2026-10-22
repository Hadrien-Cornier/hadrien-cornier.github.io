/* The Q table drawn on the cliff map, for "RL methods: a family tree and a Q table".
   Each cell of the 4 by 12 grid is cut along its diagonals into four triangles, one per move
   (up, right, down, left), and each triangle holds that move's score. A red square marks the
   selected cell. The same recorded data (window.RL_QTABLE, from qtable-data.js) drives the map,
   the cell close-up, the worked update and the credit drawing, so they always agree.
   Data: one real run of the Breaking Bellman cliff walk (Q-learning, table, step size 0.5,
   discount 0.99, one random move in ten, seed 202). Updates 1 to 400 are replayed from the
   recorded update log; later frames are recorded snapshots. Nothing is simulated in the page.
   The renderers return SVG strings, so node can also print the static fallback markup. */
(function (root) {
  'use strict';
  var W = 12, H = 4, A = 4;
  var ACT = ['up', 'right', 'down', 'left'], ARROW = ['↑', '→', '↓', '←'];
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  var START = 36, GOAL = 47;
  function isCliff(s) { return s > 36 && s < 47; }
  function isTerminal(s) { return s === GOAL || isCliff(s); }

  // Canvas layout, in rc-svg units (the canvas is 840 wide).
  var MAP = { x: 36, y: 70, c: 64 };
  var CELL = { x: 44, y: 446, size: 232 };
  var LOC = { x: 330, y: 612, c: 20 };
  var CREDIT_Y = 1172;

  function make(D) {
    var N = D.log.length, GAMMA = D.gamma, ALPHA = D.alpha;
    var frames = [];
    for (var i = 0; i <= N; i++) frames.push({ t: i, kind: 'update' });
    D.snapT.forEach(function (t) { frames.push({ t: t, kind: 'snapshot' }); });
    var cache = {};
    function tableAt(t) {
      if (t > N) return D.snaps[t];
      if (cache[t]) return cache[t];
      var T = new Array(W * H * A).fill(0);
      for (var k = 0; k < t; k++) { var u = D.log[k]; T[u[0] * A + u[1]] = u[5]; }
      return (cache[t] = T);
    }
    function rowOf(T, s) { return [T[s * A], T[s * A + 1], T[s * A + 2], T[s * A + 3]]; }
    function bestOf(row) {
      var b = 0, tie = false;
      for (var k = 1; k < A; k++) { if (row[k] > row[b]) { b = k; tie = false; } else if (row[k] === row[b]) tie = true; }
      return { a: b, v: row[b], tie: tie, seen: row.some(function (x) { return x !== 0; }) };
    }
    function step(s, a) {
      var r = Math.floor(s / W), c = s % W, nr = r + DR[a], nc = c + DC[a];
      if (nr < 0 || nr >= H || nc < 0 || nc >= W) { nr = r; nc = c; }
      if (nr === 3 && nc > 0 && nc < 11) return { s2: START, r: -100, done: false };
      return { s2: nr * W + nc, r: -1, done: nr === 3 && nc === 11 };
    }
    function greedyWalk(T) {
      var s = START;
      for (var n = 1; n <= 40; n++) {
        var x = step(s, bestOf(rowOf(T, s)).a);
        s = x.s2;
        if (x.done) return { goal: true, steps: n };
      }
      return { goal: false, steps: 40 };
    }
    function fallsAt(t) {
      if (D.falls[t] !== undefined) return D.falls[t];
      var n = 0;
      for (var i = 0; i < t && i < N; i++) if (D.log[i][2] === -100) n++;
      return n;
    }
    function updateAt(t) {
      if (t < 1 || t > N) return null;
      var u = D.log[t - 1], Tb = tableAt(t - 1);
      var s = u[0], a = u[1], r = u[2], s2 = u[3], done = u[4] === 1;
      var old = Tb[s * A + a], row2 = rowOf(Tb, s2), mx = Math.max.apply(null, row2);
      var target = done ? r : r + GAMMA * mx;
      return { t: t, s: s, a: a, r: r, s2: s2, done: done, old: old, row2: row2, max: mx, maxA: row2.indexOf(mx), target: target, nq: u[5] };
    }
    return { D: D, N: N, gamma: GAMMA, alpha: ALPHA, frames: frames, tableAt: tableAt, rowOf: rowOf, bestOf: bestOf, greedyWalk: greedyWalk, fallsAt: fallsAt, updateAt: updateAt };
  }

  // ------------------------------------------------------------------ formatting
  function minus(s) { return String(s).replace(/-/g, '−'); }
  function trim(x, d) { var s = x.toFixed(d); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s; }
  // One format everywhere, exact enough to match the worked arithmetic: up to 4 decimals below 10,
  // up to 2 above, trailing zeros dropped (so a fall's -50 reads -50, like -0.5 next to it).
  function fmt(x) { if (x === 0) return '0'; return minus(Math.abs(x) < 10 ? trim(Math.round(x * 1e4) / 1e4, 4) : trim(Math.round(x * 100) / 100, 2)); }
  // Short form for the small triangles on the full map: one decimal below 10, whole numbers from 10 up,
  // so every label fits its triangle at a readable size. The close-up shows the exact scores.
  function short(x) { if (x === 0) return '0'; var r = Math.round(x * 10) / 10; return minus(Math.abs(r) >= 10 ? String(Math.round(x)) : r.toFixed(1)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function where(s) {
    var r = Math.floor(s / W), c = s % W;
    if (s === START) return 'the start';
    if (s === GOAL) return 'the flag';
    if (isCliff(s)) return 'the cliff';
    return 'row ' + (r + 1) + ' of 4 from the top, column ' + (c + 1) + ' of 12';
  }
  function heat(v) {
    if (v === 0) return 'none';
    if (v <= -20) return 'rgba(255,159,136,' + (0.26 + 0.16 * Math.min(1, (-v - 20) / 90)).toFixed(2) + ')';
    return 'rgba(147,212,255,' + (0.05 + 0.25 * Math.min(1, -v / 13)).toFixed(2) + ')';
  }

  // ------------------------------------------------------------------ SVG pieces
  function tri(x, y, C, a) {
    var cx = x + C / 2, cy = y + C / 2;
    var p = [[[x, y], [x + C, y]], [[x + C, y], [x + C, y + C]], [[x + C, y + C], [x, y + C]], [[x, y + C], [x, y]]][a];
    return 'M' + p[0][0] + ' ' + p[0][1] + 'L' + p[1][0] + ' ' + p[1][1] + 'L' + cx + ' ' + cy + 'Z';
  }
  function numPos(x, y, C, a) {
    if (C < 100) return [[x + C / 2, y + C * 0.18], [x + C * 0.8, y + C / 2], [x + C / 2, y + C * 0.83], [x + C * 0.2, y + C / 2]][a];
    return [[x + C / 2, y + C * 0.2], [x + C * 0.79, y + C / 2], [x + C / 2, y + C * 0.81], [x + C * 0.21, y + C / 2]][a];
  }
  function arrowPath(cx, cy, a, len) {
    var dx = DC[a] * len, dy = DR[a] * len, hx = cx + dx, hy = cy + dy;
    var px = -DR[a], py = DC[a], h = len * 0.55;
    return 'M' + (cx - dx * 0.2) + ' ' + (cy - dy * 0.2) + 'L' + hx + ' ' + hy +
      'M' + (hx - DC[a] * h + px * h * 0.7) + ' ' + (hy - DR[a] * h + py * h * 0.7) + 'L' + hx + ' ' + hy + 'L' + (hx - DC[a] * h - px * h * 0.7) + ' ' + (hy - DR[a] * h - py * h * 0.7);
  }
  // One cell as a cross of four score triangles. opts: hi (move outlined yellow), borrow (move outlined blue),
  // numbers (font size or 0), arrow (draw the best move), label.
  function cross(x, y, C, row, opts) {
    opts = opts || {};
    var out = '', b = bestOfRow(row);
    for (var a = 0; a < A; a++) out += '<path d="' + tri(x, y, C, a) + '" fill="' + heat(row[a]) + '" class="s-faint" stroke-width="' + (C > 100 ? 1.6 : 1) + '"/>';
    out += '<rect x="' + x + '" y="' + y + '" width="' + C + '" height="' + C + '" fill="none" class="s-dim" stroke-width="' + (C > 100 ? 2.2 : 1.2) + '"/>';
    if (opts.borrow !== undefined && opts.borrow >= 0) out += '<path d="' + tri(x, y, C, opts.borrow) + '" fill="none" class="s-blue" stroke-width="' + (C > 100 ? 4 : 3) + '"/>';
    if (opts.hi !== undefined && opts.hi >= 0) out += '<path d="' + tri(x, y, C, opts.hi) + '" fill="none" class="s-yellow" stroke-width="' + (C > 100 ? 4.5 : 3) + '"/>';
    if (opts.numbers) {
      for (a = 0; a < A; a++) {
        var p = numPos(x, y, C, a), isBest = b.seen && !b.tie && a === b.a;
        out += '<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" dominant-baseline="central" font-size="' + opts.numbers + '" class="' + (a === opts.hi ? 'c-yellow' : a === opts.borrow ? 'c-blue' : 'c-chalk') + '"' + (isBest ? ' font-weight="700"' : '') + '>' + (opts.long ? fmt(row[a]) : short(row[a])) + '</text>';
      }
    }
    if (opts.arrow && b.seen && !b.tie) {
      if (C > 100) out += '<path d="' + arrowPath(x + C / 2, y + C / 2, b.a, C * 0.13) + '" fill="none" class="s-chalk" stroke-width="3"/>';
      // Map cells: a small arrow between the numbers, and a large one for phones, where CSS hides the numbers.
      else out += '<path d="' + arrowPath(x + C / 2, y + C / 2, b.a, C * 0.09) + '" fill="none" class="qm-arrow s-chalk" stroke-width="2.2"/>' +
        '<path d="' + arrowPath(x + C / 2, y + C / 2, b.a, C * 0.27) + '" fill="none" class="qm-arrow-big s-chalk" stroke-width="4"/>';
    }
    return out;
  }
  function bestOfRow(row) {
    var b = 0, tie = false;
    for (var k = 1; k < A; k++) { if (row[k] > row[b]) { b = k; tie = false; } else if (row[k] === row[b]) tie = true; }
    return { a: b, v: row[b], tie: tie, seen: row.some(function (x) { return x !== 0; }) };
  }
  function terminalCell(x, y, C, s, small) {
    var out = '<rect x="' + x + '" y="' + y + '" width="' + C + '" height="' + C + '" fill="none" class="s-dim" stroke-width="' + (small ? 0.8 : 1.2) + '"/>';
    if (isCliff(s)) {
      out += '<path d="M' + (x + C * 0.2) + ' ' + (y + C * 0.2) + 'L' + (x + C * 0.8) + ' ' + (y + C * 0.8) + 'M' + (x + C * 0.8) + ' ' + (y + C * 0.2) + 'L' + (x + C * 0.2) + ' ' + (y + C * 0.8) + '" class="s-red" stroke-width="' + (small ? 1.2 : 2.2) + '" fill="none"/>';
    } else {
      var fx = x + C * 0.36, fy = y + C * 0.2;
      out += '<path d="M' + fx + ' ' + (y + C * 0.82) + 'L' + fx + ' ' + fy + 'L' + (fx + C * 0.36) + ' ' + (fy + C * 0.14) + 'L' + fx + ' ' + (fy + C * 0.28) + '" class="s-green" stroke-width="' + (small ? 1.2 : 2.4) + '" fill="' + (small ? 'none' : 'rgba(168,226,160,.35)') + '"/>';
    }
    return out;
  }
  function locator(L, marks) {
    var out = '';
    for (var s = 0; s < W * H; s++) {
      var x = L.x + (s % W) * L.c, y = L.y + Math.floor(s / W) * L.c;
      if (isTerminal(s)) out += terminalCell(x, y, L.c, s, true);
      else out += '<rect x="' + x + '" y="' + y + '" width="' + L.c + '" height="' + L.c + '" fill="none" class="s-faint" stroke-width=".8"/>';
    }
    out += '<text x="' + (L.x - 4) + '" y="' + (L.y + 3.5 * L.c + 5) + '" text-anchor="end" font-size="13" class="c-dim">S</text>';
    (marks || []).forEach(function (m) {
      var x = L.x + (m % W) * L.c, y = L.y + Math.floor(m / W) * L.c;
      out += '<rect x="' + (x - 1.5) + '" y="' + (y - 1.5) + '" width="' + (L.c + 3) + '" height="' + (L.c + 3) + '" fill="none" class="s-red" stroke-width="2.6"/>';
    });
    return out;
  }

  // ------------------------------------------------------------------ the four live groups
  function renderMap(Q, t, sel, opts) {
    opts = opts || {};
    var T = Q.tableAt(t), M = MAP, out = '';
    var u = opts.update ? Q.updateAt(t) : null;
    for (var s = 0; s < W * H; s++) {
      var x = M.x + (s % W) * M.c, y = M.y + Math.floor(s / W) * M.c;
      if (isTerminal(s)) { out += terminalCell(x, y, M.c, s, false); continue; }
      var row = Q.rowOf(T, s), seen = row.some(function (v) { return v !== 0; });
      out += '<g class="qm-cell" data-s="' + s + '">' + cross(x, y, M.c, row, { numbers: seen && opts.numbers !== false ? 15 : 0, arrow: true, hi: u && u.s === s ? u.a : -1 }) + '</g>';
    }
    out += '<text x="' + (M.x + M.c / 2) + '" y="' + (M.y + 4 * M.c + 22) + '" text-anchor="middle" font-size="17" class="c-blue">start</text>';
    out += '<text x="' + (M.x + 5.5 * M.c + M.c / 2) + '" y="' + (M.y + 4 * M.c + 22) + '" text-anchor="middle" font-size="17" class="c-red">cliff: −100, back to start</text>';
    out += '<text x="' + (M.x + 11 * M.c + M.c / 2) + '" y="' + (M.y + 4 * M.c + 22) + '" text-anchor="middle" font-size="17" class="c-green">flag</text>';
    if (u && !u.done) {
      // the move just learned from: from the cell, in the direction taken, to where it landed
      var sx = M.x + (u.s % W) * M.c + M.c / 2, sy = M.y + Math.floor(u.s / W) * M.c + M.c / 2;
      var tx = M.x + (u.s2 % W) * M.c + M.c / 2, ty = M.y + Math.floor(u.s2 / W) * M.c + M.c / 2;
      if (u.s2 !== u.s) out += '<path d="M' + sx + ' ' + sy + 'Q' + ((sx + tx) / 2 + (ty - sy) * 0.18) + ' ' + ((sy + ty) / 2 - (tx - sx) * 0.18) + ' ' + tx + ' ' + ty + '" fill="none" class="s-yellow" stroke-width="2.4" stroke-dasharray="3 5"/>';
    }
    if (sel >= 0 && !isTerminal(sel)) {
      var rx = M.x + (sel % W) * M.c, ry = M.y + Math.floor(sel / W) * M.c;
      out += '<rect class="qm-sel s-red" x="' + (rx - 3) + '" y="' + (ry - 3) + '" width="' + (M.c + 6) + '" height="' + (M.c + 6) + '" fill="none" stroke-width="4"/>';
    }
    return out;
  }
  function statusText(Q, f) {
    var T = Q.tableAt(f.t), wk = Q.greedyWalk(T), falls = Q.fallsAt(f.t);
    var head = 'After ' + f.t.toLocaleString('en-US') + ' update' + (f.t === 1 ? '' : 's') + (f.kind === 'snapshot' ? ' (recorded table)' : '');
    return head + ' · ' + falls + ' fall' + (falls === 1 ? '' : 's') + ' · arrows from the start: ' +
      (wk.goal ? 'flag in ' + wk.steps + ' moves' : 'no flag yet');
  }
  function renderCell(Q, t, sel) {
    var T = Q.tableAt(t), C = CELL, row = Q.rowOf(T, sel), b = bestOfRow(row), out = '';
    out += cross(C.x, C.y, C.size, row, { numbers: 25, long: true, arrow: true });
    var lx = 318, y0 = 470;
    out += '<text x="' + lx + '" y="' + y0 + '" font-size="22" class="c-chalk">The red-square cell, up close</text>';
    if (!b.seen) {
      out += '<text x="' + lx + '" y="' + (y0 + 44) + '" font-size="21" class="c-dim">All four scores are still 0:</text>';
      out += '<text x="' + lx + '" y="' + (y0 + 74) + '" font-size="21" class="c-dim">no move from here was tried yet.</text>';
    } else if (b.tie) {
      out += '<text x="' + lx + '" y="' + (y0 + 44) + '" font-size="21" class="c-blue">value = max = ' + fmt(b.v) + '</text>';
      out += '<text x="' + lx + '" y="' + (y0 + 78) + '" font-size="21" class="c-dim">several moves tie for the best</text>';
    } else {
      out += '<text x="' + lx + '" y="' + (y0 + 44) + '" font-size="22" class="c-blue">value = max = ' + fmt(b.v) + '</text>';
      out += '<text x="' + lx + '" y="' + (y0 + 80) + '" font-size="22" class="c-blue">move = argmax = ' + ARROW[b.a] + ' ' + ACT[b.a] + '</text>';
    }
    out += '<text x="' + lx + '" y="' + (y0 + 122) + '" font-size="17" class="c-dim">Where it is on the map:</text>';
    out += locator(LOC, [sel]);
    return out;
  }
  function renderMath(Q, f) {
    var x0 = 34, y0 = 760, out = '';
    var u = f.kind === 'update' ? Q.updateAt(f.t) : null;
    if (!u) {
      out += '<text x="' + x0 + '" y="' + y0 + '" font-size="25" class="c-yellow">' + (f.t === 0 ? 'Before the first update' : 'Recorded table after ' + f.t.toLocaleString('en-US') + ' updates') + '</text>';
      out += '<text x="' + x0 + '" y="' + (y0 + 48) + '" font-size="21" class="c-dim">' + (f.t === 0 ? 'Every score is 0. Step forward to watch one update.' : 'Step to an update between 1 and ' + Q.N + ' to see its arithmetic.') + '</text>';
      return out;
    }
    var cs = 92, sx = x0, sy = y0 + 22, s2x = x0 + 270;
    out += '<text x="' + x0 + '" y="' + y0 + '" font-size="25" class="c-yellow">Update ' + u.t + '</text>';
    out += cross(sx, sy, cs, Q.rowOf(Q.tableAt(u.t - 1), u.s), { numbers: 13, long: true, hi: u.a });
    var verb = u.r === -100 ? 'falls off the cliff' : u.done ? 'reaches the flag' : u.s2 === u.s ? 'bumps the wall' : 'moves';
    out += '<text x="' + (sx + cs / 2) + '" y="' + (sy + cs + 24) + '" text-anchor="middle" font-size="17" class="c-dim">s: ' + ARROW[u.a] + ' ' + ACT[u.a] + '</text>';
    out += '<path d="M' + (sx + cs + 12) + ' ' + (sy + cs / 2) + 'Q' + ((sx + cs + s2x) / 2) + ' ' + (sy + cs / 2 - 22) + ' ' + (s2x - 12) + ' ' + (sy + cs / 2) + '" fill="none" class="s-chalk" stroke-width="2.2"/>' +
      '<path d="M' + (s2x - 22) + ' ' + (sy + cs / 2 - 9) + 'L' + (s2x - 11) + ' ' + (sy + cs / 2) + 'L' + (s2x - 24) + ' ' + (sy + cs / 2 + 6) + '" fill="none" class="s-chalk" stroke-width="2.2"/>';
    out += '<text x="' + ((sx + cs + s2x) / 2) + '" y="' + (sy + cs / 2 - 30) + '" text-anchor="middle" font-size="16" class="c-chalk">' + verb + ', r = ' + fmt(u.r) + '</text>';
    if (u.done) {
      out += '<text x="' + (s2x + 6) + '" y="' + (sy + cs / 2 + 6) + '" font-size="19" class="c-green">flag: nothing follows</text>';
    } else {
      out += cross(s2x, sy, cs, u.row2, { numbers: 13, long: true, borrow: u.maxA });
      out += '<text x="' + (s2x + cs / 2) + '" y="' + (sy + cs + 24) + '" text-anchor="middle" font-size="17" class="c-dim">s′: best score</text>';
    }
    // A large negative score in either drawn cell that an earlier fall wrote: say where it came from.
    var fall = fallNote(Q, u);
    if (fall) {
      var fx = 416, fy = sy + 16;
      out += '<text x="' + fx + '" y="' + fy + '" font-size="16" class="c-red">' + fmt(fall.nq) + ' came from update ' + fall.t + ':</text>';
      out += '<text x="' + fx + '" y="' + (fy + 24) + '" font-size="16" class="c-dim">a fall off the cliff, r = −100,</text>';
      out += '<text x="' + fx + '" y="' + (fy + 48) + '" font-size="16" class="c-dim">' + fmt(fall.old) + ' moved halfway to ' + fmt(fall.target) + '</text>';
    }
    var ly = sy + cs + 70;
    out += '<text x="' + x0 + '" y="' + ly + '" font-size="23" class="c-chalk">target = r + γ · <tspan class="c-blue">max Q(s′, ·)</tspan></text>';
    if (u.done) out += '<text x="' + x0 + '" y="' + (ly + 36) + '" font-size="23" class="c-chalk">target = r = ' + fmt(u.r) + '</text>';
    else out += '<text x="' + (x0 + 72) + '" y="' + (ly + 36) + '" font-size="23" class="c-chalk">= ' + fmt(u.r) + ' + 0.99 × <tspan class="c-blue">(' + fmt(u.max) + ')</tspan> = ' + fmt(u.target) + '</text>';
    out += '<text x="' + x0 + '" y="' + (ly + 84) + '" font-size="23" class="c-chalk"><tspan class="c-yellow">Q(s, a)</tspan> ← old + α · (target − old)</text>';
    var res = '= <tspan class="c-yellow">' + fmt(u.old) + '</tspan> + 0.5 × (' + fmt(u.target) + ' − (' + fmt(u.old) + ')) = ';
    out += '<text x="' + (x0 + 72) + '" y="' + (ly + 120) + '" font-size="23" class="c-chalk">' + res + '<tspan class="c-yellow" font-weight="700">' + fmt(u.nq) + '</tspan></text>';
    out += '<text x="' + x0 + '" y="' + (ly + 162) + '" font-size="17" class="c-dim">γ = 0.99, the discount: later rewards count a little less</text>';
    out += '<text x="' + x0 + '" y="' + (ly + 186) + '" font-size="17" class="c-dim">α = 0.5, the step size: move halfway to the target</text>';
    return out;
  }
  // The latest fall that wrote a score of at most -20 into the cell being updated (its other moves)
  // or into the next cell, before update u. Returns that recorded update, or null.
  function fallNote(Q, u) {
    var log = Q.D.log, T = Q.tableAt(u.t - 1), picks = [];
    for (var a = 0; a < A; a++) if (a !== u.a && T[u.s * A + a] <= -20) picks.push([u.s, a]);
    if (!u.done) for (a = 0; a < A; a++) if (T[u.s2 * A + a] <= -20 && !(u.s2 === u.s && a === u.a)) picks.push([u.s2, a]);
    for (var i = 0; i < picks.length; i++) {
      for (var k = u.t - 2; k >= 0; k--) {
        if (log[k][0] === picks[i][0] && log[k][1] === picks[i][1]) { if (log[k][2] === -100) return Q.updateAt(k + 1); break; }
      }
    }
    return null;
  }
  function renderCredit(Q, t) {
    var a19 = Q.updateAt(19), a24 = Q.updateAt(24), out = '';
    var T24 = Q.tableAt(24), C = 164, x1 = 50, x2 = 330, y0 = CREDIT_Y, y = y0 + 40;
    var row24a = Q.rowOf(T24, a19.s), row24b = Q.rowOf(T24, a24.s);
    out += '<text x="34" y="' + y0 + '" font-size="24" class="c-yellow">Update 19 writes a score, update 24 reads it</text>';
    out += cross(x1, y, C, row24a, { numbers: 17, long: true, hi: a19.a });
    out += cross(x2, y, C, row24b, { numbers: 17, long: true, hi: a24.a });
    out += '<text x="' + (x1 + C / 2) + '" y="' + (y + C + 26) + '" text-anchor="middle" font-size="17" class="c-dim">above the start</text>';
    out += '<text x="' + (x2 + C / 2) + '" y="' + (y + C + 26) + '" text-anchor="middle" font-size="17" class="c-dim">one step to its right</text>';
    // update 19: the right score of the left cell falls from 0, so its best score becomes -0.5
    out += '<text x="' + (x1 + C / 2) + '" y="' + (y - 12) + '" text-anchor="middle" font-size="17" class="' + (t === 19 ? 'c-yellow' : 'c-chalk') + '">19: → 0 to ' + fmt(a19.nq) + ', best now ' + fmt(Math.max.apply(null, row24a)) + '</text>';
    out += '<text x="' + (x2 + C / 2) + '" y="' + (y - 12) + '" text-anchor="middle" font-size="17" class="' + (t === 24 ? 'c-yellow' : 'c-chalk') + '">24: ← reads that best</text>';
    // information flows from the cell you arrive in back to the move that led there
    out += '<path d="M' + (x1 + C * 0.62) + ' ' + (y + C * 0.62) + 'C' + (x1 + C + 40) + ' ' + (y + C + 60) + ' ' + (x2 - 40) + ' ' + (y + C + 30) + ' ' + (x2 + C * 0.2) + ' ' + (y + C * 0.56) + '" fill="none" class="s-blue" stroke-width="3"/>';
    out += '<path d="M' + (x2 + C * 0.2 - 14) + ' ' + (y + C * 0.56 + 2) + 'L' + (x2 + C * 0.2) + ' ' + (y + C * 0.56) + 'L' + (x2 + C * 0.2 - 6) + ' ' + (y + C * 0.56 + 14) + '" fill="none" class="s-blue" stroke-width="3"/>';
    out += '<text x="' + ((x1 + x2 + C) / 2) + '" y="' + (y + C + 62) + '" text-anchor="middle" font-size="18" class="c-blue">the cost seen after arriving flows back</text>';
    // update 24's move goes the other way: from the right cell into the left one
    var my = y + C * 0.3, mx1 = x2 - 10, mx2 = x1 + C + 10;
    out += '<path d="M' + mx1 + ' ' + my + 'Q' + ((mx1 + mx2) / 2) + ' ' + (my - 8) + ' ' + mx2 + ' ' + my + 'M' + (mx2 + 11) + ' ' + (my - 8) + 'L' + mx2 + ' ' + my + 'L' + (mx2 + 11) + ' ' + (my + 7) + '" fill="none" class="s-chalk" stroke-width="2.4"/>';
    out += '<text x="' + ((mx1 + mx2) / 2) + '" y="' + (my - 16) + '" text-anchor="middle" font-size="16" class="c-chalk">move at 24</text>';
    out += '<text x="34" y="' + (y + C + 104) + '" font-size="22" class="c-chalk">target = −1 + 0.99 × <tspan class="c-blue">(' + fmt(a24.max) + ')</tspan> = ' + fmt(a24.target) + '</text>';
    out += '<text x="34" y="' + (y + C + 138) + '" font-size="22" class="c-chalk">new ← score = 0 + 0.5 × (' + fmt(a24.target) + ' − 0) = <tspan class="c-yellow">' + fmt(a24.nq) + '</tspan></text>';
    out += '<text x="560" y="' + (y + 2) + '" font-size="16" class="c-dim">on the map:</text>';
    out += locator({ x: 560, y: y + 14, c: 20 }, [a19.s, a24.s]);
    return out;
  }
  function describe(Q, t, sel) {
    var row = Q.rowOf(Q.tableAt(t), sel), b = bestOfRow(row);
    return 'Selected cell: ' + where(sel) + '. Scores: ' + ACT.map(function (n, a) { return n + ' ' + fmt(row[a]); }).join(', ') + '.' +
      (b.seen && !b.tie ? ' Best move: ' + ACT[b.a] + ', value ' + fmt(b.v) + '.' : '');
  }

  var API = { make: make, renderMap: renderMap, renderCell: renderCell, renderMath: renderMath, renderCredit: renderCredit, statusText: statusText, describe: describe, fmt: fmt, MAP: MAP, START: START, isTerminal: isTerminal };
  if (typeof module === 'object' && module.exports) { module.exports = API; return; }
  root.RLQMap = API;

  // ------------------------------------------------------------------ browser controller
  var DEFAULT = { world: 0, table: 10000, readouts: 10000, update: 6, credit: 24 };
  function mount(rc) {
    var D = root.RL_QTABLE; if (!D) return;
    var Q = make(D), svg = rc.querySelector('svg.rc-svg');
    var gMap = svg.querySelector('[data-qm="map"]'), gStatus = svg.querySelector('[data-qm="status"]');
    var gCell = svg.querySelector('[data-qm="cell"]'), gMath = svg.querySelector('[data-qm="math"]'), gCredit = svg.querySelector('[data-qm="credit"]');
    var bar = rc.querySelector('.qm-toolbar'); if (!gMap || !bar) return;
    var slider = bar.querySelector('input[type="range"]'), back = bar.querySelector('[data-qm-step="-1"]'), fwd = bar.querySelector('[data-qm-step="1"]');
    var readout = bar.querySelector('.qm-readout'), live = rc.querySelector('.qm-live');
    var frames = Q.frames, idx = 0, pinned = -1, view = null;
    slider.max = String(frames.length - 1);
    function frameIndex(t) { for (var k = 0; k < frames.length; k++) if (frames[k].t === t) return k; return 0; }
    function draw(announce) {
      var f = frames[idx], u = f.kind === 'update' ? Q.updateAt(f.t) : null;
      var sel = pinned >= 0 ? pinned : (u ? u.s : START);
      gMap.innerHTML = renderMap(Q, f.t, sel, { update: true });
      if (gStatus) gStatus.textContent = statusText(Q, f);
      if (gCell) gCell.innerHTML = renderCell(Q, f.t, sel);
      if (gMath) gMath.innerHTML = renderMath(Q, f);
      if (gCredit) gCredit.innerHTML = renderCredit(Q, f.t);
      slider.value = String(idx);
      var label = (f.kind === 'snapshot' ? 'recorded table after ' : 'after ') + f.t.toLocaleString('en-US') + ' update' + (f.t === 1 ? '' : 's');
      slider.setAttribute('aria-valuetext', label);
      readout.textContent = (f.kind === 'snapshot' ? '' : 'update ') + f.t.toLocaleString('en-US') + (f.kind === 'snapshot' ? ' (recorded)' : '');
      back.disabled = idx === 0;
      fwd.disabled = idx >= frames.length - 1;
      if (announce && live) live.textContent = label + '. ' + describe(Q, f.t, sel);
    }
    function go(k, announce) { idx = Math.max(0, Math.min(frames.length - 1, k)); draw(announce); }
    slider.addEventListener('input', function () { pinned = -1; go(+slider.value, true); });
    back.addEventListener('click', function () { pinned = -1; go(idx - 1, true); });
    fwd.addEventListener('click', function () { pinned = -1; go(idx + 1, true); });
    // Click or tap a cell to select it; arrow keys move the selection while the map has focus.
    gMap.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.qm-cell'); if (!c) return;
      pinned = +c.getAttribute('data-s'); draw(true);
    });
    gMap.addEventListener('keydown', function (e) {
      var d = { ArrowUp: -W, ArrowDown: W, ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (!d) return;
      e.preventDefault();
      var f = frames[idx], u = f.kind === 'update' ? Q.updateAt(f.t) : null, cur = pinned >= 0 ? pinned : (u ? u.s : START), n = cur + d;
      if ((d === 1 || d === -1) && Math.floor(n / W) !== Math.floor(cur / W)) return;
      if (n < 0 || n >= W * H || isTerminal(n)) return;
      pinned = n; draw(true);
    });
    // Text buttons such as "show update 19" jump the map to a recorded update.
    [].forEach.call(document.querySelectorAll('[data-qm-frame]'), function (b) {
      b.addEventListener('click', function () { pinned = -1; go(frameIndex(+b.getAttribute('data-qm-frame')), true); });
    });
    // Follow the reading position: each section starts from the update its text discusses.
    function onView() {
      var v = rc.getAttribute('data-active-view');
      if (v === view) return; view = v;
      if (DEFAULT[v] !== undefined) { pinned = -1; go(frameIndex(DEFAULT[v]), false); }
    }
    new MutationObserver(onView).observe(rc, { attributes: true, attributeFilter: ['data-active-view'] });
    // Small screens show the close-up instead of the tiny map numbers.
    var vw = rc.querySelector('.rc-view');
    function narrow() { rc.classList.toggle('qm-narrow', vw.clientWidth < 560); }
    if (root.ResizeObserver) new ResizeObserver(narrow).observe(vw);
    narrow();
    go(frameIndex(10000), false);
    onView();
  }
  function boot() { [].forEach.call(document.querySelectorAll('.rc'), function (rc) { if (rc.querySelector('[data-qm="map"]')) mount(rc); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : globalThis);
