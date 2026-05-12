import { Text, View } from "react-native";
import { useConnectionStatus } from "../../lib/connectionStatus";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { styles } from "./HomeHeader.styles";

type Props = {
  conversationsCount: number;
};

export function HomeHeader({ conversationsCount }: Props) {
  const status = useConnectionStatus();
  const isOnline = status.state === "connected" && status.apiReachable;
  const headerLabel = isOnline ? "En ligne" : status.state === "connecting" ? "Connexion..." : "Hors ligne";
  const headerTone = isOnline ? "success" : status.state === "connecting" ? "loading" : "error";
  const statsLabel = isOnline
    ? status.ollamaReachable
      ? "● Ollama connecte"
      : "● API connectee"
    : status.state === "connecting"
      ? "● Connexion en cours"
      : "● Hors ligne";

  return (
    <>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderRow}>
          <View style={styles.homeTitleWrap}>
            <Text style={styles.homeTitle}>OLLAMA Automate</Text>
            <Text style={styles.homeSubtitle}>Local LLM Mobile</Text>
          </View>
          <StatusBadge tone={headerTone} label={headerLabel} />
        </View>
      </View>
      <View style={styles.homeStatsBar}>
        <View style={styles.homeStatsLeft}>
          <Text style={[styles.homeStatsText, isOnline ? styles.homeStatsTextOnline : null]}>{statsLabel}</Text>
        </View>
        <Text style={styles.homeStatsText}>{`${conversationsCount} conversation${conversationsCount > 1 ? "s" : ""}  ›`}</Text>
      </View>
    </>
  );
}
