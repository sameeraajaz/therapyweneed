"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { frame, ui, type FinaleShape } from "@/lib/experience";
import { FINALE_POS } from "@/lib/world";
import { cloudShape, envelopeShape, handShape, spinnerShape } from "./shapes";
import { seeded } from "./helpers";

const vertex = /* glsl */ `
  attribute float aRand;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vRand;
  varying float vDepth;
  void main() {
    vRand = aRand;
    vec3 p = position;
    p.x += sin(uTime * 0.6 + aRand * 40.0) * 0.025;
    p.y += cos(uTime * 0.5 + aRand * 30.0) * 0.025;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aRand * 0.9) * (10.0 / max(1.0, -mv.z));
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vRand;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    vec3 col = mix(uColorA, uColorB, vRand);
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

export function makePointsMaterial(opts: {
  size: number;
  colorA: string;
  colorB: string;
  opacity: number;
  pixelRatio: number;
}) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: opts.size },
      uPixelRatio: { value: opts.pixelRatio },
      uColorA: { value: new THREE.Color(opts.colorA) },
      uColorB: { value: new THREE.Color(opts.colorB) },
      uOpacity: { value: opts.opacity },
    },
  });
}

const AUTO_SEQUENCE: FinaleShape[] = ["hand", "envelope", "spinner", "cloud"];

/**
 * Reach-out finale: a field of points that gathers into a hand, the envelope
 * or the spinner depending on which CTA is hovered/focused. On touch devices
 * (no hover) it slowly cycles through the shapes on its own.
 */
export function ParticleFinale({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const group = useRef<THREE.Group>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const { geometry, targets, speeds, material } = useMemo(() => {
    const targets: Record<FinaleShape, Float32Array> = {
      cloud: cloudShape(count),
      hand: handShape(count),
      envelope: envelopeShape(count),
      spinner: spinnerShape(count),
    };
    const rnd = seeded(count + 11);
    const pos = new Float32Array(targets.cloud);
    const rand = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      rand[i] = rnd();
      speeds[i] = 0.6 + rnd() * 1.4;
    }
    // Shuffle shape targets so points travel organically instead of in bands.
    (["hand", "envelope", "spinner"] as FinaleShape[]).forEach((k) => {
      const arr = targets[k];
      for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        for (let c = 0; c < 3; c++) {
          const tmp = arr[i * 3 + c];
          arr[i * 3 + c] = arr[j * 3 + c];
          arr[j * 3 + c] = tmp;
        }
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);
    const material = makePointsMaterial({
      size: 3.4,
      colorA: "#9fe0c6",
      colorB: "#c9ccd6",
      opacity: 1,
      pixelRatio: 1,
    });
    return { geometry, targets, speeds, material };
  }, [count]);

  useEffect(() => {
    material.uniforms.uPixelRatio.value = dpr;
  }, [dpr, material]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const auto = useRef({ idx: 3, since: 0 });
  const rot = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;

    // Only simulate when the camera is in the finale neighbourhood.
    const near = state.camera.position.z < FINALE_POS[2] + 40;
    if (points.current) points.current.visible = near;
    if (!near) return;

    let shape = ui.get().finaleShape;
    if (shape === "cloud") {
      auto.current.since += dt;
      if (auto.current.since > 4.5) {
        auto.current.since = 0;
        auto.current.idx = (auto.current.idx + 1) % AUTO_SEQUENCE.length;
      }
      shape = AUTO_SEQUENCE[auto.current.idx];
    } else {
      auto.current.since = 0;
      auto.current.idx = 3;
    }

    const target = targets[shape];
    const pos = geometry.attributes.position.array as Float32Array;
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 1.6);
    for (let i = 0; i < count; i++) {
      const s = k * speeds[i];
      const o = i * 3;
      pos[o] += (target[o] - pos[o]) * s;
      pos[o + 1] += (target[o + 1] - pos[o + 1]) * s;
      pos[o + 2] += (target[o + 2] - pos[o + 2]) * s;
    }
    geometry.attributes.position.needsUpdate = true;

    rot.current.y += (frame.pointer.x * 0.25 - rot.current.y) * k;
    rot.current.x += (-frame.pointer.y * 0.15 - rot.current.x) * k;
    if (group.current) {
      group.current.rotation.y = rot.current.y + (shape === "cloud" ? t * 0.05 : 0);
      group.current.rotation.x = rot.current.x;
    }
  });

  return (
    <group ref={group} position={FINALE_POS}>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
