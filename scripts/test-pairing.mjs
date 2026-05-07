const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

async function main() {
  const response = await fetch(`${baseUrl}/setup/status`);
  const data = await response.json();
  console.log(JSON.stringify({ ok: response.ok, status: response.status, data }, null, 2));
}

main().catch((error) => {
  console.error("[test-pairing] failed", error);
  process.exit(1);
});
