import { execFile, spawn } from "node:child_process";
import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import QRCode from "qrcode";
import { setupConfig } from "./config.js";

const execFileAsync = promisify(execFile);
const runtimeDir = path.resolve(process.cwd(), ".runtime");
const runtimeFile = path.join(runtimeDir, "setup.json");
const pairingSessionsFile = path.join(runtimeDir, "pairing-sessions.json");
const chatStoreFile = path.join(runtimeDir, "chat-store.json");
const cloudflaredLogFile = path.join(runtimeDir, "cloudflared.log");
let cloudflaredProcess = null;
let cloudflaredPublicUrl = null;
const { defaults, patterns } = setupConfig;

function resolveApiBaseUrl(setupData) {
  return setupData?.publicApiUrl ?? setupData?.localApiUrl ?? defaults.localApiUrl;
}

async function commandExists(command, args = ["--version"]) {
  try {
    await execFileAsync(command, args, { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

function isProcessAlive(pid) {
  const asNumber = Number(pid);
  if (!Number.isInteger(asNumber) || asNumber <= 0) return false;
  try {
    process.kill(asNumber, 0);
    return true;
  } catch {
    return false;
  }
}

async function isPublicApiUrlHealthy(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const target = new URL(defaults.healthPath, url).toString();
    const response = await fetch(target, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const body = await response.json().catch(() => null);
    return Boolean(body?.ok);
  } catch {
    return false;
  }
}

async function resolveExistingCloudflaredTarget() {
  if (cloudflaredProcess && cloudflaredPublicUrl) {
    const healthy = await isPublicApiUrlHealthy(cloudflaredPublicUrl);
    if (healthy) {
      return {
        ok: true,
        publicApiUrl: cloudflaredPublicUrl,
        reused: true,
        source: "in-memory",
      };
    }
  }

  const setupData = await readSetupData();
  const persistedUrl = setupData?.publicApiUrl ?? null;
  const persistedPid = setupData?.cloudflaredPid ?? null;
  if (!persistedUrl) return null;

  const pidLooksAlive = isProcessAlive(persistedPid);
  if (!pidLooksAlive) return null;

  const healthy = await isPublicApiUrlHealthy(persistedUrl);
  if (!healthy) return null;

  cloudflaredPublicUrl = persistedUrl;
  return {
    ok: true,
    publicApiUrl: persistedUrl,
    reused: true,
    source: "persisted",
  };
}

function extractTryCloudflareUrl(text) {
  const matches = String(text).match(patterns.tryCloudflareUrl) ?? [];
  if (matches.length === 0) return null;
  return matches[matches.length - 1];
}

async function waitForCloudflaredUrlFromLog({
  fromOffset = 0,
  timeoutMs = 15000,
  pollMs = 300,
} = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const content = await fs.readFile(cloudflaredLogFile, "utf8");
      const chunk = content.slice(fromOffset);
      const match = extractTryCloudflareUrl(chunk);
      if (match) return match;
    } catch {
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return null;
}

export async function runSetupChecks() {
  const [hasNode, hasOllama, hasCloudflared, apiPortFree, ollamaPortFree] = await Promise.all([
    commandExists("node"),
    commandExists("ollama"),
    commandExists("cloudflared"),
    checkPortFree(3000),
    checkPortFree(11434),
  ]);

  return {
    ok: hasNode && hasOllama,
    checks: {
      nodeInstalled: hasNode,
      ollamaInstalled: hasOllama,
      cloudflaredInstalled: hasCloudflared,
      apiPort3000Free: apiPortFree,
      ollamaPort11434Free: ollamaPortFree,
    },
    nextActions: [
      !hasOllama ? "Install Ollama before continuing" : null,
      !hasCloudflared ? "Install cloudflared to expose public DNS/tunnel" : null,
      !apiPortFree ? "Free port 3000 or change API_PORT" : null,
      !ollamaPortFree ? "Port 11434 already used by Ollama (can be normal)" : null,
    ].filter(Boolean),
  };
}

async function readSetupData() {
  try {
    return JSON.parse(await fs.readFile(runtimeFile, "utf8"));
  } catch {
    return null;
  }
}

async function writeSetupData(data) {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(runtimeFile, JSON.stringify(data, null, 2), "utf8");
}

async function readPairingSessions() {
  try {
    const parsed = JSON.parse(await fs.readFile(pairingSessionsFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePairingSessions(sessions) {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(pairingSessionsFile, JSON.stringify(sessions, null, 2), "utf8");
}

async function readChatStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(chatStoreFile, "utf8"));
    return {
      conversations: Array.isArray(parsed?.conversations) ? parsed.conversations : [],
      messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
    };
  } catch {
    return {
      conversations: [],
      messages: [],
    };
  }
}

async function writeChatStore(store) {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(chatStoreFile, JSON.stringify(store, null, 2), "utf8");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function issueAccessToken(payload) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      typ: "access",
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    }),
  ).toString("base64url");
  const signature = crypto.randomBytes(24).toString("base64url");
  return `dev-access.${body}.${signature}`;
}

function issueRefreshToken(payload) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      typ: "refresh",
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      nonce: crypto.randomUUID(),
    }),
  ).toString("base64url");
  const signature = crypto.randomBytes(24).toString("base64url");
  return `dev-refresh.${body}.${signature}`;
}

