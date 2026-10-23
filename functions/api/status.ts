/// <reference types="@cloudflare/workers-types" />
import { GRAPH_VERSION, json, type Env } from "../_lib";

export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  json({
    serverToken: Boolean(env.META_TOKEN?.trim()),
    graphVersion: GRAPH_VERSION,
    runtime: "cloudflare-pages",
  });
