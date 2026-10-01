import fs from 'node:fs';
import path from 'node:path';

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const modes = {designed:'Designed', learned:'Learned', persistent:'Persists'};
const fail = (message) => { throw new Error(`robotics-timeline: ${message}`); };
const object = (value, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${field} must be an object`);
  return value;
};
const text = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} must be nonempty text`);
  return value.trim();
};
const id = (value, field) => {
  const result = text(value, field);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(result)) fail(`${field} must be a lowercase hyphenated ID`);
  return result;
};
const array = (value, field) => {
  if (!Array.isArray(value) || !value.length) fail(`${field} must be a nonempty array`);
  return value;
};
const keys = (value, allowed, field) => {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`unknown ${field} field ${key}`);
};

/** Validate author data before any HTML or output page is written. */
export function parseTimeline(source, {root, headingIds = new Set(), usedIds = new Set()} = {}) {
  let data;
  try { data = JSON.parse(source); } catch { fail('the fence must contain valid JSON'); }
  object(data, 'data');
  keys(data, ['id', 'heading', 'intro', 'caption', 'roles', 'stages'], 'data');
  const timelineId = `timeline-${id(data.id, 'id')}`;
  const reserve = (value) => {
    if (usedIds.has(value)) fail(`duplicate HTML ID ${value}`);
    usedIds.add(value);
    return value;
  };
  reserve(timelineId);
  reserve(`${timelineId}-heading`);
  reserve(`${timelineId}-stack-heading`);
  reserve(`${timelineId}-status`);
  const roleIds = new Set();
  const roles = array(data.roles, 'roles').map((entry, index) => {
    object(entry, `roles[${index}]`);
    keys(entry, ['id', 'label', 'persistent'], 'role');
    const roleId = id(entry.id, `roles[${index}].id`);
    if (roleIds.has(roleId)) fail(`duplicate role ${roleId}`);
    roleIds.add(roleId);
    if (entry.persistent !== undefined && typeof entry.persistent !== 'boolean') fail(`${roleId}.persistent must be true or false`);
    return {id:roleId, label:text(entry.label, `${roleId}.label`), persistent:entry.persistent === true};
  });
  const stageIds = new Set();
  const stages = array(data.stages, 'stages').map((entry, index) => {
    object(entry, `stages[${index}]`);
    keys(entry, ['id', 'year', 'title', 'kicker', 'summary', 'mechanism', 'anchor', 'stack', 'sources', 'visual'], 'stage');
    const stageId = id(entry.id, `stages[${index}].id`);
    if (stageIds.has(stageId)) fail(`duplicate stage ${stageId}`);
    stageIds.add(stageId);
    const htmlId = reserve(`${timelineId}-${stageId}`);
    reserve(`${htmlId}-heading`);
    const stackIds = new Set();
    const authoredStack = array(entry.stack, `${stageId}.stack`).map((row) => {
      object(row, `${stageId}.stack row`);
      keys(row, ['role', 'text', 'mode'], 'stack');
      if (!roleIds.has(row.role)) fail(`${stageId} has unknown stack role ${row.role}`);
      if (stackIds.has(row.role)) fail(`${stageId} repeats stack role ${row.role}`);
      stackIds.add(row.role);
      if (!Object.hasOwn(modes, row.mode)) fail(`${stageId}.${row.role}.mode must be designed, learned, or persistent`);
      const role = roles.find((item) => item.id === row.role);
      if (role.persistent !== (row.mode === 'persistent')) fail(`${stageId}.${row.role} must match its role's persistent setting`);
      return {...role, text:text(row.text, `${stageId}.${row.role}.text`), mode:row.mode};
    });
    if (stackIds.size !== roles.length) fail(`${stageId}.stack must include every role exactly once`);
    const stack = roles.map((role) => authoredStack.find((row) => row.id === role.id));
    let anchor;
    if (entry.anchor !== undefined) {
      anchor = id(entry.anchor, `${stageId}.anchor`);
      if (!headingIds.has(anchor)) fail(`${stageId}.anchor does not match an article heading: ${anchor}`);
    }
    let sources = [];
    if (entry.sources !== undefined) {
      if (!Array.isArray(entry.sources)) fail(`${stageId}.sources must be an array`);
      sources = entry.sources.map((source) => {
        object(source, `${stageId}.source`);
        keys(source, ['label', 'href'], 'source');
        const href = text(source.href, `${stageId}.source.href`);
        let url;
        try { url = new URL(href); } catch { fail(`${stageId}.source.href must be an HTTPS URL`); }
        if (url.protocol !== 'https:' || url.username || url.password) fail(`${stageId}.source.href must be an HTTPS URL without credentials`);
        return {label:text(source.label, `${stageId}.source.label`), href};
      });
    }
    let visual;
    if (entry.visual !== undefined) {
      object(entry.visual, `${stageId}.visual`);
      keys(entry.visual, ['src', 'alt', 'caption'], 'visual');
      const src = text(entry.visual.src, `${stageId}.visual.src`);
      if (!/^\/assets\/robotics\/[a-zA-Z0-9/_-]+\.(png|svg|webp)$/.test(src)) fail(`${stageId}.visual.src must be a local robotics PNG, SVG, or WebP`);
      if (root && !fs.existsSync(path.join(root, src))) fail(`missing visual ${src}`);
      visual = {src, alt:text(entry.visual.alt, `${stageId}.visual.alt`), caption:entry.visual.caption === undefined ? '' : text(entry.visual.caption, `${stageId}.visual.caption`)};
    }
    return {
      id:stageId, htmlId, year:text(entry.year, `${stageId}.year`), title:text(entry.title, `${stageId}.title`),
      kicker:entry.kicker === undefined ? '' : text(entry.kicker, `${stageId}.kicker`), summary:text(entry.summary, `${stageId}.summary`),
      mechanism:text(entry.mechanism, `${stageId}.mechanism`), anchor, stack, sources, visual,
    };
  });
  return {id:timelineId, heading:text(data.heading, 'heading'), intro:text(data.intro, 'intro'), caption:data.caption === undefined ? '' : text(data.caption, 'caption'), roles, stages};
}

