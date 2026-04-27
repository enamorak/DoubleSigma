import { promises as fs } from "node:fs";
import path from "node:path";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
/**
 * Recursively lists source files under root (skips node_modules, dist, dot dirs).
 */
export async function collectSourceFiles(root) {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
                continue;
            }
            files.push(...(await collectSourceFiles(fullPath)));
            continue;
        }
        if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
}
