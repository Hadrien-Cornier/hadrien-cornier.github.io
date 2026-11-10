// Four small interactive figures for "Why LLM reinforcement learning breaks on robots".
// Each render function returns {svg, readout} for one state, so the build writes the default state as the
// static fallback and the page redraws the same markup when a control changes.

const K = {board: '#1d2824', ink: '#f4f1e8', muted: '#b3b7ae', faint: '#55605a', yellow: '#f0d98a', green: '#8fbf94', red: '#dc896f', blue: '#70a2bf', amber: '#e0a458'};
const f = (v, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
const sgn = (v, d = 2) => { const z = Math.abs(v) < 0.5 * 10 ** -d; return `${z ? '' : v > 0 ? '+' : '−'}${f(Math.abs(v), d)}`; };
const txt = (x, y, s, {size = 14, fill = K.muted, anchor = 'start', weight = ''} = {}) => `<text x="${f(x, 1)}" y="${f(y, 1)}" font-size="${size}" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${weight ? ` font-weight="${weight}"` : ''}>${s}</text>`;
const ln = (x1, y1, x2, y2, stroke, w = 1.5, extra = '') => `<line x1="${f(x1, 1)}" y1="${f(y1, 1)}" x2="${f(x2, 1)}" y2="${f(y2, 1)}" stroke="${stroke}" stroke-width="${w}"${extra}/>`;
const arrow = (x1, y1, x2, y2, stroke, w = 3) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 9;
  const p = (d) => `${f(x2 - h * Math.cos(a + d), 1)},${f(y2 - h * Math.sin(a + d), 1)}`;
  return ln(x1, y1, x2, y2, stroke, w, ' stroke-linecap="round"') + `<polygon points="${f(x2, 1)},${f(y2, 1)} ${p(0.5)} ${p(-0.5)}" fill="${stroke}"/>`;
};

export function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());

