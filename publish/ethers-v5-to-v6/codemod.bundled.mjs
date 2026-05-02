// parseSource.ts
import { parse } from "codemod:ast-grep";
function langFromPath(filePath) {
  const p = filePath.toLowerCase();
  if (p.endsWith(".tsx") || p.endsWith(".jsx")) return "tsx";
  if (p.endsWith(".js")) return "javascript";
  return "typescript";
}
function parseRoot(filePath, source) {
  return parse(langFromPath(filePath), source).root();
}

// ast-helpers.ts
function sortMatchesByDescIndex(matches) {
  return [...matches].sort((a, b) => b.range().start.index - a.range().start.index);
}
function transformSource(source, pattern, replacer, filePath) {
  const fp = filePath ?? "file.ts";
  const root = parseRoot(fp, source);
  const matches = root.findAll(pattern);
  if (matches.length === 0) {
    return { success: true, code: source, changes: 0 };
  }
  const sorted = sortMatchesByDescIndex(matches);
  let newCode = source;
  let changes = 0;
  for (const match of sorted) {
    const range = match.range();
    const start = range.start.index;
    const end = range.end.index;
    const replacement = replacer(match);
    const oldSlice = newCode.slice(start, end);
    if (replacement !== oldSlice) {
      newCode = newCode.slice(0, start) + replacement + newCode.slice(end);
      changes++;
    }
  }
  return { success: true, code: newCode, changes };
}
function replacePattern(source, pattern, replacement, filePath) {
  return transformSource(source, pattern, () => replacement, filePath);
}
function transformWithRangeEdits(source, pattern, mapMatch, filePath) {
  const fp = filePath ?? "file.ts";
  const root = parseRoot(fp, source);
  const matches = root.findAll(pattern);
  const edits = [];
  for (const m of matches) {
    const e = mapMatch(m);
    if (e) edits.push(e);
  }
  if (edits.length === 0) {
    return { success: true, code: source, changes: 0 };
  }
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let newCode = source;
  let changes = 0;
  for (const e of sorted) {
    const oldSlice = newCode.slice(e.start, e.end);
    if (e.replacement !== oldSlice) {
      newCode = newCode.slice(0, e.start) + e.replacement + newCode.slice(e.end);
      changes++;
    }
  }
  return { success: true, code: newCode, changes };
}
function replaceMatchedPrefix(match, oldPrefix, newPrefix) {
  const t = match.text();
  if (!t.startsWith(oldPrefix)) return t;
  return newPrefix + t.slice(oldPrefix.length);
}
var SEND_TX = ".sendTransaction";
var BROADCAST_TX = ".broadcastTransaction";
function replaceSendTransactionCallee(match) {
  const t = match.text();
  const i = t.indexOf(SEND_TX);
  if (i < 0) return t;
  return t.slice(0, i) + BROADCAST_TX + t.slice(i + SEND_TX.length);
}
function isDecimalDigits(inner) {
  if (inner.length === 0) return false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
}
function isHexStringBody(inner) {
  if (inner.length < 3) return false;
  if (inner[0] !== "0" || inner[1].toLowerCase() !== "x") return false;
  for (let i = 2; i < inner.length; i++) {
    const c = inner[i];
    const ok = c >= "0" && c <= "9" || c >= "a" && c <= "f" || c >= "A" && c <= "F";
    if (!ok) return false;
  }
  return true;
}

