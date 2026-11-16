import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE, clamp01 } from './dims';
import { materials } from './materials';
import { Strawberry } from './StrawberryDecorations';

/* ---------- Models ---------- */

// Macaron shell (radius, height) with the ruffled "foot" at the base.
const SHELL = [[0, 0], [0.17, 0], [0.2, 0.012], [0.215, 0.03], [0.205, 0.048], [0.19, 0.056], [0.17, 0.08], [0.12, 0.105], [0.06, 0.117], [0, 0.12]];
let shellGeo;
const macaronShell = () => (shellGeo ||= new THREE.LatheGeometry(SHELL.map(([x, y]) => new THREE.Vector2(x, y)), 40));
const matCache = {};
const matte = color => (matCache[color] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.78 }));
const filling = color => (matCache[`f${color}`] ||= new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, sheen: 0.6 }));

export function Macaron({ color, filling: fill = PALETTE.cream }) {
  return (
    <group>
      <mesh geometry={macaronShell()} material={matte(color)} position={[0, 0.026, 0]} castShadow />
      <mesh geometry={macaronShell()} material={matte(color)} position={[0, -0.026, 0]} rotation={[Math.PI, 0, 0]} castShadow />
      <mesh material={filling(fill)}>
        <cylinderGeometry args={[0.172, 0.172, 0.052, 32]} />
      </mesh>
    </group>
  );
}

function ChocolatePiece() {
  const m = materials();
  return (
    <group>
      <RoundedBox args={[0.44, 0.1, 0.3]} radius={0.025} smoothness={3} material={m.darkChoc} castShadow />
      {[-0.11, 0, 0.11].map(x => (
        <mesh key={x} position={[x, 0.052, 0]} material={m.darkChoc}>
          <boxGeometry args={[0.012, 0.012, 0.28]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Floating ingredients around the stage ---------- */

// [model, position, depth for scroll parallax, scale]
const FLOATERS = [
  ['berry', [-2.6, 1.5, -1.6], 0.7, 0.42],
  ['choc', [-3.0, -0.8, -2.4], 0.9, 1],
  ['mac', [2.7, 1.5, -0.7], 0.5, 1.05, '#e7a1ad'],
  ['berry', [3.0, -0.5, 0.2], 0.4, 0.4],
  ['choc', [2.0, 2.4, -2.2], 0.8, 0.9],
  ['mac', [-1.7, 2.5, -2.8], 1.0, 0.95, '#8fa06a'],
  ['choc', [3.6, 0.7, -2.6], 1.0, 0.8],
  ['mac', [-3.4, 0.3, -3.2], 1.1, 0.9, '#5a3221'],
  ['berry', [2.3, -1.7, 1.0], 0.3, 0.38],
];

function Floater({ item, pos, depth, scale, a, children }) {
  const ref = useRef();
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = clamp01(item.p);
    g.visible = p > 0.001;
    // Ease out with a little overshoot as each one appears.
    const s = p < 1 ? 1 - Math.pow(1 - p, 3) * Math.cos(p * Math.PI * 1.5) : 1;
    g.scale.setScalar(Math.max(0.001, s * scale));
    // Scroll parallax: nearer pieces travel further.
    g.position.set(pos[0], pos[1] + a.scrollS * (0.8 + depth * 1.4), pos[2] + a.scrollS * depth * 0.6);
  });
  return <group ref={ref} visible={false}>{children}</group>;
}

export default function FloatingDesserts({ a }) {
  const list = useMemo(() => FLOATERS, []);
  return list.map(([kind, pos, depth, scale, color], i) => (
    <Floater key={i} item={a.floaters[i]} pos={pos} depth={depth} scale={scale} a={a}>
      <Float speed={1.2 + (i % 3) * 0.35} rotationIntensity={1.1} floatIntensity={1.2}>
        {kind === 'berry' && <group rotation={[0.3, i, 0.5]}><Strawberry seed={40 + i} /></group>}
        {kind === 'mac' && <group rotation={[0.9, i, 0.4]}><Macaron color={color} /></group>}
        {kind === 'choc' && <group rotation={[0.5, i * 1.3, 0.25]}><ChocolatePiece /></group>}
      </Float>
    </Floater>
  ));
}
