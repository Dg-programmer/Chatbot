import { hostedOrigin, localOrigin, pairingCodePattern } from "./connection-origin.js";
import { readConnection, saveConnection } from "./connection-store.js";

const toggle = "saathi:toggle";
const presenceUrl = "http://127.0.0.1:43179/baby-presence";
const maxTextBytes = 120 * 1024;
const maxFileBytes = 8 * 1024 * 1024;
const maxAttachmentBytes = 12 * 1024 * 1024;
const presenceClient = crypto.randomUUID().replaceAll("-", "");
let presenceQueue = Promise.resolve();
let browserClaim;
let focusRevision = 0;

function isPage(sender) {
  return sender.id === chrome.runtime.id && Number.isInteger(sender.tab?.id) && sender.frameId === 0
    && typeof sender.url === "string" && /^https?:\/\//u.test(sender.url);
}

async function requestDesktopOwner(body) {
  let connected = false;
  try {
    const response = await fetch(presenceUrl, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(900),
    });
    connected = true;
    const type = response.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
    if (!response.ok || type !== "application/json" || !response.body) return "desktop";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 256) {
          await reader.cancel();
          return "desktop";
        }
        text += decoder.decode(value, { stream: true });
      }
      const status = JSON.parse(text + decoder.decode());
      return status?.service === "baby-desktop" && status.running === true && status.owner === "browser" ? "browser" : "desktop";
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    // A slow bridge may still have a visible desktop pet. A missing listener lets the extension run on its own.
    return !connected && error?.name === "TypeError" ? "unavailable" : "desktop";
  }
}

async function reportDesktopPresence(active) {
  const owner = await requestDesktopOwner(JSON.stringify({ active, client: presenceClient }));
  if (owner !== "unavailable" || !active) return owner;
  // The older desktop bridge accepts only an empty object. Detect it so upgrades cannot create two pets.
  return await requestDesktopOwner("{}") === "unavailable" ? "unavailable" : "desktop";
}

function queuePresence(update) {
  const task = presenceQueue.then(update);
  presenceQueue = task.catch(() => {});
  return task;
}

async function releasePresence(claim) {
  if (!claim || browserClaim !== claim) return;
  browserClaim = undefined;
  if (claim.reported) await reportDesktopPresence(false);
}

function checkPagePresence(sender, active) {
  const { id: tabId, windowId } = sender.tab;
  const documentId = sender.documentId;
  const revision = focusRevision;
  return queuePresence(async () => {
    const prior = browserClaim;
    const samePage = prior?.tabId === tabId && prior.documentId === documentId;
    let focused = false;
    if (active && revision === focusRevision && (!sender.documentLifecycle || sender.documentLifecycle === "active")) {
      const window = await chrome.windows.getLastFocused();
      if (window.focused && window.id === windowId) {
        const [tab] = await chrome.tabs.query({ active: true, windowId });
        focused = tab?.id === tabId;
      }
    }
    if (!focused || revision !== focusRevision) {
      if (samePage) await releasePresence(prior);
      return { visible: false };
    }
    const claim = { tabId, windowId, documentId, reported: true };
    browserClaim = claim;
    const owner = await reportDesktopPresence(true);
    claim.reported = owner !== "unavailable";
    if (focusRevision !== revision) {
      await releasePresence(claim);
      return { visible: false };
    }
    return { visible: owner === "browser" || owner === "unavailable" };
  });
}

function pageFocusChanged(lostFocus) {
  focusRevision += 1;
  const prior = browserClaim;
  if (!prior || !lostFocus(prior)) return;
  const target = { frameId: 0, ...(prior.documentId ? { documentId: prior.documentId } : {}) };
  chrome.tabs.sendMessage(prior.tabId, { type: "baby:pet:lost-focus" }, target).catch(() => {});
  void queuePresence(() => releasePresence(prior));
}

