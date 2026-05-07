import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "../lib/config";
import type { PairingSession } from "../types/app";

type BackendStatus = {
  apiReachable: boolean;
  ollamaReachable: boolean;
  connected: boolean;
  lastUpdatedAt?: string;
};

const defaultStatus: BackendStatus = {
  apiReachable: false,
  ollamaReachable: false,
  connected: false,
};

const AppStatusContext = createContext<BackendStatus>(defaultStatus);

function toWebSocketUrl(apiBaseUrl: string) {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/status";
  url.search = "";
  return url.toString();
}

type Props = {
  session: PairingSession | null;
  children: React.ReactNode;
};

export function AppStatusProvider({ session, children }: Props) {
  const [status, setStatus] = useState<BackendStatus>(defaultStatus);
  const apiBaseUrl = session?.apiBaseUrl ?? appConfig.defaultApiBaseUrl;

  useEffect(() => {
    const wsUrl = toWebSocketUrl(apiBaseUrl);
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let closedByCleanup = false;

    function connect() {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        setStatus((prev) => ({ ...prev, connected: true }));
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data));
          if (payload?.type === "status") {
            setStatus({
              apiReachable: Boolean(payload.apiReachable),
              ollamaReachable: Boolean(payload.ollamaReachable),
              connected: true,
              lastUpdatedAt: payload.timestamp,
            });
          }
        } catch {
          // Ignore parse errors from malformed payloads.
        }
      };
      socket.onerror = () => {
        setStatus((prev) => ({ ...prev, connected: false, apiReachable: false }));
      };
      socket.onclose = () => {
        setStatus((prev) => ({ ...prev, connected: false, apiReachable: false }));
        if (!closedByCleanup) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };
    }

    connect();

    return () => {
      closedByCleanup = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [apiBaseUrl]);

  const value = useMemo(() => status, [status]);
  return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
}

export function useAppStatus() {
  return useContext(AppStatusContext);
}
