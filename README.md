# SteadyTalk

Marketing site for **SteadyTalk**: paid, non-psychiatric consultation you can rent (book an hour).
Not therapy. Not psychiatry. Not diagnosis or treatment.

**v2** is a single, continuous 3D WebGL scroll experience: one night-and-mist world where the camera drifts slowly between scenes as you scroll. A broken satellite reassembles. Eight questions are sealed in ice and thaw open when touched. An offer moment shows an hourglass, a sealed NDA envelope and a fidget spinner. A particle finale gathers into a hand, envelope or spinner depending on which CTA you hover. Consented, non-clinical behavior signals are captured throughout.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- three.js + `@react-three/fiber` + `@react-three/drei` (MeshTransmissionMaterial, Environment/Lightformer, PerformanceMonitor, useGLTF)
- GSAP + ScrollTrigger (scroll progress, scrubbed section reveals)
- framer-motion (consent banner, booking overlay)
- Local JSONL storage for preview signals and leads (`data/*.jsonl`, git-ignored)

## Run

```bash
cd /workspace/steadytalk
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
# open http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run lint
```

Testing quality tiers: append `?quality=low|mid|high` to the URL.
Dev from another host or proxy: `DEV_ORIGINS=my-preview.example.com npm run dev` (Next 16 blocks cross-origin dev resources by default; `127.0.0.1` is already allowed).

## Key routes

| Route | Role |
|-------|------|
| `/` | The full 3D scroll experience, plus an accessible HTML layer |
| `POST /api/signal` | Single event (v1) or batch `{ events: [...] }` (≤50) → `data/signals.jsonl` |
| `POST /api/lead` | Booking form → `data/leads.jsonl` |

## How it's built

```
src/
  app/page.tsx                 server: checks which /public/models/*.glb exist → <Experience>
  components/experience/       HTML layer (real text, SEO, a11y), sensors, header/footer
    Experience.tsx             capability detection, GSAP ScrollTrigger, stop positions, canvas
    Sections.tsx               hero, steady, 8 questions, offer ×3, finale
    BehaviorSensors.tsx        pace, dwell, satellite watch, idle/tab, retreat, environment
  components/three/            the 3D world (client-only, dynamically imported)
    Scene.tsx                  Canvas, lights, env, fog, PerformanceMonitor
    CameraRig.tsx              scroll → eased stop index → Catmull-Rom camera path (slow damp)
    Satellite.tsx              procedural 8-piece satellite + .glb version (same piece names)
    Crystal.tsx                ice crystals: transmission/frosted shell, edges, shards, core, glow
    Offers.tsx                 hourglass, envelope (+ .glb), spinner (+ .glb)
    ParticleFinale.tsx         point field morphing between cloud / hand / envelope / spinner
    Atmosphere.tsx             dust + peripheral debris (+ .glb)
    ModelSlot.tsx              Suspense + error boundary: .glb or procedural fallback
  lib/
    world.ts                   stop layout shared by HTML + 3D
    experience.ts              UI store + all interaction → signal logic
    signals.ts                 consent-gated, batched tracker (5s / visibilitychange / pagehide)
    device.ts                  GPU/device tier detection + per-tier settings
    models.ts                  expected .glb files and node names
```

### Experience

- **Calm pacing:** the camera follows scroll with a slow exponential damp (never jumps, even on fast flicks). Each segment is eased so the camera *settles* at every stop. There's a slow ~25s "breathing" sway and gentle pointer parallax.
- **Hero:** procedural satellite (body, panels, arms, dish, antenna, thruster) drifts apart. Scrolling to "Getting steady" reassembles it piece by piece, and its panels power on.
- **Questions in ice:** each crystal has a frosted or transmission shell, crystalline edges, a glowing core stone and a glow sprite. Hover makes it glow; click or the HTML button thaws it (shell expands and dissolves, shards burst out, core brightens) and the question text scrambles, then resolves. Click again to refreeze.
- **Offer:** hourglass (rent an hour), envelope (click: seal breaks, flap opens), spinner (spins on hover, flick by dragging, or use the button). Plain-language disclaimer.
- **Finale:** ~1.4k–7k points gather into a hand ("Book"), an envelope ("NDA") or a spinner ("Aid") on hover/focus. On touch devices it cycles on its own. "Book a SteadyTalk hour" opens the lead form in a calm overlay (focus-trapped, Esc to close).

### Accessibility & fallbacks

- All copy is real HTML (headings, buttons, landmarks). Animated glyphs are `aria-hidden`, the real text sits alongside as `sr-only`. Every 3D interaction has an HTML button equivalent with `aria-expanded`.
- `prefers-reduced-motion` or no WebGL → no canvas: static backdrop, plain text, no scramble. A header **Still mode** toggle does the same on demand (remembered).
- **Tiers** (`src/lib/device.ts`), from WebGL renderer, cores, memory, screen size and touch:

