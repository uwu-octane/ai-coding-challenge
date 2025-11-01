import { Hono } from "hono";
import { serve } from "bun";

const app = new Hono();

app.get('api/health', (c) => c.json({ ok: true }));


const PORT = Number(process.env.APP_PORT || 7788)
serve({ fetch: app.fetch, port: PORT })
console.log(`Server is running at http://localhost:${PORT}`)

export default app;