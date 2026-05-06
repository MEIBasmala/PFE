// src/components/patient/PatientChatbot.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Send, StopCircle, Trash2, X, Zap } from 'lucide-react';
import { chatbotApi, type ChatMessage } from '@/services/api/chatbot.api';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui";
import { useNavigate } from 'react-router-dom';
interface UIMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  streaming?: boolean;
  provider?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const SUGGESTED = [
  'What should I eat for breakfast?',
  'How many calories do I need?',
  'Foods high in protein?',
  'How to lose weight healthily?',
];

export default function PatientChatbot() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const { packageInfo } = useSubscription();
  const chatbotEnabled = packageInfo?.chatbot ?? false;

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: `Hi ${firstName} 👋 I'm NutriBot, your nutrition assistant. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mount safety for SSR
  useEffect(() => setMounted(true), []);

  // Auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, open]);

  // Reset unread when opening
  useEffect(() => {
    if (open) {
      setUnread(0);
      setHasNewMsg(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, []);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const buildHistory = useCallback((): ChatMessage[] => {
    return messages
      .filter(m => m.id !== 'welcome' && !m.streaming)
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: UIMessage = { id: uid(), role: 'USER', content: text };
    const assistantId = uid();
    const assistantMsg: UIMessage = { id: assistantId, role: 'ASSISTANT', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);
    setIsTyping(true);

    const history = buildHistory();

    abortRef.current = chatbotApi.sendMessage(text, history, {
      onTyping: () => setIsTyping(true),
      onToken: (token, prov) => {
        setIsTyping(false);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + token, provider: prov } : m
          )
        );
      },
      onDone: (fullResponse, prov) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: fullResponse, streaming: false, provider: prov } : m
          )
        );
        setIsStreaming(false);
        setIsTyping(false);
        if (!open) {
          setUnread(n => n + 1);
          setHasNewMsg(true);
        }
        inputRef.current?.focus();
      },
      onError: errMsg => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: `⚠️ ${errMsg}`, streaming: false } : m
          )
        );
        setIsStreaming(false);
        setIsTyping(false);
      },
    });
  }, [input, isStreaming, buildHistory, open]);

  const stop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setIsTyping(false);
    setMessages(prev =>
      prev.map((m, i) => (i === prev.length - 1 && m.streaming ? { ...m, streaming: false } : m))
    );
  };

  const clear = () => {
    if (isStreaming) stop();
    setMessages([
      {
        id: 'welcome',
        role: 'ASSISTANT',
        content: `Hi ${firstName} 👋 I'm NutriBot. Ask me anything about nutrition!`,
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Chat Panel – only when open */}
      {open && (
        <>
          {/* Backdrop (mobile only) */}
          <div
            className="fixed inset-0 z-[998] md:hidden"
            style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed z-[999] flex flex-col overflow-hidden
    left-4 right-4 bottom-24 rounded-lg
    md:bottom-[88px] md:right-6 md:left-auto md:w-[380px] md:rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              maxHeight: 'min(600px, 70vh)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.3)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0 rounded-t-lg"
              style={{ background: 'linear-gradient(135deg, hsl(var(--green)), hsl(var(--orange)))' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-syne font-bold text-sm text-white leading-none">NutriBot</div>
                  <div
                    className="flex items-center gap-1.5 mt-0.5"
                    style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-md ${isStreaming ? 'bg-yellow-300 animate-pulse' : 'bg-green-300'
                        }`}
                    />
                    {isStreaming ? 'Thinking…' : 'Online · Nutrition AI'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clear}
                  className="p-2 rounded-lg transition-colors hover:bg-white/15"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  title="Clear chat"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg transition-colors hover:bg-white/15"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3 space-y-3 md:px-4"
              style={{ background: 'hsl(var(--cream-bg))' }}
            >
              {messages.map(m => (
                <Bubble key={m.id} message={m} />
              ))}

              {isTyping && (
                <div className="flex items-end gap-2">
                  <BotAvatar />
                  <div
                    className="px-4 py-3 rounded-2xl rounded-bl-sm border border-[hsl(var(--gray-line))]"
                    style={{ background: 'hsl(var(--pure-white))' }}
                  >
                    <div className="flex gap-1 items-center h-4">
                      {[0, 150, 300].map(d => (
                        <span
                          key={d}
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'hsl(var(--orange))', animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && !isStreaming && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {SUGGESTED.map(s => (
                    <button
                      key={s}
                      className="text-left border rounded-xl px-3 py-2.5 transition-colors text-sm hover:border-orange-500 hover:bg-orange-50"
                      style={{
                        borderColor: 'hsl(var(--gray-line))',
                        background: 'hsl(var(--pure-white))',
                        color: 'hsl(var(--text-m))',
                      }}
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                    >
                      <Zap size={12} className="inline mr-1 text-orange-500" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div
              className="flex-shrink-0 px-3 pb-4 pt-3 border-t"
              style={{ borderColor: 'hsl(var(--gray-line))', background: 'hsl(var(--pure-white))' }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming || !chatbotEnabled}
                  placeholder={chatbotEnabled ? "Ask about nutrition…" : "Upgrade to unlock chatbot"}
                  className="flex-1 resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all"
                  style={{
                    borderColor: 'hsl(var(--gray-line))',
                    background: 'hsl(var(--cream-bg))',
                    minHeight: 42,
                    maxHeight: 120,
                    lineHeight: '1.5',
                    fontSize: '16px',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'hsl(var(--orange))';
                    e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--orange-20))';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'hsl(var(--gray-line))';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {isStreaming ? (
                  <button
                    onClick={stop}
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <StopCircle size={18} />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!chatbotEnabled || !input.trim()}
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-60"
                    style={{
                      background: (chatbotEnabled && input.trim()) ? 'hsl(var(--orange))' : 'hsl(var(--gray-20))',
                      borderRadius: 12,
                    }}
                  >
                    <Send size={16} className={(chatbotEnabled && input.trim()) ? 'text-white' : 'text-muted-foreground'} />
                  </button>
                )}
              </div>

              {!chatbotEnabled && (
                <Alert variant="info" className="mt-3 bg-[hsl(var(--saffron-light))] border-[hsl(var(--saffron))] text-[#8a6200]">
                  <AlertTitle className="!mb-0 font-syne font-bold text-sm">
                    ⚡ Chatbot not available
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Your current plan does not include the AI assistant.
                    <button
                      onClick={() => navigate("/patient/subscription")}
                      className="ml-2 inline-flex items-center rounded-md bg-[hsl(var(--saffron))] px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[hsl(var(--orange))]"
                    >
                      Upgrade now →

                    </button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating Action Button – ONLY when chat is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--green)), hsl(var(--orange)))',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Bot size={22} className="text-white" />

          {/* Unread badge – only appears when closed */}
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center border-2 border-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}

          {/* Ping ring animation for new messages */}
          {hasNewMsg && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-25"
              style={{ background: 'hsl(var(--orange))' }}
            />
          )}
        </button>
      )}
    </>,
    document.body
  );
}

// --- Helper components ---
function BotAvatar() {
  return (
    <div
      className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, hsl(var(--green)), hsl(var(--orange)))' }}
    >
      <Bot size={13} className="text-white" />
    </div>
  );
}

function Bubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'USER';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && <BotAvatar />}
      <div
        className="max-w-[85%] md:max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
        style={
          isUser
            ? {
              background: 'hsl(var(--orange))',
              color: '#fff',
              borderBottomRightRadius: 4,
            }
            : {
              background: 'hsl(var(--pure-white))',
              border: '1px solid hsl(var(--gray-line))',
              color: 'hsl(var(--text-dark))',
              borderBottomLeftRadius: 4,
            }
        }
      >
        {message.content}
        {message.streaming && (
          <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}