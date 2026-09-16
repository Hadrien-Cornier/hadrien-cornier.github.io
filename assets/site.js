const button = document.querySelector('#expand-all');
const details = [...document.querySelectorAll('.chapter details')];
function syncButton() {
  const allOpen = details.every(item => item.open);
  button.textContent = allOpen ? 'Collapse all details' : 'Expand all details';
}
button.hidden = false;
button.addEventListener('click', () => {
  const open = !details.every(item => item.open);
  details.forEach(item => { item.open = open; });
  syncButton();
});
details.forEach(item => item.addEventListener('toggle', syncButton));
let beforePrint = [];
window.addEventListener('beforeprint', () => {
  beforePrint = details.map(item => item.open);
  details.forEach(item => { item.open = true; });
});
window.addEventListener('afterprint', () => {
  details.forEach((item, index) => { item.open = beforePrint[index] ?? false; });
});
