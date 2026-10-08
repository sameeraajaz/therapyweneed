import { existsSync } from "fs";
import path from "path";
import { MODEL_SPECS, type ModelAvailability, type ModelKey } from "./models";

/** Server-only: which .glb files exist in /public/models (checked at build / request time). */
export function getAvailableModels(): ModelAvailability {
  const dir = path.join(process.cwd(), "public", "models");
  const out = {} as ModelAvailability;
  (Object.keys(MODEL_SPECS) as ModelKey[]).forEach((key) => {
    out[key] = existsSync(path.join(dir, MODEL_SPECS[key].file));
  });
  return out;
}