function decodeDevToken(token, expectedPrefix) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== expectedPrefix) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function bootstrapLocalSetup() {
  await fs.mkdir(runtimeDir, { recursive: true });

  const data = {
    createdAt: new Date().toISOString(),
    setupId: crypto.randomUUID(),
    localApiUrl: defaults.localApiUrl,
    localWebUrl: defaults.localWebUrl,
    pairingEnabled: true,
  };

  await writeSetupData(data);
  return data;
}

export async function startLocalServices({ model = "llama3.1:8b", ensureModel = false } = {}) {
  const summary = {
    ollamaReachable: false,
    modelEnsured: false,
    model,
  };

  try {
    await execFileAsync("ollama", ["list"], { timeout: 8000 });
    summary.ollamaReachable = true;
  } catch {
    summary.ollamaReachable = false;
    return summary;
  }

  if (ensureModel) {
    await execFileAsync("ollama", ["pull", model], { timeout: 10 * 60 * 1000 });
    summary.modelEnsured = true;
  }

  return summary;
}

export async function getSetupStatus({ model = "llama3.1:8b" } = {}) {
  const checks = await runSetupChecks();
  let setupExists = false;
  const setupData = await readSetupData();
  let ollamaReachable = false;
  let modelReady = false;
  setupExists = Boolean(setupData);

  try {
    const { stdout } = await execFileAsync("ollama", ["list"], { timeout: 8000 });
    ollamaReachable = true;
    modelReady = stdout.includes(model);
  } catch {
    ollamaReachable = false;
  }

  const ready = Boolean(setupExists && ollamaReachable && checks.checks.nodeInstalled);

  const persistedCloudflaredPid = setupData?.cloudflaredPid ?? null;
  const cloudflaredActive = Boolean(
    (cloudflaredProcess && cloudflaredPublicUrl) || isProcessAlive(persistedCloudflaredPid),
  );

  return {
    ok: true,
    ready,
    checks: checks.checks,
    setupExists,
    ollamaReachable,
    model,
    modelReady,
    localApiUrl: setupData?.localApiUrl ?? defaults.localApiUrl,
    publicApiUrl: setupData?.publicApiUrl ?? null,
    cloudflaredActive,
    localWebUrl: setupData?.localWebUrl ?? defaults.localWebUrl,
  };
}

