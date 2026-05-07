import * as SecureStore from "expo-secure-store";
import type { PairingSession } from "../types/app";

export const PAIRING_SESSION_KEY = "pairing_session_v1";

export async function loadPairingSession(): Promise<PairingSession | null> {
  const raw = await SecureStore.getItemAsync(PAIRING_SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as PairingSession;
}

export async function savePairingSession(session: PairingSession): Promise<void> {
  await SecureStore.setItemAsync(PAIRING_SESSION_KEY, JSON.stringify(session));
}

export async function clearPairingSession(): Promise<void> {
  await SecureStore.deleteItemAsync(PAIRING_SESSION_KEY);
}
