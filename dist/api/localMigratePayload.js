import { buildDiffPreviews } from "../diffPreview.js";
import { listRulesWithoutMatch, summarizeAppliedRules } from "./ruleApplySummary.js";
/**
 * JSON shape for `POST /api/migrate` when using a local directory (not GitHub).
 */
export function payloadFromLocalJob(job) {
    const hasError = job.logText.startsWith("Error:");
    const metrics = {
        scannedFiles: job.result.scannedFiles,
        changedFiles: job.result.changedFiles,
        rewrites: job.result.changes.reduce((n, c) => n + c.appliedRules.length, 0),
    };
    const appliedRulesSummary = hasError ? [] : summarizeAppliedRules(job.result.changes);
    const rulesWithoutMatch = hasError ? listRulesWithoutMatch([]) : listRulesWithoutMatch(appliedRulesSummary);
    return {
        ok: !hasError,
        log: job.logText,
        metrics,
        targetResolved: hasError ? null : job.options.targetPath,
        source: null,
        workDir: hasError ? null : job.options.targetPath,
        cleanedUp: false,
        diffs: hasError ? [] : buildDiffPreviews(job.result.changes, 15, 12),
        appliedRulesSummary,
        rulesWithoutMatch,
        quantumInsights: hasError || !job.options.quantum ? null : job.result.quantumInsights ?? null,
        aiMetrics: hasError || !job.options.ai ? null : job.result.aiMetrics ?? null,
        aiNotes: hasError || !job.options.ai ? null : job.result.aiNotes ?? null,
    };
}
