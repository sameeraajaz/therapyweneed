import { NextResponse } from "next/server";
import { appendJsonl } from "@/lib/storage";
import type { LeadPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitize(s: unknown, max = 500): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LeadPayload>;
    const name = sanitize(body.name, 120);
    const email = sanitize(body.email, 200).toLowerCase();
    const mind = sanitize(body.mind, 800);

    if (!name || !email || !mind) {
      return NextResponse.json(
        { error: "Name, email, and a short note are required." },
        { status: 400 }
      );
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    const record = {
      name,
      email,
      mind,
      visitorId: typeof body.visitorId === "string" ? body.visitorId : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      consent: Boolean(body.consent),
      receivedAt: new Date().toISOString(),
    };

    await appendJsonl("leads.jsonl", record);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lead]", err);
    return NextResponse.json({ error: "Could not save your note. Try again?" }, { status: 500 });
  }
}
