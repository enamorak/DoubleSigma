const DOCS = "https://docs.ethers.org/v6/migrating/";
/**
 * Conservative BigNumber → bigint / BigInt() transforms only where the literal is unambiguous.
 * Broader `.add()` / `.eq()` rewrites require AST + type info (false-positive risk).
 */
export const BIGINT_MIGRATION_RULES = [
    {
        id: "bigint:from-decimal-string-double",
        title: "BigNumber.from(\"digits\") → bigint literal",
        description: "Only pure decimal string literals inside double quotes (no scientific notation, no variables).",
        v5Pattern: "ethers.BigNumber.from(\"12345\")",
        v6Replacement: "12345n",
        docsUrl: DOCS,
        apply: (source) => source.replace(/ethers\.BigNumber\.from\("(\d+)"\)/g, (_, digits) => `${digits}n`),
    },
    {
        id: "bigint:from-decimal-string-single",
        title: "BigNumber.from('digits') → bigint literal",
        description: "Same as double-quote variant for single-quoted decimal strings.",
        v5Pattern: "ethers.BigNumber.from('12345')",
        v6Replacement: "12345n",
        docsUrl: DOCS,
        apply: (source) => source.replace(/ethers\.BigNumber\.from\('(\d+)'\)/g, (_, digits) => `${digits}n`),
    },
    {
        id: "bigint:from-hex-string",
        title: "BigNumber.from(\"0x…\") → BigInt(\"0x…\")",
        description: "Hex payloads as strings become native BigInt (preserves large width).",
        v5Pattern: "ethers.BigNumber.from(\"0x…\")",
        v6Replacement: "BigInt(\"0x…\")",
        docsUrl: DOCS,
        apply: (source) => source.replace(/ethers\.BigNumber\.from\("(0x[0-9a-fA-F]+)"\)/g, (_, hex) => `BigInt("${hex}")`),
    },
    {
        id: "bigint:from-hex-string-single",
        title: "BigNumber.from('0x…') → BigInt('0x…')",
        description: "Single-quoted hex string variant.",
        v5Pattern: "ethers.BigNumber.from('0x…')",
        v6Replacement: "BigInt('0x…')",
        docsUrl: DOCS,
        apply: (source) => source.replace(/ethers\.BigNumber\.from\('(0x[0-9a-fA-F]+)'\)/g, (_, hex) => `BigInt('${hex}')`),
    },
];
