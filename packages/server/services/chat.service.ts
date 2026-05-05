import OpenAI from "openai";
import { conversationRepository } from "../repositories/conversation.repository";

// implementation details are hidden from the client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: `https://${process.env.OPENAI_BASE_URL}/v1`,
});
type chatResponse = {
  id: string;
  message: string;
};
// chatService encapsulates the details for working with LLM
// export public interface for the chat service
export const chatService = {
  async sendMessage(
    prompt: string,
    conversationId: string,
  ): Promise<chatResponse> {
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
    return { id: response.id, message: response.output_text };
  },
};
