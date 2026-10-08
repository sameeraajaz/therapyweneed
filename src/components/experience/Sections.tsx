"use client";

import type { ReactNode } from "react";
import {
  ctaClick,
  ctaHoverEnd,
  ctaHoverStart,
  hoverQuestionEnd,
  hoverQuestionStart,
  openLead,
  spinnerKick,
  toggleEnvelope,
  toggleQuestion,
  ui,
  type FinaleShape,
} from "@/lib/experience";
import { QUESTIONS, TOPIC_LABEL } from "@/lib/questions";
import { useScramble } from "@/lib/scramble";
import { track } from "@/lib/signals";
import type { QuestionItem } from "@/lib/types";
import { STOPS, stopIndex, type TextSide } from "@/lib/world";
import { ScrambleText } from "./ScrambleText";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint";

function Stop({
  id,
  children,
  className = "",
  labelledBy,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const index = stopIndex(id);
  const side: TextSide = STOPS[index]?.side ?? "left";
  const justify =
    side === "left" ? "md:justify-start" : side === "right" ? "md:justify-end" : "md:justify-center";
  return (
    <section
      id={id}
      data-stop={index}
      aria-labelledby={labelledBy}
      className={`relative flex min-h-[100svh] items-end px-5 pt-24 sm:px-10 md:items-center lg:px-20 ${justify} ${className}`}
    >
      <div className="panel w-full max-w-xl">{children}</div>
    </section>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.32em] text-mint">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */

export function HeroSection() {
  return (
    <Stop id="hero" labelledBy="hero-title" className="md:items-end md:pb-[16svh]">
      <Kicker>SteadyTalk</Kicker>
      <ScrambleText
        id="hero-title"
        as="h1"
        text="An hour of steady company for the thoughts that linger."
        className="mt-5 block font-serif text-[2.4rem] leading-[1.08] tracking-tight text-mist sm:text-6xl"
        duration={1800}
      />
      <p data-reveal className="mt-6 max-w-md text-base leading-relaxed text-ice sm:text-lg">
        Paid consultation you can rent. Not therapy, not psychiatry, not diagnosis. Just a quiet
        space, a signed NDA, and something small to hold while you talk.
      </p>
      <div data-reveal className="mt-8 flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => openLead("hero_book")}
          className={`rounded-full bg-mist px-6 py-3 text-sm font-medium text-night transition hover:bg-white ${focusRing}`}
        >
          Book a SteadyTalk hour
        </button>
        <a href="#steady" className={`group flex items-center gap-3 text-sm text-ice transition hover:text-mist ${focusRing}`}>
          <span className="relative block h-9 w-[1px] overflow-hidden bg-ice/25">
            <span className="scroll-cue absolute left-0 top-0 block h-3 w-[1px] bg-mint" />
          </span>
          Scroll slowly. Nothing here is in a hurry.
        </a>
      </div>
    </Stop>
  );
}

export function SteadySection() {
  return (
    <Stop id="steady" labelledBy="steady-title">
      <Kicker>Getting steady</Kicker>
      <ScrambleText
        id="steady-title"
        as="h2"
        text="Pieces drift. Then, slowly, they find each other again."
        className="mt-5 block font-serif text-3xl leading-tight tracking-tight text-mist sm:text-5xl"
      />
      <p data-reveal className="mt-6 text-base leading-relaxed text-ice">
        Most weeks aren&apos;t a crisis. They&apos;re just scattered: work, people and decisions
        all pulling a little apart. An hour of steady company can help bring the pieces back
        into orbit.
      </p>
      <p data-reveal className="mt-4 text-sm leading-relaxed text-ice/80">
        Ahead are eight questions people carry, each one sealed in ice. Open the ones that feel
        familiar, and leave the rest.
      </p>
    </Stop>
  );
}

/* ------------------------------------------------------------------ */

function QuestionSection({ q, index }: { q: QuestionItem; index: number }) {
  const open = ui.useStore((s) => Boolean(s.openQuestions[q.id]));
  const hovered = ui.useStore((s) => s.hoveredQuestion === q.id);
  const mode = ui.useStore((s) => s.mode);
  const still = ui.useStore((s) => s.still);
  const animated = mode === "3d" && !still;
  // In 3D the question is sealed in ice until thawed. In still/static mode it's simply shown.
  const display = useScramble(q.prompt, open || !animated, {
    instant: !animated,
    duration: 1500,
    shimmer: hovered && !open,
    initial: "text",
  });
  const titleId = `${q.id}-title`;
  const whisperId = `${q.id}-whisper`;

  return (
    <Stop id={`question-${index}`} labelledBy={titleId}>
      <div data-question-id={q.id}>
        <Kicker>
          Question {String(index + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")} ·{" "}
          {TOPIC_LABEL[q.topic]}
        </Kicker>
        <h3
          id={titleId}
          data-reveal
          className={`mt-5 font-serif text-3xl leading-tight tracking-tight sm:text-[2.6rem] ${
            open || !animated ? "text-mist" : "text-ice/70"
          } ${open && animated ? "chroma-settle" : ""}`}
        >
          <span className="sr-only">{q.prompt}</span>
          <span aria-hidden="true" className="scramble">
            {display}
          </span>
        </h3>
        <div data-reveal className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={whisperId}
            onClick={() => toggleQuestion(q, "html")}
            onPointerEnter={() => hoverQuestionStart(q)}
            onPointerLeave={() => hoverQuestionEnd(q, "html")}
            onFocus={() => hoverQuestionStart(q)}
            onBlur={() => hoverQuestionEnd(q, "keyboard")}
            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition ${focusRing} ${
              open
                ? "border-ice/25 text-ice hover:border-ice/50 hover:text-mist"
                : "border-mint/50 bg-sage/30 text-mist hover:bg-sage/50"
            }`}
          >
            {open ? "Seal it again" : animated ? "Thaw it open" : "Open this question"}
          </button>
          {animated && !open && (
            <span className="hidden text-xs text-ice/60 md:inline">or click the crystal</span>
          )}
        </div>
        <div
          id={whisperId}
          aria-hidden={!open}
          className={`grid transition-all duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] ${
            open ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <p className="overflow-hidden text-base leading-relaxed text-ice">{q.whisper}</p>
        </div>
      </div>
    </Stop>
  );
}

export function QuestionSections() {
  return (
    <div id="questions">
      {QUESTIONS.map((q, i) => (
        <QuestionSection key={q.id} q={q} index={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function OfferHourSection() {
  return (
    <Stop id="offer-hour" labelledBy="offer-hour-title">
      <Kicker>The offer</Kicker>
      <ScrambleText
        id="offer-hour-title"
        as="h2"
        text="Rent an hour."
        className="mt-5 block font-serif text-4xl tracking-tight text-mist sm:text-6xl"
      />
      <p data-reveal className="mt-6 text-base leading-relaxed text-ice">
        You book time, and someone steady shows up. You talk, they listen, and you think it
        through together. It&apos;s paid consultation: no care plan, no treatment, no
        subscription.
      </p>
      <ul data-reveal className="mt-6 space-y-2 text-sm text-ice/90">
        <li className="flex gap-3"><span className="text-mint">—</span>Book time. Talk. That&apos;s the whole model.</li>
        <li className="flex gap-3"><span className="text-mint">—</span>No forms about your history. Just one line to start.</li>
        <li className="flex gap-3"><span className="text-mint">—</span>A signed NDA and a grounding aid with every session.</li>
      </ul>
    </Stop>
  );
}

export function OfferNdaSection() {
  const open = ui.useStore((s) => s.envelopeOpen);
  return (
    <Stop id="offer-nda" labelledBy="offer-nda-title">
      <Kicker>Trust</Kicker>
      <ScrambleText
        id="offer-nda-title"
        as="h2"
        text="Sealed before you speak."
        className="mt-5 block font-serif text-4xl tracking-tight text-mist sm:text-6xl"
      />
      <p data-reveal className="mt-6 text-base leading-relaxed text-ice">
        Before or at the start of every session, we both sign a non-disclosure agreement. What
        you say stays between us. The envelope is the promise.
      </p>
      <div data-reveal className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="nda-detail"
          onClick={() => toggleEnvelope("html")}
          className={`rounded-full border border-mint/50 bg-sage/30 px-5 py-2.5 text-sm font-medium text-mist transition hover:bg-sage/50 ${focusRing}`}
        >
          {open ? "Seal it again" : "Break the seal"}
        </button>
      </div>
      <div
        id="nda-detail"
        aria-hidden={!open}
        className={`grid transition-all duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] ${
          open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden text-sm leading-relaxed text-ice/90">
          The NDA covers what you share in your session. E-signing is coming before launch. For
          now, ask us for a copy when you reach out.{" "}
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() =>
              track({ event: "nda_preview_click", signal: "trust_interest_nda", targetId: "nda_preview_placeholder" })
            }
            className={`underline decoration-ice/40 underline-offset-4 hover:text-mist ${focusRing}`}
          >
            NDA preview (placeholder)
          </button>
        </div>
      </div>
    </Stop>
  );
}

export function OfferAidSection() {
  return (
    <Stop id="offer-aid" labelledBy="offer-aid-title">
      <Kicker>Something to hold</Kicker>
      <ScrambleText
        id="offer-aid-title"
        as="h2"
        text="A small thing for your hands."
        className="mt-5 block font-serif text-4xl tracking-tight text-mist sm:text-6xl"
      />
      <p data-reveal className="mt-6 text-base leading-relaxed text-ice">
        Every session comes with a fidget spinner, a simple grounding aid you keep. Some people
        think better with something in their hands. Hover over it or drag it to give it a turn.
      </p>
      <div data-reveal className="mt-6">
        <button
          type="button"
          onClick={() => spinnerKick(9, "html")}
          className={`rounded-full border border-mint/50 bg-sage/30 px-5 py-2.5 text-sm font-medium text-mist transition hover:bg-sage/50 ${focusRing}`}
        >
          Give it a spin
        </button>
      </div>
      <aside
        data-reveal
        className="mt-8 rounded-2xl border border-ice/15 bg-night/50 px-5 py-4 text-sm leading-relaxed text-ice"
      >
        <strong className="font-medium text-mist">Plainly:</strong> SteadyTalk is paid
        consultation, not healthcare. We don&apos;t diagnose or treat, and we&apos;re not a
        substitute for licensed care. If you are in crisis, contact local emergency services or a
        licensed professional now.
      </aside>
    </Stop>
  );
}

/* ------------------------------------------------------------------ */

function FinaleCta({
  id,
  shape,
  primary,
  children,
  onActivate,
}: {
  id: string;
  shape: FinaleShape;
  primary?: boolean;
  children: ReactNode;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onPointerEnter={() => ctaHoverStart(id, shape)}
      onPointerLeave={() => ctaHoverEnd(id)}
      onFocus={() => ctaHoverStart(id, shape)}
      onBlur={() => ctaHoverEnd(id)}
      onClick={onActivate}
      className={`rounded-full px-6 py-3 text-sm font-medium transition ${focusRing} ${
        primary
          ? "bg-mist text-night hover:bg-white"
          : "border border-ice/30 text-ice hover:border-ice/60 hover:text-mist"
      }`}
    >
      {children}
    </button>
  );
}

export function FinaleSection() {
  const go = (hash: string, id: string) => {
    ctaClick(id);
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <Stop id="reach-out" labelledBy="reach-out-title" className="min-h-[110svh]">
      <Kicker>Reach out</Kicker>
      <ScrambleText
        id="reach-out-title"
        as="h2"
        text="When you're ready, we're here."
        className="mt-5 block font-serif text-4xl leading-tight tracking-tight text-mist sm:text-6xl"
      />
      <p data-reveal className="mt-6 text-base leading-relaxed text-ice">
        Tell us your name and one line about what&apos;s on your mind. We&apos;ll reply calmly
        to find a time. No hard sell, no clinical intake.
      </p>
      <div data-reveal className="mt-8 flex flex-wrap gap-3">
        <FinaleCta id="book" shape="hand" primary onActivate={() => openLead("book")}>
          Book a SteadyTalk hour
        </FinaleCta>
        <FinaleCta id="nda" shape="envelope" onActivate={() => go("#offer-nda", "nda")}>
          How the NDA works
        </FinaleCta>
        <FinaleCta id="aid" shape="spinner" onActivate={() => go("#offer-aid", "aid")}>
          The grounding aid
        </FinaleCta>
      </div>
      <p data-reveal className="mt-8 max-w-md text-xs leading-relaxed text-ice/75">
        SteadyTalk is paid consultation, not healthcare: no diagnosis, no treatment, and not a
        substitute for licensed care. In a crisis, please contact emergency services or a licensed
        professional.
      </p>
    </Stop>
  );
}
