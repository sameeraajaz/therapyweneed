"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { ConsentBanner } from "./ConsentBanner";
import { SignalProvider } from "./SignalProvider";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    // Framer Motion honours the OS reduced-motion setting (transforms off, fades kept).
    <MotionConfig reducedMotion="user">
      <SignalProvider>
        {children}
        <ConsentBanner />
      </SignalProvider>
    </MotionConfig>
  );
}
