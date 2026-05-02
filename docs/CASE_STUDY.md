# Case Study: DoubleSigma — Ethers.js v5 → v6 at Hackathon Speed

## Executive Summary

**DoubleSigma** is an open-source tool that applies **deterministic**, catalog-driven string transforms for common **ethers.js v5 → v6** API moves, adds a **read-only “quantum-inspired”** scan to surface latent legacy patterns, and optionally runs a **Groq-hosted LLM advisory pass** on a small slice of changed files (without auto-applying model output). It ships with a **CLI**, a **local Express UI** (Migrate + Benchmarks tabs), **GitHub zipball import**, and a **multi-repository benchmark harness** (`npm run benchmark`, `POST /api/benchmark`).

This document is written for **judges and maintainers**: it states what is proven in code today, what is **heuristic** or **storytelling**, and what still requires human review.

---

## The Problem: Why v5 → v6 Hurts

Ethers v6 flattened namespaces (`ethers.providers.*` → root `ethers.*`), renamed utilities, removed `BigNumber` in favour of native `bigint` in typical new code, and tightened typing. Real codebases mix:

- `providers.JsonRpcProvider` destructuring from v5,
- `ethers.constants.*` and `ethers.utils.*`,
- `@ethersproject/*` split packages,
- deployment and event idioms that differ between v5 and v6.

Teams postpone migration because **review cost** dominates: every automated change must be justified against business risk. That is why DoubleSigma optimises for **narrow, explainable rules** first, then **measurement** (benchmarks, diffs, rule hit counts), then **optional AI notes**—not blind bulk rewriting.

---

## Our Solution

### 1) Deterministic codemods (catalog)

Rules live in TypeScript modules merged by `rulesCatalog.ts`. Each rule has stable **IDs** for API and UI, human-readable metadata, and an `apply(source) => string` transform. Examples: JsonRpcProvider paths, constants, `utils` renames, conservative `BigNumber.from("…")` literals, and a **narrow** `await foo.deployed()` removal for the common v5 deployment wait pattern.

**Design choice:** we deliberately **avoid** aggressive transforms such as turning every `.add()` into `+` without type information—those patterns create **false positives** on non-BigNumber numerics.

### 2) Quantum-inspired scan (read-only)

After (or alongside) migration, an optional scan walks source files and counts **heuristic markers** (e.g. `BigNumber`, nested `ethers.providers`, `.deployed()`, `@ethersproject/`). This does **not** mutate code; it produces a compact **summary** and a heuristic score used for ranking and storytelling. Judges can correlate “lots of latent markers” with “few deterministic hits” to explain gaps until AST-based rules land.

### 3) AI advisory (Groq)

When `ai: true` and `GROQ_API_KEY` is present, DoubleSigma selects up to **five changed files** whose post-codemod content still matches a small set of legacy hints, sends **excerpts** to Groq with a strict system prompt, and returns:

- `aiMetrics`: wall time spent in **non-cached** Groq calls, token totals, files processed, cache hits, API call count,
- `aiNotes`: concatenated model text (truncated in API payloads for safety).

**Critical:** model output is **not** applied to disk automatically. Teams must treat it like a senior reviewer comment block.

### 4) Benchmarks

`data/benchmark-repositories.json` lists public GitHub targets with `owner/repo/ref` for the zipball API plus optional `expectedPatterns` and `difficulty` for **deck-friendly** heuristic percentages. The UI and `npm run benchmark` run the **same engine** as production migrations. README numbers should always be **refreshed from a real run** (`docs/benchmark-latest.json`), not invented.

---

## Results (How to Read Them)

| Metric | Meaning |
|--------|---------|
| Files scanned | TypeScript/JavaScript files walked under the repo (excluding `node_modules`, `dist`, dot dirs). |
| Files changed | Files where at least one catalog rule modified text. |
| Rewrites | Sum of per-file rule applications (a file can trigger multiple rules). |
| Heuristic % (UI) | `min(100, rewrites / expectedPatterns × 100)` — **editorial**, not formal coverage. |
| AI files | Count of changed files sent to Groq in the advisory pass (≤5). |
| False positives | Not auto-detected; field reserved for future human review pipelines—defaults to `0` until you track incidents. |

**What “success” means for the hackathon:** reproducible dry-runs, transparent diffs, honest documentation, and a path to AST/jssg-based rules without contradicting earlier guarantees.

---

## Technical Deep Dive (Short)

