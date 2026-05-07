# ChatForge

ChatForge is a full-stack AI chat application built with **Bun**, **Express**, **React**, and the **OpenAI SDK**. It provides a clean ChatGPT-style interface backed by a simple HTTP API for sending prompts and continuing multi-turn conversations using a `conversationId`, with request validation via Zod and in-memory conversation state management.

The project is organized as a Bun workspace with two packages and a clean layered backend structure (routes → controller → service → repository), making it easy to extend with persistence, authentication, or additional chat features.

## Features

- ChatGPT-style UI with sidebar, conversation history, and pinned composer
- Multi-turn conversations with per-chat `conversationId`
- Server-side prompt validation with Zod
- Markdown rendering for assistant replies (headings, lists, code, tables, links)
- Animated typing indicator while waiting for responses
- Tailwind CSS styling and `lucide-react` icons

## Project Structure

```
chatForge/
├── index.ts                  # Runs server + client concurrently
├── package.json              # Root workspace config
└── packages/
    ├── server/               # Bun + Express API
    │   ├── index.ts
    │   ├── routes.ts
    │   ├── controllers/
    │   ├── services/
    │   └── repositories/
    └── client/               # Vite + React frontend
        ├── index.html
        └── src/
            └── App.tsx
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

- **Server** on [http://localhost:3000](http://localhost:3000)
- **Client** on [http://localhost:5173](http://localhost:5173) (proxied to the server's `/api` routes)

You can also run each package individually:

```bash
bun --cwd packages/server run dev
bun --cwd packages/client run dev
```

## API

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

## Tech Stack

- **Runtime:** Bun
- **Backend:** Express, OpenAI SDK, Zod, dotenv
- **Frontend:** React 19, Vite, TailwindCSS, react-markdown, remark-gfm, lucide-react
- **Tooling:** Prettier, Husky, lint-staged
