import { OpenAI } from "openai";

const apiKey = process.env.EMBEDDING_MODEL_API_KEY ?? process.env.LLM_API_KEY;
const apiUrl = process.env.EMBEDDING_BASE_URL;
const embeddingModel = process.env.EMBEDDING_MODEL;
const dimEnv = process.env.EMBED_DIMENSIONS;
const LLM_MODEL_PROVIDER = process.env.LLM_MODEL_PROVIDER;

if (!apiKey || apiKey.trim() === "") {
  throw new Error("EMBEDDING_MODEL_API_KEY or LLM_API_KEY is not set");
}

if (!embeddingModel || embeddingModel.trim() === "") {
  throw new Error("EMBEDDING_MODEL is not set");
}

let dimensions: number | undefined;
if (dimEnv) {
  const parsed = Number(dimEnv);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `EMBED_DIMENSIONS must be a positive number, got: ${dimEnv}`
    );
  }
  dimensions = parsed;
}

let embeddingClient: OpenAI;
if (LLM_MODEL_PROVIDER === "openai") {
  embeddingClient = new OpenAI({ apiKey: apiKey });
} else {
  if (!apiUrl || apiUrl.trim() === "") {
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
