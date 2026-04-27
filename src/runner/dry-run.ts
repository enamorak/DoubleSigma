import { promises as fs } from "node:fs";
import path from "node:path";

import { transformFile } from "../codemods/index.js";
import { MigrationResult } from "../types.js";
import { collectSourceFiles } from "./source-files.js";

export async function runDryMigration(targetPath: string): Promise<MigrationResult> {
  const absoluteRoot = path.resolve(targetPath);
  const sourceFiles = await collectSourceFiles(absoluteRoot);
  const changes = [];

  for (const filePath of sourceFiles) {
    const source = await fs.readFile(filePath, "utf8");
    const change = transformFile(filePath, source);
    if (change) {
      changes.push(change);
    }
  }

  return {
    scannedFiles: sourceFiles.length,
    changedFiles: changes.length,
    changes,
  };
}
