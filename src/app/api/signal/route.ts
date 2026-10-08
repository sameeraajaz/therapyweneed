import { NextResponse } from "next/server";
import { appendJsonl } from "@/lib/storage";
import { SIGNAL_TAGS, type SignalPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH = 50;

function cleanMeta(meta: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  let n = 0;
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    if (n++ >= 16) break;
    if (v === null || typeof v === "number" || typeof v === "boolean") out[k.slice(0, 40)] = v;
    else if (typeof v === "string") out[k.slice(0, 40)] = v.slice(0, 200);
  }
  return out;
}

function validate(body: unknown): SignalPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const str = (v: unknown, max = 120) => (typeof v === "string" && v.length > 0 ? v.slice(0, max) : null);
  const visitorId = str(b.visitorId, 80);
  const sessionId = str(b.sessionId, 80);
  const event = str(b.event, 60);
  const path = typeof b.path === "string" ? b.path.slice(0, 200) : null;
  const ts = str(b.ts, 40);
  const uaHash = str(b.uaHash, 32);
  if (!visitorId || !sessionId || !event || path === null || !ts || !uaHash) return null;
  if (typeof b.signal !== "string" || !(SIGNAL_TAGS as readonly string[]).includes(b.signal)) return null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  return {
    visitorId,
    sessionId,
    event,
    signal: b.signal as SignalPayload["signal"],
    targetId: str(b.targetId, 80) ?? undefined,
    path,
    scrollPct: num(b.scrollPct),
    dwellMs: num(b.dwellMs),
    ts,
    uaHash,
    meta: cleanMeta(b.meta),
  };
}

/**
 * Accepts either a single event (v1) or a batch: { events: SignalPayload[] }.
 * Only allowed, non-clinical signal tags are stored.
 */
export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body: unknown = text ? JSON.parse(text) : null;
    const raw: unknown[] =
      body && typeof body === "object" && Array.isArray((body as { events?: unknown }).events)
        ? ((body as { events: unknown[] }).events).slice(0, MAX_BATCH)
        : [body];

    const receivedAt = new Date().toISOString();
    const valid = raw.map(validate).filter((e): e is SignalPayload => e !== null);
    if (valid.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    for (const e of valid) await appendJsonl("signals.jsonl", { ...e, receivedAt });
    return NextResponse.json({ ok: true, stored: valid.length, rejected: raw.length - valid.length });
  } catch (err) {
    console.error("[signal]", err);
    return NextResponse.json({ error: "Failed to store signal" }, { status: 500 });
  }
}
