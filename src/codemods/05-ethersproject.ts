import type { SgNode } from "@ast-grep/napi";
import { transformSource } from "./ast-helpers.js";
import type { CodemodRule } from "./types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

const ABI_SQ = "'@ethersproject/abi'";
const ABI_DQ = '"@ethersproject/abi"';
const PROV_SQ = "'@ethersproject/providers'";
const PROV_DQ = '"@ethersproject/providers"';

/** Swap a quoted module path to `"ethers"` without String#replace (split/join only). */
function swapPathToEthers(importLine: string, sqPath: string, dqPath: string): string {
  if (importLine.includes(sqPath)) return importLine.split(sqPath).join('"ethers"');
  if (importLine.includes(dqPath)) return importLine.split(dqPath).join('"ethers"');
  return importLine;
}

function rewriteWeb3ProviderImport(m: SgNode): string {
  let t = swapPathToEthers(m.text(), PROV_SQ, PROV_DQ);
  if (t.includes("{ Web3Provider }")) t = t.split("{ Web3Provider }").join("{ BrowserProvider }");
  return t;
}

/**
 * Narrow transforms for split @ethersproject/* packages (ethers v5 style).
 */
export const ETHERSPROJECT_RULES: CodemodRule[] = [
  {
    id: "ethersproject:import-abi-from-ethers",
    title: "@ethersproject/abi → ethers (Interface, AbiCoder, …)",
    confidence: "medium",
    description:
      "Many ABI helpers moved under the main ethers package in v6. Review: subpath imports are not rewritten.",
    was: "from '@ethersproject/abi'",
    now: 'from "ethers"',
    docsUrl: DOCS,
    apply: (source, fp) => {
      let c = transformSource(
        source,
        `import { $$$SPEC } from '@ethersproject/abi'`,
        (m) => swapPathToEthers(m.text(), ABI_SQ, ABI_DQ),
        fp
      ).code;
      c = transformSource(
        c,
        `import { $$$SPEC } from "@ethersproject/abi"`,
        (m) => swapPathToEthers(m.text(), ABI_SQ, ABI_DQ),
        fp
      ).code;
      return c;
    },
  },
  {
    id: "ethersproject:import-jsonrpc-from-providers",
    title: "@ethersproject/providers (JsonRpcProvider) → ethers",
    confidence: "medium",
    description:
      "Rewrites the common single-name import to `ethers`. Merge with an existing `ethers` import by hand if needed.",
    was: "import { JsonRpcProvider } from '@ethersproject/providers'",
    now: 'import { JsonRpcProvider } from "ethers"',
    docsUrl: DOCS,
    apply: (source, fp) => {
      let c = transformSource(
        source,
        `import { JsonRpcProvider } from '@ethersproject/providers'`,
        (m) => swapPathToEthers(m.text(), PROV_SQ, PROV_DQ),
        fp
      ).code;
      c = transformSource(
        c,
        `import { JsonRpcProvider } from "@ethersproject/providers"`,
        (m) => swapPathToEthers(m.text(), PROV_SQ, PROV_DQ),
        fp
      ).code;
      return c;
    },
  },
  {
    id: "ethersproject:import-web3provider-from-providers",
    title: "@ethersproject/providers (Web3Provider) → BrowserProvider (ethers)",
    confidence: "medium",
    description:
      "Rewrites the import only. Use `new BrowserProvider(...)` at call sites if TypeScript still references Web3Provider.",
    was: "import { Web3Provider } from '@ethersproject/providers'",
    now: 'import { BrowserProvider } from "ethers"',
    docsUrl: DOCS,
    apply: (source, fp) => {
      let c = transformSource(
        source,
        `import { Web3Provider } from '@ethersproject/providers'`,
        rewriteWeb3ProviderImport,
        fp
      ).code;
      c = transformSource(
        c,
        `import { Web3Provider } from "@ethersproject/providers"`,
        rewriteWeb3ProviderImport,
        fp
      ).code;
      return c;
    },
  },
  {
    id: "ethersproject:import-bignumber-manual-review",
    title: "@ethersproject/bignumber import → tagged alias + review",
    confidence: "medium",
    description:
      "BigNumber is removed in v6; this tags the import for manual bigint migration without claiming a safe auto-fix.",
    was: "import { BigNumber } from '@ethersproject/bignumber'",
    now: "import { BigNumber as BigNumberV5 } from … // MANUAL_REVIEW",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, "import { BigNumber } from $P", (node) => {
        const p = node.getMatch("P");
        const pt = p?.text();
        if (!pt || !pt.includes("@ethersproject/bignumber")) return node.text();
        return `import { BigNumber as BigNumberV5 } from ${pt} // MANUAL_REVIEW: ethers v6 — migrate usages to bigint`;
      }, fp).code,
  },
];
