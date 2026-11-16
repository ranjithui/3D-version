import gsap from 'gsap';
import { layerBottom } from './dims';

/*
 * Central animation timeline for the cake assembly. One GSAP timeline tweens plain progress
 * values in `a`; every 3D component reads them each frame, so all stages stay in sync and
 * replay / pause / resume act on a single timeline. Lives outside the <Canvas> so the HTML
 * controls can drive it too. Loaded on demand with the 3D scene (keeps GSAP out of the main
 * bundle).
 */

export const COUNTS = { ingredients: 10, floaters: 9, kisses: 12, strawberries: 7, macarons: 3, choc: 9, leaf: 10 };

export const STAGES = [
  'Setting the stage',
  'Laying the chocolate sponge',
  'Layering cream and sponge',
  'Pouring the ganache',
  'Decorating by hand',
  'The Desert Forest signature',
];

const items = n => Array.from({ length: n }, () => ({ p: 0 }));

export function createCakeController({ reduced = false } = {}) {
  const a = {
    dolly: 0, stand: 0, glaze: 0, flow: 0, sweep: 0, orbit: 0, interactive: 0,
    ingredients: items(COUNTS.ingredients), // strawberries 0–6, macarons 7–9 waiting in space
    floaters: items(COUNTS.floaters),
    layers: [0, 1, 2].map(() => ({ drop: 0, squash: 0 })),
    creams: items(2),
    kisses: items(COUNTS.kisses),
    strawberries: items(COUNTS.strawberries),
    macarons: items(COUNTS.macarons),
    choc: items(COUNTS.choc),
    leaf: items(COUNTS.leaf),
    // Written by the scene / page, not the timeline:
    scrollS: 0, // smoothed scroll progress through the hero (0–1)
    celebrateAt: -10, // performance.now()/1000 of the last click on the cake
  };

  let state = { stage: 0, paused: false, done: false, sound: false, started: false };
  const listeners = new Set();
  const fxListeners = new Set();
  const set = patch => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
  const emit = (type, data) => fxListeners.forEach(f => f(type, data));

  const tl = gsap.timeline({ paused: true, onComplete: () => set({ done: true }) });
  const at = (t, fn) => tl.call(fn, null, t);
  const stage = (i, t) => at(t, () => set({ stage: i }));
  const fx = (type, t, data) => at(t, () => emit(type, data));
  const tween = (target, vars, t) => tl.fromTo(target, Object.fromEntries(Object.keys(vars).filter(k => !['duration', 'ease', 'stagger'].includes(k)).map(k => [k, 0])), vars, t);

  at(0, () => set({ done: false }));

  /* Scene 1 – opening: camera pushes in, ingredients appear in space */
  stage(0, 0);
  tween(a, { dolly: 1, duration: 12.5, ease: 'power2.inOut' }, 0);
  tween(a.floaters, { p: 1, duration: 1.1, stagger: 0.1, ease: 'power3.out' }, 0.3);
  tween(a.ingredients, { p: 1, duration: 1, stagger: 0.09, ease: 'power3.out' }, 0.5);

  /* Scene 2 – cake base */
  stage(1, 1.4);
  tween(a, { stand: 1, duration: 1.1, ease: 'power3.out' }, 1.3);
  tween(a.layers[0], { drop: 1, duration: 0.95, ease: 'power2.in' }, 2.1);
  tween(a.layers[0], { squash: 1, duration: 0.9, ease: 'none' }, 3.05);
  fx('impact', 3.05, { y: layerBottom(0), strength: 1 });

  /* Scene 3 – layer assembly */
  stage(2, 3.4);
  tween(a.creams[0], { p: 1, duration: 0.85, ease: 'power2.out' }, 3.45);
  fx('spread', 3.45);
  tween(a.layers[1], { drop: 1, duration: 1.35, ease: 'power2.inOut' }, 4.05);
  tween(a.layers[1], { squash: 1, duration: 0.9, ease: 'none' }, 5.4);
  fx('impact', 5.4, { y: layerBottom(1), strength: 0.55 });
  tween(a.creams[1], { p: 1, duration: 0.85, ease: 'power2.out' }, 5.7);
  fx('spread', 5.7);
  tween(a.layers[2], { drop: 1, duration: 1.25, ease: 'power3.inOut' }, 6.2);
  tween(a.layers[2], { squash: 1, duration: 0.9, ease: 'none' }, 7.45);
  fx('impact', 7.45, { y: layerBottom(2), strength: 0.5 });

  /* Scene 4 – decoration */
  stage(3, 7.7);
  tween(a, { glaze: 1, duration: 0.95, ease: 'power2.out' }, 7.75);
  fx('pour', 7.75);
  tween(a, { flow: 1, duration: 2.1, ease: 'power1.inOut' }, 8.35);
  stage(4, 10.2);
  tween(a.kisses, { p: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.5)' }, 10.2);
  fx('pop', 10.2);
  tween(a.strawberries, { p: 1, duration: 1.05, stagger: 0.15, ease: 'power3.inOut' }, 10.5);
  fx('chime', 10.9);
  tween(a.macarons, { p: 1, duration: 1.05, stagger: 0.17, ease: 'power3.inOut' }, 11.4);
  tween(a.choc, { p: 1, duration: 0.65, stagger: 0.07, ease: 'power2.out' }, 12.0);
  tween(a.leaf, { p: 1, duration: 0.8, stagger: 0.05, ease: 'power2.out' }, 12.4);

  /* Scene 5 – final reveal: golden light sweep and one slow orbit */
  stage(5, 13.1);
  tween(a, { sweep: 1, duration: 2.8, ease: 'sine.inOut' }, 13.1);
  tween(a, { orbit: 1, duration: 4.4, ease: 'sine.inOut' }, 13.1);
  fx('reveal', 13.2);
  tween(a, { interactive: 1, duration: 0.9, ease: 'power2.out' }, 16.6);

  let hiddenPause = false;

  return {
    a,
    tl,
    subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
    getSnapshot: () => state,
    get state() { return state; },
    onFx(f) { fxListeners.add(f); return () => fxListeners.delete(f); },
    /** Plays the assembly once (or jumps to the finished cake when motion is reduced). */
    start() {
      if (state.started) return;
      if (reduced) {
        tl.progress(1);
        set({ started: true, done: true, stage: STAGES.length - 1 });
      } else {
        set({ started: true });
        tl.play(0);
      }
    },
    replay() {
      hiddenPause = false;
      set({ paused: false, done: false, started: true });
      tl.restart();
    },
    togglePause() {
      const paused = !state.paused;
      if (paused) tl.pause(); else if (!state.done) tl.resume();
      set({ paused });
    },
    toggleSound() { set({ sound: !state.sound }); },
    celebrate() {
      a.celebrateAt = performance.now() / 1000;
      emit('celebrate');
    },
    /** Hold the timeline while the hero is scrolled out of view; continue on return. */
    setVisible(visible) {
      if (!visible && tl.isActive()) { tl.pause(); hiddenPause = true; }
      else if (visible && hiddenPause) { hiddenPause = false; if (!state.paused) tl.resume(); }
    },
    kill() { tl.kill(); listeners.clear(); fxListeners.clear(); },
  };
}
