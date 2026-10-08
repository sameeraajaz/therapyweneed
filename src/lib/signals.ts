"use client";

import type { SignalEventName, SignalPayload, SignalTag } from "./types";
import { SIGNAL_TAGS } from "./types";
import { hashString } from "./hash";

const VISITOR_KEY = "st_visitor_id";
const CONSENT_KEY = "st_consent";
const SESSION_KEY = "st_session_id";
const RETURN_KEY = "st_seen_before";

export function isValidSignal(tag: string): tag is SignalTag {
  return (SIGNAL_TAGS as readonly string[]).includes(tag);
}

export function getConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "granted" || v === "denied") return v;
  return null;
}

export function setConsent(value: "granted" | "denied"): void {
  localStorage.setItem(CONSENT_KEY, value);
}

export function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function checkReturnVisit(): boolean {
  const seen = localStorage.getItem(RETURN_KEY);
  if (seen) return true;
  localStorage.setItem(RETURN_KEY, "1");
  return false;
}

export function getUaHash(): string {
  return hashString(navigator.userAgent || "unknown");
}

export function getScrollPct(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const height = doc.scrollHeight - doc.clientHeight;
  if (height <= 0) return 0;
  return Math.min(100, Math.round((scrollTop / height) * 100));
}

type EmitOpts = {
  event: SignalEventName | string;
  signal: SignalTag;
  targetId?: string;
  dwellMs?: number;
  meta?: Record<string, string | number | boolean | null>;
  /** Force send even without consent (only for consent_granted / consent_denied). */
  force?: boolean;
};

export async function emitSignal(opts: EmitOpts): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isValidSignal(opts.signal)) return;

  const consent = getConsent();
  const isConsentEvent =
    opts.signal === "consent_granted" || opts.signal === "consent_denied";

  if (!opts.force && !isConsentEvent && consent !== "granted") {
    return;
  }

  // Essential: visitor id only created when we actually store (or consent event).
  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();

  const payload: SignalPayload = {
    visitorId,
    sessionId,
    event: opts.event,
    signal: opts.signal,
    targetId: opts.targetId,
    path: window.location.pathname,
    scrollPct: getScrollPct(),
    dwellMs: opts.dwellMs,
    ts: new Date().toISOString(),
    uaHash: getUaHash(),
    meta: opts.meta,
  };

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/signal", blob);
      if (ok) return;
    }
    await fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Silent fail — never block UX for analytics
  }
}
