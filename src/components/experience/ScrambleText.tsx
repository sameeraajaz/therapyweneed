"use client";

import { createElement, useEffect, useState } from "react";
import { useInView, useScramble } from "@/lib/scramble";
import { ui } from "@/lib/experience";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

/**
 * Heading/label that scrambles and resolves when it scrolls into view.
 * The real text is always in the DOM (sr-only) for SEO and screen readers;
 * the animated glyphs are aria-hidden.
 */
export function ScrambleText({
  text,
  as = "span",
  className,
  duration,
  id,
}: {
  id?: string;
  text: string;
  as?: Tag;
  className?: string;
  duration?: number;
}) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.4, once: true });
  const mode = ui.useStore((s) => s.mode);
  const still = ui.useStore((s) => s.still);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArmed(true);
  }, []);
  const instant = !armed || mode !== "3d" || still;
  const display = useScramble(text, inView || instant, { duration, instant });

  return createElement(
    as,
    { ref, className, id },
    <span className="sr-only">{text}</span>,
    <span aria-hidden="true" className="scramble">
      {display}
    </span>
  );
}
