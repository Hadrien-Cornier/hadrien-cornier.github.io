/* A small scene shows control mechanisms. The engine owns every simulated result. */
const versionedModule = path => {
  const url = new URL(path, import.meta.url);
  url.search = new URL(import.meta.url).search;
  return url.href;
};

try {
  const [simulator, approaches, visuals] = await Promise.all([
    import(versionedModule('./control-simulator.mjs')),
    import(versionedModule('./control-approaches.mjs')),
    import(versionedModule('./control-visuals.mjs')),
  ]);
  for (const root of document.querySelectorAll('[data-control-playground]')) {
    initializePlayground(root, simulator, approaches, visuals);
  }
} catch {
  // Keep the static illustration and article link available if initialization fails.
  for (const root of document.querySelectorAll('[data-control-playground]')) {
    root.dataset.initialization = 'failed';
  }
}

function initializePlayground(root, simulator, knowledge, visuals) {
  const {
    SCENARIOS, createSimulation, stepSimulation, setObjectPosition, setInstruction,
    toggleObstacle, startSimulation, pauseSimulation, setInferenceDelay,
    setExecutionSchedule, setScenario,
  } = simulator;
  const { APPROACHES, SCHEDULING } = knowledge;
  const { armPose, gripperGeometry, capturePlanningView, candidateView, planningViewPriority } = visuals;
  const get = selector => root.querySelector(selector);
  const svg = get('[data-control-scene]');
  const modeSelect = get('[data-control-mode]');
  const instructionSelect = get('[data-control-instruction]');
  const scheduleSelect = get('[data-control-schedule]');
  const scheduleDescription = get('[data-control-schedule-description]');
  const scenarioSelect = get('[data-control-scenario]');
  const challengeDescription = get('[data-control-challenge-description]');
  const failureReason = get('[data-control-failure-reason]');
  const failureDetails = get('[data-control-failure-details]');
  const observedScene = get('[data-control-observed-scene]');
  const robot = get('[data-control-robot]');
  const armLinks = [...root.querySelectorAll('[data-control-arm-links]')];
  const armElbow = get('[data-control-arm-elbow]');
  const wrist = get('[data-control-wrist]');
  const jaws = get('[data-control-jaws]');
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
    chunks: 'A transformer predicts a sequence of actions from the current observation.',
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
  let lastCardMode = null;
  let lastObservation = null;
  let isVisible = true;
  let perturbation = 0;
  let drag = null;
  let lastElbow = null;
  let lastPredictionSource = null;
  let currentPlanningView = null;
  let retainedPlanningView = null;
  let displayedPlanningView = null;
  let futureViewer = null;
  let previewCandidate = 0;
  let previewStep = 1;

  function resetVisualTrial() {
    lastPredictionSource = null;
    currentPlanningView = null;
    retainedPlanningView = null;
    displayedPlanningView = null;
    lastElbow = null;
    previewCandidate = 0;
    previewStep = 1;
  }

  // Keep edits as the next trial's starting scene. Robot transport never changes this setup.
  function captureSetup(current) {
    return {
      objects: current.objects.map(({ id, x, y }) => ({ id, x, y })),
      instruction: current.instruction,
      obstacle: { ...current.obstacle },
      latency: current.settings?.latency ?? .3,
      schedule: current.settings.schedule,
      scenario: current.scenario,
    };
  }

  function replaceState(mode = state.mode) {
    stopFrame();
    resetVisualTrial();
    state = createSimulation({ mode, seed, latency:setup.latency, schedule:setup.schedule, scenario:setup.scenario });
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

  function renderApproach() {
    if (state.mode === lastCardMode) return;
    const approach = APPROACHES.find(item => item.id === state.mode);
    for (const field of ['family', 'structure', 'summary', 'expectation', 'limitation', 'action-head', 'training']) {
      const key = field === 'action-head' ? 'actionHead' : field;
      writeText(get(`[data-control-${field}]`), approach[key]);
    }
    const paper = get('[data-control-paper]');
    paper.hidden = !approach.paper;
    get('[data-control-no-paper]').hidden = Boolean(approach.paper);
    if (approach.paper) {
      paper.href = approach.paper.url;
      paper.title = approach.paper.title;
      paper.setAttribute('aria-label', `Read paper: ${approach.paper.title}`);
      writeText(paper, `Paper: ${approach.paper.shortTitle} ↗`);
    } else paper.removeAttribute('href');
    lastCardMode = state.mode;
  }

  function renderObservation() {
    const observation = state.observation;
    const visible = state.mode !== 'scripted' && (observation.labelsSwapped || observation.frameRotation);
    const key = visible ? JSON.stringify(observation.objects) : '';
    if (key === lastObservation) return;
    observedScene.replaceChildren();
    if (visible) {
      for (const perceived of observation.objects) {
        const actual = state.objects.find(item => item.id === perceived.physicalId);
        const point = mapPoint(perceived);
        if (observation.frameRotation) {
          const realPoint = mapPoint(actual);
          observedScene.append(svgNode('line', { x1:realPoint.x, y1:realPoint.y, x2:point.x, y2:point.y }));
          observedScene.append(svgNode('rect', { x:point.x-12, y:point.y-12, width:24, height:24, rx:3 }));
        }
        const label = svgNode('text', { x:point.x, y:point.y-19, 'text-anchor':'middle' });
        label.textContent = `${observation.frameRotation ? 'MODEL' : 'SEES'} ${perceived.id.toUpperCase()}`;
        observedScene.append(label);
      }
    }
    lastObservation = key;
  }

  function chooseScenario(id) {
    stopFrame();
    const instruction = state.instruction;
    if (!setScenario(state, id)) return;
    resetVisualTrial();
    setInstruction(state, instruction);
    setup = captureSetup(state);
    instructionSelect.value = state.instruction;
    lastPhase = null;
    render();
  }

  function makeFutureViewer() {
    const container = document.createElement('div');
    container.className = 'control-future-viewer';
    const context = document.createElement('p');
    context.className = 'control-future-context';
    context.dataset.futureContext = '';
    const choices = document.createElement('div');
    choices.className = 'control-future-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Inspect a predicted route');
    for (let index = 0; index < 3; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.futureCandidate = String(index);
      button.addEventListener('click', () => { previewCandidate = index; renderFuturePreview(); });
      choices.append(button);
    }
    const picture = svgNode('svg', { viewBox: '0 0 440 255', role: 'img' });
    picture.classList.add('control-future-scene');
    picture.append(svgNode('rect', { x: 20, y: 15, width: 400, height: 215, rx: 5, class: 'control-table' }));
    const destination = svgNode('g', { class: 'control-tray', 'data-future-tray': '' });
    destination.append(svgNode('rect', { x: -26, y: -21, width: 52, height: 42, rx: 5 }));
    picture.append(destination);
    picture.append(svgNode('ellipse', { class: 'control-future-obstacle', 'data-future-obstacle': '' }));
    const routes = svgNode('g', { class: 'control-future-routes', 'data-future-routes': '' });
    for (let index = 0; index < 3; index++) routes.append(svgNode('path'));
    picture.append(routes);
    picture.append(svgNode('path', { class: 'control-actual-path control-future-real-path', 'data-future-real-path': '' }));
    for (const id of ['red', 'blue']) {
      const cube = svgNode('g', { class: `control-object control-object-${id}`, 'data-future-object': id });
      cube.append(svgNode('rect', { x: -10, y: -10, width: 19, height: 19, rx: 3, class: 'control-cube' }));
      const label = svgNode('text', { x: -.5, y: 3.5, 'text-anchor': 'middle' });
      label.textContent = id === 'red' ? 'R' : 'B';
      cube.append(label);
      picture.append(cube);
    }
    const predictedArm = svgNode('g', { class: 'control-future-arm', 'data-future-arm': '' });
    predictedArm.append(svgNode('path', { class: 'control-arm-link', 'data-future-arm-links': '' }));
    predictedArm.append(svgNode('circle', { class: 'control-arm-base', cx: 210, cy: 225, r: 13 }));
    predictedArm.append(svgNode('circle', { class: 'control-arm-base-center', cx: 210, cy: 225, r: 5 }));
    predictedArm.append(svgNode('circle', { class: 'control-arm-joint', cx: 210, cy: 130, r: 8 }));
    predictedArm.append(svgNode('circle', { class: 'control-arm-joint', r: 7, 'data-future-elbow': '' }));
    const grip = svgNode('g', { class: 'control-future-gripper', 'data-future-gripper': '' });
    grip.append(svgNode('circle', { class: 'control-wrist-body', cx: -24, r: 6 }));
    grip.append(svgNode('path', { class: 'control-gripper-palm', d: 'M-13-12V12M-13 0H-9' }));
    grip.append(svgNode('path', { class: 'control-gripper-jaws', d: 'M-13-12H7M-13 12H7' }));
    predictedArm.append(grip);
    picture.append(predictedArm);
    picture.append(svgNode('g', { class: 'control-future-markers', 'data-future-markers': '' }));
    picture.append(svgNode('circle', { r: 4, class: 'control-future-real-tip', 'data-future-real-tip': '' }));
    const modelLabel = svgNode('text', { x: 21, y: 249, class: 'control-view-label' });
    modelLabel.textContent = 'PREDICTED ARM / TOP VIEW';
    picture.append(modelLabel);
    const reason = document.createElement('p');
    reason.className = 'control-future-reason';
    reason.dataset.futureReason = '';
    const steps = document.createElement('div');
    steps.className = 'control-future-steps';
    steps.setAttribute('role', 'group');
    steps.setAttribute('aria-label', 'Inspect future time');
    for (let index = 0; index < 3; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.futureStep = String(index);
      button.addEventListener('click', () => { previewStep = index; renderFuturePreview(); });
      steps.append(button);
    }
    const legend = document.createElement('p');
    legend.className = 'control-future-legend';
    legend.innerHTML = '<span><i class="control-future-prediction-swatch" aria-hidden="true"></i>Predicted route</span><span><i class="control-future-actual-swatch" aria-hidden="true"></i>Real movement after this plan</span>';
    const note = document.createElement('p');
    note.className = 'control-future-note';
    note.dataset.futureNote = '';
    container.append(context, choices, picture, steps, reason, legend, note);
    return container;
  }

  function renderFuturePreview() {
    const view = displayedPlanningView;
    if (!view || !futureViewer) return;
    const preview = candidateView(view, previewCandidate);
    const picture = futureViewer.querySelector('svg');
    const trayPoint = mapPoint(view.tray);
    picture.querySelector('[data-future-tray]').setAttribute('transform', `translate(${trayPoint.x} ${trayPoint.y})`);
    const barrier = picture.querySelector('[data-future-obstacle]');
    const obstaclePoint = mapPoint(view.obstacle);
    barrier.style.display = view.obstacle.enabled ? '' : 'none';
    for (const [name, value] of Object.entries({ cx: obstaclePoint.x, cy: obstaclePoint.y, rx: view.obstacle.r * 400, ry: view.obstacle.r * 215 })) barrier.setAttribute(name, value);
    const paths = picture.querySelector('[data-future-routes]');
    for (let index = 0; index < 3; index++) {
      const candidate = candidateView(view, index);
      const path = paths.children[index];
      path.setAttribute('d', pointPath(candidate.route));
      path.dataset.inspected = String(index === previewCandidate);
      path.dataset.blocked = String(candidate.blocked);
      path.dataset.chosen = String(candidate.selected);
      const button = futureViewer.querySelector(`[data-future-candidate="${index}"]`);
      button.setAttribute('aria-pressed', String(index === previewCandidate));
      button.dataset.modelChosen = String(candidate.selected);
      button.dataset.blocked = String(candidate.blocked);
      button.setAttribute('aria-label', `Inspect route ${String.fromCharCode(65 + index)}. ${candidate.cue}. ${candidate.reason}`);
      writeText(button, `${String.fromCharCode(65 + index)} · ${candidate.cue}`);
    }
    for (const cube of picture.querySelectorAll('[data-future-object]')) {
      const item = view.objects.find(object => object.id === cube.dataset.futureObject);
      const point = mapPoint(item);
      cube.setAttribute('transform', `translate(${point.x} ${point.y})`);
    }
    const prediction = preview.samples[previewStep];
    if (prediction) {
      const point = mapPoint(prediction);
      const pose = armPose(point);
      const predictedArm = picture.querySelector('[data-future-arm]');
      predictedArm.style.display = pose ? '' : 'none';
      if (pose) {
        picture.querySelector('[data-future-arm-links]').setAttribute('d', `M${pose.base.x} ${pose.base.y} L${pose.shoulder.x} ${pose.shoulder.y} L${pose.elbow.x} ${pose.elbow.y} L${pose.wrist.x} ${pose.wrist.y}`);
        const joint = picture.querySelector('[data-future-elbow]');
        joint.setAttribute('cx', pose.elbow.x);
        joint.setAttribute('cy', pose.elbow.y);
        const futureGripper = picture.querySelector('[data-future-gripper]');
        futureGripper.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${pose.angle})`);
        const grip = gripperGeometry(pose.angle, Boolean(view.carrying));
        futureGripper.querySelector('.control-gripper-palm').setAttribute('d', grip.palm);
        futureGripper.querySelector('.control-gripper-jaws').setAttribute('d', grip.jaws);
      }
      const carryingCube = view.carrying && picture.querySelector(`[data-future-object="${view.carrying}"]`);
      if (carryingCube) carryingCube.setAttribute('transform', `translate(${point.x} ${point.y})`);
      const offset = Number(prediction.t) - view.time;
      picture.setAttribute('aria-label', `Route ${String.fromCharCode(65 + previewCandidate)}, future step ${previewStep + 1}, ${offset.toFixed(1)} seconds after this plan. ${preview.reason}`);
    }
    const markers = picture.querySelector('[data-future-markers]');
    markers.replaceChildren();
    const groups = [];
    preview.samples.forEach((point, index) => {
      const existing = groups.find(group => Math.hypot(group.point.x - point.x, group.point.y - point.y) < .018);
      if (existing) existing.indices.push(index);
      else groups.push({ point, indices: [index] });
      const button = futureViewer.querySelector(`[data-future-step="${index}"]`);
      button.setAttribute('aria-pressed', String(index === previewStep));
      const time = Math.max(0, Number(point.t) - view.time);
      writeText(button, `${index + 1} · +${time.toFixed(1)} s`);
      button.setAttribute('aria-label', `Inspect future step ${index + 1}, ${time.toFixed(1)} seconds after this plan`);
    });
    for (const group of groups) {
      const point = mapPoint(group.point);
      const marker = svgNode('g', { transform: `translate(${point.x} ${point.y})`, 'data-active': String(group.indices.includes(previewStep)) });
      marker.append(svgNode('circle', { r: 3, class: 'control-future-tip-dot' }));
      marker.append(svgNode('line', { x1: 0, y1: -3, x2: 0, y2: -14 }));
      const markerWidth = Math.max(28, group.indices.length * 12 + 5);
      marker.append(svgNode('rect', { x: -markerWidth / 2, y: -32, width: markerWidth, height: 19, rx: 3 }));
      const label = svgNode('text', { x: 0, y: -18, 'text-anchor': 'middle' });
      label.textContent = group.indices.map(index => index + 1).join(',');
      marker.append(label);
      markers.append(marker);
    }
    writeText(futureViewer.querySelector('[data-future-reason]'), `Inspecting ${String.fromCharCode(65 + previewCandidate)}. ${preview.reason} The planner chose ${String.fromCharCode(65 + view.selected)}.`);
    writeText(futureViewer.querySelector('[data-future-note]'), view.frameRotation ?
      'The model uses the wrong camera frame here. Its route can look clear while the real gripper misses the cube.' :
      'Tap a route, then a time. The numbered tips show three predicted states. Only the next action is executed before planning again.');
    renderFutureActualMovement();
  }

  function renderFutureActualMovement() {
    if (!displayedPlanningView || !futureViewer) return;
    const view = displayedPlanningView;
    const complete = finished.has(state.phase);
    writeText(futureViewer.querySelector('[data-future-context]'), `${complete ? 'Saved comparison' : 'Plan'} at ${view.time.toFixed(1)} s${complete ? '. Trial finished.' : '. Model predictions.'}`);
    futureViewer.querySelector('[data-future-real-path]').setAttribute('d', pointPath(state.trail.slice(view.trailIndex)));
    const real = mapPoint(state.robot);
    const realTip = futureViewer.querySelector('[data-future-real-tip]');
    realTip.setAttribute('cx', real.x);
    realTip.setAttribute('cy', real.y);
  }

  function renderPredictions() {
    const show = state.mode === 'world';
    futureRegion.hidden = !show;
    if (!show) return;
    if (state.predictions !== lastPredictionSource) {
      lastPredictionSource = state.predictions;
      currentPlanningView = capturePlanningView(state);
      if (currentPlanningView && (!retainedPlanningView || planningViewPriority(currentPlanningView) > planningViewPriority(retainedPlanningView))) retainedPlanningView = currentPlanningView;
    }
    const view = finished.has(state.phase) ? retainedPlanningView : currentPlanningView;
    if (!view) {
      if (futureViewer) futureViewer = null;
      if (futureFrames.textContent !== 'Run a trial to compare three possible routes and step through their predicted futures.') futureFrames.textContent = 'Run a trial to compare three possible routes and step through their predicted futures.';
      futureFrames.classList.add('control-future-empty');
      return;
    }
    futureFrames.classList.remove('control-future-empty');
    if (!futureViewer) { futureViewer = makeFutureViewer(); futureFrames.replaceChildren(futureViewer); }
    if (view !== displayedPlanningView) {
      displayedPlanningView = view;
      previewCandidate = view.selected;
      previewStep = 1;
      renderFuturePreview();
    } else renderFutureActualMovement();
  }

  function render() {
    renderApproach();
    const robotPoint = mapPoint(state.robot);
    const trayPoint = mapPoint(state.tray);
    robot.setAttribute('transform', `translate(${robotPoint.x} ${robotPoint.y})`);
    const pose = armPose(robotPoint, lastElbow);
    if (pose) {
      lastElbow = pose.elbow;
      for (const path of armLinks) path.setAttribute('d', `M${pose.base.x} ${pose.base.y} L${pose.shoulder.x} ${pose.shoulder.y} L${pose.elbow.x} ${pose.elbow.y} L${pose.wrist.x} ${pose.wrist.y}`);
      armElbow.setAttribute('cx', pose.elbow.x);
      armElbow.setAttribute('cy', pose.elbow.y);
      wrist.setAttribute('transform', `rotate(${pose.angle})`);
      const grip = gripperGeometry(pose.angle, Boolean(state.robot.carrying));
      robot.querySelector('.control-wrist-body').setAttribute('cx', grip.wristX);
      jaws.setAttribute('d', grip.jaws);
      robot.querySelector('.control-gripper-palm').setAttribute('d', grip.palm);
    }
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
    const committedPoints = Array.isArray(state.committed) ? state.committed : [];
    committed.setAttribute('d', pointPath(committedPoints));
    committedLegend.hidden = committedPoints.length <= 1;
    const candidateRoutes = Array.isArray(state.candidates) ? state.candidates : [];
    renderPaths(candidates, candidateRoutes);
    [...candidates.children].forEach((path, index) => {
      path.dataset.selected = String(state.mode === 'world' && index === state.selectedCandidate);
    });
    candidateLegend.hidden = !candidateRoutes.length;
    renderObservation();
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
    root.dataset.scenario = state.scenario;
    root.dataset.schedule = state.settings.schedule;
    root.dataset.result = finished.has(state.phase) && state.phase !== 'success' ? 'failure' : state.phase === 'success' ? 'success' : 'none';
    const fixedTaskCue = state.instruction === 'blue' && state.mode !== 'generalist' ? ' This sketch is set to the red-cube task.' : '';
    writeText(mechanism, (descriptions[state.mode] || 'Choose an approach, then change the scene.') + fixedTaskCue);
    const usesBatches = SCHEDULING.appliesTo.includes(state.mode);
    scheduleSelect.disabled = !usesBatches;
    const inactiveSchedule = scheduleSelect.querySelector('[data-control-inactive-schedule]');
    inactiveSchedule.hidden = usesBatches;
    inactiveSchedule.textContent = state.mode === 'scripted' ? 'Fixed replay' : 'One-step replanning';
    scheduleSelect.value = usesBatches ? state.settings.schedule : 'not-applicable';
    const timing = SCHEDULING.options.find(item => item.id === state.settings.schedule);
    writeText(scheduleDescription, usesBatches ? timing.summary : state.mode === 'scripted' ? 'Saved commands run without a new planning step.' : 'Plan one step, observe again, then make a new prediction.');
    scenarioSelect.value = state.scenario;
    const challengeScope = state.scenario === 'model-gap' && state.mode !== 'world' ? ' This error is applied only to the world planner.' : state.scenario === 'swapped-cues' && state.mode === 'scripted' ? ' The fixed script does not read these labels.' : '';
    writeText(challengeDescription, state.challengeMessage + challengeScope);
    failureReason.hidden = !state.failureReason;
    failureDetails.hidden = !state.failureReason;
    writeText(failureReason, state.failureReason ? `Why it failed: ${state.failureReason}` : '');
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

  modeSelect.replaceChildren(...APPROACHES.map(mode => {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = mode.label;
    return option;
  }));
  modeSelect.value = state.mode;
  modeSelect.addEventListener('change', () => replaceState(modeSelect.value));
  for (const [select, items] of [[scheduleSelect, SCHEDULING.options], [scenarioSelect, SCENARIOS]]) {
    select.replaceChildren(...items.map(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      return option;
    }));
  }
  const inactiveSchedule = document.createElement('option');
  inactiveSchedule.value = 'not-applicable';
  inactiveSchedule.dataset.controlInactiveSchedule = '';
  inactiveSchedule.disabled = true;
  scheduleSelect.append(inactiveSchedule);
  scenarioSelect.addEventListener('change', () => chooseScenario(scenarioSelect.value));
  scheduleSelect.addEventListener('change', () => {
    const requested = scheduleSelect.value;
    ensureEditableScene();
    if (setExecutionSchedule(state, requested)) setup.schedule = requested;
    render();
    scheduleFrame();
  });
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
      } else if (action === 'failure') {
        const recommended = { scripted:'moving-target', chunks:'late-obstacle', diffusion:'moving-target', generalist:'swapped-cues', world:'model-gap' };
        chooseScenario(recommended[state.mode]);
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
