const SVG_NS = 'http://www.w3.org/2000/svg';

export const SO101_MODEL = Object.freeze({ inertia:0.02, kp:13.64, damping:1.058, friction:0.196, gravity:0.391, deadBand:0, torqueLimit:5.107, encoderTick:0.001534, controlRate:30, internalRate:1000 });
export const frictionBandStops = Object.freeze({
  fromAbove:(SO101_MODEL.gravity - SO101_MODEL.friction) / SO101_MODEL.kp * 1000,
  center:SO101_MODEL.gravity / SO101_MODEL.kp * 1000,
  fromBelow:(SO101_MODEL.gravity + SO101_MODEL.friction) / SO101_MODEL.kp * 1000,
});

const localRegistry = new Map();
function element(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}
function svgNode(tag, attrs = {}, text) {
  const result = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) result.setAttribute(key, String(value));
  if (text !== undefined) result.textContent = text;
  return result;
}
function localSvg(width, height) {
  const result = document.createElementNS(SVG_NS, 'svg');
  result.setAttribute('viewBox', `0 0 ${width} ${height}`);
  result.setAttribute('role', 'img');
  result.setAttribute('width', String(width));
  result.setAttribute('height', String(height));
  return result;
}
function localSlider(parent, {label, min, max, step, value, unit = '', onInput}) {
  const wrap = element('label', undefined, 'so101-slider');
  const title = element('span', label, 'so101-slider-label');
  const input = element('input');
  input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(value);
  input.setAttribute('aria-label', label);
  const output = element('output', `${value}${unit ? ` ${unit}` : ''}`);
  input.addEventListener('input', () => {
    output.value = `${input.value}${unit ? ` ${unit}` : ''}`;
    onInput?.(Number(input.value), input);
  });
  wrap.append(title, input, output); parent.append(wrap);
  return input;
}
function localLinePlot(svg, series, options) {
  drawIntoSvg(svg, series, options);
}
const supplied = globalThis.window?.SO101 || {};
const register = typeof supplied.register === 'function' ? supplied.register.bind(supplied) : (type, fn) => {
  localRegistry.set(type, fn);
  if (globalThis.document?.querySelectorAll) {
    for (const figure of document.querySelectorAll('figure[data-type]')) {
      if (figure.dataset.type !== type) continue;
      let config = {};
      try { config = JSON.parse(figure.dataset.config || '{}'); } catch { continue; }
      fn(figure, config);
    }
  }
};
const SO101 = {
  ...supplied,
  register,
  slider:typeof supplied.slider === 'function' ? supplied.slider.bind(supplied) : localSlider,
  svg:typeof supplied.svg === 'function' ? supplied.svg.bind(supplied) : localSvg,
  linePlot:typeof supplied.linePlot === 'function' ? supplied.linePlot.bind(supplied) : localLinePlot,
  colors:supplied.colors || {ink:'var(--ink, #252525)', muted:'var(--muted, #686868)', accent:'var(--accent, #376f9a)'},
};
if (globalThis.window) globalThis.window.SO101 = SO101;

