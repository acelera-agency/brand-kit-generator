import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Models pinned for reproducibility. The plan deliberately uses gpt-4o
// because the schemas were designed against its structured-output behavior.
export const MODEL_INTERVIEW = "gpt-4o-2024-08-06";
export const MODEL_GATE = "gpt-4o-2024-08-06";
export const MODEL_CHEAP = "gpt-4o-mini-2024-07-18";
