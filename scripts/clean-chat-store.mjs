import fs from "node:fs/promises";
import path from "node:path";

const runtimeDir = path.resolve(process.cwd(), ".runtime");
const chatStoreFile = path.join(runtimeDir, "chat-store.json");

async function main() {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(
    chatStoreFile,
    JSON.stringify({ conversations: [], messages: [] }, null, 2),
    "utf8",
  );
  console.log(`[clean-chat-store] reset ${chatStoreFile}`);
}

main().catch((error) => {
  console.error("[clean-chat-store] failed", error);
  process.exit(1);
});
