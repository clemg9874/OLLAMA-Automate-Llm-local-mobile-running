import * as SecureStore from "expo-secure-store";
import type { PairingSession } from "../types/app";

export const PAIRING_SESSION_KEY = "pairing_session_v1";
export const MACHINE_ID_KEY = "machine_id_v1";

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

function generateMachineId(): string {
  const hex = (n: number) => Math.floor(Math.random() * 16 ** n).toString(16).padStart(n, "0");
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
}

export async function getOrCreateMachineId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(MACHINE_ID_KEY);
  if (existing) return existing;
  const machineId = generateMachineId();
  await SecureStore.setItemAsync(MACHINE_ID_KEY, machineId);
  return machineId;
}
