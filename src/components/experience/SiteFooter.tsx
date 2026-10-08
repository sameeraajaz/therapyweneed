"use client";

import { useSignals } from "../SignalProvider";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint";

export function SiteFooter() {
  const { reopenConsent } = useSignals();
  return (
    <footer className="relative z-10 border-t border-ice/10 bg-night/80 px-5 py-14 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-mint">SteadyTalk</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ice">
            Paid non-psychiatric consultation. Rent an hour of steady company, with a signed NDA
            and a small grounding aid.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ice">
          <a href="#questions" className={`hover:text-mist ${focusRing}`}>Questions</a>
          <a href="#offer-hour" className={`hover:text-mist ${focusRing}`}>The model</a>
          <a href="#reach-out" className={`hover:text-mist ${focusRing}`}>Reach out</a>
          <button type="button" onClick={reopenConsent} className={`hover:text-mist ${focusRing}`}>
            Privacy choices
          </button>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-ice/10 pt-8">
        <p className="max-w-3xl text-xs leading-relaxed text-ice/80">
          <strong className="font-medium text-mist">Important.</strong> SteadyTalk is not therapy,
          psychiatry, or healthcare. We do not diagnose, treat, or give medical advice, and
          SteadyTalk is not a substitute for licensed professional care. If you or someone else is
          in crisis, contact local emergency services or a licensed crisis resource immediately.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-ice/60">
          With your consent we record anonymous interaction signals to improve SteadyTalk and
          prepare better conversations. They are engagement patterns, not medical or psychological
          assessments.
        </p>
        <p className="mt-4 text-xs text-ice/50">© {new Date().getFullYear()} SteadyTalk</p>
      </div>
    </footer>
  );
}
