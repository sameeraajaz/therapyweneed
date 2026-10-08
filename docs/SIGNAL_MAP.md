# SteadyTalk signal map (non-clinical) — v2

This document maps every tracked UI action → `event` → `signal` tag → **what we may infer (engagement hypothesis only)** → **what we must NEVER claim**.

Signals exist to improve SteadyTalk and to prepare better conversations. They are **never** diagnoses, assessments, screening results, risk scores, or mental-health labels, and they are never shown back to a visitor as a judgement about them.

> **Launch gate:** a licensed psychologist (or equivalent licensed clinical advisor) must review the question bank (`src/lib/questions.ts`) **and this signal map** before public launch. Product must not invent clinical claims.

## Ground rules

1. **Consent first.** Nothing is queued or stored until the visitor taps "Yes, that's fine". The only exceptions are the `consent_granted` / `consent_denied` events themselves. Declining drops any unsent queue. "Privacy choices" in the footer reopens the choice.
2. **Allowed tags only.** The server (`/api/signal`) rejects any tag not in `SIGNAL_TAGS` (`src/lib/types.ts`). A new tag must be added here first (with its NEVER-claim rule), then to `SIGNAL_TAGS`.
3. **No clinical vocabulary.** Never use diagnostic or condition names (any mental-health diagnosis, disorder, or symptom term) in tags, event names, `meta` values, UI copy, reports, or outreach.
4. **Patterns, not people.** A signal describes an interaction ("lingered 6s on Q3"), not a trait of the person ("is indecisive"). Hypotheses are aggregated to improve content and pacing. Individual signals may help a consultant prepare *topics*, never conclusions.
5. **Environment ≠ trait.** Device tier, reduced-motion and still-mode are rendering context. They never imply anything about the person.
6. **No raw PII in signals.** `visitorId` is a random UUID in localStorage. `uaHash` is a short non-reversible hash of the user agent. No IP, no raw UA, no free text. (The lead form is separate, explicit, and only stores what the person types.)

## Allowed signal tags

| Tag | Since | Meaning (hypothesis only) |
|-----|-------|---------------------------|
| `curiosity_open` | v1 | Opened or engaged with exploratory content |
| `topic_affinity` | v1 | First open of a question in a topic bucket (life / work / relationships / decisions / privacy / hands) |
| `hesitation_dwell` | v1 (redefined v2) | Hovered or focused something for a while **without acting** (crystal hover without thawing) |
| `readiness_reachout` | v1 | Moved toward outreach: CTA hover ≥250ms, CTA click, form submit |
| `trust_interest_nda` | v1 | Engaged with NDA / privacy framing |
| `tangible_interest_aid` | v1 | Engaged with the grounding-aid framing or the spinner |
| `scroll_depth_milestone` | v1 | Reached 25 / 50 / 75 / 100% of the page |
| `return_revisit` | v1 | Browser has visited before (localStorage flag), once per session |
| `consent_granted` | v1 | Agreed to signal storage |
| `consent_denied` | v1 | Declined signal storage |
| `pace_band` | **v2** | Scroll pace settled into `slow` / `steady` / `fast` (viewport-heights per second) |
| `attention_dwell` | **v2** | Time a question was in view, or time spent reading an opened question before resealing |
| `sequence_path` | **v2** | Order in which questions were first opened; re-opens of a question |
| `settle_watch` | **v2** | How long the visitor took to scroll through the satellite reassembly |
| `cta_retreat` | **v2** | Hovered "Book" then scrolled away without clicking, or closed the booking overlay without sending |
| `presence_idle` | **v2** | No input for 30s (idle start/end); tab hidden / returned |
| `environment_flag` | **v2** | Rendering context: reduced-motion, still mode, device tier, WebGL, touch, viewport bucket |

## UI action → signal

### Consent & session

| UI action | `event` | `signal` | `targetId` | `meta` / `dwellMs` | May infer (hypothesis) | NEVER claim |
|---|---|---|---|---|---|---|
| Consent accept | `consent_update` | `consent_granted` | `consent_banner` | — | Permission to store signals | Medical/clinical consent, enrolment, or a care relationship |
| Consent decline | `consent_update` | `consent_denied` | `consent_banner` | — | Preference not to be tracked | Anything about the person's character, fears, or trust |
| First page view of a session (after consent) | `session_start` | `curiosity_open` | `page` | — | Began exploring | A reason for visiting, need, or distress |
| Returning browser (once per session) | `session_start` | `return_revisit` | `session` | — | Came back | Urgency, severity, or dependence |
| Environment (once per session) | `environment` | `environment_flag` | `device` | `reducedMotion`, `stillMode`, `renderMode`, `tier`, `webgl`, `touch`, `viewport` | Which experience they actually saw (for QA and pacing) | Any trait, sensitivity, or condition. Reduced motion is an OS setting, nothing more |
| Toggle "Still mode" | `still_mode_toggle` | `environment_flag` | `header_still` | `on` | Preferred a calmer rendering | Overwhelm, sensitivity, or any state of mind |

