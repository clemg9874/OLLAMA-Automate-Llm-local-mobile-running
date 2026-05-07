import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.surface,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: ds.colors.text, fontWeight: "700" },
  status: { color: ds.colors.textMuted, fontSize: ds.typography.caption },
});
