import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ds.colors.background },
  container: {
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
    backgroundColor: ds.colors.background,
    paddingBottom: ds.spacing.xl,
  },
  title: { fontSize: ds.typography.title, color: ds.colors.text, fontWeight: "700" },
  subtitle: { color: ds.colors.textMuted, marginBottom: ds.spacing.sm, fontSize: ds.typography.body },
  card: {
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    backgroundColor: ds.colors.surface,
    gap: ds.spacing.sm,
  },
  cardTitle: { fontWeight: "600", marginBottom: ds.spacing.xs, color: ds.colors.text, fontSize: ds.typography.heading },
  camera: { width: "100%", height: 300, borderRadius: ds.radius.md, overflow: "hidden" },
  code: { fontFamily: "monospace", color: ds.colors.textMuted, fontSize: ds.typography.mono },
  errorCard: { borderColor: ds.colors.danger, backgroundColor: ds.colors.dangerSoft },
  errorTitle: { color: ds.colors.danger, fontWeight: "700" },
  errorText: { color: ds.colors.text, fontSize: ds.typography.caption },
});
