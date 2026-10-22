// Schematic time, deliberately unrelated to measured latency.
export const chapters = [0, .12, .43, .52, .66];
export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export function stateAt(time) {
  const t = clamp(time);
  const phase = t < .12 ? 0 : t < .43 ? 1 : t < .52 ? 2 : t < .66 ? 3 : 4;
  const baselineProgress = clamp((t - .12) / .31) * 300;
  const fasterProgress = clamp((t - .66) / .28) * 10;
  return {
    t, phase, prefill: clamp(t / .12), removal: clamp((t - .43) / .09),
    fusion: clamp((t - .52) / .14),
    baselineReads: Math.floor(baselineProgress + 1e-8),
    fasterReads: Math.floor(fasterProgress + 1e-8),
    baselineStep: Math.min(9, Math.floor(baselineProgress / 30)),
    fasterStep: Math.min(9, Math.floor(fasterProgress)),
    activeLayer: Math.min(29, Math.floor(baselineProgress) % 30),
    readProgress: baselineProgress % 1,
    fasterReadProgress: fasterProgress % 1,
  };
}
