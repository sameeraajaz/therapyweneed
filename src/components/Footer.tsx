export function Footer() {
  return (
    <footer className="border-t border-charcoal/8 px-6 py-14 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-sage">
            SteadyTalk
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-charcoal/55">
            Paid non-psychiatric consultation. Rent an hour of steady company —
            with NDA and a small grounding aid.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal/60">
          <a href="#questions" className="hover:text-sage-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage">
            Questions
          </a>
          <a href="#about" className="hover:text-sage-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage">
            The model
          </a>
          <a href="#reach-out" className="hover:text-sage-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage">
            Reach out
          </a>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-5xl border-t border-charcoal/6 pt-8">
        <p className="max-w-3xl text-xs leading-relaxed text-charcoal/45">
          <strong className="font-medium text-charcoal/55">Important.</strong>{" "}
          SteadyTalk is not therapy, psychiatry, or healthcare. We do not
          diagnose, treat, or provide medical advice. SteadyTalk is not a
          substitute for licensed professional care. If you or someone else is
          in crisis, contact local emergency services or a licensed crisis
          resource immediately.
        </p>
        <p className="mt-4 text-xs text-charcoal/35">
          © {new Date().getFullYear()} SteadyTalk. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
