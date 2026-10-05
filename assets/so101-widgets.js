const registry = new Map();
const colors = Object.freeze({
  ink:'var(--ink)', muted:'var(--muted)', accent:'var(--accent)', line:'var(--line)', paper:'var(--paper)',
  panel:'var(--white)', positive:'var(--so101-positive, #52775a)', partial:'var(--so101-partial, #a57a2b)', negative:'var(--so101-negative, #9a5446)',
});
const svgNamespace = 'http://www.w3.org/2000/svg';

function slider(parent, {label, min, max, step, value, unit = '', onInput}) {
  const wrap = document.createElement('label');
  wrap.className = 'so101-slider';
  const title = document.createElement('span');
  title.className = 'so101-slider-label';
  title.textContent = label;
  const control = document.createElement('input');
  control.type = 'range';
  control.min = String(min);
  control.max = String(max);
  control.step = String(step);
  control.value = String(value);
  control.setAttribute('aria-label', label);
  const output = document.createElement('output');
  output.value = `${value}${unit ? ` ${unit}` : ''}`;
  const update = () => {
    output.value = `${control.value}${unit ? ` ${unit}` : ''}`;
    onInput?.(Number(control.value), control);
  };
  control.addEventListener('input', update);
  wrap.append(title, control, output);
  parent.append(wrap);
  return control;
}
function svg(width, height) {
  const element = document.createElementNS(svgNamespace, 'svg');
  element.setAttribute('viewBox', `0 0 ${width} ${height}`);
  element.setAttribute('role', 'img');
  element.setAttribute('width', String(width));
  element.setAttribute('height', String(height));
  return element;
}
function linePlot(svgEl, series, {xLabel, yLabel, xRange, yRange}) {
  const width = Number(svgEl.getAttribute('width')) || 600;
  const height = Number(svgEl.getAttribute('height')) || 300;
  const margin = {top:22, right:18, bottom:48, left:52};
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const make = (name, attrs, text) => {
    const node = document.createElementNS(svgNamespace, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const x = (value) => margin.left + (value - xRange[0]) / (xRange[1] - xRange[0]) * plotWidth;
  const y = (value) => margin.top + plotHeight - (value - yRange[0]) / (yRange[1] - yRange[0]) * plotHeight;
  svgEl.replaceChildren();
  for (let tick = 0; tick <= 4; tick++) {
    const xValue = xRange[0] + (xRange[1] - xRange[0]) * tick / 4;
    const yValue = yRange[0] + (yRange[1] - yRange[0]) * tick / 4;
    svgEl.append(make('line', {x1:x(xValue), y1:margin.top, x2:x(xValue), y2:margin.top + plotHeight, class:'so101-plot-grid'}));
    svgEl.append(make('text', {x:x(xValue), y:margin.top + plotHeight + 17, 'text-anchor':'middle', class:'so101-plot-tick'}, Number(xValue.toFixed(2)).toString()));
    svgEl.append(make('line', {x1:margin.left, y1:y(yValue), x2:margin.left + plotWidth, y2:y(yValue), class:'so101-plot-grid'}));
    svgEl.append(make('text', {x:margin.left - 8, y:y(yValue) + 4, 'text-anchor':'end', class:'so101-plot-tick'}, Number(yValue.toFixed(2)).toString()));
  }
  svgEl.append(make('line', {x1:margin.left, y1:margin.top, x2:margin.left, y2:margin.top + plotHeight, class:'so101-plot-axis'}));
  svgEl.append(make('line', {x1:margin.left, y1:margin.top + plotHeight, x2:margin.left + plotWidth, y2:margin.top + plotHeight, class:'so101-plot-axis'}));
  svgEl.append(make('text', {x:margin.left + plotWidth / 2, y:height - 5, 'text-anchor':'middle', class:'so101-plot-label'}, xLabel));
  svgEl.append(make('text', {x:14, y:margin.top + plotHeight / 2, 'text-anchor':'middle', class:'so101-plot-label', transform:`rotate(-90 14 ${margin.top + plotHeight / 2})`}, yLabel));
  const palette = ['accent', 'positive', 'partial', 'negative'];
  series.forEach((line, index) => {
    const points = line.values.map(([xValue, yValue]) => `${x(xValue)},${y(yValue)}`).join(' ');
    svgEl.append(make('polyline', {points, class:`so101-plot-line so101-plot-line-${index % palette.length}`}));
    const legendX = margin.left + index * Math.min(118, plotWidth / Math.max(series.length, 1));
    svgEl.append(make('line', {x1:legendX, y1:12, x2:legendX + 14, y2:12, class:`so101-plot-line so101-plot-line-${index % palette.length}`}));
    svgEl.append(make('text', {x:legendX + 19, y:16, class:'so101-plot-legend'}, line.label));
  });
}

window.SO101 = {register, slider, svg, linePlot, colors};

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function button(text, className = '') {
  const element = node('button', text, className);
  element.type = 'button';
  return element;
}
function paragraph(parent, text, className = '') {
  const element = node('p', text, className);
  parent.append(element);
  return element;
}
function format(value, digits = 1) {
  return Number(value).toFixed(digits);
}
function addRange(parent, config) {
  const controls = node('div', undefined, 'so101-controls');
  parent.append(controls);
  return slider(controls, config);
}
function valueBar(parent, label, value, unit, max, formula) {
  const row = node('div', undefined, 'so101-bar-row');
  const heading = node('div', undefined, 'so101-bar-heading');
  heading.append(node('span', label), node('output', `${format(value)} ${unit}`));
  const track = node('div', undefined, 'so101-bar-track');
  track.setAttribute('aria-hidden', 'true');
  const fill = node('span', undefined, 'so101-bar-fill');
  fill.style.width = `${Math.max(0, Math.min(100, value / max * 100))}%`;
  track.append(fill);
  row.append(heading, track);
  if (formula) row.append(node('p', formula, 'so101-units'));
  parent.append(row);
  return {row, fill, output:heading.querySelector('output')};
}
function updateBar(bar, value, unit, max) {
  bar.output.value = `${format(value)} ${unit}`;
  bar.fill.style.width = `${Math.max(0, Math.min(100, value / max * 100))}%`;
}

function servoEquation(el) {
  const content = node('div', undefined, 'so101-equation');
  const flow = node('div', undefined, 'so101-equation-flow');
  const details = node('section', undefined, 'so101-term-panel');
  details.setAttribute('aria-live', 'polite');
  details.id = `so101-equation-details-${Math.random().toString(36).slice(2)}`;
  const terms = {
    target:{label:'Target r(t)', name:'Target', meaning:'Where we want the joint.', unit:'rad', typical:'A commanded joint angle.'},
    outer:{label:'Outer controller (+ offset + kp_out·e + ki∫e)', name:'Outer controller', meaning:'Runs on the computer at 30 or 60 Hz and can only change the goal.', unit:'Hz; correction in rad', typical:'30 or 60 Hz.'},
    goal:{label:'Goal g', name:'Goal', meaning:'The number sent to the servo.', unit:'rad', typical:'A position command in radians.'},
    deadTime:{label:'Dead time D', name:'D', meaning:'Dead time before the joint reacts, 31 to 36 ms measured on the real arm.', unit:'s', typical:'31 to 36 ms on the real arm.'},
    torque:{label:'Servo torque τ', name:'Servo torque', meaning:'The servo turns the gap between its goal and the joint into torque.', unit:'N·m', typical:'Clamped to 5.107 N·m.'},
    stiffness:{label:'kp', name:'kp', meaning:'Servo stiffness, 13.64 N·m/rad in the simulator, 15.6 to 16.5 measured.', unit:'N·m/rad', typical:'13.64 in the simulator; 15.6 to 16.5 measured.'},
    gap:{label:'(g − q)', name:'Gap g − q', meaning:'The stretch of the spring, the servo only makes torque from it.', unit:'rad', typical:'Goal angle minus joint angle.'},
    firmwareD:{label:'kd', name:'kd', meaning:'Firmware D term, acts like extra damping, scale not known.', unit:'N·m·s/rad', typical:'Scale not known.'},
    speed:{label:'q̇', name:'Joint speed q̇', meaning:'The speed of the joint.', unit:'rad/s', typical:'Changes with the motion.'},
    inertia:{label:'J', name:'J', meaning:'Inertia of the arm around the joint.', unit:'kg·m²', typical:'Depends on the arm pose and attached load.'},
    damping:{label:'d', name:'d', meaning:'Damping, 1.058 N·m·s/rad in simulation, 1.66 to 1.77 measured.', unit:'N·m·s/rad', typical:'1.058 in simulation; 1.66 to 1.77 measured.'},
    friction:{label:'f', name:'f', meaning:'Dry friction, 0.196 N·m in the simulator.', unit:'N·m', typical:'0.196 N·m in the simulator.'},
    gravity:{label:'G(q)', name:'G(q)', meaning:'Gravity torque, changes with the pose.', unit:'N·m', typical:'Changes with the joint pose.'},
    ticks:{label:'Encoder q (ticks)', name:'Ticks', meaning:'4096 per turn, 1 tick = 1.534 mrad.', unit:'ticks; rad', typical:'1 tick = 1.534 mrad.'},
  };
  const sequence = [
    ['term', 'target'], ['arrow', '→'], ['term', 'outer'], ['arrow', '→'], ['term', 'goal'], ['arrow', '→'],
    ['term', 'deadTime'], ['arrow', '→'], ['term', 'torque'], ['text', '='], ['term', 'stiffness'],
    ['text', '·'], ['term', 'gap'], ['text', '−'], ['term', 'firmwareD'], ['text', '·'], ['term', 'speed'],
    ['arrow', '→'], ['text', 'Joint:'], ['term', 'inertia'], ['text', 'q̈ ='], ['term', 'torque'],
    ['text', '−'], ['term', 'damping'], ['text', '·'], ['term', 'speed'], ['text', '−'], ['term', 'friction'],
    ['text', '· sign('], ['term', 'speed'], ['text', ') −'], ['term', 'gravity'], ['arrow', '→'], ['term', 'ticks'],
  ];
  const showTerm = (term, control) => {
    details.replaceChildren(node('h3', term.name));
    paragraph(details, term.meaning);
    paragraph(details, `Unit: ${term.unit}`, 'so101-term-unit');
    paragraph(details, `Typical value: ${term.typical}`, 'so101-term-typical');
    flow.querySelectorAll('.so101-term[aria-pressed="true"]').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    control.setAttribute('aria-pressed', 'true');
  };
  for (const [kind, value] of sequence) {
    if (kind === 'arrow') {
      flow.append(node('span', value, 'so101-equation-arrow'));
    } else if (kind === 'text') {
      flow.append(node('span', value, 'so101-equation-text'));
    } else {
      const term = terms[value];
      const control = button(term.label, 'so101-term');
      control.setAttribute('aria-controls', details.id);
      const show = () => showTerm(term, control);
      control.addEventListener('click', show);
      control.addEventListener('focus', show);
      control.addEventListener('pointerenter', show);
      flow.append(control);
    }
  }
  details.append(node('p', 'Select a term to read its meaning, unit, and typical value.'));
  content.append(flow, details);
  el.append(content);
}

function lagVsError(el) {
  const controls = node('div', undefined, 'so101-controls');
  const result = node('div', undefined, 'so101-results');
  const bars = node('div', undefined, 'so101-bars');
  const speedBar = valueBar(bars, 'Speed error', 0, 'mrad', 100);
  const loadBar = valueBar(bars, 'Load sag', 0, 'mrad', 100);
  const totalBar = valueBar(bars, 'Total error', 0, 'mrad', 100);
  const output = node('p', '', 'so101-total');
  const rateLabel = node('label', 'Loop rate', 'so101-select-label');
  const rate = node('select');
  rate.setAttribute('aria-label', 'Loop rate');
  for (const hz of [30, 60, 120]) {
    const option = node('option', `${hz} Hz`);
    option.value = String(hz);
    rate.append(option);
  }
  rate.value = '30';
  rateLabel.append(rate);
  el.append(controls, rateLabel, result, output, bars);
  let speed = 0.7;
  let kp = 13.64;
  let damping = 1.058;
  let load = 0.442;
  const update = () => {
    const dt = 1 / Number(rate.value);
    const lag = damping / kp + dt / 2;
    const speedError = speed * lag * 1000;
    const loadSag = load / kp * 1000;
    const total = speedError + loadSag;
    const unitLines = [
      `Lag: d ÷ kp + dt/2 = ${format(damping, 3)} N·m·s/rad ÷ ${format(kp, 2)} N·m/rad + ${format(dt * 500)} ms = ${format(lag * 1000)} ms.`,
      `Speed error: rad/s × ms = mrad.`,
      `Load sag: N·m ÷ (N·m/rad) = rad, then × 1000 = mrad.`,
    ];
    result.replaceChildren(...unitLines.map((line) => node('p', line, 'so101-units')));
    output.textContent = `Total: ${format(total)} mrad`;
    const max = Math.max(total, 1);
    updateBar(speedBar, speedError, 'mrad', max);
    updateBar(loadBar, loadSag, 'mrad', max);
    updateBar(totalBar, total, 'mrad', max);
  };
  addRange(controls, {label:'Speed v', min:0, max:1.5, step:0.01, value:speed, unit:'rad/s', onInput:(value) => { speed = value; update(); }});
  addRange(controls, {label:'Servo stiffness kp', min:5, max:40, step:0.1, value:kp, unit:'N·m/rad', onInput:(value) => { kp = value; update(); }});
  addRange(controls, {label:'Damping d', min:0.5, max:3, step:0.001, value:damping, unit:'N·m·s/rad', onInput:(value) => { damping = value; update(); }});
  addRange(controls, {label:'Load torque G', min:0, max:1, step:0.01, value:load, unit:'N·m', onInput:(value) => { load = value; update(); }});
  rate.addEventListener('change', update);
  update();
}

function errorBudget(el) {
  const controls = node('div', undefined, 'so101-controls');
  const budget = node('div', undefined, 'so101-budget');
  const track = node('div', undefined, 'so101-budget-track');
  const names = ['Gravity G/kp', 'Damping d·v/kp', 'Friction f/kp', 'Inertia Ja/kp', 'Goal hold v·dt/2'];
  const explanations = [
    'N·m ÷ (N·m/rad) = rad, then × 1000 = mrad.',
    '(N·m·s/rad × rad/s) ÷ (N·m/rad) = rad, then × 1000 = mrad.',
    'N·m ÷ (N·m/rad) = rad, then × 1000 = mrad.',
    'N·m ÷ (N·m/rad) = rad, then × 1000 = mrad.',
    'rad/s × s = rad, then × 1000 = mrad.',
  ];
  const segments = names.map((name, index) => {
    const segment = node('span', undefined, `so101-budget-segment so101-budget-segment-${index}`);
    segment.setAttribute('aria-hidden', 'true');
    track.append(segment);
    const row = node('div', undefined, 'so101-budget-item');
    row.append(node('span', name), node('output', '0.0 mrad'));
    row.append(node('p', explanations[index], 'so101-units'));
    budget.append(row);
    return {segment, output:row.querySelector('output')};
  });
  track.setAttribute('role', 'img');
  track.setAttribute('aria-label', 'Stacked horizontal bar of error gap parts');
  const total = node('p', '', 'so101-total');
  const measured = node('p', 'measured: 115.2 mrad', 'so101-measured');
  const wornLabel = node('label', undefined, 'so101-check-label');
  const worn = document.createElement('input');
  worn.type = 'checkbox';
  worn.setAttribute('aria-label', 'Worn robot');
  wornLabel.append(worn, node('span', 'Worn robot: friction × 2.5, damping × 1.5'));
  el.append(controls, wornLabel, track, budget, total, measured);
  let speed = 0.7035;
  let extra = 0;
  const dt = 1 / 30;
  const update = () => {
    const frictionScale = worn.checked ? 2.5 : 1;
    const dampingScale = worn.checked ? 1.5 : 1;
    const values = [
      (0.442 + extra) / 13.64 * 1000,
      (1.058 * dampingScale * speed) / 13.64 * 1000,
      (0.196 * frictionScale) / 13.64 * 1000,
      0.028 / 13.64 * 1000,
      speed * (dt / 2) * 1000 * (12 / (0.7035 * (dt / 2) * 1000)),
    ];
    const rounded = values.map((value) => Number(value.toFixed(1)));
    const sum = rounded.reduce((acc, value) => acc + value, 0);
    total.textContent = `Total gap: ${format(sum)} mrad`;
    track.setAttribute('aria-label', `Stacked horizontal bar of error gap parts. Total ${format(sum)} mrad. ${names.map((name, index) => `${name}: ${format(rounded[index])} mrad`).join('; ')}.`);
    segments.forEach(({segment, output}, index) => {
      output.value = `${format(rounded[index])} mrad`;
      segment.style.width = `${sum ? rounded[index] / sum * 100 : 0}%`;
    });
    const defaults = speed === 0.7035 && extra === 0 && !worn.checked;
    measured.hidden = !defaults;
  };
  addRange(controls, {label:'Speed v', min:0, max:1.2, step:0.0005, value:speed, unit:'rad/s', onInput:(value) => { speed = value; update(); }});
  addRange(controls, {label:'Extra load', min:0, max:0.5, step:0.01, value:extra, unit:'N·m', onInput:(value) => { extra = value; update(); }});
  worn.addEventListener('change', update);
  update();
}

async function predict(el, config) {
  const response = await fetch('/assets/robotics/so101-series/exam.json');
  if (!response.ok) throw new Error(`Question bank returned ${response.status}`);
  const bank = await response.json();
  const question = bank.questions.find((item) => item.id === config.id);
  if (!question) throw new Error(`Unknown question ${config.id}`);
  const body = node('div', undefined, 'so101-question');
  if (config.situation && question.situation) body.append(node('p', question.situation, 'so101-situation'));
  body.append(node('p', question.prompt, 'so101-prompt'));
  const answer = node('div', undefined, 'so101-question-answer');
  const feedback = node('div', undefined, 'so101-question-feedback');
  feedback.setAttribute('aria-live', 'polite');
  const reveal = button('Show the answer', 'so101-button-secondary');
  reveal.hidden = true;
  const showAnswer = () => {
    const model = node('section', undefined, 'so101-model-answer');
    model.append(node('h4', 'Model answer'), node('p', question.model_answer), node('h4', 'Explanation'), node('p', question.explanation));
    answer.replaceChildren(model);
    reveal.hidden = true;
  };
  reveal.addEventListener('click', showAnswer);
  let readValue = () => null;
  if (question.type === 'single' || question.type === 'multi') {
    const group = node('fieldset', undefined, 'so101-options');
    group.append(node('legend', question.type === 'multi' ? 'Select all that apply' : 'Select one answer'));
    const controls = [];
    question.options.forEach((option, index) => {
      const label = node('label', undefined, 'so101-option');
      const input = document.createElement('input');
      input.type = question.type === 'multi' ? 'checkbox' : 'radio';
      input.name = `so101-${question.id}`;
      input.value = String(index);
      input.setAttribute('aria-label', option.text);
      const text = node('span', option.text);
      label.append(input, text);
      group.append(label);
      controls.push({input, option});
    });
    body.append(group);
    readValue = () => controls.map(({input}, index) => input.checked ? index : -1).filter((index) => index >= 0);
    const check = button('Check');
    check.addEventListener('click', () => {
      const chosen = readValue();
      if (!chosen.length) { feedback.textContent = question.type === 'multi' ? 'Select at least one answer.' : 'Choose an answer.'; return; }
      let correct;
      if (question.type === 'single') correct = Boolean(question.options[chosen[0]].correct);
      else correct = question.options.every((option, index) => Boolean(option.correct) === chosen.includes(index));
      feedback.replaceChildren(node('p', correct ? 'Right.' : 'Not right.', correct ? 'so101-verdict-right' : 'so101-verdict-wrong'));
      for (const index of chosen) if (question.options[index].feedback) feedback.append(node('p', question.options[index].feedback));
      reveal.hidden = false;
    });
    body.append(check);
  } else if (question.type === 'numeric') {
    const label = node('label', `Answer (${question.numeric.unit})`, 'so101-number-label');
    const input = document.createElement('input');
    input.type = 'number';
    input.step = 'any';
    input.setAttribute('aria-label', `Answer in ${question.numeric.unit}`);
    label.append(input);
    body.append(label);
    readValue = () => input.value;
    const check = button('Check');
    check.addEventListener('click', () => {
      if (input.value === '' || !Number.isFinite(Number(input.value))) { feedback.textContent = `Enter a number in ${question.numeric.unit}.`; return; }
      const value = Number(input.value);
      const actual = question.numeric.magnitude ? Math.abs(value) : value;
      const expected = question.numeric.magnitude ? Math.abs(question.numeric.value) : question.numeric.value;
      const correct = Math.abs(actual - expected) <= question.numeric.tolerance;
      feedback.replaceChildren(node('p', correct ? 'Right.' : 'Not right.', correct ? 'so101-verdict-right' : 'so101-verdict-wrong'));
      reveal.hidden = false;
    });
    body.append(check);
  } else if (question.type === 'order') {
    const list = node('ol', undefined, 'so101-order');
    list.setAttribute('aria-label', 'Items to order. Use the Move up and Move down buttons.');
    const order = question.order_items.map((_, index) => index);
    const draw = () => {
      list.replaceChildren();
      order.forEach((index, position) => {
        const item = node('li', undefined, 'so101-order-item');
        item.append(node('span', question.order_items[index]));
        const actions = node('span', undefined, 'so101-order-actions');
        const up = button('Up');
        up.setAttribute('aria-label', `Move up: ${question.order_items[index]}`);
        up.disabled = position === 0;
        up.addEventListener('click', () => { [order[position - 1], order[position]] = [order[position], order[position - 1]]; draw(); list.querySelectorAll('button:not(:disabled)')[0]?.focus(); });
        const down = button('Down');
        down.setAttribute('aria-label', `Move down: ${question.order_items[index]}`);
        down.disabled = position === order.length - 1;
        down.addEventListener('click', () => { [order[position], order[position + 1]] = [order[position + 1], order[position]]; draw(); list.querySelectorAll('button:not(:disabled)')[0]?.focus(); });
        actions.append(up, down);
        item.append(actions);
        list.append(item);
      });
    };
    draw();
    body.append(list);
    readValue = () => order;
    const check = button('Check');
    check.addEventListener('click', () => {
      const correct = order.every((item, index) => item === index);
      feedback.replaceChildren(node('p', correct ? 'Right.' : 'Not right.', correct ? 'so101-verdict-right' : 'so101-verdict-wrong'));
      reveal.hidden = false;
    });
    body.append(check);
  } else if (question.type === 'free') {
    const label = node('label', 'Your answer', 'so101-text-label');
    const textarea = document.createElement('textarea');
    textarea.rows = 5;
    textarea.setAttribute('aria-label', 'Your answer');
    label.append(textarea);
    body.append(label);
    const show = button('Show the model answer', 'so101-button-secondary');
    show.addEventListener('click', showAnswer);
    body.append(show);
  }
  body.append(feedback, reveal);
  el.append(body);
}

register('servo-equation', servoEquation);
register('lag-vs-error', lagVsError);
register('error-budget', errorBudget);
register('predict', predict);

// Speed coupling: a two-link arm seen from above (no gravity), with the centrifugal and Coriolis forces on the forearm.
function speedCoupling(el) {
  const L1 = 0.116, LC2 = 0.10, M2 = 0.25, KP = 13.64;  // teaching model with SO-101-sized numbers
  const H = M2 * L1 * LC2;  // the coupling coefficient m2 l1 lc2 (kg·m²)
  const wrap = node('div', undefined, 'so101-coupling');
  const W = 420, HH = 340, CX = 210, CY = 175, S = 900;  // S: pixels per metre
  const svgEl = svg(W, HH);
  svgEl.classList.add('so101-coupling-svg');
  svgEl.setAttribute('aria-label', 'Top view of a two-link arm that turns. Arrows show the centrifugal force and the Coriolis force on the forearm.');
  const make = (name, attrs) => { const n = document.createElementNS(svgNamespace, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v)); return n; };
  const defs = make('defs', {});
  for (const [id, cls] of [['cf', 'so101-coupling-cf'], ['co', 'so101-coupling-co']]) {
    const marker = make('marker', {id:`so101-arrow-${id}`, viewBox:'0 0 10 10', refX:8, refY:5, markerWidth:6, markerHeight:6, orient:'auto-start-reverse'});
    marker.append(make('path', {d:'M0,0 L10,5 L0,10 z', class:cls}));
    defs.append(marker);
  }
  const trail = make('circle', {cx:CX, cy:CY, r:L1 * S, class:'so101-coupling-trail'});
  const link1 = make('line', {class:'so101-coupling-link'});
  const link2 = make('line', {class:'so101-coupling-link'});
  const base = make('circle', {cx:CX, cy:CY, r:9, class:'so101-coupling-joint'});
  const elbow = make('circle', {r:7, class:'so101-coupling-joint'});
  const com = make('circle', {r:6, class:'so101-coupling-com'});
  const cf = make('line', {class:'so101-coupling-cf-line', 'marker-end':'url(#so101-arrow-cf)'});
  const co = make('line', {class:'so101-coupling-co-line', 'marker-end':'url(#so101-arrow-co)'});
  svgEl.append(defs, trail, link1, link2, base, elbow, com, cf, co);
  const legend = node('p', undefined, 'so101-coupling-legend');
  legend.innerHTML = '<span class="so101-coupling-key so101-coupling-cf"></span> centrifugal force: pushes the forearm out from the shoulder <span class="so101-coupling-key so101-coupling-co"></span> Coriolis force: sideways, only when the elbow moves too';
  const controls = node('div', undefined, 'so101-controls');
  let w1 = 1.1, w2 = 0, q2 = 1.2, q1 = 0, playing = true;
  slider(controls, {label:'Shoulder speed', min:0, max:6, step:0.1, value:w1, unit:'rad/s', onInput:(v) => { w1 = v; draw(); }});
  slider(controls, {label:'Elbow speed', min:0, max:6, step:0.1, value:w2, unit:'rad/s', onInput:(v) => { w2 = Math.sign(w2 || 1) * v; draw(); }});
  const pause = button('Pause', 'so101-button-secondary');
  pause.addEventListener('click', () => { playing = !playing; pause.textContent = playing ? 'Pause' : 'Play'; if (playing) last = null, requestAnimationFrame(step); });
  controls.append(pause);
  const readout = node('div', undefined, 'so101-coupling-readout');
  readout.setAttribute('aria-live', 'polite');
  const rows = ['elbow', 'shoulder'].map((name) => { const p = node('p'); readout.append(p); return [name, p]; });
  wrap.append(svgEl, legend, controls, readout);
  el.append(wrap);
  const arrow = (line, x, y, fx, fy, scale) => {
    const len = Math.hypot(fx, fy) * scale;
    const k = len > 110 ? 110 / len : 1;  // long arrows are capped
    line.setAttribute('x1', x); line.setAttribute('y1', y);
    line.setAttribute('x2', x + fx * scale * k); line.setAttribute('y2', y - fy * scale * k);
    line.style.display = len < 2 ? 'none' : '';
  };
  function draw() {
    const ex = L1 * Math.cos(q1), ey = L1 * Math.sin(q1);
    const a = q1 + q2;
    const cx = ex + LC2 * Math.cos(a), cy = ey + LC2 * Math.sin(a);
    const px = (x) => CX + x * S, py = (y) => CY - y * S;
    link1.setAttribute('x1', CX); link1.setAttribute('y1', CY); link1.setAttribute('x2', px(ex)); link1.setAttribute('y2', py(ey));
    const tx = ex + 0.2 * Math.cos(a), ty = ey + 0.2 * Math.sin(a);
    link2.setAttribute('x1', px(ex)); link2.setAttribute('y1', py(ey)); link2.setAttribute('x2', px(tx)); link2.setAttribute('y2', py(ty));
    elbow.setAttribute('cx', px(ex)); elbow.setAttribute('cy', py(ey));
    com.setAttribute('cx', px(cx)); com.setAttribute('cy', py(cy));
    // forces seen by an observer who turns with the upper arm (rotation rate w1)
    const fcf = [M2 * w1 * w1 * cx, M2 * w1 * w1 * cy];  // centrifugal: m w1² r, out from the shoulder
    const vrel = [-w2 * LC2 * Math.sin(a), w2 * LC2 * Math.cos(a)];  // forearm centre speed from the elbow motion
    const fco = [2 * M2 * w1 * vrel[1], -2 * M2 * w1 * vrel[0]];  // Coriolis: -2 m w1 z × v_rel
    arrow(cf, px(cx), py(cy), fcf[0], fcf[1], 220);
    arrow(co, px(cx), py(cy), fco[0], fco[1], 220);
    const tauElbow = -H * Math.sin(q2) * w1 * w1;  // centrifugal torque on the elbow joint
    const tauShoulder = H * Math.sin(q2) * (2 * w1 * w2 + w2 * w2);  // Coriolis torque on the shoulder joint
    const text = (name, tau) => `${name}: ${Math.abs(tau * 1000).toFixed(1)} mN·m to add. If no one adds it, the joint misses by ${Math.abs(tau / KP * 1000).toFixed(2)} mrad (${(Math.abs(tau / KP * 1000) / 1.534).toFixed(2)} tick).`;
    rows[0][1].textContent = text('Elbow, centrifugal: h·sin(q₂)·ω₁²', tauElbow);
    rows[1][1].textContent = text('Shoulder, Coriolis and centrifugal: h·sin(q₂)·(2ω₁ω₂ + ω₂²)', tauShoulder);
  }
  let last = null;
  function step(now) {
    if (!playing) return;
    if (last !== null) {
      const dt = Math.min(0.05, (now - last) / 1000);
      q1 += w1 * dt * 0.5;  // the drawing turns at half speed so the eye can follow it
      q2 += w2 * dt * 0.5;
      if (q2 > 2.6 || q2 < 0.3) { w2 = -w2; q2 = Math.min(2.6, Math.max(0.3, q2)); }
    }
    last = now;
    draw();
    requestAnimationFrame(step);
  }
  draw();
  requestAnimationFrame(step);
}
register('speed-coupling', speedCoupling);



const SVG_NS = 'http://www.w3.org/2000/svg';
const MATRIX_COLUMNS = [
  ['delay', 'Delay'],
  ['band', 'Dead band'],
  ['sag', 'Gravity sag'],
  ['load', 'Load change'],
  ['model', 'Model error'],
  ['rep', 'Repeated error'],
];
const CONTROLLERS = [
  {id:'direct', family:'base', cells:['N', 'N', 'N', 'N', 'N', 'N']},
  {id:'lead', family:'base', cells:['P', 'N', 'N', 'N', 'N', 'N']},
  {id:'inv', family:'base', cells:['F', 'N', 'N', 'N', 'N', 'N']},
  {id:'pi', family:'fb', cells:['F', 'P', 'F', 'P', 'N', 'N']},
  {id:'sag', family:'fb', cells:['F', 'N', 'P', 'N', 'N', 'N']},
  {id:'grav', family:'fb', cells:['F', 'N', 'P', 'N', 'N', 'N']},
  {id:'pisag', family:'fb', cells:['F', 'P', 'F', 'P', 'N', 'N']},
  {id:'adapt', family:'adapt', cells:['F', 'P', 'F', 'F', 'P', 'N']},
  {id:'rls', family:'adapt', cells:['F', 'P', 'F', 'P', 'F', 'N']},
  {id:'solve', family:'model', cells:['F', 'F', 'F', 'P', 'P', 'N']},
  {id:'mpc', family:'model', cells:['F', 'F', 'F', 'P', 'P', 'N']},
  {id:'mpca', family:'adapt', cells:['F', 'F', 'F', 'F', 'P', 'N']},
  {id:'ilc', family:'rep', cells:['F', 'P', 'P', 'N', 'P', 'F']},
  {id:'ilcmpc', family:'rep', cells:['F', 'F', 'F', 'P', 'P', 'F']},
];
const FAMILIES = [
  {id:'base', label:'Base'},
  {id:'fb', label:'Feedback and gravity'},
  {id:'adapt', label:'Adaptive'},
  {id:'model', label:'Model-based'},
  {id:'rep', label:'Repeated paths'},
];
const CELL_WORDS = {F:'yes', P:'part', N:'no'};
let treeSequence = 0;


function element(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function svgElement(tag, attributes = {}, text) {
  const item = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, String(value));
  if (text !== undefined) item.textContent = text;
  return item;
}

function resolveInvocation(target, options) {
  if (target?.nodeType === 1) return {root:target, config:options && typeof options === 'object' ? options : {}};
  const context = target && typeof target === 'object' ? target : {};
  const root = context.root || context.container || context.mount || context.element;
  const config = context.config || context.options || options || context;
  return {root:root?.nodeType === 1 ? root : null, config:config && typeof config === 'object' ? config : {}};
}

function safeSameSitePath(value) {
  if (typeof value !== 'string' || !value || /[\\\u0000- ]/.test(value)) return null;
  if (!(value.startsWith('/') && !value.startsWith('//')) && !value.startsWith('#')) return null;
  try {
    const base = window.location.href;
    const url = new URL(value, base);
    if (url.origin !== window.location.origin || url.username || url.password) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function configuredLink(config, group, key) {
  const links = config?.links;
  if (!links || typeof links !== 'object') return null;
  const grouped = links[group];
  const value = grouped && typeof grouped === 'object' ? grouped[key] : links[key];
  return safeSameSitePath(typeof value === 'object' && value !== null ? value.href : value);
}

function columnLink(config, key, label, index) {
  const links = config?.columnLinks;
  if (!links || typeof links !== 'object') return null;
  let value;
  if (Array.isArray(links)) value = links[index];
  else value = links[key] ?? links[label];
  return safeSameSitePath(typeof value === 'object' && value !== null ? value.href : value);
}

function setWidgetRoot(root, type) {
  root.classList.add('so101-sim-widget');
  root.dataset.so101Widget = type;
  const fallback = root.querySelector('.so101-widget-fallback');
  root.replaceChildren(...(fallback ? [fallback] : []));
}

function addSvgText(parent, x, y, text, className, attributes = {}) {
  const classes = className ? className.split(' ') : [];
  const textElement = svgElement('text', {x, y, ...attributes});
  if (classes.length) textElement.setAttribute('class', classes.join(' '));
  textElement.textContent = text;
  parent.append(textElement);
  return textElement;
}

function addLine(parent, x1, y1, x2, y2, className, arrowId = null, extra = {}) {
  const attributes = {x1, y1, x2, y2, class:className, ...extra};
  if (arrowId) attributes['marker-end'] = `url(#${arrowId})`;
  const line = svgElement('line', attributes);
  parent.append(line);
  return line;
}

function addPolyline(parent, points, className, arrowId = null, extra = {}) {
  const attributes = {points, class:className, ...extra};
  if (arrowId) attributes['marker-end'] = `url(#${arrowId})`;
  const line = svgElement('polyline', attributes);
  parent.append(line);
  return line;
}

function addNode(parent, config, arrowLinks) {
  const {id, label, family, x, y, width = 90, height = 32, rootNode = false} = config;
  const link = configuredLink(arrowLinks, 'controllers', id) || configuredLink(arrowLinks, '', id);
  const group = svgElement(link ? 'a' : 'g', link ? {href:link, 'aria-label':`Open ${label} controller`} : {});
  group.setAttribute('class', `family-${family}`);
  group.setAttribute('data-controller', id);
  const box = svgElement('rect', {
    x, y, width, height,
    class:`node-box${rootNode ? ' root-node' : ''}`,
  });
  const text = svgElement('text', {
    x:x + width / 2,
    y:y + height / 2 + 5,
    class:'node-label mono',
    'text-anchor':'middle',
  }, label);
  group.append(box, text);
  parent.append(group);
  return group;
}

function addArrowMarker(defs, id) {
  const marker = svgElement('marker', {
    id,
    viewBox:'0 0 10 10',
    refX:9,
    refY:5,
    markerWidth:6,
    markerHeight:6,
    orient:'auto',
  });
  marker.append(svgElement('path', {d:'M0,0L10,5L0,10z', fill:'var(--so101-muted)'}));
  defs.append(marker);
}

function addTreeBranchLink(group, config, family, x, y, label, anchor) {
  const url = configuredLink(config, 'families', family) || configuredLink(config, '', family);
  const text = svgElement('text', {
    x, y, class:`family-name family-text`, 'text-anchor':'middle',
  }, label);
  if (url) {
    const link = svgElement('a', {href:url, 'aria-label':`Open ${label} section`});
    link.append(text);
    group.append(link);
    return link;
  }
  group.append(text);
  return text;
}

function renderFamilyTree(target, options) {
  const {root, config} = resolveInvocation(target, options);
  if (!root) return null;
  const showLearned = config.learned === true || config.showLearned === true;
  const families = showLearned ? [...FAMILIES, {id:'learned', label:'Part 4'}] : FAMILIES;
  const instance = ++treeSequence;
  const arrowId = `so101-tree-arrow-${instance}`;
  setWidgetRoot(root, 'family-tree');

  const controls = element('div', 'so101-family-controls');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Highlight a controller family');
  const svg = svgElement('svg', {
    class:'so101-tree-svg',
    viewBox:showLearned ? '0 0 860 470' : '0 0 860 400',
    role:'group',
    'aria-roledescription':'family tree',
    'aria-labelledby':`so101-tree-title-${instance} so101-tree-description-${instance}`,
  });
  const title = svgElement('title', {id:`so101-tree-title-${instance}`}, 'SO-101 controller family tree');
  const description = svgElement('desc', {id:`so101-tree-description-${instance}`},
    'Direct leads to lead, then inv. From inv, branches show feedback and gravity, adaptive, model-based, and repeated-path controllers. The optional learned branch links to Part 4.');
  const defs = svgElement('defs');
  addArrowMarker(defs, arrowId);
  svg.append(title, description, defs);

  const baseBranch = svgElement('g', {class:'family-base', 'data-family':'base'});
  addNode(baseBranch, {id:'direct', label:'direct', family:'base', x:20, y:20, rootNode:true}, config);
  addNode(baseBranch, {id:'lead', label:'lead', family:'base', x:150, y:20, rootNode:true}, config);
  addNode(baseBranch, {id:'inv', label:'inv', family:'base', x:280, y:20, rootNode:true}, config);
  addLine(baseBranch, 110, 37, 148, 37, 'base-line', arrowId);
  addLine(baseBranch, 240, 37, 278, 37, 'base-line', arrowId);
  addSvgText(baseBranch, 130, 72, '+1 tick early', 'edge-label muted', {'text-anchor':'middle'});
  addSvgText(baseBranch, 260, 72, '+ invert lag', 'edge-label muted', {'text-anchor':'middle'});
  addSvgText(baseBranch, 400, showLearned ? 76 : 34, 'Base: the delay only. Every other controller starts from inv.', 'edge-label muted');
  addLine(baseBranch, 325, 54, 325, 100, 'base-line');
  addLine(baseBranch, 90, 100, 740, 100, 'base-line');
  svg.append(baseBranch);
  const treeScroll = element('div', 'so101-tree-scroll');
  treeScroll.setAttribute('role', 'region');
  treeScroll.setAttribute('aria-label', 'Controller family tree. Scroll horizontally to view all branches.');
  treeScroll.tabIndex = 0;
  treeScroll.append(svg);
  root.append(controls, treeScroll);

  const familySpecs = [
    {id:'fb', label:'Feedback and gravity', center:90, x:45, nodes:[
      {id:'pi', x:45, y:140}, {id:'sag', x:45, y:190}, {id:'grav', x:45, y:240}, {id:'pisag', x:45, y:300},
    ]},
    {id:'adapt', label:'Adaptive', center:275, x:230, nodes:[
      {id:'adapt', x:230, y:140}, {id:'rls', x:230, y:190},
    ]},
    {id:'model', label:'Model-based', center:465, x:420, nodes:[
      {id:'solve', x:420, y:140}, {id:'mpc', x:420, y:190},
    ]},
    {id:'rep', label:'Repeated paths', center:690, x:645, nodes:[
      {id:'ilc', x:645, y:140},
    ]},
  ];
  const branchGroups = new Map();
  for (const family of familySpecs) {
    const group = svgElement('g', {class:`family-${family.id}`, 'data-family':family.id});
    branchGroups.set(family.id, group);
    addLine(group, family.center, 100, family.center, 138, 'branch-line');
    addTreeBranchLink(group, config, family.id, family.center, 125, family.label);
    for (const controller of family.nodes) {
      addNode(group, {
        ...controller,
        id:controller.id,
        label:controller.id,
        family:controller.id === 'mpca' ? 'adapt' : family.id,
      }, config);
    }
    svg.append(group);
  }

  const feedback = branchGroups.get('fb');
  addPolyline(feedback, '135,156 160,156 160,316 137,316', 'branch-line', arrowId);
  addPolyline(feedback, '135,206 160,206', 'branch-line');
  addSvgText(feedback, 168, 290, 'pi + sag', 'small-label muted');

  const adaptive = branchGroups.get('adapt');
  addPolyline(adaptive, '320,156 370,156 370,280 455,280 455,298', 'adapt-load-line', arrowId, {'stroke-dasharray':'4 3'});
  addLine(adaptive, 465, 222, 465, 298, 'branch-line', arrowId);
  addSvgText(adaptive, 380, 272, 'adapt load estimate', 'small-label', {fill:'var(--so101-adapt)'});
  addNode(adaptive, {id:'mpca', label:'mpca', family:'adapt', x:420, y:300}, config);

  const model = branchGroups.get('model');
  addLine(model, 465, 172, 465, 188, 'branch-line', arrowId);
  addSvgText(model, 475, 184, 'plans 0.25 s', 'small-label muted');
  addLine(model, 465, 222, 465, 298, 'branch-line', arrowId);

  const repeated = branchGroups.get('rep');
  addPolyline(model, '510,206 600,206 600,316 643,316', 'branch-line', arrowId);
  addPolyline(repeated, '690,172 690,298', 'rep-rule-line', arrowId, {'stroke-dasharray':'4 3'});
  addSvgText(repeated, 698, 240, 'ilc rule on', 'small-label', {fill:'var(--so101-rep)'});
  addSvgText(repeated, 698, 254, 'an mpc base', 'small-label', {fill:'var(--so101-rep)'});
  addNode(repeated, {id:'ilcmpc', label:'ilcmpc', family:'rep', x:645, y:300}, config);

  addSvgText(svg, 20, 370, showLearned
    ? 'The learned controllers come in part 4.'
    : 'Learned controllers (Fitted, the network) come in part 4.', 'edge-label muted');
  if (showLearned) {
    const learned = svgElement('g', {class:'family-learned', 'data-family':'learned'});
    addSvgText(learned, 410, 398, 'Part 4', 'small-label family-name', {'text-anchor':'middle'});
    addLine(learned, 90, 410, 730, 410, 'learned-line');
    const learnedNodes = [
      {id:'fitted', label:'Fitted', x:35},
      {id:'NN', label:'NN', x:220},
      {id:'net', label:'net', x:405},
      {id:'netmpc', label:'netmpc', x:590},
    ];
    for (const controller of learnedNodes) {
      addLine(learned, controller.x + 50, 410, controller.x + 50, 418, 'learned-line');
      addNode(learned, {...controller, family:'learned', y:418, width:100, height:32}, config);
    }
    svg.append(learned);
  }

  const allButton = element('button', '', 'All families');
  allButton.type = 'button';
  allButton.dataset.family = '';
  controls.append(allButton);
  for (const family of families) {
    const button = element('button', '', family.label);
    button.type = 'button';
    button.dataset.family = family.id;
    controls.append(button);
  }
  const updateHighlight = (selected) => {
    for (const button of controls.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', button.dataset.family === selected ? 'true' : 'false');
    }
    for (const group of svg.querySelectorAll('[data-family]')) {
      group.classList.toggle('is-dimmed', Boolean(selected) && group.dataset.family !== selected);
    }
    svg.dataset.highlight = selected || 'all';
  };
  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-family]');
    if (button && controls.contains(button)) updateHighlight(button.dataset.family);
  });
  const highlightMap = {adaptive:'adapt', 'model-based':'model'};
  const highlighted = Object.hasOwn(highlightMap, config.highlight) ? highlightMap[config.highlight] : config.highlight;
  const selected = families.some((family) => family.id === highlighted) ? highlighted : '';
  updateHighlight(selected);
  return root;
}

