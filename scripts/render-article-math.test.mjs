import test from 'node:test';
import assert from 'node:assert/strict';
import {renderArticleMath} from './render-article-math.mjs';

test('raw HTML drawer equations render statically, preserving code and SVG', () => {
  const protectedHtml = '<code>\\(example\\)</code><svg><text>\\(label\\)</text></svg>';
  const result = renderArticleMath('<details><summary>Math</summary><p>For \\(0&lt;\\gamma&lt;1\\):</p>\\[V=R+\\gamma V\'\\]</details>' + protectedHtml);
  assert.match(result, /class="katex"/);
  assert.match(result, /class="katex-display"/);
  assert.match(result, /<math /);
  assert.ok(result.endsWith(protectedHtml));
  assert.doesNotMatch(result, /<script|katex-error/);
});

test('invalid raw HTML equations fail integration', () => {
  assert.throws(() => renderArticleMath('<p>\\(\\unknowncommand\\)</p>'), /Undefined control sequence/);
});
