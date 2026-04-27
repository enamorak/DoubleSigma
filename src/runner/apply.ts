import { promises as fs } from "node:fs";

import { runDryMigration } from "./dry-run.js";
import { MigrationResult } from "../types.js";

/**
 * Executes migration and writes transformed content to disk.
 */
export async function runApplyMigration(targetPath: string): Promise<MigrationResult> {
  const result = await runDryMigration(targetPath);

  for (const change of result.changes) {
    await fs.writeFile(change.filePath, change.after, "utf8");
  }

  return result;
}
