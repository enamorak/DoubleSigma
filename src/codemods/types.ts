export type CodemodConfidence = "high" | "medium" | "low";

export interface CodemodRule {
  id: string;
  title: string;
  confidence: CodemodConfidence;
  description: string;
  /** Human-readable “before” hint (catalog / UI). */
  was: string;
  /** Human-readable “after” hint (catalog / UI). */
  now: string;
  apply: (source: string, filePath?: string) => string;
  docsUrl?: string;
}

export type CodemodRuleMeta = Omit<CodemodRule, "apply">;