chrome.windows.onFocusChanged.addListener((windowId) => pageFocusChanged((claim) => claim.windowId !== windowId));
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => pageFocusChanged((claim) => claim.windowId === windowId && claim.tabId !== tabId));
chrome.tabs.onRemoved.addListener((tabId) => {
  if (browserClaim?.tabId === tabId) pageFocusChanged(() => true);
});

function sanitizeAttachments(files) {
  if (!Array.isArray(files) || files.length > 3) return null;
  let bytes = 0;
  const result = [];
  for (const file of files) {
    const { name, mimeType, data } = file ?? {};
    if (typeof name !== "string" || !name.trim() || name.length > 180
      || typeof mimeType !== "string" || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/iu.test(mimeType) || mimeType.length > 128
      || typeof data !== "string" || data.length < 4 || data.length % 4
      || data.length > Math.ceil(maxFileBytes / 3) * 4) return null;
    const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
    const fileBytes = data.length * 3 / 4 - padding;
    if (fileBytes > maxFileBytes || (bytes += fileBytes) > maxAttachmentBytes) return null;
    result.push({ name, mimeType, data });
  }
  return result;
}

function sanitizePayload(payload, sender) {
  if (!payload || typeof payload.question !== "string" || !payload.page || !Array.isArray(payload.history)) return null;
  const target = new URL(sender.url);
  const destination = target.origin + target.pathname;
  const { question, page, history } = payload;
  const attachments = sanitizeAttachments(payload.attachments ?? []);
  if (typeof page.title !== "string" || typeof page.url !== "string" || typeof page.text !== "string"
    || !attachments || destination.slice(0, 4096) !== page.url || question.length > 2000
    || ((!question.trim() || !page.text.trim()) && !attachments.length)
    || page.text.length > 22000 || page.title.length > 300 || history.length > 10) return null;
  if (history.some((item) => !item || !["user", "assistant"].includes(item.role) || typeof item.text !== "string" || item.text.length > 4000)) return null;
  const body = {
    question: question.trim(),
    page: { title: page.title, url: destination.slice(0, 4096), text: page.text },
    history: history.map(({ role, text }) => ({ role, text })),
  };
  if (new TextEncoder().encode(JSON.stringify(body)).length > maxTextBytes) return null;
  return JSON.stringify({ ...body, ...(attachments.length ? { attachments } : {}) });
}

async function request(origin, path, body, milliseconds, token) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const result = await fetch(origin + path, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      headers,
      body,
      signal: AbortSignal.timeout(milliseconds),
    });
    const data = await result.json().catch(() => null);
    if (data && typeof data.error === "string" && /^[a-z-]{3,43}$/u.test(data.error)) {
      return { error: data.error };
    }
    if (result.status === 401 && token) return { error: "extension-auth-required" };
    if (result.status === 502 || result.status === 503 || result.status === 504) return { error: "server-offline" };
    if (result.ok && data) return data;
    return { error: "analysis-failed" };
  } catch (error) {
    return { error: error?.name === "TimeoutError" ? "analysis-timeout" : "server-offline" };
  }
}

const tokenPattern = /^[A-Za-z0-9._~-]{20,2048}$/u;
const accessFor = (origin) => ({ origins: [`${origin}/*`] });
let connectionUpdate = Promise.resolve();

async function configuredConnection() {
  const record = await readConnection();
  if (!record) return { origin: localOrigin };
  const origin = hostedOrigin(record.origin);
  if (!origin) throw new Error("Invalid stored connection");
  return { origin, token: record.token, expiresAt: record.expiresAt };
}

