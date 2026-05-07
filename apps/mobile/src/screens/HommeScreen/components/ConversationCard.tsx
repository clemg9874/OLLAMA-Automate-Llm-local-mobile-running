import { Text, View } from "react-native";
import { appConfig } from "../../../lib/config";
import type { ChatConversationSummary } from "../../../services/chatService";
import { hommeScreenStyles as styles } from "../HommeScreen.styles";
import { Card } from "./Card";

type Props = {
  conversation: ChatConversationSummary;
  pinnedItem: boolean;
  onPress: (conversationId: string) => void;
};

function formatRelative(updatedAt: string): string {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ConversationCard({ conversation, pinnedItem, onPress }: Props) {
  return (
    <Card style={[styles.convCard, pinnedItem ? styles.convCardPinned : null]} onPress={() => onPress(conversation.id)}>
      <View style={styles.convCardInnerRow}>
        <View style={styles.convIconWrap}>
          <Text style={styles.convIcon}>◻</Text>
        </View>
        <View style={styles.convContent}>
          <View style={styles.convCardTop}>
            <Text style={styles.convTitle}>{conversation.title || "Nouvelle conversation"}</Text>
            <Text style={styles.convOpenCta}>{pinnedItem ? "📌" : "›"}</Text>
          </View>
          <Text style={styles.convPreview}>Explique-moi comment fonctionne un reseau de neurones convolutif...</Text>
          <Text style={styles.convMeta}>{`□ ${appConfig.defaultChatModel}   □ 6   □ ${formatRelative(conversation.updatedAt)}`}</Text>
        </View>
      </View>
    </Card>
  );
}
