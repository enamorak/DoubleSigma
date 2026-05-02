import type { Edit, SgNode } from "@ast-grep/napi";
import { transformSource } from "./ast-helpers.js";
import type { CodemodRule } from "./codemod-types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

/**
 * Narrow transforms for split @ethersproject/* packages (ethers v5 style).
 */
export const ETHERSPROJECT_RULES: CodemodRule[] = [
  {
    id: "ethersproject:import-abi-from-ethers",
    title: "@ethersproject/abi → ethers (Interface, AbiCoder, …)",
    description:
      "Many ABI helpers moved under the main ethers package in v6. Review: subpath imports are not rewritten.",
    v5Pattern: "from '@ethersproject/abi'",
    v6Replacement: 'from "ethers"',
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePatternsAbi(root, [
          [`import { $$$SPEC } from '@ethersproject/abi'`, `import { $$$SPEC } from "ethers"`],
          [`import { $$$SPEC } from "@ethersproject/abi"`, `import { $$$SPEC } from "ethers"`],
        ])
      ),
  },
  {
    id: "ethersproject:import-jsonrpc-from-providers",
    title: "@ethersproject/providers (JsonRpcProvider) → ethers",
    description:
      "Rewrites the common single-name import to `ethers`. Merge with an existing `ethers` import by hand if needed.",
    v5Pattern: "import { JsonRpcProvider } from '@ethersproject/providers'",
    v6Replacement: 'import { JsonRpcProvider } from "ethers"',
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePatternsAbi(root, [
          [
            `import { JsonRpcProvider } from '@ethersproject/providers'`,
            `import { JsonRpcProvider } from "ethers"`,
          ],
          [
            `import { JsonRpcProvider } from "@ethersproject/providers"`,
            `import { JsonRpcProvider } from "ethers"`,
          ],
        ])
      ),
  },
  {
    id: "ethersproject:import-web3provider-from-providers",
    title: "@ethersproject/providers (Web3Provider) → BrowserProvider (ethers)",
    description:
      "Rewrites the import only. Use `new BrowserProvider(...)` at call sites if TypeScript still references Web3Provider.",
    v5Pattern: "import { Web3Provider } from '@ethersproject/providers'",
    v6Replacement: 'import { BrowserProvider } from "ethers"',
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePatternsAbi(root, [
          [
            `import { Web3Provider } from '@ethersproject/providers'`,
            `import { BrowserProvider } from "ethers"`,
          ],
          [
            `import { Web3Provider } from "@ethersproject/providers"`,
            `import { BrowserProvider } from "ethers"`,
          ],
        ])
      ),
  },
  {
    id: "ethersproject:import-bignumber-manual-review",
    title: "@ethersproject/bignumber import → tagged alias + review",
    description:
      "BigNumber is removed in v6; this tags the import for manual bigint migration without claiming a safe auto-fix.",
    v5Pattern: "import { BigNumber } from '@ethersproject/bignumber'",
    v6Replacement:
      "import { BigNumber as BigNumberV5 } from '…' // MANUAL_REVIEW: ethers v6 — migrate to bigint",
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits: Edit[] = [];
        for (const node of root.findAll("import { BigNumber } from $P")) {
          const p = node.getMatch("P");
          const pt = p?.text();
          if (!pt || !pt.includes("@ethersproject/bignumber")) continue;
          edits.push(
            node.replace(
              `import { BigNumber as BigNumberV5 } from ${pt} // MANUAL_REVIEW: ethers v6 — migrate usages to bigint`
            )
          );
        }
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
  },
];

function replacePatternsAbi(root: SgNode, pairs: Array<[string, string]>): string | null {
  const edits: Edit[] = [];
  for (const [pattern, replacement] of pairs) {
    for (const n of root.findAll(pattern)) {
      edits.push(n.replace(replacement));
    }
  }
  if (edits.length === 0) return null;
  return root.commitEdits(edits);
}
