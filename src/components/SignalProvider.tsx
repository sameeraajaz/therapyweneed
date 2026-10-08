"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  checkReturnVisit,
  clearConsent,
  clearQueue,
  flushSignals,
  getConsent,
  setConsent,
  track,
  type TrackOpts,
} from "@/lib/signals";

type ConsentState = "pending" | "granted" | "denied";

type SignalContextValue = {
  consent: ConsentState;
  grantConsent: () => void;
  denyConsent: () => void;
  /** Re-open the consent choice (footer "Privacy choices"). */
  reopenConsent: () => void;
  track: (opts: TrackOpts) => void;
};

const SignalContext = createContext<SignalContextValue | null>(null);

const SESSION_FLAG = "st_session_started";

/** Once per browser session, after consent: session start + return-visit check. */
function startSession() {
  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    /* ignore */
  }
  track({ event: "session_start", signal: "curiosity_open", targetId: "page" });
  if (checkReturnVisit()) {
    track({ event: "session_start", signal: "return_revisit", targetId: "session" });
  }
}

export function SignalProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>("pending");

  useEffect(() => {
    const existing = getConsent();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConsentState(existing);
      if (existing === "granted") startSession();
    }
  }, []);

  const grantConsent = useCallback(() => {
    setConsent("granted");
    setConsentState("granted");
    track({
      event: "consent_update",
      signal: "consent_granted",
      targetId: "consent_banner",
      immediate: true,
    });
    startSession();
  }, []);

  const denyConsent = useCallback(() => {
    // Drop anything unsent, record only the denial itself, then stop.
    clearQueue();
    track({
      event: "consent_update",
      signal: "consent_denied",
      targetId: "consent_banner",
      immediate: true,
    });
    setConsent("denied");
    setConsentState("denied");
    flushSignals(false);
  }, []);

  const reopenConsent = useCallback(() => {
    clearConsent();
    setConsentState("pending");
  }, []);

  const value = useMemo(
    () => ({ consent, grantConsent, denyConsent, reopenConsent, track }),
    [consent, grantConsent, denyConsent, reopenConsent]
  );

  return <SignalContext.Provider value={value}>{children}</SignalContext.Provider>;
}

export function useSignals(): SignalContextValue {
  const ctx = useContext(SignalContext);
  if (!ctx) throw new Error("useSignals must be used within SignalProvider");
  return ctx;
}
