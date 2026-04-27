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
export declare function summarizeAppliedRules(changes: FileChange[]): AppliedRuleSummary[];
/** Catalog IDs that did not produce any rewrite in this run. */
export declare function listRulesWithoutMatch(applied: AppliedRuleSummary[]): string[];
