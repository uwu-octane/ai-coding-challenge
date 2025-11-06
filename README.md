# Multi-Agent Customer Support System

An intelligent customer service system based on LangGraph and Vercel AI SDK, supporting multi-agent collaboration and knowledge base retrieval.

For detailed project design you can visist: [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/uwu-octane/ai-coding-challenge)

## Overview

This is an automated customer support system that uses **three specialized agents** working together to intelligently process and respond to customer requests:

**-** **Supervisor (Router)** — Classifies intent (**`technical`**, **`billing`**, **`general`**), rewrites queries (coreference), routes to **Knowledge** or **Action**, and synthesizes the final answer.

**-** **Knowledge Agent** — Runs vector semantic search (**`knowledge_vector_search`**) against an FAQ store (SQLite, cosine similarity).

**-** **Action Agent** — Calls structured tools: **`ticket_create`**, **`ticket_read`**, **`ticket_update`**, plus **`action_reflect`** when it needs more info.

## Tech Stack

- **Backend**: Hono + Bun + TypeScript; Light, quick, easy hot-refresh.
- **AI Framework**: LangGraph + Vercel AI SDK;
  Use Langgraph for state sharing; Vercel AI SDK for chat component, tool calling.
- **Database**: SQLite + Drizzle ORM
- **Frontend**: React + Vite (located in `ui/` directory)

### Agent Coordination

The system uses an **event-driven supervisor pattern**:

- **Supervisor Node** analyzes conversation state and routes to specialized agents (`knowledge`, `action`, or `answer`)
- Agents return to supervisor after execution for re-evaluation
- Shared state (messages, knowledge refs, tool results) is merged via reducers

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
