# Multi-Agent Customer Support System

An intelligent customer service system based on LangGraph and Vercel AI SDK, supporting multi-agent collaboration and knowledge base retrieval.

## Overview

This is an automated customer support system that uses **three specialized agents** working together to intelligently process and respond to customer requests:

1. The agents collaborate through a LangGraph-based workflow und use Vercel AI SDK for LLM invoke and chat.

**-** **Supervisor (Router)** — Classifies intent (**`technical`**, **`billing`**, **`general`**), rewrites queries (coreference), routes to **Knowledge** or **Action**, and synthesizes the final answer.

**-** **Knowledge Agent** — Runs vector semantic search (**`knowledge_vector_search`**) against an FAQ store (SQLite, cosine similarity).

**-** **Action Agent** — Calls structured tools: **`ticket_create`**, **`ticket_read`**, **`ticket_update`**, plus **`action_reflect`** when it needs more info.

## Tech Stack

- **Backend**: Hono + Bun + TypeScript
- **AI Framework**: LangGraph + AI SDK (supports OpenAI/DeepSeek)
- **Database**: SQLite + Drizzle ORM
- **Frontend**: React + Vite (located in `ui/` directory)

## Technical Choices

### SDK/Framework Selection

- **Vercel AI SDK**: Unified API for LLM interactions across providers, with type-safe tool calling and streaming support
- **LangGraph**: State-based workflow orchestration with event-driven routing, enabling supervisor pattern for agent coordination
- **Hono + Bun**: Lightweight web framework with fast startup and native TypeScript support
- **Drizzle ORM**: Type-safe database queries with minimal overhead
- **SQLite**: Single database for all data including vector embeddings, simplifying deployment

### Agent Coordination

The system uses an **event-driven supervisor pattern**:

- **Supervisor Node** analyzes conversation state and routes to specialized agents (`knowledge`, `action`, or `answer`)
- Agents return to supervisor after execution for re-evaluation
- Shared state (messages, knowledge refs, tool results) is merged via reducers
- Dynamic routing allows iterative refinement: supervisor → knowledge → supervisor → action → supervisor → answer

### Architectural Decisions

1. **Vector-based retrieval**: Semantic search using embeddings stored in SQLite with cosine similarity
2. **Tool-based execution**: Structured tool calls via Vercel AI SDK with Zod schemas for type safety
3. **Prompt-driven behavior**: Agent logic separated into YAML prompt files for easy iteration
4. **Multi-provider support**: Abstract LLM interface supports OpenAI, DeepSeek, and other providers via environment variables

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

### Quick Start (Using Makefile)

1. Clone the repository

```bash
git clone https://github.com/uwu-octane/ai-coding-challenge.git
cd ai-coding-challenge
```

2. Install dependencies (automatically installs bun if needed)

```bash
make install
```

3. Configure environment variables

```bash
make setup-env
# Or manually: cp env.example .env
```

4. Start the service

```bash
# Start both backend and UI
make dev

# Or start them separately:
make dev-backend  # Backend only (http://localhost:7788)
make dev-ui       # UI only (http://localhost:7787)
```

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
