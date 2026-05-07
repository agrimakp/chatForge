import { useMemo, useRef, useState, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Plus, Send, MessageSquare, User, Sparkles } from "lucide-react";
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
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [],
    },
  ]);
  const [activeId, setActiveId] = useState<string>(
    () => conversations[0]?.id ?? "",
  );
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );
  const messages = activeConversation?.messages ?? [];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSending || !activeId) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedPrompt,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title:
                c.messages.length === 0 ? trimmedPrompt.slice(0, 40) : c.title,
              messages: [...c.messages, userMessage],
            }
          : c,
      ),
    );
    setPrompt("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
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
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-2 truncate rounded-lg px-3 py-2 text-left text-sm transition ${
                    c.id === activeId
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-300 hover:bg-neutral-800/60"
                  }`}
                >
                  <MessageSquare className="size-4 shrink-0 opacity-70" />
                  <span className="truncate">{c.title || "New chat"}</span>
                </button>
              </li>
            ))}
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
                    <p className="mb-1 text-xs font-medium text-neutral-500">
                      {message.role === "user" ? "You" : "ChatForge"}
                    </p>
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
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatForge..."
                rows={1}
                className="max-h-48 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !prompt.trim()}
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
