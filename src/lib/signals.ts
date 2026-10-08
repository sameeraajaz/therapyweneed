"use client";

/**
 * Client-side signal tracker (consent-gated, batched).
 *
 * - Nothing is queued or stored unless consent === "granted",
 *   except the consent_granted / consent_denied events themselves.
 * - Events are batched and flushed every 5s, on visibilitychange (hidden)
 *   and on pagehide, using sendBeacon when available.
 * - Only allowed, non-clinical tags from SIGNAL_TAGS are accepted.
 */

import type { SignalMeta, SignalPayload, SignalTag } from "./types";
import { SIGNAL_TAGS } from "./types";
import { hashString } from "./hash";

const VISITOR_KEY = "st_visitor_id";
const CONSENT_KEY = "st_consent";
const SESSION_KEY = "st_session_id";
const RETURN_KEY = "st_seen_before";

const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH = 40;
const MAX_QUEUE = 200;

export type ConsentValue = "granted" | "denied";

export function isValidSignal(tag: string): tag is SignalTag {
  return (SIGNAL_TAGS as readonly string[]).includes(tag);
}

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {
    /* storage blocked */
  }
  return null;
}

export function setConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore */
  }
}

function uuid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid("v");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid("s");
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon-session";
  }
}

/** True if this browser has visited before (sets the flag on first call). */
export function checkReturnVisit(): boolean {
  try {
    const seen = localStorage.getItem(RETURN_KEY);
    if (seen) return true;
    localStorage.setItem(RETURN_KEY, "1");
  } catch {
    /* ignore */
  }
  return false;
}

let cachedUaHash: string | null = null;
export function getUaHash(): string {
  if (!cachedUaHash) cachedUaHash = hashString(navigator.userAgent || "unknown");
  return cachedUaHash;
}

export function getScrollPct(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const height = doc.scrollHeight - doc.clientHeight;
  if (height <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((scrollTop / height) * 100)));
}

/* ------------------------------------------------------------------ */
/* Batched queue                                                       */
/* ------------------------------------------------------------------ */

let queue: SignalPayload[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let lifecycleBound = false;

function send(events: SignalPayload[], useBeacon: boolean): void {
  if (events.length === 0) return;
  const body = JSON.stringify({ events });
  try {
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        "/api/signal",
        new Blob([body], { type: "application/json" })
      );
      if (ok) return;
    }
    void fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* never block UX for analytics */
    });
  } catch {
    /* ignore */
  }
}

export function flushSignals(useBeacon = false): void {
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_BATCH);
    send(batch, useBeacon);
  }
}

/** Drop anything not yet sent (used when consent is withdrawn). */
export function clearQueue(): void {
  queue = [];
}

function ensureLifecycle(): void {
  if (typeof window === "undefined") return;
  if (!timer) {
    timer = setInterval(() => flushSignals(false), FLUSH_INTERVAL_MS);
  }
  if (!lifecycleBound) {
    lifecycleBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushSignals(true);
    });
    window.addEventListener("pagehide", () => flushSignals(true));
  }
}

export type TrackOpts = {
  event: string;
  signal: SignalTag;
  targetId?: string;
  dwellMs?: number;
  meta?: SignalMeta;
  /** Flush right away (consent events). */
  immediate?: boolean;
};

/** Queue a signal. No-op without consent (consent_* events excepted). */
export function track(opts: TrackOpts): void {
  if (typeof window === "undefined") return;
  if (!isValidSignal(opts.signal)) return;

  const isConsentEvent =
    opts.signal === "consent_granted" || opts.signal === "consent_denied";
  if (!isConsentEvent && getConsent() !== "granted") return;

  const payload: SignalPayload = {
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    event: opts.event,
    signal: opts.signal,
    targetId: opts.targetId,
    path: window.location.pathname,
    scrollPct: getScrollPct(),
    dwellMs:
      typeof opts.dwellMs === "number" ? Math.max(0, Math.round(opts.dwellMs)) : undefined,
    ts: new Date().toISOString(),
    uaHash: getUaHash(),
    meta: opts.meta,
  };

  queue.push(payload);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
  ensureLifecycle();
  if (opts.immediate) flushSignals(false);
}

/** v1 compatibility shim. */
export async function emitSignal(opts: TrackOpts & { force?: boolean }): Promise<void> {
  track(opts);
}
