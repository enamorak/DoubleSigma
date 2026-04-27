# DoubleSigma — Ethers.js v5 → v6 migration

[![Hackathon](https://img.shields.io/badge/Codemod-Hackathon-blue)](https://codemod.com)
[![ethers](https://img.shields.io/badge/ethers-v5--to--v6-orange)](https://docs.ethers.org/v6/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org/)

DoubleSigma is a **deterministic** migrator for common ethers v5 → v6 API patterns, with:

- **CLI** and **local web UI** (same engine).
- **GitHub URL import** via the official zipball API (no local `git` required).
- A **catalog of every codemod** (titles, descriptions, v5/v6 hints) exposed at `GET /api/rules`.
- After each run, the API returns **`appliedRulesSummary`** (what actually rewrote your code) and **`rulesWithoutMatch`** (catalog entries that did not hit).

---

## Where the browser UI opens

1. Install dependencies: `npm install`
2. Start the dev server: **`npm run ui`**
3. Open the URL printed in the terminal — by default **`http://127.0.0.1:3847`**

The page shows:

- **Transformation catalog** (all rules from `src/codemods/rulesCatalog.ts`).
- **Local path** or **GitHub HTTPS** migration form.
- **Results**: log, metrics, **which transforms fired** (with jump links into the catalog), rules with no match, and diff snippets.

Production-style run: `npm run build` then **`npm start`** (same UI from `dist/`).

The dashboard UI is **English** (steps, presets, catalog). Run **`npm run ui`** so `/api/presets` and `/api/rules` resolve; opening `index.html` via a static-only server will break JSON loading.

---

## Why ethers.js v5 → v6 (market)

- **Large footprint:** ethers v5 remains widespread across Web3 JS/TS repos; many projects postponed v6 because the API surface changed (providers, `BigNumber`, events, deployment helpers). A broad view of public repos is easy to explore on [GitHub repository search for ethers.js](https://github.com/search?q=ethers.js&type=repositories).
- **Codemod Registry gap:** As of the hackathon timeframe, **no dedicated “ethers v5 → v6” codemod** sat beside common migrations (ESLint, Express, React patterns, etc.) in public registry narratives — positioning a focused, deterministic tool matters.
- **v6 is the stable target:** v6 has been the supported line for new work; v5 is effectively maintenance-only for many teams — automating the jump reduces calendar time and review load.

---

## Public GitHub benchmark (dry-run)

We ran **`npm run benchmark`** (same engine as the UI: zip download + dry-run + rule counters) against **9** curated public repositories listed in [`data/benchmark-repositories.json`](data/benchmark-repositories.json). Raw output: [`docs/benchmark-latest.json`](docs/benchmark-latest.json).

| Repository | Ref | Scanned files | Changed files | Rewrites | Distinct rules | ms |
|------------|-----|---------------:|-------------:|---------:|----------------:|---:|
| compound-finance/compound-js | master | 30 | 6 | 9 | 3 | 1246 |
| flashbots/ethers-provider-flashbots-bundle | master | 3 | 3 | 3 | 1 | 587 |
| pooltogether/v4-client-js | main | 37 | 1 | 1 | 1 | 639 |
| snapshot-labs/snapshot.js | master | 59 | 0 | 0 | 0 | 2175 |
| OffchainLabs/token-bridge-sdk | master | 10 | 0 | 0 | 0 | 1269 |
| ribbon-finance/ribbon-v2 | master | 79 | 14 | 15 | 4 | 6228 |
| eth-infinitism/bundler | main | 90 | 16 | 18 | 4 | 1556 |
| safe-global/safe-core-sdk | main | 365 | 13 | 13 | 1 | 3983 |
| graphprotocol/graph-client | main | 59 | 0 | 0 | 0 | 1514 |

**Aggregate:** **732** source files scanned (sum over repos), **53** files received at least one rewrite, **59** individual rule applications, **9/9** runs completed without transport/API errors.

**Note:** `snapshot.js` and similar codebases often import **`@ethersproject/*`** instead of `ethers.providers.*` strings — our current string rules may match **zero** lines there; that is expected until AST-based rules land.

Reproduce: `npm run benchmark`

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

---

## HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Dashboard (static HTML). |
| `GET` | `/api/rules` | JSON catalog: `{ rules: CodemodRuleMeta[] }`. |
| `GET` | `/api/presets` | Curated GitHub repos for the UI (reads `data/benchmark-repositories.json`, then `public/presets.json`, then cwd fallbacks). |
| `GET` | `/api/health` | Liveness. |
| `POST` | `/api/migrate` | Body: **`{ path, mode?, quantum?, ai? }`** *or* **`{ url, ref?, mode?, cleanup?, quantum?, ai? }`**. |

Successful responses include:

- `metrics` — files scanned, files changed, total rewrites.
- `appliedRulesSummary` — `{ id, rewriteCount, filesAffected }[]` (**recommended transforms for this repo**).
- `rulesWithoutMatch` — catalog rule IDs that did not match any file.
- `diffs` — short `-` / `+` previews per file.
- `workDir` / `cleanedUp` — for GitHub runs (temp path; whether it was removed after dry-run).
- `quantumInsights` — when `quantum: true`, a **read-only** scan of latent v5-shaped markers (BigNumber / `ethers.providers` / `.deployed()` / `@ethersproject/`) plus a heuristic score; **no extra file mutations**.

---

## Implemented codemods

Rules are merged in [`src/codemods/rulesCatalog.ts`](src/codemods/rulesCatalog.ts) (core rules + conservative BigNumber literal rules from [`src/codemods/02-bigint.ts`](src/codemods/02-bigint.ts)). Examples:

- `ethers.providers.Web3Provider` → `ethers.BrowserProvider`
- `ethers.providers.JsonRpcProvider` / `providers.JsonRpcProvider` → `ethers.JsonRpcProvider`
- `ethers.providers.getNetwork(` → `ethers.getNetwork(` (verify for your usage)
- `.sendTransaction(` → `.broadcastTransaction(` (provider-style calls — review for false positives)
- `ethers.constants.AddressZero` / `HashZero` → `ethers.ZeroAddress` / `ethers.ZeroHash`
- Common `ethers.utils.*` → root helpers (`dataSlice`, `zeroPadValue`, `toQuantity`, `getBytes`, bytes32 helpers, …)

See the web catalog or `GET /api/rules` for the full list with descriptions.

---

## Architecture

```text
CLI ──┬──► migrationJob ──► dry-run / apply ──► codemods (rulesCatalog)
      │
      └──► migrateFromGithub ──► githubArchive (zipball) ──► migrationJob

server.ts ──► POST /api/migrate, GET /api/rules
public/index.html ──► catalog + run form + appliedRulesSummary / diffs
```

---

## Tests (real public repos)

Requires network (GitHub API + zipball).

```bash
npm test
```

- **`SKIP_NETWORK_TESTS=1`** — skip integration tests.
- In **CI**, set **`RUN_REAL_REPO_TESTS=1`** to enable network tests when `CI=true`.

Manifest: [`tests/integration/repos.manifest.json`](tests/integration/repos.manifest.json) (4 repos; includes one repo where **zero** rewrites are expected so we only assert scan coverage).

---

## Honest limitations

- Replacements are **regex/string-based**, not full AST / jssg yet — narrow patterns only; review diffs.
- **GitHub HTTPS only** for URL import (no GitLab in-app; unauthenticated API rate limits apply).
- **`--ai`** is reserved; LLM fallback is not wired.

---

## License

MIT

Official ethers migration guide: [Migrating from v5](https://docs.ethers.org/v6/migrating/).
