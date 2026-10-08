"use client";

import { FormEvent, useState } from "react";
import { getConsent, getOrCreateSessionId, getOrCreateVisitorId } from "@/lib/signals";
import { useSignals } from "./SignalProvider";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadForm() {
  const { track, consent } = useSignals();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mind, setMind] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    track({
      event: "cta_submit",
      signal: "readiness_reachout",
      targetId: "lead_form",
    });

    try {
      const hasConsent = consent === "granted" || getConsent() === "granted";
      const payload = {
        name,
        email,
        mind,
        visitorId: hasConsent ? getOrCreateVisitorId() : undefined,
        sessionId: hasConsent ? getOrCreateSessionId() : undefined,
        consent: hasConsent,
      };

      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMind("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send. Try again?");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-sage/25 bg-sage/[0.06] px-6 py-10 text-center"
      >
        <p className="font-serif text-2xl text-charcoal">Thank you.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal/70">
          We received your note. Someone from SteadyTalk will reach out soon —
          calmly, with no pressure. Take care until then.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="lead-name" className="block text-xs font-medium tracking-wide text-charcoal/70">
          Name
        </label>
        <input
          id="lead-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-charcoal/12 bg-white/70 px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-sage/50 focus:ring-2 focus:ring-sage/20"
          placeholder="What should we call you?"
        />
      </div>
      <div>
        <label htmlFor="lead-email" className="block text-xs font-medium tracking-wide text-charcoal/70">
          Email
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-charcoal/12 bg-white/70 px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-sage/50 focus:ring-2 focus:ring-sage/20"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="lead-mind" className="block text-xs font-medium tracking-wide text-charcoal/70">
          What&apos;s on your mind
        </label>
        <textarea
          id="lead-mind"
          name="mind"
          required
          rows={3}
          value={mind}
          onChange={(e) => setMind(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border border-charcoal/12 bg-white/70 px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/35 focus:border-sage/50 focus:ring-2 focus:ring-sage/20"
          placeholder="One line is enough — no need to explain everything."
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-800/80">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-sage px-6 py-3.5 text-sm font-medium text-warmwhite transition hover:bg-sage-deep disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Reach out"}
      </button>
    </form>
  );
}
