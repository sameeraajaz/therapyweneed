"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "·•∘◦○<>/\\|—=+*^~#░▒";

function glyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

export function scrambleAll(text: string, step = 0): string {
  let s = "";
  for (let i = 0; i < text.length; i++) {
    s += text[i] === " " ? " " : GLYPHS[(i * 7 + step * 3 + i * i) % GLYPHS.length];
  }
  return s;
}

/**
 * Text that scrambles, then resolves left → right.
 *
 * - `resolved=true`  → plays the resolve animation, ends on the real text.
 * - `resolved=false` → shows a sealed, scrambled string (optionally shimmering).
 * - `instant` (reduced motion / still mode) skips animation entirely.
 * - SSR always renders `initial` ("text" keeps real words in the HTML for SEO).
 */
export function useScramble(
  text: string,
  resolved: boolean,
  opts: { duration?: number; instant?: boolean; shimmer?: boolean; initial?: "text" | "scrambled" } = {}
): string {
  const { duration = 1300, instant = false, shimmer = false, initial = "text" } = opts;
  const [out, setOut] = useState(initial === "text" ? text : scrambleAll(text));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (instant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOut(resolved ? text : scrambleAll(text));
      return;
    }
    const start = performance.now();
    let lastStep = -1;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (resolved) {
        const p = Math.min(1, elapsed / duration);
        const reveal = p * (text.length + 4);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " " || i < reveal - 4) s += ch;
          else if (i < reveal) s += Math.random() < 0.45 ? ch : glyph();
          else s += glyph();
        }
        setOut(p < 1 ? s : text);
        if (p < 1) raf.current = requestAnimationFrame(tick);
      } else {
        const step = Math.floor(elapsed / 160);
        if (step !== lastStep) {
          lastStep = step;
          setOut(scrambleAll(text, step));
        }
        if (shimmer) raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [text, resolved, duration, instant, shimmer]);

  return out;
}

/** Fires once when the element first scrolls into view (and reports visibility). */
export function useInView<T extends Element>(
  opts: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const { threshold = 0.35, rootMargin = "0px", once = false } = opts;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);
  return { ref, inView };
}
