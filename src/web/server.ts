import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";

import express from "express";

import { executeGithubBenchmark } from "../api/executeGithubBenchmark.js";
import { payloadFromLocalJob } from "../api/localMigratePayload.js";
import { getCodemodCatalog } from "../codemods/rulesCatalog.js";
import { runMigrationJob } from "../migrationJob.js";
import { migrateFromGithubHttpsUrl } from "../remote/migrateFromGithub.js";
import { CliOptions } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..", "..");
const publicDir = path.join(projectRoot, "public");

async function readBenchmarkPresets(): Promise<unknown> {
  const candidates = [
    path.join(projectRoot, "data", "benchmark-repositories.json"),
    path.join(projectRoot, "public", "presets.json"),
    path.join(process.cwd(), "data", "benchmark-repositories.json"),
    path.join(process.cwd(), "public", "presets.json"),
  ];
  let lastErr: Error | undefined;
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      return JSON.parse(raw) as unknown;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("Could not read benchmark presets");
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/presets.json", async (_req, res) => {
  try {
    const data = await readBenchmarkPresets();
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(404).json({ error: msg });
  }
});

app.get("/", async (_req, res) => {
  const html = await readFile(path.join(publicDir, "index.html"), "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});

app.post("/api/migrate", async (req, res) => {
  const body = req.body as {
    path?: string;
    url?: string;
    ref?: string;
    mode?: "dry-run" | "apply";
    quantum?: boolean;
    ai?: boolean;
    /** For GitHub dry-run: if false, keep temp clone on disk (default true = delete after dry-run). */
    cleanup?: boolean;
  };

  const mode: CliOptions["mode"] = body.mode === "apply" ? "apply" : "dry-run";
  const flags: Pick<CliOptions, "mode" | "quantum" | "ai"> = {
    mode,
    quantum: Boolean(body.quantum),
    ai: Boolean(body.ai),
  };

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const localPath = typeof body.path === "string" ? body.path.trim() : "";
  const ref = typeof body.ref === "string" ? body.ref.trim() : undefined;

  if (url && localPath) {
    res.status(400).json({
      ok: false,
      error: "Send either `url` or `path`, not both.",
    });
    return;
  }

  if (url) {
    const cleanupAfterDryRun = body.cleanup !== false;
    const payload = await migrateFromGithubHttpsUrl(url, ref || undefined, flags, { cleanupAfterDryRun });
    res.status(payload.ok ? 200 : 400).json(payload);
    return;
  }

  const targetPath = localPath || ".";
  const job = await runMigrationJob({
    ...flags,
    targetPath,
  });
  const payload = payloadFromLocalJob(job);
  res.status(payload.ok ? 200 : 400).json(payload);
});

app.get("/api/rules", (_req, res) => {
  res.json({ rules: getCodemodCatalog() });
});

app.get("/api/presets", async (_req, res) => {
  try {
    const data = await readBenchmarkPresets();
    res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

/**
 * Dry-run a single public GitHub repo and return timing + rule hits (same engine as `npm run benchmark`).
 * Body: `{ repoUrl: string, ref?: string, quantum?: boolean, ai?: boolean }`
 */
app.post("/api/benchmark", async (req, res) => {
  const body = req.body as { repoUrl?: string; ref?: string; quantum?: boolean; ai?: boolean };
  const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl.trim() : "";
  if (!repoUrl) {
    res.status(400).json({
      ok: false,
      status: "failed",
      repoName: "",
      error: "Missing `repoUrl` (HTTPS github.com/owner/repo)",
      filesScanned: 0,
      filesChanged: 0,
      rewrites: 0,
      distinctRuleCount: 0,
      rulesTriggered: [],
      falsePositives: 0,
      durationMs: 0,
    });
    return;
  }

  const result = await executeGithubBenchmark({
    repoUrl,
    ref: typeof body.ref === "string" ? body.ref : undefined,
    quantum: body.quantum !== false,
    ai: Boolean(body.ai),
  });
  res.status(200).json(result);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "doublesigma-ethers-v6" });
});

/** Static assets (e.g. /presets.json) after API routes so JSON handlers win. */
app.use(express.static(publicDir, { index: false }));

export function startWebServer(port = Number(process.env.PORT) || 3847): Server {
  const server = createServer(app);
  server.listen(port, () => {
    const addr = server.address();
    const actualPort = typeof addr === "object" && addr ? addr.port : port;
    if (process.env.NODE_ENV === "production") {
      console.log(`DoubleSigma UI listening on port ${actualPort}`);
    } else {
      console.log(`DoubleSigma UI: http://127.0.0.1:${actualPort}/`);
    }
  });
  return server;
}

export { app as webApp, publicDir };
