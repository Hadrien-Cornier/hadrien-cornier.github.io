import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {webkit} = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARDS = '.rc-view, figure.short-board, svg.rc-svg';
// A blank board is a flat field. Chalk drawings stay well above this after coarse sampling.
const MIN_COLORS = 80;

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.json': 'application/json',
    '.mp4': 'video/mp4',
  }[path.extname(file)] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const file = path.normalize(path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname));
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader('content-type', contentType(file));
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function distinctColors(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.toString('ascii', offset, offset + 4);
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (bitDepth !== 8 || !channels) throw new Error(`unsupported screenshot png ${colorType}/${bitDepth}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const seen = new Set();
  let pos = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const row = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? row[i - channels] : 0;
      const up = prev[i];
      const ul = i >= channels ? prev[i - channels] : 0;
      if (filter === 1) row[i] = (row[i] + left) & 255;
      else if (filter === 2) row[i] = (row[i] + up) & 255;
      else if (filter === 3) row[i] = (row[i] + ((left + up) >> 1)) & 255;
      else if (filter === 4) row[i] = (row[i] + paeth(left, up, ul)) & 255;
      else if (filter !== 0) throw new Error(`bad png filter ${filter}`);
    }
    prev = row;
    if (y % 2) continue;
    for (let x = 0; x < width; x += 2) {
      const i = x * channels;
      if (channels === 4 && row[i + 3] < 16) continue;
      seen.add(((row[i] >> 3) << 10) | ((row[i + 1] >> 3) << 5) | (row[i + 2] >> 3));
    }
  }
  return {width, height, colors: seen.size};
}

function articleSlugs() {
  return fs.readdirSync(path.join(root, 'content/robotics'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -3))
    .filter((slug) => fs.existsSync(path.join(root, 'robotics', slug, 'index.html')))
    .sort();
}

async function reveal(page, locator) {
  for (let i = 0; i < 24; i++) {
    const box = await locator.boundingBox();
    if (box && box.width >= 80 && box.height >= 80 && box.y < 180 && box.y + box.height > 280) return box;
    await page.mouse.wheel(0, box && box.y < 80 ? -500 : 500);
    await page.waitForTimeout(20);
  }
  return locator.boundingBox();
}

async function diagnose(page, locator) {
  const notes = [];
  const geometry = await page.evaluate(() => {
    const svg = document.querySelector('svg.rc-svg');
    if (!svg) return 'no svg';
    const box = svg.getBBox();
    return `css ${svg.style.width}x${svg.style.height} transform ${svg.style.transform} bbox ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)} chalk ${!!document.getElementById('bb-chalk')}`;
  });
  notes.push(geometry);
  await page.evaluate(() => document.querySelectorAll('svg.rc-svg').forEach((svg) => svg.style.setProperty('filter', 'none', 'important')));
  const bare = await boardShot(page, locator);
  notes.push(`filter none ${bare ? bare.colors : 'no shot'}`);
  await page.evaluate(() => document.querySelectorAll('svg.rc-svg').forEach((svg) => svg.style.removeProperty('filter')));
  const kids = await page.evaluate(() => [...document.querySelector('svg.rc-svg').children].map((el, i) => ({
    i, tag: el.tagName, panel: el.getAttribute('data-panel') || el.getAttribute('class') || '',
  })));
  for (const kid of kids) {
    await page.evaluate((i) => { document.querySelector('svg.rc-svg').children[i].setAttribute('display', 'none'); }, kid.i);
    const shot = await boardShot(page, locator);
    notes.push(`hide ${kid.i} ${kid.tag} ${kid.panel} ${shot ? shot.colors : 'no shot'}`);
    await page.evaluate((i) => { document.querySelector('svg.rc-svg').children[i].removeAttribute('display'); }, kid.i);
  }
  return notes.join(' | ');
}

async function boardShot(page, locator) {
  const box = await reveal(page, locator);
  if (!box || box.width < 80 || box.height < 80) return null;
  const view = page.viewportSize();
  const x = Math.max(0, box.x);
  const y = Math.max(0, box.y);
  const width = Math.min(box.x + box.width, view.width) - x;
  const height = Math.min(box.y + box.height, view.height, y + 420) - y;
  if (width < 80 || height < 80) return null;
  return distinctColors(await page.screenshot({clip: {x, y, width, height}, type: 'png'}));
}

test('every robotics board paints in WebKit', {timeout: 300_000}, async () => {
  const slugs = articleSlugs();
  assert.ok(slugs.length >= 30, `expected at least 30 built articles, found ${slugs.length}`);
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await webkit.launch();
  const failures = [];
  let painted = 0;
  try {
    const page = await browser.newPage({viewport: {width: 1200, height: 900}, deviceScaleFactor: 1});
    // Reduced motion removes the chalk filter, so a check that leaves it on misses boards that are blank for readers.
    await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'dark'});
    for (const slug of slugs) {
      await page.goto(`${origin}/robotics/${slug}/`, {waitUntil: 'networkidle'});
      await page.evaluate(() => document.querySelectorAll('details').forEach((el) => { el.open = true; }));
      const boards = page.locator(BOARDS);
      const count = await boards.count();
      let saw = false;
      for (let index = 0; index < count; index++) {
        const colors = await boardShot(page, boards.nth(index));
        if (!colors) continue;
        saw = true;
        painted += 1;
        if (colors.colors < MIN_COLORS) {
          failures.push(`${slug} board ${index} is blank (${colors.colors} colors in ${colors.width}x${colors.height}); ${await diagnose(page, boards.nth(index))}`);
        }
      }
      if (!saw && await page.locator('svg.rc-svg').count()) failures.push(`${slug} has a board but no screenshot`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  assert.ok(painted >= 10, `only snapshotted ${painted} boards`);
  assert.deepEqual(failures, []);
});
