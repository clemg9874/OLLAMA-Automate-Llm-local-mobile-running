import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  base: {
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: ds.spacing.md,
  },
  primary: {
    backgroundColor: ds.colors.primary,
  },
  secondary: {
    backgroundColor: ds.colors.surfaceSoft,
  },
  text: {
    color: ds.colors.text,
    fontWeight: "600",
    fontSize: ds.typography.body,
  },
});
