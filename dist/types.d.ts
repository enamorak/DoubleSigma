export type MigrationMode = "dry-run" | "apply";
export interface CliOptions {
    targetPath: string;
    mode: MigrationMode;
    quantum: boolean;
    ai: boolean;
    /** When set, CLI downloads this GitHub repo instead of using `targetPath`. */
    repoUrl?: string;
    /** Branch / tag / commit for `--url` (optional). */
    ref?: string;
    /** CLI: with `--url` + dry-run, keep temp clone on disk. */
    keepTemp?: boolean;
}
export interface FileChange {
    filePath: string;
    before: string;
    after: string;
    appliedRules: string[];
}
/** Read-only “quantum-inspired” scan of latent v5-era surface (no code mutations). */
export interface QuantumInsights {
    /** Heuristic 0–1 score: higher suggests less remaining v5-shaped surface vs. repo size. */
    superpositionCoverage: number;
    /** Approximate BigNumber / numeric-op style markers (migration debt signal). */
    latentBigNumberMarkers: number;
    /** Occurrences of legacy `ethers.providers.` namespace. */
    latentNestedProviderMarkers: number;
    /** `.deployed()` call sites (common v5 pattern). */
    latentDeployedCalls: number;
    /** `@ethersproject/*` imports (v5 split packages). */
    latentEthersProjectImports: number;
    summary: string;
}
/** Aggregated Groq (or other) advisory pass — does not apply edits automatically. */
export interface AiPassMetrics {
    totalTimeMs: number;
    tokensUsed: number;
    filesProcessed: number;
    cacheHits: number;
    apiCalls: number;
}
export interface MigrationResult {
    scannedFiles: number;
    changedFiles: number;
    changes: FileChange[];
    quantumInsights?: QuantumInsights;
    aiMetrics?: AiPassMetrics;
    /** Truncated Groq advisory text (when `ai` was enabled and a key was present). */
    aiNotes?: string;
}
