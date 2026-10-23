/**
 * Shared Vercel adapter for the Meta Graph API.
 *
 * The Cloudflare Pages Functions live in `functions/`. This file keeps the
 * same request/response shape for the Vercel deployment in `api/`.
 */

const GRAPH_VERSION = "v20.0";

export function sendJson(res, status, body) {
  res.status(status);
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.send(JSON.stringify(body));
}

export function tokenFor(req) {
  const serverToken = process.env.META_TOKEN?.trim();
  if (serverToken) return serverToken;
  const header = req.headers["x-meta-token"];
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === "string" ? value.trim() : "";
}

export async function searchInterests({ token, q, limit, after }) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/search`);
  url.searchParams.set("type", "adinterest");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("locale", "en_US");
  if (after) url.searchParams.set("after", after);

  let response;
  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    const error = new Error(
      "The Meta Graph API could not be reached from this deployment.",
    );
    error.status = 502;
    throw error;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Meta occasionally returns an HTML error page at the edge.
  }

  if (!response.ok || payload?.error) {
    const error = new Error(
      payload?.error?.message || `Meta returned HTTP ${response.status}.`,
    );
    error.status = response.status;
    error.graphCode = payload?.error?.code;
    throw error;
  }

  return {
    data: (payload?.data ?? [])
      .map((item) => {
        const id = item?.id === undefined ? "" : String(item.id);
        const name = typeof item?.name === "string" ? item.name.trim() : "";
        if (!id || !name) return null;
        return {
          id,
          name,
          path: Array.isArray(item.path) ? item.path.map(String) : [],
          audienceMin: Number(item.audience_size_lower_bound ?? 0) || 0,
          audienceMax: Number(item.audience_size_upper_bound ?? 0) || 0,
        };
      })
      .filter(Boolean),
    paging: payload?.paging
      ? {
          cursors: payload.paging.cursors,
          next: payload.paging.next,
        }
      : undefined,
  };
}

export function queryString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 25;
  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

export function parseBody(body) {
  if (!body) return null;
  if (typeof body === "object") return body;
  try {
    return JSON.parse(String(body));
  } catch {
    return null;
  }
}
