import type { Request, Response } from "express";
import { z } from "zod";
import { ttsService, type SpeechVoice } from "../services/tts.service";

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "text is required")
    .max(4000, "text is too long"),
  voice: z
    .enum([
      "alloy",
      "ash",
      "ballad",
      "coral",
      "echo",
      "fable",
      "onyx",
      "nova",
      "sage",
      "shimmer",
    ])
    .optional(),
});

export const ttsController = {
  async synthesize(req: Request, res: Response) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    try {
      const { text, voice } = parsed.data;
      const { audio, mimeType } = await ttsService.synthesize(
        text,
        voice as SpeechVoice | undefined,
      );
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", audio.length.toString());
      res.send(audio);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Speech synthesis failed" });
    }
  },
};
