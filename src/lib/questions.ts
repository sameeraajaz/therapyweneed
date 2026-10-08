import type { QuestionItem } from "./types";

/** Life / work / relationship / decision fog — never diagnostic language. */
export const QUESTIONS: QuestionItem[] = [
  {
    id: "q-who-to-say",
    topic: "life",
    prompt: "Who do I say this to?",
    whisper:
      "Some thoughts sit half-formed — not ready for family, not for a colleague. SteadyTalk is a quiet hour for the words that need a steady ear first.",
  },
  {
    id: "q-sunday-heavy",
    topic: "life",
    prompt: "Why does this feel heavy on Sundays?",
    whisper:
      "The week ends and something unspoken settles. Not a diagnosis — just a pattern many people notice. Naming it with someone calm can soften the edge.",
  },
  {
    id: "q-steady-hour",
    topic: "decision",
    prompt: "What if I just need someone steady for an hour?",
    whisper:
      "Not advice theater. Not a lecture. Time you rent — protected, undistracted — to think out loud with someone who stays present.",
  },
  {
    id: "q-work-fog",
    topic: "work",
    prompt: "Is this a career wall, or just fog?",
    whisper:
      "Titles, pivots, quiet doubts at 11pm. A SteadyTalk hour is space to sort signal from noise — without HR, without performance mode.",
  },
  {
    id: "q-relationship-edge",
    topic: "relationship",
    prompt: "How do I say the hard thing without breaking the room?",
    whisper:
      "Before a conversation that matters, some people want a rehearsal with someone who won't take sides — only steadiness.",
  },
  {
    id: "q-decision-loop",
    topic: "decision",
    prompt: "Why am I circling the same choice?",
    whisper:
      "Pros and cons already known. What's left is the feeling underneath. An hour of clear company can loosen the loop.",
  },
  {
    id: "q-private-space",
    topic: "life",
    prompt: "Where can this stay private?",
    whisper:
      "Every SteadyTalk session begins with a signed NDA. Your words stay yours. That trust is part of the offer — not a footnote.",
  },
  {
    id: "q-hands-busy",
    topic: "life",
    prompt: "What if my hands need something while I talk?",
    whisper:
      "You receive a fidget spinner / grounding aid with your session. A small, tangible companion — nothing clinical, just something to hold.",
  },
];

export const TOPIC_LABEL: Record<QuestionItem["topic"], string> = {
  life: "Life",
  work: "Work",
  relationship: "Relationships",
  decision: "Decisions",
};
