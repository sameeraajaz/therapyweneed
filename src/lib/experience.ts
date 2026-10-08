"use client";

import { createStore } from "./store";
import { track } from "./signals";
import type { QuestionItem } from "./types";
import type { Tier } from "./device";

/* ------------------------------------------------------------------ */
/* Per-frame mutable state (read inside useFrame, never re-renders)    */
/* ------------------------------------------------------------------ */

export const frame = {
  /** Raw scroll progress 0..1 */
  progress: 0,
  /** Scroll velocity px/s (signed) */
  velocity: 0,
  /** Scroll progress at which each stop's section is centred */
  stops: [] as number[],
  /** Pointer in NDC (-1..1) */
  pointer: { x: 0, y: 0 },
  /** Satellite assembly 0..1 (computed from scroll) */
  assembly: 0,
  /** Pending spin impulse for the spinner (rad/s) */
  spinImpulse: 0,
};

/* ------------------------------------------------------------------ */
/* Reactive UI state                                                   */
/* ------------------------------------------------------------------ */

export type FinaleShape = "cloud" | "hand" | "envelope" | "spinner";
export type RenderMode = "pending" | "3d" | "static";

export const ui = createStore({
  mode: "pending" as RenderMode,
  tier: "mid" as Tier,
  activeStop: 0,
  openQuestions: {} as Record<string, boolean>,
  hoveredQuestion: null as string | null,
  finaleShape: "cloud" as FinaleShape,
  envelopeOpen: false,
  leadOpen: false,
  /** User-chosen still mode (in addition to OS reduced motion). */
  still: false,
});

/* ------------------------------------------------------------------ */
/* Questions: open / close / hover — with sequence + hesitation signals */
/* ------------------------------------------------------------------ */

const everOpened = new Set<string>();
const openOrder: string[] = [];
const reopenCount: Record<string, number> = {};
const openedAt: Record<string, number> = {};
const hoverState: Record<string, { start: number; opened: boolean }> = {};

export type InteractionSource = "crystal" | "html" | "keyboard";

export function toggleQuestion(q: QuestionItem, source: InteractionSource): void {
  const isOpen = Boolean(ui.get().openQuestions[q.id]);
  const now = performance.now();

  if (!isOpen) {
    ui.set((s) => ({ openQuestions: { ...s.openQuestions, [q.id]: true } }));
    openedAt[q.id] = now;
    if (hoverState[q.id]) hoverState[q.id].opened = true;

    const first = !everOpened.has(q.id);
    track({
      event: "question_open",
      signal: "curiosity_open",
      targetId: q.id,
      meta: { topic: q.topic, source, first },
    });

    if (first) {
      everOpened.add(q.id);
      openOrder.push(q.short);
      track({
        event: "question_open",
        signal: "topic_affinity",
        targetId: q.id,
        meta: { topic: q.topic },
      });
      track({
        event: "question_open_order",
        signal: "sequence_path",
        targetId: q.id,
        meta: {
          order: openOrder.length,
          sequence: openOrder.join(">"),
          // Did they open in page order? (engagement pattern only)
          inPageOrder: openOrder.every(
            (s, i, arr) => i === 0 || Number(s.slice(1)) > Number(arr[i - 1].slice(1))
          ),
        },
      });
    } else {
      reopenCount[q.id] = (reopenCount[q.id] || 0) + 1;
      track({
        event: "question_reopen",
        signal: "sequence_path",
        targetId: q.id,
        meta: { reopens: reopenCount[q.id], topic: q.topic },
      });
    }

    if (q.topic === "privacy") {
      track({ event: "nda_learn_more", signal: "trust_interest_nda", targetId: q.id });
    }
    if (q.topic === "hands") {
      track({ event: "aid_learn_more", signal: "tangible_interest_aid", targetId: q.id });
    }
  } else {
    ui.set((s) => ({ openQuestions: { ...s.openQuestions, [q.id]: false } }));
    const readMs = openedAt[q.id] ? now - openedAt[q.id] : undefined;
    track({
      event: "question_close",
      signal: "attention_dwell",
      targetId: q.id,
      dwellMs: readMs,
      meta: { topic: q.topic, source, phase: "read_then_reseal" },
    });
    delete openedAt[q.id];
  }
}

export function hoverQuestionStart(q: QuestionItem): void {
  if (hoverState[q.id]) return;
  hoverState[q.id] = { start: performance.now(), opened: false };
  ui.set({ hoveredQuestion: q.id });
}