### Scroll & presence

| UI action | `event` | `signal` | `targetId` | `meta` / `dwellMs` | May infer (hypothesis) | NEVER claim |
|---|---|---|---|---|---|---|
| Reach 25/50/75/100% | `scroll_milestone` | `scroll_depth_milestone` | `scroll_25`… | `milestone` | Depth of engagement with the story | Distress level, or that they "need help" |
| Scroll pace settles into a band (held ≥0.9s, ≤1 per 4s) | `scroll_pace` | `pace_band` | `page` | `band` (slow/steady/fast), `vhPerSec` | Pace hypothesis: lingering vs skimming; informs section length and copy density | Restlessness, impatience, agitation, or calm as a personal state |
| No input for 30s | `idle_start` | `presence_idle` | `page` | `thresholdMs` | Paused, stepped away, or reading | Absence of mind, avoidance, low mood |
| Input after idle | `idle_end` | `presence_idle` | `page` | `dwellMs` = idle duration | Length of pause | Same as above |
| Tab hidden | `tab_hidden` | `presence_idle` | `tab` | `state: hidden` | Switched away | Distraction, avoidance |
| Tab visible again | `tab_return` | `presence_idle` | `tab` | `dwellMs` = time away | Came back to the page after N seconds | Ambivalence or rumination |

### Hero: satellite reassembly

| UI action | `event` | `signal` | `targetId` | `meta` / `dwellMs` | May infer (hypothesis) | NEVER claim |
|---|---|---|---|---|---|---|
| Scroll through the reassembly (start at >2%, end at ≥98% or back to 0) | `satellite_watch` | `settle_watch` | `hero_satellite` | `dwellMs`, `completed`, `maxAssembly`, `pass` (≤5), `jumped` | Whether the opening visual metaphor held attention, and for how long | That the person is "broken", "scattered", or "settling", or any reading of the metaphor as being about them |

### Questions in ice (×8)

| UI action | `event` | `signal` | `targetId` | `meta` / `dwellMs` | May infer (hypothesis) | NEVER claim |
|---|---|---|---|---|---|---|
| Thaw a question (crystal click or HTML button) | `question_open` | `curiosity_open` | `q-*` | `topic`, `source` (crystal/html), `first` | Opened that prompt | That the prompt describes the person's life |
| First thaw of that question | `question_open` | `topic_affinity` | `q-*` | `topic` | Interest in a topic bucket | A problem area, condition, or risk |
| First thaw of that question | `question_open_order` | `sequence_path` | `q-*` | `order`, `sequence` (e.g. `Q3>Q1>Q6`), `inPageOrder` | Which prompts resonate first. Exploring vs linear reading | Priority of "issues", or severity ranking |
| Thaw again after resealing | `question_reopen` | `sequence_path` | `q-*` | `reopens`, `topic` | Prompt worth returning to | Fixation, preoccupation |
| Reseal an opened question | `question_close` | `attention_dwell` | `q-*` | `dwellMs` = reading time, `topic`, `source` | How long the whisper text was read | Emotional reaction to the text |
| Question section in view (≥60%) then leaves / tab hides | `crystal_in_view` | `attention_dwell` | `q-*` | `dwellMs` (≥800ms), `opened`, `reason` | Attention per prompt, opened or not | That not opening means "avoidance" |
| Hover/focus a crystal ≥600ms **without** thawing | `crystal_hover_no_open` | `hesitation_dwell` | `q-*` | `dwellMs`, `topic`, `source` | A pause before choosing; candidate for clearer affordance or softer copy | Fear, avoidance, inner conflict |
| Thaw "Where can this stay private?" | `nda_learn_more` | `trust_interest_nda` | `q-private` | — | Privacy matters to them | Secrets, shame, past harm |
| Thaw "What if my hands need something…?" | `aid_learn_more` | `tangible_interest_aid` | `q-hands` | — | Interest in the grounding aid | Any condition, symptom, or "need to self-soothe" |

