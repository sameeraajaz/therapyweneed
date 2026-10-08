"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSignals } from "./SignalProvider";

export function ConsentBanner() {
  const { consent, grantConsent, denyConsent } = useSignals();

  return (
    <AnimatePresence>
      {consent === "pending" && (
        <motion.div
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          data-ui
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 1.2 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-ice/15 bg-night/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6">
            <p id="consent-title" className="text-sm font-medium tracking-wide text-mist">
              A quiet note on how we learn
            </p>
            <p id="consent-desc" className="mt-2 text-sm leading-relaxed text-ice">
              With your OK, SteadyTalk records anonymous interaction signals (what you open, how
              long you linger, how you scroll) to improve SteadyTalk and prepare better
              conversations. These are{" "}
              <strong className="font-medium text-mist">not medical assessments</strong>, not ad
              profiling, and never a diagnosis. No profiling cookies are set without your OK, and
              the site works the same either way.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={grantConsent}
                className="rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-mist transition hover:bg-sage-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                Yes, that&apos;s fine
              </button>
              <button
                type="button"
                onClick={denyConsent}
                className="rounded-full border border-ice/30 px-5 py-2.5 text-sm font-medium text-ice transition hover:border-ice/60 hover:text-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
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
