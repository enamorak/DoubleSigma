import type { CodemodRule } from "./codemod-types.js";
/**
 * Conservative BigNumber → bigint / BigInt() transforms only where the match is structurally clear.
 */
export declare const BIGINT_MIGRATION_RULES: CodemodRule[];
