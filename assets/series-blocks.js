// A series block lists every part of its series. On a phone a long list starts closed behind
// its summary, so the essay list stays short. Without JavaScript every list stays open.
(() => {
  const phone = window.matchMedia('(max-width: 600px)');
  const lists = [...document.querySelectorAll('[data-series-collapse]')];
  if (!lists.length) return;
  const sync = () => { for (const list of lists) list.open = !phone.matches; };
  sync();
  phone.addEventListener('change', sync);
})();
