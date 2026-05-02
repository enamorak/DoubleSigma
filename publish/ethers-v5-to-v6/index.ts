import { CODEMOD_RULES } from "./rulesCatalog.js";

export interface FileChange {
  filePath: string;
  before: string;
  after: string;
  appliedRules: string[];
}

/**
 * Applies deterministic ethers v5->v6 transforms to a single file.
 */
export function transformFile(filePath: string, source: string): FileChange | null {
  let current = source;
  const appliedRules: string[] = [];

  for (const rule of CODEMOD_RULES) {
    const next = rule.apply(current, filePath);
    if (next !== current) {
      appliedRules.push(rule.id);
      current = next;
    }
  }

  if (current === source) {
    return null;
  }

  return {
    filePath,
    before: source,
    after: current,
    appliedRules,
  };
}

export { getCodemodCatalog } from "./rulesCatalog.js";
export type { CodemodRule, CodemodRuleMeta, CodemodConfidence } from "./types.js";
