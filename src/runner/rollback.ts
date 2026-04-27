export interface RollbackPlan {
  enabled: boolean;
  message: string;
}

/**
 * Placeholder for VCS-based rollback integration.
 */
export function createRollbackPlan(): RollbackPlan {
  return {
    enabled: true,
    message: "Use git restore / git checkout to rollback uncommitted migration changes.",
  };
}
