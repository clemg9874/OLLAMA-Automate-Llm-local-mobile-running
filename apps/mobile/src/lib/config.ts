export const appConfig = {
  defaultApiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  defaultChatModel: process.env.EXPO_PUBLIC_CHAT_MODEL ?? "llama3.1:8b",
  defaultDeviceName: process.env.EXPO_PUBLIC_DEVICE_NAME ?? "mobile-device",
} as const;
