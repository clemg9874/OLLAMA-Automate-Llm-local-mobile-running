import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAuthedApiClient } from "../../lib/apiClient";
import { appConfig } from "../../lib/config";
import { savePairingSession } from "../../lib/sessionStore";
import { createChatConversation, fetchChatConversations } from "../../services/chatService";
import { hommeScreenColors, hommeScreenStyles as styles } from "./HommeScreen.styles";
import type { PairingSession } from "../../types/app";
import { ConversationCard } from "../../components/ConversationCard/ConversationCard";
import { HomeHeader } from "../../components/HomeHeader/HomeHeader";
import { NewConversationCard } from "../../components/NewConversationCard/NewConversationCard";

type Props = {
  session: PairingSession;
  onDisconnect: () => Promise<void>;
  onSessionUpdate: (nextSession: PairingSession) => void;
  onOpenConversation: (conversationId: string) => void;
};

type ChatResultMeta = {
  ok: boolean;
  status?: number;
  error?: string;
  info?: string;
  conversationId?: string;
};

export function HommeScreen({ session, onDisconnect, onSessionUpdate, onOpenConversation }: Props) {
  const [chatResultMeta, setChatResultMeta] = useState<ChatResultMeta | undefined>(undefined);
  const [newPrompt, setNewPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const suggestions = ["Explique-moi...", "Ecris du code pour...", "Aide-moi a comprendre...", "Compare..."];
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

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => fetchChatConversations(api),
  });

  async function persistActiveConversation(nextConversationId: string): Promise<void> {
    const nextSession: PairingSession = {
      ...session,
      conversationId: nextConversationId,
    };
    await savePairingSession(nextSession);
    onSessionUpdate(nextSession);
  }

  async function createConversationAndOpen(seedMessage?: string) {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const createdId = await createChatConversation(api, appConfig.defaultChatModel);
      await persistActiveConversation(createdId);
      await queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setChatResultMeta({
        ok: true,
        status: 200,
        info: seedMessage ? "CHAT_CONVERSATION_CREATED_WITH_PROMPT" : "CHAT_CONVERSATION_CREATED",
        conversationId: createdId,
      });
      setNewPrompt("");
      onOpenConversation(createdId);
    } catch (error) {
      setChatResultMeta({ ok: false, error: String(error) });
    } finally {
      setIsCreating(false);
    }
  }

  async function openConversation(conversationId: string) {
    await persistActiveConversation(conversationId);
    onOpenConversation(conversationId);
  }

  const filtered = useMemo(() => {
    const items = conversationsQuery.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.id.toLowerCase().includes(q));
  }, [conversationsQuery.data, searchQuery]);

  const pinned = filtered.filter((c) => c.id === session.conversationId);
  const recent = filtered.filter((c) => c.id !== session.conversationId);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView style={styles.screen}>
        <HomeHeader conversationsCount={filtered.length} />

        <View style={styles.homeMain}>
          <NewConversationCard
            value={newPrompt}
            onChangeText={setNewPrompt}
            onSend={() => void createConversationAndOpen(newPrompt)}
            onPickSuggestion={setNewPrompt}
            suggestions={suggestions}
            isCreating={isCreating}
          />

          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher dans les conversations..."
            placeholderTextColor={hommeScreenColors.inputPlaceholder}
          />

          {pinned.length > 0 ? <Text style={styles.sectionTitle}>Epinglees</Text> : null}
          {pinned.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              pinnedItem
              onPress={(conversationId) => void openConversation(conversationId)}
            />
          ))}

          <Text style={styles.sectionTitle}>Recentes</Text>
          {conversationsQuery.isPending ? <ActivityIndicator /> : null}
          {recent.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              pinnedItem={false}
              onPress={(conversationId) => void openConversation(conversationId)}
            />
          ))}
          {!conversationsQuery.isPending && filtered.length === 0 ? <Text style={styles.homeStatsText}>No conversations found.</Text> : null}

          <Text style={styles.code}>{JSON.stringify(chatResultMeta, null, 2) || "null"}</Text>

          <TouchableOpacity style={styles.homeDangerButton} onPress={() => void onDisconnect()}>
            <Text style={styles.homeDangerButtonText}>Disconnect this device</Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="light" />
      </ScrollView>
    </SafeAreaView>
  );
}
