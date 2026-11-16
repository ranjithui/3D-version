import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { rng } from './dims';
import { materials } from './materials';
import FlyIn from './FlyIn';

/* ---------- Geometry ---------- */

// Strawberry silhouette (radius, height): pointed tip at the bottom, shoulders under the calyx.
const PROFILE = [[0, -0.5], [0.1, -0.44], [0.2, -0.33], [0.29, -0.18], [0.35, -0.02], [0.37, 0.12], [0.34, 0.26], [0.26, 0.37], [0.13, 0.44], [0, 0.46]];
const V2 = PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
const geo = {};

function radiusAt(y) {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [r0, y0] = PROFILE[i], [r1, y1] = PROFILE[i + 1];
    if (y >= y0 && y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0));
  }
  return 0;
}

function berryGeo() { return (geo.berry ||= new THREE.LatheGeometry(V2, 40)); }
function halfGeo() { return (geo.half ||= new THREE.LatheGeometry(V2, 24, 0, Math.PI)); }

/** Flat cut face of a halved strawberry (in the plane x = 0), UV-mapped for the cut texture. */
function faceGeo() {
  if (geo.face) return geo.face;
  const shape = new THREE.Shape();
  PROFILE.forEach(([r, y], i) => (i ? shape.lineTo(r, y) : shape.moveTo(r, y)));
  [...PROFILE].reverse().forEach(([r, y]) => shape.lineTo(-r, y));
  const g = new THREE.ShapeGeometry(shape, 8);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 0.37) / 0.74, (pos.getY(i) + 0.5) / 0.96);
  g.rotateY(Math.PI / 2);
  return (geo.face = g);
}

function calyxGeo() {
  if (geo.calyx) return geo.calyx;
  const s = new THREE.Shape();
  const n = 6;
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? 0.07 : 0.27;
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(r, 0);
  }
  const g = new THREE.ShapeGeometry(s, 4);
  g.rotateX(-Math.PI / 2);
  // Droop the leaf tips over the shoulders.
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const d = Math.hypot(pos.getX(i), pos.getZ(i));
    pos.setY(i, -d * d * 0.9);
  }
  g.computeVertexNormals();
  return (geo.calyx = g);
}

const seedGeo = () => (geo.seed ||= new THREE.SphereGeometry(0.016, 6, 4));

/** Seeds placed on the skin, flattened into the surface and pointing outward. */
function useSeeds(ref, count, phiMax, seed) {
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(seed);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const y = -0.42 + r() * 0.78;
      const rad = radiusAt(y);
      const phi = r() * phiMax;
      const x = Math.sin(phi) * rad, z = Math.cos(phi) * rad;
      o.position.set(x * 1.01, y, z * 1.01);
      o.lookAt(x * 2, y + 0.15, z * 2);
      o.scale.set(1, 1.5, 0.45);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [ref, count, phiMax, seed]);
}

/* ---------- Models ---------- */

export function Strawberry({ seed = 1 }) {
  const m = materials();
  const seeds = useRef();
  useSeeds(seeds, 46, Math.PI * 2, seed);
  return (
    <group>
      <mesh geometry={berryGeo()} material={m.berry} castShadow />
      <instancedMesh ref={seeds} args={[seedGeo(), m.seed, 46]} />
      <mesh geometry={calyxGeo()} material={m.leafGreen} position={[0, 0.44, 0]} />
      <mesh material={m.leafGreen} position={[0.02, 0.5, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.014, 0.018, 0.12, 6]} />
      </mesh>
    </group>
  );
}

export function StrawberryHalf({ seed = 1 }) {
  const m = materials();
  const seeds = useRef();
  useSeeds(seeds, 24, Math.PI, seed);
  return (
    <group>
      <mesh geometry={halfGeo()} material={m.berry} castShadow />
      <mesh geometry={faceGeo()} material={m.berryCut} />
      <instancedMesh ref={seeds} args={[seedGeo(), m.seed, 24]} />
      <mesh geometry={calyxGeo()} material={m.leafGreen} position={[0, 0.44, 0]} scale={[1, 1, 0.5]} />
    </group>
  );
}

/* ---------- Placement on the cake (relative to the top surface) ---------- */

// Whole berries stand in a centre cluster; halves lie cut-face up around them.
const PLACES = [
  { half: false, to: [0.04, 0.17, 0.02], yaw: 0.4, tilt: [0.12, 0, -0.08], s: 0.36 },
  { half: false, to: [-0.3, 0.14, -0.2], yaw: 1.2, tilt: [-0.3, 0, 0.45], s: 0.33 },
  { half: false, to: [0.24, 0.13, -0.32], yaw: -0.6, tilt: [0.4, 0, -0.42], s: 0.32 },
  { half: true, to: [0.5, 0.07, 0.2], yaw: 0.5, tilt: [0, 0, -1.3], s: 0.34 },
  { half: true, to: [-0.1, 0.07, 0.5], yaw: 2.1, tilt: [0, 0, -1.3], s: 0.34 },
  { half: true, to: [-0.52, 0.07, 0.14], yaw: -2.4, tilt: [0, 0, -1.28], s: 0.33 },
  { half: true, to: [0.3, 0.07, 0.52], yaw: 1.0, tilt: [0, 0, -1.35], s: 0.3 },
];

/** Where each ingredient waits in the opening shot, spread around the cake. */
export function startPosition(i) {
  const ang = i * 2.4 + 0.6;
  return [Math.cos(ang) * 3.3, 1.1 + (i % 3) * 0.55, Math.sin(ang) * 2.1 - 0.6];
}

export default function StrawberryDecorations({ a }) {
  const places = useMemo(() => PLACES, []);
  return places.map((pl, i) => (
    <FlyIn key={i} item={a.strawberries[i]} appear={a.ingredients[i]} from={startPosition(i)} to={pl.to} yaw={pl.yaw} scale={pl.s} seed={i}>
      <group rotation={pl.tilt}>
        {pl.half ? <StrawberryHalf seed={i + 3} /> : <Strawberry seed={i + 3} />}
      </group>
    </FlyIn>
  ));
}
