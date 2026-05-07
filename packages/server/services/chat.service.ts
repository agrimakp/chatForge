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
      instructions: `
        You are a helpful assistant that can answer questions and help with tasks.
        Current system time is ${new Date().toISOString()}.

        Always use the latest information and data.
        Always use the correct information and data.
        Unless otherwise specified, format time, dates, and numbers in the user's timezone and human readable format.
        Always respond as raw markdown.
        When referencing any website, resource, or URL, ALWAYS format it as a markdown link using [descriptive text](https://full-url.example) syntax. Never write a raw URL on its own — always wrap it in a markdown link with meaningful link text.
      `,
    });
    conversationRepository.setLastResponseId(conversationId, response.id);
    return { id: response.id, message: response.output_text };
  },
};
