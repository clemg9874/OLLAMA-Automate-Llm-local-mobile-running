import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  convCard: {
    borderWidth: 1,
    borderColor: "#20242d",
    borderRadius: 14,
    backgroundColor: "#020406",
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  convCardPinned: {
    borderColor: "#00a3a3",
    backgroundColor: "#012325",
  },
  convCardInnerRow: { flexDirection: "row", alignItems: "flex-start", gap: ds.spacing.md },
  convIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00383b",
  },
  convIcon: { fontSize: 16, color: "#e6f4f5" },
  convContent: { flex: 1 },
  convCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: ds.spacing.sm },
  convTitle: { color: ds.colors.text, fontSize: ds.typography.body, fontWeight: "700", flex: 1 },
  convPreview: { color: ds.colors.textMuted, fontSize: ds.typography.body, marginTop: ds.spacing.xs },
  convMeta: { color: ds.colors.textMuted, fontSize: ds.typography.mono, marginTop: ds.spacing.sm },
  convOpenCta: { color: ds.colors.primary, fontSize: ds.typography.caption, fontWeight: "700" },
});
