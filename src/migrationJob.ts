import path from "node:path";
import { promises as fs } from "node:fs";

import { runApplyMigration } from "./runner/apply.js";
import { runDryMigration } from "./runner/dry-run.js";
import { collectMetrics } from "./runner/metrics.js";
import { formatQuantumSummary, rankChangesByAmplitude } from "./quantum/pattern-detector.js";
import { scanQuantumMarkers } from "./quantum/marker-scan.js";
import { CliOptions, MigrationResult } from "./types.js";

function printPreviewDiff(before: string, after: string, maxLinePairs: number): string {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const out: string[] = [];

  for (let i = 0; i < Math.min(beforeLines.length, afterLines.length); i += 1) {
    if (beforeLines[i] !== afterLines[i]) {
      out.push(`- ${beforeLines[i]}`);
      out.push(`+ ${afterLines[i]}`);
      if (out.length >= maxLinePairs * 2) {
        out.push("…");
        break;
      }
    }
  }

  return out.join("\n");
}

function validateTargetPath(input: string): { ok: true; absolute: string } | { ok: false; error: string } {
  if (!input || !input.trim()) {
    return { ok: false, error: "Path is empty" };
  }
  const absolute = path.resolve(input.trim());
  return { ok: true, absolute };
}

/**
 * Resolves the migration target. Checks existence when `checkExists` is true.
 */
export async function resolveTarget(
  targetPath: string,
  checkExists: boolean
): Promise<{ ok: true; absolute: string } | { ok: false; error: string }> {
  const v = validateTargetPath(targetPath);
  if (!v.ok) {
    return v;
  }
  if (!checkExists) {
    return { ok: true, absolute: v.absolute };
  }
  try {
    const st = await fs.stat(v.absolute);
    if (!st.isDirectory()) {
      return { ok: false, error: "Path is not a directory" };
    }
  } catch {
    return { ok: false, error: "Path does not exist or is not readable" };
  }
  return { ok: true, absolute: v.absolute };
}

export interface MigrationJobResult {
  options: CliOptions;
  result: MigrationResult;
  logText: string;
}

/**
 * Full migration: dry-run or apply, optional quantum summary and AI note.
 */
export async function runMigrationJob(options: CliOptions): Promise<MigrationJobResult> {
  const target = await resolveTarget(options.targetPath, true);
  if (!target.ok) {
    return {
      options,
      result: { scannedFiles: 0, changedFiles: 0, changes: [] },
      logText: `Error: ${target.error}\n`,
    };
  }

  const opts: CliOptions = { ...options, targetPath: target.absolute };

  const result =
    opts.mode === "apply" ? await runApplyMigration(opts.targetPath) : await runDryMigration(opts.targetPath);

  const orderedChanges =
    opts.quantum && result.changes.length > 0
      ? rankChangesByAmplitude(result.changes)
      : result.changes;

  let resultForLog: MigrationResult = { ...result, changes: orderedChanges };

  if (opts.quantum) {
    const quantumInsights = await scanQuantumMarkers(opts.targetPath);
    resultForLog = { ...resultForLog, quantumInsights };
  }
  const metrics = collectMetrics(result);
  const lines: string[] = [];

  lines.push(`DoubleSigma mode: ${opts.mode}`);
  lines.push(`Target: ${opts.targetPath}`);
  lines.push(`Quantum heuristics: ${opts.quantum ? "enabled" : "disabled"}`);
  lines.push(`AI fallback: ${opts.ai ? "enabled (not wired in v0.1 — reserved)" : "disabled"}`);
  lines.push("");

  if (opts.ai) {
    lines.push("Note: AI path requires OPENAI_API_KEY and will be added in a follow-up.");
    lines.push("");
  }

  lines.push(`Scanned files: ${metrics.scannedFiles}`);
  lines.push(`Changed files: ${metrics.changedFiles}`);
  lines.push(`Total rewrites: ${metrics.totalRewrites}`);

  if (opts.quantum) {
    if (resultForLog.quantumInsights) {
      lines.push(resultForLog.quantumInsights.summary);
      lines.push(
        `quantum: superposition coverage (heuristic)=${resultForLog.quantumInsights.superpositionCoverage}`
      );
    }
    lines.push(formatQuantumSummary(metrics.changedFiles, metrics.totalRewrites));
  }

  if (resultForLog.changes.length > 0) {
    const sample = resultForLog.changes[0];
    lines.push("");
    lines.push(`Sample file: ${sample.filePath}`);
    lines.push(`Applied rules: ${sample.appliedRules.join(", ")}`);
    const preview = printPreviewDiff(sample.before, sample.after, 5);
    if (preview) {
      lines.push("Preview:");
      lines.push(preview);
    }
  }

  return {
    options: opts,
    result: resultForLog,
    logText: lines.join("\n") + "\n",
  };
}