const STYLE = `
.so101-sims-widget{color:var(--ink,#252525);font:inherit;max-width:100%;box-sizing:border-box}
.so101-sims-widget *{box-sizing:border-box}
.so101-sims-widget .so101-sim-note{color:var(--muted,#686868);font-size:.82em;margin:.2rem 0 .7rem}
.so101-sims-widget .so101-sim-controls{display:grid;gap:.65rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));margin:.7rem 0}
.so101-sims-widget label,.so101-sims-widget button,.so101-sims-widget select{font:inherit}
.so101-sims-widget input[type=range]{max-width:100%;width:100%;accent-color:var(--accent,#376f9a)}
.so101-sims-widget button,.so101-sims-widget select{min-height:2.5rem;padding:.35rem .6rem}
.so101-sims-widget svg{display:block;height:auto;margin:.6rem 0;max-width:100%;width:100%}
.so101-sims-widget .so101-plot-grid{stroke:var(--muted,#999);stroke-opacity:.22;stroke-width:1}
.so101-sims-widget .so101-plot-axis{stroke:var(--ink,#252525);stroke-width:1}
.so101-sims-widget .so101-plot-tick,.so101-sims-widget .so101-plot-label,.so101-sims-widget .so101-plot-legend{fill:var(--muted,#686868);font-size:11px}
.so101-sims-widget .so101-sim-line{fill:none;stroke-width:2;vector-effect:non-scaling-stroke}
.so101-sims-widget .so101-sim-line-0{stroke:var(--accent,#376f9a)}
.so101-sims-widget .so101-sim-line-1{stroke:var(--so101-positive,#52775a)}
.so101-sims-widget .so101-sim-line-2{stroke:var(--so101-partial,#a57a2b)}
.so101-sims-widget .so101-sim-line-3{stroke:var(--so101-negative,#9a5446)}
.so101-sims-widget .so101-sim-line-4{stroke:var(--muted,#777)}
.so101-sims-widget .so101-sim-line-5{stroke:var(--ink,#252525)}
.so101-sims-widget .so101-sim-line-total{stroke-width:4}
.so101-sims-widget .so101-sim-output{font-variant-numeric:tabular-nums}
.so101-sims-widget .so101-sim-live{min-height:1.5em}
.so101-sims-widget .so101-sim-mpc label{display:grid;grid-template-columns:5.5rem 1fr;gap:.35rem;align-items:center}
`;
function prepare(el, title) {
  el.classList?.add('so101-sims-widget');
  const style = element('style', STYLE);
  const heading = element('h3', title);
  const note = element('p', 'Teaching model, simplified', 'so101-sim-note');
  el.append(style, heading, note);
}
function button(parent, text, action, aria = text) {
  const control = element('button', text);
  control.type = 'button'; control.setAttribute('aria-label', aria);
  control.addEventListener('click', action); parent.append(control); return control;
}
function paragraph(parent, text, className) {
  const node = element('p', text, className); parent.append(node); return node;
}
function addSlider(parent, options) { return SO101.slider(parent, options); }
function addSelect(parent, label, values, initial, onChange) {
  const wrap = element('label'); wrap.append(element('span', label));
  const select = element('select'); select.setAttribute('aria-label', label);
  for (const value of values) {
    const option = element('option', value); option.value = value; select.append(option);
  }
  select.value = initial; select.addEventListener('change', () => onChange(select.value)); wrap.append(select); parent.append(wrap); return select;
}
function makePlot(series, options = {}) {
  const svg = SO101.svg(options.width || 640, options.height || 260);
  svg.style.width = '100%'; svg.style.height = 'auto';
  const description = series.map((item) => item.label).join(', ');
  svg.setAttribute('aria-label', options.ariaLabel || `${options.yLabel || 'Value'} over ${options.xLabel || 'time'}: ${description}`);
  SO101.linePlot(svg, series, {
    xLabel:options.xLabel || 'Time (s)', yLabel:options.yLabel || 'Value',
    xRange:options.xRange, yRange:options.yRange,
  });
  svg.setAttribute('viewBox', `0 0 ${options.width || 640} ${options.height || 260}`);
  return svg;
}
function drawIntoSvg(svg, series, options = {}) {
  const width = Number(svg.getAttribute('width')) || 640;
  const height = Number(svg.getAttribute('height')) || 260;
  const margin = {left:54, right:14, top:26, bottom:40};
  const points = series.flatMap((line) => line.values || []);
  let xRange = options.xRange || [Math.min(...points.map((point) => point[0])), Math.max(...points.map((point) => point[0]))];
  let yRange = options.yRange || [Math.min(...points.map((point) => point[1])), Math.max(...points.map((point) => point[1]))];
  if (!Number.isFinite(xRange[0]) || !Number.isFinite(xRange[1])) xRange = [0, 1];
  if (!Number.isFinite(yRange[0]) || !Number.isFinite(yRange[1])) yRange = [-1, 1];
  if (xRange[0] === xRange[1]) xRange = [xRange[0] - .5, xRange[1] + .5];
  if (yRange[0] === yRange[1]) yRange = [yRange[0] - .5, yRange[1] + .5];
  const plotWidth = width - margin.left - margin.right, plotHeight = height - margin.top - margin.bottom;
  const x = (value) => margin.left + (value - xRange[0]) / (xRange[1] - xRange[0]) * plotWidth;
  const y = (value) => margin.top + plotHeight - (value - yRange[0]) / (yRange[1] - yRange[0]) * plotHeight;
  svg.replaceChildren();
  for (let i = 0; i <= 4; i++) {
    const xv = xRange[0] + (xRange[1] - xRange[0]) * i / 4, yv = yRange[0] + (yRange[1] - yRange[0]) * i / 4;
    svg.append(svgNode('line', {x1:x(xv), y1:margin.top, x2:x(xv), y2:margin.top + plotHeight, class:'so101-plot-grid'}));
    svg.append(svgNode('text', {x:x(xv), y:margin.top + plotHeight + 16, 'text-anchor':'middle', class:'so101-plot-tick'}, Number(xv.toFixed(2)).toString()));
    svg.append(svgNode('line', {x1:margin.left, y1:y(yv), x2:margin.left + plotWidth, y2:y(yv), class:'so101-plot-grid'}));
    svg.append(svgNode('text', {x:margin.left - 7, y:y(yv) + 4, 'text-anchor':'end', class:'so101-plot-tick'}, Number(yv.toPrecision(2)).toString()));
  }
  svg.append(svgNode('line', {x1:margin.left, y1:margin.top, x2:margin.left, y2:margin.top + plotHeight, class:'so101-plot-axis'}));
  svg.append(svgNode('line', {x1:margin.left, y1:margin.top + plotHeight, x2:width - margin.right, y2:margin.top + plotHeight, class:'so101-plot-axis'}));
  svg.append(svgNode('text', {x:width / 2, y:height - 4, 'text-anchor':'middle', class:'so101-plot-label'}, options.xLabel || 'Time (s)'));
  svg.append(svgNode('text', {x:13, y:height / 2, 'text-anchor':'middle', class:'so101-plot-label', transform:`rotate(-90 13 ${height / 2})`}, options.yLabel || 'Value'));
  series.forEach((line, index) => {
    const values = line.values || [];
    if (!values.length) return;
    const path = values.map((point) => `${x(point[0])},${y(point[1])}`).join(' ');
    const lineNode = svgNode('polyline', {points:path, class:`so101-sim-line so101-sim-line-${line.colorIndex ?? index % 6}${line.width ? ' so101-sim-line-total' : ''}`, 'stroke-width':line.width || 2});
    if (line.dash) lineNode.setAttribute('stroke-dasharray', line.dash);
    svg.append(lineNode);
    if (line.dots) for (const point of values) svg.append(svgNode('circle', {cx:x(point[0]), cy:y(point[1]), r:2, fill:'var(--accent,#376f9a)'}));
  });
  series.slice(0, 6).forEach((line, index) => {
    const lx = margin.left + index * Math.min(125, plotWidth / Math.max(1, Math.min(series.length, 6)));
    svg.append(svgNode('line', {x1:lx, y1:13, x2:lx + 14, y2:13, class:`so101-sim-line so101-sim-line-${line.colorIndex ?? index % 6}`}));
    svg.append(svgNode('text', {x:lx + 18, y:17, class:'so101-plot-legend'}, line.label));
  });
}
function simRms(values) { return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / Math.max(1, values.length)); }
function roundTick(q) { return Math.round(q / SO101_MODEL.encoderTick) * SO101_MODEL.encoderTick; }
function sign(value) { return value < 0 ? -1 : value > 0 ? 1 : 0; }
function observeAndAnimate(el, frame, autoplay = false) {
  let visible = typeof IntersectionObserver !== 'function';
  let pending = false, running = false, last = null;
  const request = globalThis.requestAnimationFrame;
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && pending) start();
  }) : null;
  observer?.observe(el);
  function tick(time) {
    if (!running || !visible) { running = false; return; }
    const dt = last === null ? 0 : Math.min(.05, Math.max(0, (time - last) / 1000));
    last = time;
    if (frame(time, dt) !== false) request(tick);
    else { running = false; pending = false; last = null; }
  }
  function start() {
    if (!visible || running || typeof request !== 'function') return;
    pending = false; running = true; last = null; request(tick);
  }
  if (autoplay) { pending = true; start(); }
  return {play() { pending = true; start(); }, stop() { running = false; pending = false; last = null; }};
}
export function simulateJoint({duration, targetAt, controller = 'direct', delay = .033, kpOut = 1, ki = 0, loadAt = SO101_MODEL.gravity, h = 0, initialQ = 0}) {
  const dt = 1 / SO101_MODEL.internalRate, controllerDt = 1 / SO101_MODEL.controlRate;
  const delaySteps = Math.round(Math.max(0, delay) / dt), steps = Math.round(duration / dt);
  const history = new Float64Array(steps + delaySteps + 1), samples = [];
  let q = initialQ, v = 0, goal = initialQ, integral = 0, nextControl = 0, nextSample = 0;
  for (let index = 0; index <= steps; index++) {
    const t = index * dt, target = targetAt(t);
    if (t + 1e-10 >= nextControl) {
      const error = target - q;
      if (controller === 'pi') { integral += error * controllerDt; goal = target + kpOut * error + ki * integral; }
      else if (controller === 'inv') goal = targetAt(t + delay + dt / 2) + SO101_MODEL.gravity / SO101_MODEL.kp;
      else goal = target;
      nextControl += controllerDt;
    }
    history[index] = goal;
    const delayedIndex = Math.max(0, index - delaySteps), delayedGoal = history[delayedIndex];
    const gap = delayedGoal - q;
    let torque = Math.abs(gap) < h ? 0 : SO101_MODEL.kp * (gap - h * sign(gap));
    torque = Math.max(-SO101_MODEL.torqueLimit, Math.min(SO101_MODEL.torqueLimit, torque));
    const load = typeof loadAt === 'function' ? loadAt(t) : loadAt;
    const acceleration = (torque - SO101_MODEL.damping * v - SO101_MODEL.friction * Math.tanh(v / .01) - load) / SO101_MODEL.inertia;
    v += acceleration * dt; q += v * dt;
    if (t + 1e-10 >= nextSample) {
      const sampleIndex = Math.round(t / dt), sampleDelayedIndex = Math.max(0, sampleIndex - delaySteps);
      samples.push({t, target, goal:history[sampleDelayedIndex], q}); nextSample += controllerDt;
    }
  }
  return samples;
}
function registerLocal(type, fn) { SO101.register(type, fn); }

