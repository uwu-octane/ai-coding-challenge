import { OpenAI } from "openai";

const apiKey = process.env.EMBEDDING_MODEL_API_KEY;
const apiUrl = process.env.EMBEDDING_BASE_URL;
const embeddingModel = process.env.EMBEDDING_MODEL;
const dimEnv = process.env.EMBED_DIMENSIONS;
const dimensions = dimEnv ? Number(dimEnv) : undefined;

if (!apiKey || !embeddingModel) {
  throw new Error("EMBEDDING_MODEL_API_KEY or EMBEDDING_MODEL is not set");
}

let embeddingClient: OpenAI;
if (embeddingModel === "text-embedding-3-small") {
  embeddingClient = new OpenAI({ apiKey: apiKey });
} else {
  if (!apiUrl) {
    throw new Error("EMBEDDING_BASE_URL is not set");
  }
  embeddingClient = new OpenAI({ apiKey: apiKey, baseURL: apiUrl });
}

export async function embed(texts: string[]): Promise<Float32Array[]> {
  const res = await embeddingClient.embeddings.create({
    model: embeddingModel!,
    input: texts,
    ...(dimensions ? { dimensions: dimensions } : {}),
  });
  return res.data.map((d: { embedding: number[] }) =>
    Float32Array.from(d.embedding)
  );
}
