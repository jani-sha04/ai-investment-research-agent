import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

export function getLLM(opts?: { temperature?: number }) {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
  const temperature = opts?.temperature ?? 0.15;

  if (provider === "gemini") {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error(
        "LLM_PROVIDER is set to 'gemini' but GOOGLE_API_KEY is missing."
      );
    }

    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      temperature,
    });
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "LLM_PROVIDER is set to 'openai' but OPENAI_API_KEY is missing."
      );
    }

    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o",
      temperature,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "LLM_PROVIDER is 'anthropic' but ANTHROPIC_API_KEY is missing."
    );
  }

  return new ChatAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    temperature,
  });
}