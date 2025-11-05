## Getting Started

Install dependencies with `bun install`, then copy `.env.example` to `.env` and configure your environment variables (at minimum, set `LLM_API_KEY`). Start the server with `bun run dev`. The service will be available at http://localhost:7788.

## Testing the API

Test the chat endpoint with:

```bash
curl -N -H "Content-Type: application/json" \
  -X POST http://localhost:7788/api/ai/chat \
  -d '{"message": "Hi, make a short introduction"}'
```

## Test Call

curl -N -H "Content-Type: application/json" -X POST http://localhost:7788/api/ai/chatRag -d '{"sessionId": "f0eb4add-a2ef-48c4-9677-cd784bb4cc4f", "message": "kannst du ein Ticket anlegen, Mein Account wurde gesperrt"}'
Ich habe ein Ticket für Sie erstellt. Die Ticket-ID lautet: **a8ec01b9-159e-41cd-8386-1251ae1441ce**

Unser Support-Team wird sich so schnell wie möglich um Ihr gesperrtes Konto kümmern und Ihnen eine Rückmeldung geben.%
