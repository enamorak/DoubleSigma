import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Loads `.env` from cwd when present (does not override existing `process.env` keys).
 * Keeps zero extra npm dependencies; use `node --env-file=.env` in production if preferred.
 */
export function loadDotEnvFile(): void {
  const p = join(process.cwd(), ".env");
  if (!existsSync(p)) {
    return;
  }
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      continue;
    }
    const eq = t.indexOf("=");
    if (eq < 1) {
      continue;
    }
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith("\"") && v.endsWith("\"")) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }
}
