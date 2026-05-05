import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const conversationId = useMemo(() => crypto.randomUUID(), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedPrompt,
    };

    setMessages((previous) => [...previous, userMessage]);
    setPrompt("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { message?: string };

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.message ?? "No response received.",
        },
      ]);
    } catch (requestError) {
      setError("Unable to send message. Make sure the server is running.");
      console.error(requestError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-6">
      <div className="flex h-[calc(100vh-2rem)] w-full flex-col rounded-2xl border border-border/70 bg-card/90 p-4 shadow-xl backdrop-blur-sm md:h-[calc(100vh-3rem)] md:p-6">
        <header className="mb-5 border-b border-border/70 pb-4">
          <p className="mb-2 w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            AI Assistant
          </p>
          <h1 className="text-2xl font-semibold md:text-3xl">ChatForge</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a conversation with your AI assistant.
          </p>
        </header>

        <main className="mb-4 flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-border/60 bg-background/50 p-4">
          {messages.length === 0 ? (
            <div className="m-auto max-w-sm rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Your chat will appear here. Send a message to begin.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border border-border/60 bg-muted/70"
                }`}
              >
                {message.text}
              </div>
            ))
          )}
          {isSending && (
            <div className="mr-auto flex w-fit items-center gap-1.5 rounded-2xl border border-border/60 bg-muted/70 px-4 py-3 shadow-sm">
              <span className="size-1.5 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground" />
            </div>
          )}
        </main>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border/60 bg-background/80 p-3"
        >
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Type your message..."
            className="min-h-24 w-full resize-none rounded-lg border border-border/70 bg-background p-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            disabled={isSending}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="submit"
              disabled={isSending || !prompt.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