async function petRequest(path, body, milliseconds) {
  const { origin, token, expiresAt } = await configuredConnection();
  const hosted = origin !== localOrigin;
  const connection = { origin, mode: hosted ? "hosted" : "local" };
  if (hosted) {
    if (!await chrome.permissions.contains(accessFor(origin))) return { ...connection, error: "host-permission-required" };
    if (typeof token !== "string" || !tokenPattern.test(token) || !(expiresAt > Date.now())) {
      return { ...connection, error: "extension-auth-required" };
    }
  }
  const data = await request(origin, path, body, milliseconds, token);
  if (typeof data.error === "string") return { ...connection, error: data.error };
  if (path.endsWith("/status")) {
    const attachmentExtensions = Array.isArray(data.attachmentExtensions)
      ? data.attachmentExtensions.filter((extension) => typeof extension === "string" && /^\.[a-z0-9]{1,8}$/u.test(extension)).slice(0, 32)
      : null;
    return { ...connection, connected: data.connected === true, attachments: data.attachments === true, attachmentExtensions };
  }
  if (typeof data.reply === "string" && data.reply.trim()) return { ...connection, reply: data.reply.slice(0, 12000) };
  return { ...connection, error: "analysis-failed" };
}

function connectionStatus() {
  return petRequest("/api/page-analysis/status", "{}", 8000);
}

async function pairConnection(value, code) {
  const origin = hostedOrigin(value);
  if (!origin) return { error: "invalid-host" };
  if (typeof code !== "string" || !pairingCodePattern.test(code)) return { error: "invalid-pairing-code" };
  if (!await chrome.permissions.contains(accessFor(origin))) return { error: "host-permission-required" };
  const previous = await configuredConnection();
  const result = await request(origin, "/api/pet/pair", JSON.stringify({ code }), 20000);
  if (result.error) return { error: result.error };
  const { token, expiresIn } = result;
  if (typeof token !== "string" || !tokenPattern.test(token) || !Number.isSafeInteger(expiresIn)
    || expiresIn <= 0 || expiresIn > 365 * 86400) return { error: "invalid-pair-response" };
  await saveConnection({ origin, token, expiresAt: Date.now() + expiresIn * 1000 });
  if (previous.origin !== localOrigin && previous.origin !== origin) {
    await chrome.permissions.remove(accessFor(previous.origin)).catch(() => {});
  }
  return { mode: "hosted", origin };
}

async function useLocal() {
  const previous = await configuredConnection();
  await saveConnection(null);
  if (previous.origin !== localOrigin) await chrome.permissions.remove(accessFor(previous.origin)).catch(() => {});
  return { mode: "local", origin: localOrigin };
}

function sendResult(task, respond) {
  task.then(respond, () => respond({ error: "connection-unavailable" }));
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type;
  if (sender.id === chrome.runtime.id && sender.url === chrome.runtime.getURL("options.html")) {
    if (type === "baby:connection:status") return sendResult(connectionStatus(), sendResponse);
    if (type === "baby:connection:pair" || type === "baby:connection:local") {
      const task = connectionUpdate.then(() => (type === "baby:connection:pair"
        ? pairConnection(message.origin, message.code) : useLocal()));
      connectionUpdate = task.catch(() => {});
      return sendResult(task, sendResponse);
    }
    return;
  }
  if (!isPage(sender)) return;
  if (type === "baby:desktop:presence" && typeof message.active === "boolean") {
    return sendResult(checkPagePresence(sender, message.active), sendResponse);
  }
  if (type === "baby:connection:open") {
    chrome.runtime.openOptionsPage().catch(() => {});
    return;
  }
  if (type === "saathi:status") {
    return sendResult(connectionStatus(), sendResponse);
  }
  if (type !== "saathi:analyze") return;
  const body = sanitizePayload(message.payload, sender);
  if (!body) {
    sendResponse({ error: "invalid-page" });
    return;
  }
  return sendResult(petRequest("/api/page-analysis", body, message.payload.attachments?.length ? 95000 : 28000), sendResponse);
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!Number.isInteger(tab.id)) return;
  try {
    const status = await chrome.tabs.sendMessage(tab.id, { type: toggle }, { frameId: 0 });
    if (status?.toggled) return;
  } catch {
    // A tab opened before installation needs to be reloaded before the pet can appear.
  }
  await chrome.tabs.create({ url: chrome.runtime.getURL("help.html") }).catch(() => {});
});
