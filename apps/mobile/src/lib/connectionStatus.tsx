import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ConnectionState = "idle" | "connecting" | "connected" | "disconnected";

export type ConnectionStatus = {
  state: ConnectionState;
  apiReachable: boolean;
  ollamaReachable: boolean;
  lastUpdate: string | null;
};

const defaultStatus: ConnectionStatus = {
  state: "idle",
  apiReachable: false,
  ollamaReachable: false,
  lastUpdate: null,
};

const ConnectionStatusContext = createContext<ConnectionStatus>(defaultStatus);

function buildWebSocketUrl(apiBaseUrl: string): string | null {
  try {
    const url = new URL(apiBaseUrl);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${url.host}/ws/status`;
  } catch {
    return null;
  }
}

type ProviderProps = {
  apiBaseUrl?: string | null;
  children: ReactNode;
};

export function ConnectionStatusProvider({ apiBaseUrl, children }: ProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>(defaultStatus);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!apiBaseUrl) {
      setStatus(defaultStatus);
      return;
    }
    const wsUrl = buildWebSocketUrl(apiBaseUrl);
    if (!wsUrl) {
      setStatus(defaultStatus);
      return;
    }

    let socket: WebSocket | null = null;
    let retryDelayMs = 1000;
    const maxRetryDelayMs = 15000;

    function scheduleReconnect() {
      if (cancelledRef.current) return;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        retryDelayMs = Math.min(retryDelayMs * 2, maxRetryDelayMs);
        connect();
      }, retryDelayMs);
    }

    function connect() {
      if (cancelledRef.current) return;
      setStatus((prev) => ({ ...prev, state: "connecting" }));
      try {
        socket = new WebSocket(wsUrl!);
      } catch (error) {
        console.warn("[mobile][ws] failed to open", error);
        setStatus((prev) => ({ ...prev, state: "disconnected" }));
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        retryDelayMs = 1000;
        setStatus((prev) => ({ ...prev, state: "connected" }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data));
          if (payload?.type === "status") {
            setStatus({
              state: "connected",
              apiReachable: Boolean(payload.apiReachable),
              ollamaReachable: Boolean(payload.ollamaReachable),
              lastUpdate: typeof payload.timestamp === "string" ? payload.timestamp : new Date().toISOString(),
            });
          }
        } catch (error) {
          console.warn("[mobile][ws] invalid payload", error);
        }
      };

      socket.onerror = () => {
        setStatus((prev) => ({ ...prev, state: "disconnected" }));
      };

      socket.onclose = () => {
        setStatus((prev) => ({ ...prev, state: "disconnected", apiReachable: false }));
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      cancelledRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      }
    };
  }, [apiBaseUrl]);

  const value = useMemo(() => status, [status]);

  return <ConnectionStatusContext.Provider value={value}>{children}</ConnectionStatusContext.Provider>;
}

export function useConnectionStatus(): ConnectionStatus {
  return useContext(ConnectionStatusContext);
}
