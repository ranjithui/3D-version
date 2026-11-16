import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CAKE_R, SPONGE_H, layerBottom } from './dims';
import { materials } from './materials';

// How much each layer squashes on landing (heavier first layer squashes most).
const SQUASH = [0.07, 0.05, 0.04];

/**
 * One chocolate sponge layer. a.layers[index].drop (0 → 1) moves it into place:
 *  0 – descends straight down onto the stand,
 *  1 – floats in on a curve from the side,
 *  2 – descends while turning to align with the layers below.
 * a.layers[index].squash (0 → 1) plays a damped squash-and-settle after landing.
 */
export default function CakeSpongeLayer({ a, index, shadows }) {
  const outer = useRef();
  const inner = useRef();
  const st = a.layers[index];
  const base = layerBottom(index);
  const m = materials();

  useFrame(() => {
    const o = outer.current;
    if (!o) return;
    const d = st.drop;
    const r = 1 - d;
    o.visible = d > 0.001;
    if (index === 0) {
      o.position.set(0, base + r * 3.8, 0);
      o.rotation.set(0, r * 0.4, 0);
    } else if (index === 1) {
      // Quadratic Bézier from upper-right/behind, swinging forward, into place.
      const s = [3.2, 1.9, -1.6], c = [2.6, 2.3, 1.3];
      o.position.set(r * r * s[0] + 2 * r * d * c[0], base + r * r * s[1] + 2 * r * d * c[1], r * r * s[2] + 2 * r * d * c[2]);
      o.rotation.set(r * 0.25, r * 1.4, r * 0.3);
    } else {
      o.position.set(0, base + r * 3.4, 0);
      o.rotation.set(Math.sin(r * Math.PI) * 0.1, r * 1.1, 0);
    }
    const s = st.squash;
    const k = s > 0 && s < 1 ? Math.sin(s * Math.PI * 3) * Math.exp(-s * 3.2) * SQUASH[index] : 0;
    inner.current.scale.set(1 + k * 0.5, 1 - k, 1 + k * 0.5);
  });

  return (
    <group ref={outer} visible={false}>
      {/* Pivot at the layer's base so it squashes onto the surface below. */}
      <group ref={inner}>
        <mesh position={[0, SPONGE_H / 2, 0]} material={m.sponge} castShadow={shadows} receiveShadow>
          <cylinderGeometry args={[CAKE_R, CAKE_R, SPONGE_H, 96, 1]} />
        </mesh>
      </group>
    </group>
  );
}
