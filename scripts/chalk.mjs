/** Chalk primitives for the handwritten blackboard canvases on the Papers pages.
 *
 * Every function returns an SVG string. The wobble comes from a seeded generator, so each build draws
 * the same strokes and the committed pages stay reproducible.
 */

// The RL series palette after its dark-mode filter, invert(.9) hue-rotate(180deg), so the canvases match it.
export const C = {
  bg: '#1d1d1b', ink: '#d6d7d2', muted: '#b3b7ae', grid: '#72746d', wall: '#3d3f38',
  red: '#dc896f', blue: '#70a2bf', pink: '#ffa5b9', green: '#8fbf94', yellow: '#f0d98a', lavender: '#b9a7e6',
  panel: { blue: '#222a2f', green: '#232b1f', red: '#372925', yellow: '#2d270c', gray: '#272722' },
};
export const HAND = "'Bradley Hand','Segoe Print','Chalkboard SE','Comic Neue','Comic Sans MS',cursive";
export const SANS = 'Arial, Helvetica, sans-serif';
export const MATH = "Georgia, 'Times New Roman', serif";

export const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const n = (v) => Math.round(v * 10) / 10;

/** Seeded generator, so every build draws the same chalk wobble. */
export function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rect(r, x, y, w, h, { stroke = C.ink, width = 2.4, fill = null, jitter = 2.4, dash = null } = {}) {
  const j = () => (r() - 0.5) * 2 * jitter;
  const pass = () => `M${n(x + j())},${n(y + j())} Q${n(x + w / 2 + j())},${n(y + j())} ${n(x + w + j())},${n(y + j())} Q${n(x + w + j())},${n(y + h / 2 + j())} ${n(x + w + j())},${n(y + h + j())} Q${n(x + w / 2 + j())},${n(y + h + j())} ${n(x + j())},${n(y + h + j())} Q${n(x + j())},${n(y + h / 2 + j())} ${n(x + j())},${n(y + j())}`;
  return `${fill ? `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"/>` : ''}<path d="${pass()} ${pass()}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function head(x, y, angle, color, width, size = 13) {
  const a = (d) => `M${n(x)},${n(y)} L${n(x - size * Math.cos(angle + d))},${n(y - size * Math.sin(angle + d))}`;
  return `<path d="${a(0.45)} ${a(-0.45)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

export function line(r, x1, y1, x2, y2, { stroke = C.ink, width = 2.2, arrow = false, dash = null, passes = 2, size = 13 } = {}) {
  const j = (k = 1) => (r() - 0.5) * 2.2 * k;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const d = Array.from({ length: passes }, () => `M${n(x1 + j())},${n(y1 + j())} Q${n(mx + j(1.6))},${n(my + j(1.6))} ${n(x2 + j())},${n(y2 + j())}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${arrow ? head(x2, y2, Math.atan2(y2 - y1, x2 - x1), stroke, width, size) : ''}`;
}

/** Smooth chalk curve through points (Catmull-Rom as cubic Béziers). */
export function curve(points, { stroke = C.ink, width = 2.4, arrow = false, dash = null, opacity = 1 } = {}) {
  let d = `M${n(points[0][0])},${n(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    d += ` C${n(p1[0] + (p2[0] - p0[0]) / 6)},${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)},${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])},${n(p2[1])}`;
  }
  const [a, b] = points.slice(-2);
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>${arrow ? head(b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0]), stroke, width) : ''}`;
}

export function text(x, y, value, { size = 22, fill = C.ink, anchor = 'start', font = SANS, weight = null, italic = false, extra = '' } = {}) {
  return `<text x="${n(x)}" y="${n(y)}" font-family="${esc(font)}" font-size="${size}" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${weight ? ` font-weight="${weight}"` : ''}${italic ? ' font-style="italic"' : ''}${extra}>${esc(value)}</text>`;
}

/** Math label: strings stay on the baseline, [text, 'sup' | 'sub' | 'subword'] pieces shift, 'word' pieces are upright sans. */
export function math(x, y, parts, { size = 24, fill = C.ink, anchor = 'start', extra = '' } = {}) {
  let shift = 0, body = '';
  for (const part of parts) {
    const [value, kind] = typeof part === 'string' ? [part, null] : part;
    const target = kind === 'sup' ? -0.36 * size : kind === 'sub' || kind === 'subword' ? 0.24 * size : 0;
    const dy = n(target - shift);
    const upright = ` font-family="${esc(SANS)}" font-style="normal"`;
    const style = kind === 'word' ? upright : kind === 'subword' ? `${upright} font-size="${Math.round(size * 0.72)}"` : kind ? ` font-size="${Math.round(size * 0.68)}"` : '';
    body += `<tspan${dy ? ` dy="${dy}"` : ''}${style}>${esc(value)}</tspan>`;
    shift = target;
  }
  return `<text x="${n(x)}" y="${n(y)}" font-family="${esc(MATH)}" font-size="${size}" font-style="italic" fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}${extra}>${body}</text>`;
}

/** Handwritten label in a chalk box, used for panel and band titles. */
export function tag(r, label, { x = 16, y = -21, size = 27 } = {}) {
  const w = Math.round(label.length * size * 0.5 + 30);
  return rect(r, x, y, w, 42, { fill: C.bg, width: 2 }) + text(x + 14, y + 30, label, { font: HAND, size, weight: 700 });
}

export function star(x, y, size, color) {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? size * 0.45 : size;
    return `${n(x + rr * Math.cos(a))},${n(y + rr * Math.sin(a))}`;
  });
  return `<polygon points="${pts.join(' ')}" fill="${color}" stroke="${C.bg}" stroke-width="1.2"/>`;
}

export function snowflake(x, y, size, color) {
  const arms = [30, 90, 150, 210, 270, 330].map((deg) => {
    const a = (deg * Math.PI) / 180, ex = x + size * Math.cos(a), ey = y + size * Math.sin(a);
    const bx = x + size * 0.6 * Math.cos(a), by = y + size * 0.6 * Math.sin(a), b = size * 0.35;
    const branch = (d) => `M${n(bx)},${n(by)} L${n(bx + b * Math.cos(a + d))},${n(by + b * Math.sin(a + d))}`;
    return `M${n(x)},${n(y)} L${n(ex)},${n(ey)} ${branch(0.8)} ${branch(-0.8)}`;
  });
  return `<path d="${arms.join(' ')}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
}
