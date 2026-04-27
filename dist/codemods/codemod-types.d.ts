export type CodemodConfidence = "high" | "medium" | "low";
export interface CodemodRuleMeta {
    id: string;
    title: string;
    description: string;
    v5Pattern: string;
    v6Replacement: string;
    docsUrl?: string;
    /** Deterministic string replace = high; import-path / alias rewrites = medium by default. */
    confidence?: CodemodConfidence;
}
export interface CodemodRule extends CodemodRuleMeta {
    apply: (source: string) => string;
}
