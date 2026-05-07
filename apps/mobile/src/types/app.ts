export type PairingPayload = {
  sid: string;
  t: string;
  apiBaseUrl?: string;
};

export type PairingSession = {
  pairedAt: string;
  deviceName: string;
  deviceId: string;
  apiBaseUrl: string;
  accessToken: string;
  refreshToken: string;
  conversationId?: string;
};

export type ChatResult = {
  ok: boolean;
  status?: number;
  model?: string;
  answer?: string;
  error?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
