import {startArticle} from '/assets/robotics/rebuild/article-runtime.js';
await startArticle([]);
(function () {
  var TICK = 2 * Math.PI / 4096, TICK_MRAD = 1.534;
  var CSS = '.sb-try{display:grid;gap:12px;margin:16px 0 8px}.sb-try .sbw{background:#1e2823;color:#f2efe6;border:1px solid #46544c;border-radius:10px;padding:12px 14px;font:15px/1.45 ui-sans-serif,system-ui,-apple-system,sans-serif}.sbw h4{margin:0 0 6px;font-size:15px;color:#f2d46b}.sbw canvas{display:block;width:100%;height:auto;margin:6px 0;background:#18201c;border-radius:6px}.sbw-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}.sbw button{font:inherit;color:#f2efe6;background:#2b3730;border:1px solid #6b7a71;border-radius:6px;padding:4px 10px;cursor:pointer}.sbw button[aria-pressed=true]{background:#f2d46b;color:#1e2823}.sbw button.ok{background:#a8e0a0;color:#1e2823}.sbw button.no{background:#f4a3b5;color:#1e2823}.sbw input[type=range]{flex:1;min-width:120px}.sbw p{margin:4px 0}.sbw-key{color:#9aa39d;font-size:13px}';
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(x, d) { return x.toFixed(d); }
  function canvas(box, w, h, label) {
    var c = mk('canvas'), r = window.devicePixelRatio || 1;
    c.width = w * r; c.height = h * r; c.setAttribute('role', 'img'); c.setAttribute('aria-label', label);
    var g = c.getContext('2d'); g.scale(r, r); box.appendChild(c);
    return { c: c, g: g, w: w, h: h };
  }
  function plot(cv, series, lo, hi) {
    var g = cv.g, w = cv.w, h = cv.h, pad = 8;
    function Y(v) { v = Math.max(lo, Math.min(hi, v)); return h - pad - (v - lo) / (hi - lo) * (h - 2 * pad); }
    g.clearRect(0, 0, w, h);
    if (lo < 0 && hi > 0) { g.strokeStyle = '#46544c'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, Y(0)); g.lineTo(w, Y(0)); g.stroke(); }
    series.forEach(function (s) {
      var n = s.y.length, py = 0;
      g.strokeStyle = s.color; g.lineWidth = s.width || 2; g.beginPath();
      for (var i = 0; i < n; i++) {
        var x = pad + i / (n - 1) * (w - 2 * pad), y = Y(s.y[i]);
        if (i === 0) g.moveTo(x, y); else if (s.step) { g.lineTo(x, py); g.lineTo(x, y); } else g.lineTo(x, y);
        py = y;
      }
      g.stroke();
    });
  }
  function toggle(row, labels, pick) {
    var bs = labels.map(function (l, i) {
      var b = mk('button', '', l); b.type = 'button'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.onclick = function () { bs.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); pick(i); };
      row.appendChild(b); return b;
    });
  }
  function slider(row, label, min, max, step, val, on) {
    var s = mk('input'); s.type = 'range'; s.min = min; s.max = max; s.step = step; s.value = val;
    s.setAttribute('aria-label', label); s.oninput = function () { on(parseFloat(s.value)); };
    row.appendChild(mk('span', '', label)); row.appendChild(s); return s;
  }

  function secondDiff(hz) {
    var dt = 1 / hz, n = Math.round(4 * hz), q = [], est = [], tru = [], se = 0, k;
    for (k = 0; k <= n; k++) q.push(Math.round((0.3 * Math.sin(k * dt) + 0.2) / TICK) * TICK);
    for (k = 2; k <= n; k++) {
      var a = (q[k] - 2 * q[k - 1] + q[k - 2]) / (dt * dt), at = -0.3 * Math.sin((k - 1) * dt);
      est.push(a); tru.push(at); se += (a - at) * (a - at);
    }
    return { est: est, tru: tru, rms: Math.sqrt(se / est.length) };
  }
  function deriv(box) {
    var row = mk('div', 'sbw-row'), out = mk('p'), r30 = secondDiff(30), r60 = secondDiff(60);
    box.appendChild(row);
    var cv = canvas(box, 420, 160, 'Acceleration from differentiated readings against the true acceleration');
    box.appendChild(mk('p', 'sbw-key', 'Illustrative path: 0.3 sin(t) rad over 4 s, readings rounded to 4096 ticks/turn. Cyan: true acceleration. Pink: second difference of readings.'));
    box.appendChild(out);
    function show(i) {
      var r = i ? r60 : r30, hz = i ? 60 : 30, m = 0.3;
      r.est.forEach(function (v) { m = Math.max(m, Math.abs(v)); });
      plot(cv, [{ y: r.est, color: '#f4a3b5', width: 1.5 }, { y: r.tru, color: '#8fd3e8', width: 2.5 }], -m, m);
      out.textContent = hz + ' Hz: one tick / Δt² = ' + fmt(TICK * hz * hz, 2) + ' rad/s². RMS error of the estimate: ' + fmt(r.rms, 2) + ' rad/s², while the true acceleration never exceeds 0.3 rad/s². Going from 30 to 60 Hz multiplies the error by ' + fmt(r60.rms / r30.rms, 1) + '.';
    }
    toggle(row, ['30 Hz', '60 Hz'], show); show(0);
  }

  function runAlpha(a) {
    var dt = 1 / 30, w = 2 * Math.PI * 0.4, tr = [], rd = [], es = [], seR = 0, seE = 0, m = 0, est = 0;
    for (var k = 0; k < 150; k++) {
      var t = k * dt, q = 3 * Math.sin(w * t) + 0.37, r = Math.round(q);
      if (k === 0) est = r;
      else { var pred = est + 1.3 * 3 * w * Math.cos(w * (t - dt)) * dt; est = pred + a * (r - pred); }
      tr.push(q); rd.push(r); es.push(est);
      if (k >= 15) { seR += (r - q) * (r - q); seE += (est - q) * (est - q); m++; }
    }
    return { tr: tr, rd: rd, es: es, r: Math.sqrt(seR / m) * TICK_MRAD, e: Math.sqrt(seE / m) * TICK_MRAD };
  }
  function alphaBeta(box) {
    var row = mk('div', 'sbw-row'), out = mk('p'), lab = mk('span');
    box.appendChild(row);
    var cv = canvas(box, 420, 170, 'True angle, rounded readings and observer estimate');
    box.appendChild(mk('p', 'sbw-key', 'Illustration in ticks, sampled at 30 Hz. The model believes the joint moves 30% faster than it does. Cyan: true angle. White: readings. Yellow: estimate.'));
    box.appendChild(out);
    function show(a) {
      var s = runAlpha(a); lab.textContent = 'α = ' + fmt(a, 2);
      plot(cv, [{ y: s.rd, color: '#f2efe6', width: 1.5, step: true }, { y: s.tr, color: '#8fd3e8' }, { y: s.es, color: '#f2d46b', width: 2.5 }], -5, 5);
      var note = Math.abs(s.e - s.r) < 1e-9 ? 'α = 1 copies the readings, rounding and all.' : s.e > s.r ? 'The estimate is worse: with so little weight on the readings, the wrong model drifts.' : 'The estimate beats the readings.';
      out.textContent = 'Readings: ' + fmt(s.r, 3) + ' mrad RMS. Estimate: ' + fmt(s.e, 3) + ' mrad RMS. ' + note;
    }
    slider(row, 'α', 0.02, 1, 0.02, 0.4, show); row.appendChild(lab); show(0.4);
  }

  function kalman(box) {
    var row1 = mk('div', 'sbw-row'), row2 = mk('div', 'sbw-row'), out = mk('p'), Q = 0.05, R = 0.196, lq = mk('span'), lr = mk('span');
    box.appendChild(row1); box.appendChild(row2);
    var cv = canvas(box, 420, 140, 'Kalman gain K over the first 12 readings');
    box.appendChild(mk('p', 'sbw-key', 'Bars: K at each reading, from a large starting P. Scalar angle-only filter, variances in mrad². The top line is K = 1.'));
    box.appendChild(out);
    function show() {
      var P = 10, k = 0, ks = [];
      for (var i = 0; i < 12; i++) { var pp = P + Q; k = pp / (pp + R); P = (1 - k) * pp; ks.push(k); }
      var settledK = 2 * Q / (Q + Math.sqrt(Q * Q + 4 * Q * R));
      lq.textContent = 'Q = ' + fmt(Q, 3); lr.textContent = 'R = ' + fmt(R, 3);
      var g = cv.g, w = cv.w, h = cv.h, bw = (w - 20) / 12;
      g.clearRect(0, 0, w, h);
      g.strokeStyle = '#46544c'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 10); g.lineTo(w, 10); g.stroke();
      g.fillStyle = '#f2d46b';
      ks.forEach(function (v, j) { g.fillRect(10 + j * bw + 3, h - 10 - v * (h - 20), bw - 6, v * (h - 20)); });
      out.textContent = 'After 12 readings: K = ' + fmt(k, 3) + '; predicted RMS error √P = ' + fmt(Math.sqrt(P), 3) + ' mrad, against ' + fmt(Math.sqrt(R), 3) + ' mrad for one reading. With these fixed Q and R, the settled gain is ' + fmt(settledK, 3) + '.';
    }
    slider(row1, 'Q', -3, 0, 0.05, Math.log10(Q), function (v) { Q = Math.pow(10, v); show(); }); row1.appendChild(lq);
    slider(row2, 'R', -1.7, 0.3, 0.05, Math.log10(R), function (v) { R = Math.pow(10, v); show(); }); row2.appendChild(lr);
    show();
  }

  var PRED = {
    F2: { q: 'A reading jumps +1 tick from rounding alone. The joint did not move. The one-step inverse treats the jump as real error. How far does it move the next goal?', c: ['About 1 tick', 'About 2 ticks', 'About 7 ticks'], a: 2, why: 'About 7. In simulation at 0.3 rad/s, one goal tick adds 13.64 × 0.001534 = 0.021 N·m of servo torque. The servo lag d/kp = 78 ms is longer than two 33 ms steps, so the joint moves only about 0.15 tick in one step. One tick of correction costs about 1/0.15 ≈ 7 goal ticks, for a tick that was never motion.' },
    F4: { q: 'Fitted estimates 4 parameters from 24 s of data and tracks about as well as the true parameters. 1152 s of data does no better. What limits the remaining error?', c: ['Not enough data', 'Wrong model form', 'Tick rounding', 'Unmodeled dead band'], a: 2, why: 'Tick rounding dominates. More data changed nothing, tracking with the fit matches tracking with the true parameters, and the error of about 0.4 mrad sits near the 0.443 mrad RMS of one reading. Panel 5 shows the observer bringing it to 0.268 mrad.' }
  };
  function predict(box) {
    var d = PRED[box.getAttribute('data-id')];
    if (!d) throw new Error('unknown prediction');
    box.appendChild(mk('p', '', d.q));
    var row = mk('div', 'sbw-row'), why = mk('p', '', d.why); why.hidden = true;
    d.c.forEach(function (t, i) {
      var b = mk('button', '', t); b.type = 'button';
      b.onclick = function () { b.className = i === d.a ? 'ok' : 'no'; row.children[d.a].className = 'ok'; why.hidden = false; };
      row.appendChild(b);
    });
    box.appendChild(row); box.appendChild(why);
  }

  function init() {
    var boxes = document.querySelectorAll('.sbw[data-sbw]');
    if (!boxes.length) return;
    if (!document.getElementById('sbw-css')) { var st = mk('style', '', CSS); st.id = 'sbw-css'; document.head.appendChild(st); }
    Array.prototype.forEach.call(boxes, function (box) {
      if (box.getAttribute('data-ready')) return;
      var kind = box.getAttribute('data-sbw'), mode = box.getAttribute('data-mode'), fb = box.querySelector('.sbw-fb');
      var f = kind === 'deriv' ? deriv : kind === 'predict' ? predict : mode === 'kalman' ? kalman : alphaBeta;
      try {
        if (fb) fb.hidden = true;
        box.insertBefore(mk('h4', '', box.getAttribute('data-title')), box.firstChild);
        f(box);
        box.setAttribute('data-ready', '1');
      } catch (e) {
        while (box.firstChild) box.removeChild(box.firstChild);
        if (fb) { fb.hidden = false; box.appendChild(fb); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

