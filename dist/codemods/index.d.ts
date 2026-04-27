import { FileChange } from "../types.js";
/**
 * Applies deterministic ethers v5->v6 transforms to a single file.
 */
export declare function transformFile(filePath: string, source: string): FileChange | null;
export { getCodemodCatalog, type CodemodRule, type CodemodRuleMeta } from "./rulesCatalog.js";
