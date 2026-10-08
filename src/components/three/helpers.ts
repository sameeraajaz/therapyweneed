import * as THREE from "three";

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, Math.min(dt, 0.1));
}

export function smoothstep(a: number, b: number, x: number): number {
  if (a === b) return x >= b ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

let glowTex: THREE.Texture | null = null;
/** Shared soft radial glow sprite texture (generated, no network). */
export function getGlowTexture(): THREE.Texture {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(0.6, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

let panelTex: THREE.Texture | null = null;
/** Solar-panel cell grid texture (generated). */
export function getPanelTexture(): THREE.Texture {
  if (panelTex) return panelTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#1b3138";
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = "rgba(182,186,197,0.35)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  for (let y = 0; y <= 128; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  panelTex = new THREE.CanvasTexture(c);
  panelTex.colorSpace = THREE.SRGBColorSpace;
  return panelTex;
}

/** Seeded PRNG for stable procedural variation. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Normalise an imported model: centre it and scale its largest dimension to `size`.
 * Returns the scale applied.
 */
export function normaliseObject(obj: THREE.Object3D, size: number): number {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const dims = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const max = Math.max(dims.x, dims.y, dims.z) || 1;
  const s = size / max;
  obj.scale.multiplyScalar(s);
  obj.position.sub(center.multiplyScalar(s));
  return s;
}

/** Find named pieces; if none match, fall back to the top-level children. */
export function findPieces(root: THREE.Object3D, names: string[]): THREE.Object3D[] {
  const found = names
    .map((n) => root.getObjectByName(n))
    .filter((o): o is THREE.Object3D => Boolean(o));
  if (found.length > 0) return found;
  let node: THREE.Object3D = root;
  while (node.children.length === 1) node = node.children[0];
  return node.children.length > 0 ? [...node.children] : [root];
}
