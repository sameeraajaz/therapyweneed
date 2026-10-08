/**
 * World layout shared by the HTML layer and the 3D scene.
 * Each "stop" is one HTML section and one camera resting point.
 * The camera eases between stops as the visitor scrolls (slow damped lerp).
 */

export type StopKind =
  | "hero"
  | "steady"
  | "question"
  | "hour"
  | "nda"
  | "aid"
  | "finale";

/** Which side the HTML text sits on (desktop). The 3D object goes to the other side. */
export type TextSide = "left" | "right" | "center";

export interface Stop {
  id: string;
  kind: StopKind;
  side: TextSide;
  focus: [number, number, number];
  /** Camera distance from focus. */
  dist: number;
  questionIndex?: number;
}

export const SATELLITE_POS: [number, number, number] = [0, 0, 0];

export function questionPosition(i: number): [number, number, number] {
  return [Math.sin(i * 1.7 + 0.6) * 2.4, Math.cos(i * 1.1) * 0.8, -16 - i * 8];
}

export const HOUR_POS: [number, number, number] = [-2.2, 0.5, -84];
export const NDA_POS: [number, number, number] = [2.4, -0.3, -94];
export const AID_POS: [number, number, number] = [-1.4, 0.3, -104];
export const FINALE_POS: [number, number, number] = [0, 0, -122];

export const QUESTION_COUNT = 8;

export const STOPS: Stop[] = [
  { id: "hero", kind: "hero", side: "left", focus: SATELLITE_POS, dist: 9.5 },
  { id: "steady", kind: "steady", side: "right", focus: SATELLITE_POS, dist: 5.6 },
  ...Array.from({ length: QUESTION_COUNT }, (_, i): Stop => ({
    id: `question-${i}`,
    kind: "question",
    side: i % 2 === 0 ? "left" : "right",
    focus: questionPosition(i),
    dist: 4.4,
    questionIndex: i,
  })),
  { id: "offer-hour", kind: "hour", side: "right", focus: HOUR_POS, dist: 4.6 },
  { id: "offer-nda", kind: "nda", side: "left", focus: NDA_POS, dist: 4.6 },
  { id: "offer-aid", kind: "aid", side: "right", focus: AID_POS, dist: 4.4 },
  { id: "reach-out", kind: "finale", side: "left", focus: FINALE_POS, dist: 12 },
];

export function stopIndex(id: string): number {
  return STOPS.findIndex((s) => s.id === id);
}