export async function startCloudflaredTunnel({
  localApiUrl = defaults.localApiUrl,
} = {}) {
  const checks = await runSetupChecks();
  if (!checks.checks.cloudflaredInstalled) {
    return {
      ok: false,
      error: "CLOUDFLARED_NOT_INSTALLED",
    };
  }

  const existing = await resolveExistingCloudflaredTarget();
  if (existing?.ok) {
    const setupData = (await readSetupData()) ?? (await bootstrapLocalSetup());
    setupData.publicApiUrl = existing.publicApiUrl;
    setupData.cloudflaredStartedAt = setupData.cloudflaredStartedAt ?? new Date().toISOString();
    await writeSetupData(setupData);
    return existing;
  }

  await fs.mkdir(runtimeDir, { recursive: true });
  let fromOffset = 0;
  try {
    const stat = await fs.stat(cloudflaredLogFile);
    fromOffset = stat.size;
  } catch {
    fromOffset = 0;
  }

  const outFd = fsSync.openSync(cloudflaredLogFile, "a");
  const errFd = fsSync.openSync(cloudflaredLogFile, "a");
  const proc = spawn("cloudflared", ["tunnel", "--url", localApiUrl], {
    detached: true,
    stdio: ["ignore", outFd, errFd],
  });
  fsSync.closeSync(outFd);
  fsSync.closeSync(errFd);
  proc.unref();

  const publicApiUrl = await waitForCloudflaredUrlFromLog({ fromOffset, timeoutMs: 15000 });
  if (!publicApiUrl) {
    if (proc.pid) {
      try {
        process.kill(proc.pid, "SIGTERM");
      } catch {
      }
    }
    return {
      ok: false,
      error: "CLOUDFLARED_TIMEOUT",
    };
  }

  cloudflaredProcess = null;
  cloudflaredPublicUrl = publicApiUrl;

  const setupData = (await readSetupData()) ?? (await bootstrapLocalSetup());
  setupData.publicApiUrl = publicApiUrl;
  setupData.cloudflaredStartedAt = new Date().toISOString();
  setupData.cloudflaredPid = proc.pid ?? null;
  await writeSetupData(setupData);

  return {
    ok: true,
    publicApiUrl,
    localApiUrl,
    detached: true,
  };
}

export async function createPairingQrSession() {
  const setupData = await readSetupData();
  const apiBaseUrl = resolveApiBaseUrl(setupData);

  const sessionId = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60_000);
  const tokenHash = hashToken(token);
  const sessions = await readPairingSessions();
  sessions.push({
    sessionId,
    tokenHash,
    apiBaseUrl,
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
    createdAt: new Date().toISOString(),
    deviceName: null,
    devicePublicKey: null,
  });
  await writePairingSessions(sessions);

  const payload = {
    v: 1,
    sid: sessionId,
    t: token,
    exp: Math.floor(expiresAt.getTime() / 1000),
    aud: "ollama-mobile",
    apiBaseUrl,
  };

  const qrText = `ollama-link://pair?data=${Buffer.from(
    JSON.stringify(payload),
  ).toString("base64url")}`;

  const qrPngDataUrl = await QRCode.toDataURL(qrText, {
    errorCorrectionLevel: "M",
    width: 280,
    margin: 1,
  });

  return {
    ok: true,
    sessionId,
    expiresAt: expiresAt.toISOString(),
    apiBaseUrl,
    qrPngDataUrl,
    deepLink: qrText,
  };
}

export async function getPairingSessionStatus(sessionId) {
  if (!sessionId) {
    return { ok: false, error: "PAIRING_INVALID_INPUT" };
  }

  const sessions = await readPairingSessions();
  const session = sessions.find((entry) => entry.sessionId === sessionId);
  if (!session) {
    return { ok: false, error: "PAIRING_NOT_FOUND" };
  }

  const nowMs = Date.now();
  const expiresAtMs = new Date(session.expiresAt).getTime();
  const isExpired = expiresAtMs <= nowMs;
  const isConnected = Boolean(session.usedAt);
  const status = isConnected ? "CONNECTED" : isExpired ? "EXPIRED" : "PENDING";

  return {
    ok: true,
    sessionId,
    status,
    isValid: status === "PENDING",
    expiresAt: session.expiresAt,
    usedAt: session.usedAt,
    remainingSeconds: Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000)),
  };
}

