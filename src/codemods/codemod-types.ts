export type CodemodConfidence = "high" | "medium" | "low";

export interface CodemodRuleMeta {
  id: string;
  title: string;
  description: string;
  v5Pattern: string;
  v6Replacement: string;
  docsUrl?: string;
  /** Import-path / heuristic rewrites default to medium. */
  confidence?: CodemodConfidence;
}

export interface CodemodRule extends CodemodRuleMeta {
  /**
   * Applies the rule using ast-grep structural matching on the parsed file.
   * `filePath` selects the grammar (ts / tsx / js); extension-less callers should pass a `.ts` path.
   */
  apply: (source: string, filePath?: string) => string;
}