function frictionCurve(el, config = {}) {
  const mode = config.mode === 'band' ? 'band' : 'curve';
  prepare(el, 'Friction and the gravity band');
  if (mode === 'band') { renderFrictionBand(el, Boolean(config.autoplay)); return; }
  renderFrictionCurve(el);
}
function renderFrictionCurve(el) {
  const controls = element('div', undefined, 'so101-sim-controls');
  const chart = makePlot([], {width:620, height:300, xLabel:'Joint speed (rad/s)', yLabel:'Torque (N·m)', xRange:[-.5,.5], yRange:[-1,1], ariaLabel:'Friction torque parts and total against joint speed'});
  const output = paragraph(el, '', 'so101-sim-live'); output.setAttribute('aria-live', 'polite');
  el.append(controls, chart, output);
  const parts = [
    {key:'viscous', label:'Viscous d·v, d = 1.058 N·m·s/rad', value:(v) => 1.058 * v},
    {key:'coulomb', label:'Coulomb f·sign(v), f = 0.196 N·m', value:(v) => .196 * sign(v)},
    {key:'stiction', label:'Stiction, 0.3 N·m below 0.002 rad/s', value:(v) => Math.abs(v) < .002 ? .3 * sign(v || .002) : 0},
    {key:'stribeck', label:'Stribeck dip, fs = 0.3, fc = 0.196 N·m', value:(v) => (.196 + (.3 - .196) * Math.exp(-((v / .02) ** 2))) * sign(v)},
    {key:'load', label:'Load-dependent friction: 0.4·|τ|', value:(v, tau) => .4 * Math.abs(tau) * sign(v)},
  ];
  const enabled = new Map(parts.map((part) => [part.key, false]));
  let loadTorque = .5;
  const loadControl = element('div', undefined, 'so101-sim-controls');
  const loadOutput = paragraph(loadControl, 'Applied torque: 0.50 N·m');
  function update() {
    const velocities = Array.from({length:201}, (_, i) => -.5 + i * .005);
    const selected = parts.filter((part) => enabled.get(part.key));
    const lines = selected.map((part) => ({label:part.key, values:velocities.map((v) => [v, part.value(v, loadTorque)])}));
    lines.push({label:'Total', width:4, colorIndex:5, values:velocities.map((v) => [v, selected.reduce((sum, part) => sum + part.value(v, loadTorque), 0)])});
    const maxTorque = Math.max(1, ...lines.flatMap((line) => line.values.map((point) => Math.abs(point[1]))));
    drawIntoSvg(chart, lines, {xRange:[-.5,.5], yRange:[-maxTorque,maxTorque], xLabel:'Joint speed (rad/s)', yLabel:'Torque (N·m)'});
    output.textContent = `${selected.length} friction part${selected.length === 1 ? '' : 's'} selected. The total curve shows their sum.`;
    loadOutput.textContent = `Applied torque: ${loadTorque.toFixed(2)} N·m`;
  }
  for (const part of parts) {
    const label = element('label');
    const input = element('input'); input.type = 'checkbox'; input.checked = false; input.setAttribute('aria-label', `Add ${part.label}`);
    const text = element('span', part.label); label.append(input, text); controls.append(label);
    input.addEventListener('change', () => { enabled.set(part.key, input.checked); update(); });
  }
  addSlider(loadControl, {label:'Load torque τ', min:0, max:1, step:.01, value:loadTorque, unit:'N·m', onInput:(value) => { loadTorque = value; update(); }});
  el.append(loadControl);
  update();
}
function renderFrictionBand(el, autoplay) {
  const controls = element('div', undefined, 'so101-sim-controls');
  const chart = SO101.svg(220, 340); chart.style.width = '100%'; chart.style.maxWidth = '260px';
  chart.setAttribute('role', 'img'); chart.setAttribute('aria-label', 'Joint goal gap number line from zero to fifty milliradians with a gravity and friction band');
  const low = frictionBandStops.fromAbove, center = frictionBandStops.center, high = frictionBandStops.fromBelow;
  chart.append(
    svgNode('rect', {x:100, y:35, width:50, height:270, rx:6, fill:'var(--paper,#f6f3eb)', stroke:'var(--muted,#686868)'}),
    svgNode('rect', {x:100, y:35 + (50 - high) / 50 * 270, width:50, height:(high - low) / 50 * 270, fill:'var(--accent,#376f9a)', opacity:.22}),
    svgNode('line', {x1:92, y1:35 + (50 - center) / 50 * 270, x2:158, y2:35 + (50 - center) / 50 * 270, stroke:'var(--accent,#376f9a)', 'stroke-width':3}),
    svgNode('text', {x:164, y:35 + (50 - high) / 50 * 270 + 4, class:'so101-plot-tick'}, `${high.toFixed(1)} mrad`),
    svgNode('text', {x:164, y:35 + (50 - center) / 50 * 270 + 4, class:'so101-plot-tick'}, `${center.toFixed(1)} mrad`),
    svgNode('text', {x:164, y:35 + (50 - low) / 50 * 270 + 4, class:'so101-plot-tick'}, `${low.toFixed(1)} mrad`),
  );
  for (const value of [0,10,20,30,40,50]) {
    const y = 35 + (50 - value) / 50 * 270;
    chart.append(svgNode('line', {x1:94, y1:y, x2:100, y2:y, stroke:'var(--ink,#252525)'}));
    chart.append(svgNode('text', {x:84, y:y + 4, 'text-anchor':'end', class:'so101-plot-tick'}, String(value)));
  }
  const marker = svgNode('circle', {cx:125, cy:305, r:8, fill:'var(--so101-negative,#9a5446)', 'aria-hidden':'true'}); chart.append(marker);
  const status = paragraph(el, `Gravity band: ${(low).toFixed(1)} to ${(high).toFixed(1)} mrad.`, 'so101-sim-live'); status.setAttribute('aria-live', 'polite');
  el.append(chart, controls);
  const move = observeAndAnimate(el, (time, dt) => {
    if (move.startedAt === null) move.startedAt = time;
    const progress = Math.min(1, (time - move.startedAt) / 900);
    const value = move.from + (move.to - move.from) * progress;
    marker.setAttribute('cy', String(35 + (50 - value) / 50 * 270));
    status.textContent = `${move.direction}: gap ${value.toFixed(1)} mrad. ${move.direction === 'Approach from below' ? 'Friction adds to gravity.' : 'Friction carries part of the load.'}`;
    return progress < 1;
  }, autoplay);
  move.startedAt = null; move.from = 0; move.to = high; move.direction = 'Approach from below';
  button(controls, 'Approach from below', () => {
    move.from = 0; move.to = high; move.direction = 'Approach from below'; move.startedAt = performance.now(); status.textContent = 'The gap moves toward the band.'; move.play();
  });
  button(controls, 'Approach from above', () => {
    move.from = 50; move.to = low; move.direction = 'Approach from above'; move.startedAt = performance.now(); status.textContent = 'The gap moves toward the band.'; move.play();
  });
}

