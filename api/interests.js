import {
  clampLimit,
  queryString,
  searchInterests,
  sendJson,
  tokenFor,
} from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const q = queryString(req.query?.q);
  if (!q) {
    sendJson(res, 400, {
      error: {
        code: "query_required",
        message: "Enter a word or phrase to search Meta interests.",
      },
    });
    return;
  }

  if (q.length > 100) {
    sendJson(res, 400, {
      error: {
        code: "query_too_long",
        message: "Keep the search phrase under 100 characters.",
      },
    });
    return;
  }

  const token = tokenFor(req);
  if (!token) {
    sendJson(res, 401, {
      error: {
        code: "token_required",
        message:
          "A Meta Graph access token is required. Add one for this session or configure META_TOKEN on the server.",
      },
    });
    return;
  }

  try {
    const result = await searchInterests({
      token,
      q,
      limit: clampLimit(req.query?.limit),
      after: queryString(req.query?.after) || undefined,
    });
    sendJson(res, 200, result);
  } catch (error) {
    if (error?.graphCode === 190) {
      sendJson(res, 401, {
        error: {
          code: "invalid_token",
          message:
            "Meta rejected that access token. Check that it is valid and has access to ad interests.",
        },
      });
      return;
    }

    const status =
      Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
        ? error.status
        : 502;
    sendJson(res, status, {
      error: {
        code:
          error?.status === 429
            ? "rate_limited"
            : "graph_error",
        message:
          error instanceof Error ? error.message : "The Meta Graph request failed.",
      },
    });
  }
}
