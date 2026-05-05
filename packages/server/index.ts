import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { z } from "zod";
import { conversationRepository } from "./repositories/conversation.repository";

dotenv.config();

// new instance of openai with API key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: `https://${process.env.OPENAI_BASE_URL}/v1`,
});

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

// define route and route handler

app.get("/", (req: Request, res: Response) => {
  res.send(process.env.OPENAI_API_KEY);
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello, world!" });
});

const conversationSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "prompt is required")
    .max(1000, "prompt is too long"),
  conversationId: z.string().uuid(),
});
// recieving prompt from user
app.post("/api/chat", async (req: Request, res: Response) => {
  //validate incomming data using zod
  const { success, error } = conversationSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: error.message });
  }
  try {
    const { prompt, conversationId } = req.body;
    const response = await client.responses.create({
      model: "gpt-5.4-nano",
      // model: "gpt-oss:20b-cloud",
      input: prompt,
      temperature: 0.3,
      max_output_tokens: 100,
      previous_response_id:
        conversationRepository.getLastResponseId(conversationId),
    });
    conversationRepository.setLastResponseId(conversationId, response.id);
    res.json({ message: response.output_text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