export function hoverQuestionEnd(q: QuestionItem, source: InteractionSource): void {
  const h = hoverState[q.id];
  delete hoverState[q.id];
  if (ui.get().hoveredQuestion === q.id) ui.set({ hoveredQuestion: null });
  if (!h) return;
  const ms = performance.now() - h.start;
  const isOpen = Boolean(ui.get().openQuestions[q.id]);
  if (!h.opened && !isOpen && ms >= 600) {
    track({
      event: "crystal_hover_no_open",
      signal: "hesitation_dwell",
      targetId: q.id,
      dwellMs: ms,
      meta: { topic: q.topic, source },
    });
  }
}

/* ------------------------------------------------------------------ */
/* Offer objects                                                        */
/* ------------------------------------------------------------------ */

export function toggleEnvelope(source: InteractionSource): void {
  const next = !ui.get().envelopeOpen;
  ui.set({ envelopeOpen: next });
  track({
    event: next ? "nda_seal_break" : "nda_reseal",
    signal: "trust_interest_nda",
    targetId: "offer_nda_envelope",
    meta: { source },
  });
}

/** Spinner interaction bookkeeping: count + total spin time, reported per burst. */
const spinner = {
  interactions: 0,
  burstStart: 0,
  peak: 0,
  active: false,
  reported: 0,
};

export function spinnerKick(speed: number, source: InteractionSource | "hover" | "drag"): void {
  frame.spinImpulse += speed;
  spinner.interactions += 1;
  if (!spinner.active) {
    spinner.active = true;
    spinner.burstStart = performance.now();
    spinner.peak = 0;
  }
  if (source === "keyboard" || source === "html") {
    // Keyboard/HTML users also count — and in static mode there is no
    // 3D spin to settle, so report straight away.
    if (ui.get().mode !== "3d") spinnerSettled(speed);
  }
}

/** Called by the 3D spinner each frame with its current angular speed. */
export function spinnerSpeedSample(speed: number): void {
  if (!spinner.active) return;
  spinner.peak = Math.max(spinner.peak, Math.abs(speed));
  if (Math.abs(speed) < 0.15) spinnerSettled(spinner.peak);
}

function spinnerSettled(peak: number): void {
  if (!spinner.active) return;
  spinner.active = false;
  const ms = performance.now() - spinner.burstStart;
  spinner.reported += 1;
  if (spinner.reported > 12) return; // cap noise per page view
  track({
    event: "spinner_spin",
    signal: "tangible_interest_aid",
    targetId: "offer_aid_spinner",
    dwellMs: ms,
    meta: {
      interactions: spinner.interactions,
      bursts: spinner.reported,
      peakSpeed: Math.round(Math.max(peak, spinner.peak) * 10) / 10,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Finale CTAs: hover vs click vs retreat                               */
/* ------------------------------------------------------------------ */

const cta = {
  hoverStart: {} as Record<string, number>,
  bookHovered: false,
  bookClicked: false,
  retreatReported: false,
};

export function ctaHoverStart(id: string, shape: FinaleShape): void {
  cta.hoverStart[id] = performance.now();
  if (id === "book") cta.bookHovered = true;
  ui.set({ finaleShape: shape });
}

export function ctaHoverEnd(id: string): void {
  const start = cta.hoverStart[id];
  delete cta.hoverStart[id];
  ui.set({ finaleShape: "cloud" });
  if (!start) return;
  const ms = performance.now() - start;
  if (ms >= 250) {
    track({
      event: "cta_hover",
      signal: "readiness_reachout",
      targetId: `cta_${id}`,
      dwellMs: ms,
      meta: { phase: "hover" },
    });
  }
}

export function ctaClick(id: string): void {
  if (id === "book") cta.bookClicked = true;
  track({
    event: "cta_click",
    signal: "readiness_reachout",
    targetId: `cta_${id}`,
    meta: { phase: "click" },
  });
}

/** Finale scrolled out of view: if Book was hovered but never clicked, that's a retreat. */
export function finaleLeft(): void {
  if (cta.bookHovered && !cta.bookClicked && !cta.retreatReported) {
    cta.retreatReported = true;
    track({
      event: "cta_retreat",
      signal: "cta_retreat",
      targetId: "cta_book",
      meta: { from: "scroll_away" },
    });
  }
}

export function openLead(from: string): void {
  ui.set({ leadOpen: true });
  ctaClick(from);
}

export function closeLead(submitted: boolean): void {
  ui.set({ leadOpen: false });
  if (!submitted) {
    track({
      event: "cta_retreat",
      signal: "cta_retreat",
      targetId: "lead_overlay",
      meta: { from: "overlay_closed" },
    });
  }
}

/* Dev-only inspection hook for QA (never in production builds). */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __steady?: unknown }).__steady = { ui, frame };
}
