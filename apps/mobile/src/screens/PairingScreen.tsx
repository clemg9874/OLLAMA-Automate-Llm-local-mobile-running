import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { confirmPairing, decodePairingDeepLink } from "../lib/pairing";
import { savePairingSession } from "../lib/sessionStore";
import { ds, statusColors, type StatusTone } from "../theme/designSystem";
import type { PairingPayload, PairingSession } from "../types/app";

type Props = {
  onPaired: (session: PairingSession) => void;
};

export function PairingScreen({ onPaired }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [lastScannedLink, setLastScannedLink] = useState<string | null>(null);
  const [lastParsedPayload, setLastParsedPayload] = useState<PairingPayload | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  async function openScanner() {
    if (!permission?.granted) {
      const requested = await requestPermission();
      if (!requested.granted) {
        Alert.alert("Camera permission required", "Allow camera access to scan QR codes.");
        return;
      }
    }
    setHasScanned(false);
    setIsScannerOpen(true);
  }

  async function handlePayload(payload: PairingPayload) {
    setIsSubmitting(true);
    setLastError(null);
    try {
      const { session, response } = await confirmPairing(payload);
      setResult(response);
      await savePairingSession(session);
      onPaired(session);
    } catch (error) {
      const asText = String(error);
      setResult({ ok: false, error: asText });
      setLastError(asText);
    } finally {
      setIsSubmitting(false);
    }
  }

  function onQrScanned(data: string) {
    if (hasScanned) return;
    setHasScanned(true);
    setLastScannedLink(data);
    setIsScannerOpen(false);
    try {
      const payload = decodePairingDeepLink(data);
      setLastParsedPayload(payload);
      void handlePayload(payload);
    } catch {
      setLastError("Invalid QR payload");
      Alert.alert("Invalid QR payload", "Scanned code is not a valid pairing deep link.");
    }
  }

  const statusTone: StatusTone = isSubmitting ? "loading" : result && !lastError ? "success" : "default";
  const status = statusColors(statusTone);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mobile Pairing</Text>
      <Text style={styles.subtitle}>Scan the pairing QR code to connect this device.</Text>

      <View style={[styles.badge, { backgroundColor: status.bg }]}>
        <View style={[styles.badgeDot, { backgroundColor: status.dot }]} />
        <Text style={[styles.badgeText, { color: status.text }]}>
          {isSubmitting ? "Connecting..." : result && !lastError ? "Paired" : "Not paired"}
        </Text>
      </View>

      {isScannerOpen ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scanner</Text>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onQrScanned(data)}
          />
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setIsScannerOpen(false)}>
            <Text style={styles.buttonText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={openScanner} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Scan pairing QR</Text>}
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest scan</Text>
        <Text style={styles.code}>{lastScannedLink ?? "No QR scanned yet."}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parsed payload</Text>
        <Text style={styles.code}>{JSON.stringify(lastParsedPayload, null, 2) || "null"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API response</Text>
        <Text style={styles.code}>{JSON.stringify(result, null, 2) || "null"}</Text>
      </View>

      {lastError ? (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorTitle}>Last error</Text>
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      ) : null}

      <StatusBar style="light" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ds.colors.background },
  container: {
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
    backgroundColor: ds.colors.background,
    paddingBottom: ds.spacing.xl,
  },
  title: { fontSize: ds.typography.title, color: ds.colors.text, fontWeight: "700" },
  subtitle: { color: ds.colors.textMuted, marginBottom: ds.spacing.sm, fontSize: ds.typography.body },
  badge: {
    alignSelf: "flex-start",
    borderRadius: ds.radius.pill,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: ds.spacing.sm,
  },
  badgeDot: { width: 8, height: 8, borderRadius: ds.radius.pill },
  badgeText: { fontWeight: "600", fontSize: ds.typography.caption },
  button: {
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    alignItems: "center",
    minHeight: 44,
  },
  secondaryButton: { backgroundColor: ds.colors.surfaceSoft },
  buttonText: { color: ds.colors.text, fontWeight: "600", fontSize: ds.typography.body },
  card: {
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    gap: ds.spacing.sm,
  },
  cardTitle: { fontWeight: "600", marginBottom: ds.spacing.xs, color: ds.colors.text, fontSize: ds.typography.heading },
  camera: { width: "100%", height: 300, borderRadius: ds.radius.md, overflow: "hidden" },
  code: { fontFamily: "monospace", color: ds.colors.textMuted, fontSize: ds.typography.mono },
  errorCard: { borderColor: ds.colors.danger, backgroundColor: ds.colors.dangerSoft },
  errorTitle: { color: ds.colors.danger, fontWeight: "700" },
  errorText: { color: ds.colors.text, fontSize: ds.typography.caption },
});