function servoPlayground(el, config = {}) {
  prepare(el, 'Servo control playground');
  if (config.mode === 'pi') renderServoPi(el, Boolean(config.autoplay));
  else renderServoDeadTime(el, Boolean(config.autoplay));
}
function renderServoDeadTime(el, autoplay) {
  const controls = element('div', undefined, 'so101-sim-controls');
  const modeSelect = addSelect(controls, 'Outer controller', ['direct','pi','inv'], 'direct', update);
  let delayMs = 33, kpOut = 1, ki = 1;
  const delayLabel = addSlider(controls, {label:'Dead time D', min:0, max:80, step:1, value:delayMs, unit:'ms', onInput:(value) => { delayMs = value; update(); }});
  const pLabel = addSlider(controls, {label:'Outer P gain kp_out', min:0, max:8, step:.1, value:kpOut, onInput:(value) => { kpOut = value; update(); }});
  const kiLabel = addSlider(controls, {label:'Outer I gain ki', min:0, max:10, step:.1, value:ki, onInput:(value) => { ki = value; update(); }});
  const chart = makePlot([], {width:650, height:300, xRange:[0,1.5], yRange:[-.01,.15], xLabel:'Time (s)', yLabel:'Angle (rad)', ariaLabel:'Step target, controller goal, and joint angle over 1.5 seconds'});
  const rms = paragraph(el, '', 'so101-sim-output'); rms.setAttribute('aria-live', 'polite');
  const actions = element('div', undefined, 'so101-sim-controls');
  const play = button(actions, 'Play response', () => animation.play());
  el.append(controls, chart, rms, actions);
  let samples = [];
  const targetAt = (t) => t >= .2 ? .1 : 0;
  function update() {
    pLabel.parentElement.hidden = modeSelect.value !== 'pi';
    kiLabel.parentElement.hidden = modeSelect.value !== 'pi';
    samples = simulateJoint({duration:1.5, targetAt, controller:modeSelect.value, delay:delayMs / 1000, kpOut, ki});
    const errors = samples.map((sample) => sample.q - sample.target);
    rms.textContent = `RMS tracking error: ${(simRms(errors) * 1000).toFixed(2)} mrad. Dead time: ${delayMs} ms.`;
    draw(samples.length);
  }
  function draw(count) {
    const part = samples.slice(0, count);
    const series = [
      {label:'Target', colorIndex:2, values:part.map((s) => [s.t,s.target])},
      {label:'Goal', colorIndex:1, values:part.map((s) => [s.t,s.goal])},
      {label:'Joint q', colorIndex:0, values:part.map((s) => [s.t,s.q])},
    ];
    drawIntoSvg(chart, series, {xRange:[0,1.5], yRange:[-.02,.16], xLabel:'Time (s)', yLabel:'Angle (rad)'});
  }
  let animation;
  animation = observeAndAnimate(el, (time, dt) => {
    animation.elapsed = (animation.elapsed || 0) + dt;
    draw(Math.min(samples.length, Math.floor(animation.elapsed * SO101_MODEL.controlRate) + 1));
    if (animation.elapsed >= 1.5) { animation.elapsed = 0; return false; }
    return true;
  }, autoplay);
  const playAgain = () => { animation.elapsed = 0; animation.play(); };
  play.addEventListener('click', playAgain);
  delayLabel.addEventListener('input', () => { animation.stop(); });
  update();
}
function renderServoPi(el, autoplay) {
  const controls = element('div', undefined, 'so101-sim-controls');
  let kpOut = 2, ki = 2;
  const kpSlider = addSlider(controls, {label:'Outer P gain kp_out', min:0, max:20, step:.1, value:kpOut, onInput:(value) => { kpOut = value; update(); }});
  const kiSlider = addSlider(controls, {label:'Outer I gain ki', min:0, max:20, step:.1, value:ki, onInput:(value) => { ki = value; update(); }});
  const chart = makePlot([], {width:650, height:300, xRange:[0,6], yRange:[-.6,.8], xLabel:'Time (s)', yLabel:'Angle (rad)', ariaLabel:'Sine target, goal, and joint angle over six seconds with a load step at three seconds'});
  const result = paragraph(el, '', 'so101-sim-output');
  const actions = element('div', undefined, 'so101-sim-controls');
  const play = button(actions, 'Play response', () => animation.play());
  el.append(controls, chart, result, actions);
  let samples = [];
  function update() {
    samples = simulateJoint({duration:6, targetAt:(t) => .3 * Math.sin(2 * Math.PI * .3 * t), controller:'pi', delay:.033, kpOut, ki, loadAt:(t) => SO101_MODEL.gravity + (t >= 3 ? .3 : 0)});
    const before = samples.filter((s) => s.t < 3).map((s) => s.q - s.target);
    const after = samples.filter((s) => s.t >= 3).map((s) => s.q - s.target);
    const unstable = samples.some((s) => Math.abs(s.q) > 1);
    result.textContent = `RMS error before load: ${(simRms(before) * 1000).toFixed(2)} mrad. RMS error after load: ${(simRms(after) * 1000).toFixed(2)} mrad.${unstable ? ' Unstable: |q| exceeds 1 rad.' : ' Stable in this model: |q| stays at or below 1 rad.'}`;
    draw(samples.length);
  }
  function draw(count) {
    const part = samples.slice(0, count);
    drawIntoSvg(chart, [
      {label:'Target', colorIndex:2, values:part.map((s) => [s.t,s.target])},
      {label:'Goal', colorIndex:1, values:part.map((s) => [s.t,s.goal])},
      {label:'Joint q', colorIndex:0, values:part.map((s) => [s.t,s.q])},
    ], {xRange:[0,6], yRange:[-.65,.85], xLabel:'Time (s)', yLabel:'Angle (rad)'});
  }
  let animation;
  animation = observeAndAnimate(el, (time, dt) => {
    animation.elapsed = (animation.elapsed || 0) + dt;
    draw(Math.min(samples.length, Math.floor(animation.elapsed * SO101_MODEL.controlRate) + 1));
    if (animation.elapsed >= 6) { animation.elapsed = 0; return false; }
    return true;
  }, autoplay);
  play.addEventListener('click', () => { animation.elapsed = 0; animation.play(); });
  kpSlider.addEventListener('input', () => animation.stop()); kiSlider.addEventListener('input', () => animation.stop());
  update();
}

