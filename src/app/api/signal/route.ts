import { NextResponse } from "next/server";
import { appendJsonl } from "@/lib/storage";
import { SIGNAL_TAGS, type SignalPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidPayload(body: unknown): body is SignalPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.visitorId !== "string" || !b.visitorId) return false;
  if (typeof b.sessionId !== "string" || !b.sessionId) return false;
  if (typeof b.event !== "string" || !b.event) return false;
  if (typeof b.signal !== "string") return false;
  if (!(SIGNAL_TAGS as readonly string[]).includes(b.signal)) return false;
  if (typeof b.path !== "string") return false;
  if (typeof b.ts !== "string") return false;
  if (typeof b.uaHash !== "string") return false;
  return true;
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : null;
    }

    if (!isValidPayload(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const record = {
      ...body,
      receivedAt: new Date().toISOString(),
    };

    await appendJsonl("signals.jsonl", record);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[signal]", err);
    return NextResponse.json({ error: "Failed to store signal" }, { status: 500 });
  }
}
