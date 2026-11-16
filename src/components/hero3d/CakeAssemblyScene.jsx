import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerformanceMonitor } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer, N8AO, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { DETAIL, FOCUS_Y } from './dims';
import CinematicLighting from './CinematicLighting';
import CakeCameraController from './CakeCameraController';
import CakeStand, { STAND_FOOT } from './CakeStand';
import CakeSpongeLayer from './CakeSpongeLayer';
import { CreamKisses, CreamLayer } from './CreamLayer';
import ChocolateGanache from './ChocolateGanache';
import StrawberryDecorations from './StrawberryDecorations';
import ChocolateDecorations, { MacaronDecorations, TopDecor } from './ChocolateDecorations';
import FloatingDesserts from './FloatingDesserts';
import { ChocolateChunks, Confetti, Crumbs, GoldDust } from './Particles';

/* ---------- Backdrop: deep chocolate with a warm glow behind the cake ---------- */

const backdropVert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
const backdropFrag = /* glsl */`
  uniform vec2 uGlow;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec3 deep = vec3(0.141, 0.071, 0.047);   // #24120C
    vec3 brown = vec3(0.231, 0.122, 0.078);  // #3B1F14
    vec3 forest = vec3(0.275, 0.345, 0.227); // #46583A
    vec3 gold = vec3(0.788, 0.604, 0.322);   // #C99A52
    vec2 p = vUv - uGlow; p.x *= uAspect;
    float d = length(p);
    vec3 col = mix(brown * 1.15, deep, smoothstep(0.0, 0.85, d));
    col += gold * 0.14 * exp(-d * d * 7.0) * (0.92 + 0.08 * sin(uTime * 0.6));
    vec2 q = vUv - vec2(0.0, 0.0); q.x *= uAspect;
    col = mix(col, forest * 0.5, 0.28 * exp(-dot(q, q) * 2.5));
    float n = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) * 0.012;                  // fine film grain, hides gradient banding
    gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0); // authored in sRGB → linear working space
  }`;