function addMatrixHeaderCell(row, label, link) {
  const header = element('th', '', '');
  header.scope = 'col';
  if (link) {
    const anchor = element('a', '', label);
    anchor.href = link;
    header.append(anchor);
  } else {
    header.textContent = label;
  }
  row.append(header);
}

function renderErrorMatrix(target, options) {
  const {root, config} = resolveInvocation(target, options);
  if (!root) return null;
  setWidgetRoot(root, 'error-matrix');

  const scroll = element('div', 'so101-matrix-scroll');
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', 'Controller error matrix. Scroll horizontally to view all six error columns.');
  scroll.tabIndex = 0;
  const table = element('table', 'so101-matrix');
  const caption = element('caption', 'visually-hidden', 'Controller error matrix. Each row shows which errors a controller removes.');
  const head = element('thead');
  const headingRow = element('tr');
  const controllerHeader = element('th', '', 'Controller');
  controllerHeader.scope = 'col';
  headingRow.append(controllerHeader);
  MATRIX_COLUMNS.forEach(([key, label], index) => {
    addMatrixHeaderCell(headingRow, label, columnLink(config, key, label, index));
  });
  head.append(headingRow);
  const body = element('tbody');
  for (const controller of CONTROLLERS) {
    const row = element('tr');
    const name = element('th');
    name.scope = 'row';
    const controllerHref = configuredLink(config, 'controllers', controller.id) ||
      configuredLink(config, '', controller.id);
    if (controllerHref) {
      const anchor = element('a', 'matrix-name', controller.id);
      anchor.href = controllerHref;
      name.append(anchor);
    } else {
      name.textContent = controller.id;
    }
    row.append(name);
    controller.cells.forEach((value, index) => {
      const [key, label] = MATRIX_COLUMNS[index];
      const cell = element('td', `cell cell-${value}`);
      cell.setAttribute('aria-label', `${controller.id}, ${label}: ${CELL_WORDS[value]}`);
      const dot = element('span', `so101-matrix-dot cell-${value}`);
      dot.setAttribute('aria-hidden', 'true');
      const text = element('span', 'visually-hidden', CELL_WORDS[value]);
      cell.append(dot, text);
      row.append(cell);
    });
    body.append(row);
  }
  table.append(caption, head, body);
  scroll.append(table);

  const legend = element('div', 'so101-matrix-legend');
  legend.setAttribute('role', 'group');
  legend.setAttribute('aria-label', 'Error removal legend');
  for (const [value, label] of [['F', 'yes'], ['P', 'part'], ['N', 'no']]) {
    const item = element('span');
    const dot = element('span', `so101-matrix-dot cell-${value}`);
    dot.setAttribute('aria-hidden', 'true');
    item.append(dot, document.createTextNode(label));
    legend.append(item);
  }
  const note = element('p', 'so101-matrix-note', 'This matrix is a teaching summary, made from the design of each controller and simulated tests. The real arm checked it only for pi on one motion.');
  root.append(scroll, legend, note);
  return root;
}

