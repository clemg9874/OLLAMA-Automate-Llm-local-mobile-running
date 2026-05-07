import { Buffer } from "buffer";
import { appConfig } from "./config";
import type { PairingPayload, PairingSession } from "../types/app";

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(`${base64}${padding}`, "base64").toString("utf8");
}

export function decodePairingDeepLink(value: string): PairingPayload {
  const url = new URL(value.trim());
  const encoded = url.searchParams.get("data");
  if (!encoded) {
    throw new Error("Missing data parameter");
  }
  const json = decodeBase64Url(encoded);
  const parsed = JSON.parse(json);
  if (!parsed.sid || !parsed.t) {
    throw new Error("Invalid pairing payload");
  }
  return parsed as PairingPayload;
}

export async function confirmPairing(payload: PairingPayload): Promise<{ session: PairingSession; response: unknown }> {
  const apiBaseUrl = payload.apiBaseUrl ?? appConfig.defaultApiBaseUrl;
  const response = await fetch(`${apiBaseUrl}/setup/pairing/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: payload.sid,
      token: payload.t,
      deviceName: appConfig.defaultDeviceName,
      devicePublicKey: "todo-mobile-public-key",
    }),
  });

  const rawText = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { parseError: true, rawText };
  }

  if (!(response.ok && data.accessToken && data.refreshToken && data.deviceId)) {
    throw new Error(JSON.stringify({ status: response.status, ...data }));
  }

  return {
    response: { status: response.status, ok: response.ok, apiBaseUrl, ...data },
    session: {
      pairedAt: new Date().toISOString(),
      deviceName: appConfig.defaultDeviceName,
      deviceId: String(data.deviceId),
      apiBaseUrl,
      accessToken: String(data.accessToken),
      refreshToken: String(data.refreshToken),
    },
  };
}
