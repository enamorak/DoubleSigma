/**
 * Minimal publishable JSSG entrypoint.
 * Deterministic regex transforms are implemented in ../index.ts and can be
 * integrated into this AST-driven entrypoint in the next iteration.
 */
export default function transform(root: any) {
  return root;
}
