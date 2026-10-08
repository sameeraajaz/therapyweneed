"use client";

import { LeadForm } from "./LeadForm";
import { SectionReveal } from "./SectionReveal";
import { useSignals } from "./SignalProvider";

export function ReachOut() {
  const { track } = useSignals();

  return (
    <section
      id="reach-out"
      className="relative px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionReveal>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-sage">
            Reach out
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-charcoal sm:text-4xl">
            Book a SteadyTalk hour.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-charcoal/65 sm:text-base">
            Tell us your name, email, and one line about what&apos;s on your
            mind. We&apos;ll follow up to schedule — no hard sell, no clinical
            intake.
          </p>
          <aside className="mt-8 rounded-2xl border border-amber-900/10 bg-amber-50/50 px-5 py-4 text-sm leading-relaxed text-charcoal/70">
            <strong className="font-medium text-charcoal">Disclaimer.</strong>{" "}
            SteadyTalk is paid consultation, not healthcare. We do not diagnose
            or treat. This is not a substitute for licensed care. If you are in
            crisis, seek emergency services or a licensed professional
            immediately.
          </aside>
          <p className="mt-6 text-xs text-charcoal/45">
            NDA e-sign and payments come next — for now, this form opens the
            conversation.{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-sage-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              onClick={() =>
                track({
                  event: "cta_click",
                  signal: "readiness_reachout",
                  targetId: "nda_placeholder",
                })
              }
            >
              NDA preview (placeholder)
            </button>
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div
            className="rounded-2xl border border-charcoal/8 bg-white/60 p-6 shadow-[0_12px_40px_rgba(28,28,26,0.04)] sm:p-8"
            onFocusCapture={() =>
              track({
                event: "cta_click",
                signal: "readiness_reachout",
                targetId: "lead_form_focus",
              })
            }
          >
            <LeadForm />
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
