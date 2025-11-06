# AI Coding Challenge

An intelligent customer service system based on LangGraph, supporting multi-agent collaboration and knowledge base retrieval.

## Tech Stack

- **Backend**: Hono + Bun + TypeScript
- **AI Framework**: LangGraph + AI SDK (supports OpenAI/DeepSeek)
- **Database**: SQLite + Drizzle ORM
- **Frontend**: React + Vite (located in `ui/` directory)

## Environment Variables

### Required Variables

- `LLM_API_KEY`: LLM API key
- `EMBEDDING_MODEL_API_KEY`: Embedding model API key
- `EMBEDDING_MODEL`: Embedding model name
- `EMBEDDING_BASE_URL`: Embedding model API URL (required for non-OpenAI models)

### Optional Variables

- `LLM_MODEL_PROVIDER`: LLM provider, default `openai` (options: `openai`, `deepseek`)
- `LLM_MODEL`: LLM model name, default `deepseek-chat`
- `LLM_BASE_URL`: LLM API URL (required for DeepSeek, etc.)
- `EMBED_DIMENSIONS`: Embedding vector dimensions
- `DB_FILE`: Database file path, default `data.sqlite`
- `APP_PORT`: Service port, default `7788`

## Getting Started

### Traditional Method

1. Install dependencies

```bash
bun install
```

2. Configure environment variables

```bash
cp .env.example .env  # if exists
# Edit .env file and fill in required environment variables
```

3. Start the service

```bash
bun run dev
```

The service will start at `http://localhost:7788`

### Docker Method

1. Configure environment variables

```bash
# Create .env file and fill in required environment variables
```

2. Start the service

```bash
docker-compose up -d
```

- Backend service: `http://localhost:7788`
- Frontend service: `http://localhost:7787`
