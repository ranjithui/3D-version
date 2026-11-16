import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { FOCUS_Y } from './dims';

/*
 * Warm key, cool-cream rim and gold fill, plus an in-scene studio environment for the
 * reflections on chocolate, ganache and the gold stand (no HDR file is downloaded).
 * a.sweep (0 → 1) orbits a golden spotlight once around the cake during the final reveal;
 * clicking the cake fires a short warm pulse.
 */
export default function CinematicLighting({ a, shadows }) {
  const sweep = useRef();
  const pulse = useRef();
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, FOCUS_Y, 0);
    return o;
  }, []);

  useFrame(() => {
    const s = sweep.current;
    if (s) {
      const ang = a.sweep * Math.PI * 2 - Math.PI / 2;
      s.position.set(Math.cos(ang) * 4, 2.6, Math.sin(ang) * 4);
      s.intensity = Math.sin(a.sweep * Math.PI) * 120;
    }
    if (pulse.current) {
      const since = performance.now() / 1000 - a.celebrateAt;
      pulse.current.intensity = since >= 0 && since < 1.2 ? Math.exp(-since * 3) * 25 : 0;
    }
  });

  return (
    <>
      <ambientLight intensity={0.16} color="#ffe2c4" />
      <directionalLight
        position={[3.5, 6, 4]} intensity={2.3} color="#ffd9a6" castShadow={shadows}
        shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.02}
        shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3}
      />
      <directionalLight position={[-4, 3, -4]} intensity={1.7} color="#fff0dc" />
      <pointLight position={[-3, 0.5, 3]} intensity={7} distance={12} color="#C99A52" />
      <primitive object={target} />
      <spotLight ref={sweep} angle={0.45} penumbra={0.9} distance={14} color="#f3c27a" target={target} intensity={0} />
      <pointLight ref={pulse} position={[0, 1.4, 0.6]} distance={5} color="#ffcf7a" intensity={0} />
      <Environment resolution={256} environmentIntensity={0.75}>
        <Lightformer form="rect" intensity={3.2} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} color="#fff3e2" />
        <Lightformer form="rect" intensity={2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[5, 2.2, 1]} color="#ffd9a8" />
        <Lightformer form="rect" intensity={1.6} position={[5, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[4, 1.4, 1]} color="#C99A52" />
        <Lightformer form="ring" intensity={1.4} position={[0, 2, -6]} scale={3} color="#fff5e8" />
      </Environment>
    </>
  );
}
