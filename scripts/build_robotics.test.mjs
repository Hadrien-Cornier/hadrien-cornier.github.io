import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderArticle, dateValue, dateRange, build } from './build_robotics.mjs';

function writeFixture(filename, source) {
  // Give each published fixture its own source image, as real articles require.
  if (filename.endsWith('.md') && source.includes('/assets/fixture-thumbnail.svg')) {
    const root = path.resolve(path.dirname(filename), '../..');
    const image = `fixture-${path.basename(filename, '.md')}.svg`;
    fs.copyFileSync(new URL('./fixtures/thumbnail.svg', import.meta.url), path.join(root, 'assets', image));
    source = source.replaceAll('/assets/fixture-thumbnail.svg', `/assets/${image}`);
  }
  fs.writeFileSync(filename, source);
}

// Series names live in content/robotics/series.json; a part names its series by id.
function writeSeries(root, series = {'arm-series': {title:'Arm series', description:'How an arm learns to move.'}}) {
  fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
  fs.writeFileSync(path.join(root, 'content/robotics/series.json'), JSON.stringify(series));
}

function fixtureRoot(prefix) {
  const root = fs.mkdtempSync(prefix);
  fs.mkdirSync(path.join(root, 'assets'), {recursive:true});
  fs.copyFileSync(new URL('./fixtures/thumbnail.svg', import.meta.url), path.join(root, 'assets/fixture-thumbnail.svg'));
  return root;
}

