/* Sharing widget for "Function approximation: learning about situations you never saw".
   Mount point: <div class="tri-sharing"></div>. This is a mathematical illustration, not a game run.
   Setup: 16 situations in a row. The true value of situation i is v(i) = 5 + 3x + 1.5x^2 with x = (i - 7.5) / 7.5, so the values run from 3.5 to 9.5.
   Three learners start with every number at 0 and receive the same visits. A visit at situation i hands each learner the true value v(i) as its target.
   Every learner makes the same kind of update, "move each number toward the target in proportion to how much it counted", with step size 0.3:
     table:  one number per situation, V[i] += a (y - V[i])
     groups: one number per group of four neighboring situations, G[g] += a (y - G[g])
     line:   two numbers w0, w1, estimate w0 + w1 z with z = (i - 7.5) / 4.6, both move: w += a (y - estimate) [1, z]
   The table and the groups are the special cases of the same update in which the features are one-hot (Sutton and Barto, Sec. 9.3 and Exercise 9.1). */
(function () {
  'use strict';
  var N = 16, ALPHA = 0.3, GROUP = 4;
  function truth(i) { var x = (i - 7.5) / 7.5; return 5 + 3 * x + 1.5 * x * x; }
  function fresh() { return { t: new Array(N).fill(0), g: new Array(N / GROUP).fill(0), w: [0, 0] }; }
  function z(i) { return (i - 7.5) / 4.6; }
  function values(S) {
    var t = S.t.slice(), g = [], l = [], i;
    for (i = 0; i < N; i++) { g.push(S.g[Math.floor(i / GROUP)]); l.push(S.w[0] + S.w[1] * z(i)); }
    return { t: t, g: g, l: l };
  }
  function visit(S, i) {
    var y = truth(i), gi = Math.floor(i / GROUP), e;
    S.t[i] += ALPHA * (y - S.t[i]);
    S.g[gi] += ALPHA * (y - S.g[gi]);
    e = y - (S.w[0] + S.w[1] * z(i));
    S.w[0] += ALPHA * e; S.w[1] += ALPHA * e * z(i);
  }
  function meanError(v) { var s = 0, i; for (i = 0; i < N; i++) s += Math.abs(v[i] - truth(i)); return s / N; }
  var core = { N: N, ALPHA: ALPHA, truth: truth, fresh: fresh, values: values, visit: visit, meanError: meanError };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return; }

  var rows = [
    { key: 't', name: 'One number for each situation', sub: 'a table' },
    { key: 'g', name: 'One number for each group of four neighbors', sub: 'a coarse table' },
    { key: 'l', name: 'Two numbers that draw one straight line', sub: 'a formula' }
  ];
  var css = '' +
    '.tri-sharing{margin:28px 0 34px;border:1px solid var(--line,#dcded6);background:#fff;padding:14px 14px 12px;font:13px/1.45 Arial,Helvetica,sans-serif;color:var(--ink,#242622)}' +
    '.tri-sharing p{margin:0;line-height:1.5;font-size:13px}' +
    '.ts-row{margin:0 0 14px}' +
    '.tri-sharing p.ts-label{margin:0 0 6px}' +
    '.ts-label b{font:600 14px/1.4 Arial,Helvetica,sans-serif}' +
    '.ts-label span{color:var(--muted,#656b62)}' +
    '.ts-bars{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:3px;height:70px;align-items:end;position:relative}' +
    '.ts-col{position:relative;height:100%;background:#f4f5f0;border-bottom:1px solid var(--line,#dcded6)}' +
    '.ts-fill{position:absolute;left:0;right:0;bottom:0;background:#c9a7ae;transition:height .25s}' +
    '.ts-col.seen .ts-fill{background:#8f1d36}' +
    '.ts-col.now{outline:2px solid var(--ink,#242622);outline-offset:0;z-index:1}' +
    '.ts-true{position:absolute;left:-1px;right:-1px;height:0;border-top:2px solid #1d4f8f;z-index:2}' +
    '.ts-ticks{display:grid;grid-template-columns:repeat(16,minmax(0,1fr));gap:3px;margin-top:2px;font:11px/1.2 ui-monospace,Menlo,monospace;color:#8a8f86;text-align:center}' +
    '.ts-bar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:12px 0 6px}' +
    '.ts-bar label{font:600 13px/1 Arial,Helvetica,sans-serif}' +
    '.ts-bar input[type=range]{width:min(260px,100%);accent-color:#8f1d36}' +
    '.ts-bar button{font:600 13px/1 Arial,Helvetica,sans-serif;border:1px solid var(--ink,#242622);background:#fff;color:var(--ink,#242622);padding:9px 14px;cursor:pointer;border-radius:2px}' +
    '.ts-bar button:hover{background:#f4f5f0}' +
    '.tri-sharing p.ts-sum{color:var(--muted,#656b62);margin:4px 0 0;min-height:4.4em}' +
    '.tri-sharing p.ts-note{font-size:12px;color:var(--muted,#656b62);margin:8px 0 0}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function mount(el) {
    var S = fresh(), visited = new Array(N).fill(false), last = null, count = 0, rnd = 12345, cur = 0;
    el.innerHTML = '';
    var cols = {}, labels = {}, trueMarks = [];
    rows.forEach(function (r) {
      var row = document.createElement('div'); row.className = 'ts-row';
      var lab = document.createElement('p'); lab.className = 'ts-label';
      lab.innerHTML = '<b>' + r.name + '</b> <span>' + r.sub + '. <i class="ts-err"></i></span>';
      labels[r.key] = lab.querySelector('.ts-err'); row.appendChild(lab);
      var bars = document.createElement('div'); bars.className = 'ts-bars'; cols[r.key] = [];
      for (var i = 0; i < N; i++) {
        var c = document.createElement('div'); c.className = 'ts-col';
        var f = document.createElement('div'); f.className = 'ts-fill'; c.appendChild(f);
        var t = document.createElement('div'); t.className = 'ts-true'; t.style.bottom = (truth(i) / 10 * 100) + '%'; c.appendChild(t);
        bars.appendChild(c); cols[r.key].push({ col: c, fill: f });
      }
      row.appendChild(bars);
      if (r.key === 'l') {
        var ticks = document.createElement('div'); ticks.className = 'ts-ticks';
        for (i = 0; i < N; i++) { var tk = document.createElement('div'); tk.textContent = String(i + 1); ticks.appendChild(tk); }
        row.appendChild(ticks);
      }
      el.appendChild(row);
    });
    var bar = document.createElement('div'); bar.className = 'ts-bar';
    var lab2 = document.createElement('label'); lab2.textContent = 'Situation '; lab2.setAttribute('for', 'ts-slider');
    var slider = document.createElement('input'); slider.type = 'range'; slider.min = '1'; slider.max = String(N); slider.value = '1'; slider.id = 'ts-slider';
    var num = document.createElement('label'); num.textContent = '1'; num.style.minWidth = '1.6em';
    var go = document.createElement('button'); go.type = 'button'; go.textContent = 'Visit this situation';
    var rd = document.createElement('button'); rd.type = 'button'; rd.textContent = 'Visit a random one';
    var rs = document.createElement('button'); rs.type = 'button'; rs.textContent = 'Start over';
    [lab2, slider, num, go, rd, rs].forEach(function (x) { bar.appendChild(x); });
    el.appendChild(bar);
    var sum = document.createElement('p'); sum.className = 'ts-sum'; sum.setAttribute('aria-live', 'polite'); el.appendChild(sum);
    var note = document.createElement('p'); note.className = 'ts-note';
    note.textContent = 'A mathematical illustration, not a game run. Sixteen situations in a row. The blue mark in each column is the true value. Each visit hands all three learners that true value as the target. Every number starts at 0, the step size is 0.3, and there is no noise. Red columns are situations that were visited.';
    el.appendChild(note);

    function render(msg) {
      var v = values(S);
      rows.forEach(function (r) {
        v[r.key].forEach(function (x, i) {
          var c = cols[r.key][i];
          c.fill.style.height = Math.max(0, Math.min(100, x / 10 * 100)) + '%';
          c.col.className = 'ts-col' + (visited[i] ? ' seen' : '') + (i === cur ? ' now' : '');
        });
        labels[r.key].textContent = 'Average error over all 16 situations: ' + (Math.round(meanError(v[r.key]) * 10) / 10).toFixed(1) + '.';
      });
      sum.textContent = msg || 'No visits yet. Every number is 0. Pick a situation and visit it.';
    }
    function doVisit(i) {
      var before = values(S);
      visit(S, i); visited[i] = true; count++; last = i;
      var after = values(S), parts = [];
      rows.forEach(function (r) {
        var moved = 0, k;
        for (k = 0; k < N; k++) if (Math.abs(after[r.key][k] - before[r.key][k]) > 0.005) moved++;
        parts.push(r.sub + ' ' + moved);
      });
      var nx = i < N - 1 ? i + 1 : i - 1, d = [];
      rows.forEach(function (r) { d.push(r.sub + ' ' + (Math.round((after[r.key][nx] - before[r.key][nx]) * 100) / 100).toFixed(2)); });
      var seenN = visited.filter(Boolean).length;
      render('Visit ' + count + ' was at situation ' + (i + 1) + '. Situations visited so far: ' + seenN + ' of ' + N + '. Situations whose number moved: ' + parts.join(', ') + '. Change in the number at neighbor situation ' + (nx + 1) + ': ' + d.join(', ') + '.');
    }
    slider.addEventListener('input', function () { cur = +slider.value - 1; num.textContent = slider.value; render(count ? sum.textContent : null); });
    go.addEventListener('click', function () { doVisit(cur); });
    rd.addEventListener('click', function () {
      rnd = (rnd * 1103515245 + 12345) % 2147483648; var i = Math.floor(rnd / 2147483648 * N);
      cur = i; slider.value = String(i + 1); num.textContent = String(i + 1); doVisit(i);
    });
    rs.addEventListener('click', function () { S = fresh(); visited = new Array(N).fill(false); last = null; count = 0; render(); });
    render();
  }
  [].slice.call(document.querySelectorAll('.tri-sharing')).forEach(mount);
})();
