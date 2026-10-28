import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
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
    // A video file through WebKit's software decoder wedges the next navigation.
    if (pathname.endsWith('.mp4')) {
      res.writeHead(204);
      res.end();
      return;
    }
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

function within(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (err) => { clearTimeout(timer); reject(err); });
  });
}

function processRows() {
  const out = spawnSync('ps', ['-ax', '-o', 'pid=,ppid=,command='], {encoding: 'utf8'}).stdout || '';
  const rows = [];
  for (const line of out.split('\n')) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+([\s\S]+)$/);
    if (match) rows.push({pid: Number(match[1]), ppid: Number(match[2]), command: match[3]});
  }
  return rows;
}

// Playwright 1.49's Browser has no process(). The bash wrapper and Playwright binary are the children to kill.
function webKitPids() {
  const rows = processRows();
  const family = new Set([process.pid]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const row of rows) {
      if (family.has(row.ppid) && !family.has(row.pid)) {
        family.add(row.pid);
        grew = true;
      }
    }
  }
  return rows.filter((row) => family.has(row.pid) && /webkit|Playwright/.test(row.command)).map((row) => row.pid);
}

function killTree(roots) {
  if (!roots || !roots.length) return;
  const rows = processRows();
  const kill = new Set(roots);
  let grew = true;
  while (grew) {
    grew = false;
    for (const row of rows) {
      if (kill.has(row.ppid) && !kill.has(row.pid)) {
        kill.add(row.pid);
        grew = true;
      }
    }
  }
  for (const pid of kill) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  }
}

// Launches overlap, so take the new pids one browser at a time.
let launchChain = Promise.resolve();
function launchPaintBrowser() {
  const run = launchChain.then(async () => {
    const before = new Set(webKitPids());
    const browser = await webkit.launch();
    return {browser, pids: webKitPids().filter((pid) => !before.has(pid))};
  });
  launchChain = run.then(() => {}, () => {});
  return run;
}

async function boardShot(page, selector, index) {
  // Crop a piece of the board that is on screen. An element screenshot of the first .rc-panel
  // scrolls that panel against the sticky listener and never settles, and a full-element shot of
  // a multi-thousand-pixel svg is the buffer WebKit already fails to paint.
  // Query by index. A locator would wait on the placeholder the snapshot replaces.
  // page.evaluate has no timeout of its own, and a stuck main thread would hold the whole run.
  // An empty phone figure has the board color before its snapshot arrives. That is not a blank drawing.
  await page.waitForFunction(({selector, index}) => {
    const el = document.querySelectorAll(selector)[index];
    return !!(el && (el.matches('svg') || el.querySelector('svg')));
  }, {selector, index}, {timeout: 600}).catch(() => {});
  const box = await within(page.evaluate(({selector, index}) => {
    const el = document.querySelectorAll(selector)[index];
    if (!el || !(el.matches('svg') || el.querySelector('svg'))) return null;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return null;
    const rect = el.getBoundingClientRect();
    const top = Math.max(rect.top, 0);
    const left = Math.max(rect.left, 0);
    const right = Math.min(rect.right, window.innerWidth);
    const bottom = Math.min(rect.bottom, window.innerHeight);
    const width = Math.min(720, Math.max(0, right - left));
    const height = Math.min(520, Math.max(0, bottom - top));
    if (width < 20 || height < 20) return null;
    return {x: left, y: top, width, height};
  }, {selector, index}), 8_000, 'board measure timed out');
  if (!box) return null;
  const buffer = await within(
    page.screenshot({type: 'png', animations: 'disabled', timeout: 18_000, clip: box}),
    20_000,
    'board shot timed out',
  );
  return distinctColors(buffer);
}

async function prepare(page, origin) {
  // Third-party frames (the YouTube embeds) must finish or WebKit never fires
  // DOMContentLoaded. An aborted frame can sit there for the whole timeout.
  await page.route(/^https?:\/\//, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('.mp4')) return route.abort();
    if (url.origin === origin) return route.continue();
    if (route.request().resourceType() === 'document') {
      return route.fulfill({status: 200, contentType: 'text/html', body: '<!doctype html><title></title>'});
    }
    return route.abort();
  });
  // Reduced motion removes the chalk filter, so a check that leaves it on misses boards that are blank for readers.
  await page.emulateMedia({reducedMotion: 'no-preference', colorScheme: 'dark'});
}

