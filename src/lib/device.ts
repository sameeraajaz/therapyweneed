"use client";

export type Tier = "high" | "mid" | "low";

export interface Capabilities {
  webgl: boolean;
  tier: Tier;
  reducedMotion: boolean;
  small: boolean;
  touch: boolean;
}

export interface TierSettings {
  dpr: [number, number];
  particles: number;
  dust: number;
  debris: number;
  /** Use MeshTransmissionMaterial (refraction + chromatic aberration). */
  transmission: boolean;
  envResolution: number;
  antialias: boolean;
  parallax: boolean;
}

export const TIER_SETTINGS: Record<Tier, TierSettings> = {
  high: {
    dpr: [1, 1.75],
    particles: 7000,
    dust: 900,
    debris: 22,
    transmission: true,
    envResolution: 128,
    antialias: true,
    parallax: true,
  },
  mid: {
    dpr: [1, 1.5],
    particles: 3200,
    dust: 420,
    debris: 12,
    transmission: false,
    envResolution: 64,
    antialias: true,
    parallax: true,
  },
  low: {
    dpr: [0.75, 1.25],
    particles: 1400,
    dust: 160,
    debris: 6,
    transmission: false,
    envResolution: 32,
    antialias: false,
    parallax: false,
  },
};

const WEAK_GPU =
  /swiftshader|llvmpipe|software|basic render|mali-[t4]|mali-g(31|51|52|57|68)|adreno[^\d]*(3|4|5)\d\d|adreno[^\d]*6[01]\d|powervr|intel\(r\) hd graphics( [2-5]\d{2,3})?$/i;

function readRenderer(): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return { ok: false, renderer: "" };
    let renderer = "";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
    if (!renderer) renderer = String(gl.getParameter(gl.RENDERER) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { ok: true, renderer };
  } catch {
    return { ok: false, renderer: "" };
  }
}

export function detectCapabilities(): Capabilities {
  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600 || window.innerWidth < 820;
  const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const { ok, renderer } = readRenderer();

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;

  let tier: Tier = "high";
  if (!ok || WEAK_GPU.test(renderer) || cores <= 2 || memory <= 2) tier = "low";
  else if (small || touch || cores <= 4 || memory <= 4) tier = "mid";

  // Manual override for testing: ?quality=low|mid|high
  const q = new URLSearchParams(window.location.search).get("quality");
  if (q === "low" || q === "mid" || q === "high") tier = q;

  return { webgl: ok, tier, reducedMotion, small, touch };
}

export function viewportBucket(): "sm" | "md" | "lg" {
  const w = window.innerWidth;
  return w < 640 ? "sm" : w < 1100 ? "md" : "lg";
}
