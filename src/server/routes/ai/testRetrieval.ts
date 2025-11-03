import { z } from "zod";
import { Hono } from "hono";
import { err, ok } from "../../request/response";
import { retrieval } from "../../agents/knowledgeAgent/retrieval";

const RequestSchema = z.object({
  query: z.string().min(1, "query required"),
  top_k: z.number().int().min(1).max(50).default(5),
  mode: z.enum(["vector", "bm25", "hybrid"]).default("vector"),
});

export const router = new Hono();

router.post("/retrieval", async (c) => {
  try {
    const json = await c.req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return err(c, 400, "invalid request", parsed.error.message);
    }
    const { query, top_k } = parsed.data;
    const results = await retrieval(query, top_k);

    return ok(c, {
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    return err(c, 500, "test retrieval failed", error);
  }
});

export default router;