- **Runner:** `migrationJob` orchestrates dry-run/apply, optional quantum scan, optional AI pass, and log formatting.
- **Codemods:** ethers v5→v6 rewrites use **ast-grep** structural patterns (`@ast-grep/napi` locally; JSSG `codemod:ast-grep` in the Registry package).
- **GitHub path:** `prepareGithubRepo` downloads the official zipball; `migrateFromGithubHttpsUrl` wires CLI flags and cleanup.
- **Web:** `server.ts` exposes REST endpoints; `public/index.html` is a static dashboard (no React bundle) to reduce hackathon friction.
- **Groq client:** `fetch` to OpenAI-compatible Groq endpoint; **SHA-256** cache of `(role, content)` tuples to avoid duplicate billing on identical snippets.

---

## What’s Next

1. **Type-aware rules** — optional oxc/TypeScript semantic hints on top of ast-grep for `Provider` vs `Contract` call sites.
2. **More benchmarks** — expand manifest with repos that stress `BigNumber` chains and events.
3. **Registry** — package metadata for Codemod Registry / community folder (`registry/` starter files in-repo).
4. **Human FP tracking** — wire `falsePositives` to issue templates or CSV sign-off.

---

## Walkthrough: From Zero to a Benchmark Row

1. **Clone DoubleSigma** and `npm install`.
2. `npm run ui` — open the printed localhost URL.
3. **Migrate tab:** pick a preset (e.g. Flashbots provider repo) or paste any public `https://github.com/owner/repo` URL, leave dry-run on, enable Quantum, optionally enable AI if `.env` has `GROQ_API_KEY`, click **Run**.
4. Inspect **appliedRulesSummary** (which catalog IDs fired), **diffs**, and optional **quantumInsights** + **aiNotes**.
5. **Benchmarks tab:** run a single row or **Run all**; export **CSV**, **JSON**, or **HTML report** for judges.

The same flow works headless: `npm run benchmark` writes `docs/benchmark-latest.json` and prints a Markdown table suitable for pasting into README after a real run.

---

## Comparison: Manual vs DoubleSigma (Honest Framing)

| Stage | Manual | DoubleSigma |
|-------|--------|-------------|
| First pass on providers/utils | grep + editor marathon | One dry-run + diff list |
| “Did we miss BigNumber?” | code search + code review | Quantum scan counts + optional Groq bullets |
| Evidence for leadership | subjective | benchmark JSON + exports |
| Risk control | depends on reviewer discipline | deterministic rules bounded; AI never auto-writes |

We do **not** claim a fixed “94.5% coverage” globally—that number only makes sense **per run** against a chosen `expectedPatterns` editorial baseline. The product encourages **measuring** rather than **declaring**.

---

## Security and Secrets

- API keys belong in **`.env`** (ignored by git), not in HTML, not in README, not in Discord screenshots.
- If a key is ever pasted into a chat log, **rotate it immediately** in the provider console.
- Groq calls send **source excerpts** only; avoid pointing the tool at private repos on shared machines without disk encryption policy.

---

## Reproducibility Checklist

- Node **≥ 18**, network access for GitHub zipball.
- `npm run build` before `node` entrypoints that import `dist/`.
- `SKIP_NETWORK_TESTS=1` for CI that must not hit GitHub; enable `RUN_REAL_REPO_TESTS=1` when you intentionally want integration tests.
- For AI: same `GROQ_MODEL` env if you need to pin a model id across machines.

---

## Appendix: File Map (for reviewers)

| Path | Role |
|------|------|
| `src/codemods/rulesCatalog.ts` | Merges all deterministic rules |
| `src/migrationJob.ts` | Orchestrates migrate + quantum + AI |
| `src/ai-agent/groq-service.ts` | Groq HTTP + cache |
| `src/ai-agent/edge-case-pass.ts` | Chooses excerpts, aggregates metrics |
| `src/api/executeGithubBenchmark.ts` | Single-repo harness response |
| `src/web/server.ts` | REST + `/presets.json` |
| `data/benchmark-repositories.json` | Curated public targets |
| `docs/BENCHMARKING.md` | Operator guide |

---

## Closing

DoubleSigma is not claiming to replace human review for production migrations. It **compresses time-to-first-pass** on repetitive v5→v6 edits, **surfaces** remaining risk with quantum-style markers, and **narrates** edge cases with Groq—while keeping deterministic transforms **auditable** rule-by-rule. That combination is what we believe hackathon juries and real teams can evaluate fairly.

The winning move after the hackathon is not a bigger splash screen—it is **narrower false positives**, **AST-backed rules**, and **published benchmark baselines** that other teams can fork and extend.
