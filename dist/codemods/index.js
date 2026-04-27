import { CODEMOD_RULES } from "./rulesCatalog.js";
/**
 * Applies deterministic ethers v5->v6 transforms to a single file.
 */
export function transformFile(filePath, source) {
    let current = source;
    const appliedRules = [];
    for (const rule of CODEMOD_RULES) {
        const next = rule.apply(current);
        if (next !== current) {
            appliedRules.push(rule.id);
            current = next;
        }
    }
    if (current === source) {
        return null;
    }
    return {
        filePath,
        before: source,
        after: current,
        appliedRules,
    };
}
export { getCodemodCatalog } from "./rulesCatalog.js";
