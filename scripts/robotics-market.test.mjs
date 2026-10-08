import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parseMarket, renderMarket} from './robotics-market.mjs';
import {renderArticle} from './build_robotics.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'robotics-market-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  const filename = path.join(root, 'assets/robotics/test/companies.json');
  fs.mkdirSync(path.dirname(filename), {recursive:true});
  const company = {id:'sample',name:'Sample <robot>',group:'bounded-broad',summary:'Reported demo & its limits.',placement:'Interpretation.',integration:'Brain provider',featured:true,provider:true,sources:[{label:'Original evidence',url:'https://example.org/evidence'}]};
  const write = data => fs.writeFileSync(filename, JSON.stringify(data));
  write({companies:[company],checked:'2026-10-08'});
  return {root, company, write, config:JSON.stringify({data:'/assets/robotics/test/companies.json'})};
}
test('market evidence renders without JavaScript and is escaped', t => {
  const f = fixture(t);
  const data = parseMarket(f.config, f.root);
  const html = renderMarket(data);
  assert.match(html, /Sample &lt;robot&gt;/);
  assert.match(html, /href="https:\/\/example.org\/evidence"/);
  assert.match(html, /id="company-sample"/);
  assert.match(html, /data-company-jump="sample"/);
  assert.match(html, /class="rm-controls" hidden/);
  assert.doesNotMatch(html, /<script/);
  const article = renderArticle('---\ntitle: A map\ndescription: Test\ndate: 2026-10-08\n---\n\n```robotics-market\n'+f.config+'\n```', f.root);
  assert.equal(article.components.market, true);
  assert.match(article.body, /Original evidence/);
});
test('market refuses missing evidence, duplicate identities, unsafe links and traversal', t => {
  const f = fixture(t);
  assert.throws(() => parseMarket('{"data":"/assets/robotics/test/../companies.json"}', f.root), /local robotics/);
  f.write({companies:[{...f.company,sources:[]}]});
  assert.throws(() => parseMarket(f.config, f.root), /public sources/);
  f.write({companies:[f.company,f.company]});
  assert.throws(() => parseMarket(f.config, f.root), /unique slugs/);
  f.write({companies:[{...f.company,sources:[{label:'Bad',url:'javascript:alert(1)'}]}]});
  assert.throws(() => parseMarket(f.config, f.root), /HTTPS/);
});