// Equation tree: the joint equation, with the problems that come out of each term.
const EQ_TERMS = [
  {id:'servo', group:'servo', html:'k<sub>p</sub>·(goal(t − D) − q̂)', name:'Servo torque', note:'what the servo gives, from a reading q̂'},
  {id:'mass', group:'mass', html:'M(q)·q̈', name:'Mass × acceleration', note:'inertia and payload'},
  {id:'gravity', group:'force', html:'G(q)', name:'Gravity', note:'changes with the pose'},
  {id:'wet', group:'force', html:'d·q̇', name:'Wet friction', note:'grows with speed'},
  {id:'dry', group:'force', html:'f·sign(q̇)', name:'Dry friction', note:'fixed size, flips with direction'},
  {id:'coupling', group:'force', html:'C(q, q̇)·q̇', name:'Speed coupling', note:'Coriolis and centrifugal'},
];
const EQ_GROUPS = [
  {id:'servo', title:'Servo side', lead:'The servo decides when the torque comes and how much it can be.'},
  {id:'sensor', title:'Sensor side', lead:'The controller reads q̂, not q, so its speed and acceleration are worse still.'},
  {id:'mass', title:'Mass term', lead:'The mass that the joint moves is not one fixed number.'},
  {id:'force', title:'Force terms', lead:'Forces that a plain τ = J·q̈ does not include, largest first.'},
];
const EQ_PROBLEMS = [
  {id:'gravity', term:'gravity', group:'force', name:'Gravity changes with the pose', size:'−3.8 mrad tucked in, +42 mrad reaching out (real arm, direct)'},
  {id:'wet', term:'wet', group:'force', name:'Wet friction becomes a lag', size:'d / kp = 78 ms (simulator), 87 to 105 ms (real arm); 54.6 mrad at 0.70 rad/s'},
  {id:'dry', term:'dry', group:'force', name:'Dry friction makes a band, not a point', size:'14.3 to 43.0 mrad band; stiction and stick-slip at low speed'},
  {id:'coupling', term:'coupling', group:'force', name:'One joint pushes another', size:'0.38 to 1.5 mrad at 1.1 rad/s, against 43 mrad of gravity'},
  {id:'inertia', term:'mass', group:'mass', name:'Inertia', size:'2.1 mrad in the example step'},
  {id:'payload', term:'mass', also:['gravity'], group:'mass', name:'A payload adds mass and weight', size:'200 g: about 40 mrad more sag (simulator)'},
  {id:'deadtime', term:'servo', group:'servo', name:'Dead time D', size:'31 to 36 ms before any motion (real arm)'},
  {id:'hold', term:'servo', group:'servo', name:'Goal hold', size:'half a step: 16.7 ms at 30 Hz'},
  {id:'deadband', term:'servo', group:'servo', name:'Dead band: no torque from a small gap', size:'8.1 to 21.0 mrad (real arm)'},
  {id:'limit', term:'servo', group:'servo', name:'Torque limit', size:'5.107 N·m (simulator)'},
  {id:'heat', term:'servo', group:'servo', name:'Heat makes kp weaker', size:'about −0.4 % per °C (not measured)'},
  {id:'ticks', term:'servo', group:'sensor', name:'Ticks', size:'1 tick = 1.534 mrad; rounding RMS 0.443 mrad'},
  {id:'derivative', term:'servo', group:'sensor', name:'Differences of ticks', size:'1 tick → 1.4 rad/s² of acceleration error at 30 Hz'},
];

