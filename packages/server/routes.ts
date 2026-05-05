import express from "express";
import { chatController } from "./controllers/chat.controller";
import type { Request, Response } from "express";

const router = express.Router();
// routes or endpoints for the server
router.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello, world!" });
});

// recieving prompt from user
router.post("/api/chat", async (req: Request, res: Response) => {
  chatController.sendMessage(req, res);
});

export default router;