function renderStack(rows) {
  return `<dl class="rt-stack">${rows.map((row) => `<div class="rt-stack-row rt-stack-${row.mode}" data-stack-role="${escape(row.id)}"><dt>${escape(row.label)}<span class="rt-mode">${modes[row.mode]}</span></dt><dd>${escape(row.text)}</dd></div>`).join('')}</dl>`;
}

/** The same stage data supplies the static cards and the enhanced stack readout. */
export function renderTimeline(data) {
  const {id:timelineId, stages} = data;
  const controls = stages.map((stage, index) => `<li><a href="#${stage.htmlId}" data-timeline-control="${stage.id}"><span class="rt-control-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span>${escape(stage.year)}</span><span class="rt-control-title">${escape(stage.title)}</span></a></li>`).join('');
  const cards = stages.map((stage, index) => `<li class="rt-stage" id="${stage.htmlId}" data-timeline-stage="${stage.id}" tabindex="-1" aria-labelledby="${stage.htmlId}-heading"${stage.anchor ? ` data-section-anchor="${escape(stage.anchor)}"` : ''}>
<div class="rt-node" aria-hidden="true"><span>${String(index + 1).padStart(2, '0')}</span></div>
<div class="rt-stage-content"><header><p class="rt-year">${escape(stage.year)}${stage.kicker ? `<span>${escape(stage.kicker)}</span>` : ''}</p><h3 id="${stage.htmlId}-heading">${escape(stage.title)}</h3></header>
<p class="rt-summary">${escape(stage.summary)}</p><p class="rt-mechanism"><span>How it works</span>${escape(stage.mechanism)}</p>
${stage.visual ? `<figure class="rt-visual"><img src="${escape(stage.visual.src)}" alt="${escape(stage.visual.alt)}" loading="lazy" decoding="async">${stage.visual.caption ? `<figcaption>${escape(stage.visual.caption)}</figcaption>` : ''}</figure>` : ''}
<div class="rt-static-stack"><p class="rt-small-label">Control stack</p>${renderStack(stage.stack)}</div>
${stage.anchor || stage.sources.length ? `<footer class="rt-stage-links">${stage.anchor ? `<a href="#${escape(stage.anchor)}">Read this section <span aria-hidden="true">↗</span></a>` : ''}${stage.sources.length ? `<ul aria-label="Sources for ${escape(stage.title)}">${stage.sources.map((source) => `<li><a href="${escape(source.href)}">${escape(source.label)}</a></li>`).join('')}</ul>` : ''}</footer>` : ''}</div></li>`).join('\n');
  return `<section class="robotics-timeline" id="${timelineId}" data-robotics-timeline aria-labelledby="${timelineId}-heading">
<header class="rt-heading"><p class="rt-small-label">A connected timeline</p><h2 id="${timelineId}-heading">${escape(data.heading)}</h2><p>${escape(data.intro)}</p></header>
<nav class="rt-nav" aria-label="${escape(data.heading)} stages"><ol>${controls}</ol></nav>
<div class="rt-layout"><aside class="rt-inspector" aria-labelledby="${timelineId}-stack-heading" hidden><div class="rt-inspector-inner"><p class="rt-small-label">At this stage</p><h3 id="${timelineId}-stack-heading">Control stack</h3><p class="rt-inspector-stage" data-timeline-current-title></p><div data-timeline-current-stack aria-hidden="true"></div><div class="rt-paging"><button type="button" data-timeline-previous aria-label="Previous timeline stage">←</button><span data-timeline-position></span><button type="button" data-timeline-next aria-label="Next timeline stage">→</button></div></div></aside>
<ol class="rt-track">${cards}</ol></div>
${data.caption ? `<p class="rt-caption">${escape(data.caption)}</p>` : ''}<p class="rt-sr-only" id="${timelineId}-status" role="status" aria-live="polite" aria-atomic="true" data-timeline-status></p>
</section>\n`;
}

export function timelineProse(data) {
  return [data.heading, data.intro, data.caption, ...data.stages.flatMap((stage) => [stage.year, stage.title, stage.kicker, stage.summary, stage.mechanism, ...stage.stack.flatMap((row) => [row.label, row.text]), stage.visual?.caption || ''])].join(' ');
}
