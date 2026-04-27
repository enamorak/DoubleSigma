/**
 * Parses a public GitHub HTTPS URL into owner, repo, and optional ref from /tree/.
 * Only https://github.com/* is allowed (no credentials, no other hosts).
 */
export function parseGithubRepoUrl(raw) {
    const trimmed = raw.trim();
    let url;
    try {
        url = new URL(trimmed);
    }
    catch {
        return null;
    }
    if (url.protocol !== "https:") {
        return null;
    }
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "github.com") {
        return null;
    }
    if (url.username || url.password) {
        return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
        return null;
    }
    const owner = segments[0];
    let repo = segments[1];
    if (repo.endsWith(".git")) {
        repo = repo.slice(0, -4);
    }
    let ref;
    if (segments.length >= 4 && segments[2] === "tree") {
        ref = segments[3];
    }
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(owner)) {
        return null;
    }
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(repo)) {
        return null;
    }
    return { owner, repo, ref };
}
