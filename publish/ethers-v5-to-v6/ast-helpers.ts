import type { Edit, SgNode } from "codemod:ast-grep";
import { parseRoot } from "./parseSource.js";

export function transformSource(
  source: string,
  filePath: string | undefined,
  fn: (root: SgNode) => string | null
): string {
  const fp = filePath ?? "file.ts";
  const root = parseRoot(fp, source);
  return fn(root) ?? source;
}

export function replacePattern(root: SgNode, pattern: string, replacement: string): string | null {
  const nodes = root.findAll(pattern);
  if (nodes.length === 0) return null;
  const edits: Edit[] = nodes.map((n) => n.replace(replacement));
  return root.commitEdits(edits);
}

export function replacePatterns(root: SgNode, pairs: Array<[string, string]>): string | null {
  const edits: Edit[] = [];
  for (const [pattern, replacement] of pairs) {
    for (const n of root.findAll(pattern)) {
      edits.push(n.replace(replacement));
    }
  }
  if (edits.length === 0) return null;
  return root.commitEdits(edits);
}
