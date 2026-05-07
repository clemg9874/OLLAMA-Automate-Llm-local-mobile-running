import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  newConversationCard: {
    borderWidth: 1,
    borderColor: "#1e242c",
    borderRadius: ds.radius.lg,
    backgroundColor: "#020406",
    padding: ds.spacing.md,
  },
  newConversationHeaderRow: {
    position: "absolute",
    left: ds.spacing.md,
    top: ds.spacing.md,
  },
  newConversationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#00383b",
    alignItems: "center",
    justifyContent: "center",
  },
  newConversationIcon: { color: "#00d1d1", fontSize: 16, fontWeight: "700" },
  newConversationTitle: { color: ds.colors.text, fontSize: ds.typography.heading, fontWeight: "700" },
  newConversationSub: { color: ds.colors.textMuted, fontSize: ds.typography.caption, marginTop: 2, marginBottom: ds.spacing.sm, paddingLeft: 56 },
  newConversationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ds.spacing.sm,
    borderWidth: 1,
    borderColor: "#1d222a",
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.background,
    paddingHorizontal: ds.spacing.sm,
    minHeight: 54,
  },
  newConversationInput: { flex: 1, color: ds.colors.text, fontSize: ds.typography.body, paddingVertical: ds.spacing.sm },
  newConversationSendButton: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.pill,
    backgroundColor: "#0f141a",
    borderWidth: 1,
    borderColor: ds.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  newConversationSendIcon: { color: "#646b78", fontSize: 13 },
  suggestionWrap: { flexDirection: "row", flexWrap: "wrap", gap: ds.spacing.sm, marginTop: ds.spacing.sm },
  suggestionChip: {
    borderRadius: ds.radius.pill,
    backgroundColor: ds.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: ds.colors.border,
    paddingVertical: 8,
    paddingHorizontal: ds.spacing.md,
  },
  suggestionText: { color: ds.colors.textMuted, fontSize: ds.typography.caption },
});

export const colors = {
  inputPlaceholder: ds.colors.textMuted,
} as const;
