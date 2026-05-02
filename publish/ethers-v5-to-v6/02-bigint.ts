import type { SgNode } from "codemod:ast-grep";
import { isDecimalDigits, isHexStringBody, transformSource } from "./ast-helpers.js";
import type { CodemodRule } from "./types.js";

const DOCS = "https://docs.ethers.org/v6/migrating/";

function makeBigNumberBinaryRule(
  id: string,
  title: string,
  method: string,
  operator: string
): CodemodRule[] {
  const chainPattern = `ethers.BigNumber.from($A).${method}(ethers.BigNumber.from($B))`;
  const identPattern = `$L.${method}($R)`;
  return [
    {
      id: `${id}:from-chain`,
      title: `${title} (BigNumber.from(...).${method}(BigNumber.from(...)))`,
      confidence: "medium",
      description:
        "Converts direct BigNumber.from(...) method chains to bigint operators. Matches explicit ethers.BigNumber.from on both sides.",
      was: `ethers.BigNumber.from(a).${method}(ethers.BigNumber.from(b))`,
      now: `(BigInt(a) ${operator} BigInt(b))`,
      docsUrl: DOCS,
      apply: (source, fp) =>
        transformSource(source, chainPattern, (node) => {
          const a = node.getMatch("A")?.text();
          const b = node.getMatch("B")?.text();
          if (a == null || b == null) return node.text();
          return `(BigInt(${a}) ${operator} BigInt(${b}))`;
        }, fp).code,
    },
    {
      id: `${id}:identifier-chain`,
      title: `${title} (identifier.${method}(identifier))`,
      confidence: "medium",
      description:
        "Conservative identifier-only rewrite for common BigNumber variables. Review: type is not proven by the matcher.",
      was: `amountA.${method}(amountB)`,
      now: `(amountA ${operator} amountB)`,
      docsUrl: DOCS,
      apply: (source, fp) =>
        transformSource(source, identPattern, (node) => {
          const l = node.getMatch("L");
          const r = node.getMatch("R");
          if (l?.kind() !== "identifier" || r?.kind() !== "identifier") return node.text();
          return `(${l.text()} ${operator} ${r.text()})`;
        }, fp).code,
    },
  ];
}

function bigNumberFromStringReplacer(
  match: SgNode,
  pred: (inner: string, quote: '"' | "'") => string | null
): string {
  const cap = match.getMatch("S");
  if (!cap || cap.kind() !== "string") return match.text();
  const raw = cap.text();
  const q = raw[0];
  if (q !== '"' && q !== "'") return match.text();
  const inner = raw.slice(1, -1);
  const rep = pred(inner, q);
  return rep ?? match.text();
}

/**
 * Conservative BigNumber → bigint / BigInt() transforms only where the match is structurally clear.
 */
export const BIGINT_MIGRATION_RULES: CodemodRule[] = [
  {
    id: "bigint:from-decimal-string-double",
    title: 'BigNumber.from("digits") → bigint literal',
    confidence: "high",
    description: "Only pure decimal string literals in double quotes.",
    was: 'ethers.BigNumber.from("12345")',
    now: "12345n",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.BigNumber.from($S)",
        (m) => bigNumberFromStringReplacer(m, (inner, q) => (q === '"' && isDecimalDigits(inner) ? `${inner}n` : null)),
        fp
      ).code,
  },
  {
    id: "bigint:from-decimal-string-single",
    title: "BigNumber.from('digits') → bigint literal",
    confidence: "high",
    description: "Only pure decimal string literals in single quotes.",
    was: "ethers.BigNumber.from('12345')",
    now: "12345n",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.BigNumber.from($S)",
        (m) => bigNumberFromStringReplacer(m, (inner, q) => (q === "'" && isDecimalDigits(inner) ? `${inner}n` : null)),
        fp
      ).code,
  },
  {
    id: "bigint:from-hex-string",
    title: 'BigNumber.from("0x…") → BigInt("0x…")',
    confidence: "high",
    description: "Hex payloads as double-quoted strings become native BigInt.",
    was: 'ethers.BigNumber.from("0x…")',
    now: 'BigInt("0x…")',
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.BigNumber.from($S)",
        (m) =>
          bigNumberFromStringReplacer(m, (inner, q) =>
            q === '"' && isHexStringBody(inner) ? `BigInt("${inner}")` : null
          ),
        fp
      ).code,
  },
  {
    id: "bigint:from-hex-string-single",
    title: "BigNumber.from('0x…') → BigInt('0x…')",
    confidence: "high",
    description: "Hex payloads as single-quoted strings become native BigInt.",
    was: "ethers.BigNumber.from('0x…')",
    now: "BigInt('0x…')",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(
        source,
        "ethers.BigNumber.from($S)",
        (m) =>
          bigNumberFromStringReplacer(m, (inner, q) =>
            q === "'" && isHexStringBody(inner) ? `BigInt('${inner}')` : null
          ),
        fp
      ).code,
  },
  {
    id: "bigint:from-simple-identifier",
    title: "ethers.BigNumber.from(identifier) → BigInt(identifier)",
    confidence: "medium",
    description:
      "Only a single identifier argument (not calls or string literals). May be wrong for decimal string variables — review.",
    was: "ethers.BigNumber.from(myVar)",
    now: "BigInt(myVar)",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, "ethers.BigNumber.from($X)", (node) => {
        const x = node.getMatch("X");
        if (x?.kind() !== "identifier") return node.text();
        return `BigInt(${x.text()})`;
      }, fp).code,
  },
  ...makeBigNumberBinaryRule("bigint:add", "BigNumber add → +", "add", "+"),
  ...makeBigNumberBinaryRule("bigint:sub", "BigNumber sub → -", "sub", "-"),
  ...makeBigNumberBinaryRule("bigint:mul", "BigNumber mul → *", "mul", "*"),
  ...makeBigNumberBinaryRule("bigint:div", "BigNumber div → /", "div", "/"),
  ...makeBigNumberBinaryRule("bigint:eq", "BigNumber eq → ===", "eq", "==="),
  ...makeBigNumberBinaryRule("bigint:gt", "BigNumber gt → >", "gt", ">"),
  ...makeBigNumberBinaryRule("bigint:lt", "BigNumber lt → <", "lt", "<"),
  ...makeBigNumberBinaryRule("bigint:gte", "BigNumber gte → >=", "gte", ">="),
  ...makeBigNumberBinaryRule("bigint:lte", "BigNumber lte → <=", "lte", "<="),
];
