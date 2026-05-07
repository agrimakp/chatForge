import { useMemo, useRef, useState, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  Plus,
  Send,
  MessageSquare,
  User,
  Sparkles,
  Mic,
  Square,
  Loader2,
  Volume2,
  StopCircle,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

const STORAGE_KEY = "chatforge:conversations:v1";
const ACTIVE_KEY = "chatforge:active-id:v1";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Conversation =>
        !!c &&
        typeof (c as Conversation).id === "string" &&
        typeof (c as Conversation).title === "string" &&
        Array.isArray((c as Conversation).messages),
    );
  } catch {
    return [];
  }
}

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function stripMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-neutral-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-4 text-2xl font-semibold tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-xl font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-lg font-semibold tracking-tight">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-6 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-6 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-neutral-200 pl-4 italic text-neutral-700 last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-neutral-200" />,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-800"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`font-mono text-[0.9em] ${className ?? ""}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-[13px] leading-relaxed text-neutral-100 last:mb-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-neutral-200 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-neutral-200 px-3 py-2 align-top">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = loadConversations();
    if (saved.length > 0) return saved;
    return [{ id: crypto.randomUUID(), title: "New chat", messages: [] }];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const savedActive = loadActiveId();
    if (savedActive && conversations.some((c) => c.id === savedActive)) {
      return savedActive;
    }
    return conversations[0]?.id ?? "";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // ignore quota / private mode errors
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (activeId) {
        window.localStorage.setItem(ACTIVE_KEY, activeId);
      }
    } catch {
      // ignore quota / private mode errors
    }
  }, [activeId]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );
  const messages = activeConversation?.messages ?? [];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
      }
      mediaRecorderRef.current?.stream
        .getTracks()
        .forEach((track) => track.stop());
      audioRef.current?.pause();
      audioRef.current = null;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      audioCacheRef.current.clear();
    };
  }, []);

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    setConversations((prev) => [
      { id: newId, title: "New chat", messages: [] },
      ...prev,
    ]);
    setActiveId(newId);
    setError("");
    setPrompt("");
  };

  const handleDeleteChat = (id: string) => {
    const target = conversations.find((c) => c.id === id);

    target?.messages.forEach((m) => {
      const url = audioCacheRef.current.get(m.id);
      if (url) {
        URL.revokeObjectURL(url);
        audioCacheRef.current.delete(m.id);
      }
    });

    if (
      playingMessageId &&
      target?.messages.some((m) => m.id === playingMessageId)
    ) {
      stopPlayback();
    }

    const filtered = conversations.filter((c) => c.id !== id);
    if (filtered.length === 0) {
      const fresh = {
        id: crypto.randomUUID(),
        title: "New chat",
        messages: [],
      };
      setConversations([fresh]);
      setActiveId(fresh.id);
    } else {
      setConversations(filtered);
      if (activeId === id) {
        setActiveId(filtered[0].id);
      }
    }
  };

  const sendChatMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !activeId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length === 0 ? trimmed.slice(0, 40) : c.title,
              messages: [...c.messages, userMessage],
            }
          : c,
      ),
    );
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          conversationId: activeId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { message?: string };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    text: data.message ?? "No response received.",
                  },
                ],
              }
            : c,
        ),
      );
    } catch (requestError) {
      setError("Unable to send message. Make sure the server is running.");
      console.error(requestError);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSending || isRecording || isTranscribing) return;
    setPrompt("");
    await sendChatMessage(trimmedPrompt);
  };

  const transcribeAndSend = async (blob: Blob) => {
    setIsTranscribing(true);
    setError("");
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      if (!response.ok) {
        throw new Error(`Transcription failed with status ${response.status}`);
      }
      const data = (await response.json()) as { text?: string };
      const transcript = (data.text ?? "").trim();
      if (!transcript) {
        setError("Couldn't hear anything. Try again.");
        return;
      }
      await sendChatMessage(transcript);
    } catch (err) {
      console.error(err);
      setError("Couldn't transcribe audio. Try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isSending || isTranscribing) return;
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type });
        audioChunksRef.current = [];
        if (blob.size > 0) {
          void transcribeAndSend(blob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setError("");
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(
        "Microphone access was denied. Allow it in your browser settings to record.",
      );
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    synthUtteranceRef.current = null;
    setPlayingMessageId(null);
  };

  const playWithWebSpeech = (messageId: string, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setError("Speech playback isn't supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      synthUtteranceRef.current = null;
      setPlayingMessageId((current) =>
        current === messageId ? null : current,
      );
    };
    utterance.onerror = () => {
      synthUtteranceRef.current = null;
      setPlayingMessageId((current) =>
        current === messageId ? null : current,
      );
    };
    synthUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlayingMessageId(messageId);
  };

  const playFromUrl = (messageId: string, url: string, fallbackText: string) =>
    new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingMessageId((current) =>
          current === messageId ? null : current,
        );
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        audioRef.current = null;
        playWithWebSpeech(messageId, fallbackText);
        resolve();
      };
      audio.play().catch(() => {
        audioRef.current = null;
        playWithWebSpeech(messageId, fallbackText);
        resolve();
      });
    });

  const togglePlayMessage = async (messageId: string, rawText: string) => {
    if (playingMessageId === messageId) {
      stopPlayback();
      return;
    }
    stopPlayback();

    const speechText = stripMarkdownForSpeech(rawText);
    if (!speechText) return;

    const cachedUrl = audioCacheRef.current.get(messageId);
    if (cachedUrl) {
      setPlayingMessageId(messageId);
      await playFromUrl(messageId, cachedUrl, speechText);
      return;
    }

    setLoadingMessageId(messageId);
    setError("");
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speechText }),
      });
      if (!response.ok) {
        throw new Error(`Speech request failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioCacheRef.current.set(messageId, url);
      setLoadingMessageId(null);
      setPlayingMessageId(messageId);
      await playFromUrl(messageId, url, speechText);
    } catch (err) {
      console.error(err);
      setLoadingMessageId(null);
      playWithWebSpeech(messageId, speechText);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      form?.requestSubmit();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-neutral-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-neutral-950 text-neutral-100 md:flex">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-lg border border-neutral-700/70 bg-transparent px-3 py-2 text-sm font-medium transition hover:bg-neutral-800"
          >
            <Plus className="size-4" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <p className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Chats
          </p>
          <ul className="space-y-1">
            {conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-center gap-2 rounded-lg py-2 pl-3 pr-9 text-left text-sm transition ${
                      isActive
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300 hover:bg-neutral-800/60"
                    }`}
                  >
                    <MessageSquare className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">{c.title || "New chat"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteChat(c.id);
                    }}
                    aria-label={`Delete chat ${c.title || "New chat"}`}
                    title="Delete chat"
                    className={`absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-700 hover:text-red-300 focus:opacity-100 ${
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-neutral-800 p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-300">
            <div className="flex size-7 items-center justify-center rounded-full bg-neutral-700 text-xs font-medium text-white">
              U
            </div>
            <span className="truncate">You</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-neutral-700" />
            <h1 className="text-base font-semibold">ChatForge</h1>
          </div>
          <button
            onClick={handleNewChat}
            className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 md:hidden"
            aria-label="New chat"
          >
            <Plus className="size-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100">
                <Sparkles className="size-6 text-neutral-700" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                How can I help you today?
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Ask anything and I'll do my best to help.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
              {messages.map((message) => (
                <div key={message.id} className="mb-6 flex gap-3">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === "user"
                        ? "bg-neutral-800 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-xs font-medium text-neutral-500">
                        {message.role === "user" ? "You" : "ChatForge"}
                      </p>
                      {message.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() =>
                            togglePlayMessage(message.id, message.text)
                          }
                          disabled={loadingMessageId === message.id}
                          className="flex size-6 items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={
                            playingMessageId === message.id
                              ? "Stop playback"
                              : "Play message"
                          }
                          title={
                            playingMessageId === message.id
                              ? "Stop playback"
                              : "Play message"
                          }
                        >
                          {loadingMessageId === message.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : playingMessageId === message.id ? (
                            <StopCircle className="size-3.5" />
                          ) : (
                            <Volume2 className="size-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    {message.role === "assistant" ? (
                      <Markdown content={message.text} />
                    ) : (
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-900">
                        {message.text}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="mb-6 flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="mb-1 text-xs font-medium text-neutral-500">
                      ChatForge
                    </p>
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="size-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-neutral-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        <div className="shrink-0 border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4 md:px-6">
            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm transition focus-within:border-neutral-400 focus-within:shadow-md"
            >
              {isRecording ? (
                <div className="flex flex-1 items-center gap-2 px-3 py-2 text-[15px] text-neutral-700">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                  </span>
                  <span>Recording…</span>
                  <span className="ml-auto font-mono text-sm tabular-nums text-neutral-500">
                    {formatRecordingTime(recordingSeconds)}
                  </span>
                </div>
              ) : isTranscribing ? (
                <div className="flex flex-1 items-center gap-2 px-3 py-2 text-[15px] text-neutral-600">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Transcribing…</span>
                </div>
              ) : (
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ChatForge..."
                  rows={1}
                  className="max-h-48 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  disabled={isSending}
                />
              )}

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isSending || isTranscribing}
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                title={isRecording ? "Stop recording" : "Record voice message"}
              >
                {isRecording ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <Mic className="size-4" />
                )}
              </button>

              <button
                type="submit"
                disabled={
                  isSending || isRecording || isTranscribing || !prompt.trim()
                }
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-neutral-400">
              ChatForge can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
