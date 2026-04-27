import type { MigrationJobResult } from "../migrationJob.js";
import type { MigrateApiPayload } from "../remote/migrateFromGithub.js";
/**
 * JSON shape for `POST /api/migrate` when using a local directory (not GitHub).
 */
export declare function payloadFromLocalJob(job: MigrationJobResult): MigrateApiPayload;
