"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { detectCapabilities, type Capabilities } from "@/lib/device";
import { frame, ui } from "@/lib/experience";
import type { ModelAvailability } from "@/lib/models";
import { LeadOverlay } from "../LeadOverlay";
import { BehaviorSensors } from "./BehaviorSensors";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import {
  FinaleSection,
  HeroSection,
  OfferAidSection,
  OfferHourSection,
  OfferNdaSection,
  QuestionSections,
  SteadySection,
} from "./Sections";

const Scene = dynamic(() => import("../three/Scene"), { ssr: false, loading: () => null });

const ROOT_ID = "experience-root";

function computeStops() {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]")).sort(
    (a, b) => Number(a.dataset.stop) - Number(b.dataset.stop)
  );
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  frame.stops = els.map((el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const center = top + r.height / 2 - vh / 2;
    return Math.max(0, Math.min(1, center / max));
  });
}

export function Experience({ models }: { models: ModelAvailability }) {
  const mode = ui.useStore((s) => s.mode);
  const tier = ui.useStore((s) => s.tier);
  const still = ui.useStore((s) => s.still);
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* Capability detection → 3D or static, and quality tier. */
  useEffect(() => {
    const c = detectCapabilities();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaps(c);
    let storedStill = false;
    try {
      storedStill = localStorage.getItem("st_still") === "1";
    } catch {
      /* ignore */
    }
    ui.set({
      tier: c.tier,
      mode: c.webgl && !c.reducedMotion ? "3d" : "static",
      still: storedStill,
    });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => ui.set({ mode: c.webgl && !mq.matches ? "3d" : "static" });
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  /* Scroll progress (GSAP ScrollTrigger), stop positions, pointer. */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        frame.progress = self.progress;
        frame.velocity = self.getVelocity();
      },
      onRefresh: (self) => {
        frame.progress = self.progress;
        computeStops();
      },
    });
    computeStops();
    frame.progress = st.progress;

    const ro = new ResizeObserver(() => {
      computeStops();
      ScrollTrigger.refresh();
    });
    ro.observe(document.body);

    const onPointer = (e: PointerEvent) => {
      frame.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      frame.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    void document.fonts?.ready.then(() => computeStops());

    return () => {
      st.kill();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  /* Gentle scrubbed reveals per section (only in full-motion 3D mode). */
  useEffect(() => {
    if (mode !== "3d" || still || !rootRef.current) return;
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-stop]");
      sections.forEach((sec, i) => {
        const items = sec.querySelectorAll("[data-reveal], h1 .scramble, h2 .scramble");
        if (items.length === 0) return;
        const first = i === 0;
        const last = i === sections.length - 1;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 1.4 },
        });
        if (first) tl.set(items, { opacity: 1, y: 0 });
        else tl.fromTo(items, { opacity: 0, y: 36 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: "sine.out" });
        tl.to(items, { opacity: 1, duration: 0.35 });
        if (!last) tl.to(items, { opacity: 0, y: -28, stagger: 0.02, duration: 0.3, ease: "sine.in" });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [mode, still]);

  const show3d = mode === "3d" && !still;

  return (
    <div id={ROOT_ID} ref={rootRef} className="relative">
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <div className="static-backdrop absolute inset-0" />
        {show3d && (
          <div className="canvas-fade absolute inset-0">
            <Scene tier={tier} models={models} eventSourceId={ROOT_ID} />
          </div>
        )}
      </div>
      <div aria-hidden="true" className="frost-overlay pointer-events-none fixed inset-0 z-[1]" />

      <SiteHeader />
      <main className="relative z-10">
        <HeroSection />
        <SteadySection />
        <QuestionSections />
        <OfferHourSection />
        <OfferNdaSection />
        <OfferAidSection />
        <FinaleSection />
      </main>
      <SiteFooter />
      <LeadOverlay />
      <BehaviorSensors caps={caps} />
    </div>
  );
}
