import {
  authenticateAccessToken,
  bootstrapLocalSetup,
  confirmPairingSession,
  createChatConversation,
  createPairingQrSession,
  listChatConversations,
  getPairingSessionStatus,
  getSetupStatus,
  listChatMessages,
  refreshAccessToken,
  runSetupChecks,
  sendChatMessage,
  sendConversationMessage,
  startCloudflaredTunnel,
  startLocalServices,
} from "./service.js";

export async function setupRoutes(fastify) {
  fastify.post("/setup/checks", async () => {
    return runSetupChecks();
  });

  fastify.post("/setup/bootstrap", async () => {
    const data = await bootstrapLocalSetup();
    return { ok: true, setup: data };
  });

  fastify.get("/setup/status", async (request) => {
    const model = request.query?.model;
    return getSetupStatus({ model });
  });

  fastify.post("/setup/start", async (request, reply) => {
    const body = request.body ?? {};
    const result = await startLocalServices({
      model: body.model,
      ensureModel: Boolean(body.ensureModel),
    });

    if (!result.ollamaReachable) {
      reply.code(503);
      return {
        ok: false,
        error: "OLLAMA_UNREACHABLE",
        details: result,
      };
    }

    return { ok: true, details: result };
  });

  fastify.post("/setup/cloudflared/start", async (request, reply) => {
    const result = await startCloudflaredTunnel({
      localApiUrl: request.body?.localApiUrl,
    });

    if (!result.ok) {
      reply.code(409);
      return result;
    }
    return result;
  });

  fastify.post("/setup/pairing/qr", async (request, reply) => {
    const status = await getSetupStatus({});
    if (!status.ready) {
      reply.code(409);
      return {
        ok: false,
        error: "SETUP_NOT_READY",
        details: status,
      };
    }

    return createPairingQrSession();
  });

  fastify.post("/setup/pairing/confirm", async (request, reply) => {
    const result = await confirmPairingSession(request.body ?? {});
    if (!result.ok) {
      const codeByError = {
        PAIRING_INVALID_INPUT: 400,
        PAIRING_NOT_FOUND: 404,
        PAIRING_ALREADY_USED: 409,
        PAIRING_EXPIRED: 410,
        PAIRING_INVALID_TOKEN: 401,
      };
      reply.code(codeByError[result.error] ?? 400);
    }
    return result;
  });

  fastify.get("/setup/pairing/:sessionId/status", async (request, reply) => {
    const result = await getPairingSessionStatus(request.params?.sessionId);
    if (!result.ok) {
      const codeByError = {
        PAIRING_INVALID_INPUT: 400,
        PAIRING_NOT_FOUND: 404,
      };
      reply.code(codeByError[result.error] ?? 400);
    }
    return result;
  });

  fastify.post("/chat/send", async (request, reply) => {
    const auth = authenticateAccessToken(request.headers.authorization);
    if (!auth.ok) {
      const codeByError = {
        AUTH_MISSING_BEARER: 401,
        AUTH_INVALID_TOKEN: 401,
        AUTH_EXPIRED_TOKEN: 401,
      };
      reply.code(codeByError[auth.error] ?? 401);
      return auth;
    }

    const result = await sendChatMessage({
      authorizationHeader: request.headers.authorization,
      message: request.body?.message,
      model: request.body?.model,
    });

    if (!result.ok) {
      const codeByError = {
        CHAT_EMPTY_MESSAGE: 400,
        OLLAMA_UNREACHABLE: 503,
        OLLAMA_GENERATE_FAILED: 502,
        OLLAMA_EMPTY_RESPONSE: 502,
      };
      reply.code(codeByError[result.error] ?? 400);
      return result;
    }

    return result;
  });

  fastify.post("/chat/conversations", async (request, reply) => {
    console.log("[api][chat] /chat/conversations", {
      method: request.method,
      authorization: request.headers.authorization ? "***present***" : "***missing***",
      body: request.body ?? null,
    });
    const result = await createChatConversation({
      authorizationHeader: request.headers.authorization,
      model: request.body?.model,
    });
    if (!result.ok) {
      const codeByError = {
        AUTH_MISSING_BEARER: 401,
        AUTH_INVALID_TOKEN: 401,
        AUTH_EXPIRED_TOKEN: 401,
      };
      reply.code(codeByError[result.error] ?? 400);
      return result;
    }
    return result;
  });

  fastify.get("/chat/conversations", async (request, reply) => {
    const result = await listChatConversations({
      authorizationHeader: request.headers.authorization,
    });
    if (!result.ok) {
      const codeByError = {
        AUTH_MISSING_BEARER: 401,
        AUTH_INVALID_TOKEN: 401,
        AUTH_EXPIRED_TOKEN: 401,
      };
      reply.code(codeByError[result.error] ?? 400);
      return result;
    }
    return result;
  });

  fastify.get("/chat/conversations/:conversationId/messages", async (request, reply) => {
    console.log("[api][chat] /chat/conversations/:conversationId/messages", {
      method: request.method,
      conversationId: request.params?.conversationId,
      authorization: request.headers.authorization ? "***present***" : "***missing***",
    });
    const result = await listChatMessages({
      authorizationHeader: request.headers.authorization,
      conversationId: request.params?.conversationId,
    });
    if (!result.ok) {
      const codeByError = {
        AUTH_MISSING_BEARER: 401,
        AUTH_INVALID_TOKEN: 401,
        AUTH_EXPIRED_TOKEN: 401,
        CHAT_MISSING_CONVERSATION_ID: 400,
        CHAT_CONVERSATION_NOT_FOUND: 404,
        CHAT_FORBIDDEN_CONVERSATION: 403,
      };
      reply.code(codeByError[result.error] ?? 400);
      return result;
    }
    return result;
  });

  fastify.post("/chat/conversations/:conversationId/messages", async (request, reply) => {
    console.log("[api][chat] /chat/conversations/:conversationId/messages", {
      method: request.method,
      conversationId: request.params?.conversationId,
      authorization: request.headers.authorization ? "***present***" : "***missing***",
      body: request.body ?? null,
    });
    const result = await sendConversationMessage({
      authorizationHeader: request.headers.authorization,
      conversationId: request.params?.conversationId,
      message: request.body?.message,
    });
    if (!result.ok) {
      const codeByError = {
        AUTH_MISSING_BEARER: 401,
        AUTH_INVALID_TOKEN: 401,
        AUTH_EXPIRED_TOKEN: 401,
        CHAT_MISSING_CONVERSATION_ID: 400,
        CHAT_EMPTY_MESSAGE: 400,
        CHAT_CONVERSATION_NOT_FOUND: 404,
        CHAT_FORBIDDEN_CONVERSATION: 403,
        OLLAMA_UNREACHABLE: 503,
        OLLAMA_GENERATE_FAILED: 502,
        OLLAMA_EMPTY_RESPONSE: 502,
      };
      reply.code(codeByError[result.error] ?? 400);
      return result;
    }
    return result;
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const result = await refreshAccessToken({
      refreshToken: request.body?.refreshToken,
    });

    if (!result.ok) {
      const codeByError = {
        AUTH_MISSING_REFRESH_TOKEN: 400,
        AUTH_INVALID_REFRESH_TOKEN: 401,
        AUTH_EXPIRED_REFRESH_TOKEN: 401,
      };
      reply.code(codeByError[result.error] ?? 400);
      return result;
    }

    return result;
  });
}
