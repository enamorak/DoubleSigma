import { performance } from "node:perf_hooks";

import type { AppliedRuleSummary } from "./ruleApplySummary.js";
import { migrateFromGithubHttpsUrl } from "../remote/migrateFromGithub.js";
import { parseGithubRepoUrl } from "../remote/parseGithubUrl.js";
import type { AiPassMetrics, QuantumInsights } from "../types.js";

export interface BenchmarkRunResponse {
  ok: boolean;
  repoName: string;
  status: "success" | "failed";
  filesScanned: number;
  filesChanged: number;
  rewrites: number;
  distinctRuleCount: number;
  rulesTriggered: string[];
  /** Not auto-detected; reserved for future human-in-the-loop review (always 0 today). */
  falsePositives: number;
  durationMs: number;
  error?: string;
  quantumInsights?: QuantumInsights | null;
  log?: string;
  aiMetrics?: AiPassMetrics | null;
  aiNotes?: string | null;
  /** Per-rule rewrite counts (same shape as `POST /api/migrate`). */
  appliedRulesSummary?: AppliedRuleSummary[] | null;
}

/**
 * Dry-run migration on a public GitHub repo (zipball download + cleanup). For UI / benchmark harness.
 */
export async function executeGithubBenchmark(params: {
  repoUrl: string;
  /** Overrides URL /tree ref when set. */
  ref?: string;
  quantum?: boolean;
  ai?: boolean;
}): Promise<BenchmarkRunResponse> {
  const t0 = performance.now();
  const trimmed = params.repoUrl.trim();
  const parsed = parseGithubRepoUrl(trimmed);

  const empty = (repoName: string, error: string): BenchmarkRunResponse => ({
    ok: false,
    repoName,
    status: "failed",
    filesScanned: 0,
    filesChanged: 0,
    rewrites: 0,
    distinctRuleCount: 0,
    rulesTriggered: [],
    falsePositives: 0,
    durationMs: Math.round(performance.now() - t0),
    error,
    quantumInsights: null,
    aiMetrics: null,
    aiNotes: null,
    appliedRulesSummary: null,
  });

  if (!parsed) {
    return empty("", "Invalid or unsupported GitHub HTTPS URL");
  }

  const repoName = `${parsed.owner}/${parsed.repo}`;
  const refArg = typeof params.ref === "string" && params.ref.trim() ? params.ref.trim() : parsed.ref;

  const payload = await migrateFromGithubHttpsUrl(
    trimmed,
    refArg,
    {
      mode: "dry-run",
      quantum: params.quantum !== false,
      ai: Boolean(params.ai),
    },
    { cleanupAfterDryRun: true }
  );

  const durationMs = Math.round(performance.now() - t0);

  if (!payload.ok) {
    return {
      ...empty(repoName, payload.log.slice(0, 800)),
      log: payload.log,
      durationMs,
    };
  }

  const rulesTriggered = payload.appliedRulesSummary?.map((s) => s.id) ?? [];

  return {
    ok: true,
    repoName,
    status: "success",
    filesScanned: payload.metrics.scannedFiles,
    filesChanged: payload.metrics.changedFiles,
    rewrites: payload.metrics.rewrites,
    distinctRuleCount: payload.appliedRulesSummary?.length ?? 0,
    rulesTriggered,
    falsePositives: 0,
    durationMs,
    quantumInsights: payload.quantumInsights ?? null,
    log: payload.log,
    aiMetrics: payload.aiMetrics ?? null,
    aiNotes: payload.aiNotes ?? null,
    appliedRulesSummary: payload.appliedRulesSummary?.length ? payload.appliedRulesSummary : null,
  };
}
