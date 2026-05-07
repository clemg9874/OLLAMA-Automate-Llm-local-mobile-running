import { StyleSheet } from "react-native";
import { ds } from "../../theme/designSystem";

export const styles = StyleSheet.create({
  detailLabel: { color: ds.colors.textMuted, fontSize: ds.typography.caption, marginTop: ds.spacing.sm },
  messagesWrap: { marginTop: ds.spacing.md, gap: ds.spacing.lg },
  chatMessageRow: { flexDirection: "row", alignItems: "flex-start", gap: ds.spacing.sm },
  chatMessageRowLeft: { justifyContent: "flex-start" },
  chatMessageRowRight: { justifyContent: "flex-start", flexDirection: "row-reverse" },
  chatAvatar: {
    width: 26,
    height: 26,
    borderRadius: ds.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ds.spacing.xs,
  },
  chatAvatarAssistant: { backgroundColor: ds.colors.surfaceSoft, borderWidth: 1, borderColor: ds.colors.border },
  chatAvatarUser: { backgroundColor: ds.colors.primary },
  chatAvatarText: { color: ds.colors.text, fontSize: 10, fontWeight: "700" },
  messageBubble: {
    borderRadius: ds.radius.md,
    padding: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.border,
    maxWidth: "90%",
  },
  assistantBubble: { backgroundColor: ds.colors.surfaceSoft },
  userBubble: { backgroundColor: ds.colors.primarySoft },
  messageText: { color: ds.colors.text, fontSize: ds.typography.body },
  chatMessageTime: { color: ds.colors.textMuted, fontSize: 10, marginTop: ds.spacing.xs },
  chatTypingBubble: { minWidth: 110 },
  chatTypingText: { color: ds.colors.textMuted, fontSize: ds.typography.caption, fontStyle: "italic" },
  chatEmptyState: {
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.surface,
    marginBottom: ds.spacing.md,
  },
  chatEmptyTitle: { color: ds.colors.text, fontWeight: "700", fontSize: ds.typography.heading },
  chatEmptySubtitle: { color: ds.colors.textMuted, marginTop: ds.spacing.xs, fontSize: ds.typography.caption },
});
