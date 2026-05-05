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
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col p-4 md:p-6">
      <header className="mb-4 border-b pb-4">
        <h1 className="text-2xl font-semibold">ChatForge</h1>
        <p className="text-sm text-muted-foreground">
          Start a conversation with your AI assistant.
        </p>
      </header>

      <main className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your chat will appear here. Send a message to begin.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-muted"
              }`}
            >
              {message.text}
            </div>
          ))
        )}
        {isSending && (
          <div className="mr-auto flex w-fit items-center gap-1 rounded-lg bg-muted px-3 py-2">
            <span className="size-1.5 animate-bounce rounded-full bg-foreground [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-foreground [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-foreground" />
          </div>
        )}
      </main>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Type your message..."
          className="min-h-24 w-full rounded-lg border bg-background p-3 text-sm"
          disabled={isSending}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="submit"
            disabled={isSending || !prompt.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
