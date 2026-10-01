/** Pure drawing helpers. They never change the control simulator. */
export const ARM_BASE = Object.freeze({ x: 210, y: 225 });
export const ARM_SHOULDER = Object.freeze({ x: 210, y: 130 });
export const ARM_LINK_LENGTH = 110;
export const WRIST_OFFSET = 24;

export function gripperGeometry(angle, carrying = false) {
  const radians = angle * Math.PI / 180;
  // Axis-aligned 19 px cubes look wider across a rotated jaw opening.
  const cubeHalfProjection = 9.5 * (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)));
  const gap = cubeHalfProjection + (carrying ? 2.5 : 6);
  const palmX = -cubeHalfProjection - 4;
  const fingerEnd = cubeHalfProjection + 2;
  return {
    gap, cubeHalfProjection, palmX, wristX: -WRIST_OFFSET,
    palm: `M${palmX} ${-gap}V${gap}M${-WRIST_OFFSET} 0H${palmX}`,
    jaws: `M${palmX} ${-gap}H${fingerEnd}M${palmX} ${gap}H${fingerEnd}`,
  };
}

export function armPose(tip, previousElbow = null) {
  const dx = tip.x - ARM_SHOULDER.x;
  const dy = tip.y - ARM_SHOULDER.y;
  const reach = Math.hypot(dx, dy);
  if (!Number.isFinite(reach) || reach > ARM_LINK_LENGTH * 2 + 1e-7) return null;
  const direction = reach > 1e-7 ? Math.atan2(dy, dx) : -Math.PI;
  const bend = Math.acos(Math.min(1, reach / (ARM_LINK_LENGTH * 2)));
  const elbows = [direction + bend, direction - bend].map(angle => ({
    x: ARM_SHOULDER.x + ARM_LINK_LENGTH * Math.cos(angle),
    y: ARM_SHOULDER.y + ARM_LINK_LENGTH * Math.sin(angle),
  }));
  // Both solutions fit the viewport. Continuity decides the branch, never clipping.
  let elbow = previousElbow ? elbows.sort((a, b) =>
    Math.hypot(a.x - previousElbow.x, a.y - previousElbow.y) - Math.hypot(b.x - previousElbow.x, b.y - previousElbow.y))[0] : elbows[0];
  if (reach < 1e-7 && previousElbow) {
    const length = Math.hypot(previousElbow.x - ARM_SHOULDER.x, previousElbow.y - ARM_SHOULDER.y);
    if (length > 1e-7) elbow = {
      x: ARM_SHOULDER.x + (previousElbow.x - ARM_SHOULDER.x) * ARM_LINK_LENGTH / length,
      y: ARM_SHOULDER.y + (previousElbow.y - ARM_SHOULDER.y) * ARM_LINK_LENGTH / length,
    };
  }
  const angle = Math.atan2(tip.y - elbow.y, tip.x - elbow.x);
  // The simulated tip is the grasp center. The visible link ends at the wrist.
  const wrist = { x: tip.x - WRIST_OFFSET * Math.cos(angle), y: tip.y - WRIST_OFFSET * Math.sin(angle) };
  return { base: { ...ARM_BASE }, shoulder: { ...ARM_SHOULDER }, elbow, tip: { ...tip }, wrist, angle: angle * 180 / Math.PI };
}

export const routeLength = route => route.slice(1).reduce((total, point, index) =>
  total + Math.hypot(point.x - route[index].x, point.y - route[index].y), 0);

export function capturePlanningView(state) {
  const predictions = (state.predictions || []).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const context = state.predictionContext;
  if (!predictions.length || !context) return null;
  return {
    time: context.time,
    selected: context.selectedCandidate,
    routes: (state.candidates || []).map(route => route.map(p => ({ x: p.x, y: p.y }))),
    predictions: predictions.map(p => ({ ...p })),
    objects: context.objects.map(p => ({ ...p })),
    tray: { ...context.tray },
    obstacle: { ...context.obstacle },
    carrying: context.carrying,
    trailIndex: context.trailIndex,
    frameRotation: context.frameRotation,
  };
}

export function planningViewPriority(view) {
  // Keep a useful long comparison when final replans shrink to the same endpoint.
  return Math.max(0, ...view.routes.map(routeLength)) +
    (view.predictions.some(p => p.collision) ? 2 : 0);
}

export function candidateView(view, index) {
  const predictions = view.predictions.filter(p => p.candidate === index);
  const route = view.routes[index] || [];
  const samples = [.25, .5, 1].map(fraction => predictions[Math.round((predictions.length - 1) * fraction)]).filter(Boolean);
  const blocked = predictions.some(p => p.collision);
  const selected = index === view.selected;
  const everyRouteBlocked = view.routes.every((_, candidate) => view.predictions.some(p => p.candidate === candidate && p.collision));
  const reason = blocked ? selected ? 'No clear route. The planner still takes A.' : 'The predicted tip hits the blocker.' :
    selected ? 'Shortest route the model predicts is clear.' : 'Clear in the model. The planner chose another route.';
  return {
    route, predictions, samples, blocked, selected, reason,
    cue: selected ? everyRouteBlocked ? 'Chosen, but risky' : 'Chosen' : blocked ? 'Blocked' : 'Alternative',
    startTime: predictions[0]?.t ?? view.time,
  };
}
