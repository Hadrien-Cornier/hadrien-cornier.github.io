/* A small scene shows control mechanisms. The engine owns every simulated result. */
const simulatorURL = new URL('./control-simulator.mjs', import.meta.url);
simulatorURL.search = new URL(import.meta.url).search;

try {
  const simulator = await import(simulatorURL.href);
  for (const root of document.querySelectorAll('[data-control-playground]')) {
    initializePlayground(root, simulator);
  }
} catch {
  // Keep the static illustration and article link available if initialization fails.
  for (const root of document.querySelectorAll('[data-control-playground]')) {
    root.dataset.initialization = 'failed';
  }
}

function initializePlayground(root, simulator) {
  const {
    MODES, createSimulation, stepSimulation, setObjectPosition, setInstruction,
    toggleObstacle, startSimulation, pauseSimulation, setInferenceDelay,
  } = simulator;
  const get = selector => root.querySelector(selector);
  const svg = get('[data-control-scene]');
  const modeSelect = get('[data-control-mode]');
  const instructionSelect = get('[data-control-instruction]');
  const robot = get('[data-control-robot]');
  const tray = get('[data-control-tray]');
  const obstacle = get('[data-control-obstacle]');
  const trail = get('[data-control-trail]');
  const plan = get('[data-control-plan]');
  const committed = get('[data-control-committed]');
  const committedLegend = get('[data-control-committed-legend]');
  const candidates = get('[data-control-candidates]');
  const candidateLegend = get('[data-control-candidate-legend]');
  const futureRegion = get('[data-control-futures]');
  const futureFrames = get('[data-control-future-frames]');
  const status = get('[data-control-status]');
  const announcement = get('[data-control-announcement]');
  const elapsed = get('[data-control-elapsed]');
  const mechanism = get('[data-control-mechanism]');
  const runButton = get('[data-control-action="run"]');
  const moveButton = get('[data-control-action="move"]');
  const obstacleButton = get('[data-control-action="obstacle"]');
  const delaySlider = get('[data-control-delay]');
  const delayOutput = get('[data-control-delay-output]');
  const replanOutput = get('[data-control-replans]');
  const waitOutput = get('[data-control-wait]');
  const objectNodes = new Map([...root.querySelectorAll('[data-control-object]')]
    .map(node => [node.dataset.controlObject, node]));
  const descriptions = {
    scripted: 'Replay the same commands. Moving the target leaves the route unchanged.',
    chunks: 'Observe. Compute a short sequence. Execute it. Wait for the next sequence.',
    realtime: 'Compute the next sequence while moving. Keep commands that must execute, then revise the rest.',
    diffusion: 'Refine a noisy action plan before sending its commands to the arm.',
    generalist: 'Use the scene and instruction to choose the object and movement.',
    world: 'Predict candidate outcomes. Choose a route, move one step, then predict again.',
  };
  const finished = new Set(['success', 'miss', 'collision', 'wrong-object', 'timeout']);
  const seed = 11;
  const mapPoint = point => ({ x: 20 + Number(point.x) * 400, y: 15 + Number(point.y) * 215 });
  const pointPath = points => (points || [])
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point, index) => {
      const mapped = mapPoint(point);
      return `${index ? 'L' : 'M'}${mapped.x.toFixed(2)} ${mapped.y.toFixed(2)}`;
    }).join(' ');
  const svgNode = (name, attrs = {}) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  };
  const writeText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  let state = createSimulation({ mode: modeSelect.value, seed });
  let setup = captureSetup(state);
  let animation = null;
  let lastFrame = null;
  let lastPhase = null;
  let lastRunning = null;
  let isVisible = true;
  let perturbation = 0;
  let drag = null;

  // Keep edits as the next trial's starting scene. Robot transport never changes this setup.
  function captureSetup(current) {
    return {
      objects: current.objects.map(({ id, x, y }) => ({ id, x, y })),
      instruction: current.instruction,
      obstacle: { ...current.obstacle },
      latency: current.settings?.latency ?? .3,
    };
  }

  function replaceState(mode = state.mode) {
    stopFrame();
    state = createSimulation({ mode, seed });
    for (const item of setup.objects) setObjectPosition(state, item.id, item.x, item.y);
    setInstruction(state, setup.instruction);
    if (Boolean(state.obstacle.enabled) !== Boolean(setup.obstacle.enabled)) toggleObstacle(state);
    // Geometry is fixed across runs, including any engine defaults.
    Object.assign(state.obstacle, setup.obstacle);
    if (typeof setInferenceDelay === 'function') setInferenceDelay(state, setup.latency);
    modeSelect.value = mode;
    instructionSelect.value = setup.instruction;
    lastPhase = null;
    render();
  }

  function ensureEditableScene() {
    if (finished.has(state.phase)) replaceState();
  }

  function storeObjectEdit(id) {
    const item = state.objects.find(object => object.id === id);
    const saved = setup.objects.find(object => object.id === id);
    if (item && saved) { saved.x = item.x; saved.y = item.y; }
  }

  function moveObject(id, x, y) {
    ensureEditableScene();
    if (!setObjectPosition(state, id, x, y)) return false;
    storeObjectEdit(id);
    render();
    return true;
  }

  function stopFrame() {
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    lastFrame = null;
  }

  function canAnimate() {
    return state.running && isVisible && !document.hidden;
  }

  function scheduleFrame() {
    if (canAnimate() && animation === null) animation = requestAnimationFrame(frame);
  }

  function frame(now) {
    animation = null;
    if (!canAnimate()) { lastFrame = null; return; }
    if (lastFrame !== null) stepSimulation(state, Math.min(.1, Math.max(0, (now - lastFrame) / 1000)));
    lastFrame = now;
    render();
    if (state.running) scheduleFrame();
    else lastFrame = null;
  }

  function renderPaths(parent, routes) {
    while (parent.children.length > routes.length) parent.lastElementChild.remove();
    while (parent.children.length < routes.length) parent.append(svgNode('path'));
    routes.forEach((route, index) => parent.children[index].setAttribute('d', pointPath(route)));
  }

  function makeFutureFrame() {
    const container = document.createElement('div');
    container.className = 'control-future-frame';
    const picture = svgNode('svg', { viewBox: '0 0 100 54', 'aria-hidden': 'true' });
    picture.append(svgNode('rect', { x: 2, y: 2, width: 96, height: 50, rx: 2, fill: '#f1f3eb' }));
    const destination = svgNode('rect', { width: 13, height: 10, rx: 1, fill: '#e0e7d4', stroke: '#a3af97', 'stroke-width': .6 });
    destination.dataset.futureTray = '';
    picture.append(destination);
    const barrier = svgNode('ellipse', { rx: 8.16, ry: 4.25, fill: '#d9decf', stroke: '#8d987f', 'stroke-width': .5 });
    barrier.dataset.futureObstacle = '';
    picture.append(barrier);
    for (const id of ['red', 'blue']) {
      const cube = svgNode('rect', { width: 5, height: 5, rx: .6, fill: id === 'red' ? '#b9533b' : '#4d7797' });
      cube.dataset.futureObject = id;
      picture.append(cube);
    }
    const tip = svgNode('circle', { r: 3, fill: '#f7f8f3', stroke: '#3e4b33', 'stroke-width': 1.1 });
    tip.dataset.futureTip = '';
    picture.append(tip);
    const caption = document.createElement('p');
    const time = document.createElement('span');
    time.dataset.futureTime = '';
    const cue = document.createElement('span');
    cue.dataset.futureCue = '';
    caption.append(time, cue);
    container.append(picture, caption);
    return container;
  }

  function renderPredictions() {
    const show = state.mode === 'world';
    futureRegion.hidden = !show;
    if (!show) return;
    while (futureFrames.children.length < 3) futureFrames.append(makeFutureFrame());
    const predictions = (state.predictions || []).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    const hasCandidateGroups = predictions.some(point => Number.isInteger(point.candidate));
    const outcomes = hasCandidateGroups ? [0, 1, 2].map(candidate => predictions.filter(point => point.candidate === candidate).at(-1)) : [];
    const sample = predictions.length ? [0, Math.floor((predictions.length - 1) / 2), predictions.length - 1] : [0, 0, 0];
    [...futureFrames.children].forEach((container, index) => {
      const prediction = hasCandidateGroups ? outcomes[index] : predictions[sample[index]];
      const picture = container.querySelector('svg');
      const destination = picture.querySelector('[data-future-tray]');
      destination.setAttribute('x', state.tray.x * 96 + 2 - 6.5);
      destination.setAttribute('y', state.tray.y * 50 + 2 - 5);
      const barrier = picture.querySelector('[data-future-obstacle]');
      barrier.setAttribute('cx', state.obstacle.x * 96 + 2);
      barrier.setAttribute('cy', state.obstacle.y * 50 + 2);
      barrier.setAttribute('rx', state.obstacle.r * 96);
      barrier.setAttribute('ry', state.obstacle.r * 50);
      barrier.style.display = state.obstacle.enabled ? '' : 'none';
      for (const cube of picture.querySelectorAll('[data-future-object]')) {
        const item = state.objects.find(object => object.id === cube.dataset.futureObject);
        const position = prediction && state.robot.carrying === item.id ? prediction : item;
        cube.setAttribute('x', position.x * 96 + 2 - 2.5);
        cube.setAttribute('y', position.y * 50 + 2 - 2.5);
      }
      const tip = picture.querySelector('[data-future-tip]');
      tip.style.display = prediction ? '' : 'none';
      if (prediction) {
        tip.setAttribute('cx', prediction.x * 96 + 2);
        tip.setAttribute('cy', prediction.y * 50 + 2);
      }
      container.dataset.collision = String(Boolean(prediction?.collision));
      const isSelected = Boolean(prediction) && hasCandidateGroups && prediction.candidate === state.selectedCandidate;
      container.dataset.selected = String(isSelected);
      const offset = prediction ? Math.max(0, Number(prediction.t || 0) - Number(state.time || 0)) : 0;
      writeText(container.querySelector('[data-future-time]'), prediction ? `+${offset.toFixed(1)} s` : 'Awaiting plan');
      const cue = isSelected ? 'Chosen' : prediction?.collision ? 'Blocked' : 'Predicted';
      writeText(container.querySelector('[data-future-cue]'), prediction ? `${hasCandidateGroups ? `${String.fromCharCode(65 + index)} · ` : ''}${cue}` : '');
    });
  }

  function render() {
    const robotPoint = mapPoint(state.robot);
    const trayPoint = mapPoint(state.tray);
    robot.setAttribute('transform', `translate(${robotPoint.x} ${robotPoint.y})`);
    tray.setAttribute('transform', `translate(${trayPoint.x} ${trayPoint.y})`);
    obstacle.toggleAttribute('hidden', !state.obstacle.enabled);
    const obstaclePoint = mapPoint(state.obstacle);
    const obstacleCircle = obstacle.querySelector('ellipse');
    obstacleCircle.setAttribute('cx', obstaclePoint.x);
    obstacleCircle.setAttribute('cy', obstaclePoint.y);
    obstacleCircle.setAttribute('rx', state.obstacle.r * 400);
    obstacleCircle.setAttribute('ry', state.obstacle.r * 215);
    obstacle.querySelector('path').setAttribute('d', `M${obstaclePoint.x - 8} ${obstaclePoint.y - 8}l16 16m0-16l-16 16`);
    obstacle.querySelector('text').setAttribute('x', obstaclePoint.x);
    obstacle.querySelector('text').setAttribute('y', obstaclePoint.y + state.obstacle.r * 215 + 15);
    for (const item of state.objects) {
      const node = objectNodes.get(item.id);
      if (!node) continue;
      const point = mapPoint(item);
      node.setAttribute('transform', `translate(${point.x} ${point.y})`);
      node.setAttribute('aria-disabled', String(state.robot.carrying === item.id));
      node.dataset.selected = String(state.instruction === item.id);
    }
    trail.setAttribute('d', pointPath(state.trail));
    plan.setAttribute('d', pointPath(state.plan));
    const committedPoints = state.mode === 'realtime' && Array.isArray(state.committed) ? state.committed : [];
    committed.setAttribute('d', pointPath(committedPoints));
    committedLegend.hidden = committedPoints.length <= 1;
    const candidateRoutes = Array.isArray(state.candidates) ? state.candidates : [];
    renderPaths(candidates, candidateRoutes);
    [...candidates.children].forEach((path, index) => {
      path.dataset.selected = String(state.mode === 'world' && index === state.selectedCandidate);
    });
    candidateLegend.hidden = !candidateRoutes.length;
    renderPredictions();
    writeText(status, state.message || 'Ready.');
    // Announce phase and pause changes once, rather than every animation frame.
    if (state.phase !== lastPhase || state.running !== lastRunning) {
      writeText(announcement, state.message || state.phase);
      lastPhase = state.phase;
      lastRunning = state.running;
    }
    root.dataset.mode = state.mode;
    root.dataset.phase = state.phase;
    root.dataset.running = String(state.running);
    root.dataset.result = finished.has(state.phase) && state.phase !== 'success' ? 'failure' : state.phase === 'success' ? 'success' : 'none';
    const fixedTaskCue = state.instruction === 'blue' && state.mode !== 'generalist' ? ' This sketch is set to the red-cube task.' : '';
    writeText(mechanism, (descriptions[state.mode] || 'Choose an approach, then change the scene.') + fixedTaskCue);
    writeText(elapsed, `${Number(state.stats.elapsed || 0).toFixed(1)} s`);
    writeText(replanOutput, String(state.stats.replans || 0));
    writeText(waitOutput, `${Number(state.stats.waitTime || 0).toFixed(1)} s`);
    const runLabel = state.running ? 'Pause' : finished.has(state.phase) ? 'Run' : state.time > 0 ? 'Resume' : 'Run';
    if (runButton.dataset.label !== runLabel) {
      runButton.replaceChildren(document.createTextNode(`${runLabel} `));
      const symbol = document.createElement('span');
      symbol.setAttribute('aria-hidden', 'true');
      symbol.textContent = state.running ? 'Ⅱ' : '▷';
      runButton.append(symbol);
      runButton.dataset.label = runLabel;
    }
    const runName = state.running ? 'Pause simulation' : finished.has(state.phase) ? 'Run the same scene again' : 'Run simulation';
    if (runButton.getAttribute('aria-label') !== runName) runButton.setAttribute('aria-label', runName);
    obstacleButton.setAttribute('aria-pressed', String(state.obstacle.enabled));
    writeText(obstacleButton, state.obstacle.enabled ? 'Remove obstacle' : 'Add obstacle');
    moveButton.disabled = state.robot.carrying === state.instruction;
    moveButton.setAttribute('aria-label', `Move the ${state.instruction} cube to another position`);
    const delay = state.settings?.latency ?? setup.latency;
    delaySlider.value = String(Math.round(delay * 1000));
    writeText(delayOutput, `${Math.round(delay * 1000)} ms`);
  }

  modeSelect.replaceChildren(...MODES.map(mode => {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = mode.label;
    return option;
  }));
  modeSelect.value = state.mode;
  modeSelect.addEventListener('change', () => replaceState(modeSelect.value));
  instructionSelect.addEventListener('change', () => {
    const requested = instructionSelect.value;
    ensureEditableScene();
    if (setInstruction(state, requested)) setup.instruction = requested;
    instructionSelect.value = state.instruction;
    render();
    scheduleFrame();
  });
  delaySlider.addEventListener('input', () => {
    const requested = Number(delaySlider.value) / 1000;
    ensureEditableScene();
    setup.latency = requested;
    if (typeof setInferenceDelay === 'function') setInferenceDelay(state, setup.latency);
    render();
    scheduleFrame();
  });
  root.querySelectorAll('[data-control-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.controlAction;
      if (action === 'run') {
        if (state.running) { pauseSimulation(state); stopFrame(); }
        else {
          if (finished.has(state.phase)) replaceState();
          startSimulation(state);
          scheduleFrame();
        }
      } else if (action === 'replay') {
        replaceState();
        startSimulation(state);
        scheduleFrame();
      } else if (action === 'move') {
        const positions = [{ x: .64, y: .31 }, { x: .41, y: .68 }, { x: .67, y: .75 }, { x: .44, y: .28 }];
        const point = positions[perturbation % positions.length];
        if (moveObject(state.instruction, point.x, point.y)) perturbation += 1;
        scheduleFrame();
      } else if (action === 'obstacle') {
        ensureEditableScene();
        if (toggleObstacle(state)) setup.obstacle = { ...state.obstacle };
        scheduleFrame();
      }
      render();
    });
  });

  function pointerPosition(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: (point.x - 20) / 400, y: (point.y - 15) / 215 };
  }

  for (const [id, node] of objectNodes) {
    node.addEventListener('pointerdown', event => {
      if (event.button !== 0 || state.robot.carrying === id || drag) return;
      const position = pointerPosition(event);
      if (!position) return;
      ensureEditableScene();
      const item = state.objects.find(object => object.id === id);
      drag = { id, pointerId: event.pointerId, offsetX: item.x - position.x, offsetY: item.y - position.y };
      node.setPointerCapture(event.pointerId);
      node.dataset.dragging = 'true';
      node.focus({ preventScroll: true });
      event.preventDefault();
    });
    node.addEventListener('pointermove', event => {
      if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) return;
      const position = pointerPosition(event);
      if (!position) return;
      moveObject(id, position.x + drag.offsetX, position.y + drag.offsetY);
      event.preventDefault();
    });
    const endDrag = event => {
      if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) return;
      drag = null;
      delete node.dataset.dragging;
      if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      scheduleFrame();
    };
    node.addEventListener('pointerup', endDrag);
    node.addEventListener('pointercancel', endDrag);
    node.addEventListener('lostpointercapture', event => {
      if (drag?.pointerId === event.pointerId) { drag = null; delete node.dataset.dragging; }
    });
    node.addEventListener('keydown', event => {
      const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!directions[event.key]) return;
      event.preventDefault();
      ensureEditableScene();
      const item = state.objects.find(object => object.id === id);
      const [dx, dy] = directions[event.key];
      const distance = event.shiftKey ? .08 : .025;
      moveObject(id, item.x + dx * distance, item.y + dy * distance);
      scheduleFrame();
    });
    node.setAttribute('tabindex', '0');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFrame();
    else scheduleFrame();
  });
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(entries => {
      isVisible = entries.some(entry => entry.isIntersecting);
      if (isVisible) scheduleFrame();
      else stopFrame();
    }, { threshold: .05 });
    observer.observe(root);
  }
  window.addEventListener('pagehide', stopFrame);
  for (const node of root.querySelectorAll('[data-interactive]')) node.hidden = false;
  elapsed.hidden = false;
  get('[data-control-drag-label]').removeAttribute('hidden');
  root.dataset.ready = 'true';
  render();
  // No automatic play, including for readers who prefer reduced motion.
}
