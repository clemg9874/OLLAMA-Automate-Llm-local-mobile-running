import type { StyleProp, ViewStyle } from "react-native";
import { Text, View } from "react-native";
import { statusColors, type StatusTone } from "../../theme/designSystem";
import { styles } from "./StatusBadge.styles";

type Props = {
  tone: StatusTone;
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({ tone, label, style }: Props) {
  const colors = statusColors(tone);
  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}
