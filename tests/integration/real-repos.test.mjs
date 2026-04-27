import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const manifest = JSON.parse(
  await readFile(new URL("./repos.manifest.json", import.meta.url), "utf8")
);

const skipNetwork =
  process.env.SKIP_NETWORK_TESTS === "1" ||
  (process.env.CI === "true" && process.env.RUN_REAL_REPO_TESTS !== "1");

const { migrateFromGithubHttpsUrl } = await import("../../dist/remote/migrateFromGithub.js");

if (skipNetwork) {
  test("real GitHub repos (skipped: set RUN_REAL_REPO_TESTS=1 in CI or unset SKIP_NETWORK_TESTS)", () => {
    assert.ok(true);
  });
} else {
  for (const repo of manifest) {
    test(`real repo: ${repo.id}`, async () => {
      const url = `https://github.com/${repo.owner}/${repo.repo}`;
      const payload = await migrateFromGithubHttpsUrl(
        url,
        repo.ref,
        { mode: "dry-run", quantum: true, ai: false },
        { cleanupAfterDryRun: true }
      );
      assert.equal(payload.ok, true, payload.log);
      assert.ok(
        payload.metrics.scannedFiles >= repo.minScannedFiles,
        `scannedFiles: ${payload.metrics.scannedFiles}`
      );
      assert.ok(
        payload.metrics.changedFiles >= repo.minChangedFiles,
        `changedFiles: ${payload.metrics.changedFiles}`
      );
      if (repo.minChangedFiles > 0) {
        assert.ok(
          payload.diffs.length >= repo.minChangedFiles,
          "expected diff previews for changed files"
        );
        assert.ok(
          Array.isArray(payload.appliedRulesSummary) && payload.appliedRulesSummary.length >= 1,
          "expected appliedRulesSummary from API"
        );
      } else {
        assert.ok(Array.isArray(payload.appliedRulesSummary), "appliedRulesSummary present");
      }
    });
  }
}
