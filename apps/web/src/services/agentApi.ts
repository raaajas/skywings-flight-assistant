import type { AgentChatResponse, Booking, ChatSession } from "@/types";
import { getApiBaseUrl } from "./firebase";
import { getIdToken } from "./auth";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function createChatSession(title?: string): Promise<string> {
  const data = await apiFetch<{ sessionId: string }>("/agent/sessions", {
    method: "POST",
    body: JSON.stringify({ action: "create", title }),
  });
  return data.sessionId;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const data = await apiFetch<{ sessions: ChatSession[] }>("/agent/sessions", {
    method: "POST",
    body: JSON.stringify({ action: "list" }),
  });
  return data.sessions;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
): Promise<AgentChatResponse> {
  return apiFetch<AgentChatResponse>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ sessionId, message }),
  });
}

export async function fetchBookings(): Promise<Booking[]> {
  const data = await apiFetch<{ bookings: Booking[] }>("/bookings");
  return data.bookings;
}
