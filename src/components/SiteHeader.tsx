"use client";

import { useEffect, useState } from "react";
import { useSignals } from "./SignalProvider";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { track } = useSignals();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-charcoal/8 bg-warmwhite/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 sm:h-16 sm:px-10 lg:px-0 lg:max-w-[min(64rem,calc(100%-4rem))]">
        <a
          href="#"
          className="font-sans text-sm font-medium tracking-[0.12em] text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          SteadyTalk
        </a>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm text-charcoal/70">
          <a
            href="#questions"
            className="hidden sm:inline hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            Questions
          </a>
          <a
            href="#about"
            className="hidden sm:inline hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            Model
          </a>
          <a
            href="#reach-out"
            onClick={() =>
              track({
                event: "cta_click",
                signal: "readiness_reachout",
                targetId: "header_cta",
              })
            }
            className="rounded-full bg-charcoal/90 px-4 py-2 text-xs font-medium text-warmwhite transition hover:bg-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            Reach out
          </a>
        </nav>
      </div>
    </header>
  );
}
