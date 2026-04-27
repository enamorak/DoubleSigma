# DoubleSigma — Hackathon Submission

## Executive Summary

- **Project:** DoubleSigma — Ethers.js v5 → v6 automated migration (deterministic codemods + quantum scan + optional Groq advisory).
- **Team:** [your name]
- **Repository:** [GitHub URL]

## Key Achievements

- ✅ **8 real-world repositories** benchmarked successfully (dry-run harness)
- ✅ **84 automatic rewrites** with **0** false positives in automated reporting (always review diffs before apply)
- ✅ **~136 seconds** total benchmark harness time (submission run)
- ✅ **~4.2 hours** of estimated manual work saved (3 minutes per rewrite heuristic)
- ✅ Focused **ethers.js** codemod story for **Codemod Registry** positioning

## What DoubleSigma Automates

1. **Providers:** Web3Provider → BrowserProvider, nested `ethers.providers.JsonRpcProvider` → `ethers.JsonRpcProvider`, and related helpers.
2. **Constants:** AddressZero → ZeroAddress, HashZero → ZeroHash.
3. **Utils:** formatBytes32String, hexDataSlice, arrayify → v6 equivalents on `ethers`.
4. **BigNumber:** conservative literals → `bigint` / `BigInt(...)`; optional identifier path (review).
5. **`@ethersproject/*`:** ABI / providers import paths toward `ethers`; tagged bignumber imports for manual bigint migration.
6. **Contracts:** narrow `await contract.deployed()` cleanup where matched.

## Benchmark Results (8 repos)

| Repository | Rewrites | Impact | Time | FP |
|------------|----------|--------|------|-----|
| flashbots/ethers-provider-flashbots-bundle | 3 | 100% | ~0.9 s | 0 |
| Uniswap/v3-sdk | 8 | 12.7% | ~0.9 s | 0 |
| ProjectOpenSea/opensea-js | 5 | 4.4% | ~1.8 s | 0 |
| wagmi-dev/wagmi | 0 | 0% | ~36.5 s | 0 |
| rainbow-me/rainbowkit | 24 | 3.6% | ~26.8 s | 0 |
| aave/aave-v3-core | 15 | 18.5% | ~22.8 s | 0 |
| NomicFoundation/hardhat | 29 | 1.8% | ~33.0 s | 0 |
| traderjoe-xyz/joe-v2 | 0 | — | ~13.5 s | 0 |
| **TOTAL** | **84** | — | **~136 s** | **0** |

Details: [`docs/benchmark-results.md`](docs/benchmark-results.md).

## Links

- **Demo video:** [YouTube or Loom URL]
- **Codemod Registry PR / listing:** [URL]
- **Live demo:** `npm run ui` → default `http://127.0.0.1:3847` (see terminal output)

## Verify locally

```bash
npm install
npm run build
npm test
npm run pre-submit
```
