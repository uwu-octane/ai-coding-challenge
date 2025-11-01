import { Hono } from "hono";
import { serve } from "bun";
import { requestIdMiddleware } from "@/server/middleware/requestid";
import { err } from "@/server/request/response";
import api from "@/server/routes";

import { seed } from "@/db/init";

const app = new Hono();

app.use("*", requestIdMiddleware);

app.route("/", api);

app.onError((e, c) => {
  const code = 1000;
  const message = e.message || "internal error";
  const requestId = c.get("HTTP_REQUEST_ID") || "unknown";
  return err(c, code, `${message} (reqId=${requestId})`);
});

await seed();

const PORT = Number(process.env.APP_PORT || 7788);
serve({ fetch: app.fetch, port: PORT });
console.log(`Server is running at http://localhost:${PORT}`);

export default app;