function renderEquationTree(el, config) {
  const root = el;
  setWidgetRoot(root, 'equation-tree');
  const wrap = element('div', 'so101-eqtree');
  const equation = element('div', 'so101-eqtree-equation');
  equation.setAttribute('role', 'group');
  equation.setAttribute('aria-label', 'Equation of one joint. Select a term to show its problems.');
  const chips = new Map();
  const status = element('p', 'so101-eqtree-status');
  status.setAttribute('aria-live', 'polite');
  const groupsBox = element('div', 'so101-eqtree-groups');
  const rows = new Map();
  let selected = null;
  const select = (id) => {
    selected = selected === id ? null : id;
    for (const [termId, chip] of chips) chip.setAttribute('aria-pressed', String(termId === selected));
    for (const [problemId, row] of rows) {
      const problem = EQ_PROBLEMS.find((item) => item.id === problemId);
      const match = !selected || problem.term === selected || problem.also?.includes(selected)
        || (selected === 'servo' && problem.group === 'sensor');
      row.classList.toggle('is-dim', !match);
    }
    const term = EQ_TERMS.find((item) => item.id === selected);
    status.textContent = term ? `${term.name}: ${term.note}. The problems of this term stay bright.` : 'Select a term to show the problems that come out of it.';
  };
  EQ_TERMS.forEach((term, index) => {
    if (index === 1) equation.append(element('span', 'so101-eqtree-op', '='));
    else if (index > 1) equation.append(element('span', 'so101-eqtree-op', '+'));
    const chip = element('button', `so101-eqtree-chip so101-eqtree-${term.group}`);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', 'false');
    const math = element('span', 'so101-eqtree-math');
    math.innerHTML = term.html;
    chip.append(math, element('span', 'so101-eqtree-name', term.name));
    chip.addEventListener('click', () => select(term.id));
    chips.set(term.id, chip);
    equation.append(chip);
  });
  for (const group of EQ_GROUPS) {
    const card = element('section', `so101-eqtree-group so101-eqtree-${group.id}`);
    card.append(element('h4', '', group.title), element('p', 'so101-eqtree-lead', group.lead));
    const list = element('ul');
    for (const problem of EQ_PROBLEMS.filter((item) => item.group === group.id)) {
      const item = element('li');
      const href = safeSameSitePath(config?.links?.[problem.id]);
      const name = href ? element('a', 'so101-eqtree-problem', problem.name) : element('span', 'so101-eqtree-problem', problem.name);
      if (href) name.href = href;
      item.append(name, element('span', 'so101-eqtree-size', problem.size));
      rows.set(problem.id, item);
      list.append(item);
    }
    card.append(list);
    groupsBox.append(card);
  }
  wrap.append(equation, status, groupsBox);
  root.append(wrap);
  select(null);
  return root;
}

