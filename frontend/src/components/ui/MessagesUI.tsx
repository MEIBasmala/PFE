// src/components/ui/MessagesUI.tsx
import { useRef, useState, useEffect } from "react";
import {
  Send,
  ImagePlus,
  Paperclip,
  X,
  Loader2,
  Check,
  CheckCheck,
  Search,
  User,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, Message } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessagesUIProps {
  conversations: Conversation[];
  messages: Message[];
  currentUserId?: number;
  activeId: number | null;
  loadingConversations: boolean;
  loadingMessages: boolean;
  onSelectConversation: (id: number) => void;
  onSend: (text: string) => void | Promise<void>;
  /** Called with an image file (jpeg/png/webp/gif). Validation happens in parent. */
  onSendImage?: (file: File) => void | Promise<void>;
  /** Called with any non-image file. Validation happens in parent. */
  onSendFile?: (file: File) => void | Promise<void>;
  showSearch?: boolean;
  pollIntervalSeconds?: number;
}

type UploadPreview =
  | { kind: "image"; dataUrl: string; file: File }
  | { kind: "file"; name: string; file: File }
  | null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessagesUI({
  conversations,
  messages,
  currentUserId,
  activeId,
  loadingConversations,
  loadingMessages,
  onSelectConversation,
  onSend,
  onSendImage,
  onSendFile,
  showSearch = false,
}: MessagesUIProps) {
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<UploadPreview>(null);
  const [uploading, setUploading] = useState(false);
  // Mobile: track if we're viewing chat (true) or sidebar (false)
  const [mobileChatView, setMobileChatView] = useState(false);
  // Track if we're actually on mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(
    (c) => Number(c.id) === activeId
  );

  const filteredConversations = search.trim()
    ? conversations.filter((c) =>
        c.participant.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // On mobile, when active conversation changes, switch to chat view
  useEffect(() => {
    if (activeId != null && isMobile) {
      setMobileChatView(true);
    }
  }, [activeId, isMobile]);

  // ── Submit text ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText("");
    } finally {
      setSending(false);
    }
  };

  // ── Image file picker ────────────────────────────────────────────────────
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSendImage) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview({
        kind: "image",
        dataUrl: ev.target?.result as string,
        file,
      });
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await onSendImage(file);
    } finally {
      setUploading(false);
      setUploadPreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // ── Non-image file picker ─────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSendFile) return;

    setUploadPreview({ kind: "file", name: file.name, file });

    setUploading(true);
    try {
      await onSendFile(file);
    } finally {
      setUploading(false);
      setUploadPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelPreview = () => {
    setUploadPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isDisabled = sending || uploading;

  // Mobile: go back to conversation list
  const handleBackToList = () => {
    setMobileChatView(false);
  };

  // Mobile: select conversation and switch to chat view
  const handleSelectConversation = (id: number) => {
    onSelectConversation(id);
    if (isMobile) {
      setMobileChatView(true);
    }
  };

  // Unified mobile view logic (same pattern as NutritionistPatients)
  const showList = !activeId || (isMobile && !mobileChatView);
  const showChat = activeId && (!isMobile || mobileChatView);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="messages-layout flex h-[calc(100vh-8rem)] gap-4">
      {/* ── Conversations sidebar ── */}
      <Card
        className={cn(
          "messages-sidebar flex w-80 flex-col",
          !showList && "mobile-hidden"
        )}
      >
        <div className="sidebar-header border-b p-4">
          {showSearch && (
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          {loadingConversations ? (
            <ConversationSkeletons />
          ) : filteredConversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === Number(conv.id)}
                  onSelect={() => handleSelectConversation(Number(conv.id))}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* ── Chat area ── */}
      <Card
        className={cn(
          "messages-chat flex flex-1 flex-col overflow-hidden",
          !showChat && "mobile-hidden"
        )}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="chat-header flex items-center gap-3 border-b p-4">
              {/* Mobile back button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="shrink-0"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              <Avatar className="chat-avatar h-8 w-8">
                <AvatarFallback>
                  {activeConversation.participant.fullName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="chat-name truncate font-medium">
                  {activeConversation.participant.fullName}
                </div>
                <div className="chat-role text-xs capitalize text-muted-foreground">
                  {activeConversation.participant.role.toLowerCase()}
                </div>
              </div>
            </div>

            {/* Messages list */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <MessageSkeletons />
              ) : messages.length === 0 ? (
                <div className="chat-empty flex h-full items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <User className="empty-icon mx-auto mb-3 h-12 w-12 opacity-50" />
                    <p>No messages yet — start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={msg.senderId === currentUserId}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input area */}
            <div className="chat-input-area border-t p-4">
              {/* Upload preview */}
              {uploadPreview && (
                <div className="upload-preview mb-3 flex items-center gap-2">
                  {uploadPreview.kind === "image" ? (
                    <div className="relative inline-block">
                      <img
                        src={uploadPreview.dataUrl}
                        alt="Preview"
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="file-chip flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="max-w-[160px] truncate">
                        {uploadPreview.name}
                      </span>
                      {uploading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  )}
                  {!uploading && (
                    <button
                      onClick={cancelPreview}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="input-row flex items-end gap-2"
              >
                {/* Hidden image input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Hidden file input (non-image attachments) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Image button */}
                {onSendImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="attach-btn shrink-0"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isDisabled}
                    title="Send image"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                )}

                {/* File attachment button */}
                {onSendFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="attach-btn shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDisabled}
                    title="Attach file"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                )}

                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1"
                  disabled={isDisabled}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={(!text.trim() && !uploadPreview) || isDisabled}
                  className="send-btn shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="chat-empty flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <User className="empty-icon mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onSelect,
}: {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "conversation-item flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
        isActive && "bg-muted"
      )}
    >
      <Avatar className="conv-avatar h-10 w-10 shrink-0">
        <AvatarFallback>
          {conv.participant.fullName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="conv-name truncate font-medium">
            {conv.participant.fullName}
          </span>
          {conv.unreadCount > 0 && (
            <span className="unread-badge ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {conv.unreadCount}
            </span>
          )}
        </div>
        {conv.lastMessage && (
          <div className="conv-preview flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{conv.lastMessage.content}</span>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(conv.lastMessage.sentAt), {
                addSuffix: false,
              })}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const isFileAttachment =
    msg.imageUrl && !msg.imageUrl.match(/\.(jpe?g|png|webp|gif)(\?.*)?$/i);

  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "message-bubble max-w-[70%] rounded-2xl px-4 py-2",
          isMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm"
        )}
      >
        {/* Image attachment */}
        {msg.imageUrl && !isFileAttachment && (
          <div className="mb-2">
            <img
              src={msg.imageUrl}
              alt="Shared image"
              className="bubble-image max-h-64 max-w-full cursor-pointer rounded-lg object-cover"
              onClick={() => window.open(msg.imageUrl, "_blank")}
            />
          </div>
        )}

        {/* File attachment */}
        {msg.imageUrl && isFileAttachment && (
          <a
            href={msg.imageUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "bubble-file mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-opacity hover:opacity-80",
              isMe ? "border-primary-foreground/30" : "border-border"
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {msg.content.startsWith("📎 ")
                ? msg.content.slice(3)
                : "Download file"}
            </span>
          </a>
        )}

        {/* Text content */}
        {!(
          msg.imageUrl &&
          (msg.content === "📷 Image" || msg.content.startsWith("📎 "))
        ) && (
          <p className="bubble-text whitespace-pre-wrap break-words text-sm">
            {msg.content}
          </p>
        )}

        {/* Timestamp + read receipt */}
        <div
          className={cn(
            "bubble-time mt-1 flex items-center justify-end gap-1 text-xs",
            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span>
            {new Date(msg.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isMe &&
            (msg.isRead ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </div>
  );
}

function ConversationSkeletons() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSkeletons() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}
        >
          <div className="h-16 w-48 animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}

// Lightweight Card wrapper (keeps this file self-contained)
function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className
      )}
    >
      {children}
    </div>
  );
}