import type {
  KnowledgeAgentInput,
  KnowledgeAgentOutput,
} from "../shared/types";
import {
  retrieval,
  bm25Search,
  hybridRetrieval,
  rerankMock,
  resultProcess,
} from "./retrieval";

export async function knowledgeAgent(
  input: KnowledgeAgentInput
): Promise<KnowledgeAgentOutput> {
  const { query, top_k, mode } = input;

  if (!query.trim()) {
    return { mode, count: 0, results: [] };
  }

  let results: KnowledgeAgentOutput["results"] = [];

  switch (mode) {
    case "vector":
      results = await retrieval(query, top_k);
      break;
    case "bm25":
      bm25Search();
      break;
    case "hybrid":
      hybridRetrieval();
      bm25Search();
      results = await retrieval(query, top_k);
      resultProcess();
      break;
    default:
      console.warn(`Unknown retrieval mode: ${mode}`);
  }

  rerankMock();

  return {
    mode,
    count: results.length,
    results,
  };
}
