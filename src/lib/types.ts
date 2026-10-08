/** Allowed non-clinical engagement signal tags only. */
export const SIGNAL_TAGS = [
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
] as const;

export type SignalTag = (typeof SIGNAL_TAGS)[number];

export type SignalEventName =
  | "question_open"
  | "question_close"
  | "question_dwell"
  | "cta_click"
  | "cta_submit"
  | "nda_learn_more"
  | "aid_learn_more"
  | "scroll_milestone"
  | "session_start"
  | "consent_update"
  | "section_view";

export interface SignalPayload {
  visitorId: string;
  sessionId: string;
  event: SignalEventName | string;
  signal: SignalTag;
  targetId?: string;
  path: string;
  scrollPct?: number;
  dwellMs?: number;
  ts: string;
  uaHash: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface LeadPayload {
  name: string;
  email: string;
  mind: string;
  visitorId?: string;
  sessionId?: string;
  consent?: boolean;
}

export interface QuestionItem {
  id: string;
  topic: "life" | "work" | "relationship" | "decision";
  prompt: string;
  whisper: string;
}
