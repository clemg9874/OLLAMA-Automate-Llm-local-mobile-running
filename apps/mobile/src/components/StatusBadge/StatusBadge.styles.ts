import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    borderRadius: ds.radius.pill,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: ds.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: ds.radius.pill,
  },
  text: {
    fontWeight: "600",
    fontSize: ds.typography.caption,
  },
});
