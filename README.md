# ChatForge

ChatForge is a full-stack AI chat application built with **Bun**, **Express**, **React**, and the **OpenAI SDK**. It pairs a polished ChatGPT-style chat interface with a clean HTTP API for multi-turn conversations, giving you both a ready-to-use product and a well-structured backend to build on.

The project is organized as a Bun workspace with two first-class packages — a React frontend and an Express API — and a clean layered backend structure (routes → controller → service → repository), making it easy to extend with persistence, authentication, or additional chat features.

## Features

### User Interface

- ChatGPT-style layout with a dark sidebar and centered chat column
- Conversation history list with auto-titled chats and a "New chat" button
- Pinned composer with Enter-to-send and Shift+Enter for newlines
- Animated typing indicator while waiting for responses
- Rich markdown rendering for assistant replies (headings, lists, code, tables, links, blockquotes)
- Auto-scroll to the latest message
- Responsive layout (sidebar collapses on mobile)
- Tailwind CSS styling and `lucide-react` icons

### Backend

- Multi-turn conversations with per-chat `conversationId`
- Server-side prompt validation with Zod
- Layered architecture (routes → controller → service → repository)
- In-memory conversation state (easy to swap for a database)
- OpenAI-compatible LLM client (works with OpenAI or any compatible provider)

## Project Structure

```
chatForge/
├── index.ts                  # Runs server + client concurrently
├── package.json              # Root workspace config
└── packages/
    ├── client/               # Vite + React frontend
    │   ├── index.html
    │   └── src/
    │       └── App.tsx
    └── server/               # Bun + Express API
        ├── index.ts
        ├── routes.ts
        ├── controllers/
        ├── services/
        └── repositories/
```

## Prerequisites

- [Bun](https://bun.com) v1.3+
- An OpenAI-compatible API key

## Setup

Install dependencies (from the repo root):

```bash
bun install
```

Create a `.env` file in `packages/server/` with your API credentials:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=api.openai.com
PORT=3000
```

## Running the App

Start the server and client together (from the repo root):

```bash
bun run dev
```

This launches:

- **Client** on [http://localhost:5173](http://localhost:5173) (proxied to the server's `/api` routes)
- **Server** on [http://localhost:3000](http://localhost:3000)

You can also run each package individually:

```bash
bun --cwd packages/client run dev
bun --cwd packages/server run dev
```

## Frontend

The frontend lives in `packages/client/` and is a Vite + React 19 app styled with Tailwind CSS.

### Key components

- **`App.tsx`** — top-level chat shell. Owns conversation state, sidebar, composer, and message rendering.
- **`Markdown`** — wraps `react-markdown` with `remark-gfm` and Tailwind styles for headings, lists, code blocks, tables, and links.

### Conversation model

Each conversation is held client-side as:

```ts
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Conversation = {
  id: string; // UUID — sent to the API as conversationId
  title: string; // auto-generated from the first user message
  messages: ChatMessage[];
};
```

Clicking **New chat** generates a fresh `conversationId`, which the backend uses to scope LLM context per chat.

### Dev proxy

Vite proxies `/api/*` to the server in `packages/client/vite.config.ts`, so the frontend can call the API with relative URLs without CORS configuration.

## API

The API lives in `packages/server/` and is built with Express on Bun.

### `POST /api/chat`

Send a prompt and receive an assistant reply.

**Request body:**

```json
{
  "prompt": "Hello, ChatForge!",
  "conversationId": "a-uuid-v4"
}
```

**Response:**

```json
{
  "message": "Hi! How can I help you today?"
}
```

Conversation context is preserved across requests sharing the same `conversationId`.

### `GET /api/hello`

Simple health-check endpoint.

```json
{ "message": "Hello, world!" }
```

## Tech Stack

- **Runtime:** Bun
- **Frontend:** React 19, Vite, Tailwind CSS, react-markdown, remark-gfm, lucide-react
- **Backend:** Express, OpenAI SDK, Zod, dotenv
- **Tooling:** Prettier, Husky, lint-staged
