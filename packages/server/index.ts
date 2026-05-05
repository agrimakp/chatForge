import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import { chatController } from "./controllers/chat.controller";
dotenv.config();

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
  chatController.sendMessage(req, res);
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
