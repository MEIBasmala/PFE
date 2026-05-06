// src/services/api/messages.api.ts
import { apiFetch, getToken } from "./client";
import type { Conversation, Message, UserRole } from "@/types/api";

// GET /messages/conversations
export const getMyConversations = () =>
  apiFetch<Conversation[]>("/messages/conversations");

// GET /messages/conversations/:otherUserId/messages
export const getConversationMessages = (conversationId: string | number) =>
  apiFetch<Message[]>(`/messages/conversations/${conversationId}/messages`);

// POST /messages/send
export const sendMessage = (data: {
  receiverId: number;
  content: string;
  imageUrl?: string;
}) =>
  apiFetch<{ message: Message }>("/messages/send", {
    method: "POST",
    body: JSON.stringify(data),
  });

// PATCH /messages/:id/read
export const markMessageRead = (messageId: number) =>
  apiFetch<{ success: boolean }>(`/messages/${messageId}/read`, {
    method: "PATCH",
  });

// GET /users/:id  — lightweight public profile lookup
// Used to inject a "pending" conversation entry before the first message is sent.
export const getUserById = (userId: number) =>
  apiFetch<{ success: boolean; user: { id: number; fullName: string; role: UserRole } }>(
    `/users/${userId}`
  );

// POST /messages/upload  (multipart/form-data — field name must be "image")
export const uploadMessageImage = async (
  file: File
): Promise<{ imageUrl: string }> => {
  const BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/messages/upload`, {
    method: "POST",
    headers: {
      // Do NOT set Content-Type here — browser sets it with the multipart boundary
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<{ imageUrl: string }>;
};