// 02-bigint.ts
var DOCS = "https://docs.ethers.org/v6/migrating/";
function makeBigNumberBinaryRule(id, title, method, operator) {
  const chainPattern = `ethers.BigNumber.from($A).${method}(ethers.BigNumber.from($B))`;
  const identPattern = `$L.${method}($R)`;
  return [
    {
      id: `${id}:from-chain`,
      title: `${title} (BigNumber.from(...).${method}(BigNumber.from(...)))`,
      confidence: "medium",
      description: "Converts direct BigNumber.from(...) method chains to bigint operators. Matches explicit ethers.BigNumber.from on both sides.",
      was: `ethers.BigNumber.from(a).${method}(ethers.BigNumber.from(b))`,
      now: `(BigInt(a) ${operator} BigInt(b))`,
      docsUrl: DOCS,
      apply: (source, fp) => transformSource(source, chainPattern, (node) => {
        const a = node.getMatch("A")?.text();
        const b = node.getMatch("B")?.text();
        if (a == null || b == null) return node.text();
        return `(BigInt(${a}) ${operator} BigInt(${b}))`;
      }, fp).code
    },
    {
      id: `${id}:identifier-chain`,
      title: `${title} (identifier.${method}(identifier))`,
      confidence: "medium",
      description: "Conservative identifier-only rewrite for common BigNumber variables. Review: type is not proven by the matcher.",
      was: `amountA.${method}(amountB)`,
      now: `(amountA ${operator} amountB)`,
      docsUrl: DOCS,
      apply: (source, fp) => transformSource(source, identPattern, (node) => {
        const l = node.getMatch("L");
        const r = node.getMatch("R");
        if (l?.kind() !== "identifier" || r?.kind() !== "identifier") return node.text();
        return `(${l.text()} ${operator} ${r.text()})`;
      }, fp).code
    }
  ];
}
function bigNumberFromStringReplacer(match, pred) {
  const cap = match.getMatch("S");
  if (!cap || cap.kind() !== "string") return match.text();
  const raw = cap.text();
  const q = raw[0];
  if (q !== '"' && q !== "'") return match.text();
  const inner = raw.slice(1, -1);
  const rep = pred(inner, q);
  return rep ?? match.text();
}
var BIGINT_MIGRATION_RULES = [
  {
    id: "bigint:from-decimal-string-double",
    title: 'BigNumber.from("digits") \u2192 bigint literal',
    confidence: "high",
    description: "Only pure decimal string literals in double quotes.",
    was: 'ethers.BigNumber.from("12345")',
    now: "12345n",
    docsUrl: DOCS,
    apply: (source, fp) => transformSource(
      source,
      "ethers.BigNumber.from($S)",
      (m) => bigNumberFromStringReplacer(m, (inner, q) => q === '"' && isDecimalDigits(inner) ? `${inner}n` : null),
      fp
    ).code
  },
  {
    id: "bigint:from-decimal-string-single",
    title: "BigNumber.from('digits') \u2192 bigint literal",
    confidence: "high",
    description: "Only pure decimal string literals in single quotes.",
    was: "ethers.BigNumber.from('12345')",
    now: "12345n",
    docsUrl: DOCS,
    apply: (source, fp) => transformSource(
      source,
      "ethers.BigNumber.from($S)",
      (m) => bigNumberFromStringReplacer(m, (inner, q) => q === "'" && isDecimalDigits(inner) ? `${inner}n` : null),
      fp
    ).code
  },
  {
    id: "bigint:from-hex-string",
    title: 'BigNumber.from("0x\u2026") \u2192 BigInt("0x\u2026")',
    confidence: "high",
    description: "Hex payloads as double-quoted strings become native BigInt.",
    was: 'ethers.BigNumber.from("0x\u2026")',
    now: 'BigInt("0x\u2026")',
    docsUrl: DOCS,
    apply: (source, fp) => transformSource(
      source,
      "ethers.BigNumber.from($S)",
      (m) => bigNumberFromStringReplacer(
        m,
        (inner, q) => q === '"' && isHexStringBody(inner) ? `BigInt("${inner}")` : null
      ),
      fp
    ).code
  },
  {
    id: "bigint:from-hex-string-single",
    title: "BigNumber.from('0x\u2026') \u2192 BigInt('0x\u2026')",
    confidence: "high",
    description: "Hex payloads as single-quoted strings become native BigInt.",
    was: "ethers.BigNumber.from('0x\u2026')",
    now: "BigInt('0x\u2026')",
    docsUrl: DOCS,
    apply: (source, fp) => transformSource(
      source,
      "ethers.BigNumber.from($S)",
      (m) => bigNumberFromStringReplacer(
        m,
        (inner, q) => q === "'" && isHexStringBody(inner) ? `BigInt('${inner}')` : null
      ),
      fp
    ).code
  },
  {
    id: "bigint:from-simple-identifier",
    title: "ethers.BigNumber.from(identifier) \u2192 BigInt(identifier)",
    confidence: "medium",
    description: "Only a single identifier argument (not calls or string literals). May be wrong for decimal string variables \u2014 review.",
    was: "ethers.BigNumber.from(myVar)",
    now: "BigInt(myVar)",
    docsUrl: DOCS,
    apply: (source, fp) => transformSource(source, "ethers.BigNumber.from($X)", (node) => {
      const x = node.getMatch("X");
      if (x?.kind() !== "identifier") return node.text();
      return `BigInt(${x.text()})`;
    }, fp).code
  },
  ...makeBigNumberBinaryRule("bigint:add", "BigNumber add \u2192 +", "add", "+"),
  ...makeBigNumberBinaryRule("bigint:sub", "BigNumber sub \u2192 -", "sub", "-"),
  ...makeBigNumberBinaryRule("bigint:mul", "BigNumber mul \u2192 *", "mul", "*"),
  ...makeBigNumberBinaryRule("bigint:div", "BigNumber div \u2192 /", "div", "/"),
  ...makeBigNumberBinaryRule("bigint:eq", "BigNumber eq \u2192 ===", "eq", "==="),
  ...makeBigNumberBinaryRule("bigint:gt", "BigNumber gt \u2192 >", "gt", ">"),
  ...makeBigNumberBinaryRule("bigint:lt", "BigNumber lt \u2192 <", "lt", "<"),
  ...makeBigNumberBinaryRule("bigint:gte", "BigNumber gte \u2192 >=", "gte", ">="),
  ...makeBigNumberBinaryRule("bigint:lte", "BigNumber lte \u2192 <=", "lte", "<=")
];

