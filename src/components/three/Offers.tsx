"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  frame,
  spinnerKick,
  spinnerSpeedSample,
  toggleEnvelope,
  ui,
} from "@/lib/experience";
import { MODEL_SPECS, modelUrl } from "@/lib/models";
import { AID_POS, HOUR_POS, NDA_POS } from "@/lib/world";
import { damp, normaliseObject } from "./helpers";
import { landedOnUi, setCursor } from "./events";
import { ModelSlot } from "./ModelSlot";

/* ------------------------------------------------------------------ */
/* Rent an hour: frosted hourglass                                      */
/* ------------------------------------------------------------------ */

export function Hourglass() {
  const group = useRef<THREE.Group>(null);
  const top = useRef<THREE.Mesh>(null);
  const bottom = useRef<THREE.Mesh>(null);
  const flip = useRef(0);

  const glassGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const y = -1 + (i / 24) * 2;
      const r = 0.08 + Math.pow(Math.abs(y), 1.3) * 0.62;
      pts.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(pts, 24);
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    // One slow "hour" cycle every 40s, then a gentle flip.
    const cycle = (t % 40) / 40;
    const fill = Math.min(1, cycle / 0.9);
    if (top.current) top.current.scale.set(1 - fill * 0.85, 1 - fill * 0.9, 1 - fill * 0.85);
    if (bottom.current) bottom.current.scale.set(0.15 + fill * 0.85, 0.1 + fill * 0.9, 0.15 + fill * 0.85);
    // Rotation keeps accumulating half-turns so the flip never snaps back.
    const target = Math.floor(t / 40) * Math.PI + (cycle > 0.92 ? Math.PI : 0);
    flip.current = damp(flip.current, target, 1.5, dt);
    if (group.current) {
      group.current.rotation.y = t * 0.12;
      group.current.rotation.z = flip.current;
      group.current.position.y = HOUR_POS[1] + Math.sin(t * 0.4) * 0.08;
    }
  });

  return (
    <group ref={group} position={HOUR_POS} scale={0.95}>
      <mesh geometry={glassGeo}>
        <meshPhysicalMaterial
          color="#d5e0e3"
          roughness={0.2}
          metalness={0}
          clearcoat={1}
          transparent
          opacity={0.32}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={top} position={[0, 0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 0.75, 20]} />
        <meshStandardMaterial color="#c9b98f" roughness={0.9} emissive="#3d3424" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={bottom} position={[0, -0.62, 0]}>
        <coneGeometry args={[0.55, 0.65, 20]} />
        <meshStandardMaterial color="#c9b98f" roughness={0.9} emissive="#3d3424" emissiveIntensity={0.3} />
      </mesh>
      {[1.05, -1.05].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.1, 24]} />
          <meshStandardMaterial color="#383e4e" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {[0, 1, 2].map((k) => {
        const a = (k / 3) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.cos(a) * 0.74, 0, Math.sin(a) * 0.74]}>
            <cylinderGeometry args={[0.03, 0.03, 2.1, 6]} />
            <meshStandardMaterial color="#b6bac5" metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* NDA: sealed envelope                                                 */
/* ------------------------------------------------------------------ */

interface EnvelopeParts {
  flap: THREE.Object3D | null;
  seal: THREE.Object3D | null;
}

function useEnvelopeMotion(
  group: React.RefObject<THREE.Group | null>,
  parts: React.MutableRefObject<EnvelopeParts>,
  letter?: React.RefObject<THREE.Mesh | null>
) {
  const open = useRef(0);
  const hover = useRef(0);
  const hovered = useRef(false);
  useFrame((state, dt) => {
    const isOpen = ui.get().envelopeOpen;
    open.current = damp(open.current, isOpen ? 1 : 0, 1.6, dt);
    hover.current = damp(hover.current, hovered.current ? 1 : 0, 4, dt);
    const o = open.current;
    const t = state.clock.elapsedTime;
    if (parts.current.flap) parts.current.flap.rotation.x = -o * 2.7;
    if (parts.current.seal) {
      const s = Math.max(0.001, 1 - o * 1.2);
      parts.current.seal.scale.setScalar(s);
    }
    if (letter?.current) letter.current.position.y = -0.05 + o * 0.55;
    if (group.current) {
      group.current.position.y = NDA_POS[1] + Math.sin(t * 0.4 + 1) * 0.08 + hover.current * 0.08;
      group.current.rotation.y = -0.35 + Math.sin(t * 0.2) * 0.12;
      group.current.rotation.x = -0.12 + hover.current * 0.05;
    }
  });
  return hovered;
}

function envelopeHandlers(hovered: React.MutableRefObject<boolean>) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (landedOnUi(e)) return;
      e.stopPropagation();
      hovered.current = true;
      setCursor(true);
    },
    onPointerOut: () => {
      hovered.current = false;
      setCursor(false);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (landedOnUi(e)) return;
      e.stopPropagation();
      toggleEnvelope("crystal");
    },
  };
}

