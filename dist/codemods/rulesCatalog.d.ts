/**
 * Codemod metadata + ast-grep transforms via ast-helpers (slice-based edits, no String#replace on full source).
 */
import type { CodemodRule, CodemodRuleMeta } from "./types.js";
export type { CodemodRule, CodemodRuleMeta } from "./types.js";
export declare const CODEMOD_RULES: CodemodRule[];
export declare function getCodemodCatalog(): CodemodRuleMeta[];
