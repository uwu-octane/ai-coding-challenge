# Multi-Agent Customer Support System

An intelligent customer service system based on LangGraph and Vercel AI SDK, supporting multi-agent collaboration and knowledge base retrieval.

## Overview

This is an automated customer support system that uses **three specialized agents** working together to intelligently process and respond to customer requests:

1. **Supervisor Agent (Router)**: Analyzes conversation state (messages, knowledge results, tool results) and makes event-driven routing decisions. Classifies user intent into categories (`technical`, `billing`, or `general`), performs query rewriting with coreference resolution, and routes requests to either the Knowledge Agent or Action Agent. Finally synthesizes comprehensive answers from all available information sources.
2. **Knowledge Agent**: Performs vector-based semantic search in the FAQ knowledge base using embeddings. Uses the `knowledge_vector_search` tool to retrieve relevant FAQ entries based on the supervisor's rewritten query, with configurable search parameters (top_k, scoreThreshold) to optimize retrieval quality.
3. **Action Agent**: Executes ticket-related (for mocking) operations through structured tool calls. Available tools include `ticket_create` (create new tickets), `ticket_read` (check ticket status), `ticket_update` (update ticket information), and `action_reflect` (request additional information when needed). Extracts relevant information from conversation history to populate tool parameters.

The agents collaborate through a LangGraph-based workflow und use Vercel AI SDK for LLM invoke and chat.

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
