import { createClient } from "v0-sdk";

type V0Client = ReturnType<typeof createClient>;

let _client: V0Client | null = null;

export function getV0Client(): V0Client {
  if (!_client) {
    if (!process.env.V0_API_KEY) {
      throw new Error("V0_API_KEY is not set");
    }
    _client = createClient({ apiKey: process.env.V0_API_KEY });
  }
  return _client;
}
