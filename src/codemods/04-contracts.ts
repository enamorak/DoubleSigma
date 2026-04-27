import type { CodemodRule } from "./codemod-types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

/**
 * Narrow contract / deployment helpers. Avoid broad `.deployTransaction` renames without AST.
 */
export const CONTRACT_MIGRATION_RULES: CodemodRule[] = [
  {
    id: "contracts:await-deployed",
    title: "await contract.deployed() → (remove)",
    description:
      "In v6, `deploy()` resolves to a deployed contract; the extra `deployed()` wait is redundant. Only matches `await <id>.deployed()`.",
    v5Pattern: "await myContract.deployed()",
    v6Replacement: "(removed)",
    docsUrl: DOCS,
    apply: (source) => source.replace(/\bawait\s+([A-Za-z_$][\w$]*)\.deployed\s*\(\s*\)\s*;?/g, ""),
  },
];
