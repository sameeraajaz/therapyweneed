"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSignals } from "./SignalProvider";

export function ConsentBanner() {
  const { consent, grantConsent, denyConsent } = useSignals();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {consent === "pending" && (
        <motion.div
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          initial={reduce ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: 24, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200/80 bg-[#f7f4ef]/95 p-5 shadow-[0_12px_40px_rgba(28,28,26,0.12)] backdrop-blur-md sm:p-6">
            <p
              id="consent-title"
              className="font-sans text-sm font-medium tracking-wide text-charcoal"
            >
              A quiet note on how we learn
            </p>
            <p
              id="consent-desc"
              className="mt-2 text-sm leading-relaxed text-charcoal/75"
            >
              With your OK, SteadyTalk records anonymous interaction signals
              (what you open, how far you scroll) so we can improve this site
              and prepare better conversations. These are{" "}
              <strong className="font-medium text-charcoal">
                not medical assessments
              </strong>
              , not profiling for ads, and never a diagnosis. Essential site
              function works either way.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={grantConsent}
                className="rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-warmwhite transition hover:bg-sage-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              >
                Yes, that&apos;s fine
              </button>
              <button
                type="button"
                onClick={denyConsent}
                className="rounded-full border border-charcoal/20 bg-transparent px-5 py-2.5 text-sm font-medium text-charcoal/80 transition hover:border-charcoal/40 hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              >
                No thanks
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
