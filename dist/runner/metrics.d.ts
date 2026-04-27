import { MigrationResult } from "../types.js";
export interface MigrationMetrics {
    scannedFiles: number;
    changedFiles: number;
    totalRewrites: number;
}
export declare function collectMetrics(result: MigrationResult): MigrationMetrics;
