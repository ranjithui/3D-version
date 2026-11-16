import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { FOCUS_Y, damp, lerp } from './dims';

/*
 * Cinematic camera:
 *  - a.dolly: slow push-in from a wide establishing shot during the assembly,
 *  - a.orbit: one slow orbit around the finished cake at the reveal,
 *  - mouse: subtle perspective shift toward the pointer,
 *  - scroll (after assembly): eases in toward the cake as the visitor scrolls down.
 * The view is shifted (setViewOffset) so the cake sits on the right half on desktop and in
 * the upper half on phones, leaving room for the hero copy.
 */
export default function CakeCameraController({ ctrl, reduced }) {
  const { camera, size } = useThree();
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const layout = useRef({ radius: 1, narrow: false });

  useEffect(() => {
    if (reduced) return undefined;
    const onMove = e => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  useEffect(() => {
    const { width: w, height: h } = size;
    const aspect = w / h;
    if (aspect >= 1.2 && w >= 900) {
      camera.setViewOffset(w, h, -w * 0.2, h * 0.03, w, h); // cake on the right ~55–60%
      layout.current = { radius: 1, narrow: false };
    } else if (aspect >= 1) {
      camera.setViewOffset(w, h, -w * 0.12, h * 0.06, w, h);
      layout.current = { radius: 1.15, narrow: false };
    } else {
      camera.setViewOffset(w, h, 0, h * 0.2, w, h); // phones: cake in the upper half
      layout.current = { radius: 1.6, narrow: true };
    }
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((_, dt) => {
    const a = ctrl.a;
    const p = pointer.current;
    const d = Math.min(dt, 0.05);
    p.x = damp(p.x, p.tx, 3, d);
    p.y = damp(p.y, p.ty, 3, d);
    a.scrollS = damp(a.scrollS, (ctrl.scroll || 0) * a.interactive, 6, d);

    const { radius: k } = layout.current;
    const radius = lerp(12.5, 6.5, a.dolly) * k - a.scrollS * 1.8;
    const height = lerp(3.8, 1.15, a.dolly) - a.scrollS * 0.45 - p.y * 0.3;
    const az = a.orbit * Math.PI * 2 + p.x * 0.14;
    camera.position.set(Math.sin(az) * radius, height, Math.cos(az) * radius);
    camera.lookAt(0, lerp(0.2, FOCUS_Y, a.dolly) + a.scrollS * 0.1, 0);
  });

  return null;
}