// General goal equation: every controller is this equation with some coefficients set to zero.
const GOAL_SLOTS = [
  {id:'T', html:'q*(t + <b>T</b>)', name:'Look ahead', fixes:'dead time, goal hold, lag'},
  {id:'M', html:'<b>M̂</b>q̈*', name:'Inertia', fixes:'mass and payload', tau:true},
  {id:'C', html:'<b>Ĉ</b>q̇*', name:'Speed coupling', fixes:'Coriolis', tau:true},
  {id:'G', html:'<b>Ĝ</b>(q*)', name:'Gravity', fixes:'sag', tau:true},
  {id:'d', html:'<b>d̂</b>q̇*', name:'Wet friction', fixes:'lag', tau:true},
  {id:'f', html:'<b>f̂</b>·sign(q̇*)', name:'Dry friction', fixes:'friction band', tau:true},
  {id:'w', html:'<b>ŵ</b>', name:'Disturbance estimate', fixes:'unknown load, model error'},
  {id:'P', html:'<b>K<sub>P</sub></b>·e', name:'Proportional feedback', fixes:'error now'},
  {id:'I', html:'<b>K<sub>I</sub></b>·∫e', name:'Integral feedback', fixes:'steady error'},
  {id:'u', html:'<b>u<sub>k</sub></b>', name:'Learned per step', fixes:'repeated error'},
];
const GOAL_FAMILIES = [
  {id:'none', title:'1. Do nothing', problem:'Nothing. This is the baseline that shows every problem.'},
  {id:'time', title:'2. Look ahead in time', problem:'The goal arrives late: dead time, goal hold and the lag of wet friction.'},
  {id:'known', title:'3. Add the forces you know', problem:'Forces you can compute before the run: gravity, inertia, friction.'},
  {id:'unknown', title:'4. Estimate what you don\'t know', problem:'Forces you cannot compute before the run: a payload, wear, model error.'},
  {id:'plan', title:'5. Plan with a servo model', problem:'Parts with no formula inverse: dead band, ticks, goal hold, torque limit.'},
  {id:'learn', title:'6. Learn from repeats or data', problem:'Errors that repeat on the same path, or that the model form misses.'},
];
const GOAL_METHODS = [
  {id:'direct', family:'none', on:[], values:'Every coefficient is 0: goal = q*(t).', result:'Real arm: 22.5 mrad (cat, 30 Hz).'},
  {id:'lead', family:'time', on:['T'], values:'T = one step (33 ms at 30 Hz).', result:'Real arm: 23.7 mrad (signature motion), against 28.3 for direct.'},
  {id:'inv', family:'time', on:['T', 'M', 'd'], values:'T = 33 ms, d̂/kp = 0.106 s (the lag), M̂/kp = 0.0023 s². The last two are fitted on a step test of the real arm, not computed from the masses.', result:'Real arm: 13.4 mrad (signature motion).'},
  {id:'sag', family:'known', on:['T', 'M', 'd', 'G'], values:'inv + Ĝ/kp fitted on holds of the real arm. On my logs it is almost a constant for each joint.', result:'This series reports no number for it.'},
  {id:'grav', family:'known', on:['T', 'M', 'd', 'G'], values:'inv + Ĝ from the MuJoCo model at the target pose, divided by kp.', result:'This series reports no number for it.'},
  {id:'Classical', family:'known', on:['T', 'M', 'G', 'd', 'f', 'P', 'I'], values:'T = one step. τ̂ from a fixed physics model with nominal numbers. K_P = 4, K_I = 10 s⁻¹.', result:'Simulation: 1.117 mrad, against 37.2 for the out-of-the-box controller.'},
  {id:'pi', family:'unknown', on:['T', 'M', 'd', 'P', 'I'], values:'inv + K_P = 0.2 and K_I = 2 s⁻¹, with an integral limit of 0.08 rad.', result:'Real arm: 8.4 mrad (cat, 60 Hz).'},
  {id:'pisag', family:'unknown', on:['T', 'M', 'd', 'G', 'P', 'I'], values:'sag + the pi correction.', result:'This series reports no number for it.'},
  {id:'adapt', family:'unknown', on:['T', 'M', 'd', 'w'], values:'inv − ŵ. A Kalman filter estimates ŵ in three parts: a fast load, a slow sag and friction.', result:'Stand-in test: 4.90 mrad.'},
  {id:'rls', family:'unknown', on:['T', 'M', 'd'], learnedOnline:true, values:'The coefficients themselves change during the run (recursive least squares).', result:'This series reports no number for it.'},
  {id:'solve', family:'plan', on:['T', 'M', 'd', 'G', 'w'], search:'one destination goal for each joint, 0.25 s ahead', values:'The servo model has the dead time, lag, dead band, gain and sag. The search handles the dead band and the ticks.', result:'Real arm: 6.2 mrad (cat, 60 Hz).'},
  {id:'mpc', family:'plan', on:['T', 'M', 'd', 'G', 'w'], search:'one goal for each step of a 0.25 s plan', values:'The same model as solve, with a free goal at each step.', result:'Real arm: 6.0 mrad (cat, 60 Hz).'},
  {id:'mpca', family:'plan', on:['T', 'M', 'd', 'G', 'w'], search:'one goal for each step of a 0.25 s plan', values:'mpc with the Kalman estimate of adapt in place of its own ŵ.', result:'Real arm: 10.3 mrad on shoulder_lift, against 87.6 for direct (120 s, 60 Hz).'},
  {id:'Fitted', family:'plan', on:['T', 'M', 'C', 'G', 'd', 'f', 'I'], search:'one goal for the next 33 ms step, simulated in 8 substeps', values:'A fitted MuJoCo copy of the arm, inverted with Newton’s method. K_I = 3.', result:'Simulation: 0.398 mrad.'},
  {id:'ilc', family:'learn', on:['T', 'M', 'd', 'u'], values:'inv + u_k. After each run, u_k adds half of the error that step k caused one servo delay later, then a 2 Hz smoothing filter.', result:'This series reports no number for it.'},
  {id:'ilcmpc', family:'learn', on:['T', 'M', 'd', 'G', 'w', 'u'], search:'one goal for each step of a 0.25 s plan', values:'mpc that tracks the target plus u_k.', result:'Stand-in test: 1.04 mrad, the lowest.'},
  {id:'PhysR', family:'learn', on:['T', 'M', 'C', 'G', 'd', 'f'], learned:['w'], search:'goals compared through the full physical model of the 5 joints', values:'phys: a full physical model fitted on the real arm, with an EKF estimate of the missing torque in the ŵ slot. PhysR adds a small recurrent network (GRU) that learns a torque residual in the same slot.', result:'Offline, real windows: 2 to 12 % lower 6-tick error than phys alone. No closed-loop result yet.'},
  {id:'network', family:'learn', on:['T', 'P', 'I'], learned:['M', 'C', 'G', 'd', 'f'], values:'T = one step. A small network learns the whole τ̂/kp part from data. K_P = −0.25 (from its step rule) and K_I = 3.', result:'Simulation: 0.446 mrad.'},
];

