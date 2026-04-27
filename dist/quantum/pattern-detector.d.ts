import { FileChange } from "../types.js";
/**
 * Quantum-inspired: ranks candidate files by number of rules applied (classical
 * "collapse" to highest-weight pattern). For v0.1 this is a lightweight
 * priority signal, not a physical quantum device.
 */
export declare function rankChangesByAmplitude(changes: FileChange[]): FileChange[];
/**
 * One-line report when `--quantum` is on.
 */
export declare function formatQuantumSummary(changedFiles: number, totalRewrites: number): string;
