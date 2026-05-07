const output = document.getElementById("output");
const checksBtn = document.getElementById("checks-btn");
const bootstrapBtn = document.getElementById("bootstrap-btn");
const startBtn = document.getElementById("start-btn");
const statusBtn = document.getElementById("status-btn");
const cloudflaredBtn = document.getElementById("cloudflared-btn");
const pairingBtn = document.getElementById("pairing-btn");
const openDashboardBtn = document.getElementById("open-dashboard-btn");
const apiUrl = document.getElementById("api-url");
const setupStatus = document.getElementById("setup-status");
const qrImage = document.getElementById("qr-image");
const publicUrlLabel = document.getElementById("public-url");
const pairingBadge = document.getElementById("pairing-badge");

let localWebUrl = "http://localhost:3001";
let localApiUrl = window.installerApi.apiBaseUrl;
let activePairingSessionId = null;
let pairingPollTimer = null;

apiUrl.textContent = window.installerApi.apiBaseUrl;

function render(result) {
  output.textContent = JSON.stringify(result, null, 2);
}

function clearPairingPoll() {
  if (pairingPollTimer) {
    clearInterval(pairingPollTimer);
    pairingPollTimer = null;
  }
}

function setQrVisualState(state) {
  if (state === "CONNECTED") {
    qrImage.classList.add("qr-inactive");
    pairingBadge.textContent = "connected";
    pairingBadge.classList.remove("expired");
    pairingBadge.style.display = "inline-block";
    return;
  }
  if (state === "EXPIRED") {
    qrImage.classList.add("qr-inactive");
    pairingBadge.textContent = "expired";
    pairingBadge.classList.add("expired");
    pairingBadge.style.display = "inline-block";
    return;
  }

  qrImage.classList.remove("qr-inactive");
  pairingBadge.style.display = "none";
}

async function pollPairingStatusOnce() {
  if (!activePairingSessionId) return;
  const result = await window.installerApi.pairingStatus(activePairingSessionId);
  if (!result.ok || !result.data?.ok) return;
  const state = result.data.status;
  setQrVisualState(state);
  if (state === "CONNECTED" || state === "EXPIRED") {
    clearPairingPoll();
  }
}

function startPairingPoll(sessionId) {
  activePairingSessionId = sessionId;
  clearPairingPoll();
  pairingPollTimer = setInterval(() => {
    void pollPairingStatusOnce();
  }, 2000);
  void pollPairingStatusOnce();
}

function applyStatus(data) {
  const ready = Boolean(data?.ready);
  setupStatus.textContent = ready ? "READY" : "NOT READY";
  setupStatus.className = ready ? "ready" : "not-ready";
  pairingBtn.disabled = !ready;
  openDashboardBtn.disabled = !ready;
  cloudflaredBtn.disabled = !ready;
  localWebUrl = data?.localWebUrl ?? localWebUrl;
  localApiUrl = data?.localApiUrl ?? localApiUrl;
  publicUrlLabel.textContent = `Public API URL: ${data?.publicApiUrl ?? "not available"}`;
}

async function refreshStatus() {
  try {
    const result = await window.installerApi.status();
    render(result);
    if (result.ok) applyStatus(result.data);
  } catch (error) {
    render({ ok: false, error: String(error) });
  }
}

checksBtn.addEventListener("click", async () => {
  render({ status: "running", step: "checks" });
  try {
    const result = await window.installerApi.checks();
    render(result);
  } catch (error) {
    render({ ok: false, error: String(error) });
  }
});

bootstrapBtn.addEventListener("click", async () => {
  render({ status: "running", step: "bootstrap" });
  try {
    const result = await window.installerApi.bootstrap();
    render(result);
    await refreshStatus();
  } catch (error) {
    render({ ok: false, error: String(error) });
  }
});

startBtn.addEventListener("click", async () => {
  render({ status: "running", step: "start" });
  try {
    const result = await window.installerApi.start({
      model: "llama3.1:8b",
      ensureModel: true,
    });
    render(result);
    await refreshStatus();
  } catch (error) {
    render({ ok: false, error: String(error) });
  }
});

statusBtn.addEventListener("click", refreshStatus);

cloudflaredBtn.addEventListener("click", async () => {
  render({ status: "running", step: "cloudflared-start" });
  try {
    const result = await window.installerApi.startCloudflared({ localApiUrl });
    render(result);
    await refreshStatus();
  } catch (error) {
    render({ ok: false, error: String(error) });
  }
});

pairingBtn.addEventListener("click", async () => {
  render({ status: "running", step: "pairing-qr" });
  try {
    const result = await window.installerApi.pairingQr();
    render(result);
    if (result.ok && result.data.ok && result.data.qrPngDataUrl) {
      qrImage.src = result.data.qrPngDataUrl;
      qrImage.style.display = "block";
      setQrVisualState("PENDING");
      if (result.data.sessionId) {
        startPairingPoll(result.data.sessionId);
      }
    }
  } catch (error) {
    render({ ok: false, error: String(error) });
  }
});

openDashboardBtn.addEventListener("click", async () => {
  await window.installerApi.openExternal(localWebUrl);
});

void refreshStatus();
