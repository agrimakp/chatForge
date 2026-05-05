import type { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { z } from "zod";

// implementation details are hidden from the client

const conversationSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "prompt is required")
    .max(1000, "prompt is too long"),
  conversationId: z.string().uuid(),
});

// public interface for the chat controller

export const chatController = {
  async sendMessage(req: Request, res: Response) {
    //validate incomming data using zod
    const { success, error } = conversationSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ error: error.message });
    }
    try {
      const { prompt, conversationId } = req.body;
      const response = await chatService.sendMessage(prompt, conversationId);
      res.json({ message: response.message });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
