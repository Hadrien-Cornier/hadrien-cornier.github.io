import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderArticle, dateValue, build } from './build_robotics.mjs';

const frontmatter = `---\ntitle: Test report\ndescription: A small teaching fixture.\ndate: 2026-09-26\n---\n\n`;
const timelineFixture = fs.readFileSync(new URL('./fixtures/robotics-timeline.md', import.meta.url), 'utf8');
const timelineData = JSON.parse(timelineFixture.match(/```robotics-timeline\n([\s\S]*?)\n```/)[1]);
const timelineArticle = (data) => frontmatter + `\n\`\`\`robotics-timeline\n${JSON.stringify(data)}\n\`\`\`\n\n## First stage\n\n## Second stage\n\n## Third stage\n`;
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
test('timeline renders every stage and stack as static HTML from one fence', () => {
  const result = renderArticle(timelineFixture);
  assert.equal(result.components.timeline, true);
  assert.equal((result.body.match(/data-timeline-stage=/g) ?? []).length, 3);
  assert.equal((result.body.match(/class="rt-stack-row /g) ?? []).length, 12);
  assert.match(result.body, /<aside class="rt-inspector"[^>]+hidden>/);
  assert.match(result.body, /href="#timeline-display-fixture-second"/);
  assert.match(result.body, /href="#section-third-stage"/);
  assert.deepEqual(result.headings.map((heading) => heading.id), ['timeline-display-fixture-heading', 'section-first-stage', 'section-second-stage', 'section-third-stage']);
  assert.doesNotMatch(result.body, /<script|language-robotics-timeline|aria-current/);
});
test('timeline rejects missing anchors, incomplete stacks, and broken persistent roles', () => {
  const changed = () => structuredClone(timelineData);
  let data = changed();
  data.stages[0].anchor = 'section-does-not-exist';
  assert.throws(() => renderArticle(timelineArticle(data)), /does not match an article heading/);
  data = changed();
  data.stages[1].stack.pop();
  assert.throws(() => renderArticle(timelineArticle(data)), /every role exactly once/);
  data = changed();
  data.stages[1].stack[2].mode = 'learned';
  assert.throws(() => renderArticle(timelineArticle(data)), /persistent setting/);
  data = changed();
  data.stages[0].sumary = 'A misspelled field';
  assert.throws(() => renderArticle(timelineArticle(data)), /unknown stage field sumary/);
  assert.throws(() => renderArticle(frontmatter + '\n```robotics-timeline\nnot JSON\n```'), /valid JSON/);
});
test('timeline escapes author text, rejects unsafe sources, and reserves unique IDs', () => {
  const data = structuredClone(timelineData);
  data.stages[0].summary = '<img src=x onerror=alert(1)>';
  data.stages[0].sources = [{label:'Paper <one>', href:'https://example.org/paper?x=1&y=2'}];
  const result = renderArticle(timelineArticle(data));
  assert.match(result.body, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(result.body, /Paper &lt;one&gt;/);
  assert.match(result.body, /href="https:\/\/example.org\/paper\?x=1&amp;y=2"/);
  data.stages[0].sources[0].href = 'javascript:alert(1)';
  assert.throws(() => renderArticle(timelineArticle(data)), /HTTPS URL/);
  const fence = `\n\`\`\`robotics-timeline\n${JSON.stringify(timelineData)}\n\`\`\`\n`;
  assert.throws(() => renderArticle(timelineArticle(timelineData) + fence), /duplicate HTML ID/);
});
test('only articles with a timeline load its small runtime script', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-timeline-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    fs.writeFileSync(path.join(root, 'content/robotics/timeline.md'), timelineFixture);
    fs.writeFileSync(path.join(root, 'content/robotics/plain.md'), frontmatter + 'A plain article.');
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    build(root);
    const componentPage = fs.readFileSync(path.join(root, 'robotics/timeline/index.html'), 'utf8');
    const plainPage = fs.readFileSync(path.join(root, 'robotics/plain/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(componentPage, /<script src="\/assets\/robotics-timeline.js\?v=[a-f0-9]+" defer><\/script>/);
    assert.doesNotMatch(componentPage, /<script src="\/assets\/site.js/);
    assert.doesNotMatch(plainPage, /<script[^>]*src=/);
    assert.doesNotMatch(home, /robotics-timeline.js/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
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
    const home = fs.readFileSync(path.join(root,'index.html'),'utf8');
    const sitemap = fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
    assert.ok(sitemap.includes(existing));
    assert.equal((sitemap.match(/\/robotics\/example\//g) ?? []).length, 1);
    assert.ok(fs.existsSync(path.join(root,'assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2')));
    assert.ok(fs.existsSync(path.join(root,'assets/vendor/katex/LICENSE')));
    assert.ok(!fs.existsSync(path.join(root,'robotics/draft/index.html')));
    assert.match(home, /href="\/robotics\/example\/"/);
    assert.match(home, /01 essay/);
    assert.doesNotMatch(home, /Unfinished|\{\{/);
    assert.match(home, /href="\/about.html"/);
    assert.match(home, /id="joint-one"/);
    assert.doesNotMatch(home, /href="\/robotics\/from-joint-angles-to-a-moving-arm\/"/);
    assert.match(home, /href="\/#writing">Explore the writing/);
    assert.doesNotMatch(page, /<script[^>]*src=|https?:\/\/[^"\s]+\.css/);
    build(root);
    assert.equal(fs.readFileSync(path.join(root,'robotics/example/index.html'),'utf8'), page);
    assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'), home);
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
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="\/robotics\/example\/"/);
    assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /first essay is on its way/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/robotics\/example\//);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