function renderGoalEquation(el, config = {}) {
  setWidgetRoot(el, 'goal-equation');
  const wrap = element('div', 'so101-goal');
  const familyRow = element('div', 'so101-goal-families');
  familyRow.setAttribute('role', 'group');
  familyRow.setAttribute('aria-label', 'Family');
  const methodRow = element('div', 'so101-goal-methods');
  methodRow.setAttribute('role', 'group');
  methodRow.setAttribute('aria-label', 'Controller');
  const equation = element('div', 'so101-goal-equation');
  equation.append(element('span', 'so101-goal-lhs', 'goal(t) ='));
  const slotNodes = new Map();
  GOAL_SLOTS.forEach((slot, index) => {
    if (slot.id === 'M') equation.append(element('span', 'so101-goal-paren', '+ ( '));
    else if (index > 0 && slot.id !== 'M') equation.append(element('span', 'so101-goal-op', slot.id === 'w' ? ' ) / kp +' : '+'));
    const box = element('span', 'so101-goal-slot');
    const math = element('span', 'so101-goal-math');
    math.innerHTML = slot.html;
    box.append(math, element('span', 'so101-goal-slot-name', slot.name));
    slotNodes.set(slot.id, box);
    equation.append(box);
  });
  const searchNote = element('p', 'so101-goal-search');
  const panel = element('div', 'so101-goal-panel');
  panel.setAttribute('aria-live', 'polite');
  const familyButtons = new Map();
  let method = GOAL_METHODS.some((item) => item.id === config.method) ? config.method : 'inv';
  const show = () => {
    const current = GOAL_METHODS.find((item) => item.id === method);
    const family = GOAL_FAMILIES.find((item) => item.id === current.family);
    for (const [id, buttonNode] of familyButtons) buttonNode.setAttribute('aria-pressed', String(id === family.id));
    methodRow.replaceChildren();
    for (const item of GOAL_METHODS.filter((entry) => entry.family === family.id)) {
      const choice = element('button', 'so101-goal-method', item.id);
      choice.type = 'button';
      choice.setAttribute('aria-pressed', String(item.id === method));
      choice.addEventListener('click', () => { method = item.id; show(); });
      methodRow.append(choice);
    }
    const off = [];
    for (const slot of GOAL_SLOTS) {
      const node = slotNodes.get(slot.id);
      const state = current.on.includes(slot.id) ? 'on' : current.learned?.includes(slot.id) ? 'learned' : 'off';
      node.dataset.state = state;
      node.title = state === 'off' ? `${slot.name}: 0` : `${slot.name}: on`;
      if (state === 'off') off.push(slot.name.toLowerCase());
    }
    equation.dataset.online = String(Boolean(current.learnedOnline));
    searchNote.textContent = current.search
      ? `Inverted by search: ${current.search}. No formula gives this goal, so a model of the servo is simulated for each candidate.`
      : current.learnedOnline ? 'The bright coefficients are not fixed: the controller re-fits them at each step.' : 'Inverted by formula: the goal is the sum of the bright terms.';
    panel.replaceChildren(
      element('p', 'so101-goal-problem', `Problem this family solves: ${family.problem}`),
      element('p', '', current.values),
      element('p', 'so101-goal-off', off.length ? `Set to 0: ${off.join(', ')}.` : 'No term is 0.'),
      element('p', 'so101-goal-result', current.result));
  };
  for (const family of GOAL_FAMILIES) {
    const choice = element('button', 'so101-goal-family', family.title);
    choice.type = 'button';
    choice.addEventListener('click', () => { method = GOAL_METHODS.find((item) => item.family === family.id).id; show(); });
    familyButtons.set(family.id, choice);
    familyRow.append(choice);
  }
  const legend = element('p', 'so101-goal-legend');
  legend.innerHTML = '<span class="so101-goal-key" data-state="on"></span> on <span class="so101-goal-key" data-state="learned"></span> learned by a network <span class="so101-goal-key" data-state="off"></span> 0';
  wrap.append(familyRow, methodRow, element('div', 'so101-goal-scroll'), searchNote, legend, panel);
  wrap.querySelector('.so101-goal-scroll').append(equation);
  el.append(wrap);
  show();
  return el;
}

