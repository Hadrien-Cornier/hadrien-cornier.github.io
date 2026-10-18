/* Corridor for "Why bootstrapping was invented".
   Mount point: <div class="tri-corridor"></div>.
   Setup: 8 states in a row, then the goal. The robot walks right, one state per step. Reward is 0 on every step except the last move into the goal, which pays 1.
   Discount 1, step size 1, all values start at 0, deterministic moves. The update is n-step TD prediction (Sutton and Barto, Section 7.1, Eq. 7.1 and 7.2):
   n = 1 is one-step TD, n = 3 uses three real rewards and then a guess, n = 8 or more waits for the end of the walk (Monte Carlo).
   One button press runs one whole walk, then applies that walk's updates in the order the algorithm makes them. */
(function () {
  'use strict';
  var N = 8, ALPHA = 1, GAMMA = 1;
  var rows = [
    { n: 1, name: 'One guess ahead', sub: 'one real reward, then my own guess (one-step TD)' },
    { n: 3, name: 'Three real rewards, then a guess', sub: 'three-step TD' },
    { n: 99, name: 'Wait for the end', sub: 'the real return from the end of the walk (Monte Carlo)' }
  ];
  function walk(V, n) {
    var T = N;
    function R(i) { return i === T ? 1 : 0; }
    for (var t = 0; ; t++) {
      var tau = t - n + 1;
      if (tau >= 0) {
        var G = 0, i;
        for (i = tau + 1; i <= Math.min(tau + n, T); i++) G += Math.pow(GAMMA, i - tau - 1) * R(i);
        if (tau + n < T) G += Math.pow(GAMMA, n) * V[tau + n];
        V[tau] += ALPHA * (G - V[tau]);
      }
      if (tau === T - 1) break;
    }
  }
  function surprises(V) {
    var d = [], t;
    for (t = 0; t < N; t++) d.push((t === N - 1 ? 1 : 0) + (t === N - 1 ? 0 : GAMMA * V[t + 1]) - V[t]);
    return d;
  }
  var css = '' +
    '.tri-corridor{margin:28px 0 34px;border:1px solid var(--line,#dcded6);background:#fff;padding:14px 14px 12px;font:13px/1.45 Arial,Helvetica,sans-serif;color:var(--ink,#242622)}' +
    '.tri-corridor p{margin:0;line-height:1.5;font-size:13px}' +
    '.tc-row{margin:0 0 12px}' +
    '.tri-corridor p.tc-label{margin:0 0 6px}' +
    '.tc-label{margin:0 0 4px}' +
    '.tc-label b{font:600 14px/1.4 Arial,Helvetica,sans-serif}' +
    '.tc-label span{color:var(--muted,#656b62)}' +
    '.tc-cells{display:grid;grid-template-columns:repeat(8,minmax(0,1fr)) minmax(0,1.3fr);gap:4px}' +
    '.tc-cell{border:1px solid var(--line,#dcded6);text-align:center;padding:7px 0;font:600 14px/1 ui-monospace,Menlo,monospace;background:#f4f5f0;color:#8a8f86;transition:background .25s,color .25s}' +
    '.tc-cell.on{background:#8f1d36;color:#fff;border-color:#8f1d36}' +
    '.tc-goal{border:1px solid var(--line,#dcded6);text-align:center;padding:7px 0;font:600 12px/1.2 Arial,Helvetica,sans-serif;color:var(--muted,#656b62)}' +
    '.tc-d .tc-cell{background:#fff;color:#8a8f86;font-weight:400;padding:5px 0;font-size:13px}' +
    '.tc-d .tc-cell.on{background:#f6e3e7;color:#8f1d36;border-color:#8f1d36;font-weight:600}' +
    '.tc-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:12px 0 6px}' +
    '.tc-bar button{font:600 13px/1 Arial,Helvetica,sans-serif;border:1px solid var(--ink,#242622);background:#fff;color:var(--ink,#242622);padding:9px 14px;cursor:pointer;border-radius:2px}' +
    '.tc-bar button:hover{background:#f4f5f0}' +
    '.tc-bar button[disabled]{opacity:.45;cursor:default}' +
    '.tri-corridor p.tc-sum{color:var(--muted,#656b62);margin:4px 0 0;min-height:2.9em}' +
    '.tri-corridor p.tc-note{font-size:12px;color:var(--muted,#656b62);margin:8px 0 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function mount(el) {
    var V = rows.map(function () { return new Array(N).fill(0); });
    var walks = 0;
    el.innerHTML = '';
    var cellsOf = [];
    function cells(cls, goalText) {
      var wrap = document.createElement('div'); wrap.className = 'tc-cells ' + (cls || '');
      var arr = [], i, c;
      for (i = 0; i < N; i++) { c = document.createElement('div'); c.className = 'tc-cell'; c.textContent = '0'; wrap.appendChild(c); arr.push(c); }
      var g = document.createElement('div'); g.className = 'tc-goal'; g.textContent = goalText; wrap.appendChild(g);
      return { wrap: wrap, arr: arr };
    }
    rows.forEach(function (r, k) {
      var row = document.createElement('div'); row.className = 'tc-row';
      var lab = document.createElement('p'); lab.className = 'tc-label';
      lab.innerHTML = '<b>' + r.name + '</b> <span>' + r.sub + '</span>';
      row.appendChild(lab);
      var c = cells('', 'goal, +1'); row.appendChild(c.wrap); cellsOf.push(c.arr);
      if (k === 0) {
        var d = cells('tc-d', 'next walk: δ'); d.wrap.className = 'tc-cells tc-d';
        var cap = document.createElement('p'); cap.className = 'tc-label'; cap.style.margin = '10px 0 6px';
        cap.innerHTML = '<span>The made-up reward δ that the one-step learner would feel on its next walk, move by move</span>';
        row.appendChild(cap); row.appendChild(d.wrap); cellsOf.dArr = d.arr;
      }
      el.appendChild(row);
    });
    var bar = document.createElement('div'); bar.className = 'tc-bar';
    var go = document.createElement('button'); go.type = 'button'; go.textContent = 'Walk the corridor once more';
    var rs = document.createElement('button'); rs.type = 'button'; rs.textContent = 'Start over';
    bar.appendChild(go); bar.appendChild(rs); el.appendChild(bar);
    var sum = document.createElement('p'); sum.className = 'tc-sum'; sum.setAttribute('aria-live', 'polite'); el.appendChild(sum);
    var note = document.createElement('p'); note.className = 'tc-note';
    note.textContent = 'Setup: eight states, reward 1 only on the last move, discount 1, step size 1, all values start at 0, no randomness. Each number is the learner’s value for that state. Red means the value is 1. Updates follow the n-step TD algorithm in Sutton and Barto, Section 7.1.';
    el.appendChild(note);

    function credited(v) { return v.filter(function (x) { return x > 0.999; }).length; }
    function render() {
      rows.forEach(function (r, k) {
        V[k].forEach(function (x, i) {
          var c = cellsOf[k][i]; c.textContent = (Math.round(x * 100) / 100).toString();
          c.className = 'tc-cell' + (x > 0.999 ? ' on' : '');
        });
      });
      var d = surprises(V[0]);
      cellsOf.dArr.forEach(function (c, i) {
        var x = Math.round(d[i] * 100) / 100; c.textContent = x === 0 ? '0' : '+' + x;
        c.className = 'tc-cell' + (Math.abs(x) > 0.001 ? ' on' : '');
      });
      var all = V.every(function (v) { return credited(v) === N; });
      if (walks === 0) sum.textContent = 'No walks yet. Every value is 0, because no reward has arrived.';
      else sum.textContent = 'After walk ' + walks + ': states that know the reward is coming: one-step ' + credited(V[0]) + ' of ' + N + ', three-step ' + credited(V[1]) + ' of ' + N + ', waiting ' + credited(V[2]) + ' of ' + N + '.' + (all ? ' All three agree now.' : '');
      go.disabled = walks >= 12;
    }
    go.addEventListener('click', function () { rows.forEach(function (r, k) { walk(V[k], r.n); }); walks++; render(); });
    rs.addEventListener('click', function () { V = rows.map(function () { return new Array(N).fill(0); }); walks = 0; render(); });
    render();
  }
  [].slice.call(document.querySelectorAll('.tri-corridor')).forEach(mount);
})();
