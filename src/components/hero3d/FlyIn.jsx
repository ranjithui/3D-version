import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { clamp01 } from './dims';

/**
 * Moves a decoration from where it floats in the opening shot to its place on the cake.
 *  appear.p (0 → 1): scales it in at its floating start position (Scene 1),
 *  item.p   (0 → 1): flies it along an arc into place while it turns and settles (Scene 4).
 * `from`/`to` are positions; `yaw` is the final turn; `spin` the extra turns it settles out of.
 */
export default function FlyIn({ item, appear, from, to, yaw = 0, spin = [2.2, 1.6, 1.1], scale = 1, lift = 1.5, seed = 0, children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const p = item.p;
    const shown = Math.max(clamp01(appear.p), p > 0 ? 1 : 0);
    g.visible = shown > 0.001;
    const r = 1 - p;
    const t = clock.elapsedTime + seed * 1.7;
    // Gentle bob while waiting, fading out as it flies.
    const bob = Math.sin(t * 1.3) * 0.08 * r;
    const wob = Math.sin(t * 0.9) * 0.25 * r;
    const cx = (from[0] + to[0]) / 2, cy = Math.max(from[1], to[1]) + lift, cz = (from[2] + to[2]) / 2;
    g.position.set(
      r * r * from[0] + 2 * r * p * cx + p * p * to[0],
      r * r * from[1] + 2 * r * p * cy + p * p * to[1] + bob,
      r * r * from[2] + 2 * r * p * cz + p * p * to[2],
    );
    g.rotation.set(spin[0] * r + wob, yaw + spin[1] * r, spin[2] * r - wob * 0.5);
    g.scale.setScalar(Math.max(0.001, scale * shown * (0.85 + 0.15 * p)));
  });
  return <group ref={ref} visible={false}>{children}</group>;
}
