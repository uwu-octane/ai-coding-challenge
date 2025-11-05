import { StateGraph, START } from "@langchain/langgraph";
import { GraphState } from "./graphContext";
import { knowledgeNode } from "../knowledgeAgent/knowledgeNode";
import { actionNode } from "../actionAgent/actionNode";
import { supervisorNode } from "../supervisor/supervisorNode";
import { supervisorAnswerNode } from "../supervisor/supervisorNode";

export function buildGraph() {
  const graph = new StateGraph(GraphState);

  graph.addNode("supervisor", supervisorNode, {
    ends: ["knowledge", "action", "answer", "__end__"],
  });
  graph.addNode("knowledge", knowledgeNode, {
    ends: ["supervisor"],
  });
  graph.addNode("action", actionNode, {
    ends: ["supervisor"],
  });
  graph.addNode("answer", supervisorAnswerNode, {
    ends: ["__end__"],
  });

  // Set entry point: start from supervisor
  // @ts-expect-error - LangGraph types are not fully compatible with TypeScript
  graph.addEdge(START, "supervisor");

  return graph.compile();
}
