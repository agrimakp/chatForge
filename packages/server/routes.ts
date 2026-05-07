import express from "express";
import { chatController } from "./controllers/chat.controller";
import { transcriptionController } from "./controllers/transcription.controller";
import { ttsController } from "./controllers/tts.controller";
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

// transcribe audio (raw binary body, audio/*)
router.post(
  "/api/transcribe",
  express.raw({ type: "audio/*", limit: "25mb" }),
  async (req: Request, res: Response) => {
    transcriptionController.transcribe(req, res);
  },
);

// synthesize speech from text (returns audio/mpeg)
router.post("/api/speech", async (req: Request, res: Response) => {
  ttsController.synthesize(req, res);
});

export default router;
