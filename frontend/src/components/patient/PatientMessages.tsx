// src/components/patient/PatientMessages.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  getMyConversations,
  getConversationMessages,
  markMessageRead,
  sendMessage as sendMessageREST,
  uploadMessageImage,
  getUserById,
} from "@/services/api";
import { getToken } from "@/services/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Conversation, Message } from "@/types/api";
import MessagesUI from "@/components/ui/MessagesUI";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const FALLBACK_POLL_MS = 10_000;

export default function PatientMessages() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Read navigation state ONCE on mount into a stable ref.
  // This is the User.id (not nutritionist table id) of who to open a chat with.
  const initialOpenWithRef = useRef<number | null>(
    (location.state as { openConversationWith?: number } | null)
      ?.openConversationWith ?? null
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  // Pre-seed activeId from nav state so the chat panel opens immediately
  const [activeId, setActiveId] = useState<number | null>(
    initialOpenWithRef.current
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<number | null>(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Clear nav state so a browser refresh doesn't re-open the same conversation
  useEffect(() => {
    if (initialOpenWithRef.current) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load conversations ────────────────────────────────────────────────────
  // KEY FIX: after fetching real conversations, if we were navigated here with
  // a specific userId AND that person has no prior messages (so they won't
  // appear in the list), we fetch their basic info and inject a synthetic
  // "pending" conversation entry so they show up in the sidebar.
  const loadConversations = useCallback(async () => {
    try {
      const data = await getMyConversations();

      const targetId = initialOpenWithRef.current;

      if (targetId != null) {
        const alreadyInList = data.some((c) => Number(c.id) === targetId);

        if (!alreadyInList) {
          // Fetch the user's basic info to build a synthetic conversation entry
          try {
            const { user: targetUser } = await getUserById(targetId);
            const pending: Conversation = {
              id: targetId,
              participant: {
                id: targetUser.id,
                fullName: targetUser.fullName,
                role: targetUser.role,
              },
              unreadCount: 0,
              // No lastMessage yet — that's fine, the UI handles undefined
            };
            // Put the pending conversation at the top
            setConversations([pending, ...data]);
          } catch {
            // If the lookup fails just show what we have
            setConversations(data);
          }
        } else {
          setConversations(data);
        }

        // Always honour the explicitly requested conversation
        setActiveId(targetId);
      } else {
        setConversations(data);
        // Auto-select first only if nothing is active
        setActiveId((prev) => {
          if (prev != null) return prev;
          return data.length ? Number(data[0].id) : null;
        });
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load conversations"
      );
    } finally {
      setLoadingConversations(false);
    }
  }, []); // stable — no deps that change

  // ── Load messages for the active conversation ─────────────────────────────
  const loadMessages = useCallback(async (otherId: number) => {
    setLoadingMessages(true);
    try {
      const data = await getConversationMessages(otherId);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Socket.IO — one connection for the lifetime of the component ──────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1_000,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("new_message", ({ message }: { message: Message }) => {
      const currentActiveId = activeIdRef.current;
      const otherId =
        message.senderId === user?.id ? message.receiverId : message.senderId;

      if (otherId === currentActiveId || message.senderId === currentActiveId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        socket.emit("mark_read", { messageId: message.id });
      }
      loadConversations();
    });

    socket.on("message_sent", ({ message }: { message: Message }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      loadConversations();
    });

    socket.on("new_notification", () => {
      window.dispatchEvent(new CustomEvent("notifications:refresh"));
    });

    socket.on("message_error", ({ error }: { error: string }) => {
      toast.error(error || "Failed to send message");
    });

    const fallbackInterval = setInterval(() => {
      if (!socket.connected && activeIdRef.current != null) {
        loadMessages(activeIdRef.current);
        loadConversations();
      }
    }, FALLBACK_POLL_MS);

    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (activeId == null) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // ── Mark incoming messages as read ────────────────────────────────────────
  useEffect(() => {
    if (!messages.length || !activeId || !user) return;
    messages
      .filter((m) => !m.isRead && m.receiverId === user.id)
      .forEach((m) => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("mark_read", { messageId: m.id });
        } else {
          markMessageRead(m.id).catch(() => {});
        }
      });
  }, [messages, activeId, user]);

  // ── Send text ─────────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!activeId) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        receiverId: activeId,
        content: text,
      });
    } else {
      try {
        const { message } = await sendMessageREST({
          receiverId: activeId,
          content: text,
        });
        setMessages((prev) => [...prev, message]);
        loadConversations();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send");
        throw e;
      }
    }
  };

  // ── Send image ────────────────────────────────────────────────────────────
  const handleSendImage = async (file: File) => {
    if (!activeId || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max size is 5 MB.");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }
    try {
      const { imageUrl } = await uploadMessageImage(file);
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          receiverId: activeId,
          content: "📷 Image",
          imageUrl,
        });
      } else {
        const { message } = await sendMessageREST({
          receiverId: activeId,
          content: "📷 Image",
          imageUrl,
        });
        setMessages((prev) => [...prev, message]);
        loadConversations();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload image");
    }
  };

  // ── Send file ─────────────────────────────────────────────────────────────
  const handleSendFile = async (file: File) => {
    if (!activeId || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max size is 10 MB.");
      return;
    }
    try {
      const { imageUrl: fileUrl } = await uploadMessageImage(file);
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          receiverId: activeId,
          content: `📎 ${file.name}`,
          imageUrl: fileUrl,
        });
      } else {
        const { message } = await sendMessageREST({
          receiverId: activeId,
          content: `📎 ${file.name}`,
          imageUrl: fileUrl,
        });
        setMessages((prev) => [...prev, message]);
        loadConversations();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload file");
    }
  };

  return (
    <MessagesUI
      conversations={conversations}
      messages={messages}
      currentUserId={user?.id}
      activeId={activeId}
      loadingConversations={loadingConversations}
      loadingMessages={loadingMessages}
      onSelectConversation={(id) => setActiveId(id)}
      onSend={handleSend}
      onSendImage={handleSendImage}
      onSendFile={handleSendFile}
      showSearch
      pollIntervalSeconds={connected ? undefined : 10}
    />
  );
}