import { transformWithRangeEdits } from "./ast-helpers.js";
import type { CodemodRule } from "./types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

/**
 * Narrow contract / deployment helpers.
 */
export const CONTRACT_MIGRATION_RULES: CodemodRule[] = [
  {
    id: "contracts:await-deployed",
    title: "await contract.deployed() → (remove)",
    confidence: "high",
    description:
      "In v6, `deploy()` resolves to a deployed contract; the extra `deployed()` wait is redundant. Removes the whole statement when possible.",
    was: "await myContract.deployed()",
    now: "(removed)",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformWithRangeEdits(source, "await $X.deployed()", (node) => {
        const parent = node.parent();
        const target = parent?.kind() === "expression_statement" ? parent : node;
        const r = target.range();
        return { start: r.start.index, end: r.end.index, replacement: "" };
      }, fp).code,
  },
];
