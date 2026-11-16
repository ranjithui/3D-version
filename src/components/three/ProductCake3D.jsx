import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { C, Cherry, Drips, Rosettes } from './cakeParts';

/*
 * Live 3D preview for the cake detail page. It reacts to the order options:
 *  - weight   → cake size (and a second tier from 3 kg),
 *  - flavour  → frosting / glaze colours,
 *  - message  → piped onto the top in the site's script font.
 * It is a stylised preview, not the exact design in the product photos.
 */

/** Frosting palette picked from keywords in the flavour (or cake) name. */
const PALETTES = [
  [/black forest|choco|truffle|brownie|kitkat|oreo|ferrero|nutella|coffee|mocha/i, { frost: '#5a2e17', glaze: C.ganache, rosette: C.cream, top: '#4a2614', ink: '#f6ead6' }],
  [/butterscotch|caramel|honey|almond|kaju|dry fruit|praline/i, { frost: '#e9c48e', glaze: C.caramel, rosette: '#fff3df', top: '#f1d5a8' }],
  [/strawberry|rasmalai|gulab|rose|pink|lychee/i, { frost: '#f6c9d3', glaze: '#d9506c', rosette: '#fff', top: '#f9dbe2' }],
  [/blueberry|blackcurrant|grape/i, { frost: '#c9b7e3', glaze: '#5b3f8c', rosette: '#fff', top: '#ddd0f0' }],
  [/pineapple|mango|lemon|orange|passion/i, { frost: '#f8e3a1', glaze: '#f0b429', rosette: '#fff', top: '#fbecbd' }],
  [/red velvet/i, { frost: '#f4ece1', glaze: '#a3162c', rosette: '#fff', top: '#f6efe6' }],
  [/pista|matcha|kiwi/i, { frost: '#cfe3b5', glaze: '#7c9a4f', rosette: '#fff', top: '#e0eecd' }],
];
const DEFAULT_PALETTE = { frost: '#f6ead6', glaze: C.caramel, rosette: '#fff', top: '#faf1e2' };

export function paletteFor(...names) {
  const text = names.filter(Boolean).join(' ');
  return PALETTES.find(([re]) => re.test(text))?.[1] || DEFAULT_PALETTE;
}

/** Cake-top texture: frosting colour with the message written in Dancing Script. */
function useTopTexture(message, top, ink) {
  const [fontReady, setFontReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts?.load('700 64px "Dancing Script"').then(() => live && setFontReady(true)).catch(() => {});
    return () => { live = false; };
  }, []);

  const texture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, size, size);
    // Soft swirl so the top doesn't look flat.
    const g = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,.18)');
    g.addColorStop(1, 'rgba(0,0,0,.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const text = message.trim();
    if (text) {
      // Wrap into at most two lines, then shrink the font until the longest line fits.
      const words = text.split(/\s+/);
      let lines = [text];
      if (text.length > 14 && words.length > 1) {
        const mid = Math.ceil(text.length / 2);
        let best = 1, bestD = Infinity, n = 0;
        words.forEach((w, i) => { n += w.length + 1; if (i < words.length - 1 && Math.abs(n - mid) < bestD) { bestD = Math.abs(n - mid); best = i + 1; } });
        lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
      }
      let px = 150;
      const family = fontReady ? '"Dancing Script", cursive' : 'cursive';
      ctx.font = `700 ${px}px ${family}`;
      while (px > 40 && Math.max(...lines.map(l => ctx.measureText(l).width)) > size * 0.7) {
        px -= 6; ctx.font = `700 ${px}px ${family}`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lh = px * 1.05;
      const y0 = size / 2 - ((lines.length - 1) * lh) / 2 + size * 0.04;
      lines.forEach((l, i) => {
        // Piped icing look: dark outline, then a lighter highlight.
        ctx.lineJoin = 'round';
        ctx.lineWidth = px * 0.1;
        ctx.strokeStyle = 'rgba(0,0,0,.18)';
        ctx.strokeText(l, size / 2, y0 + i * lh + 4);
        ctx.fillStyle = ink;
        ctx.fillText(l, size / 2, y0 + i * lh);
      });
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [message, top, ink, fontReady]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function TierBody({ radius, height, frost, glaze, rosette, topMap }) { // eslint-disable-line react/prop-types
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 72]} />
        <meshStandardMaterial color={frost} roughness={0.6} />
      </mesh>
      {/* Top disc carries the message texture; a separate mesh so the sides stay plain. */}
      <mesh position={[0, height / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 72]} />
        <meshStandardMaterial map={topMap} color={topMap ? '#fff' : frost} roughness={0.45} />
      </mesh>
      <Drips radius={radius + 0.01} y={height / 2 - 0.01} color={glaze} count={Math.round(radius * 22)} />
      <Rosettes radius={radius - 0.09} y={height / 2 + 0.06} count={Math.round(radius * 16)} color={rosette} size={0.08} />
      <mesh position={[0, -height / 2 + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius + 0.01, 0.03, 12, 90]} />
        <meshStandardMaterial color={rosette} roughness={0.6} />
      </mesh>
    </group>
  );
}

