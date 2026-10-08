import type { QuestionItem, QuestionTopic } from "./types";

/**
 * Question bank — life / work / relationship / decision / privacy / hands.
 * Never diagnostic language. A licensed psychologist must review this bank
 * before public launch (see docs/SIGNAL_MAP.md).
 */
export const QUESTIONS: QuestionItem[] = [
  {
    id: "q-who-to-say",
    short: "Q1",
    topic: "life",
    prompt: "Who do I say this to?",
    whisper:
      "Some thoughts sit half-formed. Not ready for family, not for a colleague. A SteadyTalk hour is room for the words that need a steady ear first.",
  },
  {
    id: "q-sunday-heavy",
    short: "Q2",
    topic: "life",
    prompt: "Why does this feel heavy on Sundays?",
    whisper:
      "The week winds down and something unspoken settles in. Lots of people notice it. Saying it out loud to someone calm can take the edge off.",
  },
  {
    id: "q-work-fog",
    short: "Q3",
    topic: "work",
    prompt: "Is this a career wall, or just fog?",
    whisper:
      "Titles, pivots, quiet doubts at 11pm. Space to sort signal from noise without HR, without performing, without a slide deck.",
  },
  {
    id: "q-hard-thing",
    short: "Q4",
    topic: "relationship",
    prompt: "How do I say the hard thing without breaking the room?",
    whisper:
      "Before a conversation that matters, it can help to rehearse with someone who won't take sides. They just stay steady while you find the words.",
  },
  {
    id: "q-circling",
    short: "Q5",
    topic: "decision",
    prompt: "Why am I circling the same choice?",
    whisper:
      "You already know the pros and cons. What's left is the feeling underneath. An hour of clear company can loosen the loop.",
  },
  {
    id: "q-steady-hour",
    short: "Q6",
    topic: "decision",
    prompt: "What if I just need someone steady for an hour?",
    whisper:
      "No performance and no lecture. Time you rent, protected and undistracted, to think out loud with someone who stays present.",
  },
  {
    id: "q-private",
    short: "Q7",
    topic: "privacy",
    prompt: "Where can this stay private?",
    whisper:
      "Every SteadyTalk session starts with a signed NDA. What you say stays yours. That trust is part of the offer, not a footnote.",
  },
  {
    id: "q-hands",
    short: "Q8",
    topic: "hands",
    prompt: "What if my hands need something while I talk?",
    whisper:
      "Every session comes with a fidget spinner, a small grounding aid. Nothing clinical, just something to hold while you talk.",
  },
];

export const TOPIC_LABEL: Record<QuestionTopic, string> = {
  life: "Life",
  work: "Work",
  relationship: "Relationships",
  decision: "Decisions",
  privacy: "Privacy",
  hands: "Hands",
};
