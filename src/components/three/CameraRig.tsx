"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/experience";
import { STOPS } from "@/lib/world";
import { damp, smoothstep } from "./helpers";

/**
 * Map raw scroll progress → a float stop index, easing within each segment
 * so the camera settles (zero velocity) at every stop.
 */
function progressToStop(p: number, stops: number[]): number {
  const n = STOPS.length;
  if (stops.length !== n) return p * (n - 1);
  if (p <= stops[0]) return 0;
  for (let i = 0; i < n - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (p <= b) {
      const f = b > a ? (p - a) / (b - a) : 1;
      return i + smoothstep(0, 1, f);
    }
  }
  return n - 1;
}

export function CameraRig({ parallax }: { parallax: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const u = useRef(0);
  const look = useRef(new THREE.Vector3(...STOPS[0].focus));
  const ptr = useRef({ x: 0, y: 0 });

  const { camCurve, lookCurve, distMul } = useMemo(() => {
    const fov = THREE.MathUtils.degToRad(camera.fov || 45);
    const portrait = aspect < 0.9;
    // Narrow screens: pull the camera back so objects fit the width.
    const distMul = portrait ? Math.min(1.8, Math.max(1, 0.75 / aspect)) : 1;
    const camPts: THREE.Vector3[] = [];
    const lookPts: THREE.Vector3[] = [];
    STOPS.forEach((s, i) => {
      const focus = new THREE.Vector3(...s.focus);
      const dist = s.dist * distMul;
      const halfH = dist * Math.tan(fov / 2);
      const halfW = halfH * aspect;
      const shift = new THREE.Vector3();
      if (portrait) {
        // Text sits in the lower half on phones → object rides higher.
        shift.y = -0.3 * halfH;
      } else if (s.side === "left") {
        shift.x = -0.4 * halfW;
      } else if (s.side === "right") {
        shift.x = 0.4 * halfW;
      }
      const target = focus.clone().add(shift);
      // Slight angle variety per stop so the drift feels like orbiting, not a dolly.
      const dir = new THREE.Vector3(Math.sin(i * 0.9) * 0.22, 0.08, 1).normalize();
      camPts.push(target.clone().add(dir.multiplyScalar(dist)));
      lookPts.push(target);
    });
    return {
      camCurve: new THREE.CatmullRomCurve3(camPts, false, "centripetal"),
      lookCurve: new THREE.CatmullRomCurve3(lookPts, false, "centripetal"),
      distMul,
    };
  }, [aspect, camera.fov]);

  // Fog scales with camera distance so far stops stay hidden on every screen.
  useEffect(() => {
    const fog = scene.fog as THREE.Fog | null;
    if (fog && "near" in fog) {
      fog.near = 9 * distMul;
      fog.far = 30 * distMul;
    }
  }, [scene, distMul]);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const target = progressToStop(frame.progress, frame.stops);
    // Slow, calm follow. Never jumps, even on fast flicks.
    u.current = damp(u.current, target, 1.6, dt);
    const t = u.current / (STOPS.length - 1);

    camCurve.getPoint(Math.min(1, Math.max(0, t)), camera.position);
    lookCurve.getPoint(Math.min(1, Math.max(0, t)), tmp);
    look.current.lerp(tmp, 1 - Math.exp(-Math.min(dt, 0.1) * 4));

    if (parallax) {
      ptr.current.x = damp(ptr.current.x, frame.pointer.x, 2, dt);
      ptr.current.y = damp(ptr.current.y, frame.pointer.y, 2, dt);
      camera.position.x += ptr.current.x * 0.22;
      camera.position.y += ptr.current.y * 0.14;
    }
    // Breathing: a very slow vertical sway (~25s cycle).
    camera.position.y += Math.sin(state.clock.elapsedTime * 0.25) * 0.05;
    camera.lookAt(look.current);

    // Satellite reassembly follows the hero → steady segment, damped.
    const a = Math.min(1, Math.max(0, target));
    frame.assembly = damp(frame.assembly, a, 1.4, dt);
  });

  return null;
}