export function derivativeData(rate, duration = 4) {
  const dt = 1 / rate, count = Math.round(duration * rate) + 1;
  const times = Array.from({length:count}, (_, i) => i * dt);
  const truth = times.map((t) => .3 * Math.sin(2 * Math.PI * .5 * t));
  const readings = truth.map(roundTick);
  const trueSpeed = times.map((t) => .3 * 2 * Math.PI * .5 * Math.cos(2 * Math.PI * .5 * t));
  const trueAcceleration = times.map((t) => -.3 * (2 * Math.PI * .5) ** 2 * Math.sin(2 * Math.PI * .5 * t));
  const speed = times.map((_, i) => i ? (readings[i] - readings[i - 1]) / dt : 0);
  const acceleration = times.map((_, i) => i > 1 ? (speed[i] - speed[i - 1]) / dt : 0);
  return {times, truth, readings, trueSpeed, trueAcceleration, speed, acceleration,
    speedRms:simRms(speed.slice(1).map((value, i) => value - trueSpeed[i + 1])),
    accelerationRms:simRms(acceleration.slice(2).map((value, i) => value - trueAcceleration[i + 2]))};
}
function derivativeNoise(el, config = {}) {
  prepare(el, 'Encoder ticks amplify derivative noise');
  const controls = element('div', undefined, 'so101-sim-controls');
  let rate = [30,60,120].includes(Number(config.rate)) ? Number(config.rate) : 30;
  const select = addSelect(controls, 'Reading rate', ['30','60','120'], String(rate), (value) => { rate = Number(value); update(); });
  for (const option of select.options || []) option.textContent = `${option.value} Hz`;
  const positionPlot = makePlot([], {width:640,height:210,xRange:[0,4],yRange:[-.4,.4],xLabel:'Time (s)',yLabel:'Angle (rad)',ariaLabel:'True joint position and tick-rounded encoder position'});
  const speedPlot = makePlot([], {width:640,height:210,xRange:[0,4],yRange:[-1.2,1.2],xLabel:'Time (s)',yLabel:'Speed (rad/s)',ariaLabel:'True speed and first-difference speed estimate'});
  const accelerationPlot = makePlot([], {width:640,height:210,xRange:[0,4],yRange:[-4,4],xLabel:'Time (s)',yLabel:'Acceleration (rad/s²)',ariaLabel:'True acceleration and second-difference acceleration estimate'});
  const metrics = paragraph(el, '', 'so101-sim-output'); metrics.setAttribute('aria-live','polite');
  paragraph(el, 'One tick at 30 Hz gives 1.534 mrad / (1/30 s)² ≈ 1.4 rad/s².');
  el.append(controls, positionPlot, speedPlot, accelerationPlot, metrics);
  function update() {
    const data = derivativeData(rate);
    drawIntoSvg(positionPlot, [
      {label:'True angle',colorIndex:2,values:data.times.map((t,i)=>[t,data.truth[i]])},
      {label:'Tick reading',colorIndex:0,values:data.times.map((t,i)=>[t,data.readings[i]])},
    ], {xRange:[0,4],yRange:[-.4,.4],xLabel:'Time (s)',yLabel:'Angle (rad)'});
    drawIntoSvg(speedPlot, [
      {label:'True speed',colorIndex:2,values:data.times.map((t,i)=>[t,data.trueSpeed[i]])},
      {label:'First difference',colorIndex:3,values:data.times.slice(1).map((t,i)=>[t,data.speed[i+1]])},
    ], {xRange:[0,4],yRange:[-1.2,1.2],xLabel:'Time (s)',yLabel:'Speed (rad/s)'});
    drawIntoSvg(accelerationPlot, [
      {label:'True acceleration',colorIndex:2,values:data.times.map((t,i)=>[t,data.trueAcceleration[i]])},
      {label:'Second difference',colorIndex:3,values:data.times.slice(2).map((t,i)=>[t,data.acceleration[i+2]])},
    ], {xRange:[0,4],yRange:[-4,4],xLabel:'Time (s)',yLabel:'Acceleration (rad/s²)'});
    metrics.textContent = `Rate: ${rate} Hz. RMS speed error: ${data.speedRms.toFixed(3)} rad/s. RMS acceleration error: ${data.accelerationRms.toFixed(3)} rad/s².`;
  }
  update();
}

