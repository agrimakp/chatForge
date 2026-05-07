import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: `https://${process.env.OPENAI_BASE_URL}/v1`,
});

export type SpeechVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "sage"
  | "shimmer";

const DEFAULT_VOICE: SpeechVoice = "alloy";
const DEFAULT_MODEL = "gpt-4o-mini-tts";

export const ttsService = {
  async synthesize(
    text: string,
    voice: SpeechVoice = DEFAULT_VOICE,
  ): Promise<{ audio: Buffer; mimeType: string }> {
    const response = await client.audio.speech.create({
      model: DEFAULT_MODEL,
      voice,
      input: text,
      response_format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    return {
      audio: Buffer.from(arrayBuffer),
      mimeType: "audio/mpeg",
    };
  },
};
