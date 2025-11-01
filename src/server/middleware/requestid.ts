import { Context, Next } from "hono";

// set requestId to context and response header
//used for chat message tracking
export async function requestIdMiddleware(c: Context, next: Next) {
  const requestId = crypto.randomUUID();
  c.set("HTTP_REQUEST_ID", requestId);
  c.res.headers.set("X-HTTP-Request-ID", requestId);
  await next();
}
