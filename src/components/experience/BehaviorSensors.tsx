"use client";

import { useEffect } from "react";
import { frame, finaleLeft, ui } from "@/lib/experience";
import { viewportBucket, type Capabilities } from "@/lib/device";
import { flushSignals, getScrollPct, track } from "@/lib/signals";
import { useSignals } from "../SignalProvider";

const MILESTONES = [25, 50, 75, 100];
const IDLE_MS = 30_000;
const PACE_SAMPLE_MS = 300;

type PaceBand = "slow" | "steady" | "fast";

/**
 * Consent-gated behavior sensors. Everything here is an engagement
 * hypothesis (pace, attention, presence), never a trait or diagnosis.
 * All events go through the batched tracker (flush every 5s / on hide).
 */
export function BehaviorSensors({ caps }: { caps: Capabilities | null }) {
  const { consent } = useSignals();

  /* Environment flag: once per session, as context only (not a trait). */
  useEffect(() => {
    if (consent !== "granted" || !caps) return;
    try {
      if (sessionStorage.getItem("st_env_sent")) return;
      sessionStorage.setItem("st_env_sent", "1");
    } catch {
      /* ignore */
    }
    const s = ui.get();
    track({
      event: "environment",
      signal: "environment_flag",
      targetId: "device",
      meta: {
        reducedMotion: caps.reducedMotion,
        stillMode: s.still,
        renderMode: s.mode,
        tier: caps.tier,
        webgl: caps.webgl,
        touch: caps.touch,
        viewport: viewportBucket(),
      },
    });
  }, [consent, caps]);

  useEffect(() => {
    if (consent !== "granted") return;
    const cleanups: (() => void)[] = [];
    const vh = () => window.innerHeight || 800;

    /* ---- Scroll depth milestones ---- */
    const hit = new Set<number>();
    /* ---- Satellite reassembly watch ---- */
    const watch = { active: false, start: 0, max: 0, passes: 0 };

    const onScroll = () => {
      const pct = getScrollPct();
      for (const m of MILESTONES) {
        if (pct >= m && !hit.has(m)) {
          hit.add(m);
          track({
            event: "scroll_milestone",
            signal: "scroll_depth_milestone",
            targetId: `scroll_${m}`,
            meta: { milestone: m },
          });
        }
      }

      const [s0, s1] = frame.stops;
      if (s0 === undefined || s1 === undefined || s1 <= s0) return;
      const a = Math.max(0, Math.min(1, (frame.progress - s0) / (s1 - s0)));
      if (!watch.active && a > 0.02 && a < 0.98) {
        watch.active = true;
        watch.start = performance.now();
        watch.max = a;
      } else if (!watch.active && a >= 0.98 && watch.passes === 0) {
        // Jumped straight past the reassembly (anchor link, fast flick): record as unwatched.
        watch.passes = 1;
        track({
          event: "satellite_watch",
          signal: "settle_watch",
          targetId: "hero_satellite",
          dwellMs: 0,
          meta: { completed: true, maxAssembly: 1, pass: 1, jumped: true },
        });
      } else if (watch.active) {
        watch.max = Math.max(watch.max, a);
        const done = a >= 0.98;
        const back = a <= 0.005;
        if ((done || back) && watch.passes < 5) {
          watch.passes += 1;
          track({
            event: "satellite_watch",
            signal: "settle_watch",
            targetId: "hero_satellite",
            dwellMs: performance.now() - watch.start,
            meta: {
              completed: done,
              maxAssembly: Math.round(watch.max * 100) / 100,
              pass: watch.passes,
            },
          });
        }
        if (done || back) watch.active = false;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    /* ---- Scroll pace bands (viewport-heights per second) ---- */
    let lastY = window.scrollY;
    let lastT = performance.now();
    const samples: number[] = [];
    let candidate: PaceBand | null = null;
    let candidateCount = 0;
    let emitted: PaceBand | null = null;
    let lastEmitAt = 0;
    const paceTimer = setInterval(() => {
      if (document.visibilityState !== "visible" || ui.get().leadOpen) return;
      const now = performance.now();
      const y = window.scrollY;
      const v = Math.abs(y - lastY) / Math.max(1, now - lastT) * 1000; // px/s
      lastY = y;
      lastT = now;
      samples.push(v / vh());
      if (samples.length > 4) samples.shift();
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      if (avg < 0.06) {
        candidate = null;
        candidateCount = 0;
        return; // still: not a pace
      }
      const band: PaceBand = avg < 0.5 ? "slow" : avg < 1.6 ? "steady" : "fast";
      if (band === candidate) candidateCount++;
      else {
        candidate = band;
        candidateCount = 1;
      }
      if (candidateCount >= 3 && band !== emitted && now - lastEmitAt > 4000) {
        emitted = band;
        lastEmitAt = now;
        track({
          event: "scroll_pace",
          signal: "pace_band",
          targetId: "page",
          meta: { band, vhPerSec: Math.round(avg * 100) / 100 },
        });
      }
    }, PACE_SAMPLE_MS);
    cleanups.push(() => clearInterval(paceTimer));

    /* ---- Dwell per crystal while its section is in view ---- */
    const dwellStart = new Map<string, number>();
    const intersecting = new Set<string>();
    const endDwell = (id: string, reason: string) => {
      const start = dwellStart.get(id);
      dwellStart.delete(id);
      if (start === undefined) return;
      const ms = performance.now() - start;
      if (ms < 800) return;
      track({
        event: "crystal_in_view",
        signal: "attention_dwell",
        targetId: id,
        dwellMs: ms,
        meta: { opened: Boolean(ui.get().openQuestions[id]), reason },
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.questionId;
          if (!id) continue;
          if (e.isIntersecting) {
            intersecting.add(id);
            if (document.visibilityState === "visible") dwellStart.set(id, performance.now());
          } else {
            intersecting.delete(id);
            endDwell(id, "scrolled_past");
          }
        }
      },
      { threshold: 0.6 }
    );
    document.querySelectorAll<HTMLElement>("[data-question-id]").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* ---- CTA retreat: hovered Book, then scrolled away from the finale ---- */
    let finaleSeen = false;
    const finale = document.getElementById("reach-out");
    if (finale) {
      const fio = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) finaleSeen = true;
          else if (finaleSeen) finaleLeft();
        },
        { threshold: 0.25 }
      );
      fio.observe(finale);
      cleanups.push(() => fio.disconnect());
    }

    /* ---- Idle + tab presence ---- */
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleSince: number | null = null;
    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleSince = performance.now();
        track({ event: "idle_start", signal: "presence_idle", targetId: "page", meta: { thresholdMs: IDLE_MS } });
      }, IDLE_MS);
    };
    const onActivity = () => {
      if (idleSince !== null) {
        track({
          event: "idle_end",
          signal: "presence_idle",
          targetId: "page",
          dwellMs: performance.now() - idleSince,
        });
        idleSince = null;
      }
      armIdle();
    };
    const activityEvents = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"];
    activityEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    armIdle();
    cleanups.push(() => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (idleTimer) clearTimeout(idleTimer);
    });

    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = performance.now();
        intersecting.forEach((id) => endDwell(id, "tab_hidden"));
        track({ event: "tab_hidden", signal: "presence_idle", targetId: "tab", meta: { state: "hidden" } });
        flushSignals(true);
      } else {
        const away = hiddenAt !== null ? performance.now() - hiddenAt : undefined;
        hiddenAt = null;
        track({
          event: "tab_return",
          signal: "presence_idle",
          targetId: "tab",
          dwellMs: away,
          meta: { state: "visible" },
        });
        intersecting.forEach((id) => dwellStart.set(id, performance.now()));
        armIdle();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

    const onPageHide = () => {
      intersecting.forEach((id) => endDwell(id, "page_hide"));
      flushSignals(true);
    };
    window.addEventListener("pagehide", onPageHide);
    cleanups.push(() => window.removeEventListener("pagehide", onPageHide));

    return () => cleanups.forEach((c) => c());
  }, [consent]);

  return null;
}
