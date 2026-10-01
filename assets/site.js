// Old profile links keep their meaning after writing moves to the homepage.
const profileSections = new Set(['experience', 'management', 'education', 'skills', 'earlier', 'data-platform', 'production-ml', 'ai-tooling', 'commercial']);
if ((location.pathname === '/' || location.pathname === '/index.html') && profileSections.has(location.hash.slice(1))) {
  location.replace(`/about.html${location.hash}`);
}

const button = document.querySelector('#expand-all');
const details = [...document.querySelectorAll('.chapter details')];
if (button) {
  const syncButton = () => {
    button.textContent = details.every(item => item.open) ? 'Collapse all details' : 'Expand all details';
  };
  button.hidden = false;
  button.addEventListener('click', () => {
    const open = !details.every(item => item.open);
    details.forEach(item => { item.open = open; });
    syncButton();
  });
  details.forEach(item => item.addEventListener('toggle', syncButton));
  syncButton();
}

// Print the entire article and biography, then restore the reader's open drawers.
const printableDetails = [...document.querySelectorAll('main details')];
let beforePrint = [];
window.addEventListener('beforeprint', () => {
  beforePrint = printableDetails.map(item => item.open);
  printableDetails.forEach(item => { item.open = true; });
});
window.addEventListener('afterprint', () => {
  printableDetails.forEach((item, index) => { item.open = beforePrint[index] ?? false; });
});