function Backdrop() {
  const { size } = useThree();
  const uniforms = useMemo(() => ({ uGlow: { value: new THREE.Vector2(0.68, 0.5) }, uAspect: { value: 1 }, uTime: { value: 0 } }), []);
  useEffect(() => {
    const aspect = size.width / size.height;
    uniforms.uAspect.value = aspect;
    uniforms.uGlow.value.set(aspect >= 1.2 ? 0.7 : aspect >= 1 ? 0.62 : 0.5, aspect >= 1 ? 0.5 : 0.7);
  }, [size, uniforms]);
  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={backdropVert} fragmentShader={backdropFrag} uniforms={uniforms} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

/* ---------- Cake root: drag to rotate, tap to celebrate ---------- */

function CakeRoot({ ctrl, reduced, children }) {
  const spin = useRef();
  const hop = useRef();
  const { gl, invalidate } = useThree();
  const drag = useRef({ on: false, x: 0, v: 0, rot: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const down = e => {
      if (ctrl.a.interactive < 0.5) return;
      Object.assign(drag.current, { on: true, x: e.clientX, v: 0 });
      el.classList.add('is-grabbing');
    };
    const move = e => {
      const d = drag.current;
      if (!d.on) return;
      const dx = e.clientX - d.x;
      d.x = e.clientX;
      d.v = dx * 0.006;
      d.rot += d.v;
      invalidate();
    };
    const up = () => { drag.current.on = false; el.classList.remove('is-grabbing'); };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [gl, ctrl, invalidate]);

  useFrame((_, dt) => {
    const d = drag.current;
    const a = ctrl.a;
    const step = Math.min(dt, 0.05);
    if (!d.on) {
      d.v *= reduced ? 0 : Math.pow(0.004, step); // inertia after release
      d.rot += d.v + (reduced ? 0 : step * 0.12 * a.interactive); // slow showcase turn
    }
    // Celebration: a small hop and an extra quarter turn.
    const since = performance.now() / 1000 - a.celebrateAt;
    const c = since >= 0 && since < 0.9 ? since / 0.9 : 1;
    if (c < 1) d.rot += step * Math.PI * 0.9 * (1 - c);
    if (spin.current) spin.current.rotation.y = d.rot;
    if (hop.current) {
      const h = c < 1 ? Math.sin(c * Math.PI) : 0;
      hop.current.position.y = h * 0.12;
      hop.current.scale.set(1 - h * 0.015, 1 + h * 0.03, 1 - h * 0.015);
    }
  });

  const onClick = e => {
    if (e.delta > 6 || ctrl.a.interactive < 0.5) return; // a drag, or still assembling
    e.stopPropagation();
    ctrl.celebrate();
  };

  return (
    <group ref={hop}>
      <group ref={spin} onClick={onClick}>{children}</group>
    </group>
  );
}

/* ---------- Post-processing ---------- */

function Effects({ level }) {
  const cfg = DETAIL[level];
  return (
    <EffectComposer multisampling={cfg.msaa}>
      {cfg.ao ? <N8AO halfRes quality="performance" aoRadius={0.45} intensity={1.6} distanceFalloff={0.6} /> : null}
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.88} luminanceSmoothing={0.22} radius={0.72} />
      {cfg.dof ? <DepthOfField target={[0, FOCUS_Y, 0]} focalLength={0.03} bokehScale={2.2} height={540} /> : null}
      <Vignette offset={0.24} darkness={0.58} />
    </EffectComposer>
  );
}

/* ---------- Scene ---------- */

export default function CakeAssemblyScene({ ctrl, tier, reduced, running, onReady }) {
  const [level, setLevel] = useState(tier);
  const cfg = DETAIL[tier];
  const [dpr, setDpr] = useState(cfg.dpr[1]);
  const a = ctrl.a;

  return (
    <Canvas
      dpr={dpr}
      shadows={cfg.shadows}
      frameloop={reduced ? 'demand' : running ? 'always' : 'never'}
      camera={{ fov: 35, near: 0.1, far: 60, position: [0, 3.8, 12.5] }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      onCreated={state => {
        const { gl } = state;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        onReady?.();
        // Give the canvas a moment to fade in before the assembly begins.
        setTimeout(() => ctrl.start(), reduced ? 0 : 450);
      }}
    >
      {/* Steps quality down if the frame rate drops (adaptive resolution and effects). */}
      <PerformanceMonitor
        onDecline={() => {
          setDpr(d => Math.max(1, d - 0.25));
          setLevel(l => (l === 'high' ? 'medium' : 'low'));
        }}
      />
      <Backdrop />
      <CinematicLighting a={a} shadows={cfg.shadows} />
      <CakeCameraController ctrl={ctrl} reduced={reduced} />

      <CakeRoot ctrl={ctrl} reduced={reduced}>
        <CakeStand a={a} shadows={cfg.shadows} />
        {[0, 1, 2].map(i => <CakeSpongeLayer key={i} a={a} index={i} shadows={cfg.shadows} />)}
        {[0, 1].map(i => <CreamLayer key={i} a={a} index={i} />)}
        <ChocolateGanache a={a} />
        <TopDecor a={a}>
          <StrawberryDecorations a={a} />
          <MacaronDecorations a={a} />
          <ChocolateDecorations a={a} />
        </TopDecor>
        <CreamKisses a={a} />
        <Crumbs ctrl={ctrl} count={cfg.crumbs} />
        <Confetti ctrl={ctrl} count={cfg.confetti} />
      </CakeRoot>

      <FloatingDesserts a={a} />
      <ChocolateChunks a={a} count={cfg.chunks} />
      <GoldDust count={cfg.dust} />
      <ContactShadows position={[0, STAND_FOOT + 0.002, 0]} opacity={0.65} scale={6} blur={2.4} far={2.5}
        resolution={tier === 'low' ? 256 : 512} color="#0d0603" />

      <Effects level={level} />
    </Canvas>
  );
}
