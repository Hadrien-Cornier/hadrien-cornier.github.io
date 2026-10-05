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
  const families = showLearned ? [...FAMILIES, {id:'learned', label:'Part 5'}] : FAMILIES;
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
    'Direct leads to lead, then inv. From inv, branches show feedback and gravity, adaptive, model-based, and repeated-path controllers. The optional learned branch links to Part 5.');
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
    ? 'The learned controllers come in part 5.'
    : 'Learned controllers (Fitted, the network) come in part 5.', 'edge-label muted');
  if (showLearned) {
    const learned = svgElement('g', {class:'family-learned', 'data-family':'learned'});
    addSvgText(learned, 410, 398, 'Part 5', 'small-label family-name', {'text-anchor':'middle'});
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

register('family-tree', renderFamilyTree);
register('error-matrix', renderErrorMatrix);

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
