// src/components/patient/PatientMessages.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import {
  getMyConversations,
  getConversationMessages,
  markMessageRead,
  sendMessage as sendMessageREST,
  uploadMessageImage,
  getMyAppointments,
} from "@/services/api";
import { getToken } from "@/services/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { toast } from "sonner";
import type { Conversation, Message, Appointment } from "@/types/api";
import MessagesUI from "@/components/ui/MessagesUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const FALLBACK_POLL_MS = 10_000;

export default function PatientMessages() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation state: the userId (not nutritionist table id) of who to open chat with
  const initialOpenWithRef = useRef<number | null>(
    (location.state as { openConversationWith?: number } | null)
      ?.openConversationWith ?? null
  );

  // Dialog state
  const [showAppointmentRequiredDialog, setShowAppointmentRequiredDialog] = useState(false);
  const [pendingNutritionistId, setPendingNutritionistId] = useState<number | null>(null);

  // Messaging state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<number | null>(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Load patient's appointments – needed for validation
  const appointmentsResult = useAsync(() => getMyAppointments(), []);
  const appointments = appointmentsResult.data || [];

  // Helper: check if the patient has any confirmed/completed appointment with a given nutritionist (by userId)
   const hasAppointmentWithNutritionist = useCallback(
    (nutritionistUserId: number) => {
      const targetId = Number(nutritionistUserId);
      return appointments.some((appt: Appointment) => {
        const nutriUserId = Number((appt.nutritionist as any)?.userId);
        return (
          nutriUserId === targetId &&
          (appt.status === "CONFIRMED" || appt.status === "COMPLETED")
        );
      });
    },
    [appointments]
  );

  // ── Load conversations ────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await getMyConversations();
      setConversations(data);
      // If nothing active yet, select first conversation if exists
      setActiveId((prev) => {
        if (prev != null) return prev;
        return data.length ? Number(data[0].id) : null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // ── Load messages for active conversation ────────────────────────────────
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

  // ── Socket.IO setup ──────────────────────────────────────────────────────
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

  // ── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId == null) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // ── Mark messages as read ────────────────────────────────────────────────
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

  // ── Handle navigation from initialOpenWithRef (e.g., clicking "Message" from past appointment) ──
  useEffect(() => {
  const targetId = initialOpenWithRef.current;
  // Don't run until appointments have finished loading, and only once
  if (!targetId || appointmentsResult.loading) return;

  // Consume the ref so this never fires again
  initialOpenWithRef.current = null;
  navigate(location.pathname, { replace: true, state: {} });

  const hasAppt = hasAppointmentWithNutritionist(targetId);
  if (!hasAppt) {
    setShowAppointmentRequiredDialog(true);
    setPendingNutritionistId(targetId);
    return;
  }

  setActiveId(targetId);
}, [appointmentsResult.loading, hasAppointmentWithNutritionist, location.pathname, navigate]);

  // ── Send text ────────────────────────────────────────────────────────────
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

  // ── Send image ───────────────────────────────────────────────────────────
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

  // ── Send file ────────────────────────────────────────────────────────────
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


   const conversationsWithPending = useMemo(() => {
  if (activeId == null) return conversations;
  if (conversations.some((c) => Number(c.id) === Number(activeId))) return conversations;
  // We don't have the name yet — show a placeholder
  return [
    {
      id: activeId,
      participant: { id: activeId, fullName: "New conversation", role: "NUTRITIONIST" as const },
      unreadCount: 0,
    },
    ...conversations,
  ];
}, [conversations, activeId]);

  return (
    <>
      <MessagesUI
        conversations={conversationsWithPending}
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

      <Dialog
        open={showAppointmentRequiredDialog}
        onOpenChange={setShowAppointmentRequiredDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📅 Appointment Required</DialogTitle>
            <DialogDescription>
              You can only message a nutritionist after you have had at least one confirmed or
              completed appointment with them. Book a consultation to start the conversation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentRequiredDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAppointmentRequiredDialog(false);
                navigate("/patient/consultations");
              }}
            >
              Book an appointment →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}