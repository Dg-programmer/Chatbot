import { extname } from "node:path";

export const maxSingleAttachmentBytes = 8 * 1024 * 1024;
export const maxTotalAttachmentBytes = 12 * 1024 * 1024;
export const maxAttachments = 3;

const types = {
  ".png": { mime: "image/png", kind: "image", check: (bytes) => bytes.subarray(0, 8).equals(pngSignature) },
  ".jpg": { mime: "image/jpeg", kind: "image", check: (bytes) => bytes.subarray(0, 3).equals(jpegSignature) },
  ".webp": { mime: "image/webp", kind: "image", check: (bytes) => hasPrefix(bytes, "RIFF") && hasPrefix(bytes, "WEBP", 8) },
  ".pdf": { mime: "application/pdf", kind: "document", check: (bytes) => bytes.subarray(0, 1024).includes("%PDF-") },
  ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "document", check: isZip },
  ".pptx": { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "document", check: isZip },
  ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "document", check: isZip },
  ".txt": { mime: "text/plain", kind: "document", check: isText },
  ".md": { mime: "text/markdown", aliases: ["text/plain", "text/x-markdown"], kind: "document", check: isText },
  ".csv": { mime: "text/csv", aliases: ["application/csv", "application/vnd.ms-excel", "text/plain"], kind: "document", check: isText },
  ".tsv": { mime: "text/tsv", aliases: ["text/tab-separated-values", "text/plain"], kind: "document", check: isText },
  ".json": { mime: "application/json", aliases: ["text/json", "text/plain"], kind: "document", check: isText },
  ".mp3": { mime: "audio/mpeg", aliases: ["audio/mp3"], kind: "audio", check: isMp3 },
  ".wav": { mime: "audio/wav", aliases: ["audio/wave", "audio/x-wav", "audio/vnd.wave"], kind: "audio", check: isWave },
  ".m4a": { mime: "audio/mp4", aliases: ["audio/x-m4a", "audio/m4a"], kind: "audio", check: (bytes) => hasPrefix(bytes, "ftyp", 4) },
  ".ogg": { mime: "audio/ogg", aliases: ["application/ogg"], kind: "audio", check: (bytes) => hasPrefix(bytes, "OggS") },
  ".flac": { mime: "audio/flac", aliases: ["audio/x-flac"], kind: "audio", check: (bytes) => hasPrefix(bytes, "fLaC") },
};

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpegSignature = Buffer.from([0xff, 0xd8, 0xff]);
const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const maxTranscriptBytes = 512 * 1024;
const maxTranscriptCharacters = 80000;

export class MediaError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

function hasPrefix(bytes, prefix, offset = 0) {
  return bytes.toString("latin1", offset, offset + prefix.length) === prefix;
}

function isZip(bytes) {
  return bytes.subarray(0, 4).equals(zipSignature);
}

function isText(bytes) {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function isMp3(bytes) {
  return hasPrefix(bytes, "ID3") || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}

function isWave(bytes) {
  return (hasPrefix(bytes, "RIFF") || hasPrefix(bytes, "RF64")) && hasPrefix(bytes, "WAVE", 8);
}

export function readAttachment(value) {
  const name = typeof value?.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 255 || /[\\/\p{Cc}\p{Cf}]/u.test(name)) {
    throw new MediaError(400, "invalid-attachment");
  }
  const extension = extname(name).toLowerCase();
  const type = types[extension === ".jpeg" ? ".jpg" : extension];
  const mimeType = typeof value.mimeType === "string" ? value.mimeType.toLowerCase() : "";
  if (!type || (mimeType !== type.mime && !type.aliases?.includes(mimeType))) {
    throw new MediaError(415, "unsupported-attachment");
  }

  const { data } = value;
  if (typeof data !== "string" || !data || data.length % 4 || /[^A-Za-z0-9+/=]/u.test(data)) {
    throw new MediaError(400, "invalid-attachment");
  }
  if (data.length > Math.ceil(maxSingleAttachmentBytes / 3) * 4) {
    throw new MediaError(413, "attachment-too-large");
  }
  const bytes = Buffer.from(data, "base64");
  if (!bytes.length || bytes.toString("base64") !== data || !type.check(bytes)) {
    throw new MediaError(400, "invalid-attachment");
  }
  if (bytes.length > maxSingleAttachmentBytes) throw new MediaError(413, "attachment-too-large");
  return { name, mimeType: type.mime, kind: type.kind, data, bytes };
}

export function openAIErrorCode(status) {
  if (status === 401 || status === 403) return "provider-auth";
  if (status === 429) return "provider-rate-limited";
  return "provider-rejected";
}

async function transcribe(attachment, key, signal) {
  const form = new FormData();
  form.set("model", "gpt-transcribe");
  form.set("file", new Blob([attachment.bytes], { type: attachment.mimeType }), attachment.name);
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, Accept: "application/json" },
    body: form,
    signal,
    redirect: "error",
  });
  if (!response.ok) {
    await response.body?.cancel();
    const code = openAIErrorCode(response.status);
    throw new MediaError(code === "provider-rate-limited" ? 429 : 502, code === "provider-rejected" ? "audio-transcription-failed" : code);
  }

  let read = 0;
  let json = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for await (const chunk of response.body) {
    read += chunk.byteLength;
    if (read > maxTranscriptBytes) throw new Error("Transcription response exceeded the limit.");
    json += decoder.decode(chunk, { stream: true });
  }
  const { text } = JSON.parse(json + decoder.decode());
  if (typeof text !== "string" || !text.trim() || text.length > maxTranscriptCharacters) {
    throw new Error("No usable transcription was returned.");
  }
  return text;
}

export async function openAIInput(messages, key, signal) {
  return Promise.all(messages.map(async ({ role, text, attachments }) => {
    if (!attachments.length) return { role, content: text };

    const content = [{ type: "input_text", text }];
    for (const attachment of attachments) {
      const { name, mimeType, kind, data } = attachment;
      if (kind === "audio") {
        try {
          const transcript = await transcribe(attachment, key, signal);
          content.push({ type: "input_text", text: "Speech transcript from " + JSON.stringify(name) + ":\n" + transcript });
        } catch (error) {
          if (error instanceof MediaError) throw error;
          throw new MediaError(502, "audio-transcription-failed");
        }
      } else {
        const inline = "data:" + mimeType + ";base64," + data;
        if (kind === "image") {
          content.push({ type: "input_text", text: "Image attachment: " + JSON.stringify(name) });
          content.push({ type: "input_image", image_url: inline, detail: "auto" });
        } else {
          content.push({ type: "input_file", filename: name, file_data: inline });
        }
      }
    }
    return { role, content };
  }));
}
