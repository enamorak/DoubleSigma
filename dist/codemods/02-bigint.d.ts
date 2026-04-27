import type { CodemodRule } from "./codemod-types.js";
/**
 * Conservative BigNumber → bigint / BigInt() transforms only where the literal is unambiguous.
 * Broader `.add()` / `.eq()` rewrites require AST + type info (false-positive risk).
 */
export declare const BIGINT_MIGRATION_RULES: CodemodRule[];