// 04-contracts.ts
var DOCS2 = "https://docs.ethers.org/v6/migrating/";
var CONTRACT_MIGRATION_RULES = [
  {
    id: "contracts:await-deployed",
    title: "await contract.deployed() \u2192 (remove)",
    confidence: "high",
    description: "In v6, `deploy()` resolves to a deployed contract; the extra `deployed()` wait is redundant. Removes the whole statement when possible.",
    was: "await myContract.deployed()",
    now: "(removed)",
    docsUrl: DOCS2,
    apply: (source, fp) => transformWithRangeEdits(source, "await $X.deployed()", (node) => {
      const parent = node.parent();
      const target = parent?.kind() === "expression_statement" ? parent : node;
      const r = target.range();
      return { start: r.start.index, end: r.end.index, replacement: "" };
    }, fp).code
  }
];

// 05-ethersproject.ts
var DOCS3 = "https://docs.ethers.org/v6/migrating/";
var ABI_SQ = "'@ethersproject/abi'";
var ABI_DQ = '"@ethersproject/abi"';
var PROV_SQ = "'@ethersproject/providers'";
var PROV_DQ = '"@ethersproject/providers"';
function swapPathToEthers(importLine, sqPath, dqPath) {
  if (importLine.includes(sqPath)) return importLine.split(sqPath).join('"ethers"');
  if (importLine.includes(dqPath)) return importLine.split(dqPath).join('"ethers"');
  return importLine;
}
function rewriteWeb3ProviderImport(m) {
  let t = swapPathToEthers(m.text(), PROV_SQ, PROV_DQ);
  if (t.includes("{ Web3Provider }")) t = t.split("{ Web3Provider }").join("{ BrowserProvider }");
  return t;
}
var ETHERSPROJECT_RULES = [
  {
    id: "ethersproject:import-abi-from-ethers",
    title: "@ethersproject/abi \u2192 ethers (Interface, AbiCoder, \u2026)",
    confidence: "medium",
    description: "Many ABI helpers moved under the main ethers package in v6. Review: subpath imports are not rewritten.",
    was: "from '@ethersproject/abi'",
    now: 'from "ethers"',
    docsUrl: DOCS3,
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
    }
  },
  {
    id: "ethersproject:import-jsonrpc-from-providers",
    title: "@ethersproject/providers (JsonRpcProvider) \u2192 ethers",
    confidence: "medium",
    description: "Rewrites the common single-name import to `ethers`. Merge with an existing `ethers` import by hand if needed.",
    was: "import { JsonRpcProvider } from '@ethersproject/providers'",
    now: 'import { JsonRpcProvider } from "ethers"',
    docsUrl: DOCS3,
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
    }
  },
  {
    id: "ethersproject:import-web3provider-from-providers",
    title: "@ethersproject/providers (Web3Provider) \u2192 BrowserProvider (ethers)",
    confidence: "medium",
    description: "Rewrites the import only. Use `new BrowserProvider(...)` at call sites if TypeScript still references Web3Provider.",
    was: "import { Web3Provider } from '@ethersproject/providers'",
    now: 'import { BrowserProvider } from "ethers"',
    docsUrl: DOCS3,
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
    }
  },
  {
    id: "ethersproject:import-bignumber-manual-review",
    title: "@ethersproject/bignumber import \u2192 tagged alias + review",
    confidence: "medium",
    description: "BigNumber is removed in v6; this tags the import for manual bigint migration without claiming a safe auto-fix.",
    was: "import { BigNumber } from '@ethersproject/bignumber'",
    now: "import { BigNumber as BigNumberV5 } from \u2026 // MANUAL_REVIEW",
    docsUrl: DOCS3,
    apply: (source, fp) => transformSource(source, "import { BigNumber } from $P", (node) => {
      const p = node.getMatch("P");
      const pt = p?.text();
      if (!pt || !pt.includes("@ethersproject/bignumber")) return node.text();
      return `import { BigNumber as BigNumberV5 } from ${pt} // MANUAL_REVIEW: ethers v6 \u2014 migrate usages to bigint`;
    }, fp).code
  }
];

