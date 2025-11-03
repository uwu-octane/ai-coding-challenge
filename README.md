## Getting Started

Install dependencies with `bun install`, then copy `.env.example` to `.env` and configure your environment variables (at minimum, set `LLM_API_KEY`). Start the server with `bun run dev`. The service will be available at http://localhost:7788.

## Testing the API

Test the chat endpoint with:

```bash
curl -N -H "Content-Type: application/json" \
  -X POST http://localhost:7788/api/ai/chat \
  -d '{"message": "Hi, make a short introduction"}'
```

## TODO

1. OpenAPI DOC
2. RAG (Knowledge Agent impl)
3. RAG (Action Agent impl)
4. RAG (Router: Intention classification; query rewriter;)
