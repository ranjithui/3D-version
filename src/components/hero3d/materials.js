import * as THREE from 'three';
import { PALETTE, rng } from './dims';

/*
 * Procedural textures and shared PBR materials. Textures are painted on a canvas once and
 * cached, so the hero downloads no image or model files.
 */

const cache = {};

function canvasTexture(w, h, paint, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Porous chocolate sponge crumb: air pockets, darker cocoa flecks and lighter crumbs. */
export function spongeTexture() {
  return (cache.sponge ||= canvasTexture(512, 256, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#4c2716';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) {
      const x = r() * w, y = r() * h, rad = 0.6 + r() * r() * 3.4;
      g.fillStyle = `rgba(${18 + (r() * 22) | 0},${8 + (r() * 8) | 0},4,${0.35 + r() * 0.5})`;
      g.beginPath(); g.ellipse(x, y, rad * 1.3, rad, r() * 3, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 2400; i++) {
      g.fillStyle = `rgba(128,74,42,${0.12 + r() * 0.3})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6);
    }
  }, { repeat: [3, 1] }));
}

/** Inside of a halved strawberry: red rim, pale core and white veins. */
export function strawberryCutTexture() {
  return (cache.cut ||= canvasTexture(256, 256, (g, s) => {
    g.fillStyle = '#c0142f';
    g.fillRect(0, 0, s, s);
    const grd = g.createRadialGradient(s / 2, s * 0.56, s * 0.04, s / 2, s * 0.52, s * 0.42);
    grd.addColorStop(0, '#fff3ef');
    grd.addColorStop(0.45, '#f7bcc2');
    grd.addColorStop(0.82, '#e04a5e');
    grd.addColorStop(1, 'rgba(192,20,47,0)');
    g.fillStyle = grd;
    g.beginPath(); g.ellipse(s / 2, s * 0.52, s * 0.34, s * 0.42, 0, 0, Math.PI * 2); g.fill();
    const r = rng(3);
    g.strokeStyle = 'rgba(255,242,238,.55)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + r() * 0.2;
      g.beginPath();
      g.moveTo(s / 2, s * 0.55);
      g.quadraticCurveTo(s / 2 + Math.cos(a) * s * 0.14, s * 0.55 + Math.sin(a) * s * 0.2, s / 2 + Math.cos(a) * s * 0.3, s * 0.52 + Math.sin(a) * s * 0.38);
      g.stroke();
    }
    g.fillStyle = 'rgba(240,206,110,.9)';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      g.beginPath(); g.ellipse(s / 2 + Math.cos(a) * s * 0.33, s * 0.52 + Math.sin(a) * s * 0.41, 2, 3, a, 0, Math.PI * 2); g.fill();
    }
  }));
}

/* ---------- Shared materials (created once, reused by every mesh) ---------- */

export function materials() {
  if (cache.mats) return cache.mats;
  const sponge = spongeTexture();
  cache.mats = {
    gold: new THREE.MeshPhysicalMaterial({ color: PALETTE.gold, metalness: 1, roughness: 0.24, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    goldLeaf: new THREE.MeshStandardMaterial({ color: '#e0b469', metalness: 1, roughness: 0.22, side: THREE.DoubleSide }),
    // Confetti glows a little so it reads against the dark backdrop (pure metal looks black there).
    confetti: new THREE.MeshStandardMaterial({ color: '#e8bf74', metalness: 0.55, roughness: 0.3, emissive: new THREE.Color('#C99A52'), emissiveIntensity: 0.9, side: THREE.DoubleSide }),
    board: new THREE.MeshStandardMaterial({ color: '#b89a72', roughness: 0.82 }),
    sponge: new THREE.MeshStandardMaterial({ map: sponge, bumpMap: sponge, bumpScale: 2.5, roughness: 0.93 }),
    chocCream: new THREE.MeshPhysicalMaterial({ color: PALETTE.milkChoc, roughness: 0.4, sheen: 1, sheenColor: new THREE.Color('#b9835a'), sheenRoughness: 0.45, clearcoat: 0.25 }),
    cream: new THREE.MeshPhysicalMaterial({ color: PALETTE.cream, roughness: 0.48, sheen: 0.8, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5 }),
    ganache: new THREE.MeshPhysicalMaterial({ color: PALETTE.ganache, roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06 }),
    darkChoc: new THREE.MeshPhysicalMaterial({ color: '#2b140b', roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    milkChoc: new THREE.MeshPhysicalMaterial({ color: '#7a4428', roughness: 0.34, clearcoat: 0.4, clearcoatRoughness: 0.25 }),
    berry: new THREE.MeshPhysicalMaterial({ color: PALETTE.berry, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.35, sheenColor: new THREE.Color('#ff7a88') }),
    berryCut: new THREE.MeshStandardMaterial({ map: strawberryCutTexture(), roughness: 0.42, side: THREE.DoubleSide }),
    seed: new THREE.MeshStandardMaterial({ color: '#e8c66a', roughness: 0.4 }),
    leafGreen: new THREE.MeshStandardMaterial({ color: '#3f6b2a', roughness: 0.55, side: THREE.DoubleSide }),
  };
  return cache.mats;
}