function ProceduralEnvelope() {
  const group = useRef<THREE.Group>(null);
  const letter = useRef<THREE.Mesh>(null);
  const parts = useRef<EnvelopeParts>({ flap: null, seal: null });
  const hovered = useEnvelopeMotion(group, parts, letter);
  const flapGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.8, 0);
    s.lineTo(0.8, 0);
    s.lineTo(0, -0.62);
    s.lineTo(-0.8, 0);
    return new THREE.ShapeGeometry(s);
  }, []);
  const paper = "#f1eee6";

  return (
    <group ref={group} position={NDA_POS} {...envelopeHandlers(hovered)}>
      <mesh name="envelope_body">
        <boxGeometry args={[1.6, 1.05, 0.05]} />
        <meshStandardMaterial color={paper} roughness={0.85} emissive="#3b3a35" emissiveIntensity={0.35} />
      </mesh>
      <mesh ref={letter} position={[0, -0.05, -0.005]}>
        <boxGeometry args={[1.42, 0.9, 0.01]} />
        <meshStandardMaterial color="#f4f2ec" roughness={0.9} />
      </mesh>
      <group
        name="envelope_flap"
        position={[0, 0.525, 0.03]}
        ref={(o) => {
          parts.current.flap = o;
        }}
      >
        <mesh geometry={flapGeo}>
          <meshStandardMaterial color="#e4e0d5" roughness={0.85} side={THREE.DoubleSide} emissive="#3b3a35" emissiveIntensity={0.3} />
        </mesh>
        <group
          name="envelope_seal"
          position={[0, -0.56, 0.02]}
          ref={(o) => {
            parts.current.seal = o;
          }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.16, 0.05, 18]} />
            <meshStandardMaterial color="#234a3e" roughness={0.45} metalness={0.1} emissive="#2c5f4f" emissiveIntensity={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function GltfEnvelope() {
  const { scene } = useGLTF(modelUrl("envelope"));
  const group = useRef<THREE.Group>(null);
  const parts = useRef<EnvelopeParts>({ flap: null, seal: null });
  const model = useMemo(() => {
    const m = scene.clone(true);
    normaliseObject(m, MODEL_SPECS.envelope.size);
    return m;
  }, [scene]);
  useEffect(() => {
    parts.current.flap = model.getObjectByName("envelope_flap") ?? null;
    parts.current.seal = model.getObjectByName("envelope_seal") ?? null;
  }, [model]);
  const hovered = useEnvelopeMotion(group, parts);
  return (
    <group ref={group} position={NDA_POS} {...envelopeHandlers(hovered)}>
      <primitive object={model} />
    </group>
  );
}

export function Envelope({ available }: { available: boolean }) {
  return (
    <ModelSlot available={available} fallback={<ProceduralEnvelope />}>
      <GltfEnvelope />
    </ModelSlot>
  );
}

/* ------------------------------------------------------------------ */
/* Grounding aid: fidget spinner (spins on hover, drag to flick)        */
/* ------------------------------------------------------------------ */

function useSpinnerMotion(
  group: React.RefObject<THREE.Group | null>,
  rotor: React.MutableRefObject<THREE.Object3D | null>
) {
  const omega = useRef(0);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.1);
    omega.current += frame.spinImpulse;
    frame.spinImpulse = 0;
    omega.current = Math.max(-40, Math.min(40, omega.current));
    // Long, calm decay.
    omega.current *= Math.exp(-0.32 * d);
    if (rotor.current) rotor.current.rotation.y += omega.current * d;
    spinnerSpeedSample(omega.current);
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = AID_POS[1] + Math.sin(t * 0.45 + 2) * 0.08;
    }
  });
}

