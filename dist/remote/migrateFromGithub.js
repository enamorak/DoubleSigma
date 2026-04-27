import { listRulesWithoutMatch, summarizeAppliedRules, } from "../api/ruleApplySummary.js";
import { buildDiffPreviews } from "../diffPreview.js";
import { runMigrationJob } from "../migrationJob.js";
import { prepareGithubRepo } from "./githubArchive.js";
import { parseGithubRepoUrl } from "./parseGithubUrl.js";
function emptyPayload(log, cleanedUp) {
    return {
        ok: false,
        log,
        metrics: { scannedFiles: 0, changedFiles: 0, rewrites: 0 },
        targetResolved: null,
        source: null,
        workDir: null,
        cleanedUp,
        diffs: [],
        appliedRulesSummary: [],
        rulesWithoutMatch: listRulesWithoutMatch([]),
        quantumInsights: null,
    };
}
/**
 * Clone a public GitHub repo via the official zipball API, run the migrator, optionally delete temp files.
 */
export async function migrateFromGithubHttpsUrl(rawUrl, refOverride, cli, options) {
    const parsed = parseGithubRepoUrl(rawUrl);
    if (!parsed) {
        return emptyPayload("Error: unsupported URL — use https://github.com/owner/repo (optional /tree/branch)\n", false);
    }
    const ref = refOverride ?? parsed.ref;
    let root;
    let cleanup;
    let refUsed;
    try {
        const prepared = await prepareGithubRepo(parsed.owner, parsed.repo, ref);
        root = prepared.root;
        cleanup = prepared.cleanup;
        refUsed = prepared.refUsed;
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return emptyPayload(`Error: ${msg}\n`, false);
    }
    const shouldCleanup = cli.mode === "dry-run" ? options.cleanupAfterDryRun : false;
    try {
        const job = await runMigrationJob({
            ...cli,
            targetPath: root,
        });
        const hasError = job.logText.startsWith("Error:");
        const metrics = {
            scannedFiles: job.result.scannedFiles,
            changedFiles: job.result.changedFiles,
            rewrites: job.result.changes.reduce((n, c) => n + c.appliedRules.length, 0),
        };
        const diffs = hasError ? [] : buildDiffPreviews(job.result.changes, 15, 12);
        const appliedRulesSummary = hasError ? [] : summarizeAppliedRules(job.result.changes);
        const rulesWithoutMatch = hasError ? listRulesWithoutMatch([]) : listRulesWithoutMatch(appliedRulesSummary);
        return {
            ok: !hasError,
            log: job.logText,
            metrics,
            targetResolved: hasError ? null : root,
            source: { owner: parsed.owner, repo: parsed.repo, ref: refUsed },
            workDir: shouldCleanup ? null : root,
            cleanedUp: shouldCleanup,
            diffs,
            appliedRulesSummary,
            rulesWithoutMatch,
            quantumInsights: hasError || !cli.quantum ? null : job.result.quantumInsights ?? null,
        };
    }
    finally {
        if (shouldCleanup) {
            await cleanup();
        }
    }
}