register('equation-tree', renderEquationTree);
register('goal-equation', renderGoalEquation);

register('family-tree', renderFamilyTree);
register('error-matrix', renderErrorMatrix);


const TIMELINE_STAGES = [
  {id:'architecture', label:'1. One general architecture',
    llm:'2017: the Transformer. One network design for many language tasks.',
    robot:'2022 to 2023: RT-1 and ACT. Transformers map camera images to robot actions.',
    note:'The architecture arrives first. It is necessary, but on its own it is not enough.'},
  {id:'borrow', label:'2. Borrow knowledge from the web',
    llm:'2018: GPT-1 and BERT. Pretrain on lots of text, then fine-tune on a small task.',
    robot:'2022 to 2023: SayCan, RT-2 and Open X-Embodiment. A vision-language model becomes a vision-language-action model (VLA), and labs pool their robot data.',
    note:'Web knowledge transfers: RT-2 roughly doubled success on unseen scenes compared with RT-1.'},
  {id:'data', label:'3. Collect data on purpose, at scale', here:true,
    llm:'2019: GPT-2. A bigger model trained on more data generalizes better. Data-labeling companies grow around that bet.',
    robot:'2024 to 2026: π0, Helix, π0.5, the Atlas large behavior model, Figure Index. Companies build fleets and apps only to collect robot and human data.',
    note:'We are here. The bet is clear, and the first scaling curves are only starting to appear.'},
  {id:'scaling', label:'4. Measure what scale buys',
    llm:'2020: scaling laws and GPT-3. Loss falls predictably with model size, data and compute.',
    robot:'Starting. EgoScale (2026) finds that loss falls log-linearly with hours of human video, and robot success rises with it. No general law yet.',
    note:'For LLMs, this turned a bet into an investment plan. Robotics has one early curve, for one recipe and one robot.'},
  {id:'product', label:'5. Reliable enough for everyone',
    llm:'2022: InstructGPT, then ChatGPT. Human feedback makes the model useful to anyone.',
    robot:'Open. A robot that finishes a household or factory job without help, at a price people pay.',
    note:'For robots, the bar is higher: a wrong answer in chat costs a retry, a wrong grasp can break something.'},
];
const TIMELINE_EVENTS = [
  {lane:'llm', t:2017.45, label:'Transformer', stage:'architecture'},
  {lane:'llm', t:2018.45, label:'GPT-1', stage:'borrow'},
  {lane:'llm', t:2018.8, label:'BERT', stage:'borrow'},
  {lane:'llm', t:2019.13, label:'GPT-2', stage:'data'},
  {lane:'llm', t:2020.05, label:'Scaling laws', stage:'scaling'},
  {lane:'llm', t:2020.4, label:'GPT-3', stage:'scaling'},
  {lane:'llm', t:2022.2, label:'InstructGPT', stage:'product'},
  {lane:'llm', t:2022.9, label:'ChatGPT', stage:'product'},
  {lane:'robot', t:2022.3, label:'SayCan', stage:'borrow'},
  {lane:'robot', t:2022.95, label:'RT-1', stage:'architecture'},
  {lane:'robot', t:2023.3, label:'ACT', stage:'architecture'},
  {lane:'robot', t:2023.55, label:'RT-2 (VLA)', stage:'borrow'},
  {lane:'robot', t:2023.8, label:'Open X', stage:'borrow'},
  {lane:'robot', t:2024.83, label:'π0', stage:'data'},
  {lane:'robot', t:2025.1, label:'Helix', stage:'data'},
  {lane:'robot', t:2025.3, label:'π0.5', stage:'data'},
  {lane:'robot', t:2025.63, label:'Atlas LBM', stage:'data'},
  {lane:'robot', t:2026.1, label:'EgoScale', stage:'scaling'},
  {lane:'robot', t:2026.6, label:'Index', stage:'data'},
];

