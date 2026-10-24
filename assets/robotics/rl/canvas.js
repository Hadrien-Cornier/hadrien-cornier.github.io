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
  var printing = window.matchMedia('print');
  /* Widget scripts load after this one and draw on DOMContentLoaded; snapshots wait for it. */
  var domReady = document.readyState === 'complete', whenReady = [];
  function ready() { if (domReady) return; domReady = true; whenReady.forEach(function (f) { f(); }); }
  document.addEventListener('DOMContentLoaded', ready); window.addEventListener('load', ready);
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
    var figMax = +svg.getAttribute('data-fig-max') || 0; /* optional: inline figures keep the shape of a tall view up to this height-to-width ratio */
    var marks = [].slice.call(rc.querySelectorAll('.rc-mark')), where = stage.querySelector('.rc-where');
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
      var m = marks[i], vn = m.getAttribute('data-view'), key = vn || m.getAttribute('data-panel');
      return (W < narrowAt && views[key + '_n']) || (W / H < 1 && views[vn + '_p']) || views[vn] || views[key] || whole;
    }
    /* Step state: the active panel and the attributes that CSS and the widget scripts read. */
    function setState(i) {
      idx = i; sel.value = String(i);
      var panel = i >= 0 ? marks[i].getAttribute('data-panel') : null, vn = i >= 0 ? marks[i].getAttribute('data-view') : 'whole';
      panels.forEach(function (g) { g.classList.toggle('is-active', g.getAttribute('data-panel') === panel); });
      [rc, stage].forEach(function (el) { el.classList.toggle('is-zoomed', panel !== null); el.setAttribute('data-active-panel', panel || 'whole'); el.setAttribute('data-active-view', vn); });
      rc.setAttribute('data-active-index', String(i));
      if (docked >= 0) figState(figs[docked], { zoomed: panel !== null, panel: panel || 'whole', view: vn });
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
    /* A mark inside a closed <details> drawer has no box; the reader has not opened that step, so it does not count. */
    function current() { var lim = line(), k = -1; for (var i = 0; i < marks.length; i++) { if (marks[i].getClientRects().length && marks[i].getBoundingClientRect().top <= lim) k = i; } return k; }
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
      /* A step in a closed drawer opens the drawer first, so the text can scroll to it. */
      for (var d = i >= 0 ? marks[i].closest('details') : null; d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
      if (mode !== 'wide') { if (i >= 0) marks[i].scrollIntoView({ behavior: smooth, block: 'start' }); return; }
      hold = false; peekY = null; apply(i, false);
      if (i >= 0) marks[i].scrollIntoView({ behavior: smooth, block: 'start' });
      else window.scrollTo({ top: rc.getBoundingClientRect().top + window.pageYOffset - 8, behavior: smooth });
    }
    /* Show another section's view without scrolling the text; it holds until the reader scrolls about 60 px or reaches another section.
       Inline, the live board opens with that view in the figure of the reader's own section (the section that holds `from`,
       the element that asked), and closing it returns the reader to `from`. */
    function peek(id, from) {
      var i = marks.findIndex(function (m) { return m.id === id; }); if (i < 0) return;
      if (mode !== 'wide') { var k = from ? sectionOf(from) : -1; dock(k >= 0 ? k : i, true, i, from); return; }
      hold = true; holdAt = current(); peekY = window.pageYOffset; apply(i);
    }
    function sectionOf(el) { var k = -1; marks.forEach(function (m, j) { if (m.compareDocumentPosition(el) & 4) k = j; }); return k; }

    /* ---- Inline figures ---- */
    var figs = null, snaps = [], pre = [], queue = [], inflight = -1, docked = -1, back = null, io = null, boxes = {}, resnapT = 0;
    var hasLive = !!stage.querySelector('.rc-bar > :not(.rc-where)');
    /* Widgets (bar controls, HTML drawn over the board) redraw the live board for each step. A board without them is a plain
       drawing: on narrow screens its live copy stays hidden with display: none, so setting a step there costs no layout. */
    var widgets = hasLive || [].some.call(view.children, function (el) { return !/^svg$/i.test(el.tagName); });
    function anchorFor(m) {
      var slot = body.querySelector('.rc-slot[data-for="' + m.id + '"]'); if (slot) return slot;
      var heading = null;
      for (var el = m.nextElementSibling; el && !el.classList.contains('rc-mark'); el = el.nextElementSibling) {
        if (el.tagName === 'P') return el;
        if (!heading && /^H[2-4]$/.test(el.tagName)) heading = el;
      }
      return heading || m;
    }
    /* Inline copies use the complete stacked view of a split panel; the pinned desktop uses its wide view. */
    function figView(i, W) { var m = marks[i], vn = m.getAttribute('data-view'), key = vn || m.getAttribute('data-panel'); return views[key + '_n'] || views[vn] || views[key] || whole; }
    /* A figure is as tall as its view at full width, within limits, and at most three quarters of the screen;
       a step drawn by an HTML widget (the family tree) keeps the live view's height. */
    function figHeight(v, W, minH) {
      /* A board of tall plots keeps each view at full width, even past the screen, so its text stays readable. */
      if (figMax) return Math.round(Math.max(W * 0.5, Math.min(W * v[3] / v[2], W * figMax), minH || 0));
      return Math.round(Math.max(Math.min(Math.max(W * 0.5, Math.min(W * v[3] / v[2], W * 1.25)), window.innerHeight * 0.75), minH || 0));
    }
    function minFor(i) { var sn = snaps[i] || figs[i].shown; return sn ? sn.minH : pre[i] || 0; }
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
      /* A step drawn by HTML over the board has no panel of its own; reserve the live view's height for it now, so its figure
         does not grow when it fills and move the text below. */
      var was = idx;
      marks.forEach(function (m, i) { var p = m.getAttribute('data-panel'); if (p && !svg.querySelector('.rc-panel[data-panel="' + p + '"]')) { setState(i); pre[i] = view.clientHeight; } });
      if (idx !== was) setState(was);
      figs = marks.map(function (m, i) {
        var fig = document.createElement('figure'), cap = document.createElement('figcaption'), box = document.createElement('div'), t = document.createElement('span');
        fig.className = 'rc-fig'; fig.setAttribute('data-step', String(i));
        cap.className = 'rc-fig-cap';
        t.className = 'rc-fig-title'; t.textContent = label(i); cap.appendChild(t);
        if (Object.keys(boxes).length > 1 && boxes[m.getAttribute('data-panel')]) cap.appendChild(boardMap(i));
        box.className = 'rc-view rc-fig-view'; fig.appendChild(cap); fig.appendChild(box);
        var a = anchorFor(m); a.parentNode.insertBefore(fig, a.nextSibling);
        /* A tap on a snapshot that has controls opens the live board there. */
        fig.addEventListener('click', function (e) { if (docked !== i && fig.classList.contains('is-live') && !e.target.closest('.rc-fig-cap, .rc-stage')) dock(i, false); });
        return { el: fig, cap: cap, box: box, near: false, shown: null };
      });
      /* The snapshots are hidden from screen readers; the first caption carries the board's own title and description once. */
      var said = [].filter.call(svg.children, function (n) { return /^(title|desc)$/i.test(n.tagName); }).map(function (n) { return n.textContent.trim(); }).join('. ');
      if (figs.length && said) { var sr = document.createElement('span'); sr.className = 'rc-sr'; sr.textContent = said; figs[0].cap.appendChild(sr); }
      sizeFigures();
      if (!window.IntersectionObserver) { figs.forEach(function (f) { f.near = true; }); want(figs.map(function (f, i) { return i; })); return; }
      /* Lazy: a figure is copied and drawn only when it comes within two screens of the viewport, nearest the middle first. */
      io = new IntersectionObserver(function (es) {
        var mid = window.innerHeight / 2, add = [];
        es.forEach(function (e) {
          var i = +e.target.getAttribute('data-step'), r = e.boundingClientRect; figs[i].near = e.isIntersecting;
          if (!e.isIntersecting) return;
          if (snaps[i]) fill(i); else add.push({ i: i, d: Math.abs(r.top + r.height / 2 - mid) });
        });
        want(add.sort(function (x, y) { return x.d - y.d; }).map(function (x) { return x.i; }));
      }, { rootMargin: '200% 0px' });
      figs.forEach(function (f) { io.observe(f.el); });
    }
    /* Put these steps, in order, at the front of the queue. */
    function want(list) {
      list = list.filter(function (i) { return !snaps[i] && inflight !== i; });
      queue = list.concat(queue.filter(function (q) { return list.indexOf(q) < 0; })); runQueue();
    }
    function sizeFigure(i, W) {
      var f = figs[i], v = figView(i, W), H = figHeight(v, W, minFor(i)); f.box.style.height = H + 'px';
      var s = f.box.querySelector('svg.rc-svg'); if (s) s.setAttribute('viewBox', vbStr(fit(v, W, H)));
    }
    function sizeFigures() { if (figs) { var W = Math.max(1, figs[0].el.clientWidth); figs.forEach(function (f, i) { sizeFigure(i, W); }); } }
    /* Snapshots come from the live board, one step at a time and at most one per frame: set the step, then copy it.
       With widgets, the copy waits two frames so they redraw first; the queue starts after DOMContentLoaded, so the widget
       scripts that load after this one have drawn. */
    function nextFrame(f) { requestAnimationFrame(widgets ? function () { requestAnimationFrame(f); } : f); }
    function runQueue() {
      if (inflight >= 0 || !queue.length || docked >= 0 || mode !== 'inline' || !domReady) return;
      var i = inflight = queue.shift(); setState(i);
      nextFrame(function () {
        inflight = -1;
        /* A mode switch or a dock in between changed the board: copy this step later. */
        if (mode !== 'inline' || docked >= 0 || idx !== i) { queue.unshift(i); runQueue(); return; }
        snaps[i] = snapshot(i); fill(i); runQueue();
      });
    }
    /* The width changed: widgets may draw differently (qmap switches below 560 px), so copy the near figures again. */
    function resnap() {
      if (!figs) return; snaps = []; queue = [];
      var mid = window.innerHeight / 2, d = function (i) { var r = figs[i].el.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - mid); };
      want(figs.map(function (f, i) { return i; }).filter(function (i) { return figs[i].near; }).sort(function (x, y) { return d(x) - d(y); }));
    }
    function snapshot(i) {
      var c = view.cloneNode(true), s = c.querySelector('svg.rc-svg');
      s.removeAttribute('style');
      /* Boards that hide the other panels in a close-up do not need to carry them. */
      if (rc.classList.contains('rls-canvas')) [].forEach.call(s.querySelectorAll('.rc-panel:not(.is-active)'), function (g) { g.parentNode.removeChild(g); });
      uniqueIds(c, '--f' + i);
      /* A copy looks like the board but does nothing: no focus, no taps, nothing for screen readers. */
      [].forEach.call(c.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'), function (el) { el.setAttribute('tabindex', '-1'); });
      c.setAttribute('aria-hidden', 'true'); c.setAttribute('inert', '');
      var overlay = [].some.call(view.children, function (el) { return !/^svg$/i.test(el.tagName) && getComputedStyle(el).display !== 'none'; });
      return { node: c, minH: overlay ? view.clientHeight : 0, zoomed: stage.classList.contains('is-zoomed'), panel: stage.getAttribute('data-active-panel'), view: stage.getAttribute('data-active-view'),
        live: hasLive && [].some.call(stage.querySelectorAll('.rc-bar > :not(.rc-where)'), function (el) { return getComputedStyle(el).display !== 'none'; }) };
    }
    function fill(i) {
      var f = figs[i], sn = snaps[i]; if (!f.near || !sn || f.shown === sn) return;
      f.shown = sn; if (docked !== i) figState(f, sn);
      var c = sn.node; c.className = 'rc-view rc-fig-view';
      f.box.parentNode.replaceChild(c, f.box); f.box = c; sizeFigure(i, Math.max(1, f.el.clientWidth));
      f.el.classList.toggle('is-live', sn.live); if (sn.live) liveButton(i);
      f.el.classList.add('is-ready');
    }
    /* A figure carries its snapshot's step state for the CSS; while the live board is docked inside, it carries the board's state. */
    function figState(f, sn) {
      f.el.classList.toggle('is-zoomed', !!sn && sn.zoomed);
      ['panel', 'view'].forEach(function (k) { if (sn) f.el.setAttribute('data-active-' + k, sn[k]); else f.el.removeAttribute('data-active-' + k); });
    }
    function liveButton(i) {
      var cap = figs[i].cap, b = cap.querySelector('.rc-fig-live'); if (b) return b;
      b = document.createElement('button'); b.type = 'button'; b.className = 'rc-fig-live';
      b.addEventListener('click', function () { if (docked === i) undock(); else dock(i, false); });
      cap.appendChild(b); liveLabel(i, false); return b;
    }
    /* The visible text starts the accessible name, and aria-expanded tells whether the board is open here. */
    function liveLabel(i, open) {
      var b = figs[i].cap.querySelector('.rc-fig-live'); if (!b) return;
      b.textContent = open ? 'Close' : 'Controls'; b.setAttribute('aria-expanded', String(open));
      b.setAttribute('aria-label', (open ? 'Close the controls for ' : 'Controls for ') + label(i));
    }
    /* Docking moves the live board, with its controls, into figure i, showing step `show` (i by default); the figure's
       snapshot hides meanwhile. A snapshot in progress notices the change and is copied again after the board leaves.
       On leaving, the board returns to the whole view for a frame, so the widgets reset to each step's default before the next copy. */
    function dock(i, reveal, show, from) {
      if (!figs) return;
      undock(true);
      var f = figs[i], b; docked = i; back = from || null;
      f.el.classList.add('is-docked'); f.el.appendChild(stage); b = liveButton(i); liveLabel(i, true);
      apply(show >= 0 ? show : i, true);
      if (reveal) { f.el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'nearest' }); b.focus({ preventScroll: true }); }
    }
    function undock(stay) {
      if (docked < 0) return; var i = docked, f = figs[i], from = back; docked = -1; back = null;
      f.el.classList.remove('is-docked'); figState(f, f.shown); rc.insertBefore(stage, home);
      if (f.shown && f.shown.live) liveLabel(i, false); else { var b = f.cap.querySelector('.rc-fig-live'); if (b) b.parentNode.removeChild(b); }
      svg.removeAttribute('style'); view.style.height = '';
      if (stay) return;
      setState(-1); requestAnimationFrame(runQueue);
      /* A board opened from a button in the text returns the reader to that button. */
      if (from && document.contains(from)) { from.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' }); from.focus({ preventScroll: true }); }
    }
    function frameDocked() {
      var f = figs[docked], i = idx >= 0 ? idx : docked, W = f.box.clientWidth || f.el.clientWidth, v = figView(i, W), H = figHeight(v, W, minFor(i));
      view.style.height = H + 'px'; svg.removeAttribute('style'); svg.setAttribute('viewBox', vbStr(fit(v, W, H)));
    }

    /* Keep the reader's place when the width changes. The place is the text block at the reading line (30% down the
       screen): it returns to the same height, and a block that starts above the top keeps the same share above it.
       On a figure, the place is the end of the text the figure follows, because the other layout has no figure there.
       Past the canvas, the end of the canvas stays put. The place is read when scrolling stops and moved with each scroll
       in between, because the text reflows before the resize event. */
    var spot = null, spotY = 0, spotT = 0;
    function readingSpot() {
      var r = rc.getBoundingClientRect(), at = window.innerHeight * 0.3, text = null;
      spotY = window.pageYOffset;
      if (r.top >= window.innerHeight) return null;
      if (r.bottom <= at) return { el: rc, y: r.bottom, edge: 'bottom' };
      for (var el = body.firstElementChild; el; el = el.nextElementSibling) {
        if (el.classList.contains('rc-nav') || el.classList.contains('rc-mark')) continue;
        r = el.getBoundingClientRect(); if (!r.height) continue;
        var isFig = el.classList.contains('rc-fig');
        if (r.bottom > at) {
          if (!isFig) return { el: el, y: r.top, h: r.height, edge: 'top' };
          if (text) return { el: text, y: text.getBoundingClientRect().bottom, edge: 'bottom' };
        }
        if (!isFig) text = el;
      }
      return { el: rc, y: rc.getBoundingClientRect().bottom, edge: 'bottom' };
    }
    /* The site scrolls smoothly by default; a correction of the place must not show. */
    function jump(f) { var html = document.documentElement, sb = html.style.scrollBehavior; html.style.scrollBehavior = 'auto'; f(); html.style.scrollBehavior = sb; }
    function keepSpot() {
      if (!spot) return;
      var r = spot.el.getBoundingClientRect(), now = spot.edge === 'bottom' ? r.bottom : r.top;
      var want = spot.edge === 'top' && spot.y < 0 && spot.y + spot.h > 0 ? spot.y * r.height / spot.h : spot.y;
      if (Math.abs(now - want) >= 1) jump(function () { window.scrollTo(window.pageXOffset, window.pageYOffset + now - want); });
      spot = readingSpot();
    }
    /* At load, a link into the canvas scrolls the page to its target, but the figures that go in above the target push it
       down; once they are in, the page goes to the target again. */
    function linkTarget() {
      var t = null; try { t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
      return t && rc.contains(t) ? t : null;
    }
    function setMode() {
      if (printing.matches) return;
      var m = WIDE.matches ? 'wide' : 'inline'; if (m === mode) return;
      var target = !mode && m === 'inline' ? linkTarget() : null;
      mode = m;
      rc.classList.toggle('rc-inline', m === 'inline'); rc.setAttribute('data-mode', m);
      if (m === 'inline') {
        hold = false; svg.removeAttribute('style'); view.style.height = '';
        if (!figs) { buildFigures(); rc.classList.toggle('rc-static', !widgets); } else { sizeFigures(); resnap(); }
      } else { undock(true); view.style.height = ''; layoutBoard(); }
      setTop();
      if (target) { jump(function () { target.scrollIntoView({ block: 'start' }); }); spot = readingSpot(); } else keepSpot();
      if (m === 'wide') apply(current(), true); else runQueue();
    }
    sel.addEventListener('change', function () { go(parseInt(sel.value, 10)); });
    prev.addEventListener('click', function () { go(Math.max(-1, (hold ? holdAt : idx) - 1)); });
    next.addEventListener('click', function () { go(Math.min(marks.length - 1, (hold ? holdAt : idx) + 1)); });
    [].forEach.call(document.querySelectorAll('a[data-go]'), function (a) {
      a.addEventListener('click', function (e) { var n = a.getAttribute('data-go'), i = marks.findIndex(function (m) { return m.id === n; }); if (i >= 0) { e.preventDefault(); go(i); } });
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    /* A scroll that comes with a new width, before the resize event, is the reflow and not the reader: it does not move the place. */
    var lastW = window.innerWidth;
    window.addEventListener('scroll', function () {
      if (window.innerWidth !== lastW) return;
      var y = window.pageYOffset; if (spot) spot.y -= y - spotY; spotY = y;
      clearTimeout(spotT); spotT = setTimeout(function () { if (window.innerWidth === lastW) spot = readingSpot(); }, 150);
    }, { passive: true });
    window.addEventListener('resize', function () {
      var was = mode, widthChanged = window.innerWidth !== lastW; lastW = window.innerWidth;
      setMode(); if (mode !== was) return;
      setTop();
      /* A change of height alone (a phone's address bar) does not reflow the text, so the place stays as it is. */
      if (mode === 'wide') { layoutBoard(); if (widthChanged) keepSpot(); apply(hold ? idx : current(), true); }
      else if (widthChanged) {
        sizeFigures(); if (docked >= 0) frameDocked(); keepSpot();
        clearTimeout(resnapT); resnapT = setTimeout(resnap, 250);
      }
    });
    /* Print: on a wide screen, the current view without the screen camera; inline, every figure of a plain drawing. */
    window.addEventListener('beforeprint', function () {
      if (mode === 'wide') { var s = size(); svg.removeAttribute('style'); svg.style.transition = 'none'; svg.setAttribute('viewBox', vbStr(fit(viewFor(idx, s[0], s[1]), s[0], s[1]))); }
      else if (figs && !widgets) figs.forEach(function (f, i) { if (!snaps[i]) { setState(i); snaps[i] = snapshot(i); } f.near = true; fill(i); });
    });
    window.addEventListener('afterprint', function () { if (mode === 'wide') { layoutBoard(); apply(idx, true); } });
    onChange(WIDE, setMode);
    whenReady.push(runQueue);
    window.addEventListener('load', function () { spot = readingSpot(); });
    setMode();
    window.RC = {
      state: function () { return { index: idx, panel: rc.getAttribute('data-active-panel'), view: rc.getAttribute('data-active-view'), viewBox: rc.getAttribute('data-viewbox'), mode: mode, docked: docked }; },
      go: go, peek: peek, line: line
    };
  }
  function boot() { [].forEach.call(document.querySelectorAll('.rc'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