| | high (desktop GPU) | mid (phones/tablets, ≤4 cores) | low (weak/software GPU, ≤2GB) |
|---|---|---|---|
| DPR | ≤1.75 | ≤1.5 | 0.75–1.25 |
| Crystal material | MeshTransmissionMaterial (shared transmission pass, chromatic aberration) | frosted MeshPhysical (no transmission) | frosted MeshPhysical |
| Finale particles | 7000 | 3200 | 1400 |
| Dust / debris | 900 / 22 | 420 / 12 | 160 / 6 |
| Antialias, parallax | on | on | off |

  drei `PerformanceMonitor` also lowers DPR at runtime if FPS drops. The finale only simulates when the camera is near it. Portrait screens pull the camera back and scale the fog to match.

## Drop-in 3D models (Meshy)

Put `.glb` files in `public/models/`. Missing ones fall back to procedural placeholders. Full spec: [`public/models/README.md`](public/models/README.md).

| File | Expected node names |
|---|---|
| `satellite.glb` | `body`, `panel_left`, `panel_right`, `dish`, `antenna`, `arm_left`, `arm_right`, `thruster` (assembled pose) |
| `spinner.glb` | `spinner_rotor` (spins on +Y), `spinner_core` |
| `envelope.glb` | `envelope_body`, `envelope_flap` (pivot on hinge), `envelope_seal` |
| `question-stone.glb` | one stone, or `stone_01`…`stone_08` |
| `debris.glb` | `debris_01`…`debris_06` (any count) |

## Consent & signals

- Soft banner first. Nothing is stored without "Yes". "No thanks" stores only the denial and drops the queue. Footer **Privacy choices** reopens the choice.
- Batched client-side, flushed every 5s and on tab hide / page hide (`sendBeacon`).
- Allowed tags only (server-validated). v1: `curiosity_open`, `topic_affinity`, `hesitation_dwell`, `readiness_reachout`, `trust_interest_nda`, `tangible_interest_aid`, `scroll_depth_milestone`, `return_revisit`, `consent_granted`, `consent_denied`. v2 (engagement-only): `pace_band`, `attention_dwell`, `sequence_path`, `settle_watch`, `cta_retreat`, `presence_idle`, `environment_flag`.
- Full action → signal → hypothesis → NEVER-claim map: [`docs/SIGNAL_MAP.md`](docs/SIGNAL_MAP.md).

### Sample batch

```json
{
  "events": [
    {
      "visitorId": "1ba4bf6a-f1ab-4282-ac68-576d29064ed3",
      "sessionId": "d2820522-c0d4-476a-97d3-3b145f011864",
      "event": "question_open_order",
      "signal": "sequence_path",
      "targetId": "q-who-to-say",
      "path": "/",
      "scrollPct": 15,
      "ts": "2026-10-08T17:13:47.011Z",
      "uaHash": "66c0252f",
      "meta": { "order": 1, "sequence": "Q1", "inPageOrder": true }
    }
  ]
}
```

### Sample lead

```json
{ "name": "Alex", "email": "alex@example.com", "mind": "Circling a work decision.", "visitorId": "…", "sessionId": "…", "consent": true }
```

## Production storage

Preview writes append-only JSONL under `data/` (`src/lib/storage.ts`). Vercel's filesystem is ephemeral, so swap before launch:

```ts
// Vercel KV / Upstash Redis
import { kv } from "@vercel/kv";
await kv.lpush("steadytalk:signals", JSON.stringify(record));
```

```sql
-- Postgres / Neon
INSERT INTO signals (visitor_id, session_id, event, signal, target_id, path, scroll_pct, dwell_ms, ts, ua_hash, meta)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
```

Keep the same payload shape. In the batch route, insert all valid events in one statement.

## Ethics

- Signals are **engagement hypotheses**, never diagnoses. No clinical words in tags, UI or claims.
- Consent copy: signals improve SteadyTalk and prepare better conversations, and are **not** medical assessment.
- Disclaimers near the CTAs, in the overlay, and in the footer: not healthcare, no diagnosis or treatment, not a substitute for licensed care, crisis → emergency services or a licensed professional.
- **A licensed psychologist should review the question bank and the signal map before public launch.**

## Deploy on Vercel

1. The repo is on GitHub (`sameeraajaz/therapyweneed`). Import it in Vercel (framework: Next.js; `vercel.json` sets region `iad1`).
2. Before real traffic, move signals/leads to KV or Postgres (see above).
3. Deploy. No payments or NDA e-sign yet (placeholders only).

## Out of scope (this build)

Real payments · real NDA e-sign · clinical claims or diagnostic language.
