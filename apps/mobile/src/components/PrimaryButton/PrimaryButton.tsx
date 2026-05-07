import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { styles } from "./PrimaryButton.styles";

type Props = {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activityColor?: string;
};

export function PrimaryButton({
  label,
  children,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
  activityColor = "#fff",
}: Props) {
  const resolvedVariant = variant === "secondary" ? styles.secondary : styles.primary;
  const content = children ?? (label ? <Text style={[styles.text, textStyle]}>{label}</Text> : null);

  return (
    <TouchableOpacity style={[styles.base, resolvedVariant, style]} onPress={onPress} disabled={disabled || loading}>
      {loading ? <ActivityIndicator color={activityColor} /> : content}
    </TouchableOpacity>
  );
}
