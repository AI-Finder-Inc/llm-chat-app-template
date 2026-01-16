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

export default {
  async fetch(request, env): Promise<Response> {
    const query = 'women makeup'
    const contexts = [
      {text: 'nice black suite'},
      { text: 'red lipstick' },
      { text: 'iphone 15 pro max' }
    ];

    const response = await env.AI.run('@cf/baai/bge-reranker-base', { query, contexts });

    return Response.json(response);
  },
} satisfies ExportedHandler<Env>;
