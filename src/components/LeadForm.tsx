"use client";

import { FormEvent, useState } from "react";
import {
  getConsent,
  getOrCreateSessionId,
  getOrCreateVisitorId,
  track,
} from "@/lib/signals";

type Status = "idle" | "submitting" | "success" | "error";

const field =
  "mt-1.5 w-full rounded-xl border border-ice/20 bg-night/60 px-4 py-3 text-sm text-mist outline-none transition placeholder:text-ice/45 focus:border-mint/60 focus:ring-2 focus:ring-mint/20";

export function LeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mind, setMind] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !mind.trim()) {
      setError("Your name, email, and one line are all we need.");
      return;
    }
    setStatus("submitting");
    track({ event: "cta_submit", signal: "readiness_reachout", targetId: "lead_form" });

    try {
      const hasConsent = getConsent() === "granted";
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          mind,
          visitorId: hasConsent ? getOrCreateVisitorId() : undefined,
          sessionId: hasConsent ? getOrCreateSessionId() : undefined,
          consent: hasConsent,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("success");
      setName("");
      setEmail("");
      setMind("");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send. Try again?");
    }
  };

  if (status === "success") {
    return (
      <div role="status" className="py-8 text-center">
        <p className="font-serif text-3xl text-mist">Thank you.</p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ice">
          Your note reached us. Someone from SteadyTalk will reply soon, calmly and with no
          pressure, to find a time that suits you. Take care until then.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="lead-name" className="block text-xs font-medium tracking-wide text-ice">
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
          className={field}
          placeholder="What should we call you?"
        />
      </div>
      <div>
        <label htmlFor="lead-email" className="block text-xs font-medium tracking-wide text-ice">
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
          className={field}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="lead-mind" className="block text-xs font-medium tracking-wide text-ice">
          What&apos;s on your mind
        </label>
        <textarea
          id="lead-mind"
          name="mind"
          required
          rows={3}
          value={mind}
          onChange={(e) => setMind(e.target.value)}
          className={`${field} resize-y`}
          placeholder="One line is enough. No need to explain everything."
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#e7b4a8]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-sage px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-sage-light disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        {status === "submitting" ? "Sending…" : "Send, and we'll reply calmly"}
      </button>
    </form>
  );
}
