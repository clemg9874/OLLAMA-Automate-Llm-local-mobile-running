import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  homeHeader: {
    paddingHorizontal: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
    backgroundColor: ds.colors.surface,
  },
  homeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  homeTitleWrap: { flex: 1 },
  homeTitle: { color: ds.colors.text, fontSize: 34, fontWeight: "700" },
  homeSubtitle: { color: ds.colors.textMuted, fontSize: ds.typography.caption, marginTop: 2 },
  homeWifi: { color: ds.colors.success, fontSize: 17, fontWeight: "700" },
  homeStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
    backgroundColor: ds.colors.surfaceSoft,
  },
  homeStatsLeft: { flexDirection: "row", alignItems: "center", gap: ds.spacing.md },
  homeStatsText: { color: ds.colors.textMuted, fontSize: ds.typography.caption },
  homeStatsTextOnline: { color: ds.colors.success },
});
