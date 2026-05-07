const baseUrl = process.env.SETUP_API_BASE_URL ?? "http://localhost:3000";

async function call(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { parseError: true };
  }

  return {
    ok: response.ok,
    status: response.status,
    path,
    data,
  };
}

function printResult(result) {
  const marker = result.ok ? "OK" : "KO";
  console.log(`[${marker}] ${result.path} -> ${result.status}`);
  console.log(JSON.stringify(result.data, null, 2));
}

async function main() {
  const checks = await call("POST", "/setup/checks");
  printResult(checks);

  const bootstrap = await call("POST", "/setup/bootstrap");
  printResult(bootstrap);

  const start = await call("POST", "/setup/start", {
    model: "llama3.1:8b",
    ensureModel: false,
  });
  printResult(start);

  const status = await call("GET", "/setup/status");
  printResult(status);

  if (!checks.ok || !bootstrap.ok || !status.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("test:setup failed", error);
  process.exit(1);
});
