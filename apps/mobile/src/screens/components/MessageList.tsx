import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { connectedScreenStyles as styles } from "../ConnectedScreen.styles";
import type { ChatMessage } from "../../types/app";

type Props = {
  messages: ChatMessage[];
  isLoading: boolean;
  showTypingIndicator?: boolean;
};

export function MessageList({ messages, isLoading, showTypingIndicator = false }: Props) {
  const [dotsCount, setDotsCount] = useState(1);

  useEffect(() => {
    if (!showTypingIndicator) return;
    const id = setInterval(() => {
      setDotsCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 320);
    return () => clearInterval(id);
  }, [showTypingIndicator]);

  return (
    <>
      {isLoading ? <Text style={styles.detailLabel}>Loading history...</Text> : null}
      {!isLoading && messages.length === 0 ? (
        <View style={styles.chatEmptyState}>
          <Text style={styles.chatEmptyTitle}>Start a conversation</Text>
          <Text style={styles.chatEmptySubtitle}>Ask something to your local model.</Text>
        </View>
      ) : null}
      <View style={styles.messagesWrap}>
        {messages.map((entry) => (
          <View key={entry.id} style={[styles.chatMessageRow, entry.role === "assistant" ? styles.chatMessageRowLeft : styles.chatMessageRowRight]}>
            <View style={[styles.chatAvatar, entry.role === "assistant" ? styles.chatAvatarAssistant : styles.chatAvatarUser]}>
              <Text style={styles.chatAvatarText}>{entry.role === "assistant" ? "AI" : "U"}</Text>
            </View>
            <View style={[styles.messageBubble, entry.role === "assistant" ? styles.assistantBubble : styles.userBubble]}>
              <Text style={styles.messageText}>{entry.content}</Text>
              <Text style={styles.chatMessageTime}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
          </View>
        ))}
        {showTypingIndicator ? (
          <View style={[styles.chatMessageRow, styles.chatMessageRowLeft]}>
            <View style={[styles.chatAvatar, styles.chatAvatarAssistant]}>
              <Text style={styles.chatAvatarText}>AI</Text>
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble, styles.chatTypingBubble]}>
              <Text style={styles.chatTypingText}>{`is typing${".".repeat(dotsCount)}`}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </>
  );
}
