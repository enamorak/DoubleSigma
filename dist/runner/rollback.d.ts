export interface RollbackPlan {
    enabled: boolean;
    message: string;
}
/**
 * Placeholder for VCS-based rollback integration.
 */
export declare function createRollbackPlan(): RollbackPlan;
