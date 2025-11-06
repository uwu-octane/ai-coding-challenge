// Lightweight API client for backend AI routes

export type NewChatResponse = {
  sessionId: string;
};

export type ChatRequest = {
  sessionId?: string;
  message: string;
  context?: Record<string, unknown>;
};

export type RetrievalRequest = {
  query: string;
  top_k?: number;
  mode?: "vector" | "bm25" | "hybrid";
};

// 后端响应格式：{ code: number; data?: T; message?: string }
type ApiResponse<T> = {
  code: number;
  data?: T;
  message?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiNewChat(): Promise<NewChatResponse> {
  const url = `${API_BASE}/api/ai/newChat`;
  const response = await jsonFetch<ApiResponse<NewChatResponse>>(url, {
    method: "POST",
    body: JSON.stringify({}),
  });

  // 从响应的 data 字段中提取数据
  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || "Failed to create new chat session");
  }

  return response.data;
}

export async function apiRetrieval(req: RetrievalRequest) {
  const url = `${API_BASE}/api/ai/test/retrieval`;
  return await jsonFetch<unknown>(url, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// Stream chat responses as text. Returns the Response so the caller can read the stream.
export async function apiChatStream(
  req: ChatRequest,
  opts?: { rag?: boolean }
): Promise<Response> {
  const path = opts?.rag ? "/api/ai/chatRag" : "/api/ai/chat";
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chat request failed ${res.status}: ${text}`);
  }
  return res;
}

export async function readStreamToCallback(
  res: Response,
  onChunk: (text: string) => void
): Promise<void> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
