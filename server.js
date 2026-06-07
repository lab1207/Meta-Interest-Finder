import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const GRAPH = "https://graph.facebook.com/v20.0";
const ACCESS_TOKEN = process.env.META_TOKEN;

app.get("/api/interests", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ data: [] });
    console.log(`Searching interests for: ${q}`);

    const limit = req.query.limit || '1000';
    const url = `${GRAPH}/search?type=adinterest&q=${encodeURIComponent(q)}&limit=${limit}&access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('Facebook response:', data);

    const interests = (data.data || []).map(item => ({
      id: item.id,
      name: item.name,
      path: item.path || [],
      audience_size_min: item.audience_size_lower_bound || 0,
      audience_size_max: item.audience_size_upper_bound || 0
    }));

    res.json({ data: interests });
  } catch (error) {
    console.error('ERROR:', error);
    res.json({ data: [], error: error.message });
  }
});

const mcpServer = new McpServer({
  name: "FB Interest Finder",
  version: "1.0.0"
});

mcpServer.tool(
  "search_facebook_interests",
  "Search Facebook interests for Meta ad targeting. Returns interest names and audience sizes.",
  { query: z.string().describe("Interest keyword to search e.g. cricket, crypto, Zerodha") },
  async ({ query }) => {
    const url = `${GRAPH}/search?type=adinterest&q=${encodeURIComponent(query)}&limit=20&access_token=${ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    const interests = (data.data || []).map(item => ({
      name: item.name,
      audience_size: item.audience_size_lower_bound
        ? `${(item.audience_size_lower_bound / 1000000).toFixed(1)}M - ${(item.audience_size_upper_bound / 1000000).toFixed(1)}M`
        : 'Unknown',
      path: item.path || []
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(interests, null, 2) }]
    };
  }
);

const transports = {};

app.get("/mcp", async (req, res) => {
  const transport = new SSEServerTransport("/mcp", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => delete transports[transport.sessionId]);
  await mcpServer.connect(transport);
});

app.post("/mcp", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (!transport) return res.status(400).json({ error: "No session found" });
  await transport.handlePostMessage(req, res, req.body);
});

export default app;
