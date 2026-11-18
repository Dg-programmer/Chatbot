const jpeg = ["image/jpeg", "image/jpg", "image/pjpeg"];
const formats = {
  png: ["image/png", "image/x-png"],
  jpg: jpeg,
  jpeg,
  webp: ["image/webp"],
  pdf: ["application/pdf", "application/x-pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/plain", "text/x-markdown"],
  csv: ["text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"],
  tsv: ["text/tab-separated-values", "text/plain", "text/tsv", "application/vnd.ms-excel"],
  json: ["application/json", "text/plain", "text/json"],
  mp3: ["audio/mpeg", "audio/mp3", "audio/x-mp3"],
  wav: ["audio/wav", "audio/wave", "audio/x-wav", "audio/vnd.wave"],
  m4a: ["audio/mp4", "audio/x-m4a", "audio/m4a"],
  ogg: ["audio/ogg", "application/ogg", "audio/x-ogg"],
  flac: ["audio/flac", "audio/x-flac"],
};

const mebibyte = 1024 * 1024;
export const attachmentLimits = Object.freeze({
  maxFiles: 3,
  maxBytes: 12 * mebibyte,
  maxFileBytes: 8 * mebibyte,
});
export const attachmentAccept = Object.keys(formats).map((extension) => "." + extension).join(",");

let lastId = 0;

export function validateFiles(files, existing = []) {
  const accepted = [];
  const errors = [];
  let total = existing.reduce((bytes, item) => bytes + item.size, 0);

  for (const file of files) {
    if (existing.length + accepted.length >= attachmentLimits.maxFiles) {
      errors.push("You can attach up to 3 files.");
      break;
    }

    const name = typeof file?.name === "string" ? file.name.trim() : "";
    if (!name || name.length > 255 || /[\u0000-\u001f\u007f/\\]/u.test(name)) {
      errors.push("One file has an unsupported name.");
      continue;
    }
    const extension = name.toLowerCase().match(/\.([a-z0-9]+)$/u)?.[1];
    const types = Object.hasOwn(formats, extension) ? formats[extension] : null;
    const suppliedType = file.type?.split(";")[0].trim().toLowerCase();
    if (!types || (suppliedType && suppliedType !== "application/octet-stream" && !types.includes(suppliedType))) {
      errors.push(`“${name}” has an unsupported file type.`);
      continue;
    }
    if (!Number.isSafeInteger(file.size) || file.size <= 0) {
      errors.push(`“${name}” is empty or unavailable.`);
      continue;
    }
    if (file.size > attachmentLimits.maxFileBytes) {
      errors.push(`“${name}” exceeds the 8 MB per-file limit.`);
      continue;
    }
    if (total + file.size > attachmentLimits.maxBytes) {
      errors.push(`“${name}” would exceed the 12 MB total attachment limit.`);
      continue;
    }

    const id = globalThis.crypto?.randomUUID?.() ?? `attachment-${Date.now()}-${++lastId}`;
    accepted.push({ id, name, mimeType: types[0], size: file.size, file });
    total += file.size;
  }

  return { accepted, errors };
}

export async function encodeAttachment({ name, mimeType, file }) {
  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > attachmentLimits.maxFileBytes) {
    throw new Error("The attachment is unavailable or exceeds the size limit.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== file.size) throw new Error("The attachment changed before it could be read.");
  if (typeof bytes.toBase64 === "function") return { name, mimeType, data: bytes.toBase64() };

  const chunks = [];
  const chunkSize = 32768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
  }
  return { name, mimeType, data: btoa(chunks.join("")) };
}
