import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAKE_R, CAKE_TOP, rng } from './dims';
import { materials } from './materials';
import FlyIn from './FlyIn';
import { Macaron } from './FloatingDesserts';
import { startPosition } from './StrawberryDecorations';

/* ---------- Macarons standing at the back of the top ---------- */

const MACARONS = [
  { ang: -2.25, color: '#8fa06a' }, // pistachio, in the brand's forest green family
  { ang: -1.55, color: '#e7a1ad' },
  { ang: -0.85, color: '#5a3221', filling: '#c99a52' },
];

export function MacaronDecorations({ a }) {
  return MACARONS.map((mc, i) => {
    const r = 0.66;
    const to = [Math.cos(mc.ang) * r, 0.2, Math.sin(mc.ang) * r];
    return (
      <FlyIn key={i} item={a.macarons[i]} appear={a.ingredients[7 + i]} from={startPosition(7 + i)} to={to}
        yaw={-mc.ang + Math.PI / 2} scale={0.8} seed={10 + i}>
        {/* Stand on edge, leaning back slightly, facing outward */}
        <group rotation={[Math.PI / 2 - 0.32, 0, 0]}>
          <Macaron color={mc.color} filling={mc.filling} />
        </group>
      </FlyIn>
    );
  });
}

/* ---------- Chocolate curls, shards and gold leaf ---------- */

function curlGeometry() {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const ang = t * Math.PI * 2 * 2.2;
    pts.push(new THREE.Vector3(Math.cos(ang) * 0.045, t * 0.32 - 0.16, Math.sin(ang) * 0.045));
  }
  const shape = new THREE.Shape();
  shape.moveTo(-0.004, -0.022); shape.lineTo(0.004, -0.022); shape.lineTo(0.004, 0.022); shape.lineTo(-0.004, 0.022); shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { steps: 120, extrudePath: new THREE.CatmullRomCurve3(pts), bevelEnabled: false });
}

function shardGeometry(seed) {
  const r = rng(seed);
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.26 + r() * 0.08, 0.02);
  s.lineTo(0.2 + r() * 0.06, 0.18 + r() * 0.06);
  s.lineTo(0.08 + r() * 0.06, 0.38 + r() * 0.08);
  s.lineTo(-0.02, 0.2);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
  g.translate(-0.12, 0, -0.007);
  return g;
}

function leafGeometry(seed) {
  const r = rng(seed);
  const s = new THREE.Shape();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rad = 0.03 + r() * 0.04;
    if (i) s.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else s.moveTo(rad, 0);
  }
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

// Curls lie between the berries; shards stand at the back. Positions relative to the top.
const CHOC = [
  { kind: 'curl', mat: 'darkChoc', pos: [-0.05, 0.05, -0.52], rot: [0, 0.3, Math.PI / 2] },
  { kind: 'curl', mat: 'milkChoc', pos: [0.55, 0.05, -0.1], rot: [0.2, 1.4, Math.PI / 2] },
  { kind: 'curl', mat: 'darkChoc', pos: [-0.6, 0.05, -0.32], rot: [0, -0.9, Math.PI / 2] },
  { kind: 'curl', mat: 'milkChoc', pos: [0.1, 0.05, 0.3], rot: [0.1, 2.2, Math.PI / 2] },
  { kind: 'curl', mat: 'darkChoc', pos: [-0.35, 0.05, 0.36], rot: [0, 0.9, Math.PI / 2] },
  { kind: 'curl', mat: 'milkChoc', pos: [0.62, 0.05, 0.42], rot: [0, -0.4, Math.PI / 2] },
  { kind: 'shard', mat: 'darkChoc', pos: [0.05, 0.0, -0.42], rot: [-0.12, 0.2, 0.05], seed: 4 },
  { kind: 'shard', mat: 'darkChoc', pos: [-0.22, 0.0, -0.4], rot: [-0.1, -0.5, -0.12], seed: 9 },
  { kind: 'shard', mat: 'milkChoc', pos: [0.3, 0.0, -0.46], rot: [-0.08, 0.7, 0.15], seed: 13 },
];

export default function ChocolateDecorations({ a }) {
  const m = materials();
  const curl = useMemo(curlGeometry, []);
  const shards = useMemo(() => CHOC.map(c => (c.kind === 'shard' ? shardGeometry(c.seed) : null)), []);
  const leaves = useMemo(() => {
    const r = rng(21);
    return a.leaf.map((_, i) => {
      // Half on the top among the decorations, half caught on the ganache drips.
      const onSide = i % 2 === 1;
      const ang = r() * Math.PI * 2;
      const rad = onSide ? CAKE_R + 0.035 : 0.25 + r() * 0.55;
      return {
        geo: leafGeometry(30 + i),
        pos: [Math.cos(ang) * rad, onSide ? -0.08 - r() * 0.22 : 0.06, Math.sin(ang) * rad],
        rot: onSide ? [0, -ang + Math.PI / 2, r()] : [-Math.PI / 2 + (r() - 0.5) * 0.5, 0, r() * 3],
      };
    });
  }, [a.leaf]);
  const chocRefs = useRef([]);
  const leafRefs = useRef([]);

  useFrame(() => {
    a.choc.forEach((it, i) => {
      const g = chocRefs.current[i];
      if (!g) return;
      g.visible = it.p > 0.001;
      const s = Math.max(0.001, it.p);
      // Grow up out of the ganache and twist into place.
      g.scale.set(s, s, s);
      g.position.y = CHOC[i].pos[1] + (1 - it.p) * 0.25;
      g.rotation.y = CHOC[i].rot[1] + (1 - it.p) * 1.5;
    });
    a.leaf.forEach((it, i) => {
      const g = leafRefs.current[i];
      if (!g) return;
      g.visible = it.p > 0.001;
      // Flutter down onto the cake.
      const r = 1 - it.p;
      g.position.set(leaves[i].pos[0], leaves[i].pos[1] + r * 0.9, leaves[i].pos[2]);
      g.rotation.set(leaves[i].rot[0] + r * 4, leaves[i].rot[1], leaves[i].rot[2] + r * 3);
    });
  });

  return (
    <>
      {CHOC.map((c, i) => (
        <group key={i} ref={el => { chocRefs.current[i] = el; }} position={c.pos} rotation={c.rot} visible={false}>
          <mesh geometry={c.kind === 'curl' ? curl : shards[i]} material={m[c.mat]} castShadow />
        </group>
      ))}
      {leaves.map((l, i) => (
        <mesh key={`l${i}`} ref={el => { leafRefs.current[i] = el; }} geometry={l.geo} material={m.goldLeaf} visible={false} />
      ))}
    </>
  );
}

/** Everything that sits on the top surface; drifts up a touch with scroll for parallax. */
export function TopDecor({ a, children }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y = CAKE_TOP + 0.03 + a.scrollS * 0.16;
    ref.current.rotation.y = a.scrollS * 0.35;
  });
  return <group ref={ref} position={[0, CAKE_TOP + 0.03, 0]}>{children}</group>;
}
