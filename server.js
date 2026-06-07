import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json());

const GRAPH = "https://graph.facebook.com/v20.0";
const ACCESS_TOKEN = process.env.META_TOKEN;

app.get("/api/interests", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ data: [] });
    const limit = req.query.limit || '1000';
    const url = `${GRAPH}/search?type=adinterest&q=${encodeURIComponent(q)}&limit=${limit}&access_token=${ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    const interests = (data.data || []).map(item => ({
      id: item.id,
      name: item.name,
      path: item.path || [],
      audience_size_min: item.audience_size_lower_bound || 0,
      audience_size_max: item.audience_size_upper_bound || 0
    }));
    res.json({ data: interests });
  } catch (error) {
    res.json({ data: [], error: error.message });
  }
});

app.get("/mcp", (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sessionId = Math.random().toString(36).slice(2);

  res.write(`data: ${JSON.stringify({
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      sessionId,
      serverInfo: { name: "FB Interest Finder", version: "1.0.0" },
      capabilities: { tools: {} }
    }
  })}\n\n`);

  req.on('close', () => res.end());
});

app.post("/mcp", async (req, res) => {
  const { method, params, id } = req.body;

  if (method === 'initialize') {
    return res.json({
      jsonrpc: "2.0", id,
      result: {
        serverInfo: { name: "FB Interest Finder", version: "1.0.0" },
        capabilities: { tools: {} },
        protocolVersion: "2024-11-05"
      }
    });
  }

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: "2.0", id,
      result: {
        tools: [{
          name: "search_facebook_interests",
          description: "Search Facebook interests for Meta ad targeting. Returns interest names and audience sizes.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Interest keyword to search e.g. cricket, crypto, Zerodha"
              }
            },
            required: ["query"]
          }
        }]
      }
    });
  }

  if (method === 'tools/call') {
    const query = params?.arguments?.query;
    if (!query) {
      return res.json({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: "Error: query is required" }] }
      });
    }
    try {
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
      return res.json({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: JSON.stringify(interests, null, 2) }] }
      });
    } catch (e) {
      return res.json({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: `Error: ${e.message}` }] }
      });
    }
  }

  return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
});

export default app;
