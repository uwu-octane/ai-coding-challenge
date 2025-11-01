import { Hono } from "hono";
import { ok } from "../request/response";

const router = new Hono();

router.get("/health", (c) => ok(c, { ok: true, ts: Date.now() }));

export default router;
