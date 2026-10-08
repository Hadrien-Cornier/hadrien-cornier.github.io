(() => {
  const directory = document.querySelector('.rm-directory');
  if (!directory) return;
  const controls = directory.querySelector('.rm-controls');
  const search = directory.querySelector('#market-search');
  const filter = directory.querySelector('#market-filter');
  const companies = [...directory.querySelectorAll('.rm-company')];
  const status = directory.querySelector('.rm-results');
  const update = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const company of companies) {
      company.hidden = !(company.dataset.search.includes(query) && (filter.value === 'all' || company.dataset.group === filter.value));
      if (!company.hidden) visible++;
    }
    status.textContent = `${visible} of ${companies.length} entries`;
    directory.querySelector('.rm-no-results').hidden = visible !== 0;
  };
  const reveal = id => {
    const target = document.getElementById(`company-${id}`);
    if (!target) return;
    search.value = '';
    filter.value = 'all';
    update();
    directory.open = true;
    target.open = true;
  };
  search.addEventListener('input', update);
  filter.addEventListener('change', update);
  document.querySelectorAll('[data-company-jump]').forEach(link => link.addEventListener('click', () => reveal(link.dataset.companyJump)));
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#company-')) reveal(location.hash.slice(9));
  });
  if (location.hash.startsWith('#company-')) reveal(location.hash.slice(9));
  controls.hidden = false;
  update();
})();
