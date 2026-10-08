"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { QuestionItem } from "@/lib/types";
import { TOPIC_LABEL } from "@/lib/questions";
import { useSignals } from "./SignalProvider";

type Props = {
  question: QuestionItem;
  index: number;
};

export function QuestionCard({ question, index }: Props) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { track } = useSignals();
  const openedAt = useRef<number | null>(null);
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
    };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);

    if (next) {
      openedAt.current = Date.now();
      track({
        event: "question_open",
        signal: "curiosity_open",
        targetId: question.id,
        meta: { topic: question.topic, index },
      });
      track({
        event: "question_open",
        signal: "topic_affinity",
        targetId: question.id,
        meta: { topic: question.topic },
      });

      // Hesitation / dwell after staying open ~4.5s
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      dwellTimer.current = setTimeout(() => {
        if (openedAt.current) {
          track({
            event: "question_dwell",
            signal: "hesitation_dwell",
            targetId: question.id,
            dwellMs: Date.now() - openedAt.current,
            meta: { topic: question.topic },
          });
        }
      }, 4500);

      // Trust / tangible interest for specific cards
      if (question.id === "q-private-space") {
        track({
          event: "nda_learn_more",
          signal: "trust_interest_nda",
          targetId: question.id,
        });
      }
      if (question.id === "q-hands-busy") {
        track({
          event: "aid_learn_more",
          signal: "tangible_interest_aid",
          targetId: question.id,
        });
      }
    } else {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      const dwellMs = openedAt.current ? Date.now() - openedAt.current : undefined;
      track({
        event: "question_close",
        signal: "curiosity_open",
        targetId: question.id,
        dwellMs,
        meta: { topic: question.topic, closed: true },
      });
      openedAt.current = null;
    }
  };

  return (
    <div
      className={`group rounded-2xl border transition-colors ${
        open
          ? "border-sage/40 bg-white/70 shadow-[0_8px_32px_rgba(44,95,79,0.06)]"
          : "border-charcoal/8 bg-white/40 hover:border-charcoal/15 hover:bg-white/60"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`whisper-${question.id}`}
        className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6 sm:py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage rounded-2xl"
      >
        <span className="mt-1 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-sage shrink-0">
          {TOPIC_LABEL[question.topic]}
        </span>
        <span className="flex-1 font-serif text-xl leading-snug text-charcoal sm:text-2xl">
          {question.prompt}
        </span>
        <span
          aria-hidden
          className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-charcoal/15 text-charcoal/50 transition ${
            open ? "rotate-45 bg-sage/10 border-sage/30 text-sage-deep" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`whisper-${question.id}`}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="border-t border-charcoal/6 px-5 pb-6 pt-4 text-sm leading-relaxed text-charcoal/70 sm:px-6 sm:text-[0.95rem]">
              {question.whisper}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
