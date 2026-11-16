import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAKE_R, CAKE_TOP, rng } from './dims';
import { materials } from './materials';

/* All repeated particles use instancing or a single Points draw call. */

const tmp = new THREE.Object3D();

/* ---------- Glowing gold dust (one draw call, custom shader) ---------- */

const dustVert = /* glsl */`
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.05 + aSeed * 0.08) + 3.5, 7.0) - 3.5;   // slow rise, wrapping
    p.x += sin(uTime * 0.3 + aSeed * 12.0) * 0.25;
    p.z += cos(uTime * 0.25 + aSeed * 7.0) * 0.25;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (18.0 + aSeed * 34.0) * uPixelRatio / -mv.z;
    vAlpha = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 50.0), 2.0);
  }`;
const dustFrag = /* glsl */`
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * a * vAlpha);
  }`;

export function GoldDust({ count }) {
  const mat = useRef();
  const { positions, seeds } = useMemo(() => {
    const r = rng(5);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.set([(r() - 0.5) * 12, (r() - 0.5) * 7, (r() - 0.5) * 7 - 1], i * 3);
      seeds[i] = r();
    }
    return { positions, seeds };
  }, [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
    // Above 1.0 so the brightest motes catch the bloom.
    uColor: { value: new THREE.Color('#C99A52').multiplyScalar(2.2) },
  }), []);
  useFrame(({ clock }) => { if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime; });
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={mat} vertexShader={dustVert} fragmentShader={dustFrag} uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ---------- Floating chocolate particles ---------- */

export function ChocolateChunks({ a, count }) {
  const ref = useRef();
  const m = materials();
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.055, 0), []);
  const items = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: count }, () => {
      const ang = r() * Math.PI * 2;
      const rad = 2.4 + r() * 2.8;
      return { x: Math.cos(ang) * rad, y: (r() - 0.5) * 5, z: Math.sin(ang) * rad * 0.7 - 1.2, s: 0.5 + r() * 1.1, sp: 0.2 + r() * 0.5, ph: r() * 6, depth: r() };
    });
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const appear = Math.min(1, a.dolly * 5);
    items.forEach((it, i) => {
      tmp.position.set(it.x + Math.sin(t * it.sp + it.ph) * 0.15, it.y + Math.sin(t * it.sp * 0.8 + it.ph) * 0.2 + a.scrollS * (1 + it.depth * 1.6), it.z);
      tmp.rotation.set(t * it.sp + it.ph, t * it.sp * 0.7, it.ph);
      tmp.scale.setScalar(Math.max(0.001, it.s * appear));
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, m.darkChoc, count]} frustumCulled={false} />;
}

/* ---------- Crumbs that burst out when a sponge layer lands ---------- */

export function Crumbs({ ctrl, count }) {
  const ref = useRef();
  const m = materials();
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.022, 0), []);
  const pool = useMemo(() => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, max: 1 })), [count]);
  const next = useRef(0);

  useEffect(() => ctrl.onFx((type, data) => {
    if (type !== 'impact') return;
    const n = Math.round(count * 0.45 * (data?.strength ?? 1));
    for (let k = 0; k < n; k++) {
      const q = pool[next.current++ % count];
      const ang = Math.random() * Math.PI * 2;
      q.p.set(Math.cos(ang) * CAKE_R * (0.92 + Math.random() * 0.1), data.y + 0.02, Math.sin(ang) * CAKE_R * (0.92 + Math.random() * 0.1));
      const out = 0.6 + Math.random() * 1.2;
      q.v.set(Math.cos(ang) * out, 0.8 + Math.random() * 1.4, Math.sin(ang) * out);
      q.max = q.life = 0.8 + Math.random() * 0.6;
    }
  }), [ctrl, pool, count]);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = Math.min(dt, 0.05);
    pool.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= d;
        q.v.y -= 6 * d;
        q.p.addScaledVector(q.v, d);
      }
      tmp.position.copy(q.p);
      tmp.rotation.set(q.life * 8, q.life * 5, 0);
      tmp.scale.setScalar(q.life > 0 ? Math.min(1, (q.life / q.max) * 2) : 0.0001);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, m.milkChoc, count]} frustumCulled={false} />;
}

/* ---------- Gold-leaf confetti for the click/tap celebration ---------- */

export function Confetti({ ctrl, count }) {
  const ref = useRef();
  const m = materials();
  const geo = useMemo(() => new THREE.PlaneGeometry(0.08, 0.11), []);
  const parts = useMemo(() => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 })), [count]);

  useEffect(() => ctrl.onFx(type => {
    if (type !== 'celebrate') return;
    parts.forEach(q => {
      const ang = Math.random() * Math.PI * 2;
      const out = 0.4 + Math.random() * 1.4;
      q.p.set(0, CAKE_TOP + 0.5, 0);
      q.v.set(Math.cos(ang) * out, 2.4 + Math.random() * 2.2, Math.sin(ang) * out);
      q.w.set(Math.random() * 9, Math.random() * 9, Math.random() * 9);
      q.life = 1.8 + Math.random() * 1.2;
    });
  }), [ctrl, parts]);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = Math.min(dt, 0.05);
    parts.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= d;
        q.v.y -= 4.2 * d;
        q.v.multiplyScalar(1 - 1.5 * d); // air drag: flakes flutter down
        q.p.addScaledVector(q.v, d);
        q.r.x += q.w.x * d; q.r.y += q.w.y * d; q.r.z += q.w.z * d;
      }
      tmp.position.copy(q.p);
      tmp.rotation.copy(q.r);
      tmp.scale.setScalar(q.life > 0 ? Math.min(1, q.life) : 0.0001);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, m.confetti, count]} frustumCulled={false} />;
}
