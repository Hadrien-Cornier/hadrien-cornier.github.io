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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-timeline-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    fs.writeFileSync(path.join(root, 'content/robotics/timeline.md'), timelineFixture);
    fs.writeFileSync(path.join(root, 'content/robotics/plain.md'), frontmatter + 'A plain article.');
    fs.writeFileSync(path.join(root, 'content/robotics/geometry.md'), frontmatter + '## How do we describe gripper position mathematically?\n\n```robotics-arm\n```');
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
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

test('series validates metadata, orders parts, and omits draft parts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-series-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title, date, metadata = '') => `---\ntitle: ${title}\ndescription: ${title} description.\ndate: ${date}\n${metadata}---\n\n${title} body.`;
    fs.writeFileSync(path.join(sourceDir, 'series-one.md'), report('Series part one', '2026-09-26', 'series: Arm series\npart: 1\n'));
    fs.writeFileSync(path.join(sourceDir, 'series-two.md'), report('Series part two', '2026-09-28', 'series: Arm series\npart: 2\n'));
    fs.writeFileSync(path.join(sourceDir, 'series-draft.md'), report('Unpublished part', '2026-09-29', 'draft: true\nseries: Arm series\npart: 3\n'));
    fs.writeFileSync(path.join(sourceDir, 'standalone.md'), report('Latest standalone', '2026-10-01'));
    build(root);
    const first = fs.readFileSync(path.join(root, 'robotics/series-one/index.html'), 'utf8');
    const second = fs.readFileSync(path.join(root, 'robotics/series-two/index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(first, /<nav class="series-box" aria-label="Series">[\s\S]*Part 1 of 2/);
    assert.match(first, /aria-current="page">Series part one/);
    assert.match(first, /rel="next" href="\/robotics\/series-two\/"/);
    assert.match(second, /rel="prev" href="\/robotics\/series-one\/"/);
    assert.doesNotMatch(first, /Unpublished part/);
    const listingBlock = listing.match(/<section class="series-block">[\s\S]*?<\/section>/)?.[0];
    assert.ok(listingBlock);
    assert.ok(listingBlock.indexOf('series-one') < listingBlock.indexOf('series-two'));
    assert.ok(listing.indexOf('Latest standalone') < listing.indexOf('Arm series'));
    const homeBlock = home.match(/<section class="series-block series-block-home">[\s\S]*?<\/section>/)?.[0];
    assert.ok(homeBlock);
    assert.ok(homeBlock.indexOf('series-one') < homeBlock.indexOf('series-two'));
    assert.match(homeBlock, /Series \/ 2 parts/);
    assert.match(homeBlock, /writing-row-number">Part 1</);
    assert.match(listingBlock, /report-part">Part 2</);
    assert.doesNotMatch(listing + home, /Unpublished part/);
    assert.throws(() => renderArticle(`---\ntitle: Series\ndescription: Test.\ndate: 2026-09-26\nseries: Arm series\n---\nBody.`), /part is required/);
    assert.throws(() => renderArticle(`---\ntitle: Series\ndescription: Test.\ndate: 2026-09-26\nseries: Arm series\npart: 0\n---\nBody.`), /positive integer/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('a hardware track part gets its own class and label in the series', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-series-track-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title, date, metadata = '') => `---\ntitle: ${title}\ndescription: ${title} description.\ndate: ${date}\n${metadata}---\n\n${title} body.`;
    fs.writeFileSync(path.join(sourceDir, 'control-part.md'), report('Control part', '2026-09-26', 'series: Arm series\npart: 1\n'));
    fs.writeFileSync(path.join(sourceDir, 'hardware-part.md'), report('Hardware part', '2026-09-28', 'series: Arm series\npart: 2\ntrack: hardware\n'));
    build(root);
    const control = fs.readFileSync(path.join(root, 'robotics/control-part/index.html'), 'utf8');
    const hardware = fs.readFileSync(path.join(root, 'robotics/hardware-part/index.html'), 'utf8');
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(hardware, /<body class="robotics track-hardware">/);
    assert.match(control, /<body class="robotics">/);
    assert.match(hardware, /Part 2 of 2 · Hardware/);
    assert.match(control, /<li class="series-part track-hardware"><a href="\/robotics\/hardware-part\/">Hardware part<\/a><span class="track-tag">Hardware<\/span>/);
    assert.match(listing, /report-card track-hardware" href="\/robotics\/hardware-part\/"/);
    assert.match(listing, /report-part">Part 2 · Hardware</);
    assert.match(home, /writing-row track-hardware" href="\/robotics\/hardware-part\/"/);
    assert.throws(() => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\nseries: Arm series\npart: 1\ntrack: wood\n---\nBody.`), /track must be one of: hardware/);
    assert.throws(() => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\ntrack: hardware\n---\nBody.`), /track requires series/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('published series reject duplicate part numbers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-series-duplicate-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const report = (title) => `---\ntitle: ${title}\ndescription: Duplicate part.\ndate: 2026-09-26\nseries: Arm series\npart: 1\n---\nBody.`;
    fs.writeFileSync(path.join(sourceDir, 'one.md'), report('One'));
    fs.writeFileSync(path.join(sourceDir, 'two.md'), report('Two'));
    assert.throws(() => build(root), /Duplicate part 1 in series Arm series/);
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-widget-build-'));
  try {
    fs.mkdirSync(path.join(root, 'content/robotics'), {recursive:true});
    fs.writeFileSync(path.join(root, 'content/robotics/widget.md'), widget);
    fs.writeFileSync(path.join(root, 'content/robotics/plain.md'), frontmatter + 'A plain article.');
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    build(root);
    const widgetPage = fs.readFileSync(path.join(root, 'robotics/widget/index.html'), 'utf8');
    const plainPage = fs.readFileSync(path.join(root, 'robotics/plain/index.html'), 'utf8');
    assert.match(widgetPage, /<script type="module" src="\/assets\/so101-widgets\.js\?v=[a-f0-9]+"><\/script>/);
    assert.doesNotMatch(plainPage, /so101-widgets\.js/);
  } finally { fs.rmSync(root, {recursive:true,force:true}); }
});

test('redirects write small moved pages, survive cleanup, and reject bad targets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-redirect-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    fs.writeFileSync(path.join(sourceDir, 'new-home.md'), frontmatter + '## Moved section\n\nText.');
    fs.writeFileSync(path.join(sourceDir, 'redirects.json'), JSON.stringify({'old-home':'/robotics/new-home/#moved-section'}));
    build(root);
    const page = fs.readFileSync(path.join(root, 'robotics/old-home/index.html'), 'utf8');
    assert.match(page, /http-equiv="refresh" content="0; url=\/robotics\/new-home\/#moved-section"/);
    assert.match(page, /rel="canonical" href="https:\/\/hadrien-cornier\.github\.io\/robotics\/new-home\/#moved-section"/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), /old-home/);
    build(root);
    assert.ok(fs.existsSync(path.join(root, 'robotics/old-home/index.html')), 'a second build must keep the redirect');
    for (const bad of [{'new-home':'/robotics/new-home/'}, {'old-home':'https://example.com/'}, {'old-home':'/robotics/missing/'}]) {
      fs.writeFileSync(path.join(sourceDir, 'redirects.json'), JSON.stringify(bad));
      assert.throws(() => build(root), /Redirect/);
    }
    fs.unlinkSync(path.join(sourceDir, 'redirects.json'));
    build(root);
    assert.ok(!fs.existsSync(path.join(root, 'robotics/old-home/index.html')), 'a removed redirect must disappear');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('essay presentation keeps a centered reading path and loads figure styles only where needed', t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'robotics-essay-layout-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'content/robotics'),{recursive:true});
  fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset></urlset>');
  const figure='<figure class="rf-figure" aria-label="Conditional example"><p>Possible constraint</p></figure>';
  const essay=frontmatter.replace('Test report','Essay title').replace('---\n\n','layout: essay\n---\n\n')+'## One question\n\nA concrete opening.\n\n'+figure;
  fs.writeFileSync(path.join(root,'content/robotics/essay.md'),essay);
  fs.writeFileSync(path.join(root,'content/robotics/report.md'),frontmatter+'## A report section\n\nExisting report prose.');
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
  const withTags = (tags) => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\ntags: ${tags}\n---\nBody.`);
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-search-index-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    fs.writeFileSync(path.join(sourceDir, 'published.md'), '---\ntitle: Published report\ndescription: A published description.\ndate: 2026-09-26\ntags: [robotics, so-101]\n---\n\nBody.');
    fs.writeFileSync(path.join(sourceDir, 'drafted.md'), '---\ntitle: Draft report\ndescription: A draft description.\ndate: 2026-09-27\ndraft: true\ntags: [robotics, hidden]\n---\n\nUnfinished.');
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
    assert.match(page, /<a class="tag-chip" href="\/robotics\/#tag-so-101">so-101<\/a>/);
    assert.doesNotMatch(page, /<script[^>]*src="(?!\/assets\/theme\.js\?)/);
    build(root);
    assert.equal(fs.readFileSync(indexFile, 'utf8'), JSON.stringify(index, null, 2) + '\n');
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('a section gets its own index page, a labelled card, and a sitemap entry; unknown sections fail', () => {
  const withSection = (section) => renderArticle(`---\ntitle: T\ndescription: Test.\ndate: 2026-09-26\n${section}---\nBody.`);
  assert.equal(withSection("section: 'recent-papers'\n").section, 'recent-papers');
  assert.equal(withSection('').section, undefined);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-section-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    fs.writeFileSync(path.join(sourceDir, 'a-paper.md'), "---\ntitle: A paper\ndescription: About a paper.\ndate: 2026-09-26\nsection: 'recent-papers'\n---\n\nBody.");
    fs.writeFileSync(path.join(sourceDir, 'plain.md'), '---\ntitle: Plain essay\ndescription: Not a paper.\ndate: 2026-09-25\n---\n\nBody.');
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
    fs.writeFileSync(path.join(sourceDir, 'bad.md'), "---\ntitle: Bad\ndescription: Bad.\ndate: 2026-09-26\nsection: 'nope'\n---\nBody.");
    assert.throws(() => build(root), /section must be one of/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('a thumbnail shows on the index card, and a missing file or missing alt text fails', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-thumb-'));
  try {
    const sourceDir = path.join(root, 'content/robotics');
    fs.mkdirSync(sourceDir, {recursive:true});
    fs.mkdirSync(path.join(root, 'assets'), {recursive:true});
    fs.writeFileSync(path.join(root, 'assets/fig.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    fs.writeFileSync(path.join(root, 'sitemap.xml'), '<urlset></urlset>');
    const essay = (extra) => `---\ntitle: With figure\ndescription: Has a thumbnail.\ndate: 2026-09-26\n${extra}---\n\nBody.`;
    fs.writeFileSync(path.join(sourceDir, 'with-figure.md'), essay("thumbnail: '/assets/fig.svg'\nthumbnail_alt: 'A loop diagram.'\n"));
    fs.writeFileSync(path.join(sourceDir, 'plain.md'), '---\ntitle: Plain essay\ndescription: No figure.\ndate: 2026-09-25\n---\n\nBody.');
    build(root);
    const listing = fs.readFileSync(path.join(root, 'robotics/index.html'), 'utf8');
    assert.match(listing, /class="report-card has-thumb"[^>]*><span class="report-date">[\s\S]*?<span class="report-thumb"><img src="\/assets\/fig\.svg" alt="A loop diagram\." loading="lazy"/);
    assert.equal((listing.match(/report-thumb"/g) || []).length, 1);
    fs.writeFileSync(path.join(sourceDir, 'with-figure.md'), essay("thumbnail: '/assets/missing.svg'\nthumbnail_alt: 'x'\n"));
    assert.throws(() => build(root), /thumbnail file not found/);
    fs.writeFileSync(path.join(sourceDir, 'with-figure.md'), essay("thumbnail: '/assets/fig.svg'\n"));
    assert.throws(() => build(root), /thumbnail_alt/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
