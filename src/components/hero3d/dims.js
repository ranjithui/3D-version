/* Shared dimensions, palette and per-device detail levels for the 3D cake hero. */

export const PALETTE = {
  deep: '#24120C',
  brown: '#3B1F14',
  forest: '#46583A',
  cream: '#FFF5E8',
  gold: '#C99A52',
  ganache: '#2a120a',
  milkChoc: '#6e3f24',
  berry: '#b8102a',
};

export const CAKE_R = 1.1;
export const SPONGE_H = 0.42;
export const CREAM_H = 0.085;
/** Top surface of the cake stand's plate; the first sponge sits here. */
export const PLATE_TOP = -1.0;
export const layerBottom = i => PLATE_TOP + i * (SPONGE_H + CREAM_H);
export const CAKE_TOP = PLATE_TOP + 3 * SPONGE_H + 2 * CREAM_H;
export const CAKE_H = CAKE_TOP - PLATE_TOP;
/** Where the camera looks once the cake is assembled. */
export const FOCUS_Y = -0.45;

/** Particle counts and effects per device tier ('high' desktop → 'low' phones). */
export const DETAIL = {
  high: { dust: 170, chunks: 34, crumbs: 70, confetti: 90, shadows: true, ao: true, dof: true, msaa: 4, dpr: [1, 1.75] },
  medium: { dust: 120, chunks: 24, crumbs: 50, confetti: 70, shadows: false, ao: false, dof: false, msaa: 2, dpr: [1, 1.5] },
  low: { dust: 60, chunks: 12, crumbs: 32, confetti: 45, shadows: false, ao: false, dof: false, msaa: 0, dpr: [1, 1.5] },
};

export const clamp01 = x => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Frame-rate independent smoothing toward a target. */
export const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
/** Small seeded PRNG so procedural details are identical on every visit. */
export function rng(seed = 1) {
  let s = seed * 16807 % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
