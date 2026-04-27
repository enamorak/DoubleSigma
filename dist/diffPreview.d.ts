import type { FileChange } from "./types.js";
export interface DiffPreview {
    filePath: string;
    preview: string;
}
/**
 * Short unified-style snippets for UI / API (not a full git diff).
 */
export declare function buildDiffPreviews(changes: FileChange[], maxFiles: number, maxLinePairs: number): DiffPreview[];
