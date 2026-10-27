import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightPython } from './highlight-code.mjs';
import { renderArticle } from './build_robotics.mjs';

test('python pseudocode gets one class per token kind', () => {
  const html = highlightPython('def q(a):  # score\n    return max(a, key=f) if x else "Good" + 0.1 * None');
  assert.match(html, /<span class="tok-keyword">def<\/span> <span class="tok-function">q<\/span>/);
  assert.match(html, /<span class="tok-comment"># score<\/span>/);
  assert.match(html, /<span class="tok-function">max<\/span>\(a, key=f\)/);
  assert.match(html, /<span class="tok-keyword">if<\/span> x <span class="tok-keyword">else<\/span>/);
  assert.match(html, /<span class="tok-string">&quot;Good&quot;<\/span>/);
  assert.match(html, /<span class="tok-number">0\.1<\/span>/);
  assert.match(html, /<span class="tok-constant">None<\/span>/);
});

test('names with digits stay names, and markup in code is escaped', () => {
  assert.equal(highlightPython('a1 - a0'), 'a1 - a0');
  assert.equal(highlightPython('x < y & z'), 'x &lt; y &amp; z');
  assert.equal(highlightPython('buffer.add(s)'), 'buffer.<span class="tok-function">add</span>(s)');
});

const article = (flag) => `---\ntitle: T\ndescription: D\ndate: '2026-10-27'\n${flag}---\n\n\`\`\`python\nfor k in range(10):\n    pass\n\`\`\`\n`;

test('an article colors its code only when it opts in', () => {
  const on = renderArticle(article('code_highlight: true\n')).body;
  assert.match(on, /<pre><code class="language-python"><span class="tok-keyword">for<\/span>/);
  const off = renderArticle(article('')).body;
  assert.doesNotMatch(off, /tok-/);
  assert.throws(() => renderArticle(article("code_highlight: 'yes'\n")), /code_highlight must be true or false/);
});
