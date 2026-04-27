export function collectMetrics(result) {
    let rewrites = 0;
    for (const change of result.changes) {
        rewrites += change.appliedRules.length;
    }
    return {
        scannedFiles: result.scannedFiles,
        changedFiles: result.changedFiles,
        totalRewrites: rewrites,
    };
}
