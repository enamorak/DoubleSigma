import type { FileChange } from "../types.js";
import type { AiPassMetrics } from "../types.js";
import { groqChatCompletion } from "./groq-service.js";

/** Post-codemod hints that Groq may help with (deterministic rules did not remove these). */
const EDGE_HINT = /BigNumber|ethers\.providers\.|\.deployed\s*\(|@ethersproject\//;

const SYSTEM = `You are an expert on ethers.js v5 → v6 migration.
The user snippet is AFTER deterministic codemods ran. It may still contain legacy patterns.
Reply with:
1) One line "VERDICT: clean" if nothing risky remains, else "VERDICT: review".
2) Up to 5 bullet suggestions (no full file rewrite).
Rules: BigNumber→bigint; providers on root ethers; v6 deploy() needs no .deployed(); events gain an extra arg in some listeners.
Do not invent imports. Keep output under 400 words.`;

function excerptAround(source: string, maxLen: number): string {
  const idx = source.search(EDGE_HINT);
  if (idx < 0) return source.slice(0, maxLen);
  const start = Math.max(0, idx - 400);
  return source.slice(start, start + maxLen);
}

/**
 * Optional Groq pass: reviews a few changed files that still look “v5-shaped”.
 * Does **not** mutate files — advisory only; metrics for UI / logs.
 */
export async function runAiEdgeReview(changes: FileChange[]): Promise<{ metrics: AiPassMetrics; notes: string }> {
  const emptyMetrics = (): AiPassMetrics => ({
    totalTimeMs: 0,
    tokensUsed: 0,
    filesProcessed: 0,
    cacheHits: 0,
    apiCalls: 0,
  });

  if (!process.env.GROQ_API_KEY?.trim()) {
    return {
      metrics: emptyMetrics(),
      notes: "AI skipped: set GROQ_API_KEY in the environment (Groq Cloud). Never commit API keys.",
    };
  }

  const candidates = changes
    .filter((c) => EDGE_HINT.test(c.after))
    .slice(0, 5);

  if (candidates.length === 0) {
    return {
      metrics: emptyMetrics(),
      notes: "AI: no changed files with residual v5-shaped markers in this run.",
    };
  }

  let totalTimeMs = 0;
  let tokensUsed = 0;
  let cacheHits = 0;
  let apiCalls = 0;
  const noteParts: string[] = [];

  for (const c of candidates) {
    const snippet = excerptAround(c.after, 3500);
    const user = `File: ${c.filePath}\n---\n${snippet}\n---`;
    try {
      const { content, metrics } = await groqChatCompletion([
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ]);
      if (metrics.cacheHit) cacheHits += 1;
      else {
        apiCalls += 1;
        totalTimeMs += metrics.durationMs;
        tokensUsed += metrics.totalTokens;
      }
      noteParts.push(`### ${c.filePath}\n${content}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      noteParts.push(`### ${c.filePath}\n(Groq error: ${msg})`);
    }
  }

  const notes = noteParts.join("\n\n").slice(0, 12000);

  return {
    metrics: {
      totalTimeMs,
      tokensUsed,
      filesProcessed: candidates.length,
      cacheHits,
      apiCalls,
    },
    notes,
  };
}
