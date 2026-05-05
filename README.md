# ChatForge

ChatForge is a lightweight AI chat backend built with Bun, Express, and the OpenAI SDK. It provides a simple API for sending prompts and continuing multi-turn conversations using a `conversationId`, with request validation via Zod and in-memory conversation state management.

The project follows a clean layered structure (routes -> controller -> service -> repository), making it easy to extend with persistence, authentication, or additional chat features.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
