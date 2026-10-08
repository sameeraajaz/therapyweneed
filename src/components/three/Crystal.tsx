"use client";

import { MeshTransmissionMaterial, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  hoverQuestionEnd,
  hoverQuestionStart,
  toggleQuestion,
  ui,
} from "@/lib/experience";
import { MODEL_SPECS, modelUrl } from "@/lib/models";
import { QUESTIONS } from "@/lib/questions";
import type { QuestionItem } from "@/lib/types";
import { questionPosition } from "@/lib/world";
import { damp, getGlowTexture, normaliseObject, seeded } from "./helpers";
import { landedOnUi, setCursor } from "./events";
import { ModelSlot } from "./ModelSlot";

/** Low-poly crystal: a jittered, elongated icosahedron with flat facets. */
function crystalGeometry(seed: number): THREE.BufferGeometry {
  const rand = seeded(seed * 31 + 5);
  const g = new THREE.IcosahedronGeometry(1, 0); // already non-indexed (flat facets)
  const pos = g.attributes.position as THREE.BufferAttribute;
  // Jitter shared vertices consistently (key by rounded original position).
  const offsets = new Map<string, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!offsets.has(key)) offsets.set(key, [(rand() - 0.5) * 0.22, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.22]);
    const o = offsets.get(key)!;
    pos.setXYZ(i, (x + o[0]) * 0.72, (y + o[1]) * 1.2, (z + o[2]) * 0.72);
  }
  g.computeVertexNormals();
  return g;
}

type IntensityRef = React.MutableRefObject<number>;

const SHARDS = 14;

function ProceduralCore({ intensity, index }: { intensity: IntensityRef; index: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2c5f4f",
        emissive: new THREE.Color(index % 2 ? "#5fae94" : "#7fb8a4"),
        emissiveIntensity: 0.2,
        roughness: 0.35,
        metalness: 0.2,
        flatShading: true,
      }),
    [index]
  );
  useFrame(() => {
    mat.emissiveIntensity = 0.15 + intensity.current * 1.6;
  });
  return (
    <mesh material={mat} scale={0.3}>
      <dodecahedronGeometry args={[1, 0]} />
    </mesh>
  );
}

function GltfCore({ intensity, index }: { intensity: IntensityRef; index: number }) {
  const { scene } = useGLTF(modelUrl("stone"));
  const { obj, mats } = useMemo(() => {
    const named = scene.getObjectByName(MODEL_SPECS.stone.pieces[index]);
    const obj = (named ?? scene).clone(true);
    obj.position.set(0, 0, 0);
    normaliseObject(obj, MODEL_SPECS.stone.size);
    const mats: THREE.MeshStandardMaterial[] = [];
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material) {
        const src = Array.isArray(m.material) ? m.material[0] : m.material;
        const mat = (src as THREE.MeshStandardMaterial).clone();
        if ("emissive" in mat) {
          mat.emissive = new THREE.Color("#4f9c85");
          mats.push(mat);
        }
        m.material = mat;
      }
    });
    return { obj, mats };
  }, [scene, index]);
  useFrame(() => {
    for (const m of mats) m.emissiveIntensity = 0.05 + intensity.current * 0.9;
  });
  return <primitive object={obj} />;
}

