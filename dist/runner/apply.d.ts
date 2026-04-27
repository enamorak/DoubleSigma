import { MigrationResult } from "../types.js";
/**
 * Executes migration and writes transformed content to disk.
 */
export declare function runApplyMigration(targetPath: string): Promise<MigrationResult>;
