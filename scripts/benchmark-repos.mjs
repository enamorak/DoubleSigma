/**
 * Dry-run DoubleSigma against every repo in data/benchmark-repositories.json.
 * Usage (from repo root): npm run build && node scripts/benchmark-repos.mjs
 * Writes docs/benchmark-latest.json and prints a Markdown table.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "benchmark-repositories.json");
const migratorUrl = pathToFileURL(path.join(root, "dist", "remote", "migrateFromGithub.js")).href;
const { migrateFromGithubHttpsUrl } = await import(migratorUrl);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

/** % of scanned JS/TS files that received at least one rewrite (same idea as UI “Impact”). */
function impactPct(scanned, changed) {
  if (!scanned || scanned <= 0) return "—";
  return `${((100 * changed) / scanned).toFixed(1)}%`;
}

/** 3 minutes manual work per rewrite (conservative). */
function timeSavedLabel(rewrites) {
  if (rewrites == null || rewrites <= 0) return "—";
  const hoursSaved = (rewrites * 3) / 60;
  if (hoursSaved < 1) return `${Math.max(1, Math.round(hoursSaved * 60))} min`;
  if (hoursSaved < 8) return `${hoursSaved.toFixed(1)} hours`;
  return `${(hoursSaved / 8).toFixed(2)} dev-days`;
}

const rows = [];
for (const r of manifest) {
  const url = `https://github.com/${r.owner}/${r.repo}`;
  const t0 = performance.now();
  let row;
  try {
    const payload = await migrateFromGithubHttpsUrl(
      url,
      r.ref,
      { mode: "dry-run", quantum: true, ai: false },
      { cleanupAfterDryRun: true }
    );
    const ms = Math.round(performance.now() - t0);
    row = {
      id: r.id,
      owner: r.owner,
      repo: r.repo,
      ref: r.ref,
      name: r.name ?? `${r.owner}/${r.repo}`,
      description: r.description ?? null,
      url: r.url ?? `https://github.com/${r.owner}/${r.repo}`,
      tags: r.tags ?? [],
      expectedPatterns: r.expectedPatterns ?? null,
      difficulty: r.difficulty ?? null,
      ok: payload.ok,
      error: payload.ok ? null : payload.log.slice(0, 400),
      scannedFiles: payload.metrics.scannedFiles,
      changedFiles: payload.metrics.changedFiles,
      rewrites: payload.metrics.rewrites,
      distinctRules: payload.appliedRulesSummary?.length ?? 0,
      durationMs: ms,
      quantumInsights: payload.quantumInsights ?? null,
    };
  } catch (e) {
    row = {
      id: r.id,
      owner: r.owner,
      repo: r.repo,
      ref: r.ref,
      name: r.name ?? `${r.owner}/${r.repo}`,
      description: r.description ?? null,
      url: r.url ?? `https://github.com/${r.owner}/${r.repo}`,
      tags: r.tags ?? [],
      expectedPatterns: r.expectedPatterns ?? null,
      difficulty: r.difficulty ?? null,
      ok: false,
      error: String(e?.message ?? e),
      scannedFiles: 0,
      changedFiles: 0,
      rewrites: 0,
      distinctRules: 0,
      durationMs: Math.round(performance.now() - t0),
      quantumInsights: null,
    };
  }
  rows.push(row);
  console.error(`${row.ok ? "OK" : "FAIL"} ${r.owner}/${r.repo} scanned=${row.scannedFiles} changed=${row.changedFiles} ${row.durationMs}ms`);
}

await mkdir(path.join(root, "docs"), { recursive: true });
const outPath = path.join(root, "docs", "benchmark-latest.json");
await writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2), "utf8");

const ok = rows.filter((x) => x.ok).length;
const totalChanged = rows.reduce((s, x) => s + x.changedFiles, 0);
const totalRewrites = rows.reduce((s, x) => s + x.rewrites, 0);
const totalScanned = rows.reduce((s, x) => s + x.scannedFiles, 0);

let md = "\n## Benchmark (public GitHub repos, dry-run)\n\n";
md += `Generated: **${new Date().toISOString()}** · Repos in manifest: **${rows.length}** · Successful runs: **${ok}/${rows.length}**\n\n`;
md +=
  "| Repository | Ref | OK | Scanned | Changed | Rewrites | Impact | Time saved (est.) | Rules | ms |\n";
md += "|------------|-----|:--:|--------:|--------:|---------:|--------|-------------------|------:|---:|\n";
for (const x of rows) {
  const name = x.name ?? `${x.owner}/${x.repo}`;
  const okCell = x.ok ? "yes" : "no";
  const imp = x.ok ? impactPct(x.scannedFiles, x.changedFiles) : "—";
  const ts = x.ok ? timeSavedLabel(x.rewrites) : "—";
  md += `| ${name} | ${x.ref} | ${okCell} | ${x.scannedFiles} | ${x.changedFiles} | ${x.rewrites} | ${imp} | ${ts} | ${x.distinctRules} | ${x.durationMs} |\n`;
}
md += "\n**Totals:** scanned file passes **" + totalScanned + "**, files with at least one rewrite **" + totalChanged + "**, individual rule applications **" + totalRewrites + "**.\n\n";
md +=
  "**Impact** = `changedFiles / scannedFiles` (among paths DoubleSigma walks). **Time saved** assumes **3 minutes** of manual migration per rewrite. " +
  "See [`docs/benchmark-results.md`](docs/benchmark-results.md) for a jury-oriented write-up.\n\n";
md +=
  "Raw JSON: [`docs/benchmark-latest.json`](docs/benchmark-latest.json). Re-run: `npm run build && node scripts/benchmark-repos.mjs`.\n";

console.log(md);
console.error("Wrote", outPath);
