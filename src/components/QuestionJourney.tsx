"use client";

import { QUESTIONS } from "@/lib/questions";
import { QuestionCard } from "./QuestionCard";
import { SectionReveal } from "./SectionReveal";

export function QuestionJourney() {
  return (
    <section
      id="questions"
      className="relative px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-3xl">
        <SectionReveal>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-sage">
            Questions people carry
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-charcoal sm:text-4xl">
            Open one. Sit with it.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-charcoal/65 sm:text-base">
            These are not assessments. They are doors — the kind of quiet
            wondering that often brings someone to SteadyTalk. Tap to open.
          </p>
        </SectionReveal>

        <div className="mt-12 flex flex-col gap-3">
          {QUESTIONS.map((q, i) => (
            <SectionReveal key={q.id} delay={Math.min(i * 0.04, 0.24)}>
              <QuestionCard question={q} index={i} />
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
