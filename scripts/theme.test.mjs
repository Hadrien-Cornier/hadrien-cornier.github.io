import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const head = fs.readFileSync(new URL('./templates/theme-head.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const script = fs.readFileSync(new URL('../assets/theme.js', import.meta.url), 'utf8');

function page(saved, unavailable = false) {
  const listeners = {};
  const root = {dataset: {}, style: {}};
  const button = {setAttribute(key, value) { this[key] = value; }, addEventListener(key, fn) { listeners[key] = fn; }};
  const meta = {};
  const context = vm.createContext({
    document: {documentElement: root, querySelector: selector => selector === '.theme-toggle' ? button : meta},
    localStorage: {
      getItem() { if (unavailable) throw Error('Storage denied'); return saved; },
      setItem(key, value) { if (unavailable) throw Error('Storage denied'); saved = value; },
    },
    window: {addEventListener(key, fn) { listeners[key] = fn; }},
  });
  vm.runInContext(head, context);
  return {root, button, meta, listeners, context, saved: () => saved};
}

test('head applies dark on first visit and validates saved values before other scripts', () => {
  for (const saved of [null, 'unknown', 'dark']) assert.equal(page(saved).root.dataset.theme, 'dark');
  assert.equal(page('light').root.dataset.theme, 'light');
  assert.equal(page('light').root.style.colorScheme, 'light');
});

test('toggle stores the choice, updates accessibility state, and restores on next page', () => {
  const p = page(null);
  vm.runInContext(script, p.context);
  assert.equal(p.button['aria-pressed'], 'true');
  p.listeners.click();
  assert.equal(p.root.dataset.theme, 'light');
  assert.equal(p.button.textContent, 'Light mode');
  assert.equal(p.button['aria-pressed'], 'false');
  assert.equal(p.meta.content, '#f7f6f2');
  assert.equal(page(p.saved()).root.dataset.theme, 'light');
  p.listeners.click();
  assert.equal(p.saved(), 'dark');
});

test('denied storage leaves initialization and the toggle usable', () => {
  const p = page(null, true);
  vm.runInContext(script, p.context);
  assert.equal(p.root.dataset.theme, 'dark');
  p.listeners.click();
  assert.equal(p.root.dataset.theme, 'light');
});

test('theme changes in another tab update the control', () => {
  const p = page('dark');
  vm.runInContext(script, p.context);
  p.listeners.storage({key: 'theme', newValue: 'light'});
  assert.equal(p.button['aria-pressed'], 'false');
  p.listeners.storage({key: 'theme', newValue: null});
  assert.equal(p.root.dataset.theme, 'dark');
});
