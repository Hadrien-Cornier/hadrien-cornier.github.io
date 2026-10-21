/* The Q table, filling in, for "Q-learning on a grid".
   Mount point: <div class="qt-widget"></div>. Needs qtable-data.js first (window.RL_QTABLE).
   Data: one real run of the Breaking Bellman cliff walk (Q-learning, table, step size 0.5, discount 0.99, one random move in ten, seed 202).
   Updates 1 to 400 are replayed one by one from the recorded update log; later frames are recorded snapshots of the whole table.
   Nothing here is simulated in the page: the table at any frame is the recorded one. The page only reads it as a grid, a table and a walk. */
(function () {
  'use strict';
  var D = window.RL_QTABLE;
  if (!D) return;
  var W = 12, H = 4, A = 4, N = D.log.length;
  var GAMMA = D.gamma, ALPHA = D.alpha;
  var ACT = ['up', 'right', 'down', 'left'];
  var ARROW = ['↑', '→', '↓', '←'];
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  var START = 36, GOAL = 47;
  var isCliff = function (s) { return s > 36 && s < 47; };
  var isTerminalOrCliff = function (s) { return s === GOAL || isCliff(s); };
  var ROUTE = [36, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  var EXCERPT = [36, 24, 25, 29, 34, 35, 17, 0];
  var JUMPS = [
    { label: '0', t: 0 }, { label: '1', t: 1 }, { label: '5', t: 5 }, { label: '20', t: 20 }, { label: '100', t: 100 },
    { label: '185', t: 185, note: 'first flag' }, { label: '300', t: 300 }, { label: '1,000', t: 1000 }, { label: '1,670', t: 1670 },
    { label: '2,000', t: 2000 }, { label: '10,000', t: 10000 }
  ];
  var frames = [];
  for (var i = 0; i <= N; i++) frames.push({ t: i, kind: 'update' });
  D.snapT.forEach(function (t) { frames.push({ t: t, kind: 'snapshot' }); });

  function frameIndex(t) { for (var k = 0; k < frames.length; k++) if (frames[k].t === t) return k; return 0; }
  var cacheT = -1, cacheTable = null;
  function tableAt(t) {
    if (t > N) return D.snaps[t];
    var T = new Array(W * H * A).fill(0), k;
    for (k = 0; k < t; k++) { var u = D.log[k]; T[u[0] * A + u[1]] = u[5]; }
    return T;
  }
  function getTable(t) { if (t !== cacheT) { cacheTable = tableAt(t); cacheT = t; } return cacheTable; }
  function rowOf(T, s) { return [T[s * A], T[s * A + 1], T[s * A + 2], T[s * A + 3]]; }
  function bestOf(row) { var b = 0, k, tie = false; for (k = 1; k < A; k++) { if (row[k] > row[b]) { b = k; tie = false; } else if (row[k] === row[b]) tie = true; } return { a: b, v: row[b], tie: tie }; }
  function fmt(x) {
    if (x === 0) return '0';
    var s = (Math.round(x * 100) / 100).toFixed(2);
    return s.replace('-', '−');
  }
  function fmt3(x) { var s = String(Math.round(x * 1000) / 1000); return s.replace('-', '−'); }
  function cellName(s) { return '(' + Math.floor(s / W) + ',' + (s % W) + ')'; }
  function step(s, a) {
    var r = Math.floor(s / W), c = s % W, nr = r + DR[a], nc = c + DC[a];
    if (nr < 0 || nr >= H || nc < 0 || nc >= W) { nr = r; nc = c; }
    var rew = -1, done = false;
    if (nr === 3 && nc > 0 && nc < 11) { nr = 3; nc = 0; rew = -100; } else if (nr === 3 && nc === 11) done = true;
    return { s2: nr * W + nc, r: rew, done: done };
  }
  function greedyWalk(T) {
    var s = START, n = 0, path = [s];
    while (n < 40) {
      var b = bestOf(rowOf(T, s)).a, x = step(s, b);
      s = x.s2; n++; path.push(s);
      if (x.done) return { goal: true, steps: n, path: path };
    }
    return { goal: false, steps: n, path: path };
  }

  var css = '' +
    '.qt-widget{margin:28px 0 34px;border:1px solid var(--line,#dcded6);background:#fff;padding:14px 14px 12px;font:13px/1.45 Arial,Helvetica,sans-serif;color:var(--ink,#242622)}' +
    '.qt-widget *{box-sizing:border-box}' +
    '.qt-widget p{margin:0;font-size:13px;line-height:1.5}' +
    '.qt-head{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;margin:0 0 8px}' +
    '.qt-head b{font:600 14px/1.4 Arial,Helvetica,sans-serif}' +
    '.qt-head span{color:var(--muted,#656b62)}' +
    '.qt-slider{width:100%;margin:6px 0 8px;accent-color:#8f1d36}' +
    '.qt-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}' +
    '.qt-chips button,.qt-step button{font:600 12.5px/1 Arial,Helvetica,sans-serif;border:1px solid var(--ink,#242622);background:#fff;color:var(--ink,#242622);padding:8px 10px;min-height:34px;cursor:pointer;border-radius:2px}' +
    '.qt-chips button:hover,.qt-step button:hover{background:#f4f5f0}' +
    '.qt-chips button[aria-pressed="true"]{background:#8f1d36;color:#fff;border-color:#8f1d36}' +
    '.qt-chips button[disabled],.qt-step button[disabled]{opacity:.45;cursor:default}' +
    '.qt-step{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}' +
    '.qt-sub{font:600 12.5px/1.3 Arial,Helvetica,sans-serif;margin:14px 0 6px;color:var(--ink,#242622)}' +
    '.qt-grid{display:block;width:100%;height:auto;max-width:600px;margin:0 auto}' +
    '.qt-grid .qt-cell{cursor:pointer}' +
    '.qt-grid .qt-cell:focus{outline:none}' +
    '.qt-grid .qt-cell:focus-visible rect.qt-box{stroke:#8f1d36;stroke-width:3}' +
    '.qt-tablewrap{overflow-x:auto;-webkit-overflow-scrolling:touch}' +
    '.qt-table{border-collapse:collapse;width:100%;min-width:330px;font:12.5px/1.3 ui-monospace,Menlo,monospace}' +
    '.qt-table th{font:600 12px/1.3 Arial,Helvetica,sans-serif;color:var(--muted,#656b62);text-align:right;padding:5px 7px;border-bottom:1px solid var(--line,#dcded6);white-space:nowrap}' +
    '.qt-table th:first-child,.qt-table td:first-child{text-align:left}' +
    '.qt-table th:last-child{text-align:center}' +
    '.qt-table th:last-child,.qt-table td:last-child{padding-left:4px;padding-right:4px;width:40px}' +
    '@media(max-width:520px){.qt-widget .qt-table{min-width:0 !important;font-size:11px !important}.qt-widget .qt-table th{font-size:11px !important;padding:5px 3px !important}.qt-widget .qt-table td{font-size:11px !important;padding:5px 3px !important}.qt-widget .qt-table th,.qt-widget .qt-table td{min-width:0 !important}.qt-widget .qt-table th:nth-child(6),.qt-widget .qt-table td:nth-child(6){display:none}.qt-widget .qt-hd{display:none}}' +
    '.qt-table td{text-align:right;padding:5px 7px;border-bottom:1px solid #eceee7;white-space:nowrap}' +
    '.qt-table td.qt-max{font-weight:700;background:#eef3f6}' +
    '.qt-table td.qt-new{outline:2px solid #8f1d36;outline-offset:-2px}' +
    '.qt-table tr.qt-sel td{background:#fbeef1}' +
    '.qt-table tr.qt-sel td.qt-max{background:#f6dbe1}' +
    '.qt-table td.qt-pi{font:700 15px/1 Arial,Helvetica,sans-serif;text-align:center}' +
    '.qt-table tbody tr{cursor:pointer}' +
    '.qt-update{border:1px solid var(--line,#dcded6);background:#f8f9f4;padding:9px 11px;margin:12px 0 0;min-height:6.6em}' +
    '.qt-update p+p{margin-top:3px}' +
    '.qt-update code{font:12.5px/1.4 ui-monospace,Menlo,monospace}' +
    '.qt-walk{margin:8px 0 0;color:var(--muted,#656b62)}' +
    '.qt-more{margin:10px 0 0}' +
    '.qt-more summary{cursor:pointer;font:600 12.5px/1.4 Arial,Helvetica,sans-serif}' +
    '.qt-note{font-size:12px;color:var(--muted,#656b62);margin:8px 0 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name), k;
    for (k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function tint(v) {
    if (v >= 0) return '#f1f2ed';
    var f = Math.min(1, -v / 13);
    // pale to blue as the number gets more negative
    var r = Math.round(241 + (43 - 241) * f * 0.55), g = Math.round(242 + (106 - 242) * f * 0.55), b = Math.round(237 + (142 - 237) * f * 0.55);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function mount(root) {
    var idx = 0, pinned = -1;
    root.innerHTML = '';
    var head = document.createElement('div'); head.className = 'qt-head';
    var title = document.createElement('b'); title.textContent = 'The table, step by step';
    var readout = document.createElement('span'); head.appendChild(title); head.appendChild(readout);
    var slider = document.createElement('input'); slider.type = 'range'; slider.min = 0; slider.max = frames.length - 1; slider.step = 1; slider.value = 0; slider.className = 'qt-slider';
    slider.setAttribute('aria-label', 'Learning step: updates 0 to ' + N + ', then four later snapshots');
    var stepBar = document.createElement('div'); stepBar.className = 'qt-step';
    var back = document.createElement('button'); back.type = 'button'; back.textContent = '← One update back';
    var fwd = document.createElement('button'); fwd.type = 'button'; fwd.textContent = 'One update forward →';
    stepBar.appendChild(back); stepBar.appendChild(fwd);
    var chips = document.createElement('div'); chips.className = 'qt-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Jump to an update count');
    var chipBtns = JUMPS.map(function (j) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = j.label; b.title = j.note ? 'After ' + j.label + ' updates: ' + j.note : 'After ' + j.label + ' updates';
      b.addEventListener('click', function () { go(frameIndex(j.t)); }); chips.appendChild(b); return b;
    });
    var gridTitle = document.createElement('p'); gridTitle.className = 'qt-sub'; gridTitle.textContent = 'Grid: the largest number in each row, and the move it picks';
    var svg = el('svg', { viewBox: '0 0 480 252', role: 'img', 'class': 'qt-grid' });
    var svgTitle = el('title', {}, 'The cliff grid with the largest number of each state and the greedy move');
    svg.appendChild(svgTitle);
    var tableTitle = document.createElement('p'); tableTitle.className = 'qt-sub'; tableTitle.textContent = 'Table: one row per cell, one column per move';
    var tw = document.createElement('div'); tw.className = 'qt-tablewrap';
    var upd = document.createElement('div'); upd.className = 'qt-update'; upd.setAttribute('aria-live', 'off');
    var walk = document.createElement('p'); walk.className = 'qt-walk';
    var routeTitle = document.createElement('p'); routeTitle.className = 'qt-sub'; routeTitle.textContent = 'Along the best route: learned largest number against the exact value';
    var rsvg = el('svg', { viewBox: '0 0 480 230', role: 'img', 'class': 'qt-grid' });
    var more = document.createElement('details'); more.className = 'qt-more';
    var ms = document.createElement('summary'); ms.textContent = 'Show the whole table (37 cells a robot can stand on)'; more.appendChild(ms);
    var mw = document.createElement('div'); mw.className = 'qt-tablewrap'; more.appendChild(mw);
    var note = document.createElement('p'); note.className = 'qt-note';
    note.textContent = 'Recorded run of Breaking Bellman at commit 681cae3: cliff walk, Q-learning with a table, step size 0.5, discount 0.99, one random move in ten, seed 202. Updates 1 to 400 replay the recorded update log. Later frames are recorded snapshots of the whole table. The grid, the table and the walk are three readings of the same 192 numbers.';
    [head, slider, stepBar, chips, gridTitle, svg, tableTitle, tw, upd, walk, more, routeTitle, rsvg, note].forEach(function (n) { root.appendChild(n); });

    function fallsAt(t) {
      if (D.falls[t] !== undefined) return D.falls[t];
      var n = 0, i;
      for (i = 0; i < t && i < D.log.length; i++) if (D.log[i][2] === -100) n++;
      return n;
    }

    function exactV(s) { return Math.max(D.qstar[s * A], D.qstar[s * A + 1], D.qstar[s * A + 2], D.qstar[s * A + 3]); }

    function renderTable(host, T, states, sel, lastU) {
      var html = '<table class="qt-table"><thead><tr><th scope="col">Cell</th>';
      ARROW.forEach(function (g, a) { html += '<th scope="col" title="' + ACT[a] + '">' + g + '<span class="qt-hd"> ' + ACT[a] + '</span></th>'; });
      html += '<th scope="col" title="V_Q(s) = max over moves of Q(s,a)">max</th><th scope="col" title="greedy move">pick</th></tr></thead><tbody>';
      states.forEach(function (s) {
        var row = rowOf(T, s), b = bestOf(row), seen = row.some(function (x) { return x !== 0; });
        html += '<tr data-s="' + s + '" role="button" tabindex="0" aria-label="Pin row for cell ' + cellName(s) + '"' + (s === sel ? ' class="qt-sel"' : '') + '><td>' + cellName(s) + (s === START ? ' start' : '') + '</td>';
        row.forEach(function (x, a) {
          var cls = '';
          if (seen && x === b.v && !b.tie) cls += ' qt-max';
          if (lastU && lastU[0] === s && lastU[1] === a) cls += ' qt-new';
          html += '<td' + (cls ? ' class="' + cls.trim() + '"' : '') + '>' + fmt(x) + '</td>';
        });
        html += '<td>' + (seen ? fmt(b.v) : '0') + '</td><td class="qt-pi" title="' + (seen && !b.tie ? ACT[b.a] : 'no single largest number') + '">' + (seen && !b.tie ? ARROW[b.a] : '–') + '</td></tr>';
      });
      host.innerHTML = html + '</tbody></table>';
      Array.prototype.forEach.call(host.querySelectorAll('tbody tr'), function (tr) {
        function toggle() { var s = +tr.getAttribute('data-s'); pinned = pinned === s ? -1 : s; draw(); }
        tr.addEventListener('click', toggle);
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); tr.focus(); } });
      });
    }

    function drawGrid(T, sel, lastU) {
      while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);
      var X0 = 24, Y0 = 22, C = 37, r, c, k;
      for (c = 0; c < W; c++) svg.appendChild(el('text', { x: X0 + c * C + C / 2, y: 14, 'text-anchor': 'middle', 'font-size': 11, 'font-family': 'Arial, Helvetica, sans-serif', fill: '#656b62' }, String(c)));
      for (r = 0; r < H; r++) {
        for (c = 0; c < W; c++) {
          var s = r * W + c, x = X0 + c * C, y = Y0 + r * C;
          var g = el('g', { 'class': 'qt-cell', tabindex: isTerminalOrCliff(s) ? '-1' : '0', role: isTerminalOrCliff(s) ? 'img' : 'button', 'data-s': s });
          var row = rowOf(T, s), b = bestOf(row), seen = row.some(function (v) { return v !== 0; });
          var fill = isCliff(s) ? '#4a4d47' : s === GOAL ? '#f3e3a8' : tint(seen ? b.v : 0);
          g.appendChild(el('rect', { 'class': 'qt-box', x: x + 0.75, y: y + 0.75, width: C - 1.5, height: C - 1.5, fill: fill, stroke: s === sel ? '#8f1d36' : '#cfd1c8', 'stroke-width': s === sel ? 3 : 1 }));
          if (isCliff(s)) {
            g.appendChild(el('text', { x: x + C / 2, y: y + C / 2 + 4, 'text-anchor': 'middle', 'font-size': 9.5, fill: '#f1f2ed', 'font-family': 'Arial, Helvetica, sans-serif' }, 'cliff'));
            g.setAttribute('aria-label', 'cell ' + cellName(s) + ', cliff');
          } else if (s === GOAL) {
            g.appendChild(el('text', { x: x + C / 2, y: y + C / 2 + 4, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: '#242622', 'font-family': 'Arial, Helvetica, sans-serif' }, 'flag'));
            g.setAttribute('aria-label', 'cell ' + cellName(s) + ', flag');
          } else {
            if (seen && !b.tie) {
              var cx = x + C / 2, cy = y + 14, a = b.a, dx = DC[a] * 8, dy = DR[a] * 8;
              g.appendChild(el('line', { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy, stroke: '#242622', 'stroke-width': 2, 'stroke-linecap': 'round' }));
              var hx = cx + dx, hy = cy + dy;
              g.appendChild(el('path', { d: 'M' + hx + ',' + hy + ' l' + (-DC[a] * 5 + DR[a] * 3.5) + ',' + (-DR[a] * 5 + DC[a] * 3.5) + ' l' + (-DR[a] * 7) + ',' + (-DC[a] * 7) + ' z', fill: '#242622' }));
            }
            g.appendChild(el('text', { x: x + C / 2, y: y + C - 6, 'text-anchor': 'middle', 'font-size': 10.5, 'font-family': 'ui-monospace, Menlo, monospace', fill: '#242622' }, seen ? (b.v <= -10 ? String(Math.round(b.v)).replace('-', '−') : fmt3(Math.round(b.v * 10) / 10)) : '0'));
            if (s === START) g.appendChild(el('text', { x: x + 4, y: y + 11, 'font-size': 9.5, 'font-weight': 700, fill: '#2b6a8e', 'font-family': 'Arial, Helvetica, sans-serif' }, 'S'));
            g.setAttribute('aria-label', 'cell ' + cellName(s) + ', largest number ' + (seen ? fmt(b.v) : '0') + (seen && !b.tie ? ', move ' + ACT[b.a] : ''));
            (function (sc) {
              g.addEventListener('click', function () { pinned = pinned === sc ? -1 : sc; draw(); });
              g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === sc ? -1 : sc; draw(); var again = svg.querySelector('[data-s="' + sc + '"]'); if (again) again.focus(); } });
            })(s);
          }
          svg.appendChild(g);
        }
      }
      // the move of the update being shown: from its cell, in the direction taken
      if (lastU) {
        var u = lastU, sr = Math.floor(u[0] / W), scn = u[0] % W, px = X0 + scn * C + C / 2, py = Y0 + sr * C + C / 2;
        var fell = u[2] === -100, col = fell ? '#b44c2c' : '#2b6a8e';
        var tr = Math.floor(u[3] / W), tcn = u[3] % W;
        svg.appendChild(el('rect', { x: X0 + tcn * C + 3, y: Y0 + tr * C + 3, width: C - 6, height: C - 6, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 3' }));
        var mx = px + DC[u[1]] * (C * 0.45), my = py + DR[u[1]] * (C * 0.45);
        svg.appendChild(el('circle', { cx: px, cy: py + 2, r: 4.5, fill: col }));
        svg.appendChild(el('line', { x1: px, y1: py + 2, x2: mx, y2: my + 2, stroke: col, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 3' }));
      }
      var ly = Y0 + H * C + 18;
      svg.appendChild(el('text', { x: 12, y: ly, 'font-size': 12.5, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, 'Top view of the 4 by 12 grid. Colour and number: largest number in the row.'));
      svg.appendChild(el('text', { x: 12, y: ly + 17, 'font-size': 12.5, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, 'Arrow: the move with the largest number (0 means never updated).'));
      svg.appendChild(el('text', { x: 12, y: ly + 34, 'font-size': 12.5, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, 'Dashed: the move just learned from. Row 0 is the top row. Click a cell to pin its row.'));
      for (r = 0; r < H; r++) svg.appendChild(el('text', { x: 14, y: Y0 + r * C + C / 2 + 4, 'text-anchor': 'middle', 'font-size': 11, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, String(r)));
    }

    function drawRoute(T) {
      while (rsvg.firstChild) rsvg.removeChild(rsvg.firstChild);
      var L = 48, R = 468, TOP = 22, BOT = 156, k;
      var X = function (i) { return L + (R - L) * i / (ROUTE.length - 1); };
      var Y = function (v) { return TOP + (BOT - TOP) * (-v) / 13; };
      rsvg.appendChild(el('title', {}, 'Learned largest number along the 13 route cells against the exact optimal value'));
      [0, -4, -8, -12].forEach(function (v) {
        rsvg.appendChild(el('line', { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: '#e3e5dd', 'stroke-width': 1 }));
        rsvg.appendChild(el('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, v === 0 ? '0' : String(v).replace('-', '−')));
      });
      var exact = ROUTE.map(function (s) { return exactV(s); }), got = ROUTE.map(function (s) { return bestOf(rowOf(T, s)).v; });
      var pe = exact.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' '), pg = got.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' ');
      rsvg.appendChild(el('polyline', { points: pe, fill: 'none', stroke: '#2b6a8e', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
      rsvg.appendChild(el('polyline', { points: pg, fill: 'none', stroke: '#8f1d36', 'stroke-width': 2.5 }));
      got.forEach(function (v, i) { rsvg.appendChild(el('circle', { cx: X(i), cy: Y(v), r: 3.5, fill: '#8f1d36' })); });
      rsvg.appendChild(el('text', { x: X(0), y: BOT + 17, 'text-anchor': 'middle', 'font-size': 11.5, fill: '#2b6a8e', 'font-weight': 700, 'font-family': 'Arial, Helvetica, sans-serif' }, 'start'));
      rsvg.appendChild(el('text', { x: X(12) + 6, y: BOT + 17, 'text-anchor': 'end', 'font-size': 11.5, fill: '#2b6a8e', 'font-weight': 700, 'font-family': 'Arial, Helvetica, sans-serif' }, 'next to flag'));
      rsvg.appendChild(el('text', { x: 12, y: 14, 'font-size': 11.5, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, 'value (higher is better)'));
      rsvg.appendChild(el('text', { x: (L + R) / 2, y: BOT + 17, 'text-anchor': 'middle', 'font-size': 11.5, fill: '#656b62', 'font-family': 'Arial, Helvetica, sans-serif' }, 'the 13 cells of the best route'));
      rsvg.appendChild(el('line', { x1: 56, y1: 196, x2: 84, y2: 196, stroke: '#8f1d36', 'stroke-width': 2.5 }));
      rsvg.appendChild(el('text', { x: 90, y: 200, 'font-size': 12.5, fill: '#242622', 'font-family': 'Arial, Helvetica, sans-serif' }, 'learned: largest number in the row'));
      rsvg.appendChild(el('line', { x1: 56, y1: 214, x2: 84, y2: 214, stroke: '#2b6a8e', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
      rsvg.appendChild(el('text', { x: 90, y: 218, 'font-size': 12.5, fill: '#242622', 'font-family': 'Arial, Helvetica, sans-serif' }, 'exact optimal value (computed separately)'));
    }

    function updateText(f, T) {
      if (f.kind === 'snapshot') {
        return '<p><b>Snapshot after ' + f.t.toLocaleString('en-US') + ' updates.</b> The table here is the recorded one. The updates between 400 and ' + f.t.toLocaleString('en-US') + ' are in the data, not replayed here.</p>';
      }
      if (f.t === 0) return '<p><b>Before the first update.</b> All 192 numbers are 0. 44 of them belong to the cliff and the flag, which the robot never stands on, so they stay 0. The other 148 are 37 cells times 4 moves.</p>';
      var u = D.log[f.t - 1], s = u[0], a = u[1], r = u[2], s2 = u[3], done = u[4] === 1;
      var Tb = getTable(f.t - 1), before = Tb[s * A + a];
      var rowN = rowOf(Tb, s2), mx = Math.max.apply(null, rowN);
      var what;
      var sameCell = s === s2 && r === -1;
      if (r === -100) what = 'moved ' + ACT[a] + ' into the cliff: reward −100, and the robot goes back to the start';
      else if (done) what = 'moved ' + ACT[a] + ' onto the flag: reward −1, and the episode ends';
      else if (sameCell) what = 'moved ' + ACT[a] + ' into the edge of the grid and stayed in place: reward −1';
      else what = 'moved ' + ACT[a] + ' to ' + cellName(s2) + ': reward −1';
      var targ = done ? r : r + GAMMA * mx;
      var tline = done
        ? 'target = r = ' + fmt3(r) + ' (the episode ended, so there is no next row)'
        : 'target = r + γ × (largest number in the row of ' + cellName(s2) + ') = ' + fmt3(r) + ' + 0.99 × ' + fmt3(mx) + ' = ' + fmt3(targ);
      var nline = 'new Q' + cellName(s) + ' ' + ACT[a] + ' = ' + fmt3(before) + ' + 0.5 × (' + fmt3(targ) + ' − ' + fmt3(before) + ') = ' + fmt3(u[5]);
      return '<p><b>Update ' + f.t + '.</b> In cell ' + cellName(s) + ' the robot ' + what + '.</p><p><code>' + tline + '</code></p><p><code>' + nline + '</code></p>';
    }

    function draw() {
      var f = frames[idx], T = getTable(f.t);
      var lastU = f.kind === 'update' && f.t >= 1 ? D.log[f.t - 1] : null;
      var sel = pinned >= 0 ? pinned : (lastU ? lastU[0] : START);
      slider.value = idx;
      slider.setAttribute('aria-valuetext', f.kind === 'snapshot' ? 'snapshot after ' + f.t + ' updates' : 'after ' + f.t + ' updates');
      readout.textContent = (f.kind === 'snapshot' ? 'Snapshot after ' : 'After ') + f.t.toLocaleString('en-US') + ' update' + (f.t === 1 ? '' : 's') + ' · falls so far: ' + fallsAt(f.t) + (f.t >= D.firstFlagStep ? ' · first flag at update ' + D.firstFlagStep : ' · flag not reached yet');
      var list = EXCERPT.slice();
      if (list.indexOf(sel) < 0 && !isTerminalOrCliff(sel)) list.push(sel);
      renderTable(tw, T, list, sel, lastU);
      var all = []; for (var s = 0; s < W * H; s++) if (!isTerminalOrCliff(s)) all.push(s);
      renderTable(mw, T, all, sel, lastU);
      drawGrid(T, sel, lastU);
      drawRoute(T);
      upd.innerHTML = updateText(f, T);
      var wk = greedyWalk(T);
      walk.textContent = wk.goal
        ? 'Walk the arrows from the start with no random moves: the flag in ' + wk.steps + ' steps' + (wk.steps === 13 ? ' (the shortest route has 13).' : ' (a longer route than the shortest, which has 13).')
        : 'Walk the arrows from the start with no random moves: the robot does not reach the flag (it loops or bumps a wall).';
      back.disabled = idx === 0 || frames[idx].kind === 'snapshot';
      fwd.disabled = idx >= N;
      chipBtns.forEach(function (b, k) { b.setAttribute('aria-pressed', JUMPS[k].t === f.t ? 'true' : 'false'); });
    }
    function go(k) { idx = Math.max(0, Math.min(frames.length - 1, k)); draw(); }
    slider.addEventListener('input', function () { go(+slider.value); });
    back.addEventListener('click', function () { go(idx - 1); });
    fwd.addEventListener('click', function () { go(idx + 1); });
    go(0);
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll('.qt-widget'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
