import { Link } from 'react-router-dom';
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion';
import { ArrowRight, CakeSlice, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

// Same captions as STAGES in CakeAnimationController (duplicated so this stays in the main
// bundle without pulling GSAP in).
const CAPTIONS = [
  'Setting the stage',
  'Laying the chocolate sponge',
  'Layering cream and sponge',
  'Pouring the ganache',
  'Decorating by hand',
  'The Desert Forest signature',
];

const list = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
const rise = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } } };

/** Hero copy, calls to action and the 3D controls (HTML only; the 3D lives in CakeAssemblyScene). */
export default function HeroContent({ has3D, snap, ctrl, onToggleSound, touch }) {
  const done = snap.done;
  const cue = !has3D ? null : done
    ? (touch ? 'Swipe to turn · tap the cake to celebrate' : 'Drag to turn · click the cake to celebrate')
    : 'Watch your cake come to life';

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="m-wrap hm-vhero__inner df-hero__inner">
          <m.div className="hm-vhero__copy df-hero__copy" variants={list} initial="hidden" animate="show">
            <m.span variants={rise} className="hm-kicker hm-vhero__kicker df-hero__kicker">Freshly baked</m.span>
            <m.h1 variants={rise} id="hero-heading" className="hm-vhero__title df-hero__title">
              Cakes for Every <em>Celebration</em>
            </m.h1>
            <m.p variants={rise} className="hm-vhero__lead">
              Handcrafted cakes, fresh pastries and custom creations for life&apos;s special moments.
            </m.p>
            <m.div variants={rise} className="hm-vhero__ctas">
              <Link to="/birthday-cakes" className="hm-btn hm-btn--solid">Shop Cakes <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/custom-cakes" className="hm-btn hm-btn--glass"><CakeSlice className="h-4 w-4" /> Custom Cake</Link>
            </m.div>
            {cue && (
              <m.p variants={rise} className="df-hero__cue" aria-hidden="true">
                <span className={`df-hero__cue-dot${done ? '' : ' is-live'}`} />
                <AnimatePresence mode="wait" initial={false}>
                  <m.span key={cue} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                    {cue}
                  </m.span>
                </AnimatePresence>
              </m.p>
            )}
          </m.div>
        </div>

        {has3D && (
          <m.div className="df-hero__dock" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6 }}>
            <div className="df-hero__stagecap" aria-hidden="true">
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={snap.stage} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.4 }}>
                  <b>{String(snap.stage + 1).padStart(2, '0')}</b> {CAPTIONS[snap.stage]}
                </m.span>
              </AnimatePresence>
              <i style={{ '--p': (snap.stage + (done ? 1 : 0)) / CAPTIONS.length }} />
            </div>
            <div className="df-hero__ctrls" role="group" aria-label="3D cake animation controls">
              <button type="button" className="df-hero__btn" onClick={() => ctrl?.replay()} disabled={!ctrl} aria-label="Replay the cake assembly">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button type="button" className="df-hero__btn" onClick={() => ctrl?.togglePause()} disabled={!ctrl}
                aria-pressed={snap.paused} aria-label={snap.paused ? 'Resume animation' : 'Pause animation'}>
                {snap.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button type="button" className="df-hero__btn" onClick={onToggleSound} disabled={!ctrl}
                aria-pressed={snap.sound} aria-label={snap.sound ? 'Turn sound off' : 'Turn sound on'}>
                {snap.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </m.div>
        )}
      </MotionConfig>
    </LazyMotion>
  );
}
