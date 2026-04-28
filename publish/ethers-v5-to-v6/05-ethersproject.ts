import type { CodemodRule } from "./codemod-types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

export const ETHERSPROJECT_RULES: CodemodRule[] = [
  {
    id: "ethersproject:import-abi-from-ethers",
    title: "@ethersproject/abi -> ethers (Interface, AbiCoder, ...)",
    description:
      "Many ABI helpers moved under the main ethers package in v6. Review: subpath imports are not rewritten.",
    v5Pattern: "from '@ethersproject/abi'",
    v6Replacement: "from \"ethers\"",
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source) => source.replace(/from\s+['"]@ethersproject\/abi['"]/g, "from \"ethers\""),
  },
  {
    id: "ethersproject:import-jsonrpc-from-providers",
    title: "@ethersproject/providers (JsonRpcProvider) -> ethers",
    description:
      "Rewrites the common single-name import to ethers. Merge with an existing ethers import by hand if needed.",
    v5Pattern: "import { JsonRpcProvider } from '@ethersproject/providers'",
    v6Replacement: "import { JsonRpcProvider } from \"ethers\"",
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source) =>
      source.replace(
        /import\s*{\s*JsonRpcProvider\s*}\s*from\s*['"]@ethersproject\/providers['"]/g,
        "import { JsonRpcProvider } from \"ethers\""
      ),
  },
  {
    id: "ethersproject:import-web3provider-from-providers",
    title: "@ethersproject/providers (Web3Provider) -> BrowserProvider (ethers)",
    description:
      "Rewrites the import only. Rename new Web3Provider(...) -> new BrowserProvider(...) manually if TypeScript still references Web3Provider.",
    v5Pattern: "import { Web3Provider } from '@ethersproject/providers'",
    v6Replacement: "import { BrowserProvider } from \"ethers\"",
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source) =>
      source.replace(
        /import\s*{\s*Web3Provider\s*}\s*from\s*['"]@ethersproject\/providers['"]/g,
        "import { BrowserProvider } from \"ethers\""
      ),
  },
  {
    id: "ethersproject:import-bignumber-manual-review",
    title: "@ethersproject/bignumber import -> tagged alias + review",
    description:
      "BigNumber is removed in v6; this tags the import for manual bigint migration without claiming a safe auto-fix.",
    v5Pattern: "import { BigNumber } from '@ethersproject/bignumber'",
    v6Replacement:
      "import { BigNumber as BigNumberV5 } from '...' // MANUAL_REVIEW: ethers v6 - migrate to bigint",
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source) =>
      source.replace(
        /import\s*{\s*BigNumber\s*}\s*from\s*(['"])@ethersproject\/bignumber\1(\s*;?)/g,
        "import { BigNumber as BigNumberV5 } from $1@ethersproject/bignumber$1 // MANUAL_REVIEW: ethers v6 - migrate usages to bigint$2"
      ),
  },
];
