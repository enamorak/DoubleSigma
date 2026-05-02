import type { Edit } from "@ast-grep/napi";
import { transformSource } from "./ast-helpers.js";
import type { CodemodRule } from "./codemod-types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

/**
 * Narrow contract / deployment helpers.
 */
export const CONTRACT_MIGRATION_RULES: CodemodRule[] = [
  {
    id: "contracts:await-deployed",
    title: "await contract.deployed() → (remove)",
    description:
      "In v6, `deploy()` resolves to a deployed contract; the extra `deployed()` wait is redundant. Removes the whole statement when possible.",
    v5Pattern: "await myContract.deployed()",
    v6Replacement: "(removed)",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits: Edit[] = [];
        for (const node of root.findAll("await $X.deployed()")) {
          const parent = node.parent();
          const target = parent?.kind() === "expression_statement" ? parent : node;
          edits.push(target.replace(""));
        }
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
  },
];