// 1. Two clocks: one action chunk is 50 robot steps x 29 joints. Each denoising step refines all 1,450 numbers.
export const CLOCKS = {steps: 50, joints: 29};
function chunkPair(seed = 3) {
  const r = random(seed), {steps, joints} = CLOCKS;
  const a0 = [], a1 = [];
  for (let j = 0; j < joints; j++) {
    const amp = 0.8 + 1.2 * r(), freq = 0.4 + 1.4 * r(), phase = 2 * Math.PI * r(), off = (r() - 0.5) * 0.8;
    a0.push(Array.from({length: steps}, () => gauss(r)));
    a1.push(Array.from({length: steps}, (_, k) => off + amp * Math.sin(2 * Math.PI * freq * k / steps + phase)));
  }
  return {a0, a1};
}
const PAIR = chunkPair();
const heat = (v) => {
  const m = Math.min(1, Math.abs(v) / 2.4), c = v > 0 ? [240, 217, 138] : [112, 162, 191], b = [29, 40, 36];
  return `rgb(${c.map((x, i) => Math.round(b[i] + (x - b[i]) * m)).join(',')})`;
};
export function renderClocks({k}) {
  const t = k / 10, {steps, joints} = CLOCKS, cw = 6.4, ch = 4.4, x0 = 46, y0 = 34;
  const at = PAIR.a0.map((row, j) => row.map((v, s) => (1 - t) * v + t * PAIR.a1[j][s]));
  let s = `<rect width="420" height="330" fill="${K.board}"/>`;
  s += txt(x0, 22, `denoising clock: step ${k} of 10, t = ${f(t, 1)}`, {fill: K.yellow, size: 15, weight: 700});
  for (let j = 0; j < joints; j++) for (let c = 0; c < steps; c++) s += `<rect x="${f(x0 + c * cw, 1)}" y="${f(y0 + j * ch, 1)}" width="${cw}" height="${ch}" fill="${heat(at[j][c])}"/>`;
  s += `<rect x="${x0}" y="${y0}" width="${steps * cw}" height="${joints * ch}" fill="none" stroke="${K.muted}" stroke-width="1"/>`;
  s += `<text transform="translate(30,${f(y0 + joints * ch / 2, 1)}) rotate(-90)" text-anchor="middle" font-size="13" fill="${K.muted}">29 joints</text>`;
  s += txt(x0 + steps * cw / 2, y0 + joints * ch + 18, 'robot clock τ: 50 control steps = 1 s at 50 Hz →', {anchor: 'middle', size: 13});
  const py0 = 232, ph = 76, X = (c) => x0 + c * cw + cw / 2, Y = (v) => py0 + ph / 2 - v * ph / 6.5;
  s += ln(x0, py0 + ph / 2, x0 + steps * cw, py0 + ph / 2, K.faint, 1);
  [[2, K.yellow], [11, K.green], [23, K.blue]].forEach(([j, color], i) => {
    s += `<polyline points="${at[j].map((v, c) => `${f(X(c), 1)},${f(Y(v), 1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="1.8"/>`;
    s += txt(x0 + steps * cw + 8, py0 + 14 + i * 18, `joint ${j + 1}`, {fill: color, size: 13});
  });
  s += txt(x0, py0 - 6, 'three of the 29 joints, across the whole second', {size: 13});
  const readout = k === 0
    ? 'Step 0: all 1,450 numbers are noise. The robot has not moved.'
    : k === 10
      ? 'Step 10: the chunk is finished. Only now does the robot play its 50 control steps.'
      : `Step ${k}: one network call just updated all 1,450 numbers at once. The robot still has not moved.`;
  return {svg: s, readout};
}

// 2. The trace: one backward pass returns one row of the 1,450 x 1,450 Jacobian, and the trace needs every diagonal entry.
export const TRACE_N = 1450;
export function renderTrace({passes}) {
  const N = TRACE_N, x0 = 40, y0 = 40, S = 260, cell = S / N;
  let s = `<rect width="420" height="350" fill="${K.board}"/>`;
  s += txt(x0, 26, '∂v/∂a at one Euler step: 1,450 × 1,450', {fill: K.ink, size: 14, weight: 700});
  s += `<rect x="${x0}" y="${y0}" width="${S}" height="${S}" fill="${K.faint}" fill-opacity=".25" stroke="${K.muted}"/>`;
  if (passes > 0) {
    const done = Math.min(passes, N) * cell;
    s += `<rect x="${x0}" y="${y0}" width="${S}" height="${f(done, 2)}" fill="${K.muted}" fill-opacity=".18"/>`;
    s += ln(x0, y0, x0 + done, y0 + done, K.yellow, 3, ' stroke-linecap="round"');
    const row = y0 + (Math.min(passes, N) - 0.5) * cell;
    s += `<rect x="${x0}" y="${f(row - 1.5, 1)}" width="${S}" height="3" fill="${K.red}"/>`;
    s += `<circle cx="${f(x0 + (Math.min(passes, N) - 0.5) * cell, 1)}" cy="${f(row, 1)}" r="4.5" fill="${K.yellow}"/>`;
  }
  s += ln(x0, y0, x0 + S, y0 + S, K.yellow, 1, ' stroke-dasharray="3 4" stroke-opacity=".6"');
  const lx = x0 + S + 14;
  s += txt(lx, y0 + 16, 'one pass:', {size: 13}) + txt(lx, y0 + 33, 'one row', {fill: K.red, size: 13});
  s += txt(lx, y0 + 62, 'keep 1 entry', {fill: K.yellow, size: 13}) + txt(lx, y0 + 79, 'drop 1,449', {size: 13});
  s += txt(lx, y0 + 120, 'trace =', {fill: K.ink, size: 13}) + txt(lx, y0 + 137, 'sum of the', {size: 13}) + txt(lx, y0 + 154, 'diagonal', {fill: K.yellow, size: 13});
  const pct = Math.min(passes, N) / N;
  s += `<rect x="${x0}" y="${y0 + S + 14}" width="${S}" height="8" fill="${K.faint}" fill-opacity=".4"/><rect x="${x0}" y="${y0 + S + 14}" width="${f(S * pct, 1)}" height="8" fill="${K.yellow}"/>`;
  s += txt(x0, y0 + S + 40, `backward passes: ${passes.toLocaleString('en-US')} of 1,450 for this step`, {fill: K.ink, size: 13});
  const readout = passes >= N
    ? 'All 1,450 diagonal entries are known, so this Euler step has its trace. The chunk has 10 Euler steps: 14,500 backward passes for one log-probability. Sampling the same chunk took 10 forward passes.'
    : `${passes.toLocaleString('en-US')} of 1,450 diagonal entries are known. The trace of this one Euler step is still unknown.`;
  return {svg: s, readout};
}

// 3. The log trick and the baseline, on two actions: pi = 0.9 and 0.1, Q = 2 and 10, theta = pi(right).
export const TWO = {p: [0.9, 0.1], q: [2, 10], dp: [-1, 1], V: 0.9 * 2 + 0.1 * 10};
export function update(mode, i) {
  const {p, q, dp, V} = TWO;
  if (mode === 'raw') return dp[i] * q[i];
  if (mode === 'log') return (dp[i] / p[i]) * q[i];
  return (dp[i] / p[i]) * (q[i] - V);
}
export const expected = (mode) => TWO.p[0] * update(mode, 0) + TWO.p[1] * update(mode, 1);
export function drawSamples(count, seed) {
  const r = random(seed);
  return Array.from({length: count}, () => (r() < TWO.p[1] ? 1 : 0));
}
const MODE_LABEL = {raw: '∇π · Q', log: '(∇π / π) · Q', base: '(∇π / π) · (Q − V)'};
export function renderLogTrick({mode, samples}) {
  const vals = samples.map((i) => update(mode, i)), mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const x0 = 44, y0 = 40, W = 350, H = 220, lo = -10, hi = 100, Y = (v) => y0 + H - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * H;
  let s = `<rect width="420" height="330" fill="${K.board}"/>`;
  s += txt(x0, 24, `update on each sample: ${MODE_LABEL[mode]}`, {fill: K.ink, size: 14, weight: 700});
  [0, 25, 50, 75, 100].forEach((v) => { s += ln(x0, Y(v), x0 + W, Y(v), K.faint, 1) + txt(x0 - 6, Y(v) + 4, String(v), {anchor: 'end', size: 12}); });
  s += ln(x0, Y(0), x0 + W, Y(0), K.muted, 1.4);
  const show = vals.slice(0, 20), bw = W / show.length;
  show.forEach((v, k) => {
    const color = samples[k] ? K.yellow : K.blue, top = Math.min(Y(v), Y(0)), h = Math.max(1.5, Math.abs(Y(v) - Y(0)));
    s += `<rect x="${f(x0 + k * bw + bw * 0.18, 1)}" y="${f(top, 1)}" width="${f(bw * 0.64, 1)}" height="${f(h, 1)}" fill="${color}"/>`;
  });
  s += ln(x0, Y(8), x0 + W, Y(8), K.green, 1.8, ' stroke-dasharray="6 4"') + txt(x0 + W, Y(8) - 6, 'true gradient 8', {anchor: 'end', fill: K.green, size: 13});
  s += ln(x0, Y(mean), x0 + W, Y(mean), K.red, 2.2) + txt(x0 + 4, Y(mean) - 6, `average of ${vals.length.toLocaleString('en-US')}: ${sgn(mean, 2)}`, {fill: K.red, size: 13});
  s += txt(x0, y0 + H + 22, `${show.length < vals.length ? `first ${show.length} of ${vals.length.toLocaleString('en-US')} draws` : `${vals.length} draws`}:`, {size: 13});
  s += `<rect x="${x0 + 118}" y="${y0 + H + 12}" width="10" height="10" fill="${K.blue}"/>` + txt(x0 + 132, y0 + H + 22, 'left, π = 0.9, Q = 2', {size: 13});
  s += `<rect x="${x0 + 118}" y="${y0 + H + 30}" width="10" height="10" fill="${K.yellow}"/>` + txt(x0 + 132, y0 + H + 40, 'right, π = 0.1, Q = 10', {size: 13});
  s += txt(x0, y0 + H + 62, `this estimator's expected value: ${sgn(expected(mode), 2)}`, {fill: K.ink, size: 13});
  const wrong = vals.filter((v) => v < 0).length;
  const readout = mode === 'raw'
    ? `Without dividing by π, the samples average toward ${sgn(expected(mode), 1)}, the wrong sign: frequent actions are counted too often.`
    : mode === 'log'
      ? `Dividing by π fixes the average (expected value 8), but ${wrong} of the ${vals.length.toLocaleString('en-US')} samples still push θ the wrong way, toward the action that earns 2.`
      : `Subtracting the baseline V = 2.8 keeps the expected value at 8, and now every sample pushes θ toward the action that earns 10.`;
  return {svg: s, readout};
}

// 4. The cliff paradox: Q(a) = 8 − (a − 1.5)², a Gaussian policy N(mu, 1). One sample can split the two families;
// their averages over the whole bell agree. The page integrates both estimators numerically to show it.
export const Qc = (a) => 8 - (a - 1.5) ** 2, dQ = (a) => -2 * (a - 1.5), Vc = (mu) => 7 - (mu - 1.5) ** 2;
export function expectations(mu) {
  let es = 0, ep = 0, z = 0;
  for (let e = -8; e <= 8; e += 0.001) {
    const w = Math.exp(-e * e / 2), a = mu + e;
    es += w * (Qc(a) - Vc(mu)) * e; ep += w * dQ(a); z += w;
  }
  return {score: es / z, path: ep / z};
}
export function renderCliff({mu, a}) {
  const x0 = 44, y0 = 30, W = 352, H = 190, amin = -2.5, amax = 4.5, qmin = -8.5, qmax = 9;
  const X = (v) => x0 + (v - amin) / (amax - amin) * W, Y = (q) => y0 + (qmax - Math.max(qmin, q)) / (qmax - qmin) * H;
  const V = Vc(mu), A = Qc(a) - V, gs = A * (a - mu), gp = dQ(a), E = expectations(mu);
  let s = `<rect width="420" height="370" fill="${K.board}"/>`;
  // shade where one sample sends the two families opposite ways
  for (let v = amin; v < amax; v += 0.02) {
    const s1 = Math.sign((Qc(v) - V) * (v - mu)), s2 = Math.sign(dQ(v));
    if (s1 && s2 && s1 !== s2) s += `<rect x="${f(X(v), 1)}" y="${y0}" width="${f(X(v + 0.02) - X(v) + 0.3, 2)}" height="${H}" fill="${K.amber}" fill-opacity=".16"/>`;
  }
  s += ln(x0, y0 + H, x0 + W, y0 + H, K.muted, 1.2) + ln(x0, y0, x0, y0 + H, K.muted, 1.2);
  [-2, 0, 2, 4].forEach((v) => { s += txt(X(v), y0 + H + 15, String(v), {anchor: 'middle', size: 12}); });
  [0, 4, 8].forEach((q) => { s += txt(x0 - 6, Y(q) + 4, String(q), {anchor: 'end', size: 12}); });
  s += txt(x0 + W, y0 + H + 32, 'action a (wrist torque) →', {anchor: 'end', size: 13});
  s += `<text transform="translate(16,${y0 + H / 2}) rotate(-90)" text-anchor="middle" font-size="13" fill="${K.muted}">return Q(s, a)</text>`;
  const pts = []; for (let v = amin; v <= amax; v += 0.05) pts.push(`${f(X(v), 1)},${f(Y(Qc(v)), 1)}`);
  s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${K.ink}" stroke-width="2.2"/>`;
  s += ln(x0, Y(V), x0 + W, Y(V), K.muted, 1.2, ' stroke-dasharray="5 4"') + txt(x0 + 4, Y(V) - 5, `V = ${f(V, 2)}`, {size: 12});
  // the policy's bell along the bottom
  const bell = []; for (let v = amin; v <= amax; v += 0.05) bell.push(`${f(X(v), 1)},${f(y0 + H - 34 * Math.exp(-((v - mu) ** 2) / 2), 1)}`);
  s += `<polyline points="${bell.join(' ')}" fill="none" stroke="${K.blue}" stroke-width="1.6"/>` + ln(X(mu), y0 + H, X(mu), y0 + H - 34, K.blue, 1.2, ' stroke-dasharray="3 3"');
  s += txt(X(mu), y0 + H - 38, `μ = ${f(mu, 1)}`, {anchor: 'middle', fill: K.blue, size: 12});
  // the sample, its height above V and its slope
  s += ln(X(a), Y(V), X(a), Y(Qc(a)), K.green, 2) + `<circle cx="${f(X(a), 1)}" cy="${f(Y(Qc(a)), 1)}" r="5" fill="${K.yellow}"/>`;
  const dx = 0.6; s += ln(X(a - dx), Y(Qc(a) - dx * gp), X(a + dx), Y(Qc(a) + dx * gp), K.red, 2);
  // the two single-sample updates to mu, drawn to the same scale
  const by = y0 + H + 58, scale = 14, clampA = (g) => Math.max(-8.5, Math.min(8.5, g));
  s += txt(x0, by - 14, 'one sample moves μ:', {fill: K.ink, size: 13});
  s += txt(x0, by + 12, 'family 1', {fill: K.green, size: 13}) + txt(x0, by + 42, 'family 2', {fill: K.red, size: 13});
  const cx = x0 + 190;
  s += ln(cx, by - 4, cx, by + 50, K.faint, 1);
  if (Math.abs(gs) > 0.02) s += arrow(cx, by + 8, cx + clampA(gs) * scale, by + 8, K.green);
  if (Math.abs(gp) > 0.02) s += arrow(cx, by + 38, cx + clampA(gp) * scale, by + 38, K.red);
  s += txt(x0 + W, by + 12, sgn(gs, 1), {anchor: 'end', fill: K.green, size: 13}) + txt(x0 + W, by + 42, sgn(gp, 1), {anchor: 'end', fill: K.red, size: 13});
  s += txt(x0, by + 72, `averaged over the bell: family 1 ${sgn(E.score, 3)} · family 2 ${sgn(E.path, 3)}`, {fill: K.yellow, size: 13});
  const split = Math.sign(gs) && Math.sign(gp) && Math.sign(gs) !== Math.sign(gp);
  const readout = `Sample a = ${f(a, 1)}: Q = ${f(Qc(a), 2)}, so A = ${sgn(A, 2)}. Family 1 moves μ by A·(a − μ) = ${sgn(gs, 2)}; family 2 moves μ by ∂Q/∂a · ∂a/∂μ = ${sgn(gp, 2)} × 1. ${split ? 'They disagree on this sample' : 'They agree on this sample'}, and their averages over the whole bell are both ${sgn(E.path, 3)}.`;
  return {svg: s, readout};
}

// Page wiring. The static drawing is the default state; controls appear once this runs.
export function hydrate(root = document) {
  root.querySelectorAll('[data-widget]').forEach((fig) => {
    const svg = fig.querySelector('svg'), out = fig.querySelector('.fsim-readout'), controls = fig.querySelector('.fsim-controls');
    const val = (k) => controls.querySelector(`[data-k="${k}"]`);
    const show = ({svg: body, readout}) => { svg.innerHTML = body; out.textContent = readout; };
    const kind = fig.dataset.widget;
    if (kind === 'clocks') {
      const draw = () => { val('k').nextElementSibling.textContent = val('k').value; show(renderClocks({k: +val('k').value})); };
      controls.addEventListener('input', draw);
    } else if (kind === 'trace') {
      let passes = 0;
      const draw = () => show(renderTrace({passes}));
      controls.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const step = b.dataset.k; passes = step === 'reset' ? 0 : step === 'all' ? TRACE_N : Math.min(TRACE_N, passes + +step); draw();
      }));
    } else if (kind === 'logtrick') {
      let seed = 11, count = 10;
      const draw = () => show(renderLogTrick({mode: controls.querySelector('input[name="lt-mode"]:checked').value, samples: drawSamples(count, seed)}));
      controls.addEventListener('change', draw);
      controls.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { seed += 1; count = +b.dataset.k; draw(); }));
    } else if (kind === 'cliff') {
      const draw = () => {
        const mu = +val('mu').value, a = +val('a').value;
        val('mu').nextElementSibling.textContent = mu.toFixed(1); val('a').nextElementSibling.textContent = a.toFixed(1);
        show(renderCliff({mu, a}));
      };
      controls.addEventListener('input', draw);
    }
    controls.hidden = false;
  });
}
