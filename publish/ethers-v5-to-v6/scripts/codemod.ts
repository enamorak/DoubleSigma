/**
 * JSSG (JavaScript ast-grep) entrypoint for Codemod Registry.
 * Runs the same rule pipeline as the npm package (`index.ts`), using the built-in `codemod:ast-grep` runtime.
 */
import type { Transform } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

import { CODEMOD_RULES } from "../rulesCatalog.js";

const transform: Transform<TSX> = (root) => {
  const fp = root.filename();
  let current = root.root().text();
  const original = current;

  for (const rule of CODEMOD_RULES) {
    const next = rule.apply(current, fp);
    current = next;
  }

  return current === original ? null : current;
};

export default transform;
