/// <reference types="@cloudflare/workers-types" />
import { json, type Env } from "../_lib";

export const onRequestGet: PagesFunction<Env> = ({ env }) =>
  json({
    serverToken: Boolean(env.META_TOKEN?.trim()),
    graphVersion: "v20.0",
    runtime: "cloudflare-pages",
  });
