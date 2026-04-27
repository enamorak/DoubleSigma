/**
 * Downloads a repository snapshot (zipball) for the given ref (branch, tag, or commit).
 */
export declare function downloadGithubRepoZipball(owner: string, repo: string, ref: string, extractParentDir: string): Promise<string>;
export interface PreparedGithubRepo {
    root: string;
    refUsed: string;
    cleanup: () => Promise<void>;
}
/**
 * Downloads the repo to a fresh temp directory and returns the path to the repository root.
 */
export declare function prepareGithubRepo(owner: string, repo: string, ref?: string): Promise<PreparedGithubRepo>;
