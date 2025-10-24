import crypto from "crypto";
import { openrouter, generateText } from "./openRouter";
import { groq } from "./groq";
import { gemini } from "./gemini";
import { openai } from "./openAi";
import ollama from "ollama";
import redis from "../redis";

const aiProvider: string = process.env.AI_PROVIDER || "groq";
const isQueryCachingEnabled: boolean =
  process.env.ALLOW_QUERY_CACHING === "true";
const queryCachingCount: number = parseInt(
  process.env.QUERY_CACHING_COUNT || "1000",
  10,
);
const queryCachingTTL: number = parseInt(
  process.env.QUERY_CACHING_TTL || "3600",
  10,
);
/*
 * As time goes by and new models are released,
 * these defaults may need to be updated.
 */
const openRouterModel: string =
  process.env.OPEN_ROUTER_MODEL || "moonshotai/kimi-k2:free";
const groqModel: string =
  process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const geminiModel: string = process.env.GEMINI_MODEL || "gemini-2.0-flash-001";
const openAiModel: string = process.env.OPENAI_MODEL || "gpt-4o";
const ollamaModel: string = process.env.OLLAMA_MODEL || "llama3.1";

function getCacheKey(prompt: string): string {
  const hash = crypto.createHash("sha256").update(prompt).digest("hex");
  return `ai:prompt:${hash}`;
}

export default async function (
  prompt: string,
  model?: string,
): Promise<string | null> {
  const cacheKey = getCacheKey(prompt);
  const today = new Date().toUTCString();
  prompt = prompt.replace("%_TODAY_%", today);

  if (isQueryCachingEnabled) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  let result: string | null;
  /*
   * OpenRouter
   * https://openrouter.ai/docs/api-reference
   */
  if (aiProvider === "openrouter") {
    const { text } = await generateText({
      model: openrouter(model || openRouterModel),
      prompt: prompt,
    });
    result = text;

    /*
     * Groq
     * https://console.groq.com/docs/api-reference
     */
  } else if (aiProvider === "groq") {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model || groqModel,
    });
    result = chatCompletion.choices[0].message.content;

    /*
     * Gemini
     * https://github.com/googleapis/js-genai
     */
  } else if (aiProvider === "gemini") {
    const generateContent = await gemini.models.generateContent({
      model: model || geminiModel,
      contents: prompt,
    });
    result = generateContent.text || null;

    /*
     * OpenAI
     * https://platform.openai.com/docs/api-reference
     */
  } else if (aiProvider === "openai") {
    const chatCompletion = await openai.chat.completions.create({
      model: model || openAiModel,
      messages: [{ role: "user", content: prompt }],
    });
    result = chatCompletion.choices[0].message.content;

    /*
     * Ollama
     * https://github.com/ollama/ollama/tree/main/docs
     */
  } else if (aiProvider === "ollama") {
    const response = await ollama.chat({
      model: model || ollamaModel,
      messages: [{ role: "user", content: prompt }],
    });
    result = response.message.content || null;

    /*
     * Error handling for unsupported AI providers
     */
  } else {
    throw new Error(`Unsupported AI provider: ${aiProvider}`);
  }

  if (isQueryCachingEnabled && result) {
    await redis.set(cacheKey, result, {
      expiration: {
        type: "EX",
        value: queryCachingTTL,
      },
    });
  }
  return result;
}
