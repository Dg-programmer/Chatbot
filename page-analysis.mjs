import { extensionCors } from "./hosted-auth.mjs";
import { maxAttachments, maxTotalAttachmentBytes, readAttachment } from "./openai-media.mjs";

const analysisPath = "/api/page-analysis";
const statusPath = analysisPath + "/status";
const maxTextRequestBytes = 120 * 1024;
const maxMediaRequestBytes = Math.ceil(maxTotalAttachmentBytes / 3) * 4 + 256 * 1024;
const maxConcurrentAnalyses = 2;
const maxAnalysesPerMinute = 12;
const analysisTimeout = 25000;
const mediaAnalysisTimeout = 90000;

export class PageAnalysisError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

function readPage(value, hasAttachments) {
  if (
    typeof value?.title !== "string" || value.title.length > 300 ||
    typeof value.url !== "string" || value.url.length > 4096 ||
    typeof value.text !== "string" || value.text.length > 22000
  ) {
    throw new PageAnalysisError(400, "invalid-page");
  }
  let url;
  try {
    url = new URL(value.url);
  } catch {
    throw new PageAnalysisError(400, "invalid-page");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new PageAnalysisError(400, "invalid-page");
  }
  const text = value.text.trim();
  if (!text && !hasAttachments) throw new PageAnalysisError(400, "page-empty");
  url.search = "";
  url.hash = "";
  return { title: value.title.trim(), url: url.href, text };
}

function readHistory(value) {
  if (!Array.isArray(value) || value.length > 10) throw new PageAnalysisError(400, "invalid-history");
  return value.map((message) => {
    if (
      !["user", "assistant"].includes(message?.role) ||
      typeof message.text !== "string" || message.text.length > 4000 || !message.text.trim()
    ) {
      throw new PageAnalysisError(400, "invalid-history");
    }
    return { role: message.role, text: message.text.trim() };
  });
}

async function readAnalysisRequest(request, supportsAttachments) {
  const maxRequestBytes = supportsAttachments ? maxMediaRequestBytes : maxTextRequestBytes;
  const contentType = request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new PageAnalysisError(415, "json-required");
  if (Number(request.headers["content-length"]) > maxRequestBytes) {
    throw new PageAnalysisError(413, "message-too-large");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.byteLength;
    if (size > maxRequestBytes) throw new PageAnalysisError(413, "message-too-large");
    chunks.push(chunk);
  }

  let body;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    throw new PageAnalysisError(400, "invalid-json");
  }
  const rawAttachments = body?.attachments === undefined ? [] : body.attachments;
  if (!Array.isArray(rawAttachments)) throw new PageAnalysisError(400, "invalid-attachment");
  if (rawAttachments.length > maxAttachments) throw new PageAnalysisError(413, "too-many-attachments");
  if (rawAttachments.length && !supportsAttachments) throw new PageAnalysisError(415, "attachments-unavailable");
  const hasAttachments = rawAttachments.length > 0;

  if (typeof body?.question !== "string" || body.question.length > 2000 || (!body.question.trim() && !hasAttachments)) {
    throw new PageAnalysisError(400, "invalid-question");
  }
  const question = body.question.trim() || "Analyze the attached files.";
  const page = readPage(body.page, hasAttachments);
  const history = readHistory(body.history ?? []);
  if ((!hasAttachments && size > maxTextRequestBytes)
    || Buffer.byteLength(JSON.stringify({ question, page, history })) > maxTextRequestBytes) {
    throw new PageAnalysisError(413, "message-too-large");
  }

  let attachmentBytes = 0;
  const attachments = rawAttachments.map((value) => {
    const file = readAttachment(value);
    attachmentBytes += file.bytes.length;
    if (attachmentBytes > maxTotalAttachmentBytes) throw new PageAnalysisError(413, "attachments-too-large");
    return file;
  });
  return { question, page, history, attachments };
}

export function createPageAnalysis({ providerStatus, answer, sendJSON, publicErrorCode, requirePet }) {
  let inFlight = 0;
  let recentStarts = [];

  return async (pathname, request, response) => {
    if (pathname !== analysisPath && pathname !== statusPath) return false;
    const status = pathname === statusPath;
    const methods = status ? ["GET", "POST"] : ["POST"];
    if (extensionCors(request, response, methods, { authorization: Boolean(requirePet), privateNetwork: !requirePet })) return true;
    if (!methods.includes(request.method)) {
      response.setHeader("Allow", [...methods, "OPTIONS"].join(", "));
      throw new PageAnalysisError(405, "method-not-allowed");
    }
    requirePet?.(request);
    const { connected, attachments: supportsAttachments, attachmentExtensions } = providerStatus();
    if (status) {
      if (Number(request.headers["content-length"]) > 1024 || request.headers["transfer-encoding"]) {
        throw new PageAnalysisError(413, "message-too-large");
      }
      sendJSON(response, 200, { connected, attachments: supportsAttachments, attachmentExtensions });
      return true;
    }
    if (!connected) throw new PageAnalysisError(503, "provider-unconfigured");

    const now = Date.now();
    recentStarts = recentStarts.filter((start) => now - start < 60000);
    if (inFlight >= maxConcurrentAnalyses || recentStarts.length >= maxAnalysesPerMinute) {
      throw new PageAnalysisError(429, "analysis-busy");
    }
    inFlight++;

    try {
      const input = await readAnalysisRequest(request, supportsAttachments);
      if (response.destroyed) return true;
      const started = Date.now();
      recentStarts = recentStarts.filter((start) => started - start < 60000);
      if (recentStarts.length >= maxAnalysesPerMinute) throw new PageAnalysisError(429, "analysis-busy");
      recentStarts.push(started);

      const controller = new AbortController();
      const onClose = () => controller.abort();
      const hasAttachments = input.attachments.length > 0;
      const timeout = hasAttachments ? mediaAnalysisTimeout : analysisTimeout;
      const timer = setTimeout(() => controller.abort(new PageAnalysisError(504, "analysis-timeout")), timeout);
      response.once("close", onClose);
      try {
        if (hasAttachments) {
          // Let the extension receive a response promptly while uploads or transcripts are analyzed.
          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          response.flushHeaders();
        }
        const reply = await answer(input, controller.signal);
        controller.signal.throwIfAborted();
        if (hasAttachments) response.end(JSON.stringify({ reply }));
        else sendJSON(response, 200, { reply });
      } catch (error) {
        const cause = controller.signal.reason ?? error;
        if (!hasAttachments || !response.headersSent) throw cause;
        if (!response.destroyed) response.end(JSON.stringify({ error: publicErrorCode(cause) }));
      } finally {
        clearTimeout(timer);
        response.off("close", onClose);
      }
    } finally {
      inFlight--;
    }
    return true;
  };
}
