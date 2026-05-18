// src/services/api/chatbot.api.ts
import { getToken, apiFetch } from './client';
import type { ChatMessage, ChatStreamCallbacks } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SSE_TIMEOUT_MS = 30_000; // 30 seconds

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

    // Start timeout — aborts if backend hangs (Gemini timeout, Ollama unavailable)
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
        callbacks.onError('Request timed out. The AI service is taking too long to respond.');
      }
    }, SSE_TIMEOUT_MS);

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
        // Clear timeout on response received
        clearTimeout(timeoutId);

        if (controller.signal.aborted) return;

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Request failed' }));
          callbacks.onError(err.message || `HTTP ${res.status}`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          callbacks.onError('No response stream');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (controller.signal.aborted) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
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

                  if (parsed.text) {
                    callbacks.onToken(parsed.text, parsed.provider ?? '');
                  }

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
        } finally {
          reader.releaseLock();
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') return;
        callbacks.onError(err.message || 'Connection failed');
      })
      .finally(() => {
        // Ensure timeout is always cleared
        clearTimeout(timeoutId);
      });

    return controller;
  },

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