import fs from 'node:fs';
import path from 'node:path';

const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const GROUPS = {
  'versatile-focused': {title:'Versatile body · focused workflow', caption:'Many possible movements. A narrower job today.', map:true},
  'versatile-broad': {title:'Versatile body · broader model direction', caption:'Broader model direction. Demonstrated skills remain bounded.', map:true},
  'bounded-focused': {title:'Bounded body · focused workflow', caption:'A defined machine or workcell, doing a defined job.', map:true},
  'bounded-broad': {title:'Bounded body · broader model direction', caption:'A broader manipulation model on a constrained setup.', map:true},
  providers: {title:'Brains and deployment layers', caption:'Supported bodies depend on the model, integration and customer setup.'},
  infrastructure: {title:'The enabling layer', caption:'Models, deployment tools, simulation and components that do not specify one deployed body.'},
  uncertain: {title:'Not placed yet', caption:'Identity or public evidence is too thin for a useful placement.'},
};

export function parseMarket(content, root) {
  let config;
  try { config = JSON.parse(content); } catch { throw new Error('robotics-market requires valid JSON'); }
  if (!config || typeof config.data !== 'string' || !/^\/assets\/robotics\/[a-z0-9-]+\/[a-z0-9-]+\.json$/.test(config.data)) throw new Error('robotics-market data must be a local robotics JSON asset');
  const data = JSON.parse(fs.readFileSync(path.join(root, config.data), 'utf8'));
  if (!Array.isArray(data.companies) || !data.companies.length) throw new Error('robotics-market requires companies');
  const ids = new Set();
  for (const company of data.companies) {
    if (!/^[a-z0-9-]+$/.test(company.id) || ids.has(company.id)) throw new Error('Company IDs must be unique slugs');
    ids.add(company.id);
    if (!GROUPS[company.group]) throw new Error(`Unknown market group: ${company.group}`);
    for (const key of ['name','summary','placement','integration']) if (typeof company[key] !== 'string' || !company[key].trim()) throw new Error(`${company.id} requires ${key}`);
    if (!Array.isArray(company.sources) || (!company.sources.length && company.group !== 'uncertain')) throw new Error(`${company.id} requires public sources`);
    for (const source of company.sources) {
      if (!source.label || !/^https:\/\//.test(source.url)) throw new Error(`${company.id} requires labeled HTTPS sources`);
    }
  }
  return data;
}

export function renderMarket({companies, checked}) {
  const blocks = Object.entries(GROUPS).filter(([,g]) => g.map).map(([id, group]) => {
    const entries = companies.filter(c => c.group === id);
    const featured = entries.filter(c => c.featured);
    return `<section class="rm-cell" aria-label="${escape(group.title)}"><p class="rm-cell-label">${escape(group.title)}</p><p class="rm-cell-caption">${escape(group.caption)}</p><div class="rm-map-names">${featured.map(c => `<a href="#company-${c.id}" data-company-jump="${c.id}"><span>${escape(c.name)}</span>${c.mapNote ? `<small>${escape(c.mapNote)}</small>` : ''}${c.provider ? '<span class="rm-provider" aria-label="Brain or deployment provider">↗</span>' : ''}</a>`).join('') || '<span class="rm-empty-cell">A reusable manipulation policy on a fixed arm fits here. See the model-provider rail below.</span>'}</div><p class="rm-cell-count">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} in the directory</p></section>`;
  }).join('');
  const providers = companies.filter(c => c.group === 'providers');
  const rail = `<div class="rm-provider-rail"><p class="rm-cell-label">Brains and deployment layers</p><p class="rm-cell-caption">Body depends on the customer setup. Cross-embodiment evidence is in each entry.</p><div class="rm-map-names">${providers.filter(c=>c.featured).map(c=>`<a href="#company-${c.id}" data-company-jump="${c.id}">${escape(c.name)}</a>`).join('')}</div></div>`;
  const directory = companies.map(c => `<details class="rm-company" id="company-${c.id}" data-group="${c.group}" data-search="${escape([c.name,c.summary,c.integration,c.embodiments || '',GROUPS[c.group].title].join(' ').toLowerCase())}"><summary><span class="rm-company-name">${escape(c.name)}</span><span class="rm-badge">${escape(c.integration)}</span></summary><div class="rm-company-body"><p class="rm-summary">${escape(c.summary)}</p><dl><div><dt>Placement</dt><dd>${escape(c.placement)}</dd></div>${c.crossEmbodiment ? `<div><dt>Cross-body transfer</dt><dd>${escape(c.crossEmbodiment)}</dd></div>` : ''}${c.embodiments ? `<div><dt>Body evidence</dt><dd>${escape(c.embodiments)}</dd></div>` : ''}</dl><p class="rm-source-label">Public sources</p><ul class="rm-sources">${c.sources.map(s=>`<li><a href="${escape(s.url)}">${escape(s.label)} <span aria-hidden="true">↗</span></a></li>`).join('') || '<li>Unresolved name. No company claim made.</li>'}</ul></div></details>`).join('');
  return `<figure class="robotics-market" aria-labelledby="market-title"><div class="rm-heading"><p class="rm-kicker">A map of the approaches</p><p id="market-title" class="rm-title">Two questions. Four corners.</p></div><p class="rm-axis-y"><span aria-hidden="true">↑</span> Body: bounded setup → versatile mobile manipulation</p><div class="rm-grid">${blocks}</div><div class="rm-axis-x"><span>Focused workflow</span><strong>Task / model breadth →</strong><span>Broader model direction</span></div>${rail}<figcaption>Qualitative placements from public evidence${checked ? `, checked ${escape(checked)}` : ''}. Corners describe approaches, not measured scores or a capability ranking. The broader side includes model direction; labels distinguish current work from ambition. Model providers sit in a separate rail because they do not specify a single deployed body. Integration is listed separately below.</figcaption></figure><details class="rm-directory" aria-label="Company evidence directory"><summary class="rm-directory-title">Explore ${companies.length} entries and their sources</summary><p class="rm-directory-intro">${companies.length} entries, including the enabling layer and unresolved names. Sources report the companies’ own work; these are not independent replications. Open any entry for the reasoning and sources.</p><div class="rm-controls" hidden><label for="market-search">Find a company<input id="market-search" type="search" placeholder="Name, approach, or body" autocomplete="off"></label><label for="market-filter">Show<select id="market-filter"><option value="all">All approaches</option>${Object.entries(GROUPS).map(([id,g])=>`<option value="${id}">${escape(g.title)}</option>`).join('')}</select></label><p class="rm-results" role="status" aria-live="polite"></p></div><div class="rm-company-list">${directory}</div><p class="rm-no-results" hidden>No matching companies. Try a different name or show all approaches.</p></details>`;
}
