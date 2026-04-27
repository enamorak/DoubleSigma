import { getCodemodCatalog } from "../codemods/rulesCatalog.js";
import type { FileChange } from "../types.js";

export interface AppliedRuleSummary {
  id: string;
  /** How many times this rule ran (can be > number of files if multiple passes). */
  rewriteCount: number;
  /** Distinct files where this rule contributed. */
  filesAffected: number;
}

/**
 * Aggregates `appliedRules` from all file changes for the dashboard / API.
 */
export function summarizeAppliedRules(changes: FileChange[]): AppliedRuleSummary[] {
  const byId = new Map<string, { rewriteCount: number; files: Set<string> }>();

  for (const change of changes) {
    for (const ruleId of change.appliedRules) {
      let entry = byId.get(ruleId);
      if (!entry) {
        entry = { rewriteCount: 0, files: new Set() };
        byId.set(ruleId, entry);
      }
      entry.rewriteCount += 1;
      entry.files.add(change.filePath);
    }
  }

  return [...byId.entries()]
    .map(([id, v]) => ({
      id,
      rewriteCount: v.rewriteCount,
      filesAffected: v.files.size,
    }))
    .sort((a, b) => b.rewriteCount - a.rewriteCount || a.id.localeCompare(b.id));
}

/** Catalog IDs that did not produce any rewrite in this run. */
export function listRulesWithoutMatch(applied: AppliedRuleSummary[]): string[] {
  const fired = new Set(applied.map((a) => a.id));
  return getCodemodCatalog()
    .map((r) => r.id)
    .filter((id) => !fired.has(id));
}
