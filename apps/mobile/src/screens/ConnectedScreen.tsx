import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createAuthedApiClient } from "../lib/apiClient";
import { appConfig } from "../lib/config";
import { savePairingSession } from "../lib/sessionStore";
import {
  createChatConversation,
  fetchChatConversations,
  fetchChatHistory,
  sendChatMessage,
} from "../services/chatService";
import { ConnectionDetailsCard } from "./components/ConnectionDetailsCard";
import { ConversationPicker } from "./components/ConversationPicker";
import { MessageList } from "./components/MessageList";
import { connectedScreenColors, connectedScreenStyles as styles } from "./ConnectedScreen.styles";
import type { PairingSession } from "../types/app";

type Props = {
  session: PairingSession;
  onDisconnect: () => Promise<void>;
  onSessionUpdate: (nextSession: PairingSession) => void;
};

type ChatResultMeta = {
  ok: boolean;
  status?: number;
  error?: string;
  info?: string;
  conversationId?: string;
};

export function ConnectedScreen({ session, onDisconnect, onSessionUpdate }: Props) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatResultMeta, setChatResultMeta] = useState<ChatResultMeta | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string | undefined>(session.conversationId);
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

  const activeConversationId = conversationId ?? session.conversationId;

  const historyQuery = useQuery({
    queryKey: ["chat-history", activeConversationId],
    enabled: Boolean(activeConversationId),
    queryFn: async () => fetchChatHistory(api, activeConversationId!),
  });

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => fetchChatConversations(api),
  });

  async function persistActiveConversation(nextConversationId: string) {
    setConversationId(nextConversationId);
    const nextSession: PairingSession = {
      ...session,
      conversationId: nextConversationId,
    };
    await savePairingSession(nextSession);
    onSessionUpdate(nextSession);
  }

  async function createConversation(): Promise<string | undefined> {
    try {
      const createdId = await createChatConversation(api, appConfig.defaultChatModel);
      await persistActiveConversation(createdId);
      await queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["chat-history", createdId] });
      return createdId;
    } catch (error) {
      setChatResultMeta({ ok: false, error: String(error) });
      return undefined;
    }
  }

  async function ensureConversation(): Promise<string | undefined> {
    if (activeConversationId) return activeConversationId;
    return createConversation();
  }

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const activeId = await ensureConversation();
      if (!activeId) {
        throw new Error("CHAT_CONVERSATION_CREATE_FAILED");
      }
      const result = await sendChatMessage(api, activeId, message);
      await queryClient.invalidateQueries({ queryKey: ["chat-history", activeId] });
      return result;
    },
    onSuccess: (result) => {
      setChatResultMeta({
        ok: result.ok,
        status: result.status,
      });
      setChatMessage("");
    },
    onError: (error) => {
      setChatResultMeta({ ok: false, error: String(error) });
    },
  });

  async function sendChat() {
    const message = chatMessage.trim();
    if (!message) {
      Alert.alert("Empty message", "Type a message before sending.");
      return;
    }
    await sendMutation.mutateAsync(message);
  }

  async function createNewConversation() {
    const createdId = await createConversation();
    if (!createdId) return;
    setChatResultMeta({ ok: true, status: 200, info: "CHAT_CONVERSATION_CREATED", conversationId: createdId });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Connected</Text>
      <Text style={styles.subtitle}>This device is paired with your backend.</Text>

      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>Online</Text>
      </View>

      <ConnectionDetailsCard session={session} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chats</Text>
        <ConversationPicker
          conversations={conversationsQuery.data ?? []}
          activeConversationId={activeConversationId}
          isSending={sendMutation.isPending}
          onCreateConversation={() => void createNewConversation()}
          onSelectConversation={(id) => void persistActiveConversation(id)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chat detail</Text>
        {!activeConversationId ? (
          <Text style={styles.detailLabel}>Select a chat from the list to open its detail.</Text>
        ) : null}
        {activeConversationId ? (
          <Text style={styles.detailLabel}>{`Conversation: ${activeConversationId}`}</Text>
        ) : null}
        {activeConversationId ? (
          <>
        <TextInput
          style={styles.input}
          value={chatMessage}
          onChangeText={setChatMessage}
          placeholder="Send a message to your backend..."
          placeholderTextColor={connectedScreenColors.inputPlaceholder}
        />
        <TouchableOpacity
          style={[styles.button, sendMutation.isPending && styles.buttonDisabled]}
          onPress={sendChat}
          disabled={sendMutation.isPending}
        >
          {sendMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}
        </TouchableOpacity>
        <Text style={styles.code}>{JSON.stringify(chatResultMeta, null, 2) || "null"}</Text>
        <MessageList messages={historyQuery.data ?? []} isLoading={historyQuery.isPending} />
          </>
        ) : null}
      </View>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => void onDisconnect()}>
        <Text style={styles.buttonText}>Disconnect this device</Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </ScrollView>
  );
}
