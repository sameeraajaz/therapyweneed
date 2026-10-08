"use client";

import { SectionReveal } from "./SectionReveal";
import { useSignals } from "./SignalProvider";

const PILLARS = [
  {
    id: "rent-time",
    title: "Rent time",
    body: "You book a SteadyTalk hour — paid consultation, not a subscription to care. Someone steady shows up. You talk. That's the product.",
  },
  {
    id: "nda",
    title: "Signed NDA",
    body: "Before or with your session, we sign a non-disclosure agreement. Your words stay yours. Trust is structural, not a slogan.",
    signal: "trust_interest_nda" as const,
  },
  {
    id: "aid",
    title: "A grounding aid",
    body: "You receive a fidget spinner / small grounding companion with your session. Something tangible for your hands — no clinical framing.",
    signal: "tangible_interest_aid" as const,
  },
];

export function AboutModel() {
  const { track } = useSignals();

  return (
    <section
      id="about"
      className="relative border-y border-charcoal/6 bg-charcoal/[0.02] px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <SectionReveal>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-sage">
            About the model
          </p>
          <h2 className="mt-4 max-w-2xl font-serif text-3xl tracking-tight text-charcoal sm:text-4xl">
            Plain words for what SteadyTalk is.
          </h2>
        </SectionReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <SectionReveal key={p.id} delay={i * 0.08}>
              <button
                type="button"
                className="h-full w-full rounded-2xl border border-charcoal/8 bg-warmwhite/80 p-6 text-left transition hover:border-sage/30 hover:shadow-[0_8px_28px_rgba(44,95,79,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage sm:p-7"
                onClick={() => {
                  if (p.signal) {
                    track({
                      event:
                        p.signal === "trust_interest_nda"
                          ? "nda_learn_more"
                          : "aid_learn_more",
                      signal: p.signal,
                      targetId: `about_${p.id}`,
                    });
                  } else {
                    track({
                      event: "section_view",
                      signal: "curiosity_open",
                      targetId: `about_${p.id}`,
                    });
                  }
                }}
              >
                <span className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-sage">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-serif text-xl text-charcoal">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
                  {p.body}
                </p>
              </button>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={0.15}>
          <p className="mt-12 max-w-2xl text-sm leading-relaxed text-charcoal/55">
            SteadyTalk is <strong className="font-medium text-charcoal/75">not</strong>{" "}
            healthcare, therapy, or psychiatry. We do not diagnose or treat. If
            you need licensed clinical care — or you are in crisis — please seek
            emergency services or a licensed professional.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
