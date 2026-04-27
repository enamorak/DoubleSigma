# Benchmark Results — FINAL (Hackathon Submission)

Measured dry-runs against [`data/benchmark-repositories.json`](../data/benchmark-repositories.json). Raw JSON: [`benchmark-latest.json`](benchmark-latest.json). Re-run: `npm run benchmark`.

## Summary

| Metric | Value |
|--------|------|
| Repositories | **8 / 8** successful |
| Total rewrites | **84** |
| False positives (automated reporting) | **0** |
| Approx. total harness time | **~136 s** wall time (sum of per-repo runs on submission machine) |
| Time saved (estimate) | **~4.2 hours** at **3 min / rewrite** |

## Results table

| Repository | Rewrites | Impact | Time | False Positives |
|------------|----------|--------|------|-----------------|
| flashbots/ethers-provider-flashbots-bundle | 3 | 100% | ~0.9 s | 0 |
| Uniswap/v3-sdk | 8 | 12.7% | ~0.9 s | 0 |
| ProjectOpenSea/opensea-js | 5 | 4.4% | ~1.8 s | 0 |
| wagmi-dev/wagmi | 0 | 0% | ~36.5 s | 0 |
| rainbow-me/rainbowkit | 24 | 3.6% | ~26.8 s | 0 |
| aave/aave-v3-core | 15 | 18.5% | ~22.8 s | 0 |
| NomicFoundation/hardhat | 29 | 1.8% | ~33.0 s | 0 |
| traderjoe-xyz/joe-v2 | 0 | — | ~13.5 s | 0 |

**TOTAL:** **84** rewrites · **0** false positives · **~136 s** execution time (benchmark harness) · **~4.2 hours** manual time saved (estimate).

## Readiness note

In the UI, **Readiness** = `min(100%, rewrites ÷ latentBigNumberMarkers × 100)` so coarse quantum markers never produce display values above **100%** even when rewrite count exceeds the heuristic marker tally.
