/**
 * Allowed NON-CLINICAL engagement signal tags only.
 * Every tag here must be documented in docs/SIGNAL_MAP.md first
 * (UI action → hypothesis → what we must NEVER claim).
 */
export const SIGNAL_TAGS = [
  // v1
  "curiosity_open",
  "topic_affinity",
  "hesitation_dwell",
  "readiness_reachout",
  "trust_interest_nda",
  "tangible_interest_aid",
  "scroll_depth_milestone",
  "return_revisit",
  "consent_granted",
  "consent_denied",
  // v2 (engagement-only, documented in SIGNAL_MAP.md)
  "pace_band",
  "attention_dwell",
  "sequence_path",
  "settle_watch",
  "cta_retreat",
  "presence_idle",
  "environment_flag",
] as const;

export type SignalTag = (typeof SIGNAL_TAGS)[number];

export type MetaValue = string | number | boolean | null;
export type SignalMeta = Record<string, MetaValue>;

export interface SignalPayload {
  visitorId: string;
  sessionId: string;
  event: string;
  signal: SignalTag;
  targetId?: string;
  path: string;
  scrollPct?: number;
  dwellMs?: number;
  ts: string;
  uaHash: string;
  meta?: SignalMeta;
}

export interface LeadPayload {
  name: string;
  email: string;
  mind: string;
  visitorId?: string;
  sessionId?: string;
  consent?: boolean;
}

export type QuestionTopic =
  | "life"
  | "work"
  | "relationship"
  | "decision"
  | "privacy"
  | "hands";

export interface QuestionItem {
  id: string;
  /** Short code used in open-order sequences, e.g. "Q3". */
  short: string;
  topic: QuestionTopic;
  prompt: string;
  whisper: string;
}
