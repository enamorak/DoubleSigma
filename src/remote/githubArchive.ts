import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import AdmZip from "adm-zip";

const USER_AGENT = "DoubleSigma/0.1 (ethers-v5-to-v6 migration tool)";

async function fetchDefaultBranch(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { default_branch: string };
  return data.default_branch;
}

/**
 * Downloads a repository snapshot (zipball) for the given ref (branch, tag, or commit).
 */
export async function downloadGithubRepoZipball(
  owner: string,
  repo: string,
  ref: string,
  extractParentDir: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/zipball/${ref}`;
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub zipball ${res.status}: ${text.slice(0, 200)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  zip.extractAllTo(extractParentDir, true);

  const entries = await readdir(extractParentDir);
  if (entries.length !== 1) {
    throw new Error(`Expected a single root directory after unzip, found ${entries.length}`);
  }

  return path.join(extractParentDir, entries[0]);
}

export interface PreparedGithubRepo {
  root: string;
  refUsed: string;
  cleanup: () => Promise<void>;
}

/**
 * Downloads the repo to a fresh temp directory and returns the path to the repository root.
 */
export async function prepareGithubRepo(
  owner: string,
  repo: string,
  ref?: string
): Promise<PreparedGithubRepo> {
  const parent = await mkdtemp(path.join(os.tmpdir(), `doublesigma-${repo}-`));
  const refUsed = ref ?? (await fetchDefaultBranch(owner, repo));

  try {
    const root = await downloadGithubRepoZipball(owner, repo, refUsed, parent);
    const cleanup = async (): Promise<void> => {
      await rm(parent, { recursive: true, force: true });
    };
    return { root, refUsed, cleanup };
  } catch (error) {
    await rm(parent, { recursive: true, force: true });
    throw error;
  }
}
