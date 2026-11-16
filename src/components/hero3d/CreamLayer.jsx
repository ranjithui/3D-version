import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAKE_R, CAKE_TOP, CREAM_H, SPONGE_H, layerBottom } from './dims';
import { materials } from './materials';

/** Chocolate cream filling between two sponges; spreads out from the centre (a.creams[i].p). */
export function CreamLayer({ a, index }) {
  const ref = useRef();
  const m = materials();
  const st = a.creams[index];
  // Slight outward bulge, as if squeezed by the layer above.
  const geo = useMemo(() => new THREE.LatheGeometry([
    [0, -CREAM_H / 2], [CAKE_R - 0.02, -CREAM_H / 2], [CAKE_R + 0.035, -CREAM_H * 0.1],
    [CAKE_R + 0.03, CREAM_H * 0.2], [CAKE_R - 0.02, CREAM_H / 2], [0, CREAM_H / 2],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 96), []);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = st.p;
    g.visible = p > 0.001;
    const s = Math.max(0.001, p);
    g.scale.set(s, 0.35 + 0.65 * p, s);
  });

  return (
    <mesh ref={ref} geometry={geo} material={m.chocCream} visible={false}
      position={[0, layerBottom(index) + SPONGE_H + CREAM_H / 2, 0]} />
  );
}

/** Piped star "kiss": an 8-point star extruded upward, twisted and tapered to a tip. */
function kissGeometry() {
  const shape = new THREE.Shape();
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const ang = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? 0.05 : 0.072;
    if (i) shape.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); else shape.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  shape.closePath();
  const H = 0.17;
  const g = new THREE.ExtrudeGeometry(shape, { depth: H, steps: 22, bevelEnabled: false, curveSegments: 3 });
  g.rotateX(-Math.PI / 2); // extrude along +y
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = Math.min(1, Math.max(0, y / H));
    const taper = Math.pow(1 - t, 0.9) * (1 + 0.5 * Math.sin(t * Math.PI) * (1 - t));
    const tw = t * 2.2;
    pos.setXYZ(i, (x * Math.cos(tw) - z * Math.sin(tw)) * taper, y, (x * Math.sin(tw) + z * Math.cos(tw)) * taper);
  }
  g.computeVertexNormals();
  return g;
}

/** Ring of cream kisses around the top edge; each pops on in turn (a.kisses[i].p). */
export function CreamKisses({ a }) {
  const m = materials();
  const geo = useMemo(kissGeometry, []);
  const refs = useRef([]);
  const n = a.kisses.length;

  useFrame(() => {
    a.kisses.forEach((k, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.visible = k.p > 0.001;
      g.scale.setScalar(Math.max(0.001, k.p));
    });
  });

  return (
    <group position={[0, CAKE_TOP + 0.035, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2;
        const r = CAKE_R - 0.12;
        return (
          <mesh key={i} ref={el => { refs.current[i] = el; }} geometry={geo} material={m.cream} visible={false}
            position={[Math.cos(ang) * r, 0, Math.sin(ang) * r]} rotation={[0, ang, 0]} castShadow />
        );
      })}
    </group>
  );
}
