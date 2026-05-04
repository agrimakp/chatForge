import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

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

// recieving prompt from user
app.post("/api/chat", async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const response = await client.responses.create({
    //model: "gpt-4o-mini",
    model: "gpt-oss:20b-cloud",
    input: prompt,
    temperature: 0.3,
    max_output_tokens: 100,
  });
  res.json({ message: response.output_text });
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