async function openPaintPage(browser, origin, mode) {
  const page = await browser.newPage({
    viewport: {width: mode.width, height: mode.height},
    deviceScaleFactor: mode.deviceScaleFactor,
  });
  await prepare(page, origin);
  return page;
}

async function reveal(page, selector, index) {
  await within(page.evaluate(({selector, index}) => {
    const el = document.querySelectorAll(selector)[index];
    if (!el) return;
    // A whole-canvas phone figure is taller than the screen. The drawing is the active
    // panel, which may sit below the top of that figure.
    const tall = el.getBoundingClientRect().height > window.innerHeight + 40;
    const panel = tall && (el.querySelector('.rc-panel.is-active') || el.querySelector('.rc-panel'));
    (panel || el).scrollIntoView({block: tall ? 'start' : 'center'});
  }, {selector, index}), 8_000, 'board scroll timed out');
  await page.waitForTimeout(80);
}

test('every robotics board paints in WebKit', {timeout: 300_000}, async (t) => {
  const slugs = articleSlugs();
  assert.ok(slugs.length >= 30, `expected at least 30 built articles, found ${slugs.length}`);
  let server;
  // close() waits out a wedged pipe for the driver's three-minute launch timeout.
  // Kill the WebKit pids first, or node --test stays up after the result.
  const browsers = new Set();
  const browserPids = new Map();
  const closeBrowser = async (b) => {
    if (!b || !browsers.delete(b)) return;
    killTree(browserPids.get(b));
    browserPids.delete(b);
    await within(b.close().catch(() => {}), 2_000, 'browser close timed out').catch(() => {});
  };
  const ownBrowser = async () => {
    const launched = await launchPaintBrowser();
    browsers.add(launched.browser);
    browserPids.set(launched.browser, launched.pids);
    return launched.browser;
  };
  t.after(async () => {
    // A wedged WebProcess must not hold node --test after the run.
    await Promise.all([...browsers].map((b) => closeBrowser(b)));
    if (server) server.close();
    server = null;
  });
  server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const failures = [];
  let painted = 0;
  try {
    // All three densities, every article, one after another. Side by side, a WebKit
    // screenshot on the runner stops returning and a different essay fails each run.
    // In the old series loop, dpr1 alone passed 90s and then kept launching WebKit.
    for (const mode of MODES) {
      if (t.signal.aborted) break;
      let modeBrowser;
      let page;
      const reopen = async () => {
        if (t.signal.aborted) return;
        const dying = modeBrowser;
        modeBrowser = await ownBrowser();
        page = await openPaintPage(modeBrowser, origin, mode);
        await closeBrowser(dying);
      };
      try {
        modeBrowser = await ownBrowser();
        page = await openPaintPage(modeBrowser, origin, mode);
        let openedCount = 0;
        for (const slug of slugs) {
          if (t.signal.aborted) break;
          // A fresh page every twelve essays. One page for a whole density is what wedged WebKit.
          if (openedCount > 0 && openedCount % 12 === 0) {
            await within(page.close().catch(() => {}), 3_000, 'page close timed out').catch(() => {});
            if (t.signal.aborted) break;
            page = await openPaintPage(modeBrowser, origin, mode);
          }
          openedCount += 1;
          if (process.env.CI) process.stderr.write(`paint ${mode.name} ${slug}\n`);
          let opened = false;
          for (let attempt = 0; attempt < 2 && !opened; attempt++) {
            if (t.signal.aborted) break;
            try {
              // .mp4 answers 204 and other origins are stubbed, so DOMContentLoaded fires.
              // commit returns before stylesheets and the board script have run.
              await within(page.goto(`${origin}/robotics/${slug}/`, {waitUntil: 'domcontentloaded', timeout: 8_000}), 10_000, 'open timed out');
              await page.waitForSelector('article', {timeout: 4_000});
              await page.waitForFunction(() => {
                // canvas.js sets data-mode on .rc. A short board's #rc figure never gets it.
                const rc = document.querySelector('.rc');
                if (!rc) return true;
                return !!rc.getAttribute('data-mode') || !rc.querySelector('svg.rc-svg');
              }, null, {timeout: 1_500}).catch(() => {});
              const boards = page.locator(mode.boards);
              const count = await boards.count();
              let saw = false;
              // One board per essay. Walking every phone figure is what wedged Linux WebKit.
              if (count > 0) {
                await reveal(page, mode.boards, 0);
                let colors = await boardShot(page, mode.boards, 0);
                // A 35px strip of the bar is not the drawing. Scroll again and take the richer shot.
                if (!colors || colors.height < 60 || colors.colors < MIN_COLORS) {
                  await page.waitForTimeout(300);
                  await reveal(page, mode.boards, 0);
                  const again = await boardShot(page, mode.boards, 0);
                  if (again && (!colors || again.colors > colors.colors)) colors = again;
                }
                if (colors) {
                  saw = true;
                  painted += 1;
                  if (colors.colors < MIN_COLORS) {
                    failures.push(`${slug} ${mode.name} board 0 is blank (${colors.colors} colors in ${colors.width}x${colors.height})`);
                  }
                }
              }
              const tall = mode.lastMark && await within(page.evaluate(() => {
                const svg = document.querySelector('svg.rc-svg');
                return !!svg && svg.getBoundingClientRect().height * 2 > 4000;
              }), 3_000, 'board height timed out').catch(() => false);
              if (tall) {
                const marks = page.locator('.rc-mark');
                const markCount = await marks.count();
                if (markCount > 1) {
                  await reveal(page, '.rc-mark', markCount - 1);
                  await page.waitForTimeout(80);
                  let colors = await boardShot(page, '.rc-stage', 0);
                  if (!colors || colors.height < 60 || colors.colors < MIN_COLORS) {
                    await page.waitForTimeout(300);
                    await reveal(page, '.rc-stage', 0);
                    const again = await boardShot(page, '.rc-stage', 0);
                    if (again && (!colors || again.colors > colors.colors)) colors = again;
                  }
                  if (colors) {
                    saw = true;
                    painted += 1;
                    if (colors.colors < MIN_COLORS) {
                      failures.push(`${slug} ${mode.name} last mark is blank (${colors.colors} colors in ${colors.width}x${colors.height})`);
                    }
                  }
                }
              }
              if (!saw) {
                // A board inside a closed drawer, or the hidden live stage on a phone, is not on screen.
                const onScreen = await page.evaluate((selector) => [...document.querySelectorAll(selector)].some((el) => {
                  const svg = el.matches('svg') ? el : el.querySelector('svg.rc-svg');
                  if (!svg) return false;
                  let node = svg;
                  while (node) {
                    if (getComputedStyle(node).display === 'none' || getComputedStyle(node).visibility === 'hidden') return false;
                    node = node.parentElement;
                  }
                  const rect = svg.getBoundingClientRect();
                  const width = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
                  const height = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                  return width > 20 && height > 20;
                }), mode.boards);
                if (onScreen) failures.push(`${slug} ${mode.name} has a board but no screenshot`);
              }
              opened = true;
            } catch (err) {
              if (t.signal.aborted) break;
              if (attempt === 1) failures.push(`${slug} ${mode.name} did not open: ${err.message.split('\n')[0]}`);
              await reopen();
            }
          }
        }
      } catch (err) {
        if (!t.signal.aborted) failures.push(`${mode.name} stopped: ${err.message.split('\n')[0]}`);
      } finally {
        if (page) await within(page.close().catch(() => {}), 3_000, 'page close timed out').catch(() => {});
        await closeBrowser(modeBrowser);
      }
    }
  } finally {
    await Promise.all([...browsers].map((b) => closeBrowser(b)));
    if (server) server.close();
    server = null;
  }
  if (t.signal.aborted) return;
  assert.ok(painted >= 10, `only snapshotted ${painted} boards`);
  assert.deepEqual(failures, []);
});
