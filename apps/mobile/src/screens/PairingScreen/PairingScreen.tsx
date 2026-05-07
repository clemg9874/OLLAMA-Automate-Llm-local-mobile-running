import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../../components/PrimaryButton/PrimaryButton";
import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import { confirmPairing, decodePairingDeepLink } from "../../services/pairing";
import { savePairingSession } from "../../lib/sessionStore";
import type { StatusTone } from "../../theme/designSystem";
import type { PairingPayload, PairingSession } from "../../types/app";
import { styles } from "./PairingScreen.styles";

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
  const statusLabel = isSubmitting ? "Connecting..." : result && !lastError ? "Paired" : "Not paired";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mobile Pairing</Text>
        <Text style={styles.subtitle}>Scan the pairing QR code to connect this device.</Text>

        <StatusBadge tone={statusTone} label={statusLabel} />

        {isScannerOpen ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scanner</Text>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => onQrScanned(data)}
            />
            <PrimaryButton label="Close Scanner" variant="secondary" onPress={() => setIsScannerOpen(false)} />
          </View>
        ) : (
          <PrimaryButton label="Scan pairing QR" onPress={openScanner} loading={isSubmitting} />
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
    </SafeAreaView>
  );
}
