"use client";

import { Component, Suspense, type ReactNode } from "react";

class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[SteadyTalk] model failed to load, using procedural fallback", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders `children` (a .glb-backed component) when the model file exists,
 * otherwise — or while loading, or on error — the procedural `fallback`.
 */
export function ModelSlot({
  available,
  fallback,
  children,
}: {
  available: boolean;
  fallback: ReactNode;
  children: ReactNode;
}) {
  if (!available) return <>{fallback}</>;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ModelBoundary>
  );
}
