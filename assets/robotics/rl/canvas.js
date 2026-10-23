// Long-form canvas. One list of steps drives two layouts:
// - Wide screens: the board is pinned beside the text, and scrolling the text moves its camera to the
//   panel of the current section. The camera is a CSS transform on a board drawn once, so a move costs
//   one paint and the compositor animates it; animating the viewBox re-laid out the whole drawing each frame.
// - Narrower screens: each step is drawn inline, after the first paragraph of its section, as a full-width
//   figure. A figure is a snapshot of the same board at that step, made when it nears the viewport.
// The steps are the .rc-mark elements in the text; their views are named in the board's data-views.
// CSS that depends on the step reads the state from the drawing scope, :is(.rc-stage, .rc-fig), not from .rc,
// because the inline figures sit inside .rc and each one keeps the state of its own step.
(function () {
  'use strict';
  var WIDE = window.matchMedia('(min-width: 1000px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SVGNS = 'http://www.w3.org/2000/svg';
  function fit(v, W, H) {
    var A = W / H, x = v[0], y = v[1], w = v[2], h = v[3];
    if (w / h < A) { var nw = h * A; x -= (nw - w) / 2; w = nw; } else { var nh = w / A; y -= (nh - h) * 0.3; h = nh; }
    return [x, y, w, h];
  }
  function vbStr(v) { return v.map(function (n) { return Math.round(n * 10) / 10; }).join(' '); }
  function onChange(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else mq.addListener(fn); }
  /* A snapshot repeats ids from the live board; give its ids a suffix and follow every reference to them. */
  function uniqueIds(root, suffix) {
    var ids = {};
    [].forEach.call(root.querySelectorAll('[id]'), function (el) { ids[el.id] = el.id + suffix; el.id += suffix; });
    var refAttrs = ['fill', 'stroke', 'marker-start', 'marker-mid', 'marker-end', 'clip-path', 'mask', 'filter', 'style', 'href', 'xlink:href', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'for'];
    [].forEach.call(root.querySelectorAll('*'), function (el) {
      refAttrs.forEach(function (a) {
        var v = el.getAttribute(a); if (!v) return;
        var n = v.replace(/url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g, function (m, q, id) { return ids[id] ? 'url(#' + ids[id] + ')' : m; });
        if (a === 'href' || a === 'xlink:href') n = n.replace(/^#(.+)$/, function (m, id) { return ids[id] ? '#' + ids[id] : m; });
        else if (/^aria-|^for$/.test(a)) n = n.split(/\s+/).map(function (id) { return ids[id] || id; }).join(' ');
        if (n !== v) el.setAttribute(a, n);
      });
    });
  }
  function init(rc) {
    var stage = rc.querySelector('.rc-stage'), view = stage.querySelector('.rc-view'), svg = view.querySelector('svg.rc-svg'), body = rc.querySelector('.rc-body');
    var views = JSON.parse(svg.getAttribute('data-views')), whole = svg.getAttribute('data-whole').split(' ').map(Number);
    var narrowAt = +svg.getAttribute('data-narrow') || 0; /* optional: below this width (a phone), prefer the _n views */
    var marks = [].slice.call(rc.querySelectorAll('.rc-mark')), where = stage.querySelector('.rc-where'), reset = stage.querySelector('.rc-reset');
    var panels = [].slice.call(svg.querySelectorAll('.rc-panel'));
    var idx = -1, hold = false, holdAt = -1, peekY = null, tick = 0, mode = '', base = 1, home = stage.nextSibling;
    function label(i) { var n = marks[i].getAttribute('data-num'); if (n === null) n = String(i + 1); return (n ? n + '. ' : '') + marks[i].getAttribute('data-title'); }
    var nav = document.createElement('div'); nav.className = 'rc-nav';
    var prev = document.createElement('button'), next = document.createElement('button'), sel = document.createElement('select');
    prev.type = next.type = 'button'; prev.textContent = '◀'; next.textContent = '▶';
    prev.setAttribute('aria-label', 'Previous panel'); next.setAttribute('aria-label', 'Next panel'); sel.setAttribute('aria-label', 'Contents');
    var o0 = document.createElement('option'); o0.value = '-1'; o0.textContent = 'Contents: whole canvas'; sel.appendChild(o0);
    marks.forEach(function (m, i) { var o = document.createElement('option'); o.value = String(i); o.textContent = label(i); sel.appendChild(o); });
    nav.appendChild(prev); nav.appendChild(sel); nav.appendChild(next); body.insertBefore(nav, body.firstChild);
    function size() { return [Math.max(1, view.clientWidth), Math.max(1, view.clientHeight)]; }
    function viewFor(i, W, H) {
      if (i < 0) return whole;
      var m = marks[i], vn = m.getAttribute('data-view');
      return (W < narrowAt && views[vn + '_n']) || (W / H < 1 && views[vn + '_p']) || views[vn] || views[m.getAttribute('data-panel')] || whole;
    }
    /* Step state: the active panel and the attributes that CSS and the widget scripts read. */
    function setState(i) {
      idx = i; sel.value = String(i);
      var panel = i >= 0 ? marks[i].getAttribute('data-panel') : null, vn = i >= 0 ? marks[i].getAttribute('data-view') : 'whole';
      panels.forEach(function (g) { g.classList.toggle('is-active', g.getAttribute('data-panel') === panel); });
      [rc, stage].forEach(function (el) { el.classList.toggle('is-zoomed', panel !== null); el.setAttribute('data-active-panel', panel || 'whole'); el.setAttribute('data-active-view', vn); });
      rc.setAttribute('data-active-index', String(i));
      where.textContent = i >= 0 ? label(i) : 'Whole canvas';
    }
    /* Wide camera: the board is drawn at a fixed base scale, and a transform pans and zooms it. */
    function layoutBoard() {
      /* Base scale: the zoom of the first panel view, so a panel shows at about scale 1 and the chalk filter keeps its size. */
      var s = size(), v = marks.length ? viewFor(0, s[0], s[1]) : whole;
      base = Math.min(s[0] / v[2], s[1] / v[3]);
      svg.setAttribute('viewBox', vbStr(whole));
      svg.style.width = whole[2] * base + 'px'; svg.style.height = whole[3] * base + 'px';
    }
    function camera(v, instant) {
      var s = size(), f = fit(v, s[0], s[1]), k = s[0] / f[2];
      var t = 'translate(' + (-(f[0] - whole[0]) * k).toFixed(2) + 'px,' + (-(f[1] - whole[1]) * k).toFixed(2) + 'px) scale(' + (k / base).toFixed(5) + ')';
      if (instant || reduce.matches) { svg.style.transition = 'none'; svg.style.transform = t; void getComputedStyle(svg).transform; svg.style.transition = ''; }
      else svg.style.transform = t;
      rc.setAttribute('data-viewbox', vbStr(f));
    }
    function apply(i, instant) {
      setState(i);
      if (mode === 'wide') { var s = size(); camera(viewFor(i, s[0], s[1]), instant); }
      else if (docked >= 0) frameDocked();
    }
    function line() { return WIDE.matches ? window.innerHeight * 0.36 : stage.getBoundingClientRect().bottom + nav.offsetHeight + 48; }
    function current() { var lim = line(), k = -1; for (var i = 0; i < marks.length; i++) { if (marks[i].getBoundingClientRect().top <= lim) k = i; } return k; }
    function onScroll() {
      if (tick || mode !== 'wide') return; tick = requestAnimationFrame(function () {
        tick = 0; var k = current();
        /* Whole canvas stays until the text reaches another section; a peek also ends once the reader scrolls on */
        if (hold && k === holdAt && (peekY === null || Math.abs(window.pageYOffset - peekY) < 60)) return;
        if (k !== idx) { hold = false; peekY = null; apply(k); }
      });
    }
    function setTop() {
      rc.style.setProperty('--rc-nav-top', stage.offsetHeight + 'px'); /* measured stage height places the nav; the same value feeds the anchor offset below */
      rc.style.setProperty('--rc-top', (mode === 'wide' ? nav.offsetHeight + 12 : 12) + 'px');
    }
    function go(i) {
      var smooth = reduce.matches ? 'auto' : 'smooth';
      if (mode !== 'wide') { if (i >= 0) marks[i].scrollIntoView({ behavior: smooth, block: 'start' }); return; }
      hold = false; peekY = null; apply(i, false);
      if (i >= 0) marks[i].scrollIntoView({ behavior: smooth, block: 'start' });
      else window.scrollTo({ top: rc.getBoundingClientRect().top + window.pageYOffset - 8, behavior: smooth });
    }
    /* Show another section's view without scrolling the text; it holds until the reader scrolls about 60 px or reaches another section.
       Inline, the live board opens in that section's figure instead. */
    function peek(id) {
      var i = marks.findIndex(function (m) { return m.id === id; }); if (i < 0) return;
      if (mode !== 'wide') { dock(i, true); return; }
      hold = true; holdAt = current(); peekY = window.pageYOffset; apply(i);
    }

    /* ---- Inline figures ---- */
    var figs = null, snaps = [], queue = [], busy = false, docked = -1, pendingDock = null, io = null, boxes = {};
    var hasLive = !!stage.querySelector('.rc-bar > :not(.rc-reset):not(.rc-where)');
    function anchorFor(m) {
      var slot = body.querySelector('.rc-slot[data-for="' + m.id + '"]'); if (slot) return slot;
      var heading = null;
      for (var el = m.nextElementSibling; el && !el.classList.contains('rc-mark'); el = el.nextElementSibling) {
        if (el.tagName === 'P') return el;
        if (!heading && /^H[2-4]$/.test(el.tagName)) heading = el;
      }
      return heading || m;
    }
    function figView(i, W) { var m = marks[i], vn = m.getAttribute('data-view'); return (W < narrowAt && views[vn + '_n']) || views[vn] || views[m.getAttribute('data-panel')] || whole; }
    /* A figure is as tall as its view at full width, within limits; a step drawn by an HTML widget (the family tree) keeps the live view's height. */
    function figHeight(v, W, minH) { return Math.round(Math.max(W * 0.5, minH || 0, Math.min(W * v[3] / v[2], W * 1.25, window.innerHeight * 0.75))); }
    /* The board map: every panel as a small box; done panels filled, the current one bright, later ones dashed. */
    function boardMap(i) {
      var m = document.createElementNS(SVGNS, 'svg'), seen = {}, now = marks[i].getAttribute('data-panel');
      for (var j = 0; j < i; j++) seen[marks[j].getAttribute('data-panel')] = true;
      m.setAttribute('class', 'rc-map'); m.setAttribute('viewBox', vbStr(whole)); m.setAttribute('aria-hidden', 'true');
      Object.keys(boxes).forEach(function (p) {
        var b = boxes[p], r = document.createElementNS(SVGNS, 'rect');
        r.setAttribute('x', b[0]); r.setAttribute('y', b[1]); r.setAttribute('width', b[2]); r.setAttribute('height', b[3]); r.setAttribute('rx', 14);
        r.setAttribute('class', p === now ? 'is-now' : seen[p] ? 'is-done' : 'is-next');
        m.appendChild(r);
      });
      return m;
    }
    function buildFigures() {
      panels.forEach(function (g) { var b = g.getBBox(); if (b.width > 1 && b.height > 1) boxes[g.getAttribute('data-panel')] = [b.x, b.y, b.width, b.height]; });
      figs = marks.map(function (m, i) {
        var fig = document.createElement('figure'), cap = document.createElement('figcaption'), box = document.createElement('div'), t = document.createElement('span');
        fig.className = 'rc-fig'; fig.setAttribute('data-step', String(i));
        cap.className = 'rc-fig-cap';
        t.className = 'rc-fig-title'; t.textContent = label(i); cap.appendChild(t);
        if (Object.keys(boxes).length > 1) cap.appendChild(boardMap(i));
        box.className = 'rc-view rc-fig-view'; fig.appendChild(cap); fig.appendChild(box);
        var a = anchorFor(m); a.parentNode.insertBefore(fig, a.nextSibling);
        return { el: fig, cap: cap, box: box, near: false, filled: false };
      });
      sizeFigures();
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; var i = +e.target.getAttribute('data-step'); figs[i].near = true;
          if (snaps[i]) fill(i); else { queue = [i].concat(queue.filter(function (q) { return q !== i; })); runQueue(); }
        });
      }, { rootMargin: '150% 0px' });
      figs.forEach(function (f) { io.observe(f.el); });
    }
    function sizeFigure(i, W) {
      var f = figs[i], v = figView(i, W), H = figHeight(v, W, snaps[i] && snaps[i].minH); f.box.style.height = H + 'px';
      var s = f.box.querySelector('svg.rc-svg'); if (s) s.setAttribute('viewBox', vbStr(fit(v, W, H)));
    }
    function sizeFigures() { if (figs) { var W = Math.max(1, figs[0].el.clientWidth); figs.forEach(function (f, i) { sizeFigure(i, W); }); } }
    /* Snapshots come from the live board, one step at a time: set the step, let the widget scripts redraw for two frames, then copy. */
    function runQueue() {
      if (busy || !queue.length || docked >= 0) return; busy = true;
      var i = queue.shift(); setState(i);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        snaps[i] = snapshot(i); busy = false; fill(i);
        if (queue.length) runQueue(); else if (pendingDock) { var p = pendingDock; pendingDock = null; dock(p[0], p[1]); }
      }); });
    }
    function snapshot(i) {
      var c = view.cloneNode(true), s = c.querySelector('svg.rc-svg');
      s.removeAttribute('style');
      /* Boards that hide the other panels in a close-up do not need to carry them. */
      if (rc.classList.contains('rls-canvas')) [].forEach.call(s.querySelectorAll('.rc-panel:not(.is-active)'), function (g) { g.parentNode.removeChild(g); });
      uniqueIds(c, '--f' + i);
      [].forEach.call(c.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'), function (el) { el.setAttribute('tabindex', '-1'); });
      if (i !== 0) c.setAttribute('aria-hidden', 'true'); /* the board's own title and description are read once, on the first figure */
      var overlay = [].some.call(view.children, function (el) { return !/^svg$/i.test(el.tagName) && getComputedStyle(el).display !== 'none'; });
      return { node: c, minH: overlay ? view.clientHeight : 0, zoomed: stage.classList.contains('is-zoomed'), panel: stage.getAttribute('data-active-panel'), view: stage.getAttribute('data-active-view'),
        live: hasLive && [].some.call(stage.querySelectorAll('.rc-bar > :not(.rc-reset):not(.rc-where)'), function (el) { return getComputedStyle(el).display !== 'none'; }) };
    }
    function fill(i) {
      var f = figs[i], sn = snaps[i]; if (!f.near || f.filled || !sn) return;
      f.filled = true; f.el.classList.toggle('is-zoomed', sn.zoomed); f.el.setAttribute('data-active-panel', sn.panel); f.el.setAttribute('data-active-view', sn.view);
      var c = sn.node; c.className = f.box.className;
      f.box.parentNode.replaceChild(c, f.box); f.box = c; sizeFigure(i, Math.max(1, f.el.clientWidth));
      if (sn.live) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'rc-fig-live'; b.textContent = 'Controls';
        b.setAttribute('aria-label', 'Open the interactive board here: ' + label(i));
        b.addEventListener('click', function () { if (docked === i) undock(); else dock(i, false); });
        f.cap.appendChild(b);
      }
      f.el.classList.add('is-ready');
    }
    /* Docking moves the live board, with its controls, into one figure; the figure's snapshot hides meanwhile. */
    function dock(i, reveal) {
      if (busy || queue.length) { pendingDock = [i, reveal]; return; }
      if (docked >= 0) undock();
      var f = figs[i]; docked = i; f.near = true; fill(i);
      f.el.classList.add('is-docked'); f.el.appendChild(stage);
      var b = f.cap.querySelector('.rc-fig-live'); if (b) b.textContent = 'Close';
      apply(i, true); frameDocked();
      if (reveal) f.el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'nearest' });
    }
    function undock() {
      if (docked < 0) return; var f = figs[docked]; docked = -1;
      f.el.classList.remove('is-docked'); rc.insertBefore(stage, home);
      var b = f.cap.querySelector('.rc-fig-live'); if (b) b.textContent = 'Controls';
      svg.removeAttribute('style'); view.style.height = ''; runQueue();
    }
    function frameDocked() {
      var f = figs[docked], W = f.box.clientWidth || f.el.clientWidth, v = figView(docked, W), H = figHeight(v, W, snaps[docked] && snaps[docked].minH);
      view.style.height = H + 'px'; svg.removeAttribute('style'); svg.setAttribute('viewBox', vbStr(fit(v, W, H)));
    }

    function setMode() {
      var m = WIDE.matches ? 'wide' : 'inline'; if (m === mode) return; mode = m;
      rc.classList.toggle('rc-inline', m === 'inline'); rc.setAttribute('data-mode', m);
      if (m === 'inline') {
        hold = false; svg.removeAttribute('style'); view.style.height = '';
        if (!figs) { buildFigures(); queue = queue.concat(marks.map(function (x, i) { return i; }).filter(function (i) { return !snaps[i] && queue.indexOf(i) < 0; })); runQueue(); }
        else sizeFigures();
      } else {
        undock(); view.style.height = ''; pendingDock = null;
        layoutBoard(); apply(current(), true);
      }
      setTop();
    }
    reset.addEventListener('click', function () { hold = true; holdAt = current(); peekY = null; apply(-1); });
    sel.addEventListener('change', function () { go(parseInt(sel.value, 10)); });
    prev.addEventListener('click', function () { go(Math.max(-1, (hold ? holdAt : idx) - 1)); });
    next.addEventListener('click', function () { go(Math.min(marks.length - 1, (hold ? holdAt : idx) + 1)); });
    [].forEach.call(document.querySelectorAll('a[data-go]'), function (a) {
      a.addEventListener('click', function (e) { var n = a.getAttribute('data-go'), i = marks.findIndex(function (m) { return m.id === n; }); if (i >= 0) { e.preventDefault(); go(i); } });
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      setMode(); setTop();
      if (mode === 'wide') {
        layoutBoard(); apply(idx, true);
        if (idx >= 0 && !hold) marks[idx].scrollIntoView({ behavior: 'auto', block: 'start' });
      } else if (window.innerWidth !== lastW) { sizeFigures(); if (docked >= 0) frameDocked(); }
      lastW = window.innerWidth;
    });
    onChange(WIDE, setMode);
    setMode();
    window.RC = {
      state: function () { return { index: idx, panel: rc.getAttribute('data-active-panel'), view: rc.getAttribute('data-active-view'), viewBox: rc.getAttribute('data-viewbox'), mode: mode, docked: docked }; },
      go: go, peek: peek, line: line
    };
  }
  function boot() { [].forEach.call(document.querySelectorAll('.rc'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
