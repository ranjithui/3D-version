/*
 * Site-wide 3D pointer tilt. One delegated listener covers every card matched by SELECTOR on
 * every page (including ones rendered later), so components need no changes. Skipped on touch
 * devices and when the visitor prefers reduced motion.
 */
const SELECTOR = '.hm-best-card, .m-card, .m-tile, .hp-cat, .hp-step, .hp-custom, .hp-stores, .pdp-photo';
const MAX_DEG = 9;

export function installTilt3D() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let active = null;
  let raf = 0;
  let last = null;

  const reset = el => {
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const apply = () => {
    raf = 0;
    if (!active || !last) return;
    const r = active.getBoundingClientRect();
    const px = (last.clientX - r.left) / r.width;
    const py = (last.clientY - r.top) / r.height;
    // Large banners tilt less than small cards.
    const max = r.width > 700 ? MAX_DEG * 0.35 : MAX_DEG;
    active.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    active.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
    active.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    active.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  };

  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.(SELECTOR);
    if (el !== active) {
      if (active) reset(active);
      active = el;
      if (el) el.classList.add('tilt3d', 'is-tilting');
    }
    last = e;
    if (active && !raf) raf = requestAnimationFrame(apply);
  }, { passive: true });

  document.addEventListener('pointerleave', () => { if (active) reset(active); active = null; });

  // Tag cards up front so the resting transform/transition is in place before the first hover.
  const tag = () => document.querySelectorAll(SELECTOR).forEach(el => el.classList.add('tilt3d'));
  new MutationObserver(tag).observe(document.body, { childList: true, subtree: true });
  tag();
}
