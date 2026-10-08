"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  checkReturnVisit,
  emitSignal,
  getConsent,
  getOrCreateSessionId,
  getOrCreateVisitorId,
  getScrollPct,
  setConsent,
} from "@/lib/signals";
import type { SignalEventName, SignalTag } from "@/lib/types";

type ConsentState = "pending" | "granted" | "denied";

type TrackOpts = {
  event: SignalEventName | string;
  signal: SignalTag;
  targetId?: string;
  dwellMs?: number;
  meta?: Record<string, string | number | boolean | null>;
};

type SignalContextValue = {
  consent: ConsentState;
  grantConsent: () => void;
  denyConsent: () => void;
  track: (opts: TrackOpts) => void;
  visitorId: string | null;
  sessionId: string | null;
};

const SignalContext = createContext<SignalContextValue | null>(null);

const SCROLL_MILESTONES = [25, 50, 75, 100];

export function SignalProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>("pending");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const milestonesHit = useRef<Set<number>>(new Set());
  const started = useRef(false);

  useEffect(() => {
    const existing = getConsent();
    if (existing === "granted") {
      setConsentState("granted");
      setVisitorId(getOrCreateVisitorId());
      setSessionId(getOrCreateSessionId());
    } else if (existing === "denied") {
      setConsentState("denied");
    }
  }, []);

  const track = useCallback(
    (opts: TrackOpts) => {
      const force =
        opts.signal === "consent_granted" || opts.signal === "consent_denied";
      void emitSignal({ ...opts, force });
    },
    []
  );

  const grantConsent = useCallback(() => {
    setConsent("granted");
    setConsentState("granted");
    const vid = getOrCreateVisitorId();
    const sid = getOrCreateSessionId();
    setVisitorId(vid);
    setSessionId(sid);
    void emitSignal({
      event: "consent_update",
      signal: "consent_granted",
      targetId: "consent_banner",
      force: true,
    });
    const isReturn = checkReturnVisit();
    if (isReturn) {
      void emitSignal({
        event: "session_start",
        signal: "return_revisit",
        targetId: "session",
      });
    }
  }, []);

  const denyConsent = useCallback(() => {
    setConsent("denied");
    setConsentState("denied");
    // Still record the denial once (allowed by force + consent_denied tag)
    void emitSignal({
      event: "consent_update",
      signal: "consent_denied",
      targetId: "consent_banner",
      force: true,
    });
  }, []);

  // Scroll depth milestones — only when consented
  useEffect(() => {
    if (consent !== "granted") return;

    if (!started.current) {
      started.current = true;
      void emitSignal({
        event: "session_start",
        signal: "curiosity_open",
        targetId: "page",
        meta: { reason: "session_boot" },
      });
    }

    const onScroll = () => {
      const pct = getScrollPct();
      for (const m of SCROLL_MILESTONES) {
        if (pct >= m && !milestonesHit.current.has(m)) {
          milestonesHit.current.add(m);
          void emitSignal({
            event: "scroll_milestone",
            signal: "scroll_depth_milestone",
            targetId: `scroll_${m}`,
            meta: { milestone: m },
          });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [consent]);

  const value = useMemo(
    () => ({
      consent,
      grantConsent,
      denyConsent,
      track,
      visitorId,
      sessionId,
    }),
    [consent, grantConsent, denyConsent, track, visitorId, sessionId]
  );

  return (
    <SignalContext.Provider value={value}>{children}</SignalContext.Provider>
  );
}

export function useSignals(): SignalContextValue {
  const ctx = useContext(SignalContext);
  if (!ctx) {
    throw new Error("useSignals must be used within SignalProvider");
  }
  return ctx;
}
