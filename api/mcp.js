import {
  clampLimit,
  parseBody,
  queryString,
  searchInterests,
  sendJson,
  tokenFor,
} from "./_lib.js";

const TOOL = {
  name: "search_meta_interests",
  description:
    "Search Meta ad interests by keyword. Returns interest names, paths, and audience size bounds. Requires a Meta Graph token via the X-Meta-Token header unless the deployment has META_TOKEN configured.",
  inputSchema: {
    type: "object",
    properties: {
      q: {
        type: "string",
        description: "Interest keyword or phrase to search.",
      },
      limit: {
        type: "number",
        description: "Number of results to return (1-100).",
      },
      after: {
        type: "string",
        description: "Optional Graph API cursor from a previous response.",
      },
    },
    required: ["q"],
    additionalProperties: false,
  },
};

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function toolError(id, message) {
  return rpcError(id, -32603, message);
}

async function toolCall(req, id, params) {
  if (params?.name !== TOOL.name) {
    return rpcError(id, -32602, `Unknown tool: ${params?.name ?? ""}`);
  }

  const args = params?.arguments ?? {};
  const q = queryString(args.q);
  if (!q) {
    return toolError(id, "A non-empty q argument is required.");
  }
  if (q.length > 100) {
    return toolError(id, "Keep the search phrase under 100 characters.");
  }

  const token = tokenFor(req);
  if (!token) {
    return toolError(
      id,
      "A Meta Graph token is required. Set META_TOKEN on the server or send X-Meta-Token.",
    );
  }

  try {
    const result = await searchInterests({
      token,
      q,
      limit: clampLimit(args.limit),
      after: queryString(args.after) || undefined,
    });
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(result) }],
      },
    };
  } catch (error) {
    return toolError(
      id,
      error instanceof Error ? error.message : "The Meta Graph request failed.",
    );
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, {
      name: "interest-ledger",
      description: "Meta ad interest search over the Model Context Protocol.",
      transport: "streamable-http",
      endpoint: "/mcp",
      usage:
        "Send JSON-RPC 2.0 POST requests. Add X-Meta-Token when the server has no META_TOKEN configured.",
    });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("allow", "GET, POST");
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const body = parseBody(req.body);
  if (!body || Array.isArray(body) || typeof body !== "object") {
    sendJson(res, 400, rpcError(null, -32600, "Invalid JSON-RPC request."));
    return;
  }

  const { id, method, params } = body;

  if (method === "notifications/initialized") {
    res.status(204).end();
    return;
  }

  if (method === "initialize") {
    sendJson(res, 200, {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "interest-ledger", version: "2.0.0" },
      },
    });
    return;
  }

  if (method === "ping") {
    sendJson(res, 200, { jsonrpc: "2.0", id: id ?? null, result: {} });
    return;
  }

  if (method === "tools/list") {
    sendJson(res, 200, {
      jsonrpc: "2.0",
      id: id ?? null,
      result: { tools: [TOOL] },
    });
    return;
  }

  if (method === "tools/call") {
    sendJson(res, 200, await toolCall(req, id, params));
    return;
  }

  sendJson(res, 200, rpcError(id, -32601, `Unknown method: ${String(method)}`));
}
