import { Text, View } from "react-native";
import { styles } from "./HomeHeader.styles";

type Props = {
  conversationsCount: number;
};

export function HomeHeader({ conversationsCount }: Props) {
  return (
    <>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderRow}>
          <View style={styles.homeTitleWrap}>
            <Text style={styles.homeTitle}>OLLAMA Automate</Text>
            <Text style={styles.homeSubtitle}>Local LLM Mobile</Text>
          </View>
          <Text style={styles.homeWifi}>⌁</Text>
        </View>
      </View>
      <View style={styles.homeStatsBar}>
        <View style={styles.homeStatsLeft}>
          <Text style={styles.homeStatsText}>● Connecte</Text>
          <Text style={styles.homeStatsText}>⚡ 24ms</Text>
        </View>
        <Text style={styles.homeStatsText}>{`${conversationsCount || 3} modeles  ›`}</Text>
      </View>
    </>
  );
}