export function kalmanData({alpha = .97, kalman = false, readingNoise = .443, modelNoise = 2, modelError = false, duration = 8} = {}) {
  const rate = 30, dt = 1 / rate, count = Math.round(duration * rate) + 1;
  const times = Array.from({length:count}, (_, i) => i * dt);
  const truth = times.map((t) => (.2 * Math.sin(2 * Math.PI * .4 * t) + .05 * Math.sin(2 * Math.PI * 1.3 * t)) * 1000);
  const readings = truth.map((q) => roundTick(q / 1000) * 1000);
  const estimates = new Array(count), gains = [];
  if (!kalman) {
    let x = readings[0], v = (readings[1] - readings[0]) / dt;
    const beta = alpha * alpha / (2 - alpha);
    estimates[0] = readings[0]; gains.push({alpha, beta});
    for (let i = 1; i < count; i++) {
      const predicted = x + v * dt + (modelError ? .5 : 0);
      const residual = readings[i] - predicted;
      x = predicted + alpha * residual;
      v += beta / dt * residual;
      estimates[i] = x; gains.push({alpha, beta});
    }
  } else {
    let x = readings[0], v = (readings[1] - readings[0]) / dt;
    let p00 = 100, p01 = 0, p10 = 0, p11 = 100;
    const R = Math.max(.001, readingNoise) ** 2;
    const Qscale = Math.max(.0001, modelNoise) ** 2;
    const processNoisePosition = Qscale;
    const processNoiseCross = Qscale / dt;
    const processNoiseVelocity = Qscale / (dt * dt);
    estimates[0] = readings[0];
    gains.push({alpha:1, beta:0});
    for (let i = 1; i < count; i++) {
      const pp00 = p00 + dt * (p01 + p10) + dt * dt * p11 + processNoisePosition;
      const pp01 = p01 + dt * p11 + processNoiseCross;
      const pp10 = p10 + dt * p11 + processNoiseCross;
      const pp11 = p11 + processNoiseVelocity;
      const predicted = x + v * dt + (modelError ? .5 : 0);
      const residual = readings[i] - predicted;
      const denominator = pp00 + R;
      const k0 = pp00 / denominator, k1 = pp10 / denominator;
      x = predicted + k0 * residual; v += k1 * residual;
      p00 = (1 - k0) * pp00; p01 = (1 - k0) * pp01;
      p10 = pp10 - k1 * pp00; p11 = pp11 - k1 * pp01;
      gains.push({alpha:k0, beta:k1 * dt});
      estimates[i] = x;
    }
  }
  const windowEnd = Math.max(0, count - 1), start = Math.max(0, windowEnd - Math.round(2 * rate));
  const readingError = readings.slice(start, windowEnd + 1).map((value, i) => value - truth[start + i]);
  const estimateError = estimates.slice(start, windowEnd + 1).map((value, i) => value - truth[start + i]);
  const settled = gains.slice(Math.max(0, gains.length - 30));
  return {times:times.slice(start,windowEnd + 1),truth:truth.slice(start,windowEnd + 1),readings:readings.slice(start,windowEnd + 1),estimates:estimates.slice(start,windowEnd + 1),
    rmsReading:simRms(readingError),rmsEstimate:simRms(estimateError),
    gain:{alpha:simRms(settled.map((gain)=>gain.alpha)),beta:simRms(settled.map((gain)=>gain.beta))}};
}
function logarithmicSlider(parent, {label,min,max,value,onInput}) {
  const wrap = element('label',undefined,'so101-slider');
  wrap.append(element('span',label));
  const input = element('input'); input.type='range'; input.min='0'; input.max='1000'; input.step='1'; input.setAttribute('aria-label',label);
  const position = Math.round(Math.log(value / min) / Math.log(max / min) * 1000); input.value=String(position);
  const output = element('output',`${value.toFixed(2)} mrad`);
  input.addEventListener('input',()=>{const amount=Number(input.value)/1000;const actual=min*(max/min)**amount;output.value=`${actual.toFixed(2)} mrad`;onInput(actual);});
  wrap.append(input,output);parent.append(wrap);return input;
}
function observerWidget(el, config = {}) {
  prepare(el,'An observer estimates motion between encoder readings');
  const controls = element('div',undefined,'so101-sim-controls');
  const initialMode = config.mode === 'kalman' ? 'kalman' : 'alpha-beta';
  let mode = initialMode, alpha = .97, readingNoise = .443, modelNoise = 2, modelError = false;
  const modeSelect = addSelect(controls,'Filter',['alpha-beta','kalman'],mode,(value)=>{mode=value;update();});
  const alphaSlider = addSlider(controls,{label:'Alpha',min:.05,max:1,step:.01,value:alpha,onInput:(value)=>{alpha=value;update();}});
  const readingSlider = addSlider(controls,{label:'Reading noise σ_r',min:.05,max:2,step:.01,value:readingNoise,unit:'mrad',onInput:(value)=>{readingNoise=value;update();}});
  const modelSlider = logarithmicSlider(controls,{label:'Model noise σ_q',min:.01,max:10,value:modelNoise,onInput:(value)=>{modelNoise=value;update();}});
  const errorLabel = element('label'); const errorCheck=element('input');errorCheck.type='checkbox';errorCheck.setAttribute('aria-label','Add model error');
  errorLabel.append(errorCheck,element('span','Model error: add 0.5 mrad per prediction'));controls.append(errorLabel);
  errorCheck.addEventListener('change',()=>{modelError=errorCheck.checked;update();});
  const chart=makePlot([],{width:650,height:300,xRange:[6,8],yRange:[-250,250],xLabel:'Time (s)',yLabel:'Angle (mrad)',ariaLabel:'True joint angle, tick readings, and observer estimate over a two-second window'});
  const result=paragraph(el,'','so101-sim-output');
  const actions=element('div',undefined,'so101-sim-controls');
  const play=button(actions,'Play estimate',()=>{animation.elapsed=0;animation.play();});
  el.append(controls,chart,result,actions);
  let data;
  function update() {
    alphaSlider.parentElement.hidden=mode!=='alpha-beta';
    readingSlider.parentElement.hidden=mode!=='kalman';
    modelSlider.parentElement.hidden=mode!=='kalman';
    data=kalmanData({alpha,kalman:mode==='kalman',readingNoise,modelNoise,modelError});
    const series=[
      {label:'True angle',colorIndex:2,values:data.times.map((t,i)=>[t,data.truth[i]])},
      {label:'Tick reading',colorIndex:3,dots:true,values:data.times.flatMap((t,i)=>i===0?[[t,data.readings[i]]]:[[data.times[i-1],data.readings[i]],[t,data.readings[i]]])},
      {label:'Estimate',colorIndex:0,values:data.times.map((t,i)=>[t,data.estimates[i]])},
    ];
    drawIntoSvg(chart,series,{xRange:[6,8],yRange:[-250,250],xLabel:'Time (s)',yLabel:'Angle (mrad)'});
    const gainText=mode==='kalman'?` Steady Kalman gain: α = ${data.gain.alpha.toFixed(3)}, β = ${data.gain.beta.toFixed(3)}; the position gain is the α weight.`:'';
    result.textContent=`Mode: ${mode}. RMS(reading − true): ${data.rmsReading.toFixed(3)} mrad. RMS(estimate − true): ${data.rmsEstimate.toFixed(3)} mrad.${gainText}`;
  }
  let animation;
  animation=observeAndAnimate(el,(time,dt)=>{
    animation.elapsed=(animation.elapsed||0)+dt;
    const count=Math.min(data.times.length,Math.floor(animation.elapsed*30)+1);
    const subset=data.times.slice(0,count);
    drawIntoSvg(chart,[
      {label:'True angle',colorIndex:2,values:subset.map((t,i)=>[t,data.truth[i]])},
      {label:'Tick reading',colorIndex:3,dots:true,values:subset.map((t,i)=>[t,data.readings[i]])},
      {label:'Estimate',colorIndex:0,values:subset.map((t,i)=>[t,data.estimates[i]])},
    ],{xRange:[6,8],yRange:[-250,250],xLabel:'Time (s)',yLabel:'Angle (mrad)'});
    if(animation.elapsed>=2){animation.elapsed=0;return false;} return true;
  },Boolean(config.autoplay));
  update();
}

