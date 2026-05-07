import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { TouchableOpacity, View } from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
};

export function Card({ children, style, onPress, disabled = false }: Props) {
  if (onPress) {
    return (
      <TouchableOpacity style={style} onPress={onPress} disabled={disabled}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={style}>{children}</View>;
}
