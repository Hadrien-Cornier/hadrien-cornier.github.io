// Pinned whole-system canvas: scrolling the text pans and zooms the SVG viewBox to the panel of the current section.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function fit(v, W, H) {
    var A = W / H, x = v[0], y = v[1], w = v[2], h = v[3];
    if (w / h < A) { var nw = h * A; x -= (nw - w) / 2; w = nw; } else { var nh = w / A; y -= (nh - h) * 0.3; h = nh; }
    return [x, y, w, h];
  }
  function init(rc) {
    var stage = rc.querySelector('.rc-stage'), svg = stage.querySelector('svg.rc-svg'), body = rc.querySelector('.rc-body');
    var views = JSON.parse(svg.getAttribute('data-views')), whole = svg.getAttribute('data-whole').split(' ').map(Number);
    var marks = [].slice.call(rc.querySelectorAll('.rc-mark')), where = stage.querySelector('.rc-where'), reset = stage.querySelector('.rc-reset');
    var cam = null, target = null, raf = 0, idx = -1, hold = false, holdAt = -1, tick = 0;
    var nav = document.createElement('div'); nav.className = 'rc-nav';
    var prev = document.createElement('button'), next = document.createElement('button'), sel = document.createElement('select');
    prev.type = next.type = 'button'; prev.textContent = '◀'; next.textContent = '▶';
    prev.setAttribute('aria-label', 'Previous panel'); next.setAttribute('aria-label', 'Next panel'); sel.setAttribute('aria-label', 'Contents');
    var o0 = document.createElement('option'); o0.value = '-1'; o0.textContent = 'Contents: whole canvas'; sel.appendChild(o0);
    marks.forEach(function (m, i) { var o = document.createElement('option'); o.value = String(i); o.textContent = (i + 1) + '. ' + m.getAttribute('data-title'); sel.appendChild(o); });
    nav.appendChild(prev); nav.appendChild(sel); nav.appendChild(next); body.insertBefore(nav, body.firstChild);
    function size() { return [Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight)]; }
    function vbStr(v) { return v.map(function (n) { return Math.round(n * 10) / 10; }).join(' '); }
    function draw(v) { cam = v; svg.setAttribute('viewBox', vbStr(v)); rc.setAttribute('data-viewbox', vbStr(v)); }
    function goCam(v, instant) {
      target = v; cancelAnimationFrame(raf);
      if (instant || reduce.matches || !cam) { draw(v); return; }
      var from = cam.slice(), t0 = null, dur = 520;
      (function step(ts) {
        if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        draw(from.map(function (f, i) { return f + (target[i] - f) * e; }));
        if (k < 1) raf = requestAnimationFrame(step);
      })(performance.now());
    }
    function apply(i, instant) {
      idx = i; sel.value = String(i); var s = size(), panel = null, v = whole, label = 'Whole canvas';
      if (i >= 0) { var m = marks[i]; panel = m.getAttribute('data-panel'); var vn = m.getAttribute('data-view'); v = (s[0] / s[1] < 1 && views[vn + '_p']) || views[vn] || views[panel]; label = (i + 1) + '. ' + m.getAttribute('data-title'); }
      [].forEach.call(svg.querySelectorAll('.rc-panel'), function (g) { g.classList.toggle('is-active', g.getAttribute('data-panel') === panel); });
      rc.classList.toggle('is-zoomed', panel !== null);
      rc.setAttribute('data-active-panel', panel || 'whole'); rc.setAttribute('data-active-index', String(i)); rc.setAttribute('data-active-view', i >= 0 ? marks[i].getAttribute('data-view') : 'whole');
      where.textContent = label; goCam(fit(v, s[0], s[1]), instant);
    }
    function topEdge() { var d = window.matchMedia('(min-width: 1000px)').matches; return d ? window.innerHeight * 0.36 : stage.getBoundingClientRect().bottom + nav.offsetHeight + 110; }
    function current() { var lim = topEdge(), k = -1; for (var i = 0; i < marks.length; i++) { if (marks[i].getBoundingClientRect().top <= lim) k = i; } return k; }
    function onScroll() {
      if (tick) return; tick = requestAnimationFrame(function () {
        tick = 0; var k = current();
        if (hold && k === holdAt) return; /* Whole canvas stays until the text reaches another section */
        if (k !== idx) { hold = false; apply(k); }
      });
    }
    function setTop() {
      var d = window.matchMedia('(min-width: 1000px)').matches;
      rc.style.setProperty('--rc-top', (d ? nav.offsetHeight + 12 : stage.offsetHeight + nav.offsetHeight + 12) + 'px');
    }
    function go(i) {
      hold = false; apply(i, false);
      if (i >= 0) marks[i].scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      else window.scrollTo({ top: rc.getBoundingClientRect().top + window.pageYOffset - 8, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
    reset.addEventListener('click', function () { hold = true; holdAt = current(); apply(-1); });
    sel.addEventListener('change', function () { go(parseInt(sel.value, 10)); });
    prev.addEventListener('click', function () { go(Math.max(-1, (hold ? holdAt : idx) - 1)); });
    next.addEventListener('click', function () { go(Math.min(marks.length - 1, (hold ? holdAt : idx) + 1)); });
    [].forEach.call(document.querySelectorAll('a[data-go]'), function (a) {
      a.addEventListener('click', function (e) { var n = a.getAttribute('data-go'), i = marks.findIndex(function (m) { return m.id === n; }); if (i >= 0) { e.preventDefault(); go(i); } });
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      setTop(); apply(idx, true);
      if (idx >= 0 && !hold) marks[idx].scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    setTop(); apply(current(), true);
    window.RC = { state: function () { return { index: idx, panel: rc.getAttribute('data-active-panel'), view: rc.getAttribute('data-active-view'), viewBox: rc.getAttribute('data-viewbox') }; }, go: go };
  }
  function boot() { [].forEach.call(document.querySelectorAll('.rc'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
