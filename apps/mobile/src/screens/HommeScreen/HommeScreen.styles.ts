import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const hommeScreenStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ds.colors.background },
  homeMain: { padding: ds.spacing.lg, gap: ds.spacing.md, paddingBottom: 80 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#1e242c",
    borderRadius: ds.radius.md,
    backgroundColor: "#141a23",
    color: ds.colors.text,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: 11,
  },
  sectionTitle: {
    color: ds.colors.textMuted,
    fontSize: ds.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: ds.spacing.sm,
    marginBottom: ds.spacing.xs,
  },
  homeStatsText: { color: ds.colors.textMuted, fontSize: ds.typography.caption },
  code: { fontFamily: "monospace", marginTop: ds.spacing.sm, color: ds.colors.textMuted, fontSize: ds.typography.mono },
  homeDangerButton: {
    marginTop: ds.spacing.md,
    borderWidth: 1,
    borderColor: ds.colors.danger,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.dangerSoft,
    paddingVertical: ds.spacing.md,
    alignItems: "center",
  },
  homeDangerButtonText: { color: ds.colors.danger, fontWeight: "700" },
});

export const hommeScreenColors = {
  inputPlaceholder: ds.colors.textMuted,
} as const;
