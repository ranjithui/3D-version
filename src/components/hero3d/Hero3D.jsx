import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { hasWebGL } from '../../lib/webgl';
import HeroContent from './HeroContent';

/*
 * Homepage hero: interactive 3D cake assembly (lazy-loaded) beside the hero copy.
 * Device tiers: 'high' (capable desktop), 'medium', 'low' (phones/tablets), or 'none' for
 * no WebGL / very low-end hardware, which keeps the lightweight poster-photo hero.
 * prefers-reduced-motion shows the finished cake without the assembly or ambient motion.
 */

const CakeAssemblyScene = lazy(() => import('./CakeAssemblyScene'));

function detectTier() {
  if (typeof window === 'undefined' || !hasWebGL()) return 'none';
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  if (cores <= 2 || memory <= 2 || navigator.connection?.saveData) return 'none';
  const small = window.matchMedia('(max-width: 899px), (pointer: coarse)').matches;
  if (small) return 'low';
  return cores >= 8 && memory >= 8 ? 'high' : 'medium';
}

const IDLE = { stage: 0, paused: false, done: false, sound: false, started: false };
const noopSubscribe = () => () => {};

export default function Hero3D() {
  const ref = useRef(null);
  const [tier] = useState(detectTier);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [ctrl, setCtrl] = useState(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const has3D = tier !== 'none';

  const snap = useSyncExternalStore(ctrl ? ctrl.subscribe : noopSubscribe, ctrl ? ctrl.getSnapshot : () => IDLE, () => IDLE);

  // Load the timeline (and GSAP) only when the 3D hero will actually run.
  useEffect(() => {
    if (!has3D) return undefined;
    let live = true;
    let c;
    import('./CakeAnimationController').then(mod => {
      if (!live) return;
      c = mod.createCakeController({ reduced });
      setCtrl(c);
    });
    return () => { live = false; c?.kill(); };
  }, [has3D, reduced]);

  // Sound effects follow the timeline's events when the visitor has turned sound on.
  useEffect(() => {
    if (!ctrl) return undefined;
    let sound;
    return ctrl.onFx((type, data) => {
      if (!ctrl.state.sound || ctrl.state.paused) return;
      (sound ||= import('./sound')).then(mod => mod.playSound(type, data));
    });
  }, [ctrl]);

  // Scroll progress through the hero, and stop rendering while it is off screen.
  useEffect(() => {
    if (!ctrl) return undefined;
    const el = ref.current;
    const onScroll = () => { ctrl.scroll = Math.min(1, Math.max(0, window.scrollY / (el.offsetHeight * 0.85))); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      ctrl.setVisible(e.isIntersecting);
    }, { threshold: 0.02 });
    io.observe(el);
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, [ctrl]);

  const toggleSound = () => {
    if (!ctrl) return;
    if (!snap.sound) import('./sound').then(mod => mod.primeAudio());
    ctrl.toggleSound();
  };

  const cls = ['hm-vhero', 'df-hero', has3D ? 'is-3d' : 'is-fallback', ready && 'is-ready', snap.done && 'is-done'].filter(Boolean).join(' ');

  return (
    <section ref={ref} className={cls} aria-labelledby="hero-heading">
      {has3D && (
        <div className="df-hero__stage" aria-hidden="true">
          {ctrl && (
            <Suspense fallback={null}>
              <CakeAssemblyScene
                ctrl={ctrl}
                tier={tier}
                reduced={reduced}
                running={inView && !snap.paused}
                onReady={() => setReady(true)}
              />
            </Suspense>
          )}
          {!ready && <span className="df-hero__loading">Preheating the oven…</span>}
        </div>
      )}
      <div className="df-hero__shade" aria-hidden="true" />
      <HeroContent has3D={has3D} snap={snap} ctrl={ctrl} onToggleSound={toggleSound} touch={touch} />
    </section>
  );
}
