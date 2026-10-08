"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { frame } from "@/lib/experience";
import { MODEL_SPECS, modelUrl } from "@/lib/models";
import { SATELLITE_POS } from "@/lib/world";
import { easeInOutCubic, findPieces, getPanelTexture, normaliseObject, seeded } from "./helpers";
import { ModelSlot } from "./ModelSlot";

interface PieceAnim {
  obj: THREE.Object3D;
  homePos: THREE.Vector3;
  homeQuat: THREE.Quaternion;
  farPos: THREE.Vector3;
  farQuat: THREE.Quaternion;
  delay: number;
  phase: number;
}

/** Captures each piece's assembled transform and builds a scattered "drifting apart" transform. */
function buildAnims(pieces: THREE.Object3D[], spread: number): PieceAnim[] {
  const rand = seeded(7);
  return pieces.map((obj, i) => {
    const homePos = obj.position.clone();
    const homeQuat = obj.quaternion.clone();
    const dir = homePos.clone();
    if (dir.lengthSq() < 0.01) dir.set(rand() - 0.5, rand() - 0.5, rand() * 0.5 + 0.2);
    dir.normalize();
    // Nudge sideways so pieces don't all fly on the same axis.
    dir.add(new THREE.Vector3(rand() - 0.5, (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8)).normalize();
    const farPos = homePos.clone().add(dir.multiplyScalar(spread * (0.7 + rand() * 0.6)));
    const farQuat = homeQuat
      .clone()
      .multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rand() - 0.5) * 2.4, (rand() - 0.5) * 2.4, (rand() - 0.5) * 2.4)
        )
      );
    return {
      obj,
      homePos,
      homeQuat,
      farPos,
      farQuat,
      delay: (i / Math.max(1, pieces.length - 1)) * 0.35,
      phase: rand() * Math.PI * 2,
    };
  });
}

/** Shared scroll-driven reassembly: pieces drift apart, then slowly find each other. */
function useAssembly(
  root: React.RefObject<THREE.Group | null>,
  anims: PieceAnim[],
  onPower?: (a: number) => void
) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = frame.assembly;
    for (const p of anims) {
      const local = easeInOutCubic(Math.max(0, Math.min(1, (a - p.delay) / (1 - 0.35))));
      const drift = (1 - local) * 0.18;
      p.obj.position.lerpVectors(p.farPos, p.homePos, local);
      p.obj.position.x += Math.sin(t * 0.35 + p.phase) * drift;
      p.obj.position.y += Math.cos(t * 0.3 + p.phase) * drift;
      p.obj.quaternion.slerpQuaternions(p.farQuat, p.homeQuat, local);
    }
    if (root.current) {
      root.current.rotation.y = t * 0.06 + (1 - a) * 0.6;
      root.current.rotation.z = Math.sin(t * 0.2) * 0.05;
      root.current.position.y = SATELLITE_POS[1] + Math.sin(t * 0.4) * 0.08;
    }
    onPower?.(a);
  });
}

/* ------------------------------------------------------------------ */
/* Procedural placeholder (8 named pieces, same names as the .glb)     */
/* ------------------------------------------------------------------ */

