import { promises as fs } from "node:fs";
import { collectSourceFiles } from "../runner/source-files.js";
function countMatches(source, re) {
    return (source.match(re) ?? []).length;
}
/**
 * Quantum-inspired **read-only** scan: treats each file as a superposition of migration hypotheses,
 * collapses to aggregate “latent work” counters (no mutations — safe for false-positive budget).
 */
export async function scanQuantumMarkers(root) {
    const files = await collectSourceFiles(root);
    let latentBigNumberMarkers = 0;
    let latentNestedProviderMarkers = 0;
    let latentDeployedCalls = 0;
    let latentEthersProjectImports = 0;
    for (const filePath of files) {
        const source = await fs.readFile(filePath, "utf8");
        latentBigNumberMarkers += countMatches(source, /\bBigNumber\b/g);
        latentBigNumberMarkers += countMatches(source, /\.(?:add|sub|mul|div|eq|gt|lt)\s*\(/g);
        latentNestedProviderMarkers += countMatches(source, /ethers\.providers\./g);
        latentDeployedCalls += countMatches(source, /\.deployed\s*\(\s*\)/g);
        latentEthersProjectImports += countMatches(source, /@ethersproject\//g);
    }
    const burden = latentBigNumberMarkers +
        latentNestedProviderMarkers +
        latentDeployedCalls * 2 +
        latentEthersProjectImports;
    const superpositionCoverage = burden === 0 ? 1 : Math.min(1, files.length / (burden + files.length));
    const summary = `quantum scan: latent BN/ops≈${latentBigNumberMarkers}, nested providers≈${latentNestedProviderMarkers}, .deployed()≈${latentDeployedCalls}, @ethersproject≈${latentEthersProjectImports} (files=${files.length})`;
    return {
        superpositionCoverage: Number(superpositionCoverage.toFixed(3)),
        latentBigNumberMarkers,
        latentNestedProviderMarkers,
        latentDeployedCalls,
        latentEthersProjectImports,
        summary,
    };
}
