/**
 * Codemod metadata + ast-grep transforms (structural patterns, not regex).
 * IDs are stable for API and UI.
 */

import { BIGINT_MIGRATION_RULES } from "./02-bigint.js";
import { CONTRACT_MIGRATION_RULES } from "./04-contracts.js";
import { ETHERSPROJECT_RULES } from "./05-ethersproject.js";
import { replacePattern, transformSource } from "./ast-helpers.js";
import type { CodemodRule, CodemodRuleMeta } from "./codemod-types.js";

export type { CodemodRule, CodemodRuleMeta } from "./codemod-types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

const CORE_RULES: CodemodRule[] = [
  {
    id: "imports:web3-provider",
    title: "Web3Provider → BrowserProvider",
    description:
      "Wrap EIP-1193 injected providers with BrowserProvider instead of the old Web3Provider name.",
    v5Pattern: "ethers.providers.Web3Provider",
    v6Replacement: "ethers.BrowserProvider",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.providers.Web3Provider", "ethers.BrowserProvider")
      ),
  },
  {
    id: "providers:jsonrpc-nested",
    title: "ethers.providers.JsonRpcProvider → ethers.JsonRpcProvider",
    description: "Provider types moved to the root ethers namespace in v6.",
    v5Pattern: "ethers.providers.JsonRpcProvider",
    v6Replacement: "ethers.JsonRpcProvider",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.providers.JsonRpcProvider", "ethers.JsonRpcProvider")
      ),
  },
  {
    id: "providers:jsonrpc-destructured",
    title: "providers.JsonRpcProvider → ethers.JsonRpcProvider",
    description:
      "When `providers` is imported from ethers v5, replace JsonRpcProvider usages with the root export style.",
    v5Pattern: "providers.JsonRpcProvider",
    v6Replacement: "ethers.JsonRpcProvider",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "providers.JsonRpcProvider", "ethers.JsonRpcProvider")
      ),
  },
  {
    id: "providers:get-network-nested",
    title: "ethers.providers.getNetwork → ethers.getNetwork",
    description: "Flattened provider helpers on the main ethers export (verify behaviour for your chain IDs).",
    v5Pattern: "ethers.providers.getNetwork(",
    v6Replacement: "ethers.getNetwork(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.providers.getNetwork($$$ARGS)", "ethers.getNetwork($$$ARGS)")
      ),
  },
  {
    id: "providers:broadcast-transaction",
    title: "provider.sendTransaction → broadcastTransaction",
    description:
      "On Provider, unsigned broadcast uses broadcastTransaction in v6. Review: contract methods may still use sendTransaction.",
    v5Pattern: ".sendTransaction(",
    v6Replacement: ".broadcastTransaction(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "$RX.sendTransaction($$$ARGS)", "$RX.broadcastTransaction($$$ARGS)")
      ),
  },
  {
    id: "constants:address-zero",
    title: "ethers.constants.AddressZero → ethers.ZeroAddress",
    description: "Constants namespace removed; use top-level ZeroAddress.",
    v5Pattern: "ethers.constants.AddressZero",
    v6Replacement: "ethers.ZeroAddress",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.constants.AddressZero", "ethers.ZeroAddress")
      ),
  },
  {
    id: "constants:hash-zero",
    title: "ethers.constants.HashZero → ethers.ZeroHash",
    description: "Constants namespace removed; use top-level ZeroHash.",
    v5Pattern: "ethers.constants.HashZero",
    v6Replacement: "ethers.ZeroHash",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.constants.HashZero", "ethers.ZeroHash")
      ),
  },
  {
    id: "utils:format-bytes32",
    title: "formatBytes32String → encodeBytes32String",
    description: "Bytes32 string helpers moved off ethers.utils.",
    v5Pattern: "ethers.utils.formatBytes32String(",
    v6Replacement: "ethers.encodeBytes32String(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.utils.formatBytes32String($$$A)", "ethers.encodeBytes32String($$$A)")
      ),
  },
  {
    id: "utils:parse-bytes32",
    title: "parseBytes32String → decodeBytes32String",
    description: "Bytes32 string helpers renamed on root ethers.",
    v5Pattern: "ethers.utils.parseBytes32String(",
    v6Replacement: "ethers.decodeBytes32String(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.utils.parseBytes32String($$$A)", "ethers.decodeBytes32String($$$A)")
      ),
  },
  {
    id: "utils:hex-data-slice",
    title: "hexDataSlice → dataSlice",
    description: "Binary/hex slicing utilities renamed.",
    v5Pattern: "ethers.utils.hexDataSlice(",
    v6Replacement: "ethers.dataSlice(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.utils.hexDataSlice($$$A)", "ethers.dataSlice($$$A)")
      ),
  },
  {
    id: "utils:hex-zero-pad",
    title: "hexZeroPad → zeroPadValue",
    description: "Padding helpers renamed.",
    v5Pattern: "ethers.utils.hexZeroPad(",
    v6Replacement: "ethers.zeroPadValue(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.utils.hexZeroPad($$$A)", "ethers.zeroPadValue($$$A)")
      ),
  },
  {
    id: "utils:hex-value",
    title: "hexValue → toQuantity",
    description: "Quantity / hex encoding helper renamed.",
    v5Pattern: "ethers.utils.hexValue(",
    v6Replacement: "ethers.toQuantity(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.utils.hexValue($$$A)", "ethers.toQuantity($$$A)")
      ),
  },
  {
    id: "utils:arrayify",
    title: "arrayify → getBytes",
    description: "Convert hex/string to Uint8Array via getBytes.",
    v5Pattern: "ethers.utils.arrayify(",
    v6Replacement: "ethers.getBytes(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) =>
        replacePattern(root, "ethers.utils.arrayify($$$A)", "ethers.getBytes($$$A)")
      ),
  },
];

export const CODEMOD_RULES: CodemodRule[] = [
  ...CORE_RULES,
  ...ETHERSPROJECT_RULES,
  ...BIGINT_MIGRATION_RULES,
  ...CONTRACT_MIGRATION_RULES,
];

export function getCodemodCatalog(): CodemodRuleMeta[] {
  return CODEMOD_RULES.map(({ id, title, description, v5Pattern, v6Replacement, docsUrl, confidence }) => ({
    id,
    title,
    description,
    v5Pattern,
    v6Replacement,
    docsUrl,
    confidence: confidence ?? "high",
  }));
}
