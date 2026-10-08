"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { closeLead, ui } from "@/lib/experience";
import { LeadForm } from "./LeadForm";

/** Calm overlay holding the lead form. Escape / backdrop closes; focus is trapped and restored. */
export function LeadOverlay() {
  const open = ui.useStore((s) => s.leadOpen);
  const panel = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    submitted.current = false;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>("input")?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLead(submitted.current);
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>(
          "button, input, textarea, a[href], [tabindex]:not([tabindex='-1'])"
        );
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-ui
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={() => closeLead(submitted.current)}
            className="absolute inset-0 h-full w-full cursor-default bg-night/70 backdrop-blur-sm"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-ice/15 bg-[#1a2228]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:rounded-3xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-mint">
                  Book a SteadyTalk hour
                </p>
                <h2 id="lead-title" className="mt-3 font-serif text-2xl text-mist sm:text-3xl">
                  Take your time.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => closeLead(submitted.current)}
                className="rounded-full border border-ice/20 px-3 py-1.5 text-xs text-ice transition hover:border-ice/50 hover:text-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                Close
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ice">
              Your name, an email, and one line about what&apos;s on your mind. We&apos;ll reply to
              find a time.
            </p>
            <div className="mt-6">
              <LeadForm onSuccess={() => (submitted.current = true)} />
            </div>
            <p className="mt-6 border-t border-ice/10 pt-4 text-xs leading-relaxed text-ice/80">
              SteadyTalk is paid consultation, not healthcare. We do not diagnose or treat, and we
              are not a substitute for licensed care. In a crisis, contact local emergency services
              or a licensed professional now.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
