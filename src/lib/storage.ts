import { appendFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function appendJsonl(
  filename: "signals.jsonl" | "leads.jsonl",
  record: Record<string, unknown>
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const line = JSON.stringify(record) + "\n";
  await appendFile(path.join(DATA_DIR, filename), line, "utf8");
}

/**
 * Swap target for production:
 * - Vercel KV: await kv.lpush('steadytalk:signals', JSON.stringify(record))
 * - Postgres / Neon: INSERT INTO signals (...) VALUES (...)
 * Keep the same payload shape from SignalPayload / LeadPayload.
 */
