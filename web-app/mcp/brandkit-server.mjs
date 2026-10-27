#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (
  process.env.BRANDKIT_AGENT_BASE_URL || "http://localhost:3002"
).replace(/\/$/, "");
const token = process.env.BRANDKIT_AGENT_TOKEN;

async function agentFetch(path, init = {}) {
  if (!token) {
    throw new Error("BRANDKIT_AGENT_TOKEN is required for the Brand Kit MCP server.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : payload;
    throw new Error(String(message || `Brand Kit API returned ${response.status}`));
  }

  return payload;
}

function toolText(payload) {
  return {
    content: [
      {
        type: "text",
        text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: "brandkitgenerator",
  version: "0.1.0",
});

server.registerTool(
  "brandkit_create",
  {
    title: "Create Brand Kit",
    description:
      "Create a Brand Kit Generator kit and optionally submit the first founder context turn.",
    inputSchema: {
      name: z.string().max(80).optional(),
      brandStage: z.enum(["new", "existing"]).optional(),
      initialContext: z.string().optional(),
    },
  },
  async (input) =>
    toolText(
      await agentFetch("/api/agent/kits", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    ),
);

server.registerTool(
  "brandkit_turn",
  {
    title: "Submit Brand Kit Turn",
    description:
      "Send a conversational turn to an existing brand kit and let the brand agent update approved signals.",
    inputSchema: {
      kitId: z.string().min(1),
      message: z.string().min(1),
    },
  },
  async ({ kitId, message }) =>
    toolText(
      await agentFetch(`/api/agent/kits/${encodeURIComponent(kitId)}/turn`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    ),
);

server.registerTool(
  "brandkit_status",
  {
    title: "Get Brand Kit Status",
    description: "Read the partial kit, visible phase, internal progress, and live v0 state.",
    inputSchema: {
      kitId: z.string().min(1),
    },
  },
  async ({ kitId }) =>
    toolText(
      await agentFetch(`/api/agent/kits/${encodeURIComponent(kitId)}/status`),
    ),
);

server.registerTool(
  "brandkit_export",
  {
    title: "Export Brand Kit",
    description: "Export the current brand kit as JSON or markdown.",
    inputSchema: {
      kitId: z.string().min(1),
      format: z.enum(["json", "markdown"]).default("markdown"),
    },
  },
  async ({ kitId, format }) =>
    toolText(
      await agentFetch(
        `/api/agent/kits/${encodeURIComponent(kitId)}/export?format=${format}`,
      ),
    ),
);

await server.connect(new StdioServerTransport());
