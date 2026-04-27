import { CliOptions, MigrationResult } from "./types.js";
/**
 * Resolves the migration target. Checks existence when `checkExists` is true.
 */
export declare function resolveTarget(targetPath: string, checkExists: boolean): Promise<{
    ok: true;
    absolute: string;
} | {
    ok: false;
    error: string;
}>;
export interface MigrationJobResult {
    options: CliOptions;
    result: MigrationResult;
    logText: string;
}
/**
 * Full migration: dry-run or apply, optional quantum summary and AI note.
 */
export declare function runMigrationJob(options: CliOptions): Promise<MigrationJobResult>;