function Crystal({
  q,
  index,
  transmission,
  stoneAvailable,
}: {
  q: QuestionItem;
  index: number;
  transmission: boolean;
  stoneAvailable: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const edges = useRef<THREE.LineSegments>(null);
  const core = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const physMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const mtm = useRef<THREE.MeshPhysicalMaterial & { distortion?: number }>(null);

  const shards = useRef<THREE.InstancedMesh>(null);
  const shardMat = useRef<THREE.MeshStandardMaterial>(null);
  const thaw = useRef(0);
  const hover = useRef(0);
  const intensity = useRef(0);

  const geometry = useMemo(() => crystalGeometry(index + 1), [index]);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geometry, 1), [geometry]);
  const position = useMemo(() => questionPosition(index), [index]);
  const phase = index * 1.37;
  const shardDirs = useMemo(() => {
    const rand = seeded(index * 97 + 3);
    return Array.from({ length: SHARDS }, () => {
      const v = new THREE.Vector3(rand() - 0.5, (rand() - 0.5) * 1.4, rand() - 0.5).normalize();
      return { dir: v, spin: 1 + rand() * 3, size: 0.6 + rand() * 0.8 };
    });
  }, [index]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => () => setCursor(false), []);

  useFrame((state, dt) => {
    const s = ui.get();
    const open = Boolean(s.openQuestions[q.id]);
    const hovered = s.hoveredQuestion === q.id;
    // Slow, breathing ease: thaw takes ~2s, refreeze a little quicker.
    thaw.current = damp(thaw.current, open ? 1 : 0, open ? 1.4 : 2.2, dt);
    hover.current = damp(hover.current, hovered ? 1 : 0, 4, dt);
    const th = thaw.current;
    const hv = hover.current;
    intensity.current = Math.min(1, hv * 0.35 + th * 0.85);

    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 0.45 + phase) * 0.1;
      group.current.rotation.y = t * 0.08 + phase;
    }
    if (shell.current) {
      const sc = 1 + hv * 0.04 + th * 0.4;
      shell.current.scale.setScalar(sc);
      shell.current.visible = th < 0.66;
      shell.current.rotation.x = th * 0.35;
    }
    if (physMat.current) {
      physMat.current.opacity = Math.max(0, 0.46 * (1 - th * 1.5) + hv * 0.06);
      physMat.current.roughness = 0.42 - th * 0.3;
    }
    // Ice shards burst outward on thaw (and gather back on refreeze).
    if (shards.current) {
      const active = th > 0.01 && th < 0.99;
      shards.current.visible = active;
      if (active) {
        const fade = Math.pow(1 - th, 0.7);
        shardDirs.forEach((sd, k) => {
          dummy.position.copy(sd.dir).multiplyScalar(0.45 + th * 1.9);
          dummy.rotation.set(t * sd.spin * 0.3 + k, th * sd.spin * 2, k);
          dummy.scale.setScalar(0.11 * sd.size * fade);
          dummy.updateMatrix();
          shards.current!.setMatrixAt(k, dummy.matrix);
        });
        shards.current.instanceMatrix.needsUpdate = true;
        if (shardMat.current) shardMat.current.opacity = 0.85 * fade;
      }
    }
    if (mtm.current) {
      mtm.current.opacity = Math.max(0, 1 - th * 1.5);
      mtm.current.thickness = 0.9 * (1 - th);
      mtm.current.roughness = 0.2 - th * 0.15;
      if (typeof mtm.current.distortion === "number") mtm.current.distortion = 0.25 + th * 1.2;
    }
    if (edges.current) {
      const m = edges.current.material as THREE.LineBasicMaterial;
      m.opacity = (0.22 + hv * 0.35) * (1 - th);
      edges.current.scale.setScalar(1 + hv * 0.04 + th * 0.7);
    }
    if (core.current) {
      core.current.position.y = th * 0.25;
      core.current.rotation.y = t * (0.25 + th * 0.6);
      core.current.rotation.x = t * 0.15;
      core.current.scale.setScalar(1 + th * 0.25);
    }
    if (glow.current) {
      const m = glow.current.material as THREE.SpriteMaterial;
      m.opacity = 0.08 + hv * 0.28 + th * 0.5;
      glow.current.scale.setScalar(2.4 + th * 1.6 + hv * 0.4);
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (landedOnUi(e)) return;
    e.stopPropagation();
    hoverQuestionStart(q);
    setCursor(true);
  };
  const onOut = () => {
    hoverQuestionEnd(q, "crystal");
    setCursor(false);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (landedOnUi(e)) return;
    e.stopPropagation();
    toggleQuestion(q, "crystal");
  };

  return (
    <group ref={group} position={position}>
      <mesh
        ref={shell}
        geometry={geometry}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      >
        {transmission ? (
          <MeshTransmissionMaterial
            ref={mtm as never}
            transmissionSampler
            samples={4}
            thickness={0.9}
            roughness={0.2}
            ior={1.25}
            chromaticAberration={0.35}
            anisotropy={0.15}
            distortion={0.25}
            distortionScale={0.35}
            temporalDistortion={0.04}
            color="#dce7ea"
            attenuationColor="#b6d1c8"
            attenuationDistance={2.5}
            transparent
            flatShading
          />
        ) : (
          <meshPhysicalMaterial
            ref={physMat}
            color="#c7d4d8"
            roughness={0.42}
            metalness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.25}
            transparent
            opacity={0.46}
            depthWrite={false}
            flatShading
          />
        )}
      </mesh>
      <instancedMesh ref={shards} args={[undefined, undefined, SHARDS]} visible={false} frustumCulled={false}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={shardMat}
          color="#e2eef0"
          emissive="#7fb8a4"
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.1}
          transparent
          depthWrite={false}
          flatShading
        />
      </instancedMesh>
      <lineSegments ref={edges} geometry={edgeGeo}>
        <lineBasicMaterial color="#eaf2f1" transparent opacity={0.22} depthWrite={false} />
      </lineSegments>
      <group ref={core}>
        <ModelSlot
          available={stoneAvailable}
          fallback={<ProceduralCore intensity={intensity} index={index} />}
        >
          <GltfCore intensity={intensity} index={index} />
        </ModelSlot>
      </group>
      <sprite ref={glow} scale={2.4}>
          <spriteMaterial
            map={getGlowTexture()}
            color="#7fb8a4"
            transparent
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
      </sprite>
    </group>
  );
}

export function CrystalField({
  transmission,
  stoneAvailable,
}: {
  transmission: boolean;
  stoneAvailable: boolean;
}) {
  return (
    <>
      {QUESTIONS.map((q, i) => (
        <Crystal
          key={q.id}
          q={q}
          index={i}
          transmission={transmission}
          stoneAvailable={stoneAvailable}
        />
      ))}
    </>
  );
}
