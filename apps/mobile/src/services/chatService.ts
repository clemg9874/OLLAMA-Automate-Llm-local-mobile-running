import type { ChatMessage } from "../types/app";

type ApiClient = {
  request: <T = Record<string, unknown>>(
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: unknown,
  ) => Promise<{ ok: boolean; status: number; data: T }>;
};

export type ChatConversationSummary = {
  id: string;
  title?: string;
  firstUserPrompt?: string | null;
  updatedAt: string;
};

export async function fetchChatHistory(api: ApiClient, conversationId: string): Promise<ChatMessage[]> {
  const result = await api.request<{ messages?: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`, "GET");
  if (!result.ok) {
    throw new Error(extractError(result.data, "CHAT_HISTORY_LOAD_FAILED"));
  }
  return result.data?.messages ?? [];
}

export async function fetchChatConversations(api: ApiClient): Promise<ChatConversationSummary[]> {
  const result = await api.request<{ conversations?: ChatConversationSummary[] }>("/chat/conversations", "GET");
  if (!result.ok) {
    throw new Error(extractError(result.data, "CHAT_CONVERSATIONS_LOAD_FAILED"));
  }
  console.log("[mobile][chat] fetchChatConversations", {
    result,
  });
  return result.data?.conversations ?? [];
}

export async function createChatConversation(api: ApiClient, model: string): Promise<string> {
  const result = await api.request<{ conversation?: { id?: string } }>("/chat/conversations", "POST", { model });
  const createdId = result.data?.conversation?.id;
  if (!result.ok || !createdId) {
    throw new Error(extractError(result.data, "CHAT_CONVERSATION_CREATE_FAILED"));
  }
  return createdId;
}

export async function sendChatMessage(api: ApiClient, conversationId: string, message: string): Promise<{ ok: boolean; status: number }> {
  const result = await api.request<{ messages?: ChatMessage[] }>(`/chat/conversations/${conversationId}/messages`, "POST", { message });
  if (!result.ok) {
    throw new Error(extractError(result.data, "CHAT_SEND_FAILED"));
  }
  return { ok: result.ok, status: result.status };
}

function extractError(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string") {
    return String((data as { error: string }).error);
  }
  return fallback;
}
