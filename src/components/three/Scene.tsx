"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import { TIER_SETTINGS, type Tier } from "@/lib/device";
import type { ModelAvailability } from "@/lib/models";
import { CameraRig } from "./CameraRig";
import { CrystalField } from "./Crystal";
import { Debris, Dust } from "./Atmosphere";
import { Envelope, Hourglass, Spinner } from "./Offers";
import { ParticleFinale } from "./ParticleFinale";
import { Satellite } from "./Satellite";

const FOG = "#151c21";

export default function Scene({
  tier,
  models,
  eventSourceId,
}: {
  tier: Tier;
  models: ModelAvailability;
  eventSourceId: string;
}) {
  const settings = TIER_SETTINGS[tier];
  const [dpr, setDpr] = useState(settings.dpr[1]);
  // Client-only component (dynamic, ssr:false): the page root already exists.
  const [source] = useState<HTMLElement | null>(() => document.getElementById(eventSourceId));

  if (!source) return null;

  return (
    <Canvas
      dpr={dpr}
      eventSource={source}
      eventPrefix="client"
      camera={{ fov: 45, near: 0.1, far: 90, position: [0, 0.6, 9.5] }}
      gl={{
        antialias: settings.antialias,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <PerformanceMonitor
        onChange={({ factor }) => {
          const [lo, hi] = settings.dpr;
          setDpr(Math.round((lo + (hi - lo) * factor) * 100) / 100);
        }}
        onFallback={() => setDpr(settings.dpr[0])}
      />
      <fog attach="fog" args={[FOG, 9, 30]} />

      <ambientLight intensity={0.35} color="#a9b8c6" />
      <hemisphereLight args={["#b6bac5", "#14231f", 0.45]} />
      <directionalLight position={[5, 8, 6]} intensity={1.3} color="#e3ebf2" />
      <directionalLight position={[-6, -2, -8]} intensity={0.7} color="#4f9c85" />

      <Environment resolution={settings.envResolution} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#b6bac5" position={[0, 5, -6]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#7fb8a4" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#dfe8f0" position={[5, 1, 4]} scale={3} />
        <Lightformer form="rect" intensity={0.4} color="#383e4e" position={[0, -5, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
      </Environment>

      <CameraRig parallax={settings.parallax} />
      <Satellite available={models.satellite} />
      <CrystalField transmission={settings.transmission} stoneAvailable={models.stone} />
      <Hourglass />
      <Envelope available={models.envelope} />
      <Spinner available={models.spinner} />
      <ParticleFinale count={settings.particles} />
      <Dust count={settings.dust} />
      <Debris count={settings.debris} available={models.debris} />
    </Canvas>
  );
}