export async function confirmPairingSession({
  sessionId,
  token,
  deviceName = "mobile-device",
  devicePublicKey = null,
  machineId = null,
} = {}) {
  if (!sessionId || !token) {
    return {
      ok: false,
      error: "PAIRING_INVALID_INPUT",
      message: "sessionId and token are required",
    };
  }

  const sessions = await readPairingSessions();
  const index = sessions.findIndex((entry) => entry.sessionId === sessionId);
  if (index === -1) {
    return {
      ok: false,
      error: "PAIRING_NOT_FOUND",
    };
  }

  const session = sessions[index];
  if (session.usedAt) {
    return {
      ok: false,
      error: "PAIRING_ALREADY_USED",
    };
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return {
      ok: false,
      error: "PAIRING_EXPIRED",
    };
  }

  if (hashToken(token) !== session.tokenHash) {
    return {
      ok: false,
      error: "PAIRING_INVALID_TOKEN",
    };
  }

  const deviceId = crypto.randomUUID();
  const resolvedMachineId = machineId ?? session.machineId ?? crypto.randomUUID();
  const pairedAt = new Date().toISOString();
  sessions[index] = {
    ...session,
    usedAt: pairedAt,
    deviceName,
    devicePublicKey,
    deviceId,
    machineId: resolvedMachineId,
  };
  await writePairingSessions(sessions);

  const accessToken = issueAccessToken({ sid: sessionId, did: deviceId, mid: resolvedMachineId });
  const refreshToken = issueRefreshToken({ sid: sessionId, did: deviceId, mid: resolvedMachineId });

  return {
    ok: true,
    sessionId,
    deviceId,
    apiBaseUrl: session.apiBaseUrl,
    machineId: resolvedMachineId,
    pairedAt,
    accessToken,
    refreshToken,
    expiresIn: 900,
  };
}

export function authenticateAccessToken(authorizationHeader) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return { ok: false, error: "AUTH_MISSING_BEARER" };
  }

  const token = authorizationHeader.slice("Bearer ".length);
  const payload = decodeDevToken(token, "dev-access");
  if (!payload) {
    return { ok: false, error: "AUTH_INVALID_TOKEN" };
  }

  const exp = Number(payload.exp ?? 0);
  if (!exp || exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, error: "AUTH_EXPIRED_TOKEN" };
  }

  return {
    ok: true,
    token,
    payload,
  };
}

function authenticateRefreshToken(refreshToken) {
  const payload = decodeDevToken(refreshToken, "dev-refresh");
  if (!payload) {
    return { ok: false, error: "AUTH_INVALID_REFRESH_TOKEN" };
  }

  const exp = Number(payload.exp ?? 0);
  if (!exp || exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, error: "AUTH_EXPIRED_REFRESH_TOKEN" };
  }

  return { ok: true, payload };
}

export async function refreshAccessToken({ refreshToken } = {}) {
  if (!refreshToken) {
    return { ok: false, error: "AUTH_MISSING_REFRESH_TOKEN" };
  }

  const auth = authenticateRefreshToken(refreshToken);
  if (!auth.ok) return auth;

  const sid = auth.payload.sid;
  const did = auth.payload.did;
  const mid = auth.payload.mid;
  if (!sid || !did || !mid) {
    return { ok: false, error: "AUTH_INVALID_REFRESH_TOKEN" };
  }

  const accessToken = issueAccessToken({ sid, did, mid });
  const nextRefreshToken = issueRefreshToken({ sid, did, mid });
  return {
    ok: true,
    accessToken,
    refreshToken: nextRefreshToken,
    expiresIn: 900,
  };
}

export async function sendChatMessage({
  authorizationHeader,
  message,
  model = "llama3.1:8b",
} = {}) {
  const auth = authenticateAccessToken(authorizationHeader);
  if (!auth.ok) {
    return auth;
  }

  const trimmed = String(message ?? "").trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "CHAT_EMPTY_MESSAGE",
    };
  }

  let answer = "";
  try {
    const ollamaBaseUrl = defaults.ollamaBaseUrl;
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: trimmed,
        stream: false,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        error: "OLLAMA_GENERATE_FAILED",
        status: response.status,
        details: raw,
      };
    }

    const parsed = JSON.parse(raw);
    answer = String(parsed.response ?? "").trim();
    if (!answer) {
      return {
        ok: false,
        error: "OLLAMA_EMPTY_RESPONSE",
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: "OLLAMA_UNREACHABLE",
      details: String(error),
    };
  }

  return {
    ok: true,
    model,
    answer,
    usage: {
      promptChars: trimmed.length,
      completionChars: answer.length,
    },
    session: {
      pairingSessionId: auth.payload.sid ?? null,
      deviceId: auth.payload.did ?? null,
    },
  };
}

