// Two-link forward geometry. Static drawing and equations remain without JavaScript.
const shoulder = document.querySelector('#joint-one');
const elbow = document.querySelector('#joint-two');
if (shoulder && elbow) {
  const get = id => document.getElementById(id);
  const set = (id, attrs) => {
    Object.entries(attrs).forEach(([key, value]) => get(id).setAttribute(key, value));
  };
  const point = (origin, radius, angle) => ({x: origin.x + radius * Math.cos(angle), y: origin.y - radius * Math.sin(angle)});
  const arc = (origin, radius, start, end) => {
    const a = point(origin, radius, start);
    const b = point(origin, radius, end);
    return `M${a.x} ${a.y} A${radius} ${radius} 0 ${Math.abs(end - start) > Math.PI ? 1 : 0} ${end > start ? 0 : 1} ${b.x} ${b.y}`;
  };
  const update = () => {
    const q1 = Number(shoulder.value) * Math.PI / 180;
    const q2 = Number(elbow.value) * Math.PI / 180;
    const base = {x: 200, y: 185};
    const joint = point(base, 85, q1);
    const tip = point(joint, 68, q1 + q2);
    set('arm-link-one', {x2: joint.x, y2: joint.y});
    set('arm-link-two', {x1: joint.x, y1: joint.y, x2: tip.x, y2: tip.y});
    set('arm-elbow', {cx: joint.x, cy: joint.y});
    set('arm-tip', {cx: tip.x, cy: tip.y});
    set('arm-tip-halo', {cx: tip.x, cy: tip.y});
    set('arm-projection', {d: `M${tip.x} ${tip.y}V185 M${tip.x} ${tip.y}H200`});
    set('arm-q1-arc', {d: arc(base, 25, 0, q1)});
    set('arm-q2-arc', {d: arc(joint, 22, q1, q1 + q2)});
    const label1 = point(base, 40, q1 / 2);
    const label2 = point(joint, 36, q1 + q2 / 2);
    set('arm-q1-label', {x: label1.x, y: label1.y});
    set('arm-q2-label', {x: label2.x, y: label2.y});
    const labelX = Math.min(350, Math.max(35, tip.x + 15));
    const labelY = Math.min(340, Math.max(20, tip.y - 12));
    set('arm-tip-label', {x: labelX, y: labelY});
    get('joint-one-value').value = `${shoulder.value}°`;
    get('joint-two-value').value = `${elbow.value}°`;
    get('arm-position').value = `(${((tip.x - base.x) / 85).toFixed(2)}, ${((base.y - tip.y) / 85).toFixed(2)})`;
    shoulder.setAttribute('aria-valuetext', `${shoulder.value} degrees`);
    elbow.setAttribute('aria-valuetext', `${elbow.value} degrees`);
  };
  shoulder.addEventListener('input', update);
  elbow.addEventListener('input', update);
  update();
  get('arm-controls').hidden = false;
}
