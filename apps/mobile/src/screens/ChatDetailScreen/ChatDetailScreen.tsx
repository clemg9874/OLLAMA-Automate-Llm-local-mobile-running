import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAuthedApiClient } from "../../lib/apiClient";
import { savePairingSession } from "../../lib/sessionStore";
import { fetchChatHistory, sendChatMessage } from "../../services/chatService";
import { MessageList } from "../../components/MessageList/MessageList";
import { chatDetailColors, chatDetailStyles as styles } from "./ChatDetailScreen.styles";
import type { PairingSession } from "../../types/app";

type ChatResultMeta = {
  ok: boolean;
  status?: number;
  error?: string;
};

type Props = {
  session: PairingSession;
  conversationId: string;
  onSessionUpdate: (nextSession: PairingSession) => void;
  onBack: () => void;
};

export function ChatDetailScreen({ session, conversationId, onSessionUpdate, onBack }: Props) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatResultMeta, setChatResultMeta] = useState<ChatResultMeta | undefined>(undefined);
  const [selectedModel] = useState("llama3.1:8b");
  const [optimisticMessages, setOptimisticMessages] = useState<
    Array<{ id: string; conversationId: string; role: "user" | "assistant"; content: string; createdAt: string }>
  >([]);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const queryClient = useQueryClient();
  const api = useMemo(
    () =>
      createAuthedApiClient({
        getSession: () => session,
        onSessionUpdate: async (nextSession) => {
          await savePairingSession(nextSession);
          onSessionUpdate(nextSession);
        },
      }),
    [session, onSessionUpdate],
  );

  const historyQuery = useQuery({
    queryKey: ["chat-history", conversationId],
    queryFn: async () => fetchChatHistory(api, conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const result = await sendChatMessage(api, conversationId, message);
      await queryClient.invalidateQueries({ queryKey: ["chat-history", conversationId] });
      return result;
    },
    onSuccess: (result) => {
      setChatResultMeta({ ok: result.ok, status: result.status });
      setOptimisticMessages([]);
    },
    onError: (error) => {
      setChatResultMeta({ ok: false, error: String(error) });
      setOptimisticMessages([]);
    },
    onSettled: () => {
      setShowTypingIndicator(false);
    },
  });

  async function sendChat() {
    const message = chatMessage.trim();
    if (!message) {
      Alert.alert("Empty message", "Type a message before sending.");
      return;
    }
    const optimisticUserMessage = {
      id: `tmp-${Date.now()}`,
      conversationId,
      role: "user" as const,
      content: message,
      createdAt: new Date().toISOString(),
    };
    setChatMessage("");
    setShowTypingIndicator(true);
    setOptimisticMessages((prev) => [...prev, optimisticUserMessage]);
    await sendMutation.mutateAsync(message);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <View style={styles.chatTopBar}>
          <View style={styles.chatTopTitleWrap}>
            <Text style={styles.chatTopTitle}>Conversation</Text>
            <View style={styles.chatConnectedBadge}>
              <View style={styles.chatConnectedDot} />
              <Text style={styles.chatConnectedText}>Connected</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.chatTopMenuButton} onPress={onBack}>
            <Text style={styles.chatTopMenuText}>⋮</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chatModelRow}>
          <View style={styles.chatModelLeft}>
            <Text style={styles.chatModelIcon}>⚙</Text>
            <Text style={styles.chatModelPillText}>{selectedModel.replace(":", " ")}</Text>
            <Text style={styles.chatModelCaret}>⌄</Text>
          </View>
          <Text style={styles.chatModelMeta}>◷ Avg: 1.2s</Text>
        </View>

        <ScrollView horizontal style={styles.chatQuickActionsScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chatQuickActions}>
          <View style={styles.chatQuickActionPillOutline}>
            <Text style={styles.chatQuickActionText}>Code</Text>
          </View>
          <View style={styles.chatQuickActionPillOutline}>
            <Text style={styles.chatQuickActionText}>Image</Text>
          </View>
          <View style={styles.chatQuickActionPillOutline}>
            <Text style={styles.chatQuickActionText}>Resume</Text>
          </View>
        </ScrollView>

        <ScrollView style={styles.chatMessagesScroll} contentContainerStyle={styles.chatMessagesContainer}>
          <MessageList messages={[...(historyQuery.data ?? []), ...optimisticMessages]} isLoading={historyQuery.isPending} showTypingIndicator={showTypingIndicator} />
        </ScrollView>

        <View style={styles.chatComposer}>
          <View style={styles.chatComposerRow}>
            <TouchableOpacity style={styles.chatCircleButton}>
              <Text style={styles.chatCircleButtonText}>+</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Message..."
              placeholderTextColor={chatDetailColors.inputPlaceholder}
              editable={!sendMutation.isPending}
            />
            <TouchableOpacity style={[styles.chatSendButton, sendMutation.isPending && styles.buttonDisabled]} onPress={() => void sendChat()} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.chatSendButtonText}>Send</Text>}
            </TouchableOpacity>
          </View>
          {chatResultMeta ? <Text style={styles.chatMetaText}>{JSON.stringify(chatResultMeta)}</Text> : null}
        </View>
        <StatusBar style="light" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
