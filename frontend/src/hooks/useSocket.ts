// src/hooks/useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/services/api/client';
import type { Message } from '@/types/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Singleton socket instance — one connection for the whole app
let socketInstance: Socket | null = null;

const getSocket = (): Socket => {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token: getToken() },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  socketInstance?.disconnect();
  socketInstance = null;
};

// ── Events the frontend listens for ─────────────────────────────────────
export interface SocketEvents {
  onNewMessage?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onMessageRead?: (messageId: number) => void;
  onConversationsUpdated?: () => void;
  onError?: (error: string) => void;
}

export const useSocket = (events: SocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events; // keep latest handlers without re-subscribing

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleNewMessage = (data: { message: Message }) => {
      eventsRef.current.onNewMessage?.(data.message);
    };
    const handleMessageSent = (data: { message: Message }) => {
      eventsRef.current.onMessageSent?.(data.message);
    };
    const handleMessageRead = (data: { messageId: number }) => {
      eventsRef.current.onMessageRead?.(data.messageId);
    };
    const handleConversationsUpdated = () => {
      eventsRef.current.onConversationsUpdated?.();
    };
    const handleError = (data: { error: string }) => {
      eventsRef.current.onError?.(data.error);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_read', handleMessageRead);
    socket.on('conversations_updated', handleConversationsUpdated);
    socket.on('message_error', handleError);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_read', handleMessageRead);
      socket.off('conversations_updated', handleConversationsUpdated);
      socket.off('message_error', handleError);
    };
  }, []); // mount once

  // ── Send via socket (instant) ────────────────────────────────────────
  const sendMessage = useCallback((receiverId: number, content: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      throw new Error('Not connected');
    }
    socket.emit('send_message', { receiverId, content });
  }, []);

  // ── Mark as read via socket ──────────────────────────────────────────
  const markRead = useCallback((messageId: number) => {
    socketRef.current?.emit('mark_read', { messageId });
  }, []);

  const isConnected = () => socketRef.current?.connected ?? false;

  return { sendMessage, markRead, isConnected };
};