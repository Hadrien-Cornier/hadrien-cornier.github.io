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
// A blank board is a flat field. Chalk drawings stay well above this after coarse sampling.
const MIN_COLORS = 40;
const MODES = [
  {name: 'dpr1', width: 1200, height: 900, deviceScaleFactor: 1, boards: '.rc-stage, figure.short-board', lastMark: false},
  {name: 'dpr2', width: 1440, height: 900, deviceScaleFactor: 2, boards: '.rc-stage, figure.short-board', lastMark: true},
  {name: 'dpr3', width: 430, height: 900, deviceScaleFactor: 3, boards: '.rc-fig .rc-fig-view, figure.short-board', lastMark: false},
];

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

async function boardShot(page, locator) {
  // Crop the part of the board that is on screen. An element screenshot of the first .rc-panel
  // scrolls that panel against the sticky listener and never settles, and a full-element shot of
  // a multi-thousand-pixel svg is the buffer WebKit already fails to paint.
  const box = await locator.evaluate((el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return null;
    const rect = el.getBoundingClientRect();
    const top = Math.max(rect.top, 0);
    const left = Math.max(rect.left, 0);
    const right = Math.min(rect.right, window.innerWidth);
    const bottom = Math.min(rect.bottom, window.innerHeight);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    if (width < 20 || height < 20) return null;
    return {x: left, y: top, width, height};
  }, null, {timeout: 5_000}).catch(() => null);
  if (!box) return null;
  let buffer;
  try {
    buffer = await page.screenshot({type: 'png', animations: 'disabled', timeout: 8_000, clip: box});
  } catch {
    return null;
  }
  return distinctColors(buffer);
}

async function reveal(page, selector, index) {
  await page.evaluate(({selector, index}) => {
    const el = document.querySelectorAll(selector)[index];
    if (!el) return;
    // A whole-canvas phone figure is taller than the screen and draws its panel at the top.
    // Centering it photographs the empty board below that panel.
    const block = el.getBoundingClientRect().height > window.innerHeight + 40 ? 'start' : 'center';
    el.scrollIntoView({block});
  }, {selector, index});
  await page.waitForTimeout(350);
}

test('every robotics board paints in WebKit', {timeout: 720_000}, async () => {
  const slugs = articleSlugs();
  assert.ok(slugs.length >= 30, `expected at least 30 built articles, found ${slugs.length}`);
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await webkit.launch();
  const failures = [];
  let painted = 0;
  try {
    for (const mode of MODES) {
      const page = await browser.newPage({
        viewport: {width: mode.width, height: mode.height},
        deviceScaleFactor: mode.deviceScaleFactor,
      });
      // Judge locally served board paint without waiting for third-party embeds.
      await page.route(/^https?:\/\//, (route) =>
        new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      // Reduced motion removes the chalk filter, so a check that leaves it on misses boards that are blank for readers.
      await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'dark'});
      for (const slug of slugs) {
        await page.goto(`${origin}/robotics/${slug}/`, {waitUntil: 'domcontentloaded', timeout: 30_000});
        await page.waitForTimeout(300);
        const boards = page.locator(mode.boards);
        const count = await boards.count();
        let saw = false;
        for (let index = 0; index < count; index++) {
          await reveal(page, mode.boards, index);
          const colors = await boardShot(page, boards.nth(index));
          if (!colors) continue;
          saw = true;
          painted += 1;
          if (colors.colors < MIN_COLORS) {
            failures.push(`${slug} ${mode.name} board ${index} is blank (${colors.colors} colors in ${colors.width}x${colors.height})`);
          }
        }
        if (mode.lastMark) {
          const marks = page.locator('.rc-mark');
          const markCount = await marks.count();
          if (markCount > 1) {
            await reveal(page, '.rc-mark', markCount - 1);
            await page.waitForTimeout(200);
            const stage = page.locator('.rc-stage').first();
            const colors = await boardShot(page, stage);
            if (colors) {
              saw = true;
              painted += 1;
              if (colors.colors < MIN_COLORS) {
                failures.push(`${slug} ${mode.name} last mark is blank (${colors.colors} colors in ${colors.width}x${colors.height})`);
              }
            }
          }
        }
        if (!saw && await page.locator('svg.rc-svg').count()) failures.push(`${slug} ${mode.name} has a board but no screenshot`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  assert.ok(painted >= 10, `only snapshotted ${painted} boards`);
  assert.deepEqual(failures, []);
});
