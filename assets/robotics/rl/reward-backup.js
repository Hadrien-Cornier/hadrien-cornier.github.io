/* A reward at the end, moving backward, for "Q-learning on a grid".
   Mount points: #rb-rounds and #rb-targets in the article body.
   A 16-state corridor with one action per state. The only reward is +1 on the step out of S15; discount 0.95.
   Each round recomputes every state from a copy of the previous round's table (step size 1), so the
   one-step and eight-step round counts are exact. Nothing is sampled: every number is computed in the page. */
(function () {
  'use strict';
  var L = 16, GAMMA = 0.95, BIAS = 0.4, SHOCK = -2, SHOCK_STEP = 4;

  function backup(n, rounds) {
    var q = new Array(L).fill(0);
    for (var k = 0; k < rounds; k++) {
      var prev = q;
      q = prev.map(function (_, i) {
        var y = 0;
        for (var j = 0; j < n && i + j < L; j++) if (i + j === L - 1) y += Math.pow(GAMMA, j);
        if (i + n < L) y += Math.pow(GAMMA, n) * prev[i + n];
        return y;
      });
    }
    return q;
  }
  function fmt(v) { return v === 0 ? '0' : v.toFixed(2); }
  function settled(q) {
    var c = 0;
    for (var i = 0; i < L; i++) if (Math.abs(q[i] - Math.pow(GAMMA, L - 1 - i)) < 1e-12) c++;
    return c;
  }

  var rounds = document.getElementById('rb-rounds');
  if (rounds) {
    var range = rounds.querySelector('#rb-range');
    var out = rounds.querySelector('#rb-round');
    var status = rounds.querySelector('#rb-status');
    var lanes = [[1, rounds.querySelector('#rb-one')], [8, rounds.querySelector('#rb-eight')]];
    var render = function () {
      var r = Number(range.value), counts = [];
      out.textContent = r;
      lanes.forEach(function (lane) {
        var q = backup(lane[0], r);
        counts.push(settled(q));
        lane[1].replaceChildren.apply(lane[1], q.map(function (v, i) {
          var cell = document.createElement('div');
          cell.className = 'rb-cell';
          cell.setAttribute('role', 'listitem');
          cell.setAttribute('aria-label', 'S' + i + ': ' + v.toFixed(3));
          cell.style.background = 'rgba(147,212,255,' + (v * 0.55).toFixed(3) + ')';
          var s = document.createElement('span'); s.textContent = 'S' + i;
          var b = document.createElement('b'); b.textContent = fmt(v);
          cell.append(s, b);
          return cell;
        }));
      });
      rounds.querySelector('[data-rb="prev"]').disabled = r === 0;
      rounds.querySelector('[data-rb="next"]').disabled = r === L;
      status.textContent = r === 0
        ? 'Round 0: every value is still 0. Only the step out of S15 pays anything.'
        : 'Round ' + r + ': one-step has ' + counts[0] + ' of 16 states at their final value, eight-step has ' + counts[1] + ' of 16.' +
          (counts[1] === L && counts[0] < L ? ' S0 is 0.95¹⁵ ≈ 0.463 with eight steps and still ' + fmt(backup(1, r)[0]) + ' with one.' : '');
    };
    range.addEventListener('input', render);
    rounds.querySelector('[data-rb="prev"]').addEventListener('click', function () { range.value = Math.max(0, Number(range.value) - 1); render(); });
    rounds.querySelector('[data-rb="next"]').addEventListener('click', function () { range.value = Math.min(L, Number(range.value) + 1); render(); });
    rounds.querySelector('[data-rb="reset"]').addEventListener('click', function () { range.value = 0; render(); });
    render();
  }

  var targets = document.getElementById('rb-targets');
  if (targets) {
    var bias = targets.querySelector('#rb-bias');
    var shock = targets.querySelector('#rb-shock');
    var truth = Math.pow(GAMMA, L - 1);
    var renderTargets = function () {
      var b = bias.checked ? BIAS : 0, s = shock.checked ? SHOCK : 0;
      var e1 = GAMMA * b;
      var e8b = Math.pow(GAMMA, 8) * b, e8s = Math.pow(GAMMA, SHOCK_STEP - 1) * s;
      var num = function (x) { return x.toFixed(3).replace('-', '−'); };
      targets.querySelector('#rb-t1').textContent = num(truth + e1);
      targets.querySelector('#rb-t8').textContent = num(truth + e8b + e8s);
      var part = function (x, what) { return (x > 0 ? '+' : '−') + Math.abs(x).toFixed(2) + ' ' + what; };
      var d1 = b ? part(e1, 'from the estimate') : 'no error';
      var d8 = [b ? part(e8b, 'from the estimate') : '', s ? part(e8s, 'from step 4') : ''].filter(Boolean).join(', ') || 'no error';
      targets.querySelector('#rb-t1d').textContent = d1;
      targets.querySelector('#rb-t8d').textContent = d8;
    };
    bias.addEventListener('change', renderTargets);
    shock.addEventListener('change', renderTargets);
    renderTargets();
  }
})();
