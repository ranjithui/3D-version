import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAKE_H, CAKE_R, CAKE_TOP, PLATE_TOP } from './dims';
import { materials } from './materials';

/*
 * Glossy ganache in three parts, driven by the timeline:
 *  - a.glaze (0 → 1): a stream pours onto the centre and the top glaze spreads to the edge;
 *  - a.flow  (0 → 1): ganache runs down the sides. A custom shader (patched into the PBR
 *    material, so lighting and reflections are unchanged) hides the shell below a wavy edge,
 *    which forms natural-looking drips of different lengths as it advances.
 */

const SHELL_R = CAKE_R + 0.028;

const DRIP_GLSL = /* glsl */`
  float ang = atan(vLocal.z, vLocal.x);
  float yN = (vLocal.y + uHalfH) / (2.0 * uHalfH);          // 0 at the base, 1 at the top edge
  float drip = pow(max(0.0, sin(ang * 9.0 + 1.3) * 0.5 + 0.5), 5.0) * 0.26
             + pow(max(0.0, sin(ang * 14.0 + 4.1) * 0.5 + 0.5), 9.0) * 0.20
             + pow(max(0.0, sin(ang * 5.0 + 2.2) * 0.5 + 0.5), 7.0) * 0.10
             + sin(ang * 31.0) * 0.008;
  float edge = 1.0 - uFlow * (0.3 + drip);
  if (yN < edge) discard;
`;

function useShellMaterial(uniforms) {
  return useMemo(() => {
    const mat = materials().ganache.clone();
    mat.side = THREE.DoubleSide;
    mat.onBeforeCompile = shader => {
      shader.uniforms.uFlow = uniforms.uFlow;
      shader.uniforms.uHalfH = uniforms.uHalfH;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;\nuniform float uFlow;\nuniform float uHalfH;')
        .replace('void main() {', `void main() {\n${DRIP_GLSL}`);
    };
    mat.customProgramCacheKey = () => 'df-ganache-flow';
    return mat;
  }, [uniforms]);
}

export default function ChocolateGanache({ a }) {
  const m = materials();
  const uniforms = useMemo(() => ({ uFlow: { value: 0 }, uHalfH: { value: CAKE_H / 2 } }), []);
  const shellMat = useShellMaterial(uniforms);
  const shell = useRef();
  const top = useRef();
  const lip = useRef();
  const stream = useRef();

  useFrame(({ clock }) => {
    uniforms.uFlow.value = a.flow;
    if (shell.current) shell.current.visible = a.flow > 0.001;
    const g = a.glaze;
    if (top.current) {
      top.current.visible = g > 0.001;
      const s = Math.max(0.001, g);
      top.current.scale.set(s, 1, s);
    }
    if (lip.current) {
      lip.current.visible = a.flow > 0.02;
      lip.current.scale.set(1, 1, Math.min(1, a.flow * 6));
    }
    if (stream.current) {
      // Pour stream: thickens in, then thins out and lifts away as the glaze reaches the edge.
      const on = g > 0.001 && g < 0.98;
      stream.current.visible = on;
      const w = Math.sin(Math.min(1, g * 1.15) * Math.PI) * (1 + Math.sin(clock.elapsedTime * 30) * 0.04);
      stream.current.scale.set(Math.max(0.001, w), 1, Math.max(0.001, w));
      stream.current.position.y = CAKE_TOP + 1.4 + Math.max(0, g - 0.75) * 4;
    }
  });

  return (
    <group>
      <mesh ref={shell} material={shellMat} visible={false} position={[0, PLATE_TOP + CAKE_H / 2, 0]}>
        <cylinderGeometry args={[SHELL_R, SHELL_R, CAKE_H, 160, 1, true]} />
      </mesh>
      <mesh ref={top} material={m.ganache} visible={false} position={[0, CAKE_TOP + 0.016, 0]}>
        <cylinderGeometry args={[CAKE_R + 0.03, CAKE_R + 0.03, 0.036, 128]} />
      </mesh>
      {/* Rounded lip where the ganache rolls over the top edge */}
      <mesh ref={lip} material={m.ganache} visible={false} position={[0, CAKE_TOP + 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CAKE_R + 0.012, 0.03, 16, 160]} />
      </mesh>
      <mesh ref={stream} material={m.ganache} visible={false}>
        <cylinderGeometry args={[0.055, 0.075, 2.8, 24, 1, true]} />
      </mesh>
    </group>
  );
}
