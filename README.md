# DoubleSigma — Ethers.js v5 → v6 migration

[![Hackathon](https://img.shields.io/badge/Codemod-Hackathon-blue)](https://codemod.com)
[![ethers](https://img.shields.io/badge/ethers-v5--to--v6-orange)](https://docs.ethers.org/v6/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)
[![Codemod Registry](https://img.shields.io/badge/Codemod%20Registry-@enamorak%2Fdoublesigma--ethers--v5--to--v6-6f42c1)](https://app.codemod.com/registry/@enamorak/doublesigma-ethers-v5-to-v6)

> 👉 **View on Codemod Registry:** [@enamorak/doublesigma-ethers-v5-to-v6](https://app.codemod.com/registry/@enamorak/doublesigma-ethers-v5-to-v6)

## Registry + Benchmarks + Accuracy

- **Published registry package:** [@enamorak/doublesigma-ethers-v5-to-v6](https://app.codemod.com/registry/@enamorak/doublesigma-ethers-v5-to-v6)
- **Latest benchmark source:** [`docs/benchmark-latest.json`](docs/benchmark-latest.json)
- **Current suite result:** **8/8 successful**, **84 rewrites**, **84 changed files**, ~**33.6s** cumulative runtime

| Repository | Result | Rewrites | Impact | Time |
|---|---:|---:|---:|---:|
| [flashbots/ethers-provider-flashbots-bundle](https://github.com/flashbots/ethers-provider-flashbots-bundle) | ✅ | 3 | 100.0% (3/3) | 0.823s |
| [Uniswap/v3-sdk](https://github.com/Uniswap/v3-sdk) | ✅ | 8 | 12.7% (8/63) | 0.585s |
| [ProjectOpenSea/opensea-js](https://github.com/ProjectOpenSea/opensea-js) | ✅ | 5 | 4.4% (5/113) | 1.141s |
| [wagmi-dev/wagmi](https://github.com/wagmi-dev/wagmi) | ✅ | 0 | 0.0% (0/1069) | 3.039s |
| [rainbow-me/rainbowkit](https://github.com/rainbow-me/rainbowkit) | ✅ | 24 | 3.6% (24/670) | 4.253s |
| [aave/aave-v3-core](https://github.com/aave/aave-v3-core) | ✅ | 15 | 18.5% (15/81) | 2.923s |
| [NomicFoundation/hardhat](https://github.com/NomicFoundation/hardhat) | ✅ | 29 | 1.8% (29/1580) | 19.962s |
| [traderjoe-xyz/joe-v2](https://github.com/traderjoe-xyz/joe-v2) | ✅ | 0 | — (0 scanned) | 0.879s |

- **Accuracy posture:** deterministic rule engine, rule-level confidence tags (`high` / `medium` / `low`), and **0 false positives reported** in benchmark runs.
- **Quantum features:** `quantumInsights` reports latent markers (`latentBigNumberMarkers`, `latentNestedProviderMarkers`, `latentDeployedCalls`, `latentEthersProjectImports`) plus `superpositionCoverage`.
- **AI features:** optional Groq advisory reviews changed files and returns notes/metrics (`tokensUsed`, `filesProcessed`, `apiCalls`) without auto-applying edits.

DoubleSigma is a **deterministic** migrator for common ethers v5 → v6 API patterns, with:

- **CLI** and **local web UI** (same engine).
- **GitHub URL import** via the official zipball API (no local `git` required).
- A **catalog of every codemod** (titles, descriptions, v5/v6 hints) exposed at `GET /api/rules`.
- After each run, the API returns **`appliedRulesSummary`** (what actually rewrote your code) and **`rulesWithoutMatch`** (catalog entries that did not hit).

Published package on Codemod Registry: [@enamorak/doublesigma-ethers-v5-to-v6](https://app.codemod.com/registry/@enamorak/doublesigma-ethers-v5-to-v6).

---

## Where the browser UI opens

1. Install dependencies: `npm install`
2. Start the dev server: **`npm run ui`**
3. Open the URL printed in the terminal — by default **`http://127.0.0.1:3847`**

The page shows:

- **Migrate** tab: transformation catalog, **local path** or **GitHub HTTPS** form, results (log, metrics, applied rules, diff snippets).
- **Benchmarks** tab: the curated multi-repo list, **Run all** / per-repo **Run**, **Export CSV/JSON** (same dry-run engine as `npm run benchmark`).

Production-style run: `npm run build` then **`npm start`** (same UI from `dist/`).

The dashboard UI is **English** (steps, presets, catalog). Run **`npm run ui`** so `/api/presets` and `/api/rules` resolve; opening `index.html` via a static-only server will break JSON loading.

---

## Why ethers.js v5 → v6 (market)

- **Large footprint:** ethers v5 remains widespread across Web3 JS/TS repos; many projects postponed v6 because the API surface changed (providers, `BigNumber`, events, deployment helpers). A broad view of public repos is easy to explore on [GitHub repository search for ethers.js](https://github.com/search?q=ethers.js&type=repositories).
- **Codemod Registry gap:** As of the hackathon timeframe, **no dedicated “ethers v5 → v6” codemod** sat beside common migrations (ESLint, Express, React patterns, etc.) in public registry narratives — positioning a focused, deterministic tool matters.
- **v6 is the stable target:** v6 has been the supported line for new work; v5 is effectively maintenance-only for many teams — automating the jump reduces calendar time and review load.

---

## Why DoubleSigma? (competitive framing)

| | DoubleSigma | Manual migration | Generic codemods |
|---|-------------|------------------|------------------|
| **Ethers v5→v6 + `@ethersproject/*`** | ✅ Dedicated rule catalog (deterministic core + reviewed import-path rules) | ❌ Slow, inconsistent | ❌ No standard Web3 migration in public registry narratives |
| **False positives (core rules)** | ✅ String-level deterministic transforms | ❌ Human error | ⚠️ Tool-dependent |
| **Quantum-style latent scan** | ✅ Debt signals in API/UI | ❌ | ❌ |
| **Optional AI (Groq)** | ✅ Advisory only (no auto-apply from LLM) | ❌ | ⚠️ Some tools |
| **Real GitHub benchmarks** | ✅ 8-repo dry-run harness + CSV/JSON/HTML export | ❌ | ⚠️ Rare for this stack |

The **Benchmarks** tab also shows **Readiness** (rewrites ÷ quantum `latentBigNumberMarkers` when &gt; 0) and explains **0 rewrites** (e.g. viem-only wagmi v2, JSBI-heavy Uniswap SDK, or patterns not covered yet).

---

## Benchmark results (multi-repo)

The canonical list lives in [`data/benchmark-repositories.json`](data/benchmark-repositories.json) (**8** public targets: Flashbots, Uniswap v3 SDK, OpenSea JS, wagmi, RainbowKit, Aave v3 core, Hardhat, Trader Joe v2 — each with `owner` / `repo` / `ref` for the zipball API plus optional `expectedPatterns` / `difficulty` for the UI). Jury-facing narrative and tables: [`docs/benchmark-results.md`](docs/benchmark-results.md).

| How | What you get |
|-----|----------------|
| **UI** | **Benchmarks** tab → run one repo or **Run all** → **Export CSV / JSON**. |
| **CLI** | `npm run benchmark` → writes [`docs/benchmark-latest.json`](docs/benchmark-latest.json) and prints a Markdown table. |
| **API** | `POST /api/benchmark` with `{ "repoUrl": "https://github.com/owner/repo", "ref": "main" }` → JSON metrics (+ `quantumInsights` when enabled). |

**Do not invent README numbers:** after a full run, copy the CLI table or summarize from `docs/benchmark-latest.json`, then refresh [`docs/benchmark-results.md`](docs/benchmark-results.md). Honest **Impact** (% of scanned JS/TS files touched) and time-saved estimates are defined in [`docs/BENCHMARKING.md`](docs/BENCHMARKING.md) and in the Benchmarks tab UI.

**Note:** Some repos are **viem-first** (e.g. wagmi v2), **JSBI-first** (e.g. Uniswap v3-sdk numerics), or Solidity-heavy — **0 rewrites** can be honest. The catalog now rewrites common **`@ethersproject/abi`** and **`@ethersproject/providers`** imports toward **`ethers`** (see rule confidence in the UI). Always **review diffs** before applying.

See the top section **Registry + Benchmarks + Accuracy** for the latest measured run, precision notes, and quantum/AI capabilities.

---

## Quick start (CLI)

```bash
npm install
npm run build
```

**Local project**

```bash
npm run migrate -- migrate /path/to/project --quantum
npm run migrate -- migrate /path/to/project --apply --quantum
```

**GitHub repository** (download to a temp folder; dry-run deletes the folder by default)

```bash
npm run migrate -- migrate --url https://github.com/compound-finance/compound-js --quantum
```

Keep the temp clone after a dry-run:

```bash
npm run migrate -- migrate --url https://github.com/owner/repo --keep-temp --quantum
```

## Run locally (developer guide)

1. **Install + build**
   ```bash
   npm install
   npm run build
   ```
2. **Start web UI**
   ```bash
   npm run ui
   ```
   Open `http://127.0.0.1:3847`, then use **Migrate** or **Benchmarks** tabs.
3. **Run benchmark suite**
   ```bash
   npm run benchmark
   ```
   This refreshes `docs/benchmark-latest.json`.
4. **Run tests / pre-submit gate**
   ```bash
   npm test
   npm run pre-submit
   ```
5. **Optional AI advisory**
   - Copy `.env.example` → `.env`
   - Set `GROQ_API_KEY`
   - Re-run UI/CLI with AI enabled

## Deploy (Render)

`DoubleSigma` is production-ready for Node hosting with `PORT` support and `npm run start`.

1. Push this repository to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Use these settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Runtime:** Node
4. Add environment variables in Render dashboard:
   - `NODE_ENV=production`
   - `GROQ_API_KEY=<optional>`
   - `PORT` is provided by Render automatically (fallback is `3847` locally)
5. Deploy. Render will provide a public URL for judges.

Infrastructure config is included in [`render.yaml`](render.yaml).

---

## HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Dashboard (static HTML). |
| `GET` | `/api/rules` | JSON catalog: `{ rules: CodemodRuleMeta[] }`. |
| `GET` | `/api/presets` | Curated GitHub repos for the UI (reads `data/benchmark-repositories.json`, then `public/presets.json`, then cwd fallbacks). |
| `POST` | `/api/benchmark` | **`{ repoUrl, ref?, quantum?, ai? }`** → `BenchmarkRunResponse` (metrics, `rulesTriggered`, `quantumInsights`, optional `aiMetrics` / `aiNotes`). |
| `GET` | `/presets.json` | Same JSON array as presets (explicit route + static fallback). |
| `GET` | `/api/health` | Liveness. |
| `POST` | `/api/migrate` | Body: **`{ path, mode?, quantum?, ai? }`** *or* **`{ url, ref?, mode?, cleanup?, quantum?, ai? }`**. |

Successful responses include:

- `metrics` — files scanned, files changed, total rewrites.
- `appliedRulesSummary` — `{ id, rewriteCount, filesAffected }[]` (**recommended transforms for this repo**).
- `rulesWithoutMatch` — catalog rule IDs that did not match any file.
- `diffs` — short `-` / `+` previews per file.
- `workDir` / `cleanedUp` — for GitHub runs (temp path; whether it was removed after dry-run).
- `quantumInsights` — when `quantum: true`, a **read-only** scan of latent v5-shaped markers (BigNumber / `ethers.providers` / `.deployed()` / `@ethersproject/`) plus a heuristic score; **no extra file mutations**.
- `aiMetrics` / `aiNotes` — when `ai: true` **and** `GROQ_API_KEY` is set, an **advisory** Groq pass reviews up to five changed files that still look v5-shaped. Output is **not** auto-applied; inspect `aiNotes` in the UI or JSON.

### Groq (optional AI advisory)

1. Copy [`.env.example`](.env.example) to `.env` in the project root.
2. Set `GROQ_API_KEY` from [Groq Cloud Console](https://console.groq.com/) (free tier).
3. Run `npm run ui` or CLI with `--ai`. **Never commit `.env` or paste keys into issues/chat.**

If the key is missing, migrations still run; `aiMetrics` will show zeros and `aiNotes` will explain the skip.

---

## Implemented codemods

Rules are merged in [`src/codemods/rulesCatalog.ts`](src/codemods/rulesCatalog.ts) (core + [`02-bigint.ts`](src/codemods/02-bigint.ts) + narrow [`04-contracts.ts`](src/codemods/04-contracts.ts)). Examples:

- `ethers.providers.Web3Provider` → `ethers.BrowserProvider`
- `ethers.providers.JsonRpcProvider` / `providers.JsonRpcProvider` → `ethers.JsonRpcProvider`
- `ethers.providers.getNetwork(` → `ethers.getNetwork(` (verify for your usage)
- `.sendTransaction(` → `.broadcastTransaction(` (provider-style calls — review for false positives)
- `ethers.constants.AddressZero` / `HashZero` → `ethers.ZeroAddress` / `ethers.ZeroHash`
- Common `ethers.utils.*` → root helpers (`dataSlice`, `zeroPadValue`, `toQuantity`, `getBytes`, bytes32 helpers, …)
- BigNumber arithmetic/comparisons (reviewed, medium confidence): `.add()`, `.sub()`, `.mul()`, `.div()`, `.eq()`, `.gt()`, `.lt()`, `.gte()`, `.lte()`
- `ethers.BigNumber.from(identifier)` → `BigInt(identifier)` (medium confidence)

See the web catalog or `GET /api/rules` for the full list with descriptions.

---

## Architecture

```text
CLI ──┬──► migrationJob ──► dry-run / apply ──► codemods (rulesCatalog)
      │
      └──► migrateFromGithub ──► githubArchive (zipball) ──► migrationJob

server.ts ──► POST /api/migrate, POST /api/benchmark, GET /api/rules, GET /api/presets, GET /presets.json
public/index.html ──► Migrate + Benchmarks, Groq metrics, CSV/JSON/HTML export
```

---

## Tests (real public repos)

```bash
npm test
```

Fast gate (build + tests; network integration skipped when `CI=true` unless `RUN_REAL_REPO_TESTS=1`):

```bash
npm run pre-submit
```

- **`SKIP_NETWORK_TESTS=1`** — skip integration tests locally.
- In **CI**, set **`RUN_REAL_REPO_TESTS=1`** to enable network tests when `CI=true`.

Full benchmarks hit GitHub for every row in `data/benchmark-repositories.json` — use `npm run benchmark` when you have time and a stable network.

Manifest: [`tests/integration/repos.manifest.json`](tests/integration/repos.manifest.json) (4 repos; includes one repo where **zero** rewrites are expected so we only assert scan coverage).

---

## Honest limitations

- Replacements are **regex/string-based**, not full AST / jssg yet — narrow patterns only; review diffs.
- **GitHub HTTPS only** for URL import (no GitLab in-app; unauthenticated API rate limits apply).
- **Groq AI** is advisory only (no auto-apply); rate limits and model availability apply.
- Narrow `await x.deployed()` removal can misfire if a non-ethers API uses the same shape — rare; still review.

---

## Case study

See [`docs/CASE_STUDY.md`](docs/CASE_STUDY.md).

---

## License

MIT

Official ethers migration guide: [Migrating from v5](https://docs.ethers.org/v6/migrating/).
