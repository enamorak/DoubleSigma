/**
 * Parses a public GitHub HTTPS URL into owner, repo, and optional ref from /tree/.
 * Only https://github.com/* is allowed (no credentials, no other hosts).
 */
export declare function parseGithubRepoUrl(raw: string): {
    owner: string;
    repo: string;
    ref?: string;
} | null;
