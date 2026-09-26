import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderArticle, dateValue, build } from './build_robotics.mjs';

const frontmatter = `---\ntitle: Test report\ndescription: A small teaching fixture.\ndate: 2026-09-26\n---\n\n`;
test('dates stay UTC and invalid calendar dates fail', () => {
  assert.equal(dateValue(new Date('2026-09-26T00:00:00Z'), 'date'), '2026-09-26');
  assert.throws(() => dateValue('2026-02-30', 'date'), /valid YYYY/);
});
test('heading IDs remain unique even when suffixes collide', () => {
  const result = renderArticle(frontmatter + '## Arm\n\n## Arm\n\n## Arm 2\n');
  const ids = result.headings.map((heading) => heading.id);
  assert.equal(new Set(ids).size, 3);
  assert.match(result.body, /id="section-arm-2-2"/);
});
test('inline math, display matrices and details render without runtime scripts', () => {
  const result = renderArticle(frontmatter + String.raw`Inline $q_1$.

$$
R=\begin{bmatrix}1&0\\0&1\end{bmatrix}
$$

<details>
<summary>Derivation</summary>

A **useful** detail.

</details>
`);
  assert.match(result.body, /class="katex"/);
  assert.match(result.body, /<math /);
  assert.match(result.body, /<mtable/);
  assert.match(result.body, /<strong>useful<\/strong>/);
  assert.doesNotMatch(result.body, /<script|katex-error/);
});
test('bad math and missing metadata fail before publishing', () => {
  assert.throws(() => renderArticle(frontmatter + '$\\notAnActualLatexCommand{x}$'));
  assert.throws(() => renderArticle('## No frontmatter'), /frontmatter/);
});
test('build preserves sitemap entries and creates repeatable offline pages', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    fs.writeFileSync(path.join(root,'content/robotics/example.md'), frontmatter + '## One\n\nAn equation $q=1$.');
    fs.writeFileSync(path.join(root,'content/robotics/draft.md'), '---\ndraft: true\n---\nUnfinished');
    const existing = '<url><loc>https://hadrien-cornier.github.io/notes.html</loc><priority>0.7</priority></url>';
    fs.writeFileSync(path.join(root,'sitemap.xml'), `<urlset>${existing}\n</urlset>`);
    build(root);
    const page = fs.readFileSync(path.join(root,'robotics/example/index.html'),'utf8');
    const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
    assert.ok(sitemap.includes(existing));
    assert.equal((sitemap.match(/\/robotics\/example\//g) ?? []).length, 1);
    assert.ok(fs.existsSync(path.join(root,'assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2')));
    assert.ok(fs.existsSync(path.join(root,'assets/vendor/katex/LICENSE')));
    assert.ok(!fs.existsSync(path.join(root,'robotics/draft/index.html')));
    assert.doesNotMatch(page, /<script[^>]*src=|https?:\/\/[^"\s]+\.css/);
    build(root);
    assert.equal(fs.readFileSync(path.join(root,'robotics/example/index.html'),'utf8'), page);
    assert.equal(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'), sitemap);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});
test('published reports disappear when drafted or deleted; unrelated files survive', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-transition-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const source = path.join(sourceDir, 'example.md');
    const postDir = path.join(root, 'robotics/example');
    const post = path.join(postDir, 'index.html');
    fs.writeFileSync(source, frontmatter + 'A published report.');
    build(root);
    assert.ok(fs.existsSync(post));
    fs.writeFileSync(path.join(postDir, 'keep.txt'), 'An unrelated author file.');
    fs.mkdirSync(path.join(root, 'robotics/manual'), {recursive:true});
    fs.writeFileSync(path.join(root, 'robotics/manual/index.html'), '<h1>Handmade page</h1>');
    fs.writeFileSync(source, '---\ndraft: true\n---\nAn unfinished draft.');
    build(root);
    assert.ok(!fs.existsSync(post), 'a published-to-draft transition must remove old HTML');
    assert.equal(fs.readFileSync(path.join(postDir, 'keep.txt'), 'utf8'), 'An unrelated author file.');
    assert.equal(fs.readFileSync(path.join(root, 'robotics/manual/index.html'), 'utf8'), '<h1>Handmade page</h1>');
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/robotics\/example\//);
    fs.writeFileSync(source, frontmatter + 'Published again.');
    build(root);
    assert.ok(fs.existsSync(post));
    fs.unlinkSync(source);
    build(root);
    assert.ok(!fs.existsSync(post), 'deleting the last Markdown file must remove old HTML');
    assert.match(fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8'), /first report is on its way/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/robotics\/example\//);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
