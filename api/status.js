import { sendJson } from "./_lib.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  sendJson(res, 200, {
    serverToken: Boolean(process.env.META_TOKEN?.trim()),
    graphVersion: "v20.0",
    runtime: "vercel",
  });
}
