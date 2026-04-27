import type { FileChange } from "./types.js";

export interface DiffPreview {
  filePath: string;
  preview: string;
}

function lineDiffSnippet(before: string, after: string, maxPairs: number): string {
  const a = before.split("\n");
  const b = after.split("\n");
  const out: string[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n && out.length < maxPairs * 2; i += 1) {
    const al = a[i] ?? "";
    const bl = b[i] ?? "";
    if (al !== bl) {
      out.push(`- ${al}`);
      out.push(`+ ${bl}`);
    }
  }
  if (out.length === 0) {
    return "(binary or identical length mismatch — open file for full diff)";
  }
  return out.join("\n");
}

/**
 * Short unified-style snippets for UI / API (not a full git diff).
 */
export function buildDiffPreviews(changes: FileChange[], maxFiles: number, maxLinePairs: number): DiffPreview[] {
  const previews: DiffPreview[] = [];
  const limit = Math.min(changes.length, maxFiles);
  for (let i = 0; i < limit; i += 1) {
    const c = changes[i];
    previews.push({
      filePath: c.filePath,
      preview: lineDiffSnippet(c.before, c.after, maxLinePairs),
    });
  }
  return previews;
}
