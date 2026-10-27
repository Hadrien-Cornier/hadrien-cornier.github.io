import {startArticle} from '/assets/robotics/rebuild/article-runtime.js';
await startArticle([]);
(function () {
  function init() {
    document.querySelectorAll('figure.short-board[data-views]').forEach(function (fig) {
      if (fig.hasAttribute('data-zoom-ready')) return;
      var viewport = fig.querySelector('.short-board-viewport');
      var svg = fig.querySelector('svg.rc-svg');
      if (!viewport || !svg) return;
      var views, titles, whole;
      function validBox(box) {
        return Array.isArray(box) && box.length === 4 && box.every(function (n) { return typeof n === 'number' && isFinite(n); }) && box[2] > 0 && box[3] > 0;
      }
      try {
        views = JSON.parse(fig.getAttribute('data-views'));
        titles = JSON.parse(fig.getAttribute('data-titles') || '{}');
        whole = JSON.parse(fig.getAttribute('data-whole'));
        if (!views || !validBox(whole) || !Object.keys(views).every(function (key) { return validBox(views[key]); })) return;
      } catch (e) { return; }
      fig.setAttribute('data-zoom-ready', 'true');
      var selected = 'whole';
      var zoom = 1;
      var sectionButtons = [];
      var bar = document.createElement('div');
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Board sections and magnification');
      bar.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 8px';
      var status = document.createElement('p');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      status.style.cssText = 'margin:6px 0 10px;font-size:14px';
      function button(label, action) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.style.cssText = 'font:inherit;font-size:14px;min-height:44px;padding:6px 10px;border:1px solid #5d6b65;border-radius:6px;background:#1e2925;color:#ece8dc;cursor:pointer';
        b.addEventListener('click', action);
        bar.appendChild(b);
        return b;
      }
      function sizeBoard() {
        var box = selected === 'whole' ? whole : views[selected];
        var width = Math.max(660, viewport.clientWidth) * zoom;
        svg.style.width = width + 'px';
        svg.style.minWidth = '0';
        svg.style.maxWidth = 'none';
        svg.style.height = (width * box[3] / box[2]) + 'px';
        viewport.style.maxHeight = selected === 'whole' && zoom === 1 ? 'none' : '75vh';
      }
      function render(resetScroll) {
        var box = selected === 'whole' ? whole : views[selected];
        svg.setAttribute('viewBox', box.join(' '));
        sizeBoard();
        sectionButtons.forEach(function (entry) {
          var active = entry.key === selected;
          entry.button.setAttribute('aria-pressed', active ? 'true' : 'false');
          entry.button.style.borderColor = active ? '#ece8dc' : '#5d6b65';
          entry.button.style.fontWeight = active ? '700' : '400';
        });
        zoomOut.disabled = zoom <= 1;
        zoomIn.disabled = zoom >= 2;
        zoomOut.style.opacity = zoomOut.disabled ? '.5' : '1';
        zoomIn.style.opacity = zoomIn.disabled ? '.5' : '1';
        status.textContent = 'Showing ' + (selected === 'whole' ? 'the whole board' : titles[selected] || selected) + ' at ' + Math.round(zoom * 100) + '%. Scroll the board to read all labels. Whole board or Escape resets the view.';
        if (resetScroll) {
          viewport.scrollLeft = 0;
          viewport.scrollTop = 0;
        }
      }
      function addSection(key, label) {
        var b = button(label, function () {
          selected = key;
          if (key === 'whole') zoom = 1;
          render(true);
        });
        sectionButtons.push({key: key, button: b});
      }
      addSection('whole', 'Whole board');
      Object.keys(views).forEach(function (key) { addSection(key, titles[key] || key); });
      var zoomOut = button('Zoom out', function () {
        zoom = Math.max(1, zoom - 0.25);
        render(false);
      });
      var zoomIn = button('Zoom in', function () {
        zoom = Math.min(2, zoom + 0.25);
        render(false);
      });
      fig.insertBefore(bar, viewport);
      fig.insertBefore(status, viewport.nextSibling);
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          selected = 'whole';
          zoom = 1;
          render(true);
        }
      });
      if (typeof ResizeObserver !== 'undefined') {
        var observer = new ResizeObserver(function () { sizeBoard(); });
        observer.observe(viewport);
      } else {
        window.addEventListener('resize', sizeBoard);
      }
      render(true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
