import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://claude.ai');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());

const GRAPH = "https://graph.facebook.com/v20.0";
const ACCESS_TOKEN = process.env.META_TOKEN;

app.get("/api/interests", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ data: [] });

    console.log(`Searching interests for: ${q}`);
    
    const limit = req.query.limit || '1000';  // ← FIXED: Use frontend limit
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

app.get('/mcp', (req, res) => {
  res.json({
    name: "FB Interest Finder",
    version: "1.0.0",
    description: "Facebook interest search for Meta ad targeting",
    auth: { type: "none" },
    tools: [{
      name: "search_facebook_interests",
      description: "Search Facebook interests for Meta ad targeting",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Interest keyword to search"
          }
        },
        required: ["query"]
      }
    }]
  });
});

app.post('/mcp', async (req, res) => {
  const { method, params } = req.body;

  if (method === 'tools/list') {
    return res.json({
      tools: [{
        name: 'search_facebook_interests',
        description: 'Search Facebook interests for Meta ad targeting. Returns interest names and audience sizes.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Interest keyword to search e.g. cricket, crypto, Zerodha'
            }
          },
          required: ['query']
        }
      }]
    });
  }

  if (method === 'tools/call') {
    const query = params?.arguments?.query;
    if (!query) {
      return res.json({
        content: [{ type: 'text', text: 'Error: query is required' }]
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
        content: [{ type: 'text', text: JSON.stringify(interests, null, 2) }]
      });

    } catch (e) {
      return res.json({
        content: [{ type: 'text', text: `Error: ${e.message}` }]
      });
    }
  }

  return res.json({ error: 'Unknown method' });
});

export default app;