function ProceduralSatellite() {
  const root = useRef<THREE.Group>(null);
  const refs = useRef<Record<string, THREE.Object3D | null>>({});
  const [anims, setAnims] = useState<PieceAnim[]>([]);

  const mats = useMemo(() => {
    const panelTex = getPanelTexture();
    return {
      body: new THREE.MeshStandardMaterial({ color: "#8d96a3", metalness: 0.7, roughness: 0.32, flatShading: true }),
      foil: new THREE.MeshStandardMaterial({ color: "#b9a77c", metalness: 0.85, roughness: 0.38, flatShading: true }),
      panel: new THREE.MeshStandardMaterial({
        map: panelTex,
        color: "#ffffff",
        metalness: 0.45,
        roughness: 0.28,
        emissive: new THREE.Color("#2c5f4f"),
        emissiveIntensity: 0.05,
      }),
      frame: new THREE.MeshStandardMaterial({ color: "#b6bac5", metalness: 0.8, roughness: 0.3 }),
      dish: new THREE.MeshStandardMaterial({ color: "#d9dde3", metalness: 0.4, roughness: 0.35, side: THREE.DoubleSide }),
      tip: new THREE.MeshStandardMaterial({ color: "#8fd1b8", emissive: new THREE.Color("#4f9c85"), emissiveIntensity: 0.4 }),
    };
  }, []);

  useLayoutEffect(() => {
    const names = MODEL_SPECS.satellite.pieces;
    const pieces = names.map((n) => refs.current[n]).filter(Boolean) as THREE.Object3D[];
    setAnims(buildAnims(pieces, 3.2));
  }, []);

  useAssembly(root, anims, (a) => {
    mats.panel.emissiveIntensity = 0.05 + a * a * 0.55;
    mats.tip.emissiveIntensity = 0.3 + a * 1.4;
  });

  const set = (name: string) => (o: THREE.Object3D | null) => {
    refs.current[name] = o;
  };

  return (
    <group ref={root} position={SATELLITE_POS}>
      <group name="body" ref={set("body")}>
        <mesh material={mats.body}>
          <cylinderGeometry args={[0.45, 0.45, 1.1, 8]} />
        </mesh>
        <mesh material={mats.foil} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.47, 0.47, 0.42, 8]} />
        </mesh>
      </group>
      <group name="arm_left" ref={set("arm_left")} position={[-0.72, 0, 0]}>
        <mesh material={mats.frame} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.55, 6]} />
        </mesh>
      </group>
      <group name="arm_right" ref={set("arm_right")} position={[0.72, 0, 0]}>
        <mesh material={mats.frame} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.55, 6]} />
        </mesh>
      </group>
      <group name="panel_left" ref={set("panel_left")} position={[-1.95, 0, 0]}>
        <mesh material={mats.panel}>
          <boxGeometry args={[2, 0.035, 0.85]} />
        </mesh>
        <mesh material={mats.frame} position={[0, 0, 0]}>
          <boxGeometry args={[2.04, 0.02, 0.06]} />
        </mesh>
      </group>
      <group name="panel_right" ref={set("panel_right")} position={[1.95, 0, 0]}>
        <mesh material={mats.panel}>
          <boxGeometry args={[2, 0.035, 0.85]} />
        </mesh>
        <mesh material={mats.frame}>
          <boxGeometry args={[2.04, 0.02, 0.06]} />
        </mesh>
      </group>
      <group name="dish" ref={set("dish")} position={[0, 0.78, 0.1]} rotation={[-0.5, 0, 0]}>
        <mesh material={mats.dish} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.55, 20, 8, 0, Math.PI * 2, 0, 0.9]} />
        </mesh>
        <mesh material={mats.frame} position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.35, 6]} />
        </mesh>
      </group>
      <group name="antenna" ref={set("antenna")} position={[0.22, -0.55, 0.3]} rotation={[0.6, 0, -0.4]}>
        <mesh material={mats.frame} position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.7, 5]} />
        </mesh>
        <mesh material={mats.tip} position={[0, -0.72, 0]}>
          <sphereGeometry args={[0.05, 10, 8]} />
        </mesh>
      </group>
      <group name="thruster" ref={set("thruster")} position={[0, -0.72, 0]}>
        <mesh material={mats.body}>
          <coneGeometry args={[0.24, 0.32, 10, 1, true]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* .glb version: /public/models/satellite.glb                          */
/* ------------------------------------------------------------------ */

function GltfSatellite() {
  const { scene } = useGLTF(modelUrl("satellite"));
  const root = useRef<THREE.Group>(null);
  const { model, anims } = useMemo(() => {
    const model = scene.clone(true);
    normaliseObject(model, MODEL_SPECS.satellite.size);
    const pieces = findPieces(model, MODEL_SPECS.satellite.pieces);
    // Spread relative to normalised size.
    return { model, anims: buildAnims(pieces, 3.2 / Math.max(model.scale.x, 1e-3)) };
  }, [scene]);

  useAssembly(root, anims);

  return (
    <group ref={root} position={SATELLITE_POS}>
      <primitive object={model} />
    </group>
  );
}

export function Satellite({ available }: { available: boolean }) {
  return (
    <ModelSlot available={available} fallback={<ProceduralSatellite />}>
      <GltfSatellite />
    </ModelSlot>
  );
}
