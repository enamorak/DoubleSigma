/**
 * Recursively lists source files under root (skips node_modules, dist, dot dirs).
 */
export declare function collectSourceFiles(root: string): Promise<string[]>;
