/* Animations for "The deadly triad". Plain DOM and SVG, no dependencies.
   Needs window.TRIAD_DATA (triad-data.js). Mount points: <div class="tri-anim" data-anim="two-state|timing|run|episode|dial">.
   Every animation has play/pause, a scrubber and a restart button. With prefers-reduced-motion the animation starts paused on its last frame. */
(function () {
  'use strict';
  var D = window.TRIAD_DATA;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = { ink: '#242622', muted: '#656b62', line: '#dcded6', accent: '#b44c2c', teal: '#2f7f79', blue: '#3b5ea8', soft: '#efeee8' };

  var css = '' +
    '.tri-anim{margin:31px 0 37px;border:1px solid var(--line,#dcded6);background:#fff;padding:14px 16px 12px}' +
    '.tri-anim .tri-title{font:600 15px/1.35 Arial,Helvetica,sans-serif;margin:0 0 2px;color:var(--ink,#242622)}' +
    '.tri-anim .tri-sub{font:13px/1.45 Arial,Helvetica,sans-serif;color:var(--muted,#656b62);margin:0 0 10px}' +
    '.tri-anim svg{display:block;width:100%;height:auto;overflow:visible}' +
    '.tri-anim svg text{font-family:Arial,Helvetica,sans-serif}' +
    '.tri-ctl{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 0;font:13px/1.4 Arial,Helvetica,sans-serif;color:var(--ink,#242622)}' +
    '.tri-ctl button,.tri-opts button{font:600 13px/1 Arial,Helvetica,sans-serif;border:1px solid var(--line,#dcded6);background:#f7f6f2;color:var(--ink,#242622);padding:8px 11px;min-height:36px;cursor:pointer;border-radius:3px}' +
    '.tri-ctl button:hover,.tri-opts button:hover{border-color:var(--accent,#b44c2c)}' +
    '.tri-ctl button:focus-visible,.tri-opts button:focus-visible,.tri-ctl input:focus-visible,.tri-opts input:focus-visible{outline:2px solid var(--accent,#b44c2c);outline-offset:2px}' +
    '.tri-opts button[aria-pressed="true"]{background:var(--accent,#b44c2c);border-color:var(--accent,#b44c2c);color:#fff}' +
    '.tri-ctl input[type=range]{flex:1;min-width:120px}' +
    '.tri-opts{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px;font:13px/1.4 Arial,Helvetica,sans-serif}' +
    '.tri-opts label{display:flex;align-items:center;gap:8px;white-space:nowrap}' +
    '.tri-opts input[type=range]{width:150px}' +
    '.tri-read{font:13px/1.5 var(--mono,ui-monospace,Menlo,monospace);color:var(--ink,#242622);margin:8px 0 0;min-height:3em}' +
    '.tri-read b{font-weight:700}' +
    '.tri-note{font:13px/1.5 Arial,Helvetica,sans-serif;color:var(--muted,#656b62);margin:8px 0 0}' +
    '.tri-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}' +
    '.tri-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 8px}' +
    '.tri-card{border:1px solid var(--line,#dcded6);background:#f7f6f2;padding:8px 10px;font:13px/1.45 Arial,Helvetica,sans-serif}' +
    '.tri-card b{font:700 15px var(--mono,ui-monospace,Menlo,monospace)}' +
    '.tri-sr{position:absolute;left:-9999px}' +
    '@media (max-width:520px){.tri-anim{padding:12px 11px 10px}.tri-opts input[type=range]{width:110px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- helpers ---------- */
  function bw(root) { var w = root.clientWidth; return w < 100 ? 560 : Math.max(300, Math.min(560, Math.round(w - 34))); }
  function h(tag, attrs, html) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function s(tag, attrs, txt) { var e = document.createElementNS(NS, tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
  function fmt(v) {
    var a = Math.abs(v);
    if (!isFinite(v)) return 'huge';
    if (a >= 1e6) return v.toExponential(1).replace('e+', 'e');
    if (a >= 1000) return Math.round(v).toLocaleString('en-US');
    if (a >= 100) return v.toFixed(0);
    if (a >= 1) return v.toFixed(1);
    if (a === 0) return '0';
    return v.toFixed(2);
  }
  function fmtE(v) { return v >= 1e4 || (v < 0.1 && v > 0) ? v.toExponential(1).replace('e+', 'e') : fmt(v); }
  function median(a) { var x = a.slice().sort(function (p, q) { return p - q; }), m = x.length >> 1; return x.length % 2 ? x[m] : (x[m - 1] + x[m]) / 2; }

  /* Play/pause, scrubber, restart. frame(p) draws progress p in [0,1]. */
  function player(root, opts) {
    var ctl = h('div', { 'class': 'tri-ctl' });
    var btn = h('button', { type: 'button', 'aria-label': 'Play or pause the animation' }, 'Pause');
    var rst = h('button', { type: 'button' }, 'Restart');
    var rng = h('input', { type: 'range', min: '0', max: '1000', value: '0', 'aria-label': 'Scrub through the animation' });
    ctl.appendChild(btn); ctl.appendChild(rst); ctl.appendChild(rng);
    root.appendChild(ctl);
    var P = { p: reduce ? 1 : 0, playing: false, t0: 0, started: false, hold: 0, dead: false };
    var io = null;
    (root._destroy = root._destroy || []).push(function () { P.dead = true; P.playing = false; if (io) io.disconnect(); });
    function draw() { rng.value = Math.round(P.p * 1000); opts.frame(P.p); }
    function setPlaying(on) { P.playing = on; btn.textContent = on ? 'Pause' : 'Play'; if (on) { P.last = null; requestAnimationFrame(tick); } }
    function tick(ts) {
      if (!P.playing || P.dead) return;
      if (P.last == null) P.last = ts;
      var dt = ts - P.last; P.last = ts;
      if (P.hold > 0) { P.hold -= dt; if (P.hold <= 0) { P.p = 0; } }
      else {
        P.p += dt / opts.duration;
        if (P.p >= 1) { P.p = 1; P.hold = 1800; if (opts.once) { setPlaying(false); } }
      }
      draw();
      if (P.playing) requestAnimationFrame(tick);
    }
    btn.onclick = function () { if (P.p >= 1 && !P.playing) P.p = 0; setPlaying(!P.playing); };
    rst.onclick = function () { P.p = 0; P.hold = 0; draw(); setPlaying(true); };
    rng.oninput = function () { P.p = rng.value / 1000; P.hold = 0; setPlaying(false); draw(); };
    draw();
    if (reduce) { btn.textContent = 'Play'; }
    else if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting && !P.started) { P.started = true; setPlaying(true); }
          else if (!e.isIntersecting && P.playing && P.started) { P.wasPlaying = true; setPlaying(false); }
          else if (e.isIntersecting && P.started && P.wasPlaying) { P.wasPlaying = false; setPlaying(true); }
        });
      }, { threshold: 0.35 });
      io.observe(root);
    } else { setPlaying(true); }
    return { set: function (p) { P.p = p; draw(); }, redraw: draw, state: P, play: function () { setPlaying(true); } };
  }

  /* A simple chart frame. Returns scale functions. */
  function frame(svg, W, H, m, x0, x1, y0, y1, o) {
    o = o || {};
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var X = function (v) { return m.l + (v - x0) / (x1 - x0) * iw; };
    var Y = function (v) { return m.t + (1 - (v - y0) / (y1 - y0)) * ih; };
    svg.appendChild(s('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: '#fcfcfa', stroke: C.line }));
    (o.yticks || []).forEach(function (t) {
      var yy = Y(t.v);
      svg.appendChild(s('line', { x1: m.l, x2: m.l + iw, y1: yy, y2: yy, stroke: t.zero ? '#9a9d94' : C.line, 'stroke-width': t.zero ? 1.2 : 1 }));
      svg.appendChild(s('text', { x: m.l - 6, y: yy + 4, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, t.t));
    });
    (o.xticks || []).forEach(function (t) {
      var xx = X(t.v);
      svg.appendChild(s('line', { x1: xx, x2: xx, y1: m.t + ih, y2: m.t + ih + 4, stroke: '#9a9d94' }));
      svg.appendChild(s('text', { x: xx, y: m.t + ih + 17, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted }, t.t));
    });
    if (o.xlabel) svg.appendChild(s('text', { x: m.l + iw / 2, y: H - 3, 'text-anchor': 'middle', 'font-size': 11, fill: C.muted }, o.xlabel));
    if (o.title) svg.appendChild(s('text', { x: m.l, y: m.t - 8, 'font-size': 12, 'font-weight': 700, fill: C.ink }, o.title));
    return { X: X, Y: Y, iw: iw, ih: ih, m: m };
  }
  function path(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); }

  /* ================= 1. the two-state example (computed live) ================= */
  function twoState(root) {
    var GAMMA = 0.99, K = 100, W0 = 10;
    var mode = 'off', alpha = 0.1;
    root.appendChild(h('p', { 'class': 'tri-title' }, 'One repeated transition raises its own target'));
    root.appendChild(h('p', { 'class': 'tri-sub' }, 'Conceptual example, computed live in your browser from the rules you pick. It is not game data.'));
    var opts = h('div', { 'class': 'tri-opts', role: 'group', 'aria-label': 'Choose the update rule' });
    var modes = [['off', 'Shared weight, off-policy data'], ['on', 'Shared weight, on-policy data'], ['table', 'Table (one value per state)']];
    var mbtn = {};
    modes.forEach(function (m) {
      var b = h('button', { type: 'button', 'aria-pressed': m[0] === mode ? 'true' : 'false' }, m[1]);
      b.onclick = function () { mode = m[0]; sync(); recompute(); pl.set(0); pl.play(); };
      mbtn[m[0]] = b; opts.appendChild(b);
    });
    var lab = h('label', null, 'Step size α <input type="range" min="0.05" max="1" step="0.05" value="0.1" aria-label="Step size alpha"> <b class="tri-alpha">0.10</b>');
    opts.appendChild(lab); root.appendChild(opts);
    var inp = lab.querySelector('input'), aval = lab.querySelector('b');
    function sync() { for (var k in mbtn) mbtn[k].setAttribute('aria-pressed', k === mode ? 'true' : 'false'); }
    var cards = h('div', { 'class': 'tri-cards' });
    var c1 = h('div', { 'class': 'tri-card' }), c2 = h('div', { 'class': 'tri-card' });
    cards.appendChild(c1); cards.appendChild(c2); root.appendChild(cards);
    var W = bw(root), H = 270, M = { l: 62, r: 14, t: 34, b: 34 };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Line chart of the value estimates of state 1 and state 2 over 100 update cycles, on a signed log scale.' });
    root.appendChild(svg);
    var read = h('div', { 'class': 'tri-read', 'aria-live': 'off' }); root.appendChild(read);
    var note = h('p', { 'class': 'tri-note' }); root.appendChild(note);
    var S1, S2, factor;
    function recompute() {
      S1 = []; S2 = [];
      var w = W0, v1 = W0, v2 = 2 * W0, cap = 1e12;
      function clip(x) { return Math.max(-cap, Math.min(cap, x)); }
      for (var k = 0; k <= K; k++) {
        if (mode === 'table') { S1.push(v1); S2.push(v2); var n1 = v1 + alpha * (GAMMA * v2 - v1); v2 = clip(v2 + alpha * (0 - v2)); v1 = clip(n1); }
        else { S1.push(w); S2.push(2 * w); w = clip(w + alpha * (GAMMA * 2 * w - w)); if (mode === 'on') w = clip(w + alpha * (0 - 2 * w) * 2); }
      }
      factor = mode === 'off' ? 1 + alpha * (2 * GAMMA - 1) : mode === 'on' ? (1 + alpha * (2 * GAMMA - 1)) * (1 - 4 * alpha) : null;
      noteText();
    }
    function noteText() {
      var t;
      if (mode === 'off') t = 'Only state 1 is updated. Each update multiplies <i>w</i> by 1 + α(2γ − 1) = <b>' + factor.toFixed(3) + '</b> (γ = 0.99). ' + (factor > 1 ? 'The factor is above 1, so <i>w</i> grows although every true value is 0.' : 'The factor is below 1.');
      else if (mode === 'on') t = 'Both states are updated, and state 2 ends the episode with reward 0. One cycle multiplies <i>w</i> by (1 + α(2γ − 1))(1 − 4α) = <b>' + factor.toFixed(3) + '</b>. ' + (Math.abs(factor) < 1 ? 'The size of <i>w</i> shrinks toward the true value 0' + (factor < 0 ? ', and the sign flips each cycle (oscillation).' : '.') : 'The size is above 1: <i>w</i> oscillates with growing size. That is a step size problem, not the triad.');
      else t = 'Each state has its own value. State 2 ends the episode with reward 0, so both values go to the true value 0' + '';
      note.innerHTML = t + ' Chart axis: signed log scale.';
    }
    function sl(v) { return (v < 0 ? -1 : 1) * Math.log10(1 + Math.abs(v)); }
    var FR = frame(svg, W, H, M, 0, K, -7, 7, {
      yticks: [-6, -3, 0, 3, 6].map(function (e) { return { v: e, t: e === 0 ? '0' : (e < 0 ? '−' : '') + '10^' + Math.abs(e), zero: e === 0 }; }),
      xticks: [0, 25, 50, 75, 100].map(function (v) { return { v: v, t: String(v) }; }), xlabel: 'update cycle'
    });
    var l1 = s('path', { fill: 'none', stroke: C.accent, 'stroke-width': 2.4 }), l2 = s('path', { fill: 'none', stroke: C.blue, 'stroke-width': 2, 'stroke-dasharray': '5 4' });
    var d1 = s('circle', { r: 4.5, fill: C.accent }), d2 = s('circle', { r: 4, fill: C.blue });
    svg.appendChild(l2); svg.appendChild(l1); svg.appendChild(d2); svg.appendChild(d1);
    svg.appendChild(s('line', { x1: 4, x2: 26, y1: 10, y2: 10, stroke: C.accent, 'stroke-width': 2.4 }));
    svg.appendChild(s('text', { x: 30, y: 14, 'font-size': 11, fill: C.ink }, 'value of state 1'));
    svg.appendChild(s('line', { x1: 150, x2: 172, y1: 10, y2: 10, stroke: C.blue, 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
    svg.appendChild(s('text', { x: 176, y: 14, 'font-size': 11, fill: C.ink }, 'value of state 2'));
    function draw(p) {
      var k = Math.min(K, Math.round(p * K)), a = [], b = [];
      for (var i = 0; i <= k; i++) { a.push([FR.X(i), FR.Y(Math.max(-7, Math.min(7, sl(S1[i]))))]); b.push([FR.X(i), FR.Y(Math.max(-7, Math.min(7, sl(S2[i]))))]); }
      l1.setAttribute('d', path(a)); l2.setAttribute('d', path(b));
      d1.setAttribute('cx', a[a.length - 1][0]); d1.setAttribute('cy', a[a.length - 1][1]);
      d2.setAttribute('cx', b[b.length - 1][0]); d2.setAttribute('cy', b[b.length - 1][1]);
      c1.innerHTML = 'State 1 &rarr; state 2, reward 0<br>target for state 1 = 0 + γ · V(state 2) = <b>' + fmt(GAMMA * S2[k]) + '</b>';
      c2.innerHTML = 'After <b>' + k + '</b> cycles<br>V(state 1) = <b>' + fmt(S1[k]) + '</b>, V(state 2) = <b>' + fmt(S2[k]) + '</b>';
      read.textContent = 'True value of both states: 0.';
    }
    inp.oninput = function () { alpha = parseFloat(inp.value); aval.textContent = alpha.toFixed(2); recompute(); pl.redraw(); };
    recompute();
    var pl = player(root, { duration: 7000, frame: draw });
  }

  /* ================= 2. when learning starts (measured with the game's own code) ================= */
  function timing(root) {
    var T = D.timing, N = T.steps;
    root.appendChild(h('p', { 'class': 'tri-title' }, 'When does learning start? One real reward, or all rewards'));
    root.appendChild(h('p', { 'class': 'tri-sub' }, 'Measured with the game\'s own code: cliff world, table, seed 101, first ' + N + ' steps. The chart counts the training rows the learner has used so far. Each row updates one table entry.'));
    var W = bw(root), H = 250, M = { l: 52, r: 14, t: 46, b: 34 };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Cumulative training rows used against environment steps for one real reward and for all real rewards.' });
    root.appendChild(svg);
    var FR = frame(svg, W, H, M, 0, N, 0, N, {
      yticks: [0, 100, 200, 300, 400].map(function (v) { return { v: v, t: String(v), zero: v === 0 }; }),
      xticks: [0, 100, 200, 300, 400].map(function (v) { return { v: v, t: String(v) }; }), xlabel: 'environment step'
    });
    function ends(arr, col) { arr.ends.forEach(function (e, i) { svg.appendChild(s('line', { x1: FR.X(e), x2: FR.X(e), y1: M.t, y2: M.t + FR.ih, stroke: col, 'stroke-dasharray': '2 4', opacity: 0.8 })); if (i === 0) { var lb = s('text', { x: 0, y: 0, 'font-size': 10.5, fill: col, stroke: '#fcfcfa', 'stroke-width': 3, 'paint-order': 'stroke', transform: 'translate(' + (FR.X(e) + (col === C.teal ? -5 : 13)) + ' ' + (M.t + FR.ih - 6) + ') rotate(-90)' }, 'episode 1 ends (step ' + e + ')'); svg.appendChild(lb); } }); }
    ends(T.oneStep, C.teal); ends(T.allRewards, C.accent);
    var a = s('path', { fill: 'none', stroke: C.teal, 'stroke-width': 2.4 }), b = s('path', { fill: 'none', stroke: C.accent, 'stroke-width': 2.4 });
    var ph = s('line', { y1: M.t, y2: M.t + FR.ih, stroke: C.ink, 'stroke-width': 1 });
    svg.appendChild(a); svg.appendChild(b); svg.appendChild(ph);
    svg.appendChild(s('line', { x1: 4, x2: 26, y1: 10, y2: 10, stroke: C.teal, 'stroke-width': 2.4 }));
    svg.appendChild(s('text', { x: 30, y: 14, 'font-size': 11, fill: C.ink }, '1 real reward + guess'));
    svg.appendChild(s('line', { x1: 4, x2: 26, y1: 28, y2: 28, stroke: C.accent, 'stroke-width': 2.4 }));
    svg.appendChild(s('text', { x: 30, y: 32, 'font-size': 11, fill: C.ink }, 'all real rewards, no guess'));
    var read = h('div', { 'class': 'tri-read' }); root.appendChild(read);
    var pl = player(root, {
      duration: 9000, frame: function (p) {
        var k = Math.max(1, Math.round(p * N)), pa = [], pb = [];
        for (var i = 0; i < k; i++) { pa.push([FR.X(i + 1), FR.Y(T.oneStep.updates[i])]); pb.push([FR.X(i + 1), FR.Y(T.allRewards.updates[i])]); }
        a.setAttribute('d', path(pa)); b.setAttribute('d', path(pb));
        ph.setAttribute('x1', FR.X(k)); ph.setAttribute('x2', FR.X(k));
        read.innerHTML = 'Step <b>' + k + '</b>. Rows used so far: 1 real reward <b>' + T.oneStep.updates[k - 1] + '</b>, all real rewards <b>' + T.allRewards.updates[k - 1] + '</b>.';
      }
    });
    root.appendChild(h('p', { 'class': 'tri-note' }, 'Before its first episode ended, the one-reward learner had used <b>177</b> rows. The all-rewards learner had used <b>0</b>, then used all 200 at once. After 400 steps both had used 400 rows. This shows <i>when</i> learning starts, not how many samples are needed.'));
  }

  /* ================= 3. measured training runs: naive network against DQN ================= */
  function run(root) {
    var R = D.runs, T = R.naive.t, N = T[T.length - 1];
    root.appendChild(h('p', { 'class': 'tri-title' }, 'Measured training runs, replayed: a naive network and DQN'));
    root.appendChild(h('p', { 'class': 'tri-sub' }, 'Breaking Bellman, level Values explode, 5 seeds (101 to 505), 20,000 steps. Thin lines are single seeds. Thick lines are the median over seeds. Values are logged every 500 steps. The readout is the median at one test point. The scores in the text (9 and 143) average the last quarter of the test points.'));
    var grid = h('div', { 'class': 'tri-grid' }); root.appendChild(grid);
    var W = 300, H = 230, M = { l: 44, r: 8, t: 22, b: 32 };
    var xt = [0, 10000, 20000].map(function (v) { return { v: v, t: v === 0 ? '0' : (v / 1000) + 'k' }; });
    function logTicks(lo, hi, step) { var o = []; for (var e = lo; e <= hi; e += step) o.push({ v: e, t: e === 0 ? '1' : '1e' + e }); return o; }
    var charts = [
      { key: 'ret', title: 'Score of the greedy test episode', y0: 0, y1: 200, yt: [0, 50, 100, 150, 200].map(function (v) { return { v: v, t: String(v) }; }), f: function (v) { return v; } },
      { key: 'maxQ', title: 'Largest |Q| at each test point', y0: -1, y1: 7, yt: logTicks(0, 6, 3), f: function (v) { return Math.log10(Math.max(v, 0.1)); }, log: true },
      { key: 'loss', title: 'Loss: mean squared TD error (latest batch)', y0: -1, y1: 12, yt: logTicks(0, 12, 4), f: function (v) { return Math.log10(Math.max(v, 0.1)); }, log: true, dt: true }
    ];
    var COL = { naive: C.accent, dqn: C.teal };
    var G = charts.map(function (c) {
      var wrap = h('div'); var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': c.title + ', naive network against DQN.' }); wrap.appendChild(svg); grid.appendChild(wrap);
      var fr = frame(svg, W, H, M, 0, N, c.y0, c.y1, { title: c.title, yticks: c.yt.map(function (t) { return { v: t.v, t: t.t, zero: false }; }), xticks: xt, xlabel: 'training step' });
      if (c.log && c.key === 'maxQ') { svg.appendChild(s('line', { x1: M.l, x2: M.l + fr.iw, y1: fr.Y(2), y2: fr.Y(2), stroke: C.ink, 'stroke-dasharray': '4 4' })); svg.appendChild(s('text', { x: M.l + fr.iw - 4, y: fr.Y(2) - 4, 'text-anchor': 'end', 'font-size': 10.5, fill: C.ink, stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' }, 'highest possible value: 100')); }
      var lines = {};
      ['naive', 'dqn'].forEach(function (k) {
        var times = c.dt ? R[k].per[0].dt : T;
        var seeds = R[k].per.map(function (r) { return r[c.key].map(c.f); });
        var med = times.map(function (_, i) { return median(seeds.map(function (a) { return a[i]; })); });
        lines[k] = { times: times, seeds: seeds.map(function () { return s('path', { fill: 'none', stroke: COL[k], 'stroke-width': 1, opacity: 0.35 }); }), med: s('path', { fill: 'none', stroke: COL[k], 'stroke-width': 2.8 }), data: seeds, medData: med };
        lines[k].seeds.forEach(function (p) { svg.appendChild(p); }); svg.appendChild(lines[k].med);
      });
      var cur = s('line', { y1: M.t, y2: M.t + fr.ih, stroke: C.ink, 'stroke-width': 1 }); svg.appendChild(cur);
      return { c: c, fr: fr, lines: lines, cur: cur };
    });
    var leg = h('div', { 'class': 'tri-note' }, '<span style="color:' + C.accent + ';font-weight:700">&mdash; naive network</span> (network, one-step bootstrapping, Q-learning, random moves) &nbsp; <span style="color:' + C.teal + ';font-weight:700">&mdash; DQN</span> (same, plus replay and a frozen copy)');
    root.appendChild(leg);
    var read = h('div', { 'class': 'tri-read' }); root.appendChild(read);
    var pl = player(root, {
      duration: 10000, frame: function (p) {
        var step = p * N, last = {};
        G.forEach(function (g) {
          ['naive', 'dqn'].forEach(function (k) {
            var L = g.lines[k], n = 0; while (n < L.times.length && L.times[n] <= step) n++;
            n = Math.max(n, 1);
            L.seeds.forEach(function (path_, si) { path_.setAttribute('d', path(L.data[si].slice(0, n).map(function (v, i) { return [g.fr.X(L.times[i]), g.fr.Y(v)]; }))); });
            L.med.setAttribute('d', path(L.medData.slice(0, n).map(function (v, i) { return [g.fr.X(L.times[i]), g.fr.Y(v)]; })));
            last[g.c.key + k] = L.medData[n - 1];
          });
          g.cur.setAttribute('x1', g.fr.X(Math.min(step, N))); g.cur.setAttribute('x2', g.fr.X(Math.min(step, N)));
        });
        function raw(key, k) { var v = last[key + k]; return key === 'ret' ? fmt(v) : fmtE(Math.pow(10, v)); }
        read.innerHTML = 'Step <b>' + Math.round(step).toLocaleString('en-US') + '</b>. Median score: naive <b>' + raw('ret', 'naive') + '</b>, DQN <b>' + raw('ret', 'dqn') + '</b>. Largest |Q|: naive <b>' + raw('maxQ', 'naive') + '</b>, DQN <b>' + raw('maxQ', 'dqn') + '</b>. Loss: naive <b>' + raw('loss', 'naive') + '</b>, DQN <b>' + raw('loss', 'dqn') + '</b>.';
      }
    });
  }

  /* ================= 4. measured greedy test episodes ================= */
  function episode(root) {
    var TR = D.traces, ids = ['naive101', 'dqn202', 'dqn101', 'table303'];
    var cur = ids[0], pl;
    root.appendChild(h('p', { 'class': 'tri-title' }, 'Measured test episodes, replayed'));
    root.appendChild(h('p', { 'class': 'tri-sub' }, 'Each episode is the recorded greedy test of one trained run (no random moves, 0.02 s per step). The cart position, pole angle and pushes are the recorded values.'));
    var opts = h('div', { 'class': 'tri-opts', role: 'group', 'aria-label': 'Choose a recorded episode' });
    var btns = {};
    ids.forEach(function (id) { var b = h('button', { type: 'button', 'aria-pressed': id === cur ? 'true' : 'false' }, TR[id].label); b.onclick = function () { cur = id; for (var k in btns) btns[k].setAttribute('aria-pressed', k === cur ? 'true' : 'false'); build(); pl.set(0); pl.play(); }; btns[id] = b; opts.appendChild(b); });
    root.appendChild(opts);
    var W = bw(root), H = 168;
    var scene = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'A cart on a rail with a pole, replaying a recorded test episode.' });
    root.appendChild(scene);
    var railY = 112, sc = (W - 64) / 4.8; // px per metre; rail from -2.4 to 2.4 m
    var cx0 = W / 2;
    scene.appendChild(s('line', { x1: cx0 - 2.4 * sc, x2: cx0 + 2.4 * sc, y1: railY + 14, y2: railY + 14, stroke: '#9a9d94', 'stroke-width': 3 }));
    [-2.4, 2.4].forEach(function (v) { scene.appendChild(s('rect', { x: cx0 + v * sc - 3, y: railY - 4, width: 6, height: 26, fill: C.muted })); });
    scene.appendChild(s('text', { x: cx0 - 2.4 * sc + 8, y: 14, 'font-size': 11, fill: C.muted }, 'rail end −2.4 m'));
    scene.appendChild(s('text', { x: cx0 + 2.4 * sc - 8, y: 14, 'text-anchor': 'end', 'font-size': 11, fill: C.muted }, 'rail end 2.4 m'));
    var cart = s('rect', { width: 54, height: 22, y: railY - 8, rx: 3, fill: C.ink });
    var pole = s('line', { stroke: C.accent, 'stroke-width': 5, 'stroke-linecap': 'round' });
    var hub = s('circle', { r: 4, fill: '#fff', stroke: C.ink });
    var push = s('path', { fill: C.blue });
    scene.appendChild(pole); scene.appendChild(cart); scene.appendChild(hub); scene.appendChild(push);
    var msg = s('text', { x: W / 2, y: 160, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.accent });
    scene.appendChild(msg);
    var W2 = W, H2 = 110, M2 = { l: 52, r: 14, t: 16, b: 26 };
    var sx = s('svg', { viewBox: '0 0 ' + W2 + ' ' + H2, role: 'img', 'aria-label': 'Cart position over time.' });
    var sa = s('svg', { viewBox: '0 0 ' + W2 + ' ' + H2, role: 'img', 'aria-label': 'Pole angle over time.' });
    root.appendChild(sx); root.appendChild(sa);
    var read = h('div', { 'class': 'tri-read' }); root.appendChild(read);
    var tr, n, dur, fx, fa, lx, la, dx, da, cx, ca, txt;
    function build() {
      tr = TR[cur]; n = tr.n; var real = n * 0.02; dur = Math.min(12000, Math.max(real * 1000, 4500)); var slow = real * 1000 / dur;
      while (sx.firstChild) sx.removeChild(sx.firstChild); while (sa.firstChild) sa.removeChild(sa.firstChild);
      var tmax = n * 0.02;
      var xt = [0, 0.25, 0.5, 0.75, 1].map(function (f) { return { v: f * tmax, t: (f * tmax).toFixed(tmax < 1 ? 2 : 1) + ' s' }; });
      fx = frame(sx, W2, H2, M2, 0, tmax, -2.6, 2.6, { yticks: [-2.4, 0, 2.4].map(function (v) { return { v: v, t: v.toFixed(1) + ' m', zero: v === 0 }; }), xticks: xt, xlabel: null });
      fa = frame(sa, W2, H2, M2, 0, tmax, -0.28, 0.28, { yticks: [-0.2094, 0, 0.2094].map(function (v) { return { v: v, t: (v * 180 / Math.PI).toFixed(0) + '°', zero: v === 0 }; }), xticks: xt, xlabel: null });
      sx.appendChild(s('text', { x: M2.l, y: 10, 'font-size': 12, 'font-weight': 700, fill: C.ink }, 'Cart position x'));
      sa.appendChild(s('text', { x: M2.l, y: 10, 'font-size': 12, 'font-weight': 700, fill: C.ink }, 'Pole angle (limit ±12°)'));
      lx = s('path', { fill: 'none', stroke: C.accent, 'stroke-width': 2 }); la = s('path', { fill: 'none', stroke: C.accent, 'stroke-width': 2 });
      dx = s('circle', { r: 3.5, fill: C.accent }); da = s('circle', { r: 3.5, fill: C.accent });
      sx.appendChild(lx); sx.appendChild(dx); sa.appendChild(la); sa.appendChild(da);
      txt = { slow: slow };
      var endTxt = tr.n < 200 ? (Math.abs(tr.x[n - 1]) > 2.3 ? 'The cart reached the rail end.' : 'The pole passed 12 degrees.') : 'The test ended at its step limit.';
      txt.end = endTxt;
    }
    build();
    function ang(i) { return tr.th[i]; }
    function draw(p) {
      var i = Math.min(n - 1, Math.floor(p * n));
      var x = tr.x[i], th = tr.th[i];
      var px = cx0 + x * sc;
      cart.setAttribute('x', px - 27);
      var L = 80, tipx = px + Math.sin(th) * L, tipy = railY - 6 - Math.cos(th) * L;
      pole.setAttribute('x1', px); pole.setAttribute('y1', railY - 6); pole.setAttribute('x2', tipx); pole.setAttribute('y2', tipy);
      hub.setAttribute('cx', px); hub.setAttribute('cy', railY - 6);
      var dir = tr.a[i] % 2 === 0 ? -1 : 1;
      push.setAttribute('d', 'M' + (px + dir * 34) + ' ' + (railY + 3) + ' l' + (dir * 14) + ' 0 l' + (-dir * 6) + ' -6 m' + (dir * 6) + ' 6 l' + (-dir * 6) + ' 6');
      push.setAttribute('stroke', C.blue); push.setAttribute('stroke-width', 3); push.setAttribute('fill', 'none');
      var xs = [], as = [];
      for (var k = 0; k <= i; k++) { xs.push([fx.X(k * 0.02), fx.Y(tr.x[k])]); as.push([fa.X(k * 0.02), fa.Y(Math.max(-0.28, Math.min(0.28, tr.th[k])))]); }
      lx.setAttribute('d', path(xs)); la.setAttribute('d', path(as));
      dx.setAttribute('cx', xs[xs.length - 1][0]); dx.setAttribute('cy', xs[xs.length - 1][1]); da.setAttribute('cx', as[as.length - 1][0]); da.setAttribute('cy', as[as.length - 1][1]);
      msg.textContent = i >= n - 1 ? txt.end : '';
      read.innerHTML = 'Step <b>' + (i + 1) + '</b> of ' + n + ' (' + ((i + 1) * 0.02).toFixed(2) + ' s). Cart at <b>' + x.toFixed(2) + ' m</b>, pole at <b>' + (th * 180 / Math.PI).toFixed(1) + '°</b>, push <b>' + (dir < 0 ? 'left' : 'right') + '</b>. ' +
        (txt.slow < 0.95 ? 'Shown at ' + (txt.slow < 0.1 ? txt.slow.toFixed(2) : txt.slow.toFixed(1)) + '× real time.' : 'Shown in real time.') + (n > 200 ? ' The game counts the first 200 steps of a test: score ' + tr.ret + ' of 200.' : ' Test score of this run: ' + tr.ret + ' of 200.');
    }
    var epOpts = { frame: draw };
    Object.defineProperty(epOpts, 'duration', { get: function () { return dur; } });
    pl = player(root, epOpts);
  }

  /* ================= 5. the n-step dial: score against samples ================= */
  function dial(root) {
    root.appendChild(h('p', { 'class': 'tri-title' }, 'Measured: how many environment steps does each setting need?'));
    root.appendChild(h('p', { 'class': 'tri-sub' }, 'Mean test score against training steps, for 1, 2, 4, 8 and all real rewards in the target. Pick a world. The learner takes one update per environment step in both worlds, so steps and updates are not separated here. Scores below the bottom of the chart are drawn at the bottom edge.'));
    var world = 'cliff';
    var opts = h('div', { 'class': 'tri-opts', role: 'group', 'aria-label': 'Choose a world' });
    var wbtn = {};
    [['cliff', 'Cliff, table, 20 seeds'], ['cartpole', 'CartPole, DQN, 5 seeds']].forEach(function (w) { var b = h('button', { type: 'button', 'aria-pressed': w[0] === world ? 'true' : 'false' }, w[1]); b.onclick = function () { world = w[0]; for (var k in wbtn) wbtn[k].setAttribute('aria-pressed', k === world ? 'true' : 'false'); render(); pl.set(0); pl.play(); }; wbtn[w[0]] = b; opts.appendChild(b); });
    root.appendChild(opts);
    var W = bw(root), H = 284, M = { l: 52, r: 14, t: 32, b: 34 };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Mean test score against training steps for five n-step settings.' }); root.appendChild(svg);
    var read = h('div', { 'class': 'tri-read' }); root.appendChild(read);
    var table = h('div', { 'class': 'tri-note' }); root.appendChild(table);
    var cols = { '1': C.teal, '2': '#6a9a2f', '4': '#c28a1b', '8': C.accent, 'all': '#7a4b9a' };
    var ns = ['1', '2', '4', '8', 'all'], st;
    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = D.dial[world], T = d.t, N = T[T.length - 1];
      var y0 = world === 'cliff' ? -210 : 0, y1 = world === 'cliff' ? 0 : 205;
      var yt = world === 'cliff' ? [-200, -150, -100, -50, 0] : [0, 50, 100, 150, 200];
      var fr = frame(svg, W, H, M, 0, N, y0, y1, { yticks: yt.map(function (v) { return { v: v, t: String(v) }; }), xticks: [0, 0.25, 0.5, 0.75, 1].map(function (f) { return { v: f * N, t: Math.round(f * N / 100) / 10 + 'k' }; }), xlabel: 'training step' });
      // threshold line
      svg.appendChild(s('line', { x1: M.l, x2: M.l + fr.iw, y1: fr.Y(d.thr), y2: fr.Y(d.thr), stroke: C.ink, 'stroke-dasharray': '4 4' }));
      svg.appendChild(s('text', { x: M.l + fr.iw - 4, y: fr.Y(d.thr) + (world === 'cliff' ? 13 : -5), 'text-anchor': 'end', 'font-size': 11, fill: C.ink, stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' }, 'threshold ' + d.thr));
      st = { y0: y0, y1: y1, fr: fr, d: d, T: T, N: N, paths: {} };
      var LS = Math.min(84, (W - 12) / 5);
      ns.forEach(function (n, i) {
        st.paths[n] = s('path', { fill: 'none', stroke: cols[n], 'stroke-width': 2.2 }); svg.appendChild(st.paths[n]);
        svg.appendChild(s('line', { x1: 4 + i * LS, x2: 22 + i * LS, y1: 10, y2: 10, stroke: cols[n], 'stroke-width': 2.4 }));
        svg.appendChild(s('text', { x: 26 + i * LS, y: 14, 'font-size': 11, fill: C.ink }, n === 'all' ? 'all' : 'n = ' + n));
      });
      var rows = ns.map(function (n) { var r = d.reach[n]; return '<tr><td>' + (n === 'all' ? 'all' : n) + '</td><td>' + (r.reached === 0 ? 'never (0 of ' + r.seeds + ' seeds)' : r.medianStep.toLocaleString('en-US') + ' (' + r.reached + ' of ' + r.seeds + ' seeds)') + '</td></tr>'; }).join('');
      table.innerHTML = 'First test point with a score of at least ' + d.thr + ', median over seeds (test points are every ' + (T[1] - T[0]) + ' steps):<table><thead><tr><th>Real rewards</th><th>Steps to the threshold</th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
    render();
    var pl = player(root, {
      duration: 8000, frame: function (p) {
        var k = Math.max(1, Math.round(p * st.T.length)), step = st.T[Math.min(k, st.T.length) - 1];
        ns.forEach(function (n) { st.paths[n].setAttribute('d', path(st.d.curves[n].slice(0, k).map(function (v, i) { return [st.fr.X(st.T[i]), st.fr.Y(Math.max(st.y0, Math.min(st.y1, v)))]; }))); });
        read.innerHTML = 'Step <b>' + step.toLocaleString('en-US') + '</b>. Mean score: ' + ns.map(function (n) { return (n === 'all' ? 'all' : 'n=' + n) + ' <b>' + st.d.curves[n][k - 1] + '</b>'; }).join(', ') + '.';
      }
    });
  }

  var builders = { 'two-state': twoState, timing: timing, run: run, episode: episode, dial: dial };
  function init() {
    var nodes = document.querySelectorAll('.tri-anim');
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute('data-anim');
      if (builders[k] && !nodes[i].getAttribute('data-ready')) {
        // remove the static fallback text, keep the label for assistive tech
        var fb = nodes[i].querySelector('.tri-fallback'); if (fb) fb.parentNode.removeChild(fb);
        try { nodes[i].setAttribute('data-w', bw(nodes[i])); builders[k](nodes[i]); nodes[i].setAttribute('data-ready', '1'); } catch (e) { if (window.console) console.error('triad animation failed', k, e); }
      }
    }
  }
  var lastW = 0, timer = null;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var nodes = document.querySelectorAll('.tri-anim[data-ready]');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i], w = bw(n);
        if (Math.abs(w - (+n.getAttribute('data-w') || w)) < 12) continue;
        (n._destroy || []).forEach(function (f) { f(); }); n._destroy = [];
        n.innerHTML = ''; n.removeAttribute('data-ready'); n.removeAttribute('data-w');
      }
      init();
    }, 250);
  }
  window.addEventListener('resize', onResize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
