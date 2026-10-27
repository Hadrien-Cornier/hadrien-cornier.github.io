import {startArticle} from '/assets/robotics/rebuild/article-runtime.js';
await startArticle([]);
(() => {
  function init() {
    const root = document.getElementById('rc');
    if (!root || root.hasAttribute('data-ph-ready')) return;
    const svg = root.querySelector('svg.rc-svg');
    const viewport = root.querySelector('.rc-view');
    const controls = root.querySelector('.ph-board-controls');
    const reset = root.querySelector('.rc-reset');
    const follow = root.querySelector('.ph-follow');
    const plus = root.querySelector('.ph-zoom-in');
    const minus = root.querySelector('.ph-zoom-out');
    const where = root.querySelector('.rc-where');
    if (!svg || !viewport || !controls || !reset || !follow || !plus || !minus || !where) return;
    const valid = a => Array.isArray(a) && a.length === 4 && a.every(n => typeof n === 'number' && Number.isFinite(n)) && a[2] > 0 && a[3] > 0;
    let whole, views;
    try {
      whole = JSON.parse(root.getAttribute('data-whole'));
      views = JSON.parse(root.getAttribute('data-views'));
      if (!valid(whole) || !views || typeof views !== 'object' || Array.isArray(views) || !Object.values(views).every(valid)) return;
    } catch (_) { return; }
    const marks = Array.from(root.querySelectorAll('.rc-body .rc-mark')).filter(m => Object.prototype.hasOwnProperty.call(views, m.dataset.view) && Array.from(svg.querySelectorAll('.rc-panel')).some(p => p.dataset.panel === m.dataset.panel));
    if (!marks.length) return;
    const rawMax = Number(root.dataset.figMax);
    const maxZoom = Number.isFinite(rawMax) && rawMax >= 1 ? rawMax : 2.8;
    let active = marks[0], base = views[active.dataset.view].slice();
    let box = base.slice(), zoom = 1, overview = false, frame = 0, drag = null;
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    function draw() {
      if (!overview) {
        box[0] = clamp(box[0], base[0], base[0] + base[2] - box[2]);
        box[1] = clamp(box[1], base[1], base[1] + base[3] - box[3]);
      }
      svg.setAttribute('viewBox', box.join(' '));
      where.textContent = overview ? 'Whole board · scroll to explore' : active.dataset.title + ' · ' + Math.round(zoom * 100) + '%';
      plus.disabled = overview || zoom >= maxZoom;
      minus.disabled = overview || zoom <= 1;
      reset.setAttribute('aria-pressed', String(overview));
    }
    function releaseDrag() {
      if (!drag) return;
      if (svg.hasPointerCapture(drag.id)) svg.releasePointerCapture(drag.id);
      drag = null;
    }
    function select(mark) {
      releaseDrag();
      active = mark;
      base = views[mark.dataset.view].slice();
      box = base.slice();
      zoom = 1;
      overview = false;
      root.removeAttribute('data-ph-whole');
      viewport.style.aspectRatio = base[2] + ' / ' + base[3];
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      draw();
    }
    function readingMark() {
      let next = marks[0];
      const line = window.innerHeight * 0.35;
      for (const mark of marks) {
        if (mark.getBoundingClientRect().top <= line) next = mark;
        else break;
      }
      return next;
    }
    function schedule() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const next = readingMark();
        if (!overview && next !== active) select(next);
      });
    }
    function changeZoom(factor) {
      if (overview) return;
      releaseDrag();
      const cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
      zoom = clamp(zoom * factor, 1, maxZoom);
      const width = base[2] / zoom, height = base[3] / zoom;
      box = [cx - width / 2, cy - height / 2, width, height];
      draw();
    }
    function showWhole() {
      releaseDrag();
      overview = true;
      root.setAttribute('data-ph-whole', '');
      box = whole.slice();
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      draw();
    }
    plus.addEventListener('click', () => changeZoom(1.2));
    minus.addEventListener('click', () => changeZoom(1 / 1.2));
    reset.addEventListener('click', () => overview ? select(readingMark()) : showWhole());
    follow.addEventListener('click', () => select(readingMark()));
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-keyshortcuts', '+ - ArrowLeft ArrowRight ArrowUp ArrowDown Home Escape');
    svg.addEventListener('keydown', event => {
      if (event.key === '+' || event.key === '=') changeZoom(1.2);
      else if (event.key === '-') changeZoom(1 / 1.2);
      else if (event.key === 'Home') showWhole();
      else if (event.key === 'Escape') select(readingMark());
      else if (!overview && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        if (event.key === 'ArrowLeft') box[0] -= box[2] * 0.1;
        if (event.key === 'ArrowRight') box[0] += box[2] * 0.1;
        if (event.key === 'ArrowUp') box[1] -= box[3] * 0.1;
        if (event.key === 'ArrowDown') box[1] += box[3] * 0.1;
        draw();
      } else return;
      event.preventDefault();
    });
    svg.addEventListener('pointerdown', event => {
      if (overview || zoom <= 1 || event.button !== 0 || !event.isPrimary) return;
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      let inverse;
      try { inverse = matrix.inverse(); } catch (_) { return; }
      const point = svg.createSVGPoint();
      point.x = event.clientX; point.y = event.clientY;
      const start = point.matrixTransform(inverse);
      if (!Number.isFinite(start.x) || !Number.isFinite(start.y)) return;
      drag = {id:event.pointerId, inverse, start, box:box.slice()};
      svg.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    svg.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX; point.y = event.clientY;
      const current = point.matrixTransform(drag.inverse);
      if (!Number.isFinite(current.x) || !Number.isFinite(current.y)) return;
      box = [drag.box[0] - current.x + drag.start.x, drag.box[1] - current.y + drag.start.y, drag.box[2], drag.box[3]];
      draw();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) svg.addEventListener(name, event => { if (drag && drag.id === event.pointerId) releaseDrag(); });
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule, {passive:true});
    root.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', schedule));
    root.querySelectorAll('img,video').forEach(media => {
      media.addEventListener('load', schedule);
      media.addEventListener('loadedmetadata', schedule);
    });
    root.setAttribute('data-ph-ready', '');
    controls.hidden = false;
    select(readingMark());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
