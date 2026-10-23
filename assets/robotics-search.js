// Search and tag filter for the Robotics index. The build writes /robotics/search-index.json
// from the front matter; filtering happens in the browser with no external service.
// Without JavaScript the full list stays readable and this bar stays hidden.
(() => {
  const bar = document.querySelector('[data-filter]');
  if (!bar) return;
  const input = bar.querySelector('[data-filter-search]');
  const status = bar.querySelector('.filter-status');
  const buttons = [...bar.querySelectorAll('[data-filter-tag]')];
  const entries = [...document.querySelectorAll('[data-entry]')];
  const blocks = [...document.querySelectorAll('.series-block')];
  const knownTags = new Set(buttons.map((button) => button.dataset.filterTag).filter(Boolean));
  const haystacks = new Map();
  let activeTag = '';
  let query = '';

  const haystack = (entry) => haystacks.get(entry.getAttribute('href')) || entry.textContent.toLowerCase();

  const apply = () => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const entry of entries) {
      const tags = entry.dataset.tags.split(' ');
      const matches = (!activeTag || tags.includes(activeTag)) && words.every((word) => haystack(entry).includes(word));
      entry.hidden = !matches;
      if (matches) shown += 1;
    }
    for (const block of blocks) {
      block.hidden = ![...block.querySelectorAll('[data-entry]')].some((entry) => !entry.hidden);
      // A match inside a closed part list must be visible.
      const parts = block.querySelector('details');
      if (parts && (activeTag || words.length) && !block.hidden) parts.open = true;
    }
    status.textContent = shown === 0 ? 'No essays match your search.'
      : shown === entries.length ? `Showing all ${shown} essays.`
      : `Showing ${shown} of ${entries.length} essays.`;
  };

  const setTag = (tag, updateHash) => {
    activeTag = tag;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filterTag === tag));
    if (updateHash) history.replaceState(null, '', tag ? `#tag-${tag}` : location.pathname + location.search);
    apply();
  };

  const tagFromHash = () => {
    const match = location.hash.match(/^#tag-([a-z0-9-]+)$/);
    return match && knownTags.has(match[1]) ? match[1] : '';
  };

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const tag = button.dataset.filterTag;
      setTag(tag === activeTag ? '' : tag, true);
    });
  }
  input.addEventListener('input', () => { query = input.value.trim(); apply(); });
  window.addEventListener('hashchange', () => {
    const tag = tagFromHash();
    if (tag !== activeTag) setTag(tag, false);
  });

  bar.hidden = false;
  setTag(tagFromHash(), false);
  fetch('/robotics/search-index.json')
    .then((response) => (response.ok ? response.json() : []))
    .then((items) => {
      for (const item of items) {
        haystacks.set(item.url, `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase());
      }
      apply();
    })
    .catch(() => {});
})();