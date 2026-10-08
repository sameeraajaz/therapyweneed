"use client";

import type { ReactNode } from "react";
import { ConsentBanner } from "./ConsentBanner";
import { Footer } from "./Footer";
import { SignalProvider } from "./SignalProvider";
import { SiteHeader } from "./SiteHeader";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SignalProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsentBanner />
    </SignalProvider>
  );
}
