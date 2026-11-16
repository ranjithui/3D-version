import { useMemo } from 'react';

/* Shared, procedurally modelled cake pieces used by ProductCake3D. */

export const C = {
  sponge: '#4a2614',
  ganache: '#2b140a',
  cream: '#f6ead6',
  caramel: '#c98a3d',
  cherry: '#b3122e',
  gold: '#d9b26a',
  plate: '#f3efe8',
  pink: '#f2a7b8',
  mint: '#a8d8b9',
  lemon: '#f5d77a',
};

/** A ring of drips hanging off the top edge of a tier. */
export function Drips({ radius, y, count = 22, color }) {
  const drips = useMemo(() => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const len = 0.12 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.22;
    return { a, len };
  }), [count]);
  return (
    <group position={[0, y, 0]}>
      {drips.map(({ a, len }, i) => (
        <group key={i} position={[Math.cos(a) * radius, -len / 2, Math.sin(a) * radius]}>
          <mesh>
            <capsuleGeometry args={[0.045, len, 6, 10]} />
            <meshStandardMaterial color={color} roughness={0.18} metalness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Piped cream rosettes around a tier. */
export function Rosettes({ radius, y, count = 14, color = C.cream, size = 0.09 }) {
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[0, -a, 0]}>
            <torusKnotGeometry args={[size * 0.55, size * 0.35, 48, 8, 2, 5]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Cherry({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshPhysicalMaterial color={C.cherry} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      <mesh position={[0.03, 0.2, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
        <meshStandardMaterial color="#4b553e" />
      </mesh>
    </group>
  );
}

