"use client";

import { openLead, ui } from "@/lib/experience";
import { track } from "@/lib/signals";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint";

export function SiteHeader() {
  const still = ui.useStore((s) => s.still);
  const mode = ui.useStore((s) => s.mode);

  const toggleStill = () => {
    const next = !ui.get().still;
    ui.set({ still: next });
    try {
      localStorage.setItem("st_still", next ? "1" : "0");
    } catch {
      /* ignore */
    }
    track({
      event: "still_mode_toggle",
      signal: "environment_flag",
      targetId: "header_still",
      meta: { on: next },
    });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="flex h-16 items-center justify-between px-5 sm:px-10 lg:px-20">
        <a href="#hero" className={`text-sm font-medium tracking-[0.2em] text-mist ${focusRing}`}>
          STEADYTALK
        </a>
        <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-4">
          {mode === "3d" && (
            <button
              type="button"
              aria-pressed={still}
              onClick={toggleStill}
              className={`rounded-full px-3 py-2 text-xs text-ice transition hover:text-mist ${focusRing}`}
              title="Turn off 3D motion"
            >
              {still ? "Motion: off" : "Still mode"}
            </button>
          )}
          <button
            type="button"
            onClick={() => openLead("header")}
            className={`rounded-full border border-ice/30 px-4 py-2 text-xs font-medium text-mist transition hover:border-mist ${focusRing}`}
          >
            Reach out
          </button>
        </nav>
      </div>
    </header>
  );
}
