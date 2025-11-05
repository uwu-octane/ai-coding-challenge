import { z } from "zod";

export const KnowledgeAgentInputSchema = z.object({
  query: z.string().min(1).describe("Search query text"),
  top_k: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(5)
    .describe("Number of results to return"),
  scoreThreshold: z
    .number()
    .min(0)
    .max(1)
    .default(0.6)
    .describe("Minimum similarity score threshold"),
});

export type KnowledgeAgentInput = z.infer<typeof KnowledgeAgentInputSchema>;

export const KnowledgeAgentOutputSchema = z.object({
  mode: z.enum(["vector", "bm25", "hybrid"]),
  count: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      answer: z.string(),
      tags: z.string().nullable().optional(),
      score: z.number().min(0).max(1),
    })
  ),
});

export type KnowledgeAgentOutput = z.infer<typeof KnowledgeAgentOutputSchema>;
