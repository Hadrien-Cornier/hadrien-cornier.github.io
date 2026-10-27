import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareBoards} from '../assets/robotics/rebuild/board-metadata.js';

// The authored wrappers use both JSON boxes and SVG-style coordinate strings.
// The existing canvas consumes only a space-separated whole box and array views.
function fixture(whole, views) {
  const rootAttributes = {'data-whole': whole, 'data-views': JSON.stringify(views)};
  const svgAttributes = {viewBox: '0 0 840 1390'};
  const svg = {
    getAttribute: name => svgAttributes[name] ?? null,
    setAttribute: (name, value) => { svgAttributes[name] = value; },
  };
  const stage = {querySelector: name => name === 'svg.rc-svg' ? svg : {}};
  const mark = {getAttribute: name => name === 'data-view' ? 'first' : 'panel'};
  const root = {
    getAttribute: name => rootAttributes[name] ?? null,
    querySelector: () => stage,
    querySelectorAll: () => [mark],
  };
  return {root, svg};
}

for (const [whole, views] of [
  ['[0,0,840,1390]', {first: {box: [12,88,396,288]}}],
  ['0 0 840 1390', {first: [12,88,396,288]}],
]) {
  test(`authored board coordinates initialize the existing canvas: ${whole}`, () => {
    const {root, svg} = fixture(whole, views);
    const prior = globalThis.document;
    globalThis.document = {querySelectorAll: () => [root]};
    try {
      prepareBoards();
      assert.deepEqual(svg.getAttribute('data-whole').split(' ').map(Number), [0,0,840,1390]);
      assert.deepEqual(JSON.parse(svg.getAttribute('data-views')).first, [12,88,396,288]);
    } finally {
      if (prior === undefined) delete globalThis.document;
      else globalThis.document = prior;
    }
  });
}
