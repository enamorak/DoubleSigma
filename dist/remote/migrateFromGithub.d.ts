import { type AppliedRuleSummary } from "../api/ruleApplySummary.js";
import { type DiffPreview } from "../diffPreview.js";
import type { CliOptions, QuantumInsights } from "../types.js";
type MigrateFlags = Pick<CliOptions, "mode" | "quantum" | "ai">;
export interface MigrateApiPayload {
    ok: boolean;
    log: string;
    metrics: {
        scannedFiles: number;
        changedFiles: number;
        rewrites: number;
    };
    targetResolved: string | null;
    source: {
        owner: string;
        repo: string;
        ref: string;
    } | null;
    workDir: string | null;
    cleanedUp: boolean;
    diffs: DiffPreview[];
    /** Rules that actually rewrote code in this run (recommended “apply these” for this codebase). */
    appliedRulesSummary: AppliedRuleSummary[];
    /** Catalog rule IDs that did not match any file in this run. */
    rulesWithoutMatch: string[];
    /** Present when migration ran with `quantum: true`. */
    quantumInsights?: QuantumInsights | null;
}
/**
 * Clone a public GitHub repo via the official zipball API, run the migrator, optionally delete temp files.
 */
export declare function migrateFromGithubHttpsUrl(rawUrl: string, refOverride: string | undefined, cli: MigrateFlags, options: {
    cleanupAfterDryRun: boolean;
}): Promise<MigrateApiPayload>;
export {};
