#!/usr/bin/env node

import path from "node:path";

import { loadDotEnvFile } from "./env/loadDotEnv.js";
import { buildDiffPreviews } from "./diffPreview.js";

loadDotEnvFile();
import { runMigrationJob } from "./migrationJob.js";
import { migrateFromGithubHttpsUrl } from "./remote/migrateFromGithub.js";
import { CliOptions } from "./types.js";

function parseArgs(argv: string[]): CliOptions {
  const args = [...argv];
  const command = args.shift();
  if (command !== "migrate") {
    throw new Error(
      "Usage: doublesigma migrate [path] [--url <https://github.com/...>] [--ref <branch|tag|sha>] [--dry-run|--apply] [--quantum] [--ai] [--keep-temp]"
    );
  }

  let targetPath = ".";
  let repoUrl: string | undefined;
  let ref: string | undefined;
  const flags = new Set<string>();
  let keepTemp = false;

  for (let i = 0; i < args.length; ) {
    const a = args[i];
    if (a === "--url" && args[i + 1]) {
      repoUrl = args[i + 1];
      i += 2;
      continue;
    }
    if (a === "--ref" && args[i + 1]) {
      ref = args[i + 1];
      i += 2;
      continue;
    }
    if (a === "--keep-temp") {
      keepTemp = true;
      i += 1;
      continue;
    }
    if (a.startsWith("--")) {
      flags.add(a);
      i += 1;
      continue;
    }
    targetPath = a;
    i += 1;
  }

  if (repoUrl && targetPath !== ".") {
    throw new Error("When using --url, do not pass a separate path argument.");
  }

  const mode = flags.has("--apply") ? "apply" : "dry-run";

  return {
    targetPath: path.resolve(targetPath),
    mode,
    quantum: flags.has("--quantum"),
    ai: flags.has("--ai"),
    repoUrl,
    ref,
    keepTemp,
  };
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.repoUrl) {
      const cleanupAfterDryRun = options.mode === "dry-run" && !options.keepTemp;
      const payload = await migrateFromGithubHttpsUrl(
        options.repoUrl,
        options.ref,
        {
          mode: options.mode,
          quantum: options.quantum,
          ai: options.ai,
        },
        { cleanupAfterDryRun }
      );
      if (!payload.ok) {
        process.exitCode = 1;
      }
      let extra = "";
      if (payload.source) {
        extra += `\nGitHub: ${payload.source.owner}/${payload.source.repo} @ ${payload.source.ref}\n`;
      }
      if (payload.workDir) {
        extra += `Working copy: ${payload.workDir}\n`;
      }
      if (payload.cleanedUp) {
        extra += "(temporary clone removed after dry-run)\n";
      }
      if (payload.diffs.length > 0) {
        extra += "\n--- Diff previews (first files) ---\n";
        for (const d of payload.diffs.slice(0, 8)) {
          extra += `\n## ${d.filePath}\n${d.preview}\n`;
        }
      }
      process.stdout.write(payload.log + extra);
      return;
    }

    const job = await runMigrationJob(options);
    if (job.logText.startsWith("Error:")) {
      process.exitCode = 1;
    }
    let extra = "";
    if (job.result.changes.length > 0) {
      const previews = buildDiffPreviews(job.result.changes, 8, 8);
      extra += "\n--- Diff previews (first files) ---\n";
      for (const d of previews) {
        extra += `\n## ${d.filePath}\n${d.preview}\n`;
      }
    }
    process.stdout.write(job.logText + extra);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

void main();
