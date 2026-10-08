"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MODEL_SPECS, modelUrl } from "@/lib/models";
import { STOPS } from "@/lib/world";
import { normaliseObject, seeded } from "./helpers";
import { ModelSlot } from "./ModelSlot";
import { makePointsMaterial } from "./ParticleFinale";

const Z_NEAR = 12;
const Z_FAR = -132;

/** Faint drifting dust along the whole camera path. */
export function Dust({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geometry, material } = useMemo(() => {
    const rand = seeded(99);
    const pos = new Float32Array(count * 3);
    const r = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 26;
      pos[i * 3 + 1] = (rand() - 0.5) * 14;
      pos[i * 3 + 2] = Z_FAR + rand() * (Z_NEAR - Z_FAR);
      r[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(r, 1));
    const material = makePointsMaterial({
      size: 1.8,
      colorA: "#b6bac5",
      colorB: "#7fb8a4",
      opacity: 0.45,
      pixelRatio: 1,
    });
    return { geometry, material };
  }, [count]);

  useEffect(() => {
    material.uniforms.uPixelRatio.value = dpr;
  }, [dpr, material]);
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime * 3;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/** Positions for floating fragments, kept clear of the objects at each stop. */
function debrisLayout(count: number) {
  const rand = seeded(2024);
  const items: { pos: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; scale: number }[] = [];
  let guard = 0;
  while (items.length < count && guard < count * 50) {
    guard++;
    // Peripheral only: outside the camera corridor (|x| > 5) so nothing drifts over the text.
    const side = rand() < 0.5 ? -1 : 1;
    const p = new THREE.Vector3(side * (5 + rand() * 5), (rand() - 0.5) * 9, Z_FAR + 20 + rand() * (Z_NEAR - Z_FAR - 20));
    const clear = STOPS.every((s) => p.distanceTo(new THREE.Vector3(...s.focus)) > 3.2);
    if (!clear) continue;
    items.push({
      pos: p,
      rot: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6),
      spin: new THREE.Vector3((rand() - 0.5) * 0.2, (rand() - 0.5) * 0.2, (rand() - 0.5) * 0.2),
      scale: 0.12 + rand() * 0.28,
    });
  }
  return items;
}

function ProceduralDebris({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => debrisLayout(count), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    items.forEach((it, i) => {
      dummy.position.copy(it.pos);
      dummy.position.y += Math.sin(t * 0.3 + i) * 0.15;
      dummy.rotation.set(it.rot.x + t * it.spin.x, it.rot.y + t * it.spin.y, it.rot.z + t * it.spin.z);
      dummy.scale.setScalar(it.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, items.length]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#6f7886" metalness={0.6} roughness={0.4} flatShading />
    </instancedMesh>
  );
}

function GltfDebris({ count }: { count: number }) {
  const { scene } = useGLTF(modelUrl("debris"));
  const items = useMemo(() => debrisLayout(count), [count]);
  const objects = useMemo(() => {
    let root: THREE.Object3D = scene;
    while (root.children.length === 1) root = root.children[0];
    const sources = root.children.length ? root.children : [scene];
    return items.map((it, i) => {
      const o = sources[i % sources.length].clone(true);
      o.position.set(0, 0, 0);
      normaliseObject(o, MODEL_SPECS.debris.size);
      const g = new THREE.Group();
      g.add(o);
      g.position.copy(it.pos);
      g.rotation.copy(it.rot);
      g.scale.setScalar(it.scale * 3);
      return g;
    });
  }, [scene, items]);
  useFrame((state, dt) => {
    objects.forEach((g, i) => {
      g.rotation.x += items[i].spin.x * dt;
      g.rotation.y += items[i].spin.y * dt;
    });
  });
  return (
    <>
      {objects.map((g, i) => (
        <primitive key={i} object={g} />
      ))}
    </>
  );
}

export function Debris({ count, available }: { count: number; available: boolean }) {
  return (
    <ModelSlot available={available} fallback={<ProceduralDebris count={count} />}>
      <GltfDebris count={count} />
    </ModelSlot>
  );
}
