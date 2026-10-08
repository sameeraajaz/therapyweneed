# SteadyTalk signal map (non-clinical)

This document maps UI actions → signal tags → **engagement hypotheses only**.  
Signals help SteadyTalk improve the site and prepare better conversations. They are **never** diagnoses, clinical assessments, or mental-health labels.

> **Launch gate:** A licensed psychologist (or equivalent clinical advisor) should review the question bank and this map before public launch. Product must not invent clinical claims.

## Allowed signal tags

| Tag | Meaning (hypothesis only) |
|-----|---------------------------|
| `curiosity_open` | Visitor opened / engaged with exploratory content |
| `topic_affinity` | Visitor showed interest in a life/work/relationship/decision theme |
| `hesitation_dwell` | Visitor lingered on an open question (~4.5s+) — possible pause / weighing |
| `readiness_reachout` | Visitor moved toward booking / form / CTA |
| `trust_interest_nda` | Visitor engaged with NDA / privacy framing |
| `tangible_interest_aid` | Visitor engaged with grounding-aid framing |
| `scroll_depth_milestone` | Visitor reached 25 / 50 / 75 / 100% scroll |
| `return_revisit` | Returning visitor (localStorage seen-before flag) |
| `consent_granted` | Visitor consented to behavioral signal storage |
| `consent_denied` | Visitor declined behavioral signal storage |

**Do not invent additional clinical tags.** If you need a new tag, add it here first and keep it engagement-only.

## UI action → signal

| UI action | `event` | `signal` | `targetId` (examples) | What we may infer (hypothesis) | What we must NEVER claim |
|-----------|---------|----------|------------------------|--------------------------------|---------------------------|
| Consent accept | `consent_update` | `consent_granted` | `consent_banner` | Permission to store signals | Medical consent; clinical enrollment |
| Consent decline | `consent_update` | `consent_denied` | `consent_banner` | Preference against tracking | Fear, paranoia, avoidance disorder |
| Session boot (post-consent) | `session_start` | `curiosity_open` | `page` | Started exploring | Anxiety / seeking help clinically |
| Return visit detected | `session_start` | `return_revisit` | `session` | Came back | Obsession; clinical severity |
| Scroll 25/50/75/100% | `scroll_milestone` | `scroll_depth_milestone` | `scroll_25` … | Depth of page engagement | “Rumination” or distress level |
| Open a question card | `question_open` | `curiosity_open` | `q-*` | Opened a prompt | Diagnosis matching the prompt text |
| Open a question card | `question_open` | `topic_affinity` | `q-*` | Affinity for that topic bucket | Clinical subtype / comorbidity |
| Keep question open ≥ ~4.5s | `question_dwell` | `hesitation_dwell` | `q-*` | Lingering / reading carefully | Ambivalence as pathology |
| Close question | `question_close` | `curiosity_open` | `q-*` | Ended that interaction | Rejection of care |
| Open NDA question / about NDA | `nda_learn_more` | `trust_interest_nda` | `q-private-space`, `about_nda` | Interest in privacy guarantees | Trauma history; secrecy pathology |
| Open aid question / about aid | `aid_learn_more` | `tangible_interest_aid` | `q-hands-busy`, `about_aid` | Interest in tangible companion | ADHD, anxiety disorder, self-soothing pathology |
| Header / form focus / NDA placeholder | `cta_click` | `readiness_reachout` | `header_cta`, `lead_form_focus`, … | Approach toward outreach | Commitment to treatment |
| Lead form submit | `cta_submit` | `readiness_reachout` | `lead_form` | Intent to start a conversation | Clinical intake complete |
| About “rent time” card | `section_view` | `curiosity_open` | `about_rent-time` | Explored offer model | Understanding of “therapy” |

## Topic language (questions)

Allowed topic buckets: **life**, **work**, **relationship**, **decision**.

Allowed framing: fog, heaviness of a day, career walls, hard conversations, circling choices, privacy, hands needing something to hold.

**Forbidden as diagnoses or labels in UI or analytics claims:** anxiety, depression, ADHD, trauma, PTSD, bipolar, OCD, etc. as clinical assertions. Everyday vernacular in a visitor’s free-text lead note is theirs; SteadyTalk still must not classify it clinically.

## Event payload (stored)

See README for the full JSON schema. Core fields:

`visitorId`, `sessionId`, `event`, `signal`, `targetId`, `path`, `scrollPct`, `dwellMs`, `ts`, `uaHash`

- `visitorId` is anonymous (UUID in localStorage), created when consent is granted (or for consent events).
- `uaHash` is a short hash of user-agent — **not** raw UA, IP, or other PII.
- No cookies of profiling without consent.

## Ethics notes

1. Consent banner must appear before any stored tracking beyond essential function.
2. Copy must state signals improve SteadyTalk and prepare better conversations — **not** medical assessment.
3. Hypotheses inform product and conversation prep; they do not authorize clinical language in outreach.
4. Crisis: site disclaimers point to emergency / licensed help — SteadyTalk is not that help.
5. Licensed review of question bank before public launch is mandatory for this product’s integrity.