export async function createChatConversation({
  authorizationHeader,
  model = "llama3.1:8b",
} = {}) {
  const auth = authenticateAccessToken(authorizationHeader);
  if (!auth.ok) return auth;

  const store = await readChatStore();
  const conversation = {
    id: crypto.randomUUID(),
    pairingSessionId: auth.payload.sid ?? null,
    deviceId: auth.payload.did ?? null,
    machineId: auth.payload.mid ?? auth.payload.did ?? null,
    model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.conversations.push(conversation);
  await writeChatStore(store);
  return {
    ok: true,
    conversation,
  };
}

export async function listChatMessages({
  authorizationHeader,
  conversationId,
} = {}) {
  const auth = authenticateAccessToken(authorizationHeader);
  if (!auth.ok) return auth;
  if (!conversationId) {
    return { ok: false, error: "CHAT_MISSING_CONVERSATION_ID" };
  }

  const store = await readChatStore();
  const conversation = store.conversations.find((entry) => entry.id === conversationId);
  if (!conversation) {
    return { ok: false, error: "CHAT_CONVERSATION_NOT_FOUND" };
  }
  const authMachineId = auth.payload.mid ?? null;
  if (authMachineId) {
    if (conversation.machineId !== authMachineId) {
      return { ok: false, error: "CHAT_FORBIDDEN_CONVERSATION" };
    }
  } else if (conversation.deviceId !== (auth.payload.did ?? null)) {
    return { ok: false, error: "CHAT_FORBIDDEN_CONVERSATION" };
  }

  const messages = store.messages
    .filter((entry) => entry.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    ok: true,
    conversation,
    messages,
  };
}

export async function sendConversationMessage({
  authorizationHeader,
  conversationId,
  message,
} = {}) {
  const auth = authenticateAccessToken(authorizationHeader);
  if (!auth.ok) return auth;
  if (!conversationId) {
    return { ok: false, error: "CHAT_MISSING_CONVERSATION_ID" };
  }

  const trimmed = String(message ?? "").trim();
  if (!trimmed) {
    return { ok: false, error: "CHAT_EMPTY_MESSAGE" };
  }

  const store = await readChatStore();
  const conversation = store.conversations.find((entry) => entry.id === conversationId);
  if (!conversation) {
    return { ok: false, error: "CHAT_CONVERSATION_NOT_FOUND" };
  }
  const authMachineId = auth.payload.mid ?? null;
  if (authMachineId) {
    if (conversation.machineId !== authMachineId) {
      return { ok: false, error: "CHAT_FORBIDDEN_CONVERSATION" };
    }
  } else if (conversation.deviceId !== (auth.payload.did ?? null)) {
    return { ok: false, error: "CHAT_FORBIDDEN_CONVERSATION" };
  }

  const history = store.messages
    .filter((entry) => entry.conversationId === conversationId)
    .slice(-10)
    .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
    .join("\n");

  const userMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "user",
    content: trimmed,
    createdAt: new Date().toISOString(),
  };
  store.messages.push(userMessage);

  const prompt = history ? `${history}\nUSER: ${trimmed}\nASSISTANT:` : trimmed;
  const completion = await sendChatMessage({
    authorizationHeader,
    message: prompt,
    model: conversation.model ?? "llama3.1:8b",
  });
  if (!completion.ok) return completion;

  const assistantMessage = {
    id: crypto.randomUUID(),
    conversationId,
    role: "assistant",
    content: completion.answer,
    createdAt: new Date().toISOString(),
  };
  store.messages.push(assistantMessage);
  conversation.updatedAt = new Date().toISOString();

  await writeChatStore(store);
  return {
    ok: true,
    conversation,
    messages: [userMessage, assistantMessage],
  };
}

export async function listChatConversations({
  authorizationHeader,
} = {}) {
  const auth = authenticateAccessToken(authorizationHeader);
  if (!auth.ok) return auth;

  const store = await readChatStore();
  const authMachineId = auth.payload.mid ?? null;
  const authDeviceId = auth.payload.did ?? null;

  const conversations = store.conversations
    .filter((entry) =>
      authMachineId ? entry.machineId === authMachineId : entry.deviceId === authDeviceId,
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    ok: true,
    conversations,
  };
}