// rulesCatalog.ts
var DOCS4 = "https://docs.ethers.org/v6/migrating/";
var CORE_RULES = [
  {
    id: "imports:web3-provider",
    title: "Web3Provider \u2192 BrowserProvider",
    confidence: "high",
    description: "Wrap EIP-1193 injected providers with BrowserProvider instead of the old Web3Provider name.",
    was: "ethers.providers.Web3Provider",
    now: "ethers.BrowserProvider",
    docsUrl: DOCS4,
    apply: (source, fp) => replacePattern(source, "ethers.providers.Web3Provider", "ethers.BrowserProvider", fp).code
  },
  {
    id: "providers:jsonrpc-nested",
    title: "ethers.providers.JsonRpcProvider \u2192 ethers.JsonRpcProvider",
    confidence: "high",
    description: "Provider types moved to the root ethers namespace in v6.",
    was: "ethers.providers.JsonRpcProvider",
    now: "ethers.JsonRpcProvider",
    docsUrl: DOCS4,
    apply: (source, fp) => replacePattern(source, "ethers.providers.JsonRpcProvider", "ethers.JsonRpcProvider", fp).code
  },
  {
    id: "providers:jsonrpc-destructured",
    title: "providers.JsonRpcProvider \u2192 ethers.JsonRpcProvider",
    confidence: "high",
    description: "When `providers` is imported from ethers v5, replace JsonRpcProvider usages with the root export style.",
    was: "providers.JsonRpcProvider",
    now: "ethers.JsonRpcProvider",
    docsUrl: DOCS4,
    apply: (source, fp) => replacePattern(source, "providers.JsonRpcProvider", "ethers.JsonRpcProvider", fp).code
  },
  {
    id: "providers:get-network-nested",
    title: "ethers.providers.getNetwork \u2192 ethers.getNetwork",
    confidence: "high",
    description: "Flattened provider helpers on the main ethers export (verify behaviour for your chain IDs).",
    was: "ethers.providers.getNetwork(",
    now: "ethers.getNetwork(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.providers.getNetwork($$$ARGS)",
      (m) => replaceMatchedPrefix(m, "ethers.providers.getNetwork", "ethers.getNetwork"),
      fp
    ).code
  },
  {
    id: "providers:broadcast-transaction",
    title: "provider.sendTransaction \u2192 broadcastTransaction",
    confidence: "high",
    description: "On Provider, unsigned broadcast uses broadcastTransaction in v6. Review: contract methods may still use sendTransaction.",
    was: ".sendTransaction(",
    now: ".broadcastTransaction(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(source, "$RX.sendTransaction($$$ARGS)", replaceSendTransactionCallee, fp).code
  },
  {
    id: "constants:address-zero",
    title: "ethers.constants.AddressZero \u2192 ethers.ZeroAddress",
    confidence: "high",
    description: "Constants namespace removed; use top-level ZeroAddress.",
    was: "ethers.constants.AddressZero",
    now: "ethers.ZeroAddress",
    docsUrl: DOCS4,
    apply: (source, fp) => replacePattern(source, "ethers.constants.AddressZero", "ethers.ZeroAddress", fp).code
  },
  {
    id: "constants:hash-zero",
    title: "ethers.constants.HashZero \u2192 ethers.ZeroHash",
    confidence: "high",
    description: "Constants namespace removed; use top-level ZeroHash.",
    was: "ethers.constants.HashZero",
    now: "ethers.ZeroHash",
    docsUrl: DOCS4,
    apply: (source, fp) => replacePattern(source, "ethers.constants.HashZero", "ethers.ZeroHash", fp).code
  },
  {
    id: "utils:format-bytes32",
    title: "formatBytes32String \u2192 encodeBytes32String",
    confidence: "high",
    description: "Bytes32 string helpers moved off ethers.utils.",
    was: "ethers.utils.formatBytes32String(",
    now: "ethers.encodeBytes32String(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.utils.formatBytes32String($$$A)",
      (m) => replaceMatchedPrefix(m, "ethers.utils.formatBytes32String", "ethers.encodeBytes32String"),
      fp
    ).code
  },
  {
    id: "utils:parse-bytes32",
    title: "parseBytes32String \u2192 decodeBytes32String",
    confidence: "high",
    description: "Bytes32 string helpers renamed on root ethers.",
    was: "ethers.utils.parseBytes32String(",
    now: "ethers.decodeBytes32String(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.utils.parseBytes32String($$$A)",
      (m) => replaceMatchedPrefix(m, "ethers.utils.parseBytes32String", "ethers.decodeBytes32String"),
      fp
    ).code
  },
  {
    id: "utils:hex-data-slice",
    title: "hexDataSlice \u2192 dataSlice",
    confidence: "high",
    description: "Binary/hex slicing utilities renamed.",
    was: "ethers.utils.hexDataSlice(",
    now: "ethers.dataSlice(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.utils.hexDataSlice($$$A)",
      (m) => replaceMatchedPrefix(m, "ethers.utils.hexDataSlice", "ethers.dataSlice"),
      fp
    ).code
  },
  {
    id: "utils:hex-zero-pad",
    title: "hexZeroPad \u2192 zeroPadValue",
    confidence: "high",
    description: "Padding helpers renamed.",
    was: "ethers.utils.hexZeroPad(",
    now: "ethers.zeroPadValue(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.utils.hexZeroPad($$$A)",
      (m) => replaceMatchedPrefix(m, "ethers.utils.hexZeroPad", "ethers.zeroPadValue"),
      fp
    ).code
  },
  {
    id: "utils:hex-value",
    title: "hexValue \u2192 toQuantity",
    confidence: "high",
    description: "Quantity / hex encoding helper renamed.",
    was: "ethers.utils.hexValue(",
    now: "ethers.toQuantity(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.utils.hexValue($$$A)",
      (m) => replaceMatchedPrefix(m, "ethers.utils.hexValue", "ethers.toQuantity"),
      fp
    ).code
  },
  {
    id: "utils:arrayify",
    title: "arrayify \u2192 getBytes",
    confidence: "high",
    description: "Convert hex/string to Uint8Array via getBytes.",
    was: "ethers.utils.arrayify(",
    now: "ethers.getBytes(",
    docsUrl: DOCS4,
    apply: (source, fp) => transformSource(
      source,
      "ethers.utils.arrayify($$$A)",
      (m) => replaceMatchedPrefix(m, "ethers.utils.arrayify", "ethers.getBytes"),
      fp
    ).code
  }
];
var CODEMOD_RULES = [
  ...CORE_RULES,
  ...ETHERSPROJECT_RULES,
  ...BIGINT_MIGRATION_RULES,
  ...CONTRACT_MIGRATION_RULES
];

// scripts/codemod.ts
var transform = (root) => {
  const fp = root.filename();
  let current = root.root().text();
  const original = current;
  for (const rule of CODEMOD_RULES) {
    const next = rule.apply(current, fp);
    current = next;
  }
  return current === original ? null : current;
};
var codemod_default = transform;
export {
  codemod_default as default
};