function renderLlmTimeline(el) {
  setWidgetRoot(el, 'llm-timeline');
  const grid = element('div', 'llm-timeline-grid');
  grid.setAttribute('role', 'table');
  grid.setAttribute('aria-label', 'Language model and robot learning milestones by year');
  const head = element('div', 'llm-timeline-line llm-timeline-head');
  head.setAttribute('role', 'row');
  for (const text of ['Language models', 'Year', 'Robot learning']) {
    const cell = element('div', 'llm-timeline-cell', text);
    cell.setAttribute('role', 'columnheader');
    head.append(cell);
  }
  grid.append(head);
  const marks = [];
  const tag = (event) => {
    const item = element('span', `llm-timeline-tag lane-${event.lane}`, event.label);
    item.dataset.stage = event.stage;
    marks.push(item);
    return item;
  };
  for (let year = 2017; year <= 2026; year += 1) {
    const row = element('div', 'llm-timeline-line');
    row.setAttribute('role', 'row');
    const cells = ['llm', 'year', 'robot'].map((lane) => {
      const cell = element('div', `llm-timeline-cell cell-${lane}`);
      cell.setAttribute('role', 'cell');
      if (lane === 'year') cell.textContent = String(year);
      else TIMELINE_EVENTS.filter((event) => event.lane === lane && Math.floor(event.t) === year).forEach((event) => cell.append(tag(event)));
      return cell;
    });
    if (year === 2019) cells[0].append(element('span', 'llm-timeline-pointer', '→ the stage robots reach in 2026'));
    if (year === 2026) cells[2].append(element('span', 'llm-timeline-pointer is-here', '▲ we are here: the GPT-2 stage'));
    row.append(...cells);
    grid.append(row);
  }
  const buttons = element('div', 'llm-timeline-stages');
  buttons.setAttribute('role', 'group');
  buttons.setAttribute('aria-label', 'Choose a stage');
  const panel = element('div', 'llm-timeline-panel');
  panel.setAttribute('aria-live', 'polite');
  const stageButtons = new Map();
  const select = (stage) => {
    for (const [id, item] of stageButtons) item.setAttribute('aria-pressed', String(id === stage.id));
    for (const mark of marks) mark.classList.toggle('is-active', mark.dataset.stage === stage.id);
    const rows = [['Language models', stage.llm], ['Robot learning', stage.robot]].map(([name, text]) => {
      const row = element('p', 'llm-timeline-row');
      row.append(element('strong', '', `${name}: `), document.createTextNode(text));
      return row;
    });
    panel.replaceChildren(element('h4', '', stage.label), ...rows, element('p', stage.here ? 'llm-timeline-note is-current' : 'llm-timeline-note', stage.note));
  };
  for (const stage of TIMELINE_STAGES) {
    const item = button(stage.here ? `${stage.label} (we are here)` : stage.label, stage.here ? 'llm-timeline-current' : '');
    item.addEventListener('click', () => select(stage));
    stageButtons.set(stage.id, item);
    buttons.append(item);
  }
  el.append(element('p', 'llm-timeline-intro', 'Pick a stage. Its milestones light up in both columns.'), buttons, panel, grid);
  select(TIMELINE_STAGES.find((stage) => stage.here));
}
register('llm-timeline', renderLlmTimeline);

function mount(element, fn) {
  if (element.dataset.so101Ready === 'true' || element.dataset.so101Ready === 'pending') return;
  let config;
  try { config = JSON.parse(element.dataset.config); } catch { return; }
  element.dataset.so101Ready = 'pending';
  try {
    const fallback = element.querySelector('.so101-widget-fallback');
    const result = fn(element, config);
    Promise.resolve(result).then(() => {
      fallback?.remove();
      element.dataset.so101Ready = 'true';
    }).catch((error) => {
      delete element.dataset.so101Ready;
      console.error('SO-101 widget failed:', error);
    });
  } catch (error) {
    delete element.dataset.so101Ready;
    console.error('SO-101 widget failed:', error);
  }
}
function initialize() {
  for (const element of document.querySelectorAll('figure.so101-widget')) {
    const fn = registry.get(element.dataset.type);
    if (fn) mount(element, fn);
  }
}
function register(type, fn) {
  if (typeof type !== 'string' || typeof fn !== 'function') throw new TypeError('register needs a widget type and function');
  registry.set(type, fn);
  initialize();
}

try { await import(`/assets/so101-sims.js${new URL(import.meta.url).search}`); } catch (error) { console.warn('Optional SO-101 simulator widgets did not load:', error); }
initialize();
