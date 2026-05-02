import type { SgNode } from "@ast-grep/napi";
import { parseRoot } from "./parseSource.js";

export interface TransformResult {
  success: boolean;
  code: string;
  changes: number;
}

function sortMatchesByDescIndex(matches: SgNode[]): SgNode[] {
  return [...matches].sort((a, b) => b.range().start.index - a.range().start.index);
}

/**
 * Structural rewrite: find all nodes matching `pattern`, replace matched source ranges
 * from bottom to top so byte offsets stay valid.
 */
export function transformSource(
  source: string,
  pattern: string,
  replacer: (match: SgNode) => string,
  filePath?: string
): TransformResult {
  const fp = filePath ?? "file.ts";
  const root = parseRoot(fp, source);
  const matches = root.findAll(pattern);
  if (matches.length === 0) {
    return { success: true, code: source, changes: 0 };
  }
  const sorted = sortMatchesByDescIndex(matches);
  let newCode = source;
  let changes = 0;
  for (const match of sorted) {
    const range = match.range();
    const start = range.start.index;
    const end = range.end.index;
    const replacement = replacer(match);
    const oldSlice = newCode.slice(start, end);
    if (replacement !== oldSlice) {
      newCode = newCode.slice(0, start) + replacement + newCode.slice(end);
      changes++;
    }
  }
  return { success: true, code: newCode, changes };
}

export function replacePattern(
  source: string,
  pattern: string,
  replacement: string,
  filePath?: string
): TransformResult {
  return transformSource(source, pattern, () => replacement, filePath);
}

export interface SourceRangeEdit {
  start: number;
  end: number;
  replacement: string;
}

/** When the rewritten span is not the same as the pattern root (e.g. whole `expression_statement`). */
export function transformWithRangeEdits(
  source: string,
  pattern: string,
  mapMatch: (m: SgNode) => SourceRangeEdit | null,
  filePath?: string
): TransformResult {
  const fp = filePath ?? "file.ts";
  const root = parseRoot(fp, source);
  const matches = root.findAll(pattern);
  const edits: SourceRangeEdit[] = [];
  for (const m of matches) {
    const e = mapMatch(m);
    if (e) edits.push(e);
  }
  if (edits.length === 0) {
    return { success: true, code: source, changes: 0 };
  }
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let newCode = source;
  let changes = 0;
  for (const e of sorted) {
    const oldSlice = newCode.slice(e.start, e.end);
    if (e.replacement !== oldSlice) {
      newCode = newCode.slice(0, e.start) + e.replacement + newCode.slice(e.end);
      changes++;
    }
  }
  return { success: true, code: newCode, changes };
}

/** Replace leading `oldPrefix` in the matched node text with `newPrefix` (no regex). */
export function replaceMatchedPrefix(match: SgNode, oldPrefix: string, newPrefix: string): string {
  const t = match.text();
  if (!t.startsWith(oldPrefix)) return t;
  return newPrefix + t.slice(oldPrefix.length);
}

const SEND_TX = ".sendTransaction";
const BROADCAST_TX = ".broadcastTransaction";

export function replaceSendTransactionCallee(match: SgNode): string {
  const t = match.text();
  const i = t.indexOf(SEND_TX);
  if (i < 0) return t;
  return t.slice(0, i) + BROADCAST_TX + t.slice(i + SEND_TX.length);
}

/** Decimal digits only (string body without quotes). */
export function isDecimalDigits(inner: string): boolean {
  if (inner.length === 0) return false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
}

/** `0x` + hex digits (string body without quotes). */
export function isHexStringBody(inner: string): boolean {
  if (inner.length < 3) return false;
  if (inner[0] !== "0" || inner[1].toLowerCase() !== "x") return false;
  for (let i = 2; i < inner.length; i++) {
    const c = inner[i]!;
    const ok =
      (c >= "0" && c <= "9") || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");
    if (!ok) return false;
  }
  return true;
}
