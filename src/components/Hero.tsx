"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 80]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.7],
    reduce ? [1, 1] : [1, 0.35]
  );

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden px-6 pb-20 pt-28 sm:px-10 sm:pb-28 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(44,95,79,0.08),transparent_55%),radial-gradient(ellipse_at_90%_40%,rgba(184,160,130,0.12),transparent_50%)]"
      />
      <motion.div style={{ y, opacity }} className="relative mx-auto w-full max-w-4xl">
        <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.28em] text-sage">
          SteadyTalk
        </p>
        <h1 className="font-serif text-[2.35rem] leading-[1.15] tracking-tight text-charcoal sm:text-5xl md:text-6xl">
          An hour of steady company
          <span className="block text-sage-deep/90">for the thoughts that linger.</span>
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-charcoal/70 sm:text-lg">
          Paid consultation you can rent — not therapy, not psychiatry, not
          diagnosis. A quiet space, a signed NDA, and something small to hold
          while you speak.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#reach-out"
            className="rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-warmwhite transition hover:bg-charcoal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            Book a SteadyTalk hour
          </a>
          <a
            href="#questions"
            className="text-sm font-medium text-sage-deep underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            Open a question
          </a>
        </div>
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-charcoal/40 to-transparent" />
      </motion.div>
    </section>
  );
}
