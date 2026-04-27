import { MigrationResult } from "../types.js";

export interface MigrationMetrics {
  scannedFiles: number;
  changedFiles: number;
  totalRewrites: number;
}

export function collectMetrics(result: MigrationResult): MigrationMetrics {
  let rewrites = 0;
  for (const change of result.changes) {
    rewrites += change.appliedRules.length;
  }

  return {
    scannedFiles: result.scannedFiles,
    changedFiles: result.changedFiles,
    totalRewrites: rewrites,
  };
}
