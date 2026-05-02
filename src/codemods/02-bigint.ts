import type { Edit, SgNode } from "@ast-grep/napi";
import { transformSource } from "./ast-helpers.js";
import type { CodemodRule } from "./codemod-types.js";

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
      description:
        "Converts direct BigNumber.from(...) method chains to bigint operators. Matches explicit ethers.BigNumber.from on both sides.",
      v5Pattern: `ethers.BigNumber.from(a).${method}(ethers.BigNumber.from(b))`,
      v6Replacement: `(BigInt(a) ${operator} BigInt(b))`,
      docsUrl: DOCS,
      confidence: "medium",
      apply: (source, fp) =>
        transformSource(source, fp, (root) => {
          const edits: Edit[] = [];
          for (const node of root.findAll(chainPattern)) {
            const a = node.getMatch("A")?.text();
            const b = node.getMatch("B")?.text();
            if (a != null && b != null) {
              edits.push(node.replace(`(BigInt(${a}) ${operator} BigInt(${b}))`));
            }
          }
          if (edits.length === 0) return null;
          return root.commitEdits(edits);
        }),
    },
    {
      id: `${id}:identifier-chain`,
      title: `${title} (identifier.${method}(identifier))`,
      description:
        "Conservative identifier-only rewrite for common BigNumber variables. Review: type is not proven by the matcher.",
      v5Pattern: `amountA.${method}(amountB)`,
      v6Replacement: `(amountA ${operator} amountB)`,
      docsUrl: DOCS,
      confidence: "medium",
      apply: (source, fp) =>
        transformSource(source, fp, (root) => {
          const edits: Edit[] = [];
          for (const node of root.findAll(identPattern)) {
            const l = node.getMatch("L");
            const r = node.getMatch("R");
            if (l?.kind() === "identifier" && r?.kind() === "identifier") {
              edits.push(node.replace(`(${l.text()} ${operator} ${r.text()})`));
            }
          }
          if (edits.length === 0) return null;
          return root.commitEdits(edits);
        }),
    },
  ];
}

function editsForBigNumberFromStrings(
  root: SgNode,
  pred: (inner: string, quote: '"' | "'") => string | null
): Edit[] {
  const edits: Edit[] = [];
  for (const node of root.findAll("ethers.BigNumber.from($S)")) {
    const cap = node.getMatch("S");
    if (!cap || cap.kind() !== "string") continue;
    const raw = cap.text();
    const q = raw[0];
    if (q !== '"' && q !== "'") continue;
    const inner = raw.slice(1, -1);
    const rep = pred(inner, q);
    if (rep != null) edits.push(node.replace(rep));
  }
  return edits;
}

/**
 * Conservative BigNumber → bigint / BigInt() transforms only where the match is structurally clear.
 */
export const BIGINT_MIGRATION_RULES: CodemodRule[] = [
  {
    id: "bigint:from-decimal-string-double",
    title: 'BigNumber.from("digits") → bigint literal',
    description: "Only pure decimal string literals in double quotes.",
    v5Pattern: 'ethers.BigNumber.from("12345")',
    v6Replacement: "12345n",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits = editsForBigNumberFromStrings(root, (inner, q) =>
          q === '"' && /^\d+$/.test(inner) ? `${inner}n` : null
        );
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
  },
  {
    id: "bigint:from-decimal-string-single",
    title: "BigNumber.from('digits') → bigint literal",
    description: "Only pure decimal string literals in single quotes.",
    v5Pattern: "ethers.BigNumber.from('12345')",
    v6Replacement: "12345n",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits = editsForBigNumberFromStrings(root, (inner, q) =>
          q === "'" && /^\d+$/.test(inner) ? `${inner}n` : null
        );
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
  },
  {
    id: "bigint:from-hex-string",
    title: 'BigNumber.from("0x…") → BigInt("0x…")',
    description: "Hex payloads as double-quoted strings become native BigInt.",
    v5Pattern: 'ethers.BigNumber.from("0x…")',
    v6Replacement: 'BigInt("0x…")',
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits = editsForBigNumberFromStrings(root, (inner, q) =>
          q === '"' && /^0x[0-9a-fA-F]+$/.test(inner) ? `BigInt("${inner}")` : null
        );
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
  },
  {
    id: "bigint:from-hex-string-single",
    title: "BigNumber.from('0x…') → BigInt('0x…')",
    description: "Hex payloads as single-quoted strings become native BigInt.",
    v5Pattern: "ethers.BigNumber.from('0x…')",
    v6Replacement: "BigInt('0x…')",
    docsUrl: DOCS,
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits = editsForBigNumberFromStrings(root, (inner, q) =>
          q === "'" && /^0x[0-9a-fA-F]+$/.test(inner) ? `BigInt('${inner}')` : null
        );
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
  },
  {
    id: "bigint:from-simple-identifier",
    title: "ethers.BigNumber.from(identifier) → BigInt(identifier)",
    description:
      "Only a single identifier argument (not calls or string literals). May be wrong for decimal string variables — review.",
    v5Pattern: "ethers.BigNumber.from(myVar)",
    v6Replacement: "BigInt(myVar)",
    docsUrl: DOCS,
    confidence: "medium",
    apply: (source, fp) =>
      transformSource(source, fp, (root) => {
        const edits: Edit[] = [];
        for (const node of root.findAll("ethers.BigNumber.from($X)")) {
          const x = node.getMatch("X");
          if (x?.kind() === "identifier") {
            edits.push(node.replace(`BigInt(${x.text()})`));
          }
        }
        if (edits.length === 0) return null;
        return root.commitEdits(edits);
      }),
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
