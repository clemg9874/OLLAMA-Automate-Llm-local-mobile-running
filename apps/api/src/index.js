import cors from "@fastify/cors";
import Fastify from "fastify";
import { WebSocketServer } from "ws";
import { setupRoutes } from "./modules/setup/routes.js";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const isVerboseHttpLogEnabled = process.env.LOG_HTTP_VERBOSE === "true";
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

await app.register(cors, { origin: true });

function maskSensitiveValue(value) {
  if (typeof value !== "string") return value;
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== "object") return headers;
  const clone = { ...headers };
  if (clone.authorization) {
    clone.authorization = maskSensitiveValue(clone.authorization);
  }
  if (clone.cookie) {
    clone.cookie = "***";
  }
  return clone;
}

function sanitizeBody(body) {
  if (!body || typeof body !== "object") return body;
  const clone = { ...body };
  if (typeof clone.token === "string") clone.token = maskSensitiveValue(clone.token);
  if (typeof clone.accessToken === "string") clone.accessToken = maskSensitiveValue(clone.accessToken);
  if (typeof clone.refreshToken === "string") clone.refreshToken = maskSensitiveValue(clone.refreshToken);
  if (typeof clone.devicePublicKey === "string") clone.devicePublicKey = "***";
  return clone;
}

app.addHook("onRequest", async (request) => {
  const shouldSkipLog = request.url.includes("/setup/status") || request.url.includes("/health");
  if (shouldSkipLog) return;
  request.startTimeMs = Date.now();
  console.log("[api] request:start", {
    method: request.method,
    url: request.url,
    headers: sanitizeHeaders(request.headers),
  });
});

app.addHook("preHandler", async (request) => {
  const shouldSkipLog = request.url.includes("/setup/status") || request.url.includes("/health");
  if (shouldSkipLog) return;
  console.log("[api] request:payload", {
    method: request.method,
    url: request.url,
    query: request.query,
    params: request.params,
    body: sanitizeBody(request.body),
  });
});

app.addHook("onResponse", async (request, reply) => {
  const shouldSkipLog = request.url.includes("/setup/status") || request.url.includes("/health");
  if (shouldSkipLog) return;
  const durationMs = Date.now() - (request.startTimeMs ?? Date.now());
  console.log("[api] request:end", {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    durationMs,
  });
});

if (isVerboseHttpLogEnabled) {
  app.log.info("Verbose HTTP logging is enabled");

  app.addHook("onRequest", async (request) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
      "http request received",
    );
  });

  app.addHook("preHandler", async (request) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params,
        body: request.body,
      },
      "http request payload",
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
      },
      "http response sent",
    );
  });
}

app.get("/health", async () => ({ ok: true, service: "api" }));
await app.register(setupRoutes);

async function probeOllamaReachable() {
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const wsServer = new WebSocketServer({ noServer: true });

app.server.on("upgrade", (request, socket, head) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (requestUrl.pathname !== "/ws/status") {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (client) => {
    wsServer.emit("connection", client, request);
  });
});

wsServer.on("connection", (client) => {
  let intervalId = null;

  async function pushStatus() {
    if (client.readyState !== client.OPEN) return;
    const ollamaReachable = await probeOllamaReachable();
    client.send(
      JSON.stringify({
        type: "status",
        apiReachable: true,
        ollamaReachable,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  void pushStatus();
  intervalId = setInterval(() => {
    void pushStatus();
  }, 5000);

  client.on("close", () => {
    if (intervalId) clearInterval(intervalId);
  });
});

try {
  await app.listen({ port, host });
  app.log.info(`API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
