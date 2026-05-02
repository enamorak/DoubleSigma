/**
 * Single-file ESM bundle for `npx codemod publish` (Rolldown sometimes fails on nested .ts entries on Windows).
 * Run from repo root: `npm run registry:bundle`
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");
const entry = path.join(pkgRoot, "scripts", "codemod.ts");
const outfile = path.join(pkgRoot, "codemod.bundled.mjs");

await esbuild.build({
  absWorkingDir: pkgRoot,
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile,
  external: ["codemod:ast-grep", "codemod:ast-grep/*"],
});

console.log("Wrote", outfile);
