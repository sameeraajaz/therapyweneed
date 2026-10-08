"use client";

import { SectionReveal } from "./SectionReveal";

export function Bridge() {
  return (
    <section className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <SectionReveal className="mx-auto max-w-2xl text-center">
        <p className="font-serif text-2xl leading-relaxed text-charcoal/80 sm:text-3xl">
          Some weeks, the hardest part is not the problem —
          <span className="text-sage-deep"> it&apos;s not having anyone steady to say it to.</span>
        </p>
      </SectionReveal>
    </section>
  );
}
