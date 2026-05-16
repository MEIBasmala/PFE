// src/services/api/chatbot.api.ts
import { getToken , apiFetch} from './client';
import type { ChatMessage, ChatStreamCallbacks } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';



/**
 * Sends a message to the chatbot and streams the response via SSE.
 * Returns an AbortController so the caller can cancel mid-stream.
 *
 * Usage:
 *   const abort = chatbotApi.sendMessage(message, history, {
 *     onToken: (text) => appendToUI(text),
 *     onDone:  (full) => saveMessage(full),
 *     onTyping: () => showTypingIndicator(),
 *     onError: (err) => showError(err),
 *   });
 *   // To cancel: abort.abort()
 */

export const getChatbotStats = () =>
  apiFetch<{ success: boolean; stats: any }>('/chatbot/stats');

export const chatbotApi = {
  sendMessage: (
    message: string,
    history: ChatMessage[],
    callbacks: ChatStreamCallbacks,
  ): AbortController => {
    const controller = new AbortController();
    const token = getToken();

    // We use fetch directly (not apiFetch) because SSE requires
    // reading the response as a stream, not as JSON
    fetch(`${BASE_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Request failed' }));
          callbacks.onError(err.message || `HTTP ${res.status}`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) { callbacks.onError('No response stream'); return; }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: typing')) {
              callbacks.onTyping();
              continue;
            }

            if (line.startsWith('event: done')) continue;

            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (!raw) continue;
              try {
                const parsed = JSON.parse(raw);

                if (parsed.error) {
                  callbacks.onError(parsed.error);
                  continue;
                }

                // Regular token chunk
                if (parsed.text) {
                  callbacks.onToken(parsed.text, parsed.provider ?? '');
                }

                // Final done event carries the full response
                if (parsed.fullResponse !== undefined) {
                  callbacks.onDone(
                    parsed.fullResponse,
                    parsed.provider ?? '',
                    parsed.intent ?? 'general',
                    parsed.duration ?? 0,
                  );
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        callbacks.onError(err.message || 'Connection failed');
      });

    return controller;
  },

  // Fetch chat history for the patient (for session restore)
  getHistory: async (): Promise<ChatMessage[]> => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/chatbot/history`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages ?? [];
  },
};