export function planCompareData(destination = 130, mpcGoals = null) {
  const startQ = 100, startGoal = 100, steps = 8, h = 10;
  const target = Array.from({length:steps}, (_,i) => 100 + (i + 1) * 5);
  const stepJoint = (q,g) => Math.abs(g-q) > h ? q + .5 * (g - h * sign(g-q) - q) : q;
  const solveGoals=[]; let goal=startGoal, solveQ=startQ; const solvePath=[startQ];
  for (let i=0;i<steps;i++) { goal += (destination-goal)/3; solveGoals.push(goal); solveQ=stepJoint(solveQ,goal); solvePath.push(solveQ); }
  const goals=mpcGoals ? mpcGoals.slice(0,steps) : Array(steps).fill(120);
  const mpcPath=[startQ]; let mpcQ=startQ;
  for (const value of goals) { mpcQ=stepJoint(mpcQ,value); mpcPath.push(mpcQ); }
  const solveCost=simRms(solvePath.slice(1).map((q,i)=>q-target[i]))**2;
  const mpcCost=simRms(mpcPath.slice(1).map((q,i)=>q-target[i]))**2;
  const constantCosts=Array.from({length:81},(_,i)=>{
    const value=90+i;let q=startQ;const path=[];
    for (let j=0;j<steps;j++){q=stepJoint(q,value);path.push(q);}
    return [value,simRms(path.map((angle,j)=>angle-target[j]))**2];
  });
  return {target,solveGoals,solvePath,solveCost,goals,mpcPath,mpcCost,constantCosts};
}
function bestSolve() {
  let best={destination:90,cost:Infinity};
  for(let destination=90;destination<=170;destination++){
    const score=planCompareData(destination).solveCost;
    if(score<best.cost)best={destination,cost:score};
  }
  return best;
}
export function bestMpc() {
  let bestGoals=Array(8).fill(100),bestCost=Infinity;
  for(let start=0;start<50;start++){
    let goals=Array.from({length:8},(_,i)=>90+((start*37+i*29)%81));
    let improved=true,passes=0;
    while(improved&&passes<16){improved=false;passes++;
      for(let i=0;i<8;i++){
        let local=goals[i],localCost=planCompareData(130,goals).mpcCost;
        for(let value=90;value<=170;value++){
          const candidate=goals.slice();candidate[i]=value;
          const cost=planCompareData(130,candidate).mpcCost;
          if(cost<localCost){local=value;localCost=cost;}
        }
        if(local!==goals[i]){goals[i]=local;improved=true;}
      }
    }
    const score=planCompareData(130,goals).mpcCost;
    if(score<bestCost){bestCost=score;bestGoals=goals;}
  }
  return {goals:bestGoals,cost:bestCost};
}
function planCompare(el) {
  prepare(el,'A plan can beat a destination command');
  const panels=element('div',undefined,'so101-sim-controls');panels.style.gridTemplateColumns='repeat(auto-fit,minmax(min(100%,300px),1fr))';
  const solvePanel=element('section');const mpcPanel=element('section');
  solvePanel.append(element('h4','Solve'));mpcPanel.append(element('h4','MPC: choose eight goals'));
  const solvePlot=makePlot([],{width:610,height:280,xRange:[0,8],yRange:[90,145],xLabel:'Control step',yLabel:'Joint angle (mrad)',ariaLabel:'Solve predicted joint path and target'});
  const mpcPlot=makePlot([],{width:610,height:280,xRange:[0,8],yRange:[90,145],xLabel:'Control step',yLabel:'Joint angle (mrad)',ariaLabel:'MPC predicted joint path and target'});
  let destination=130,goals=Array(8).fill(130);
  const solveCostOutput=paragraph(solvePanel,'','so101-sim-output');
  const mpcCostOutput=paragraph(mpcPanel,'','so101-sim-output');
  let flat=true;
  const solveGoal=addSlider(solvePanel,{label:'Destination goal',min:90,max:170,step:1,value:destination,unit:'mrad',onInput:(value)=>{destination=value;update();}});
  const goalInputs=[];
  const goalValues=[];
  const goalRows=element('div',undefined,'so101-sim-mpc');
  for(let i=0;i<8;i++){
    const row=element('div',undefined,'so101-sim-mpc-row');
    const label=element('label',undefined,'so101-sim-mpc-label');
    label.append(element('span',`Goal ${i+1}`));
    const input=element('input');input.type='range';input.min='90';input.max='170';input.step='1';input.value=String(goals[i]);input.setAttribute('aria-label',`Goal ${i+1}`);
    const value=element('output',`${goals[i]} mrad`);
    input.addEventListener('input',()=>{goals[i]=Number(input.value);value.value=`${input.value} mrad`;update();});
    label.append(input,value);row.append(label);goalRows.append(row);goalInputs.push(input);goalValues.push(value);
  }
  mpcPanel.append(goalRows);
  const actions=element('div',undefined,'so101-sim-controls');
  const solveButton=button(actions,'Best solve',()=>{const result=bestSolve();destination=result.destination;solveGoal.value=String(destination);update();});
  const mpcButton=button(actions,'Best MPC',()=>{const result=bestMpc();goals=result.goals;goalInputs.forEach((input,i)=>{input.value=String(goals[i]);goalValues[i].value=`${goals[i]} mrad`;});update();});
  const costPlot=SO101.svg(610,220);costPlot.style.width='100%';costPlot.setAttribute('role','img');costPlot.setAttribute('aria-label','Cost against a constant goal with a draggable marker and a flat zero-gradient region');
  const markerControl=element('div',undefined,'so101-sim-controls');
  const constantSlider=addSlider(markerControl,{label:'Constant goal marker',min:90,max:170,step:1,value:100,unit:'mrad',onInput:update});
  const markerValue=paragraph(markerControl,'','so101-sim-live');
  markerValue.setAttribute('aria-live','polite');
  costPlot.setAttribute('tabindex','0');
  costPlot.addEventListener('keydown',(event)=>{if(event.key==='ArrowLeft'||event.key==='ArrowDown'){event.preventDefault();constantSlider.value=String(Math.max(90,Number(constantSlider.value)-1));update();}if(event.key==='ArrowRight'||event.key==='ArrowUp'){event.preventDefault();constantSlider.value=String(Math.min(170,Number(constantSlider.value)+1));update();}});
  costPlot.addEventListener('pointerdown',(event)=>{costPlot.setPointerCapture?.(event.pointerId);const rect=costPlot.getBoundingClientRect();constantSlider.value=String(Math.max(90,Math.min(170,Math.round(90+(event.clientX-rect.left)/rect.width*80))));update();});
  costPlot.addEventListener('pointermove',(event)=>{if(event.buttons===0)return;const rect=costPlot.getBoundingClientRect();constantSlider.value=String(Math.max(90,Math.min(170,Math.round(90+(event.clientX-rect.left)/rect.width*80))));update();});
  costPlot.style.touchAction='none';
  costPlot.setAttribute('aria-label','Interactive cost curve. Use the goal slider, arrow keys, or pointer to move its marker.');
  costPlot.dataset.pointerMarker='enabled';
  markerControl.setAttribute('aria-label','Constant goal marker controls');
  const goalRowsStyle=element('style',`.so101-sims-widget .so101-sim-mpc-row{display:grid;grid-template-columns:1fr;gap:.3rem}.so101-sims-widget .so101-sim-mpc-label{display:grid;grid-template-columns:5rem minmax(4rem,1fr) 4rem;gap:.5rem;align-items:center}.so101-sims-widget .so101-sim-mpc-label input{width:100%;min-width:0}.so101-sims-widget .so101-sim-mpc-label output{text-align:right;font-variant-numeric:tabular-nums}`);
  el.append(goalRowsStyle,markerControl);
  const gradient=paragraph(el,'','so101-sim-live');gradient.setAttribute('aria-live','polite');
  solvePanel.append(solvePlot,solveCostOutput);mpcPanel.append(mpcCostOutput,goalRows,mpcPlot);panels.append(solvePanel,mpcPanel);
  el.append(panels,actions,costPlot,gradient);
  function update(){
    const data=planCompareData(destination,goals);
    drawIntoSvg(solvePlot,[
      {label:'Target',colorIndex:2,values:data.target.map((v,i)=>[i+1,v])},
      {label:'Joint q',colorIndex:0,values:data.solvePath.map((v,i)=>[i,v]).slice(1)},
    ],{xRange:[0,8],yRange:[90,145],xLabel:'Control step',yLabel:'Joint angle (mrad)'});
    drawIntoSvg(mpcPlot,[
      {label:'Target',colorIndex:2,values:data.target.map((v,i)=>[i+1,v])},
      {label:'Joint q',colorIndex:0,values:data.mpcPath.map((v,i)=>[i,v]).slice(1)},
    ],{xRange:[0,8],yRange:[90,145],xLabel:'Control step',yLabel:'Joint angle (mrad)'});
    solveCostOutput.textContent=`Cost: ${data.solveCost.toFixed(1)} mrad².`;
    mpcCostOutput.textContent=`Cost: ${data.mpcCost.toFixed(1)} mrad².`;
    drawIntoSvg(costPlot,[{label:'Cost for one constant goal',colorIndex:1,values:data.constantCosts}],{xRange:[90,170],yRange:[0,Math.max(...data.constantCosts.map((v)=>v[1]))*1.05],xLabel:'Constant goal (mrad)',yLabel:'Mean squared error (mrad²)'});
    const costValue=data.constantCosts[Number(constantSlider.value)-90][1];
    const maxCost=Math.max(...data.constantCosts.map((entry)=>entry[1]))*1.05;
    const cx=54+(Number(constantSlider.value)-90)/80*(610-54-14);
    const cy=26+(220-26-40)-costValue/maxCost*(220-26-40);
    const dot=svgNode('circle',{cx,cy,r:8,fill:'var(--accent,#376f9a)',stroke:'var(--ink,#252525)','stroke-width':1,'pointer-events':'none','aria-hidden':'true'});
    costPlot.append(dot);
    flat=data.constantCosts.slice(0,21).every((entry)=>Math.abs(entry[1]-data.constantCosts[0][1])<1e-8);
    markerValue.textContent=flat&&Number(constantSlider.value)<=110?`Goal ${constantSlider.value} mrad: gradient = 0 here.`:`Goal ${constantSlider.value} mrad. The constant-goal curve has a flat part from 90 to 110 mrad.`;
    gradient.textContent=flat&&Number(constantSlider.value)<=110?`Goal ${constantSlider.value} mrad: gradient = 0 here.`:`Goal ${constantSlider.value} mrad. The constant-goal curve has a flat part from 90 to 110 mrad.`;
  }
  update();
}