const frontmatter = `---\ntitle: Test report\ndescription: A small teaching fixture.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n---\n\n`;
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
test('the geometry component stays static and rejects duplicate instances', () => {
  const source = frontmatter + '## How do we describe gripper position mathematically?\n\n```robotics-arm\n```\n';
  const result = renderArticle(source);
  assert.equal(result.components.geometry, true);
  assert.match(result.body, /id="joint-one"/);
  assert.doesNotMatch(result.body, /<script|\{\{/);
  const elsewhere = renderArticle(frontmatter + '## Two links\n\n```robotics-arm\n```');
  assert.match(elsewhere.body, /href="#section-two-links"/);
  assert.throws(() => renderArticle(source + '\n```robotics-arm\n```'), /Only one/);
  assert.throws(() => renderArticle(frontmatter + '\n```robotics-arm\nunknown\n```'), /does not accept content/);
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
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-timeline-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    writeFixture(path.join(root, 'content/robotics/timeline.md'), timelineFixture);
    writeFixture(path.join(root, 'content/robotics/plain.md'), frontmatter + 'A plain article.');
    writeFixture(path.join(root, 'content/robotics/geometry.md'), frontmatter + '## How do we describe gripper position mathematically?\n\n```robotics-arm\n```');
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    build(root);
    const componentPage = fs.readFileSync(path.join(root, 'robotics/timeline/index.html'), 'utf8');
    const plainPage = fs.readFileSync(path.join(root, 'robotics/plain/index.html'), 'utf8');
    const geometryPage = fs.readFileSync(path.join(root, 'robotics/geometry/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const page of [componentPage, plainPage, geometryPage, home]) {
      assert.match(page, /class="theme-toggle"[^>]*aria-pressed="true"/);
      assert.equal((page.match(/src="\/assets\/theme\.js\?/g) ?? []).length, 1);
      assert.ok(page.indexOf("let theme = 'dark'") < page.indexOf('<link rel="stylesheet"'));
      assert.ok(page.indexOf("let theme = 'dark'") > page.indexOf('<head>'));
    }
    assert.match(componentPage, /<script src="\/assets\/robotics-timeline.js\?v=[a-f0-9]+" defer><\/script>/);
    assert.doesNotMatch(componentPage, /<script src="\/assets\/site.js/);
    assert.doesNotMatch(plainPage, /<script[^>]*src="(?!\/assets\/theme\.js\?)/);
    assert.doesNotMatch(home, /robotics-timeline.js/);
    assert.match(home, /<script type="module" src="\/assets\/control-playground.js\?v=[a-f0-9]+"><\/script>/);
    assert.match(geometryPage, /<script src="\/assets\/arm-geometry.js\?v=[a-f0-9]+" defer><\/script>/);
    assert.doesNotMatch(geometryPage, /control-playground.js|robotics-timeline.js/);
    assert.doesNotMatch(home, /arm-geometry.js/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
test('build preserves sitemap entries and creates repeatable offline pages', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    writeFixture(path.join(root,'content/robotics/example.md'), frontmatter + '## One\n\nAn equation $q=1$.');
    writeFixture(path.join(root,'content/robotics/draft.md'), '---\ndraft: true\n---\nUnfinished');
    const existing = '<url><loc>https://hadrien-cornier.github.io/notes.html</loc><priority>0.7</priority></url>';
    writeFixture(path.join(root,'sitemap.xml'), `<urlset>${existing}\n</urlset>`);
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
    assert.match(home, /data-control-playground/);
    assert.doesNotMatch(home, /id="joint-one"/);
    assert.doesNotMatch(home, /href="\/robotics\/from-joint-angles-to-a-moving-arm\/"/);
    assert.match(home, /href="#writing">Explore the writing/);
    assert.doesNotMatch(home, /href="\/robotics\/how-robot-control-is-changing\/"/);
    assert.doesNotMatch(page, /<script[^>]*src="(?!\/assets\/theme\.js\?)|https?:\/\/[^"\s]+\.css/);
    build(root);
    assert.equal(fs.readFileSync(path.join(root,'robotics/example/index.html'),'utf8'), page);
    assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'), home);
    assert.equal(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'), sitemap);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});
test('published reports disappear when drafted or deleted; unrelated files survive', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-transition-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const source = path.join(sourceDir, 'example.md');
    const postDir = path.join(root, 'robotics/example');
    const post = path.join(postDir, 'index.html');
    writeFixture(source, frontmatter + 'A published report.');
    build(root);
    assert.ok(fs.existsSync(post));
    writeFixture(path.join(postDir, 'keep.txt'), 'An unrelated author file.');
    fs.mkdirSync(path.join(root, 'robotics/manual'), {recursive:true});
    writeFixture(path.join(root, 'robotics/manual/index.html'), '<h1>Handmade page</h1>');
    writeFixture(source, '---\ndraft: true\n---\nAn unfinished draft.');
    build(root);
    assert.ok(!fs.existsSync(post), 'a published-to-draft transition must remove old HTML');
    assert.equal(fs.readFileSync(path.join(postDir, 'keep.txt'), 'utf8'), 'An unrelated author file.');
    assert.equal(fs.readFileSync(path.join(root, 'robotics/manual/index.html'), 'utf8'), '<h1>Handmade page</h1>');
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/robotics\/example\//);
    writeFixture(source, frontmatter + 'Published again.');
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

test('series validates metadata, orders parts, and omits draft parts', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-series-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title, date, metadata = '') => `---\ntitle: ${title}\ndescription: ${title} description.\ndate: ${date}\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n${metadata}---\n\n${title} body.`;
    writeFixture(path.join(sourceDir, 'series-one.md'), report('Series part one', '2026-09-26', 'series: arm-series\npart: 1\n'));
    writeFixture(path.join(sourceDir, 'series-two.md'), report('Series part two', '2026-09-28', 'series: arm-series\npart: 2\n'));
    writeFixture(path.join(sourceDir, 'series-draft.md'), report('Unpublished part', '2026-09-29', 'draft: true\nseries: arm-series\npart: 3\n'));
    writeFixture(path.join(sourceDir, 'standalone.md'), report('Latest standalone', '2026-10-01'));
    writeSeries(root);
    build(root);
    const first = fs.readFileSync(path.join(root, 'robotics/series-one/index.html'), 'utf8');
    const second = fs.readFileSync(path.join(root, 'robotics/series-two/index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(first, /<nav class="series-box" aria-label="Series"><p class="series-box-name"><a href="\/robotics\/#series-arm-series">Series · Arm series<\/a><\/p><p class="series-box-position">Part 1 of 2<\/p>/);
    assert.match(first, /aria-current="page">Series part one/);
    assert.match(first, /rel="next" href="\/robotics\/series-two\/"/);
    assert.match(second, /rel="prev" href="\/robotics\/series-one\/"/);
    assert.doesNotMatch(first, /Unpublished part/);
    const listingBlock = listing.match(/<section class="series-block" id="series-arm-series"[\s\S]*?<\/section>/)?.[0];
    assert.ok(listingBlock);
    assert.ok(listingBlock.indexOf('series-one') < listingBlock.indexOf('series-two'));
    assert.ok(listing.indexOf('Latest standalone') < listing.indexOf('Arm series'));
    const homeBlock = home.match(/<section class="series-block series-block-home" id="series-arm-series"[\s\S]*?<\/section>/)?.[0];
    assert.ok(homeBlock);
    assert.ok(homeBlock.indexOf('series-one') < homeBlock.indexOf('series-two'));
    assert.match(homeBlock, /Series · 2 parts · <time datetime="2026-09-26">September 26\s–\s28, 2026<\/time>/);
    assert.doesNotMatch(homeBlock, /series-block-subtitle/);
    assert.match(homeBlock, /<h3 id="series-arm-series-title">Arm series<\/h3><p class="series-block-description">How an arm learns to move\.<\/p>/);
    assert.match(homeBlock, /series-row-part">Part 1</);
    assert.match(listingBlock, /series-row-part">Part 2</);
    assert.match(listingBlock, /series-row-description">Series part two description\.</);
    assert.doesNotMatch(homeBlock, /series-row-description/);
    assert.doesNotMatch(listing + home, /Unpublished part/);
    assert.throws(() => renderArticle(`---\ntitle: Series\ndescription: Test.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nseries: arm-series\n---\nBody.`), /part is required/);
    assert.throws(() => renderArticle(`---\ntitle: Series\ndescription: Test.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nseries: arm-series\npart: -1\n---\nBody.`), /non-negative integer/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('a series subtitle shows under its title in the series block and on each part page', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-series-subtitle-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title, date, metadata = '') => `---\ntitle: ${title}\ndescription: ${title} description.\ndate: ${date}\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n${metadata}---\n\n${title} body.`;
    writeFixture(path.join(sourceDir, 'series-one.md'), report('Series part one', '2026-09-26', 'series: arm-series\npart: 1\n'));
    writeSeries(root, {'arm-series': {title:'Arm series', subtitle:'What I learned & measured', description:'How an arm learns to move.'}});
    build(root);
    const part = fs.readFileSync(path.join(root, 'robotics/series-one/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(home, /<h3 id="series-arm-series-title">Arm series<\/h3><p class="series-block-subtitle">What I learned &amp; measured<\/p><p class="series-block-description">/);
    assert.match(part, /Series · Arm series<\/a><\/p><p class="series-box-subtitle">What I learned &amp; measured<\/p><p class="series-box-position">Part 1 of 1</);
    writeSeries(root, {'arm-series': {title:'Arm series', subtitle:' ', description:'How an arm learns to move.'}});
    assert.throws(() => build(root), /subtitle must be non-empty text/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('a hardware track part gets its own class and label in the series', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-series-track-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title, date, metadata = '') => `---\ntitle: ${title}\ndescription: ${title} description.\ndate: ${date}\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n${metadata}---\n\n${title} body.`;
    writeFixture(path.join(sourceDir, 'control-part.md'), report('Control part', '2026-09-26', 'series: arm-series\npart: 1\n'));
    writeFixture(path.join(sourceDir, 'hardware-part.md'), report('Hardware part', '2026-09-28', 'series: arm-series\npart: 2\ntrack: hardware\n'));
    writeSeries(root);
    build(root);
    const control = fs.readFileSync(path.join(root, 'robotics/control-part/index.html'), 'utf8');
    const hardware = fs.readFileSync(path.join(root, 'robotics/hardware-part/index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(hardware, /<body class="robotics track-hardware">/);
    assert.match(control, /<body class="robotics">/);
    assert.match(hardware, /Part 2 of 2 · Hardware/);
    assert.match(control, /<li class="series-part track-hardware"><a href="\/robotics\/hardware-part\/">Hardware part<\/a><span class="track-tag">Hardware<\/span>/);
    assert.match(listing, /series-row track-hardware" href="\/robotics\/hardware-part\/"/);
    assert.match(listing, /series-row-part">Part 2<small>Hardware<\/small>/);
    assert.match(home, /series-row track-hardware" href="\/robotics\/hardware-part\/"/);
    assert.throws(() => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nseries: arm-series\npart: 1\ntrack: wood\n---\nBody.`), /track must be one of: hardware/);
    assert.throws(() => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\ntrack: hardware\n---\nBody.`), /track requires series/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('published series reject duplicate part numbers', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-series-duplicate-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title) => `---\ntitle: ${title}\ndescription: Duplicate part.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nseries: arm-series\npart: 1\n---\nBody.`;
    writeFixture(path.join(sourceDir, 'one.md'), report('One'));
    writeFixture(path.join(sourceDir, 'two.md'), report('Two'));
    writeSeries(root);
    assert.throws(() => build(root), /Duplicate part 1 in series arm-series/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('SO-101 fences parse, escape their output, and load scripts only where used', () => {
  const widget = frontmatter + '\n```so101-widget\n{"type":"predict","fallback":"Try <quiz>","id":"D2"}\n```\n';
  const parsed = renderArticle(widget);
  assert.equal(parsed.components.so101, true);
  assert.match(parsed.body, /<figure class="so101-widget" data-type="predict" data-config='/);
  assert.match(parsed.body, /&quot;id&quot;:&quot;D2&quot;/);
  assert.match(parsed.body, /Try &lt;quiz&gt;/);
  assert.throws(() => renderArticle(frontmatter + '\n```so101-widget\nnot JSON\n```'), /valid JSON/);
  assert.throws(() => renderArticle(frontmatter + '\n```so101-widget\n{"fallback":"Try it"}\n```'), /requires a type/);
  assert.throws(() => renderArticle(frontmatter + '\n```so101-widget\n{"type":"predict"}\n```'), /requires a fallback/);
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-widget-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    writeFixture(path.join(root, 'content/robotics/widget.md'), widget);
    writeFixture(path.join(root, 'content/robotics/plain.md'), frontmatter + 'A plain article.');
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    build(root);
    const widgetPage = fs.readFileSync(path.join(root, 'robotics/widget/index.html'), 'utf8');
    const plainPage = fs.readFileSync(path.join(root, 'robotics/plain/index.html'), 'utf8');
    assert.match(widgetPage, /<script type="module" src="\/assets\/so101-widgets\.js\?v=[a-f0-9]+"><\/script>/);
    assert.doesNotMatch(plainPage, /so101-widgets\.js/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('redirects write small moved pages, survive cleanup, and reject bad targets', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-redirect-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    writeFixture(path.join(sourceDir, 'new-home.md'), frontmatter + '## Moved section\n\nText.');
    writeFixture(path.join(sourceDir, 'redirects.json'), JSON.stringify({'old-home':'/robotics/new-home/#moved-section', 'old-root':'/robotics/new-home/'}));
    build(root);
    const page = fs.readFileSync(path.join(root, 'robotics/old-home/index.html'), 'utf8');
    assert.match(page, /http-equiv="refresh" content="0; url=\/robotics\/new-home\/#moved-section"/);
    assert.match(page, /rel="canonical" href="https:\/\/hadrien-cornier\.github\.io\/robotics\/new-home\/#moved-section"/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /old-home/);
    build(root);
    assert.ok(fs.existsSync(path.join(root, 'robotics/old-home/index.html')), 'a second build must keep the redirect');
    assert.match(fs.readFileSync(path.join(root, 'robotics/old-root/index.html'), 'utf8'), /location\.replace\("\/robotics\/new-home\/" \+ location\.hash\)/);
    for (const bad of [{'new-home':'/robotics/new-home/'}, {'old-home':'https://example.com/'}, {'old-home':'/robotics/missing/'}]) {
      writeFixture(path.join(sourceDir, 'redirects.json'), JSON.stringify(bad));
      assert.throws(() => build(root), /Redirect/);
    }
    fs.unlinkSync(path.join(sourceDir, 'redirects.json'));
    build(root);
    assert.ok(!fs.existsSync(path.join(root, 'robotics/old-home/index.html')), 'a removed redirect must disappear');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('old site paths outside /robotics/ redirect to articles and sections, never over a hand-written page', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-path-redirect-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    writeFixture(path.join(sourceDir, 'a-paper.md'), "---\ntitle: A paper\ndescription: About a paper.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nsection: 'recent-papers'\n---\n\nBody.");
    // An old page from another builder at the same path is replaced.
    fs.mkdirSync(path.join(root, 'papers/a-paper'), {recursive:true});
    fs.writeFileSync(path.join(root, 'papers/a-paper/index.html'), '<!doctype html>\n<!-- Generated by scripts/build_papers.mjs. -->\n<p>Old</p>');
    writeFixture(path.join(sourceDir, 'redirects.json'), JSON.stringify({'/papers/':'/robotics/recent-papers/', '/papers/a-paper/':'/robotics/a-paper/'}));
    build(root);
    const moved = fs.readFileSync(path.join(root, 'papers/a-paper/index.html'), 'utf8');
    assert.match(moved, /http-equiv="refresh" content="0; url=\/robotics\/a-paper\/"/);
    assert.match(moved, /rel="canonical" href="https:\/\/hadrien-cornier\.github\.io\/robotics\/a-paper\/"/);
    assert.match(moved, /<meta name="robots" content="noindex">/);
    assert.match(fs.readFileSync(path.join(root, 'papers/index.html'), 'utf8'), /url=\/robotics\/recent-papers\/"/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/papers\//);
    build(root);
    assert.equal(fs.readFileSync(path.join(root, 'papers/a-paper/index.html'), 'utf8'), moved, 'a second build keeps the redirect');
    for (const bad of [{'/robotics/a-paper/':'/robotics/a-paper/'}, {'/papers':'/robotics/a-paper/'}, {'/papers/x/':'/robotics/missing/'}]) {
      writeFixture(path.join(sourceDir, 'redirects.json'), JSON.stringify(bad));
      assert.throws(() => build(root), /Redirect|redirect source/);
    }
    fs.mkdirSync(path.join(root, 'kept'), {recursive:true});
    fs.writeFileSync(path.join(root, 'kept/index.html'), '<!doctype html>\n<p>Hand-written</p>');
    writeFixture(path.join(sourceDir, 'redirects.json'), JSON.stringify({'/kept/':'/robotics/a-paper/'}));
    assert.throws(() => build(root), /hand-written page/);
    assert.equal(fs.readFileSync(path.join(root, 'kept/index.html'), 'utf8'), '<!doctype html>\n<p>Hand-written</p>');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('a short article is an HTML body with Markdown frontmatter and is listed like every other article', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-short-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const short = "---\ntitle: 'Canvas: A paper'\ndescription: One canvas.\ndate: 2026-09-27\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nlayout: short\nsection: 'recent-papers'\ntags: ['robot-memory', 'vla']\npaper:\n  title: 'A Paper'\n  url: 'https://arxiv.org/abs/2610.14406'\n  date: '2026-10-09'\n  code: 'https://github.com/example/code'\n---\n";
    writeFixture(path.join(sourceDir, 'canvas.md'), short);
    writeFixture(path.join(sourceDir, 'canvas.html'), `<p class="x-intro">One two three $not math$.</p><figure class="x-canvas"><svg viewBox="0 0 1 1"><desc>${'word '.repeat(600)}</desc></svg></figure>`);
    writeFixture(path.join(sourceDir, 'plain.md'), '---\ntitle: Plain essay\ndescription: Not a paper.\ndate: 2026-09-25\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n---\n\nBody.');
    fs.mkdirSync(path.join(root, 'assets/robotics/canvas'), {recursive:true});
    fs.writeFileSync(path.join(root, 'assets/robotics/canvas/article.css'), '.x-canvas { color: red; }');
    build(root);
    const page = fs.readFileSync(path.join(root, 'robotics/canvas/index.html'), 'utf8');
    assert.match(page, /<h1>Canvas: A paper<\/h1><p class="paper-source">Posted to arXiv on 9 October 2026 · <a href="https:\/\/arxiv\.org\/abs\/2610\.14406">arXiv 2610\.14406 ↗<\/a><\/p><p class="post-description">One canvas\.<\/p><p class="post-meta"><time datetime="2026-09-27">/);
    assert.match(page, /<article class="short-body" aria-label="Canvas: A paper"><p class="x-intro">One two three \$not math\$\.<\/p><figure class="x-canvas">/, 'the body is used as written, without Markdown or math');
    assert.match(page, /<link rel="stylesheet" href="\/assets\/robotics\/canvas\/article\.css\?v=[0-9a-f]{12}">/);
    assert.doesNotMatch(page, /article\.js/);
    assert.match(page, /<span>1 min read<\/span>/, 'a drawing\'s accessible description is not reading time');
    assert.doesNotMatch(page, /class="article-toc"/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'robotics/plain/index.html'), 'utf8'), /article\.css|paper-source/);
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(home, /href="\/robotics\/canvas\/"/);
    assert.doesNotMatch(home, /href="\/papers\//);
    assert.match(home, /<p class="eyebrow">Latest paper<\/p><h3>Canvas: A paper<\/h3>/, 'a newest paper is not called an essay');
    assert.match(home, /Read the article <span/, 'the link opens the article, not the paper PDF');
    assert.match(fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8'), /<article class="report-card has-thumb" data-url="\/robotics\/canvas\/" data-entry data-tags="robot-memory vla"><span class="report-date"><span class="report-part">Recent papers<\/span><time datetime="2026-09-27">/);
    assert.match(fs.readFileSync(path.join(root, 'robotics/recent-papers/index.html'), 'utf8'), /href="\/robotics\/canvas\/"/);
    assert.ok(JSON.parse(fs.readFileSync(path.join(root, 'robotics/search-index.json'), 'utf8')).some((entry) => entry.url === '/robotics/canvas/'));
    assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/robotics\/canvas\//);
    const failures = [
      [() => writeFixture(path.join(sourceDir, 'canvas.md'), short + '\nMarkdown body.'), /leave the Markdown body empty/],
      [() => writeFixture(path.join(sourceDir, 'canvas.html'), '<h1>Title</h1>'), /title supplies H1/],
      [() => fs.unlinkSync(path.join(sourceDir, 'canvas.html')), /non-empty \.html body/],
      [() => writeFixture(path.join(sourceDir, 'canvas.md'), short.replace('layout: short\n', '')), /Only a short article/],
      [() => writeFixture(path.join(sourceDir, 'stray.html'), '<p>Stray</p>'), /stray\.html has no stray\.md/],
      [() => writeFixture(path.join(sourceDir, 'canvas.md'), short.replace("url: 'https://arxiv.org/abs/2610.14406'", "url: 'http://arxiv.org/abs/2610.14406'")), /paper\.url must be an HTTPS URL/],
      [() => writeFixture(path.join(sourceDir, 'canvas.md'), short.replace("  date: '2026-10-09'", "  date: '2026-02-30'")), /paper\.date must be a valid/],
      [() => writeFixture(path.join(sourceDir, 'canvas.md'), short.replace("  code:", "  repo:")), /unknown field repo/],
    ];
    for (const [change, error] of failures) {
      const md = fs.readFileSync(path.join(sourceDir, 'canvas.md'), 'utf8');
      const html = fs.existsSync(path.join(sourceDir, 'canvas.html')) ? fs.readFileSync(path.join(sourceDir, 'canvas.html'), 'utf8') : null;
      change();
      assert.throws(() => build(root), error);
      fs.writeFileSync(path.join(sourceDir, 'canvas.md'), md);
      if (html !== null) fs.writeFileSync(path.join(sourceDir, 'canvas.html'), html);
      fs.rmSync(path.join(sourceDir, 'stray.html'), {force:true});
    }
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('essay presentation keeps a centered reading path and loads figure styles only where needed', t => {
  const root=fixtureRoot(path.join(os.tmpdir(),'robotics-essay-layout-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'content/robotics'),{recursive:true});
  writeFixture(path.join(root,'sitemap.xml'),'<urlset></urlset>');
  const figure='<figure class="rf-figure" aria-label="Conditional example"><p>Possible constraint</p></figure>';
  const essay=frontmatter.replace('Test report','Essay title').replace('---\n\n','layout: essay\n---\n\n')+'## One question\n\nA concrete opening.\n\n'+figure;
  writeFixture(path.join(root,'content/robotics/essay.md'),essay);
  writeFixture(path.join(root,'content/robotics/report.md'),frontmatter+'## A report section\n\nExisting report prose.');
  build(root);
  const essayPage=fs.readFileSync(path.join(root,'robotics/essay/index.html'),'utf8');
  const reportPage=fs.readFileSync(path.join(root,'robotics/report/index.html'),'utf8');
  assert.match(essayPage,/post-header-essay/);
  assert.match(essayPage,/post-layout-without-toc/);
  assert.match(essayPage,/post-layout-essay/);
  assert.doesNotMatch(essayPage,/<aside class="article-toc"/);
  assert.match(essayPage,/robotics-futures\.css\?v=/);
  assert.match(essayPage,/<h1>Essay title<\/h1>/);
  assert.match(essayPage,/rel="canonical" href="https:\/\/hadrien-cornier.github.io\/robotics\/essay\/"/);
  assert.match(reportPage,/<aside class="article-toc"/);
  assert.doesNotMatch(reportPage,/robotics-futures\.css|post-header-essay/);
  assert.doesNotMatch(essayPage,/robotics-market\.js|robotics-futures\.js/);
  assert.equal(renderArticle(essay).components.futures,true);
  assert.throws(()=>renderArticle(essay.replace('layout: essay','layout: invalid')),/layout must be essay/);
});

test('tags are optional but strict: 2 to 4 short lowercase tags, no duplicates', () => {
  const withTags = (tags) => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\ntags: ${tags}\n---\nBody.`);
  assert.deepEqual(renderArticle(frontmatter).tags, []);
  assert.deepEqual(withTags("['robotics', 'so-101']").tags, ['robotics', 'so-101']);
  assert.throws(() => withTags('robotics'), /2 to 4/);
  assert.throws(() => withTags("['one']"), /2 to 4/);
  assert.throws(() => withTags("['a', 'b', 'c', 'd', 'e']"), /2 to 4/);
  assert.throws(() => withTags("['Robotics', 'so-101']"), /short lowercase/);
  assert.throws(() => withTags("['so 101', 'control']"), /short lowercase/);
  assert.throws(() => withTags("['robotics', 'robotics']"), /Duplicate tag robotics/);
});

test('the search index carries title, description, tags, date and url but never drafts', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-search-index-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    writeFixture(path.join(sourceDir, 'published.md'), '---\ntitle: Published report\ndescription: A published description.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\ntags: [robotics, so-101]\n---\n\nBody.');
    writeFixture(path.join(sourceDir, 'drafted.md'), '---\ntitle: Draft report\ndescription: A draft description.\ndate: 2026-09-27\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\ndraft: true\ntags: [robotics, hidden]\n---\n\nUnfinished.');
    build(root);
    const indexFile = path.join(root, 'robotics/search-index.json');
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    assert.deepEqual(index, [{title:'Published report', description:'A published description.', tags:['robotics', 'so-101'], date:'2026-09-26', url:'/robotics/published/'}]);
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    assert.match(listing, /<script src="\/assets\/robotics-search\.js\?v=[a-f0-9]+" defer><\/script>/);
    assert.match(listing, /data-filter hidden/);
    assert.match(listing, /<label for="article-search">/);
    assert.match(listing, /data-filter-tag="robotics"[^>]*>robotics<span class="tag-count">1<\/span>/);
    assert.match(listing, /data-entry data-tags="robotics so-101"/);
    assert.doesNotMatch(listing, /Draft report|hidden<\/span>/);
    const page = fs.readFileSync(path.join(root, 'robotics/published/index.html'), 'utf8');
    assert.match(page, /<a class="tag-chip" href="\/tags\/so-101\/">so-101<\/a>/);
    assert.doesNotMatch(page, /<script[^>]*src="(?!\/assets\/theme\.js\?)/);
    build(root);
    assert.equal(fs.readFileSync(indexFile, 'utf8'), JSON.stringify(index, null, 2) + '\n');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('each tag gets a page that lists every article with it, newest first, across sections', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-tags-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeSeries(root);
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset>\n  <url>\n    <loc>https://hadrien-cornier.github.io/tags/gone/</loc>\n  </url>\n</urlset>');
    const article = (name, title, date, extra) => writeFixture(path.join(sourceDir, `${name}.md`), `---\ntitle: ${title}\ndescription: About ${title}.\ndate: ${date}\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n${extra}---\n\nBody.`);
    article('old-essay', 'Old essay', '2026-09-20', 'tags: [memory, control]\n');
    article('new-paper', 'New paper', '2026-09-28', "tags: [memory, vla]\nsection: 'recent-papers'\n");
    article('series-part', 'Series part', '2026-09-24', 'tags: [memory, control]\nseries: arm-series\npart: 1\n');
    article('hidden', 'Hidden draft', '2026-09-30', 'tags: [memory, secret]\ndraft: true\n');
    fs.mkdirSync(path.join(root, 'tags/gone'), {recursive:true});
    fs.writeFileSync(path.join(root, 'tags/gone/index.html'), '<!doctype html>\n<!-- Generated by scripts/build_robotics.mjs. -->\nold');
    build(root);
    const memory = fs.readFileSync(path.join(root, 'tags/memory/index.html'), 'utf8');
    assert.match(memory, /<h1 class="tag-title">memory<\/h1>/);
    assert.match(memory, /3 articles/);
    const order = ['new-paper', 'series-part', 'old-essay'].map((slug) => memory.indexOf(`<a class="card-link" href="/robotics/${slug}/">`));
    assert.ok(order.every((position) => position > 0) && order[0] < order[1] && order[1] < order[2], 'newest first');
    assert.match(memory, /<span class="report-part">Arm series · Part 1 of 1<\/span>/, 'a tag page lists series parts with their series');
    assert.match(memory, /<span class="report-part">Recent papers<\/span>/);
    assert.doesNotMatch(memory, /Hidden draft/);
    assert.ok(!fs.existsSync(path.join(root, 'tags/secret')));
    assert.match(fs.readFileSync(path.join(root, 'tags/vla/index.html'), 'utf8'), /1 article</);
    const tags = fs.readFileSync(path.join(root, 'tags/index.html'), 'utf8');
    for (const tag of ['control', 'memory', 'vla']) assert.match(tags, new RegExp(`<a class="tag-chip" href="/tags/${tag}/">${tag}<span class="tag-count">`));
    for (const page of ['robotics/old-essay/index.html', 'robotics/index.html', 'index.html']) {
      assert.match(fs.readFileSync(path.join(root, page), 'utf8'), /<a class="tag-chip" href="\/tags\/control\/">control<\/a>/, page);
    }
    // Cards keep one title link, so the tag links are not nested inside another link.
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8'), /<a class="report-card/);
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /<loc>https:\/\/hadrien-cornier\.github\.io\/tags\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/hadrien-cornier\.github\.io\/tags\/memory\/<\/loc>\n    <lastmod>2026-09-28<\/lastmod>/);
    assert.doesNotMatch(sitemap, /tags\/gone|tags\/secret/);
    assert.ok(!fs.existsSync(path.join(root, 'tags/gone')));
    build(root);
    assert.equal(fs.readFileSync(path.join(root, 'tags/memory/index.html'), 'utf8'), memory);
    assert.equal(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), sitemap);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('a section gets its own index page, a labelled card, and a sitemap entry; unknown sections fail', () => {
  const withSection = (section) => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n${section}---\nBody.`);
  assert.equal(withSection("section: 'recent-papers'\n").section, 'recent-papers');
  assert.equal(withSection('').section, undefined);
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-section-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    writeFixture(path.join(sourceDir, 'a-paper.md'), "---\ntitle: A paper\ndescription: About a paper.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nsection: 'recent-papers'\n---\n\nBody.");
    writeFixture(path.join(sourceDir, 'plain.md'), '---\ntitle: Plain essay\ndescription: Not a paper.\ndate: 2026-09-25\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n---\n\nBody.');
    build(root);
    const index = fs.readFileSync(path.join(root, 'robotics/recent-papers/index.html'), 'utf8');
    assert.match(index, /<h1>Recent papers I find fascinating\.<\/h1>/);
    assert.match(index, /href="\/robotics\/a-paper\/"/);
    assert.doesNotMatch(index, /Plain essay/);
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    assert.match(listing, /<a class="section-link" href="\/robotics\/recent-papers\/">/);
    assert.match(listing, /Plain essay/);
    const paper = fs.readFileSync(path.join(root, 'robotics/a-paper/index.html'), 'utf8');
    assert.match(paper, /<a class="eyebrow" href="\/robotics\/recent-papers\/">Writing \/ Recent papers<\/a>/);
    const plain = fs.readFileSync(path.join(root, 'robotics/plain/index.html'), 'utf8');
    assert.match(plain, /<a class="eyebrow" href="\/#writing">Writing \/ Robotics<\/a>/);
    assert.match(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /\/robotics\/recent-papers\//);
    build(root);
    assert.equal(fs.readFileSync(path.join(root, 'robotics/recent-papers/index.html'), 'utf8'), index);
    fs.unlinkSync(path.join(sourceDir, 'a-paper.md'));
    build(root);
    assert.ok(!fs.existsSync(path.join(root, 'robotics/recent-papers/index.html')));
    writeFixture(path.join(sourceDir, 'bad.md'), "---\ntitle: Bad\ndescription: Bad.\ndate: 2026-09-26\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\nsection: 'nope'\n---\nBody.");
    assert.throws(() => build(root), /section must be one of/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('a thumbnail shows on the index card, and a missing file or missing alt text fails', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-thumb-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.mkdirSync(path.join(root, 'assets'), {recursive:true});
    writeFixture(path.join(root, 'assets/fig.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const essay = (extra) => `---\ntitle: With figure\ndescription: Has a thumbnail.\ndate: 2026-09-26\n${extra}---\n\nBody.`;
    writeFixture(path.join(sourceDir, 'with-figure.md'), essay("thumbnail: '/assets/fig.svg'\nthumbnail_alt: 'A loop diagram.'\n"));
    writeFixture(path.join(sourceDir, 'plain.md'), '---\ntitle: Plain essay\ndescription: No figure.\ndate: 2026-09-25\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n---\n\nBody.');
    build(root);
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    assert.match(listing, /class="report-card has-thumb"[^>]*><span class="report-date">[\s\S]*?<span class="report-thumb"><img src="\/assets\/fig\.svg" alt="A loop diagram\." loading="lazy"/);
    assert.equal((listing.match(/report-thumb"/g) || []).length, 2);
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(home, /src="\/assets\/fig\.svg" alt="A loop diagram\." width="720" height="424"/);
    writeFixture(path.join(sourceDir, 'with-figure.md'), essay(''));
    assert.throws(() => build(root), /with-figure\.md: published article requires thumbnail and thumbnail_alt/);
    writeFixture(path.join(sourceDir, 'with-figure.md'), essay('draft: true\n'));
    build(root); // Unfinished drafts need no thumbnail.
    writeFixture(path.join(sourceDir, 'with-figure.md'), essay("draft: true\nthumbnail: '/assets/missing.svg'\nthumbnail_alt: 'x'\n"));
    assert.throws(() => build(root), /thumbnail file not found/);
    writeFixture(path.join(sourceDir, 'with-figure.md'), essay("thumbnail: '/assets/missing.svg'\nthumbnail_alt: 'x'\n"));
    assert.throws(() => build(root), /thumbnail file not found/);
    writeFixture(path.join(sourceDir, 'with-figure.md'), essay("thumbnail: '/assets/fig.svg'\n"));
    assert.throws(() => build(root), /thumbnail_alt/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});


test('different generated thumbnails cannot conceal a shared original source', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-thumb-source-'));
  try {
    const dir = path.join(root, 'content/robotics');
    fs.mkdirSync(dir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    for (const slug of ['one', 'two']) {
      fs.copyFileSync(new URL('./fixtures/thumbnail.svg', import.meta.url), path.join(root, `assets/${slug}.svg`));
      writeFixture(path.join(dir, `${slug}.md`), frontmatter.replace('/assets/fixture-thumbnail.svg', `/assets/${slug}.svg`) + 'Body.');
    }
    const manifest = path.join(dir, 'thumbnail-sources.json');
    writeFixture(manifest, JSON.stringify({'/assets/one.svg':'/assets/shared-original.png', '/assets/two.svg':'/assets/shared-original.png'}));
    assert.throws(() => build(root), /two\.md: duplicate original thumbnail source \/assets\/shared-original\.png; already used by one\.md/);
    writeFixture(manifest, JSON.stringify({'/assets/one.svg':'/assets/original-one.png', '/assets/two.svg':'/assets/original-two.png'}));
    build(root);
    fs.unlinkSync(manifest);
    writeFixture(path.join(dir, 'two.md'), frontmatter.replace('/assets/fixture-thumbnail.svg', '/assets/one.svg') + 'Body.');
    assert.throws(() => build(root), /duplicate original thumbnail source \/assets\/one\.svg/);
    fs.mkdirSync(path.join(root, 'assets/robotics/thumbnails'), {recursive:true});
    fs.copyFileSync(new URL('./fixtures/thumbnail.svg', import.meta.url), path.join(root, 'assets/robotics/thumbnails/two.svg'));
    writeFixture(path.join(dir, 'two.md'), frontmatter.replace('/assets/fixture-thumbnail.svg', '/assets/robotics/thumbnails/two.svg') + 'Body.');
    assert.throws(() => build(root), /two\.md: generated thumbnail needs original source/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

// An overview is part zero; its neighbours must still be ordered numerically.
test('a series can begin with part zero', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-zero-'));
  try {
    const dir = path.join(root, 'content/robotics');
    fs.mkdirSync(dir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    for (const part of [2, 0, 1]) writeFixture(path.join(dir, `part-${part}.md`), frontmatter.replace('Test report', `Part ${part}`).replace('---\n\n', `series: rl\npart: ${part}\n---\n\n`) + 'Body.');
    writeSeries(root, {rl:{title:'RL', description:'Problems first.'}});
    build(root);
    const page = fs.readFileSync(path.join(root, 'robotics/part-0/index.html'), 'utf8');
    assert.match(page, /Part 0 of 2/);
    assert.match(page, /rel="next" href="\/robotics\/part-1\//);
    assert.doesNotMatch(page, /rel="prev"/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

// Hadrien asked for each series to read as one block on the timeline, in date order with the other essays.
test('the writing timeline shows each series once, at the date of its newest part', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-series-timeline-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title, date, metadata = '') => `---\ntitle: ${title}\ndescription: ${title} description.\ndate: ${date}\nthumbnail: /assets/fixture-thumbnail.svg\nthumbnail_alt: A fixture diagram.\n${metadata}---\n\n${title} body.`;
    writeFixture(path.join(sourceDir, 'newest.md'), report('Newest essay', '2026-10-20'));
    for (const part of [1, 2, 3, 4]) writeFixture(path.join(sourceDir, `arm-${part}.md`), report(`Arm part ${part}`, `2026-10-0${part + 4}`, `series: arm-series\npart: ${part}\n`));
    writeFixture(path.join(sourceDir, 'middle.md'), report('Middle essay', '2026-10-15'));
    writeFixture(path.join(sourceDir, 'oldest.md'), report('Oldest essay', '2026-10-01'));
    writeFixture(path.join(sourceDir, 'short-a.md'), report('Short A', '2026-09-20', 'series: two-parts\npart: 1\n'));
    writeFixture(path.join(sourceDir, 'short-b.md'), report('Short B', '2026-10-25', 'series: two-parts\npart: 2\n'));
    writeSeries(root, {'arm-series':{title:'Arm series', description:'How an arm learns to move.'}, 'two-parts':{title:'Two parts', description:'A short pair.'}, 'unused':{title:'Unused', description:'No parts yet.'}});
    build(root);
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    for (const page of [home, listing]) {
      assert.equal(page.match(/id="series-arm-series"/g)?.length, 1);
      // Newest part of "Two parts" is the newest article; "Arm series" sits between the middle and oldest essays.
      const order = ['id="series-two-parts"', 'Newest essay', 'Middle essay', 'id="series-arm-series"', 'Oldest essay'].map((text) => page.indexOf(text));
      assert.ok(order.every((index, i) => index >= 0 && (i === 0 || index > order[i - 1])), `timeline order: ${order}`);
      assert.doesNotMatch(page, /Unused|other-essays-heading/);
      assert.match(page, /Series · 2 parts · <time datetime="2026-09-20">September 20\s–\sOctober 25, 2026<\/time>/);
      assert.match(page, /<script src="\/assets\/series-blocks\.js\?v=[0-9a-f]{12}" defer><\/script>/);
    }
    // Lists longer than three parts close on a phone; short ones always stay open.
    assert.match(home, /id="series-arm-series"[^]*?<details class="series-block-parts" open data-series-collapse><summary><span class="series-show">Show all 4 parts<\/span>/);
    assert.match(home, /id="series-two-parts"[^]*?<details class="series-block-parts" open><summary>/);
    assert.match(home, /<a class="series-block-start" href="\/robotics\/arm-1\/">Start with Part 1/);
    const part = fs.readFileSync(path.join(root, 'robotics/arm-3/index.html'), 'utf8');
    assert.match(part, /Series · Arm series<\/a><\/p><p class="series-box-position">Part 3 of 4<\/p>/);
    assert.match(part, /rel="prev" href="\/robotics\/arm-2\/">← Previous: Arm part 2</);
    assert.match(part, /rel="next" href="\/robotics\/arm-4\/">Next: Arm part 4 →</);
    const standalone = fs.readFileSync(path.join(root, 'robotics/middle/index.html'), 'utf8');
    assert.doesNotMatch(standalone, /series-box|series-blocks\.js/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('series ids must exist in series.json, and series.json entries need a title and description', () => {
  const root = fixtureRoot(path.join(os.tmpdir(), 'robotics-series-data-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    writeFixture(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    writeFixture(path.join(sourceDir, 'part.md'), frontmatter.replace('---\n\n', 'series: missing\npart: 1\n---\n\n') + 'Body.');
    writeSeries(root, {});
    assert.throws(() => build(root), /part\.md: series missing is not in content\/robotics\/series\.json/);
    writeSeries(root, {missing:{title:'Missing'}});
    assert.throws(() => build(root), /series\.json: missing needs a description/);
    writeSeries(root, {missing:{title:'Missing', description:'Here.', tagline:'No.'}});
    assert.throws(() => build(root), /series\.json: missing has unknown field tagline/);
    writeSeries(root, {'Bad Id':{title:'Bad', description:'Bad.'}});
    assert.throws(() => build(root), /series\.json: invalid series id Bad Id/);
    fs.writeFileSync(path.join(sourceDir, 'series.json'), '{');
    assert.throws(() => build(root), /series\.json must be valid JSON/);
    assert.throws(() => renderArticle(frontmatter.replace('---\n\n', 'series: Free text title\npart: 1\n---\n\n') + 'Body.'), /series must be a series id/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('series date ranges stay short and UTC', () => {
  assert.equal(dateRange('2026-10-02', '2026-10-02'), 'October 2, 2026');
  assert.match(dateRange('2026-10-02', '2026-10-15'), /^October 2\s–\s15, 2026$/);
  assert.match(dateRange('2025-12-30', '2026-01-02'), /^December 30, 2025\s–\sJanuary 2, 2026$/);
});
