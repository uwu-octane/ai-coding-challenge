import type { RetrievedFaq } from "../../../db/vec";
import { embed } from "../../../server/embedding/embedding";
import { getAllFaqs, cosineSim, toF32 } from "../../../db/vec";

export async function retrieval(
  query: string,
  k: number = 5,
  scoreThreshold: number = 0.6
): Promise<RetrievedFaq[]> {
  if (!query || !query.trim()) return [];
  console.log("doing vector retrieval");
  // generate query vector
  console.log("calling embed");
  const [qVec] = await embed([query]);
  const qDim = qVec.length;

  // retrieve all candidates (retrieve all embeddings for local computation)
  const rows = getAllFaqs();

  if (!rows.length) return [];

  // calculate similarity
  console.log("calculating cosine similarity");
  const scored: RetrievedFaq[] = [];
  for (const r of rows) {
    const blob = r.embedding;
    if (!blob) continue;

    const v = toF32(blob);

    if (v.length !== qDim) continue;

    const score = cosineSim(qVec, v);
    scored.push({
      id: r.id,
      question: r.question,
      answer: r.answer,
      tags: r.tags ?? undefined,
      score,
    });
  }

  if (!scored.length) return [];

  // Filter by score threshold
  const filtered = scored.filter((item) => item.score >= scoreThreshold);

  if (!filtered.length) {
    console.log(`No results above threshold ${scoreThreshold}`);
    return [];
  }

  console.log(
    `Found ${filtered.length} results above threshold ${scoreThreshold}`
  );

  // top k
  const limit = Number.isFinite(k)
    ? Math.max(1, Math.min(50, Math.floor(k)))
    : 5;
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, limit);
}

export function rerankMock() {
  console.log("rerankMock: doing reranking");
}

export function hybridRetrieval() {
  console.log("hybridRetrieval: doing hybrid retrieval");
}

export function bm25Search() {
  console.log("bm25Search: doing bm25 search");
}

export function resultProcess() {
  console.log("resultProcess: merging results");
  console.log("resultProcess: deduplicating results");
  console.log("resultProcess: sorting results");
  console.log("resultProcess: returning results");
}
