import { extname } from "node:path";
import { MediaError } from "./openai-media.mjs";

const textExtensions = [".txt", ".md", ".csv", ".tsv", ".json"];
export const geminiAttachmentExtensions = Object.freeze([
  ".png", ".jpg", ".jpeg", ".webp", ".pdf", ...textExtensions, ".mp3", ".wav", ".ogg", ".flac",
]);

// Leave room below Gemini's 20 MB inline request limit, including JSON encoding.
const maxInlineBodyBytes = 18 * 1024 * 1024;

export function geminiMediaEndpoint(model) {
  const name = model.replace(/^models\//u, "");
  if (!/^gemini-[a-z0-9][a-z0-9.-]*$/u.test(name)) return null;
  return new URL(`https://generativelanguage.googleapis.com/v1beta/models/${name}:streamGenerateContent?alt=sse`);
}

export function geminiMediaBody(messages, instructions, maxOutputTokens) {
  const contents = messages.map(({ role, text, attachments }) => {
    const parts = [{ text }];
    for (const { name, mimeType, data, bytes } of attachments) {
      const extension = extname(name).toLowerCase();
      if (!geminiAttachmentExtensions.includes(extension)) {
        throw new MediaError(415, "unsupported-attachment");
      }
      const label = "Reference attachment " + JSON.stringify(name);
      if (textExtensions.includes(extension)) {
        parts.push({ text: label + ":\n" + new TextDecoder().decode(bytes) });
      } else {
        parts.push({ text: label });
        parts.push({ inlineData: { mimeType, data } });
      }
    }
    return { role: role === "assistant" ? "model" : "user", parts };
  });

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: instructions }] },
    contents,
    generationConfig: { maxOutputTokens },
  });
  if (Buffer.byteLength(body) > maxInlineBodyBytes) throw new MediaError(413, "attachments-too-large");
  return body;
}

export function geminiReplyText(payload) {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts.filter((part) => !part.thought && typeof part.text === "string").map((part) => part.text).join("");
}
