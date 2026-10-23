/// <reference types="@cloudflare/workers-types" />

export type Env = {
  META_TOKEN?: string;
};

export type Interest = {
  id: string;
  name: string;
  path: string[];
  audienceMin: number;
  audienceMax: number;
};

export type SearchResult = {
  data: Interest[];
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
};

type GraphPayload = {
  data?: Array<{
    id?: string | number;
    name?: string;
    path?: unknown;
    audience_size_lower_bound?: number;
    audience_size_upper_bound?: number;
  }>;
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

export type GraphError = Error & {
  status?: number;
  graphCode?: number;
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function getToken(request: Request, env: Env): string | null {
  const serverToken = env.META_TOKEN?.trim();
  if (serverToken) return serverToken;
  return request.headers.get("x-meta-token")?.trim() || null;
}

function normalizeInterest(item: NonNullable<GraphPayload["data"]>[number]): Interest | null {
  const id = item.id === undefined ? "" : String(item.id);
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!id || !name) return null;

  return {
    id,
    name,
    path: Array.isArray(item.path) ? item.path.map(String) : [],
    audienceMin: Number(item.audience_size_lower_bound ?? 0) || 0,
    audienceMax: Number(item.audience_size_upper_bound ?? 0) || 0,
  };
}

export async function searchInterests(options: {
  token: string;
  q: string;
  limit: number;
  after?: string;
}): Promise<SearchResult> {
  const url = new URL("https://graph.facebook.com/v20.0/search");
  url.searchParams.set("type", "adinterest");
  url.searchParams.set("q", options.q);
  url.searchParams.set("limit", String(options.limit));
  url.searchParams.set("locale", "en_US");
  if (options.after) url.searchParams.set("after", options.after);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${options.token}`,
      },
    });
  } catch {
    const error = new Error(
      "The Meta Graph API could not be reached from this deployment.",
    ) as GraphError;
    error.status = 502;
    throw error;
  }

  let payload: GraphPayload | null = null;
  try {
    payload = (await response.json()) as GraphPayload;
  } catch {
    // Meta occasionally returns an HTML error page at the edge.
  }

  if (!response.ok || payload?.error) {
    const error = new Error(
      payload?.error?.message || `Meta returned HTTP ${response.status}.`,
    ) as GraphError;
    error.status = response.status;
    error.graphCode = payload?.error?.code;
    throw error;
  }

  const data = (payload?.data ?? [])
    .map(normalizeInterest)
    .filter((item): item is Interest => item !== null);

  return {
    data,
    paging: payload?.paging
      ? {
          cursors: payload.paging.cursors,
          next: payload.paging.next,
        }
      : undefined,
  };
}
