import { parse } from "codemod:ast-grep";

type LangArg = "typescript" | "tsx" | "javascript";

function langFromPath(filePath: string): LangArg {
  const p = filePath.toLowerCase();
  if (p.endsWith(".tsx") || p.endsWith(".jsx")) return "tsx";
  if (p.endsWith(".js")) return "javascript";
  return "typescript";
}

/** Parse source the same way as local `@ast-grep/napi`, using the JSSG built-in ast-grep runtime. */
export function parseRoot(filePath: string, source: string) {
  return parse(langFromPath(filePath), source).root();
}
