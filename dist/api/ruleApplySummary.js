import { getCodemodCatalog } from "../codemods/rulesCatalog.js";
/**
 * Aggregates `appliedRules` from all file changes for the dashboard / API.
 */
export function summarizeAppliedRules(changes) {
    const byId = new Map();
    for (const change of changes) {
        for (const ruleId of change.appliedRules) {
            let entry = byId.get(ruleId);
            if (!entry) {
                entry = { rewriteCount: 0, files: new Set() };
                byId.set(ruleId, entry);
            }
            entry.rewriteCount += 1;
            entry.files.add(change.filePath);
        }
    }
    return [...byId.entries()]
        .map(([id, v]) => ({
        id,
        rewriteCount: v.rewriteCount,
        filesAffected: v.files.size,
    }))
        .sort((a, b) => b.rewriteCount - a.rewriteCount || a.id.localeCompare(b.id));
}
/** Catalog IDs that did not produce any rewrite in this run. */
export function listRulesWithoutMatch(applied) {
    const fired = new Set(applied.map((a) => a.id));
    return getCodemodCatalog()
        .map((r) => r.id)
        .filter((id) => !fired.has(id));
}
