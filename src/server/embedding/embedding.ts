import { OpenAI } from "openai";

const apiKey = process.env.EMBEDDING_MODEL_API_KEY;
const apiUrl = process.env.EMBEDDING_BASE_URL;
const model = process.env.EMBEDDING_MODEL;
const dimEnv = process.env.EMBED_DIMENSIONS;
const dimensions = dimEnv ? Number(dimEnv) : undefined;

if (!apiKey || !apiUrl || !model) {
  throw new Error(
    "EMBEDDING_MODEL_API_KEY or EMBEDDING_BASE_URL or EMBEDDING_MODEL is not set"
  );
}

const embeddingClient = new OpenAI({
  apiKey,
  baseURL: apiUrl,
});

export async function embed(texts: string[]): Promise<Float32Array[]> {
  const res = await embeddingClient.embeddings.create({
    model: model!,
    input: texts,
    ...(dimensions ? { dimensions: dimensions } : {}),
  });
  return res.data.map((d: { embedding: number[] }) =>
    Float32Array.from(d.embedding)
  );
}
