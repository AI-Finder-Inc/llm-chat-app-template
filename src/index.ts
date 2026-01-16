/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

type RerankBody = {
  query?: string;
  contexts?: Array<{ text: string }>;
  topK?: number;
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Basic routing
    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname !== "/rerank") {
      return json({ error: "Not found" }, { status: 404 });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed. Use POST." }, { status: 405 });
    }

    // Parse body
    let body: RerankBody;
    try {
      body = (await request.json()) as RerankBody;
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const query = (body.query || "").trim();
    const contexts = Array.isArray(body.contexts) ? body.contexts : [];

    if (!query) return json({ error: "Missing 'query'." }, { status: 400 });
    if (contexts.length < 2) {
      return json({ error: "Provide at least 2 contexts: [{text}, ...]" }, { status: 400 });
    }
    if (contexts.some((c) => !c?.text || typeof c.text !== "string")) {
      return json({ error: "Each context must be { text: string }" }, { status: 400 });
    }

    // Run reranker
    const result = await env.AI.run("@cf/baai/bge-reranker-base", {
      query,
      contexts,
      // Some models accept additional params; if unsupported, it's ignored.
      top_k: typeof body.topK === "number" ? body.topK : undefined,
    } as any);

    // Return model response (scores / ordering)
    return json(result);
  },
} satisfies ExportedHandler<Env>;

