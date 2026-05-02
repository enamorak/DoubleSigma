import { Lang, parse } from "@ast-grep/napi";

export function langFromPath(filePath: string): Lang {
  const p = filePath.toLowerCase();
  if (p.endsWith(".tsx")) return Lang.Tsx;
  if (p.endsWith(".jsx")) return Lang.Tsx;
  if (p.endsWith(".js")) return Lang.JavaScript;
  return Lang.TypeScript;
}

/** Parsed root node for the given path + source (ast-grep / JSSG-compatible API surface). */
export function parseRoot(filePath: string, source: string) {
  return parse(langFromPath(filePath), source).root();
}