export function closedLoopData() {
  const rate=30,count=91,dt=1/rate;
  const offline=[],closed=[];let previous=0;
  for(let k=0;k<count;k++){
    const t=k*dt,recorded=.12*Math.sin(2*Math.PI*.25*t),modelDelta=recorded-previous;
    const noise=.001*Math.sin(k*12.9898)*Math.cos(k*4.1414);
    offline.push({t,recorded,goal:recorded+noise});
    const bias=.003*k;
    const goal=previous+modelDelta+bias;
    closed.push({t,recorded,goal});previous=goal;
  }
  const offlineRms=simRms(offline.map((s)=>s.goal-s.recorded));
  const closedRms=simRms(closed.map((s)=>s.goal-s.recorded));
  return {offline,closed,offlineRms,closedRms};
}
function closedLoopDrift(el,config={}) {
  prepare(el,'Offline accuracy does not guarantee closed-loop accuracy');
  const panels=element('div',undefined,'so101-sim-controls');panels.style.gridTemplateColumns='repeat(auto-fit,minmax(min(100%,300px),1fr))';
  const left=element('section');left.append(element('h4','Offline'));const right=element('section');right.append(element('h4','Closed loop'));
  const leftPlot=makePlot([],{width:610,height:280,xRange:[0,3],yRange:[-.1,.2],xLabel:'Time (s)',yLabel:'Joint angle (rad)',ariaLabel:'Recorded offline joint path and goals predicted from recorded inputs'});
  const rightPlot=makePlot([],{width:610,height:280,xRange:[0,3],yRange:[-.1,14],xLabel:'Time (s)',yLabel:'Joint angle and goal (rad)',ariaLabel:'Teaching joint angle and goals predicted from the network own previous goal'});
  const result=paragraph(el,'','so101-sim-output');const actions=element('div',undefined,'so101-sim-controls');
  const play=button(actions,'Play',()=>{animation.elapsed=0;animation.play();});
  left.append(leftPlot);right.append(rightPlot);panels.append(left,right);el.append(panels,result,actions);
  const data=closedLoopData();
  result.textContent=`Offline error: ${(data.offlineRms*1000).toFixed(2)} mrad. Closed-loop error: ${(data.closedRms*1000).toFixed(2)} mrad.`;
  paragraph(el,'Illustration of how errors compound when the input includes the network’s own past output. Not the measured network.');
  function draw(count){
    const offline=data.offline.slice(0,count),closed=data.closed.slice(0,count);
    drawIntoSvg(leftPlot,[
      {label:'Recorded path',colorIndex:2,values:offline.map((s)=>[s.t,s.recorded])},
      {label:'Predicted goal',colorIndex:0,values:offline.map((s)=>[s.t,s.goal])},
    ],{xRange:[0,3],yRange:[-.2,.35],xLabel:'Time (s)',yLabel:'Angle (rad)'});
    drawIntoSvg(rightPlot,[
      {label:'Teaching joint',colorIndex:2,values:closed.map((s)=>[s.t,s.recorded])},
      {label:'Predicted goal',colorIndex:3,values:closed.map((s)=>[s.t,s.goal])},
    ],{xRange:[0,3],yRange:[-.2,.6],xLabel:'Time (s)',yLabel:'Angle (rad)'});
  }
  let animation;
  animation=observeAndAnimate(el,(time,dt)=>{
    animation.elapsed=(animation.elapsed||0)+dt;draw(Math.min(data.offline.length,Math.floor(animation.elapsed*30)+1));
    if(animation.elapsed>=3){animation.elapsed=0;return false;}return true;
  },Boolean(config.autoplay));
  play.addEventListener('click',()=>{animation.elapsed=0;animation.play();});draw(data.offline.length);
}

registerLocal('friction-curve', frictionCurve);
registerLocal('servo-playground', servoPlayground);
registerLocal('derivative-noise', derivativeNoise);
registerLocal('observer', observerWidget);
registerLocal('plan-compare', planCompare);
registerLocal('closed-loop-drift', closedLoopDrift);

/* WIDGETS */
