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
      ok: payload.ok,
      error: payload.ok ? null : payload.log.slice(0, 400),
      scannedFiles: payload.metrics.scannedFiles,
      changedFiles: payload.metrics.changedFiles,
      rewrites: payload.metrics.rewrites,
      distinctRules: payload.appliedRulesSummary?.length ?? 0,
      durationMs: ms,
    };
  } catch (e) {
    row = {
      id: r.id,
      owner: r.owner,
      repo: r.repo,
      ref: r.ref,
      ok: false,
      error: String(e?.message ?? e),
      scannedFiles: 0,
      changedFiles: 0,
      rewrites: 0,
      distinctRules: 0,
      durationMs: Math.round(performance.now() - t0),
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
md += "| Repository | Ref | Scanned files | Changed files | Rewrites | Distinct rules | ms |\n";
md += "|------------|-----|---------------:|-------------:|---------:|----------------:|---:|\n";
for (const x of rows) {
  const name = `${x.owner}/${x.repo}`;
  md += `| ${name} | ${x.ref} | ${x.scannedFiles} | ${x.changedFiles} | ${x.rewrites} | ${x.distinctRules} | ${x.durationMs} |\n`;
}
md += "\n**Totals:** scanned file passes **" + totalScanned + "**, files with at least one rewrite **" + totalChanged + "**, individual rule applications **" + totalRewrites + "**.\n\n";
md += "Raw JSON: [`docs/benchmark-latest.json`](docs/benchmark-latest.json). Re-run: `npm run build && node scripts/benchmark-repos.mjs`.\n";

console.log(md);
console.error("Wrote", outPath);
