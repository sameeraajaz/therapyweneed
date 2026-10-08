/**
 * Drop-in .glb models (from Meshy) live in /public/models/.
 * If a file is missing, the scene uses the procedural placeholder instead.
 * Node names inside each .glb must match the piece names below
 * (Blender object names → glTF node names; spaces become underscores).
 */

export type ModelKey = "satellite" | "spinner" | "envelope" | "stone" | "debris";

export interface ModelSpec {
  file: string;
  /** Named nodes the code looks for. */
  pieces: string[];
  /** Pieces the code can live without (falls back gracefully). */
  optional?: string[];
  /** Target size (largest dimension, world units) the model is normalised to. */
  size: number;
  notes: string;
}

export const MODEL_SPECS: Record<ModelKey, ModelSpec> = {
  satellite: {
    file: "satellite.glb",
    pieces: [
      "body",
      "panel_left",
      "panel_right",
      "dish",
      "antenna",
      "arm_left",
      "arm_right",
      "thruster",
    ],
    optional: ["arm_left", "arm_right", "thruster"],
    size: 3.2,
    notes:
      "Export assembled (pieces in their final positions). Each piece a separate top-level node. The code scatters and reassembles them.",
  },
  spinner: {
    file: "spinner.glb",
    pieces: ["spinner_rotor", "spinner_core"],
    optional: ["spinner_core"],
    size: 1.6,
    notes:
      "Lying flat, spin axis = +Y (up). spinner_rotor = arms + weights (the part that spins), origin at the centre. spinner_core = centre cap/bearing.",
  },
  envelope: {
    file: "envelope.glb",
    pieces: ["envelope_body", "envelope_flap", "envelope_seal"],
    optional: ["envelope_seal"],
    size: 1.8,
    notes:
      "Facing front (+Z), flap closed. envelope_flap origin/pivot on the hinge (top edge) so it can rotate open around X. envelope_seal = wax seal on the flap.",
  },
  stone: {
    file: "question-stone.glb",
    pieces: [
      "stone_01",
      "stone_02",
      "stone_03",
      "stone_04",
      "stone_05",
      "stone_06",
      "stone_07",
      "stone_08",
    ],
    optional: [
      "stone_01",
      "stone_02",
      "stone_03",
      "stone_04",
      "stone_05",
      "stone_06",
      "stone_07",
      "stone_08",
    ],
    size: 0.7,
    notes:
      "Small smooth stones that sit inside each ice crystal. One stone (any node name) is reused for all 8, or provide stone_01…stone_08 for one per question.",
  },
  debris: {
    file: "debris.glb",
    pieces: ["debris_01", "debris_02", "debris_03", "debris_04", "debris_05", "debris_06"],
    optional: ["debris_01", "debris_02", "debris_03", "debris_04", "debris_05", "debris_06"],
    size: 0.5,
    notes: "Small floating fragments scattered along the camera path. Any number of top-level nodes works.",
  },
};

export type ModelAvailability = Record<ModelKey, boolean>;

export const NO_MODELS: ModelAvailability = {
  satellite: false,
  spinner: false,
  envelope: false,
  stone: false,
  debris: false,
};

export function modelUrl(key: ModelKey): string {
  return `/models/${MODEL_SPECS[key].file}`;
}