function PreviewCake({ weight, palette, message }) {
  const topMap = useTopTexture(message, palette.top, palette.ink || palette.glaze);
  // Radius grows with the cube root of weight (volume), from ~1.0 at 0.5 kg.
  const base = Math.min(1.55, 0.95 * Math.cbrt(weight / 0.5));
  const tiers = weight >= 3 ? 2 : 1;
  const h = 0.62;
  const scale = useRef(1);
  const group = useRef();
  const lastWeight = useRef(weight);

  // Little "pop" when the weight changes.
  useFrame((_, dt) => {
    if (lastWeight.current !== weight) { scale.current = 0.9; lastWeight.current = weight; }
    if (group.current) {
      scale.current += (1 - scale.current) * (1 - Math.exp(-8 * dt));
      group.current.scale.setScalar(scale.current);
    }
  });

  const topR = base * 0.62;
  const bottomY = -0.75 + h / 2;
  const topY = tiers === 2 ? bottomY + h + (h * 0.9) / 2 : bottomY + h / 2;
  return (
    <group ref={group}>
      {/* Board */}
      <mesh position={[0, -0.78, 0]} receiveShadow>
        <cylinderGeometry args={[base + 0.3, base + 0.3, 0.05, 72]} />
        <meshStandardMaterial color={C.gold} metalness={0.85} roughness={0.3} />
      </mesh>
      <group position={[0, bottomY, 0]}>
        <TierBody radius={base} height={h} {...palette} topMap={tiers === 1 ? topMap : null} />
      </group>
      {tiers === 2 && (
        <group position={[0, bottomY + h, 0]}>
          <TierBody radius={topR} height={h * 0.9} {...palette} topMap={topMap} />
        </group>
      )}
      {!message.trim() && (
        <>
          <Cherry position={[0.15, topY + 0.12, 0.1]} />
          <Cherry position={[-0.2, topY + 0.12, -0.05]} />
        </>
      )}
    </group>
  );
}

export default function ProductCake3D({ weight, flavourName, cakeName, message, onReady }) {
  const palette = paletteFor(flavourName, cakeName);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.9, 5.6], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={() => onReady?.()}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 3]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={128} environmentIntensity={0.6}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[6, 2, 1]} color="#fff3e0" />
        <Lightformer form="rect" intensity={1.4} position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} color="#ffd9a8" />
      </Environment>
      <PreviewCake weight={weight} palette={palette} message={message} />
      <ContactShadows position={[0, -0.81, 0]} opacity={0.45} scale={6} blur={2.4} far={2} color="#3a2412" />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={1.2}
        target={[0, -0.2, 0]}
      />
    </Canvas>
  );
}
