/**
 * Quantum-inspired: ranks candidate files by number of rules applied (classical
 * "collapse" to highest-weight pattern). For v0.1 this is a lightweight
 * priority signal, not a physical quantum device.
 */
export function rankChangesByAmplitude(changes) {
    return [...changes].sort((a, b) => b.appliedRules.length - a.appliedRules.length || b.after.length - a.after.length);
}
/**
 * One-line report when `--quantum` is on.
 */
export function formatQuantumSummary(changedFiles, totalRewrites) {
    return `quantum: ranked ${changedFiles} file(s), ${totalRewrites} transform edge(s) (superposition-scored)`;
}
