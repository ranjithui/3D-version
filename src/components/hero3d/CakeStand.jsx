import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLATE_TOP } from './dims';
import { materials } from './materials';

// Lathe profile (radius, height) of a footed pâtisserie stand; the plate top is at y = 0.95.
const PROFILE = [
  [0, 0], [0.78, 0], [0.8, 0.03], [0.74, 0.07], [0.5, 0.13], [0.22, 0.24], [0.15, 0.36], [0.13, 0.62],
  [0.17, 0.74], [0.3, 0.82], [1.5, 0.86], [1.56, 0.9], [1.55, 0.94], [1.48, 0.95], [0, 0.95],
];
export const STAND_FOOT = PLATE_TOP - 0.95;

/** Golden cake stand; rises out of the darkness as the assembly begins (a.stand 0 → 1). */
export default function CakeStand({ a, shadows }) {
  const ref = useRef();
  const m = materials();
  const geo = useMemo(() => new THREE.LatheGeometry(PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), 96), []);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = a.stand;
    g.visible = p > 0.001;
    g.position.y = STAND_FOOT - (1 - p) * 1.3;
    g.rotation.y = (1 - p) * 1.4;
    g.scale.setScalar(0.85 + 0.15 * p);
  });

  return (
    <group ref={ref} visible={false}>
      <mesh geometry={geo} material={m.gold} castShadow={shadows} receiveShadow />
      {/* Cream board on the plate */}
      <mesh position={[0, 0.953, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.board} receiveShadow>
        <circleGeometry args={[1.3, 96]} />
      </mesh>
    </group>
  );
}
