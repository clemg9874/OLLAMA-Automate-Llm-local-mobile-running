import { appConfig } from "./config";
import type { PairingSession } from "../types/app";

type RequestParams = {
  baseUrl?: string;
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  bearerToken?: string;
};

type RequestResult<T = Record<string, unknown>> = {
  ok: boolean;
  status: number;
  data: T;
};

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const rawText = await response.text();
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return { parseError: true, rawText };
  }
}

export async function apiRequest<T = Record<string, unknown>>({
  baseUrl = appConfig.defaultApiBaseUrl,
  path,
  method = "GET",
  body,
  bearerToken,
}: RequestParams): Promise<RequestResult<T>> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (bearerToken) {
    headers.authorization = `Bearer ${bearerToken}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = (await parseResponse(response)) as T;
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

type AuthedApiClientOptions = {
  getSession: () => PairingSession | null;
  onSessionUpdate: (session: PairingSession) => Promise<void> | void;
};

export function createAuthedApiClient({ getSession, onSessionUpdate }: AuthedApiClientOptions) {
  async function refreshSession(currentSession: PairingSession): Promise<PairingSession | null> {
    const refresh = await apiRequest({
      baseUrl: currentSession.apiBaseUrl,
      path: "/auth/refresh",
      method: "POST",
      body: { refreshToken: currentSession.refreshToken },
    });

    if (!(refresh.ok && refresh.data.accessToken && refresh.data.refreshToken)) {
      return null;
    }

    const nextSession: PairingSession = {
      ...currentSession,
      accessToken: String(refresh.data.accessToken),
      refreshToken: String(refresh.data.refreshToken),
    };
    await onSessionUpdate(nextSession);
    return nextSession;
  }

  return {
    async request<T = Record<string, unknown>>(path: string, method: RequestParams["method"], body?: unknown): Promise<RequestResult<T>> {
      const session = getSession();
      if (!session) {
        return { ok: false, status: 401, data: { error: "SESSION_MISSING" } as T };
      }

      let result = await apiRequest<T>({
        baseUrl: session.apiBaseUrl,
        path,
        method,
        body,
        bearerToken: session.accessToken,
      });

      if (result.status === 401) {
        const nextSession = await refreshSession(session);
        if (nextSession) {
          result = await apiRequest<T>({
            baseUrl: nextSession.apiBaseUrl,
            path,
            method,
            body,
            bearerToken: nextSession.accessToken,
          });
        }
      }

      return result;
    },
  };
}
