const { contextBridge, shell } = require("electron");

const API_BASE_URL = process.env.INSTALLER_API_BASE_URL || "http://localhost:3000";

async function post(path, payload = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { status: response.status, ok: response.ok, data };
}

async function get(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { "content-type": "application/json" },
  });

  const data = await response.json();
  return { status: response.status, ok: response.ok, data };
}

contextBridge.exposeInMainWorld("installerApi", {
  checks: () => post("/setup/checks"),
  bootstrap: () => post("/setup/bootstrap"),
  start: (payload) => post("/setup/start", payload),
  startCloudflared: (payload) => post("/setup/cloudflared/start", payload),
  status: () => get("/setup/status"),
  pairingQr: () => post("/setup/pairing/qr"),
  pairingStatus: (sessionId) => get(`/setup/pairing/${encodeURIComponent(sessionId)}/status`),
  pairingConfirm: (payload) => post("/setup/pairing/confirm", payload),
  openExternal: (url) => shell.openExternal(url),
  apiBaseUrl: API_BASE_URL,
});
