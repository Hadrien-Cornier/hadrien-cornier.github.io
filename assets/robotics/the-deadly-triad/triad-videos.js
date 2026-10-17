/* Playback for the recorded robot clips in "The deadly triad".
   Mount point: <video class="tri-video" data-clip="NAME" controls muted loop playsinline preload="none" src="clips/NAME-desktop.mp4">.
   Narrow screens get the NAME-phone.mp4 variant. A clip plays while it is on screen and pauses when it leaves.
   With prefers-reduced-motion, or without IntersectionObserver, a clip does not start by itself. The controls always work. */
(function () {
  'use strict';
  var narrow = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var base = '/assets/robotics/the-deadly-triad/clips/';
  var css = '' +
    '.tri-clips{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;margin:28px 0 34px}' +
    '.tri-clip{margin:0;border:1px solid var(--line,#dcded6);background:#fff}' +
    '.tri-clip video{display:block;width:100%;height:auto;aspect-ratio:var(--ar,16/7);background:#4a0f1c}' +
    '.tri-clip figcaption{font:13px/1.5 Arial,Helvetica,sans-serif;color:var(--muted,#656b62);padding:9px 12px 11px}' +
    '.tri-clip figcaption b{display:block;font:600 14px/1.4 Arial,Helvetica,sans-serif;color:var(--ink,#242622);margin:0 0 2px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var vids = [].slice.call(document.querySelectorAll('video.tri-video'));
  vids.forEach(function (v) {
    var clip = v.getAttribute('data-clip'); if (!clip) return;
    var variant = narrow ? 'phone' : 'desktop';
    v.style.setProperty('--ar', narrow ? '350/263' : '640/280');
    v.setAttribute('poster', base + clip + '-' + variant + '.jpg');
    v.setAttribute('src', base + clip + '-' + variant + '.mp4');
    v.muted = true; v.setAttribute('muted', '');
  });
  if (!('IntersectionObserver' in window) || reduce) return;
  /* The observer fires only when a clip enters or leaves the screen, so a pause that the reader asks for while the clip is on screen stays. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.6 });
  vids.forEach(function (v) { io.observe(v); });
})();
