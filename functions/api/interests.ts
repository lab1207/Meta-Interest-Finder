/// <reference types="@cloudflare/workers-types" />
import {
  getToken,
  json,
  searchInterests,
  type Env,
  type GraphError,
} from "../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") || 50) || 50),
  );
  const after = (url.searchParams.get("after") || "").trim();

  if (!q) {
    return json(
      {
        error: {
          code: "query_required",
          message: "Enter a word or phrase to search Meta interests.",
        },
      },
      400,
    );
  }

  if (q.length > 100) {
    return json(
      {
        error: {
          code: "query_too_long",
          message: "Keep the search phrase under 100 characters.",
        },
      },
      400,
    );
  }

  const token = getToken(request, env);
  if (!token) {
    return json(
      {
        error: {
          code: "token_required",
          message:
            "A Meta Graph access token is required. Add one for this session or configure META_TOKEN on the server.",
        },
      },
      401,
    );
  }

  try {
    const result = await searchInterests({ token, q, limit, after });
    return json(result);
  } catch (error) {
    const graphError = error as GraphError;
    if (graphError.graphCode === 190) {
      return json(
        {
          error: {
            code: "invalid_token",
            message:
              "Meta rejected that access token. Check that it is valid and has access to ad interests.",
          },
        },
        401,
      );
    }

    const status =
      graphError.status === 429
        ? 429
        : graphError.status && graphError.status >= 400 && graphError.status < 500
          ? graphError.status
          : 502;

    return json(
      {
        error: {
          code: graphError.status === 429 ? "rate_limited" : "graph_error",
          message:
            graphError.message ||
            "Meta could not complete that interest search.",
        },
      },
      status,
    );
  }
};
