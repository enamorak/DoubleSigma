import { createHash } from "node:crypto";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
/** Fast default; override with GROQ_MODEL if Groq deprecates a model id. */
const DEFAULT_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";
const MAX_CACHE = 100;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface GroqCallMetrics {
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHit: boolean;
}

export interface GroqChatResult {
  content: string;
  metrics: GroqCallMetrics;
}

const responseCache = new Map<string, string>();

function cacheKey(messages: ChatMessage[]): string {
  const h = createHash("sha256");
  for (const m of messages) {
    h.update(m.role);
    h.update("\0");
    h.update(m.content);
    h.update("\n");
  }
  return h.digest("hex");
}

function touchCache(key: string, value: string): void {
  if (responseCache.has(key)) {
    responseCache.delete(key);
  }
  responseCache.set(key, value);
  while (responseCache.size > MAX_CACHE) {
    const oldest = responseCache.keys().next().value as string;
    responseCache.delete(oldest);
  }
}

/**
 * OpenAI-compatible chat completion on Groq Cloud. Uses `GROQ_API_KEY` — never commit keys to git.
 */
export async function groqChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<GroqChatResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const key = cacheKey(messages);
  const cached = responseCache.get(key);
  if (cached !== undefined) {
    return {
      content: cached,
      metrics: {
        durationMs: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cacheHit: true,
      },
    };
  }

  const t0 = Date.now();
  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.1,
    }),
  });

  const durationMs = Date.now() - t0;
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Groq HTTP ${res.status}: ${raw.slice(0, 400)}`);
  }

  let parsed: {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error("Groq returned non-JSON body");
  }

  const content = parsed.choices?.[0]?.message?.content?.trim() ?? "";
  const promptTokens = parsed.usage?.prompt_tokens ?? 0;
  const completionTokens = parsed.usage?.completion_tokens ?? 0;
  const totalTokens = parsed.usage?.total_tokens ?? promptTokens + completionTokens;

  touchCache(key, content);

  return {
    content,
    metrics: {
      durationMs,
      promptTokens,
      completionTokens,
      totalTokens,
      cacheHit: false,
    },
  };
}
