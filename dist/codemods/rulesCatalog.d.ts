/**
 * Codemod metadata + ast-grep transforms (structural patterns, not regex).
 * IDs are stable for API and UI.
 */
import type { CodemodRule, CodemodRuleMeta } from "./codemod-types.js";
export type { CodemodRule, CodemodRuleMeta } from "./codemod-types.js";
export declare const CODEMOD_RULES: CodemodRule[];
export declare function getCodemodCatalog(): CodemodRuleMeta[];
