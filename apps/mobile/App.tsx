import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { clearPairingSession, loadPairingSession } from "./src/lib/sessionStore";
import { ChatDetailScreen } from "./src/screens/ChatDetailScreen/ChatDetailScreen";
import { HommeScreen } from "./src/screens/HommeScreen/HommeScreen";
import { PairingScreen } from "./src/screens/PairingScreen/PairingScreen";
import type { PairingSession } from "./src/types/app";
import { styles } from "./App.styles";

const queryClient = new QueryClient();

export default function App() {
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [session, setSession] = useState<PairingSession | null>(null);
  const [route, setRoute] = useState<"pairing" | "connected" | "chat-detail">("pairing");
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const g = globalThis as unknown as {
      __MOBILE_FETCH_LOGGER_INSTALLED__?: boolean;
      __MOBILE_ORIGINAL_FETCH__?: typeof fetch;
    };
    if (g.__MOBILE_FETCH_LOGGER_INSTALLED__) return;

    g.__MOBILE_ORIGINAL_FETCH__ = globalThis.fetch.bind(globalThis);
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? "GET";
      const shouldLog = url.includes("/setup/") || url.includes("/auth/") || url.includes("/chat/");

      if (shouldLog) {
        console.log("[mobile][fetch] start", {
          url,
          method,
        });
      }

      try {
        const response = await g.__MOBILE_ORIGINAL_FETCH__!(input, init);
        if (shouldLog) {
          console.log("[mobile][fetch] end", {
            url,
            method,
            status: response.status,
            ok: response.ok,
          });
        }
        return response;
      } catch (error) {
        if (shouldLog) {
          console.log("[mobile][fetch] error", {
            url,
            method,
            error: String(error),
          });
        }
        throw error;
      }
    };
    g.__MOBILE_FETCH_LOGGER_INSTALLED__ = true;
  }, []);

  useEffect(() => {
    async function loadSession() {
      try {
        setSession(await loadPairingSession());
      } finally {
        setIsSessionLoading(false);
      }
    }
    void loadSession();
  }, []);

  async function resetLocalSession() {
    await clearPairingSession();
    setSession(null);
    setActiveConversationId(undefined);
    setRoute("pairing");
  }

  if (isSessionLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (session && route === "connected") {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <HommeScreen
            session={session}
            onDisconnect={resetLocalSession}
            onSessionUpdate={setSession}
            onOpenConversation={(conversationId) => {
              setActiveConversationId(conversationId);
              setRoute("chat-detail");
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  if (session && route === "chat-detail" && activeConversationId) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ChatDetailScreen
            session={session}
            conversationId={activeConversationId}
            onSessionUpdate={setSession}
            onBack={() => setRoute("connected")}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PairingScreen
          onPaired={(nextSession) => {
            setSession(nextSession);
            setActiveConversationId(nextSession.conversationId);
            setRoute("connected");
          }}
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

