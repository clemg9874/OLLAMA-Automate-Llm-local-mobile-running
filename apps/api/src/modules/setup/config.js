export const setupConfig = {
  defaults: {
    localApiUrl: process.env.API_PUBLIC_URL ?? "http://localhost:3000",
    localWebUrl: process.env.WEB_PUBLIC_URL ?? "http://localhost:3001",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    healthPath: process.env.API_HEALTH_PATH ?? "/health",
  },
  patterns: {
    tryCloudflareUrl: /https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi,
  },
};
