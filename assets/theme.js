(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#191c19' : '#f7f6f2';
  }
  apply(root.dataset.theme === 'light' ? 'light' : 'dark');
  button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(theme);
    try { localStorage.setItem('theme', theme); } catch (_) {}
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'theme' || event.key === null) {
      apply(event.newValue === 'light' ? 'light' : 'dark');
    }
  });
})();
