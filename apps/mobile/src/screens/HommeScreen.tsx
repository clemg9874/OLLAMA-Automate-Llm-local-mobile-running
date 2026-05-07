import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createAuthedApiClient } from "../lib/apiClient";
import { appConfig } from "../lib/config";
import { savePairingSession } from "../lib/sessionStore";
import { createChatConversation, fetchChatConversations, type ChatConversationSummary } from "../services/chatService";
import { connectedScreenColors, connectedScreenStyles as styles } from "./ConnectedScreen.styles";
import type { PairingSession } from "../types/app";

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

  const ConversationRow = ({ conversation, pinnedItem }: { conversation: ChatConversationSummary; pinnedItem: boolean }) => (
    <TouchableOpacity
      key={conversation.id}
      style={[styles.convCard, pinnedItem ? styles.convCardPinned : null]}
      onPress={() => void openConversation(conversation.id)}
    >
      <View style={styles.convCardInnerRow}>
        <View style={styles.convIconWrap}>
          <Text style={styles.convIcon}>◻</Text>
        </View>
        <View style={styles.convContent}>
          <View style={styles.convCardTop}>
            <Text style={styles.convTitle}>{`Reseau de neurones ${conversation.id.slice(0, 3).toUpperCase()}`}</Text>
            <Text style={styles.convOpenCta}>{pinnedItem ? "📌" : "›"}</Text>
          </View>
          <Text style={styles.convPreview}>Explique-moi comment fonctionne un reseau de neurones convolutif...</Text>
          <Text style={styles.convMeta}>{`□ ${appConfig.defaultChatModel}   □ 6   □ ${formatRelative(conversation.updatedAt)}`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderRow}>
          <View style={styles.homeTitleWrap}>
            <Text style={styles.homeTitle}>OLLAMA Automate</Text>
            <Text style={styles.homeSubtitle}>Local LLM Mobile</Text>
          </View>
          <Text style={styles.homeWifi}>⌁</Text>
        </View>
      </View>

      <View style={styles.homeStatsBar}>
        <View style={styles.homeStatsLeft}>
          <Text style={styles.homeStatsText}>● Connecte</Text>
          <Text style={styles.homeStatsText}>⚡ 24ms</Text>
        </View>
        <Text style={styles.homeStatsText}>{`${filtered.length || 3} modeles  ›`}</Text>
      </View>

      <View style={styles.homeMain}>
        <View style={styles.newConversationCard}>
          <Text style={styles.newConversationTitle}>Nouvelle conversation</Text>
          <Text style={styles.newConversationSub}>Posez votre question a l'IA locale</Text>
          <View style={styles.newConversationHeaderRow}>
            <View style={styles.newConversationIconWrap}>
              <Text style={styles.newConversationIcon}>✣</Text>
            </View>
          </View>
          <View style={styles.newConversationInputRow}>
            <TextInput
              style={styles.newConversationInput}
              value={newPrompt}
              onChangeText={setNewPrompt}
              placeholder="De quoi voulez-vous parler ?"
              placeholderTextColor={connectedScreenColors.inputPlaceholder}
            />
            <TouchableOpacity
              style={styles.newConversationSendButton}
              onPress={() => void createConversationAndOpen(newPrompt)}
              disabled={isCreating}
            >
              {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.newConversationSendIcon}>➤</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.suggestionWrap}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity key={suggestion} style={styles.suggestionChip} onPress={() => setNewPrompt(suggestion)}>
                <Text style={styles.suggestionText}>{`+ ${suggestion}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher dans les conversations..."
          placeholderTextColor={connectedScreenColors.inputPlaceholder}
        />

        {pinned.length > 0 ? <Text style={styles.sectionTitle}>Epinglees</Text> : null}
        {pinned.map((conversation) => (
          <ConversationRow key={conversation.id} conversation={conversation} pinnedItem />
        ))}

        <Text style={styles.sectionTitle}>Recentes</Text>
        {conversationsQuery.isPending ? <ActivityIndicator /> : null}
        {recent.map((conversation) => (
          <ConversationRow key={conversation.id} conversation={conversation} pinnedItem={false} />
        ))}
        {!conversationsQuery.isPending && filtered.length === 0 ? <Text style={styles.homeStatsText}>No conversations found.</Text> : null}

        <Text style={styles.code}>{JSON.stringify(chatResultMeta, null, 2) || "null"}</Text>

        <TouchableOpacity style={styles.homeDangerButton} onPress={() => void onDisconnect()}>
          <Text style={styles.homeDangerButtonText}>Disconnect this device</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </ScrollView>
  );
}
