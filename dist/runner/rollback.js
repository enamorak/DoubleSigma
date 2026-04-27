/**
 * Placeholder for VCS-based rollback integration.
 */
export function createRollbackPlan() {
    return {
        enabled: true,
        message: "Use git restore / git checkout to rollback uncommitted migration changes.",
    };
}
