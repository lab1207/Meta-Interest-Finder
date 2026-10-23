/// <reference types="@cloudflare/workers-types" />
import {
  getToken,
  json,
  searchInterests,
  type Env,
  type GraphError,
} from "./_lib";

type JsonRpcId = string | number | null;

type JsonRpcBody = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

function result(id: JsonRpcId, payload: unknown): Response {
  return json({ jsonrpc: "2.0", id, result: payload });
}

function error(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): Response {
  return json({
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  });
}

function toolError(id: JsonRpcId, message: string): Response {
  return result(id, {
    content: [{ type: "text", text: message }],
    isError: true,
  });
}

const TOOL = {
  name: "search_meta_interests",
  description:
    "Search Meta ad interests by keyword. Returns interest names, paths, and audience size bounds. Requires a Meta Graph token via the X-Meta-Token header unless the deployment has META_TOKEN configured.",
  inputSchema: {
    type: "object",
    properties: {
      q: {
        type: "string",
        description: "The interest keyword or phrase to search for.",
        minLength: 1,
        maxLength: 100,
      },
      limit: {
        type: "integer",
        description: "Maximum results to return (1-100).",
        minimum: 1,
        maximum: 100,
        default: 25,
      },
      after: {
        type: "string",
        description: "Optional Meta paging cursor from a previous result.",
      },
    },
    required: ["q"],
  },
};

export const onRequestGet: PagesFunction<Env> = () =>
  json({
    name: "interest-ledger",
    description: "Meta ad interest search over the Model Context Protocol.",
    transport: "streamable-http",
    endpoint: "/mcp",
    usage:
      "Send JSON-RPC 2.0 POST requests. Add X-Meta-Token when the server has no META_TOKEN configured.",
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: JsonRpcBody;
  try {
    body = (await request.json()) as JsonRpcBody;
  } catch {
    return error(null, -32700, "Parse error");
  }

  if (Array.isArray(body)) {
    return error(null, -32600, "Batch requests are not supported");
  }

  const id = body.id ?? null;
  const method = body.method;
  const params = body.params ?? {};

  if (method === "initialize") {
    return result(id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: {
        name: "interest-ledger",
        version: "2.0.0",
      },
    });
  }

  if (method === "notifications/initialized") {
    return new Response(null, { status: 204 });
  }

  if (method === "ping") {
    return result(id, {});
  }

  if (method === "tools/list") {
    return result(id, { tools: [TOOL] });
  }

  if (method === "tools/call") {
    const name = typeof params.name === "string" ? params.name : "";
    const args =
      params.arguments && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};

    if (name !== TOOL.name) {
      return toolError(id, `Unknown tool: ${name || "(missing name)"}`);
    }

    const q = typeof args.q === "string" ? args.q.trim() : "";
    if (!q) {
      return toolError(id, "The q argument is required.");
    }
    if (q.length > 100) {
      return toolError(id, "Keep the q argument under 100 characters.");
    }

    const token = getToken(request, env);
    if (!token) {
      return toolError(
        id,
        "No Meta token is available. Send an X-Meta-Token header or configure META_TOKEN on the deployment.",
      );
    }

    const limit = Math.min(
      100,
      Math.max(1, Number(args.limit ?? 25) || 25),
    );
    const after = typeof args.after === "string" ? args.after : undefined;

    try {
      const search = await searchInterests({ token, q, limit, after });
      return result(id, {
        content: [{ type: "text", text: JSON.stringify(search, null, 2) }],
      });
    } catch (caught) {
      const graphError = caught as GraphError;
      if (graphError.graphCode === 190) {
        return toolError(
          id,
          "Meta rejected the access token. Check that it is valid and can read ad interests.",
        );
      }
      return toolError(
        id,
        graphError.message || "Meta could not complete the interest search.",
      );
    }
  }

  return error(id, -32601, `Method not found: ${method || "(missing)"}`);
};
