import type { Request, Response } from "express";
import { transcriptionService } from "../services/transcription.service";

export const transcriptionController = {
  async transcribe(req: Request, res: Response) {
    const audio = req.body as Buffer | undefined;
    if (!audio || !Buffer.isBuffer(audio) || audio.length === 0) {
      return res.status(400).json({ error: "Audio body is required" });
    }

    const mimeType =
      (req.headers["content-type"] as string | undefined) ?? "audio/webm";

    try {
      const result = await transcriptionService.transcribe(audio, mimeType);
      res.json({ text: result.text });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Transcription failed" });
    }
  },
};
