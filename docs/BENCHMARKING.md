# Benchmarking DoubleSigma

DoubleSigma benchmarks are **real dry-runs** against public GitHub repositories listed in [`data/benchmark-repositories.json`](../data/benchmark-repositories.json). Each entry includes `owner`, `repo`, `ref` (for the zipball API) plus optional metadata (`name`, `description`, `url`, `tags`, `expectedPatterns`, `difficulty`) for dashboards and README tables.

## CLI: run all repos

```bash
npm run benchmark
```

This runs `scripts/benchmark-repos.mjs`, which:

1. Builds the TypeScript output (`npm run build`).
2. For every row in `data/benchmark-repositories.json`, downloads the default (or specified) ref via the GitHub zipball API, runs **dry-run** migration with **quantum** enabled, then deletes the temp folder.
3. Writes aggregated results to [`benchmark-latest.json`](benchmark-latest.json) and prints a Markdown table to stdout.

**Requirements:** network access to `api.github.com` and `codeload.github.com`. Large repos can take minutes.

## Web UI: Benchmarks tab

1. `npm run ui`
2. Open **Benchmarks** in the top navigation.
3. Use **Run** on a single row or **Run all benchmarks** (sequential, same engine as CLI).
4. **Export CSV** or **Export JSON** downloads the current table state (for jury / reports).

## HTTP API

`POST /api/benchmark` with JSON body:

```json
{
  "repoUrl": "https://github.com/flashbots/ethers-provider-flashbots-bundle",
  "ref": "master",
  "quantum": true
}
```

Response (`200`): `BenchmarkRunResponse` — `ok`, `repoName`, `status`, `filesScanned`, `filesChanged`, `rewrites`, `distinctRuleCount`, `rulesTriggered`, `appliedRulesSummary` (per-rule counts), `falsePositives` (always `0` until a human review pipeline exists), `durationMs`, optional `quantumInsights`, `log` / `error`.

## Impact (honest coverage)

In the **Benchmarks** UI, **Impact** means:

`(filesChanged / filesScanned) × 100%`

among JS/TS paths the tool scans. Use this instead of `rewrites / expectedPatterns` when communicating coverage to judges.

## Time saved (estimate)

The UI and CLI table assume **~3 minutes** of manual migration work per rewrite, then pick **minutes**, **hours**, or **dev-days** (8 h = 1 day) for display so small totals are not rounded to zero.

## “Coverage” and `expectedPatterns`

`expectedPatterns` is an **editorial rough target** for storytelling (e.g. “hundreds of call sites”), not a ground-truth count of migratable AST nodes. **Do not** present `rewrites / expectedPatterns` as a primary success metric; prefer **Impact** and rewrite counts.

## Jury-oriented write-up

See [`docs/benchmark-results.md`](benchmark-results.md) for an executive summary template you can paste into README or slides after each full run.

## Pre-submit (CI-friendly, no network)

```bash
npm run pre-submit
```

Runs `npm run build` and integration tests with **network tests skipped** by default (`SKIP_NETWORK_TESTS` unset still runs tests — check `real-repos.test.mjs`: it skips when `SKIP_NETWORK_TESTS=1` OR `CI=true` without `RUN_REAL_REPO_TESTS=1`).

To include real-repo tests in CI:

```bash
set RUN_REAL_REPO_TESTS=1
npm test
```

## README tables

Do **not** hand-copy fictional numbers into the README. After a full benchmark run, copy the printed Markdown table or summarize from `docs/benchmark-latest.json`, then refresh `docs/benchmark-results.md`.
