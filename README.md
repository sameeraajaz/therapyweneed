# SteadyTalk

Marketing site for **SteadyTalk** — paid non-psychiatric consultation you can rent (book time).  
Not therapy. Not psychiatry. Not diagnosis or treatment.

This is a calm, scrollable Next.js experience: question journey, soft motion, consented behavioral signals (engagement hypotheses only), and a simple outreach form.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- framer-motion for section reveals / question expand
- Local JSONL storage for preview signals & leads (`data/*.jsonl`)

## Path

```
/workspace/steadytalk
```

## Run locally

```bash
cd /workspace/steadytalk
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve production build
```

## Key routes

| Route | Role |
|-------|------|
| `/` | Full calm scroll homepage |
| `POST /api/signal` | Store consented (or consent-*) behavior events → `data/signals.jsonl` |
| `POST /api/lead` | Outreach form → `data/leads.jsonl` |

## Consent & signals

1. Soft banner appears before stored tracking beyond essential.
2. On **Yes**, `localStorage` keys: `st_consent=granted`, anonymous `st_visitor_id`, session `st_session_id`.
3. On **No**, `st_consent=denied` — no further signal storage (except the denial event itself).
4. Allowed `signal` tags only — see [`docs/SIGNAL_MAP.md`](docs/SIGNAL_MAP.md).

### Sample signal payload

```json
{
  "visitorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sessionId": "s9f8e7d6-c5b4-3210-aaaa-bbbbccccdddd",
  "event": "question_open",
  "signal": "curiosity_open",
  "targetId": "q-steady-hour",
  "path": "/",
  "scrollPct": 42,
  "dwellMs": null,
  "ts": "2026-10-07T15:08:00.000Z",
  "uaHash": "a3f1c2b0",
  "meta": { "topic": "decision", "index": 2 }
}
```

### Sample lead payload

```json
{
  "name": "Alex",
  "email": "alex@example.com",
  "mind": "Circling a work decision and want a steady hour.",
  "visitorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sessionId": "s9f8e7d6-c5b4-3210-aaaa-bbbbccccdddd",
  "consent": true
}
```

## Swapping storage (production)

Preview writes append-only JSONL under `data/` via `src/lib/storage.ts`.

**Vercel KV** (example):

```ts
import { kv } from "@vercel/kv";
await kv.lpush("steadytalk:signals", JSON.stringify(record));
```

**Postgres / Neon** (example):

```sql
INSERT INTO signals (visitor_id, session_id, event, signal, target_id, path, scroll_pct, dwell_ms, ts, ua_hash, meta)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
```

Keep the same payload shape. On Vercel serverless, prefer KV/Postgres — local filesystem is ephemeral.

## Ethics

- Signals are **engagement hypotheses**, never diagnoses.
- Copy states: improving SteadyTalk and preparing better conversations — **not** medical assessment.
- Footer + CTA disclaimers: not healthcare; no diagnosis/treatment; not a substitute for licensed care; crisis → emergency / licensed help.
- A licensed psychologist should review the question bank before public launch (`docs/SIGNAL_MAP.md`).

## Deploy on Vercel

1. Push this repo (or link `/workspace/steadytalk`) to GitHub.
2. Import the project in Vercel (framework: Next.js). `vercel.json` sets region `iad1`.
3. For production signals/leads, add KV or Postgres and update `src/lib/storage.ts`.
4. Deploy. No payments or NDA e-sign in this build — placeholders only.

```bash
# optional CLI (when authenticated)
npx vercel --prod
```

## Out of scope (this build)

- Real payments
- Real NDA e-sign
- Clinical claims or diagnostic language