function spinnerHandlers() {
  let dragging = false;
  let lastX = 0;
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (landedOnUi(e)) return;
      e.stopPropagation();
      setCursor(true);
      if (e.pointerType === "mouse") spinnerKick(5, "hover");
    },
    onPointerOut: () => setCursor(false),
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (landedOnUi(e)) return;
      e.stopPropagation();
      dragging = true;
      lastX = e.nativeEvent.clientX;
      (e.nativeEvent.target as Element | null)?.setPointerCapture?.(e.pointerId);
      spinnerKick(1.5, "drag");
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (!dragging) return;
      const dx = e.nativeEvent.clientX - lastX;
      lastX = e.nativeEvent.clientX;
      frame.spinImpulse += dx * 0.06;
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      dragging = false;
      (e.nativeEvent.target as Element | null)?.releasePointerCapture?.(e.pointerId);
    },
  };
}

function ProceduralSpinner() {
  const group = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Object3D | null>(null);
  useSpinnerMotion(group, rotor);
  const handlers = useMemo(() => spinnerHandlers(), []);

  return (
    <group ref={group} position={AID_POS} rotation={[1.05, 0.3, 0]} {...handlers}>
      <group
        name="spinner_rotor"
        ref={(o) => {
          rotor.current = o;
        }}
      >
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 0.16, 24]} />
          <meshStandardMaterial color="#2c5f4f" metalness={0.45} roughness={0.35} />
        </mesh>
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI * 2;
          const x = Math.cos(a) * 0.62;
          const z = Math.sin(a) * 0.62;
          return (
            <group key={k}>
              <mesh position={[x * 0.5, 0, z * 0.5]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.55, 0.14, 0.26]} />
                <meshStandardMaterial color="#2c5f4f" metalness={0.45} roughness={0.35} />
              </mesh>
              <mesh position={[x, 0, z]}>
                <torusGeometry args={[0.24, 0.07, 10, 28]} />
                <meshStandardMaterial color="#2c5f4f" metalness={0.45} roughness={0.35} />
              </mesh>
              <mesh position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.17, 0.17, 0.12, 20]} />
                <meshStandardMaterial color="#b6bac5" metalness={0.9} roughness={0.22} />
              </mesh>
            </group>
          );
        })}
      </group>
      <mesh name="spinner_core">
        <cylinderGeometry args={[0.15, 0.15, 0.22, 20]} />
        <meshStandardMaterial color="#d6dade" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function GltfSpinner() {
  const { scene } = useGLTF(modelUrl("spinner"));
  const group = useRef<THREE.Group>(null);
  const rotor = useRef<THREE.Object3D | null>(null);
  const model = useMemo(() => {
    const m = scene.clone(true);
    normaliseObject(m, MODEL_SPECS.spinner.size);
    return m;
  }, [scene]);
  useEffect(() => {
    rotor.current = model.getObjectByName("spinner_rotor") ?? model;
  }, [model]);
  useSpinnerMotion(group, rotor);
  const handlers = useMemo(() => spinnerHandlers(), []);
  return (
    <group ref={group} position={AID_POS} rotation={[1.05, 0.3, 0]} {...handlers}>
      <primitive object={model} />
    </group>
  );
}

export function Spinner({ available }: { available: boolean }) {
  return (
    <ModelSlot available={available} fallback={<ProceduralSpinner />}>
      <GltfSpinner />
    </ModelSlot>
  );
}
