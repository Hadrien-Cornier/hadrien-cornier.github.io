/* Three switches for "The deadly triad".
   Mount point: <div class="tri-switches"></div>. This is a mathematical illustration, not a game run.
   Setup: one walk goes from situation A to situation B and then ends. Every reward is 0, so the true value of A and of B is 0.
   Discount 0.99, step size 0.1, A starts at 10 and B at 20. B's own target is always 0, because its next step ends the walk.
   Three switches (8 combinations):
     guess:  the target for A is the discount times the current estimate of B. Off: the target is the real return, 0.
     share:  one weight w gives A = w and B = 2w (Sutton and Barto, Sec. 11.2). Off: A and B each keep their own number.
     skipB:  only A is updated and B is left out (the update for B never happens). Off: B is updated once per walk, after A.
             This is an analogue of an update-distribution mismatch. The toy has no choice of actions, so it is not an off-policy task.
   With all three on, each update multiplies w by 1 + a(2g - 1) = 1.098. */
(function () {
  'use strict';
  var G = 0.99, A = 0.1, W0 = 10, WALKS = 100;
  function run(guess, share, skipB, n) {
    var vals = [W0], w = W0, wA = W0, wB = 2 * W0, i, tA;
    for (i = 0; i < n; i++) {
      if (share) {
        tA = guess ? G * 2 * w : 0;
        w += A * (tA - w);
        if (!skipB) w += A * (0 - 2 * w) * 2;
        vals.push(w);
      } else {
        tA = guess ? G * wB : 0;
        wA += A * (tA - wA);
        if (!skipB) wB += A * (0 - wB);
        vals.push(wA);
      }
    }
    return { a: vals, b: share ? 2 * w : wB };
  }
  var core = { G: G, A: A, W0: W0, WALKS: WALKS, run: run };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return; }

  function fmt(x) {
    var a = Math.abs(x);
    if (a >= 1000) return Math.round(a).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (a >= 100) return a.toFixed(0);
    if (a >= 1) return a.toFixed(1);
    if (a >= 0.001) return a.toFixed(3);
    return 'about 0';
  }
  var names = [
    { key: 'guess', label: 'The target uses the robot’s own guess', hint: 'bootstrapping' },
    { key: 'share', label: 'One number feeds both situations', hint: 'function approximation' },
    { key: 'skipB', label: 'B is never updated', hint: 'a missing pull-back' }
  ];
  var css = '' +
    '.tri-switches{margin:28px 0 34px;border:1px solid var(--line,#dcded6);background:#fff;padding:14px 14px 12px;font:13px/1.45 Arial,Helvetica,sans-serif;color:var(--ink,#242622)}' +
    '.tri-switches p{margin:0;line-height:1.5;font-size:13px}' +
    '.tw-opts{display:grid;gap:8px;margin:0 0 12px}' +
    '.tw-opts label{display:flex;gap:10px;align-items:flex-start;font:600 14px/1.35 Arial,Helvetica,sans-serif;cursor:pointer}' +
    '.tw-opts input{margin:2px 0 0;width:18px;height:18px;accent-color:#8f1d36;flex:none}' +
    '.tw-opts span{font-weight:400;color:var(--muted,#656b62)}' +
    '.tw-chart{display:block;width:100%;height:auto;background:#f9faf6;border:1px solid var(--line,#dcded6)}' +
    '.tri-switches p.tw-sum{margin:10px 0 0;min-height:4.4em}' +
    '.tw-wrap{max-width:100%;overflow-x:auto}' +
    '.tri-switches .tw-table{width:100%;border-collapse:collapse;margin:10px 0 0;font:12px/1.35 Arial,Helvetica,sans-serif}' +
    '.tri-switches .tw-table th,.tri-switches .tw-table td{border-bottom:1px solid var(--line,#dcded6);padding:4px 6px;min-width:0;text-align:left;vertical-align:top}' +
    '.tri-switches .tw-table th{font-weight:600;color:var(--muted,#656b62);background:none}' +
    '.tw-table tr.now td{background:#f4ece8;font-weight:600}' +
    '.tri-switches p.tw-note{font-size:12px;color:var(--muted,#656b62);margin:8px 0 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var NS = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  var X0 = 44, X1 = 292, Y0 = 8, Y1 = 104, LO = -3, HI = 6;
  function px(n) { return X0 + (X1 - X0) * n / WALKS; }
  function py(v) { var l = Math.log10(Math.max(Math.abs(v), 1e-9)); l = Math.max(LO, Math.min(HI, l)); return Y1 - (Y1 - Y0) * (l - LO) / (HI - LO); }

  function mount(el) {
    var s = { guess: true, share: true, skipB: true };
    el.innerHTML = '';
    var opts = document.createElement('div'); opts.className = 'tw-opts'; opts.setAttribute('role', 'group'); opts.setAttribute('aria-label', 'Three switches');
    var boxes = {};
    names.forEach(function (n, i) {
      var l = document.createElement('label'), c = document.createElement('input');
      c.type = 'checkbox'; c.checked = true; c.id = 'tw-' + n.key; boxes[n.key] = c;
      var t = document.createElement('div'); t.innerHTML = n.label + ' <span>(' + n.hint + ')</span>';
      l.appendChild(c); l.appendChild(t); opts.appendChild(l);
      c.addEventListener('change', function () { s[n.key] = c.checked; render(); });
    });
    el.appendChild(opts);
    var svg = mk('svg', { viewBox: '0 0 300 124', class: 'tw-chart', role: 'img' });
    var grid = mk('g', {});
    [-3, 0, 3, 6].forEach(function (e) {
      var y = Y1 - (Y1 - Y0) * (e - LO) / (HI - LO);
      grid.appendChild(mk('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: '#dcded6', 'stroke-width': 1 }));
      var tx = mk('text', { x: X0 - 4, y: y + 3.5, 'text-anchor': 'end', 'font-size': 9, fill: '#656b62', 'font-family': 'Arial,Helvetica,sans-serif' });
      tx.textContent = e === 0 ? '1' : e === 3 ? '1,000' : e === 6 ? '1,000,000' : '0.001';
      grid.appendChild(tx);
    });
    var xl = mk('text', { x: X0, y: 119, 'font-size': 9, fill: '#656b62', 'font-family': 'Arial,Helvetica,sans-serif' }); xl.textContent = '0 rounds';
    var xr = mk('text', { x: X1, y: 119, 'text-anchor': 'end', 'font-size': 9, fill: '#656b62', 'font-family': 'Arial,Helvetica,sans-serif' }); xr.textContent = '100 rounds';
    var line = mk('polyline', { fill: 'none', stroke: '#8f1d36', 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
    svg.appendChild(grid); svg.appendChild(xl); svg.appendChild(xr); svg.appendChild(line);
    el.appendChild(svg);
    var sum = document.createElement('p'); sum.className = 'tw-sum'; sum.setAttribute('aria-live', 'polite'); el.appendChild(sum);
    var table = document.createElement('table'); table.className = 'tw-table';
    var head = '<thead><tr><th>Guess</th><th>One number</th><th>B never updated</th><th>A after 100 rounds</th></tr></thead>';
    var body = '<tbody></tbody>';
    table.innerHTML = head + body;
    var wrap = document.createElement('div'); wrap.className = 'tw-wrap'; wrap.appendChild(table); el.appendChild(wrap);
    var rowsEl = table.querySelector('tbody'), rowMap = {};
    [1, 0].forEach(function (g) { [1, 0].forEach(function (h) { [1, 0].forEach(function (k) {
      var r = run(!!g, !!h, !!k, WALKS), v = r.a[WALKS], tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (g ? 'yes' : 'no') + '</td><td>' + (h ? 'yes' : 'no') + '</td><td>' + (k ? 'yes' : 'no') + '</td><td>' + fmt(v) + '</td>';
      rowsEl.appendChild(tr); rowMap[g + '' + h + k] = tr;
    }); }); });
    var note = document.createElement('p'); note.className = 'tw-note';
    note.textContent = 'A mathematical illustration, not a game run. A round is one walk from A to B, which ends. Each round updates A once, and B once more when the third switch is off. All rewards are 0, so the true value of both is 0. The discount is 0.99, the step size is 0.1, A starts at 10 and B at 20. The table lists the estimate of A after 100 rounds (the true value is 0). The chart shows the estimate of A on a log scale; values below 0.001 sit on the bottom line.';
    el.appendChild(note);

    function render() {
      var r = run(s.guess, s.share, s.skipB, WALKS), a = r.a, pts = [], i;
      for (i = 0; i <= WALKS; i++) pts.push(px(i).toFixed(1) + ',' + py(a[i]).toFixed(1));
      line.setAttribute('points', pts.join(' '));
      var v10 = a[10], v100 = a[WALKS], msg;
      if (v100 > 1000 * W0) msg = 'The estimate of A grows without end: ' + fmt(v10) + ' after 10 rounds, ' + fmt(v100) + ' after 100. The true value is 0.';
      else if (v100 < 0.1) msg = 'The estimate of A shrinks toward 0, the true value: ' + fmt(v10) + ' after 10 rounds, ' + (v100 < 0.001 ? 'about 0' : fmt(v100)) + ' after 100.';
      else msg = 'The estimate of A settles at ' + fmt(v100) + ' and stays there. It is stable but wrong: the true value is 0, and B’s number, 20, is never corrected.';
      sum.textContent = msg;
      svg.setAttribute('aria-label', 'Estimate of A over 100 rounds, log scale. ' + msg);
      for (var k in rowMap) rowMap[k].className = '';
      rowMap[(+s.guess) + '' + (+s.share) + (+s.skipB)].className = 'now';
    }
    render();
  }
  [].slice.call(document.querySelectorAll('.tri-switches')).forEach(mount);
})();
