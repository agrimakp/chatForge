import OpenAI, { toFile } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: `https://${process.env.OPENAI_BASE_URL}/v1`,
});

type TranscriptionResponse = {
  text: string;
};

export const transcriptionService = {
  async transcribe(
    audio: Buffer,
    mimeType: string,
  ): Promise<TranscriptionResponse> {
    const extension = mimeTypeToExtension(mimeType);
    const file = await toFile(audio, `audio.${extension}`, {
      type: mimeType,
    });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return { text: transcription.text ?? "" };
  },
};

function mimeTypeToExtension(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower.includes("webm")) return "webm";
  if (lower.includes("ogg")) return "ogg";
  if (lower.includes("mp4") || lower.includes("m4a")) return "m4a";
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  if (lower.includes("wav")) return "wav";
  return "webm";
}