### Offer moment

| UI action | `event` | `signal` | `targetId` | `meta` / `dwellMs` | May infer (hypothesis) | NEVER claim |
|---|---|---|---|---|---|---|
| Break the envelope seal (3D click or button) | `nda_seal_break` | `trust_interest_nda` | `offer_nda_envelope` | `source` | Interest in confidentiality | Secrets, risk, past harm |
| Reseal envelope | `nda_reseal` | `trust_interest_nda` | `offer_nda_envelope` | `source` | Played with the object | — |
| "NDA preview (placeholder)" | `nda_preview_click` | `trust_interest_nda` | `nda_preview_placeholder` | — | Wants to read the NDA terms | Legal concern about something specific |
| Spin the spinner (hover kick, drag flick, or button), one event per spin burst (≤12/page) | `spinner_spin` | `tangible_interest_aid` | `offer_aid_spinner` | `dwellMs` = burst length until it settles, `interactions` (total), `bursts`, `peakSpeed` | Enjoyed the tangible object. Playful engagement | Restlessness, fidgeting as a symptom, any condition |

### Reach-out finale

| UI action | `event` | `signal` | `targetId` | `meta` / `dwellMs` | May infer (hypothesis) | NEVER claim |
|---|---|---|---|---|---|---|
| Hover/focus a finale CTA ≥250ms (particles form hand / envelope / spinner) | `cta_hover` | `readiness_reachout` | `cta_book`, `cta_nda`, `cta_aid` | `dwellMs`, `phase: hover` | Considering that path | Commitment, or a need for care |
| Click a CTA (finale, hero, or header) | `cta_click` | `readiness_reachout` | `cta_book`, `cta_hero_book`, `cta_header`, `cta_nda`, `cta_aid` | `phase: click` | Moved toward outreach | Intent to seek treatment |
| Hovered "Book", then scrolled away without clicking (once per page) | `cta_retreat` | `cta_retreat` | `cta_book` | `from: scroll_away` | Not ready yet, or wanted more info first. Candidate for gentler copy | Fear, avoidance, resistance, or anything about their state |
| Closed booking overlay without sending | `cta_retreat` | `cta_retreat` | `lead_overlay` | `from: overlay_closed` | Form friction or timing | Same as above |
| Submit lead form | `cta_submit` | `readiness_reachout` | `lead_form` | — | Wants a conversation | Clinical intake, or the start of treatment |

## Stored event shape

```json
{
  "visitorId": "uuid (localStorage, random)",
  "sessionId": "uuid (sessionStorage, random)",
  "event": "question_open_order",
  "signal": "sequence_path",
  "targetId": "q-work-fog",
  "path": "/",
  "scrollPct": 31,
  "dwellMs": null,
  "ts": "client ISO time",
  "uaHash": "8-char hash",
  "meta": { "order": 2, "sequence": "Q1>Q3", "inPageOrder": true },
  "receivedAt": "server ISO time"
}
```

Batching: the client queues events and flushes every 5s, on `visibilitychange` (hidden) and on `pagehide` (via `sendBeacon`), up to 40 per request. The server accepts a single event (v1) or `{ "events": [...] }` (max 50), validates each one, drops unknown tags, and clips strings and `meta` (≤16 primitive keys).

## Topic language (question bank)

Allowed buckets: **life, work, relationships, decisions, privacy, hands**.
Allowed framing: fog, heaviness of a day, career walls, hard conversations, circling choices, privacy, wanting something to hold.
Not allowed: any diagnostic, condition, or symptom framing in prompts, whispers, tags, or claims. A visitor's own words in the lead form are theirs. SteadyTalk still never classifies them clinically.

## What hypotheses are for

- **Content & pacing:** which prompts resonate, where people pause, where they leave, whether the satellite moment is too long.
- **Conversation prep (with consent):** a consultant may see that someone opened the "work fog" and "hard conversation" prompts, so they can offer those topics. They must never open with a conclusion about the person.
- **Never for:** clinical inference, risk scoring, pricing differences, ad targeting, or sharing with third parties.

## Crisis & scope

Disclaimers near every CTA, in the booking overlay, and in the footer state that SteadyTalk is paid consultation, not healthcare; does not diagnose or treat; is not a substitute for licensed care; and that anyone in crisis should contact emergency services or a licensed professional. No signal, pattern, or combination of signals is used to detect or assess crisis. That is outside SteadyTalk's competence and scope.
