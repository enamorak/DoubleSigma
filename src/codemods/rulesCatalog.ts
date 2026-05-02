/**
 * Codemod metadata + ast-grep transforms via ast-helpers (slice-based edits, no String#replace on full source).
 */

import { BIGINT_MIGRATION_RULES } from "./02-bigint.js";
import { CONTRACT_MIGRATION_RULES } from "./04-contracts.js";
import { ETHERSPROJECT_RULES } from "./05-ethersproject.js";
import {
  replaceMatchedPrefix,
  replacePattern,
  replaceSendTransactionCallee,
  transformSource,
} from "./ast-helpers.js";
import type { CodemodRule, CodemodRuleMeta } from "./types.js";

export type { CodemodRule, CodemodRuleMeta } from "./types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

const CORE_RULES: CodemodRule[] = [
  {
    id: "imports:web3-provider",
    title: "Web3Provider → BrowserProvider",
    confidence: "high",
    description:
      "Wrap EIP-1193 injected providers with BrowserProvider instead of the old Web3Provider name.",
    was: "ethers.providers.Web3Provider",
    now: "ethers.BrowserProvider",
    docsUrl: DOCS,
    apply: (source, fp) =>
      replacePattern(source, "ethers.providers.Web3Provider", "ethers.BrowserProvider", fp).code,
  },
  {
    id: "providers:jsonrpc-nested",
    title: "ethers.providers.JsonRpcProvider → ethers.JsonRpcProvider",
    confidence: "high",
    description: "Provider types moved to the root ethers namespace in v6.",
    was: "ethers.providers.JsonRpcProvider",
    now: "ethers.JsonRpcProvider",
    docsUrl: DOCS,
    apply: (source, fp) =>
      replacePattern(source, "ethers.providers.JsonRpcProvider", "ethers.JsonRpcProvider", fp).code,
  },
  {
    id: "providers:jsonrpc-destructured",
    title: "providers.JsonRpcProvider → ethers.JsonRpcProvider",
    confidence: "high",
    description:
      "When `providers` is imported from ethers v5, replace JsonRpcProvider usages with the root export style.",
    was: "providers.JsonRpcProvider",
    now: "ethers.JsonRpcProvider",
    docsUrl: DOCS,
    apply: (source, fp) =>
      replacePattern(source, "providers.JsonRpcProvider", "ethers.JsonRpcProvider", fp).code,
  },
  {
    id: "providers:get-network-nested",
    title: "ethers.providers.getNetwork → ethers.getNetwork",
    confidence: "high",
    description: "Flattened provider helpers on the main ethers export (verify behaviour for your chain IDs).",
    was: "ethers.providers.getNetwork(",
    now: "ethers.getNetwork(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.providers.getNetwork($$$ARGS)",
        (m) => replaceMatchedPrefix(m, "ethers.providers.getNetwork", "ethers.getNetwork"),
        fp
      ).code,
  },
  {
    id: "providers:broadcast-transaction",
    title: "provider.sendTransaction → broadcastTransaction",
    confidence: "high",
    description:
      "On Provider, unsigned broadcast uses broadcastTransaction in v6. Review: contract methods may still use sendTransaction.",
    was: ".sendTransaction(",
    now: ".broadcastTransaction(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, "$RX.sendTransaction($$$ARGS)", replaceSendTransactionCallee, fp).code,
  },
  {
    id: "constants:address-zero",
    title: "ethers.constants.AddressZero → ethers.ZeroAddress",
    confidence: "high",
    description: "Constants namespace removed; use top-level ZeroAddress.",
    was: "ethers.constants.AddressZero",
    now: "ethers.ZeroAddress",
    docsUrl: DOCS,
    apply: (source, fp) =>
      replacePattern(source, "ethers.constants.AddressZero", "ethers.ZeroAddress", fp).code,
  },
  {
    id: "constants:hash-zero",
    title: "ethers.constants.HashZero → ethers.ZeroHash",
    confidence: "high",
    description: "Constants namespace removed; use top-level ZeroHash.",
    was: "ethers.constants.HashZero",
    now: "ethers.ZeroHash",
    docsUrl: DOCS,
    apply: (source, fp) =>
      replacePattern(source, "ethers.constants.HashZero", "ethers.ZeroHash", fp).code,
  },
  {
    id: "utils:format-bytes32",
    title: "formatBytes32String → encodeBytes32String",
    confidence: "high",
    description: "Bytes32 string helpers moved off ethers.utils.",
    was: "ethers.utils.formatBytes32String(",
    now: "ethers.encodeBytes32String(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.utils.formatBytes32String($$$A)",
        (m) => replaceMatchedPrefix(m, "ethers.utils.formatBytes32String", "ethers.encodeBytes32String"),
        fp
      ).code,
  },
  {
    id: "utils:parse-bytes32",
    title: "parseBytes32String → decodeBytes32String",
    confidence: "high",
    description: "Bytes32 string helpers renamed on root ethers.",
    was: "ethers.utils.parseBytes32String(",
    now: "ethers.decodeBytes32String(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.utils.parseBytes32String($$$A)",
        (m) => replaceMatchedPrefix(m, "ethers.utils.parseBytes32String", "ethers.decodeBytes32String"),
        fp
      ).code,
  },
  {
    id: "utils:hex-data-slice",
    title: "hexDataSlice → dataSlice",
    confidence: "high",
    description: "Binary/hex slicing utilities renamed.",
    was: "ethers.utils.hexDataSlice(",
    now: "ethers.dataSlice(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.utils.hexDataSlice($$$A)",
        (m) => replaceMatchedPrefix(m, "ethers.utils.hexDataSlice", "ethers.dataSlice"),
        fp
      ).code,
  },
  {
    id: "utils:hex-zero-pad",
    title: "hexZeroPad → zeroPadValue",
    confidence: "high",
    description: "Padding helpers renamed.",
    was: "ethers.utils.hexZeroPad(",
    now: "ethers.zeroPadValue(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.utils.hexZeroPad($$$A)",
        (m) => replaceMatchedPrefix(m, "ethers.utils.hexZeroPad", "ethers.zeroPadValue"),
        fp
      ).code,
  },
  {
    id: "utils:hex-value",
    title: "hexValue → toQuantity",
    confidence: "high",
    description: "Quantity / hex encoding helper renamed.",
    was: "ethers.utils.hexValue(",
    now: "ethers.toQuantity(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.utils.hexValue($$$A)",
        (m) => replaceMatchedPrefix(m, "ethers.utils.hexValue", "ethers.toQuantity"),
        fp
      ).code,
  },
  {
    id: "utils:arrayify",
    title: "arrayify → getBytes",
    confidence: "high",
    description: "Convert hex/string to Uint8Array via getBytes.",
    was: "ethers.utils.arrayify(",
    now: "ethers.getBytes(",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.utils.arrayify($$$A)",
        (m) => replaceMatchedPrefix(m, "ethers.utils.arrayify", "ethers.getBytes"),
        fp
      ).code,
  },
];

export const CODEMOD_RULES: CodemodRule[] = [
  ...CORE_RULES,
  ...ETHERSPROJECT_RULES,
  ...BIGINT_MIGRATION_RULES,
  ...CONTRACT_MIGRATION_RULES,
];

export function getCodemodCatalog(): CodemodRuleMeta[] {
  return CODEMOD_RULES.map(({ id, title, description, was, now, docsUrl, confidence }) => ({
    id,
    title,
    description,
    was,
    now,
    docsUrl,
    confidence,
  }));
}
