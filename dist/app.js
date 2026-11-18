import { locales } from "./locale.js";
import { replyLocally } from "./assistant.js";
import { createVoice } from "./voice.js";
import { attachmentAccept, validateFiles, encodeAttachment } from "./attachments.js";
import { mountAvatar } from "./avatar.js";

const icons = {
  sparkles: '<path d="M10 2c.8 6.1 2.6 7.9 8.7 8.7-6.1.8-7.9 2.6-8.7 8.7-.8-6.1-2.6-7.9-8.7-8.7C7.4 9.9 9.2 8.1 10 2Z" fill="currentColor" stroke="none"/><path d="M19 13c.4 3 1.3 3.9 4.3 4.3-3 .4-3.9 1.3-4.3 4.3-.4-3-1.3-3.9-4.3-4.3 3-.4 3.9-1.3 4.3-4.3Z" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
  sliders: '<path d="M5 4v7m0 4v5m7-16v3m0 4v9m7-16v10m0 4v2M2.5 11h5m2-4h5m2 7h5"/>',
  "chevron-right": '<path d="m9 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  chat: '<path d="M8 18H5l1-4a7 7 0 0 1-1-3.5C5 6.9 8.3 4 12.5 4S20 6.9 20 10.5 16.7 17 12.5 17c-1 0-1.9-.2-2.7-.4L8 18Z"/>',
  wave: '<path d="M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4"/>',
  volume: '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a4.5 4.5 0 0 1 0 6m2.5-8.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4V5Zm5 5 5 5m0-5-5 5"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11v1a6 6 0 0 0 12 0v-1m-6 7v3m-3 0h6"/>',
  send: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  edit: '<path d="m14.5 5.5 4 4M5 16l-1 4 4-1L20 7l-4-4L5 16Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 14h10l1-14M10 10v6m4-6v6"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  plan: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M8 3v5m8-5v5m-7 7h6"/>',
  write: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  list: '<path d="m3 6 1.5 1.5L7 5m-4 7 1.5 1.5L7 11m-4 7 1.5 1.5L7 17M10 6h10m-10 6h10m-10 6h10"/>',
  paperclip: '<path d="m8 13 6.8-6.8a3 3 0 1 1 4.2 4.2l-8.6 8.6a4.6 4.6 0 1 1-6.5-6.5l8-8m4.6 4.4-7.7 7.7a1.4 1.4 0 0 1-2-2l7.4-7.4"/>',
  file: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Zm0 0v7h7M8 14h8m-8 3h6"/>',
  pet: '<rect x="3" y="7" width="18" height="14" rx="5"/><path d="M12 7V3m0 0h.01M8.5 13v2m7-2v2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  moon: '<path d="M19.6 15.1A8.2 8.2 0 0 1 9 4.4 8.3 8.3 0 1 0 19.6 15.1Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19"/>',
  rotate: '<path d="M19 9a7 7 0 1 0 0 6m0-10v4h-4"/>',
  fact: '<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Zm6 14v5m-2.5-2.5h5"/>',
  arrow: '<path d="M6 18 18 6M8 6h10v10"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  retry: '<path d="M19 8a8 8 0 1 0 1 8m-1-8V3m0 5h-5"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01m3.5 0h.01m3.5 0h.01m3.5 0h.01M8 14h8"/>',
};

function svg(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + icons[name] + '</svg>';
}

const $ = (id) => document.getElementById(id);
const storeKey = "saathi.voice.v1";
const saved = readStorage();
const backgrounds = new Set(["sky", "glacier", "cobalt"]);
const prefs = {
  mode: saved.prefs?.mode === "voice" ? "voice" : "chat",
  background: backgrounds.has(saved.prefs?.background) ? saved.prefs.background : "sky",
  colorMode: saved.prefs?.colorMode === "dark" ? "dark" : "light",
  autoSpeak: saved.prefs?.autoSpeak !== false,
  autoSend: saved.prefs?.autoSend !== false,
  rate: Math.min(1.35, Math.max(.7, Number(saved.prefs?.rate) || 1)),
  voiceURI: saved.prefs?.voiceURI ?? saved.prefs?.voices?.en ?? "",
};
let conversations = Array.isArray(saved.conversations) ? saved.conversations : [];
let currentId = conversations.some((chat) => chat.id === saved.currentId) ? saved.currentId : null;
const drafts = new Map();
const chatFiles = new Map();
const submittedFileIds = new Map();
let speechStatus = "idle";
let recording = null;
let job = null;
let engineConnected = false;
let attachmentsEnabled = false;
let hostedMode = false;
let pairingTimer;
let dialogChatId = null;
let noticeTimer;

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(storeKey)) || {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(storeKey, JSON.stringify({ prefs, conversations, currentId }));
  } catch {
    showNotice("Browser storage is full or unavailable. You can still export this conversation.", 7000);
  }
}

const t = () => locales.en;
const activeChat = () => conversations.find((chat) => chat.id === currentId);
const activeFiles = () => chatFiles.get(currentId) ?? [];
const canReadAloud = (message) => message.role === "assistant" && (!message.language || message.language === "en");
const makeId = () => globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
const speedFormat = new Intl.NumberFormat("en", { minimumFractionDigits: 2 });

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}

function setIcon(element, name) {
  if (element.dataset.renderedIcon === name) return;
  element.innerHTML = svg(name);
  element.dataset.renderedIcon = name;
}

function setLabel(element, label) {
  element.setAttribute("aria-label", label);
  element.title = label;
}

function iconButton(icon, label, handler) {
  const button = node("button", "icon-button small");
  button.type = "button";
  setIcon(button, icon);
  setLabel(button, label);
  button.addEventListener("click", handler);
  return button;
}

function hasNewFiles() {
  const submitted = submittedFileIds.get(currentId);
  return activeFiles().some(({ id }) => !submitted?.has(id));
}

function attachmentChip(file, remove) {
  const item = node("li", "attachment-chip");
  const icon = node("span");
  setIcon(icon, "file");
  const details = node("span");
  const name = node("span", "attachment-name", file.name);
  name.title = file.name;
  details.append(name);
  if (file.size >= 1024 * 1024) {
    details.append(node("span", "attachment-size", (file.size / (1024 * 1024)).toFixed(1) + " MB"));
  } else if (file.size > 0) {
    details.append(node("span", "attachment-size", Math.max(1, Math.ceil(file.size / 1024)) + " KB"));
  }
  item.append(icon, details);
  if (remove) item.append(iconButton("x", "Remove " + file.name, remove));
  return item;
}

function renderAttachments() {
  const files = activeFiles();
  const queue = $("attachment-queue");
  queue.hidden = files.length === 0;
  queue.replaceChildren(...files.map((file) => attachmentChip(file, () => {
    chatFiles.set(currentId, activeFiles().filter(({ id }) => id !== file.id));
    renderAttachments();
    $("attach").focus();
  })));
  updateSend();
}

const voice = createVoice({
  onState(state) {
    speechStatus = state;
    renderStatus();
  },
  onTranscript(text, { final }) {
    if (!recording) return;
    const base = recording.draft.trimEnd();
    const complete = [base, text].filter(Boolean).join(base.includes("\n") ? "\n" : " ");
    const limit = $("draft").maxLength;
    setDraft(complete.slice(0, limit));
    if (final) {
      recording = null;
      if (prefs.autoSend && complete.length <= limit && complete.trim()) {
        submitMessage(complete);
      } else {
        if (complete.length > limit) {
          showNotice("The message reached its length limit. Review it before sending.");
        }
        $("draft").focus();
      }
    }
  },
  onError(code) {
    const errorText = {
      "recognition-unsupported": "micUnsupported", "synthesis-unsupported": "speakerUnsupported",
      "not-allowed": "micDenied", "service-not-allowed": "micDenied", "audio-capture": "micUnavailable",
      network: "micNetwork", "no-speech": "micNoSpeech", "language-not-supported": "micNetwork",
      "recognition-failed": "micNoSpeech", "voice-unavailable": "voiceUnavailable",
      "speech-blocked": "voiceError", "speech-failed": "voiceError",
    };
    if (["recognition-unsupported", "not-allowed", "service-not-allowed", "audio-capture", "network", "no-speech", "language-not-supported", "recognition-failed", "aborted"].includes(code)) {
      if (recording) setDraft(recording.draft);
      recording = null;
    }
    if (errorText[code]) showNotice(t()[errorText[code]]);
  },
});

function localize() {
  const dictionary = t();
  document.querySelector(".mode-tabs").setAttribute("aria-label", "Conversation mode");
  for (const element of document.querySelectorAll("[data-text]")) element.textContent = dictionary[element.dataset.text];
  for (const element of document.querySelectorAll("[data-label]")) setLabel(element, dictionary[element.dataset.label]);
  for (const element of document.querySelectorAll("[data-aria]")) element.setAttribute("aria-label", dictionary[element.dataset.aria]);
  for (const element of document.querySelectorAll("[data-field]")) element.placeholder = dictionary[element.dataset.field];
  $("speech-privacy").textContent = "Your browser may use an online speech recognition service for dictation.";
  renderEngine();
  renderSettings();
}

function renderEngine() {
  $("engine-label").textContent = engineConnected ? t().aiMode : t().localMode;
  $("engine-description").textContent = engineConnected
    ? "Your model is connected. It receives recent chat turns and any files attached to the chat when you send a message."
    : t().modeLocalDescription;
  $("engine-note").textContent = engineConnected ? "" : t().engineNote;
}

function renderHostedControls() {
  $("hosted-pairing").hidden = !hostedMode;
  $("hosted-sign-out").hidden = !hostedMode;
  $("pet-run-local").hidden = hostedMode;
  $("pet-run-hosted").hidden = !hostedMode;
  if (hostedMode) $("pairing-origin").value = location.origin;
}

async function createPairingCode() {
  const button = $("pairing-generate");
  const status = $("pairing-message");
  button.disabled = true;
  status.textContent = "Creating a connection code…";
  try {
    const result = await fetch("./api/pet/pair-code", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}", cache: "no-store", redirect: "error",
    });
    if (result.status === 401) {
      status.textContent = "Sign in again to create a connection code.";
      return;
    }
    if (result.status === 429) {
      status.textContent = "Wait a moment before creating another code.";
      return;
    }
    const data = await result.json();
    if (!result.ok || !/^BABY-[A-Za-z0-9_-]{20}$/u.test(data?.code ?? "")
      || !Number.isInteger(data?.expiresIn) || data.expiresIn <= 0 || data.expiresIn > 900
      || data.origin !== location.origin) throw new Error("pairing-response");
    clearTimeout(pairingTimer);
    $("pairing-code").value = data.code;
    $("pairing-result").hidden = false;
    const minutes = Math.ceil(data.expiresIn / 60);
    status.textContent = "Use this code once within " + minutes + (minutes === 1 ? " minute." : " minutes.");
    pairingTimer = setTimeout(() => {
      $("pairing-result").hidden = true;
      $("pairing-code").value = "";
      status.textContent = "The code expired. Create a new one to connect.";
    }, data.expiresIn * 1000);
  } catch {
    status.textContent = "A code couldn’t be created. Check your connection and try again.";
  } finally {
    button.disabled = false;
  }
}

function renderSettings() {
  const select = $("voice-select");
  const voices = voice.getVoices().filter((option) => option.lang.toLowerCase().split(/[-_]/u)[0] === "en");
  select.replaceChildren(new Option(t().browserDefault, ""), ...voices.map((option) => new Option(option.name + " (" + option.lang + ")", option.voiceURI)));
  select.value = voices.some((option) => option.voiceURI === prefs.voiceURI) ? prefs.voiceURI : "";
  select.disabled = !voice.canSpeak;
  $("rate").value = prefs.rate;
  $("rate").disabled = !voice.canSpeak;
  $("rate-value").value = speedFormat.format(prefs.rate) + "×";
  $("auto-speak").checked = prefs.autoSpeak;
  $("auto-send").checked = prefs.autoSend;
}

function renderSuggestions() {
  $("suggestions").replaceChildren(...t().suggestions.map((suggestion) => {
    const button = node("button", "suggestion");
    button.type = "button";
    button.dataset.kind = suggestion.id;
    const icon = node("span", "suggestion-icon");
    icon.dataset.icon = suggestion.id;
    const arrow = node("span", "suggestion-arrow");
    arrow.dataset.icon = "arrow";
    setIcon(icon, suggestion.id);
    setIcon(arrow, "arrow");
    button.append(icon, node("span", "", suggestion.label), arrow);
    button.addEventListener("click", () => submitMessage(suggestion.prompt));
    return button;
  }));
}

function renderStatus() {
  const status = job ? "thinking" : speechStatus;
  $("main").dataset.state = status;
  $("hero-status").textContent = t()[status === "idle" ? "ready" : status];
  $("voice-control").hidden = prefs.mode !== "voice";
  $("voice-hint").textContent = status === "idle" ? t().micHint : t()[status === "listening" ? "recordingHint" : status];

  const speaker = $("speaker");
  setIcon(speaker, speechStatus === "speaking" ? "stop" : prefs.autoSpeak ? "volume" : "mute");
  setLabel(speaker, speechStatus === "speaking" ? t().stop : prefs.autoSpeak ? t().mute : t().unmute);
  speaker.setAttribute("aria-pressed", prefs.autoSpeak);
  $("test-voice").disabled = !voice.canSpeak;
  $("test-voice-label").textContent = speechStatus === "speaking"
    ? t().stop
    : "Play voice sample";
  for (const mic of [$("mic"), $("large-mic")]) {
    const listening = speechStatus === "listening";
    setIcon(mic, listening ? "stop" : "mic");
    setLabel(mic, listening ? t().stopMic : t().mic);
    mic.setAttribute("aria-pressed", listening);
  }

  const footer = $("footer-status");
  footer.replaceChildren();
  const icon = node("span");
  setIcon(icon, status === "listening" ? "mic" : status === "speaking" ? "volume" : "keyboard");
  footer.append(icon, document.createTextNode(status === "idle" ? t().chatHint : t()[status]));
  updateSend();
}

function updateSend() {
  const send = $("send");
  if (job) {
    send.type = "button";
    send.disabled = false;
    setLabel(send, t().stopReply);
    setIcon(send, "stop");
  } else {
    send.type = "submit";
    send.disabled = !$("draft").value.trim() && !hasNewFiles();
    setLabel(send, t().send);
    setIcon(send, "send");
  }
}

function renderHistory() {
  const query = $("search").value.trim().toLocaleLowerCase("en");
  const filtered = conversations.filter((chat) => {
    if (!query) return true;
    return [chat.title, ...chat.messages.flatMap((message) => [message.text, ...(message.attachments ?? []).map(({ name }) => name)])]
      .some((text) => text.toLocaleLowerCase("en").includes(query));
  }).sort((a, b) => b.updated - a.updated);
  $("history-empty").hidden = filtered.length !== 0;
  $("history-empty").textContent = query ? t().noSearchResults : t().noHistory;
  $("history").replaceChildren(...filtered.map((chat) => {
    const button = node("button");
    button.type = "button";
    button.setAttribute("aria-current", chat.id === currentId ? "true" : "false");
    button.title = chat.title;
    const icon = node("span");
    setIcon(icon, "chat");
    button.append(icon, node("span", "history-title", chat.title));
    button.addEventListener("click", () => openChat(chat.id));
    return button;
  }));
}

function renderChat({ scroll = false } = {}) {
  const chat = activeChat();
  const messages = chat?.messages ?? [];
  const pending = job?.chatId === currentId ? job : null;
  const last = messages.at(-1);
  const hasMessages = messages.length > 0;
  $("scene").classList.toggle("has-messages", hasMessages);
  $("transcript").hidden = !hasMessages;
  $("thread-actions").hidden = !hasMessages;
  $("replay-last").hidden = !messages.some(canReadAloud);
  $("heading").textContent = prefs.mode === "voice" ? t().voiceHeading : t().heading;
  $("welcome-copy").textContent = prefs.mode === "voice" && prefs.autoSend
    ? "Tap the mic and speak. I’ll reply when you’re done."
    : prefs.mode === "voice" ? t().voiceWelcome : t().welcome;
  $("quick-start").hidden = prefs.mode === "voice";
  const items = messages
    .filter((message) => message !== pending?.replacing)
    .map((message) => renderMessage(message, message === last && !pending));
  if (pending) items.push(renderMessage({ role: "assistant", text: pending.partial || t().thinking }, false, true));
  $("transcript").replaceChildren(...items);
  if (scroll) $("scene").scrollTop = $("scene").scrollHeight;
}

function renderMessage(message, latest, pending = false) {
  const article = node("article", "message " + message.role + (pending ? " waiting" : ""));
  const meta = node("div", "message-meta");
  if (message.role === "assistant") {
    const image = node("img");
    image.src = "./pet.webp";
    image.alt = "";
    meta.append(image);
  }
  meta.append(node("span", "", message.role === "user" ? t().you : t().name));
  const text = node("div", "message-text", message.text);
  text.lang = message.language || "en";
  article.append(meta);
  if (message.attachments?.length) {
    const files = node("ul", "message-files");
    files.setAttribute("aria-label", "Attachments");
    files.append(...message.attachments.map((file) => attachmentChip(file)));
    article.append(files);
  }
  article.append(text);
  if (pending) {
    article.id = "pending-message";
    return article;
  }
  const actions = node("div", "message-actions");
  const copy = iconButton("copy", t().copy, async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setLabel(copy, t().copied);
      setIcon(copy, "check");
      setTimeout(() => {
        setIcon(copy, "copy");
        setLabel(copy, t().copy);
      }, 1600);
    } catch {
      showNotice("Select the message text to copy it.");
    }
  });
  actions.append(copy);
  if (message.role === "assistant") {
    if (canReadAloud(message)) actions.append(iconButton("volume", t().replay, () => play(message)));
    if (latest) actions.append(iconButton("retry", t().regenerate, () => generateReply(activeChat(), message)));
  } else if (latest) {
    actions.append(iconButton("retry", t().retry, () => generateReply(activeChat())));
  }
  article.append(actions);
  return article;
}

function scheduleNoticeHide(delay) {
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(hideNotice, delay);
}

function showNotice(text, delay = 6200) {
  if ($("settings-dialog").open) {
    $("voice-feedback").textContent = text;
    $("voice-feedback").hidden = false;
    return;
  }
  $("notice-text").textContent = text;
  $("notice").hidden = false;
  scheduleNoticeHide(delay);
}

function hideNotice() {
  clearTimeout(noticeTimer);
  $("notice").hidden = true;
  $("voice-feedback").hidden = true;
}

function setDraft(value) {
  $("draft").value = value;
  resizeDraft();
}

function resizeDraft() {
  const draft = $("draft");
  draft.style.height = "auto";
  draft.style.height = Math.min(126, draft.scrollHeight) + "px";
  updateSend();
}

function abortRecording() {
  const draft = recording?.draft;
  recording = null;
  voice.cancelListening();
  if (draft !== undefined) setDraft(draft);
}

function openChat(id) {
  abortRecording();
  stopJob();
  voice.stopSpeaking();
  drafts.set(currentId, $("draft").value);
  currentId = id;
  setDraft(drafts.get(id) ?? "");
  renderAttachments();
  closeActions();
  if (!$("settings-dialog").open && !$("engine-dialog").open) toggleSidebar(false);
  hideNotice();
  persist();
  renderHistory();
  renderChat({ scroll: true });
  renderStatus();
}

function setMode(mode) {
  prefs.mode = mode;
  $("main").dataset.mode = mode;
  for (const button of document.querySelectorAll("[data-mode-choice]")) {
    button.setAttribute("aria-pressed", button.dataset.modeChoice === mode);
  }
  renderChat();
  renderStatus();
  persist();
}

function setBackground(background) {
  if (!backgrounds.has(background)) return;
  prefs.background = background;
  document.documentElement.dataset.background = background;
  for (const button of document.querySelectorAll("[data-background-choice]")) {
    button.setAttribute("aria-pressed", button.dataset.backgroundChoice === background);
  }
  persist();
}

function setColorMode(mode) {
  const dark = mode === "dark";
  prefs.colorMode = dark ? "dark" : "light";
  document.documentElement.dataset.colorMode = prefs.colorMode;
  document.querySelector('meta[name="theme-color"]').content = dark ? "#101b2c" : "#e8f4ff";
  const button = $("color-mode");
  button.setAttribute("aria-pressed", dark);
  setIcon(button, dark ? "sun" : "moon");
  setLabel(button, dark ? "Switch to light mode" : "Switch to dark mode");
  persist();
}

function play(message) {
  if (!message) return;
  hideNotice();
  abortRecording();
  voice.speak(message.text, "en", { voiceURI: prefs.voiceURI, rate: prefs.rate });
}

function toggleMicrophone() {
  if (speechStatus === "listening") {
    voice.stopListening();
    return;
  }
  hideNotice();
  stopJob();
  voice.stopSpeaking();
  recording = { draft: $("draft").value };
  if (!voice.startListening("en")) recording = null;
}

function submitMessage(raw) {
  const prompt = raw.trim();
  const files = activeFiles();
  const addingFiles = hasNewFiles();
  const text = prompt || (addingFiles ? "Summarize and analyze the attached files." : "");
  if (!text || job) return;
  hideNotice();
  abortRecording();
  voice.stopSpeaking();
  let chat = activeChat();
  if (!chat) {
    const title = prompt || files[0]?.name || text;
    chat = { id: makeId(), title: Array.from(title.replace(/\s+/gu, " ")).slice(0, 57).join(""), updated: Date.now(), messages: [] };
    conversations.unshift(chat);
    currentId = chat.id;
    drafts.delete(null);
    chatFiles.delete(null);
    if (files.length) chatFiles.set(currentId, files);
  }
  const message = { role: "user", text, language: "en", date: Date.now() };
  if (addingFiles) {
    message.attachments = files.map(({ name, mimeType, size }) => ({ name, mimeType, size }));
  }
  submittedFileIds.set(currentId, new Set(files.map(({ id }) => id)));
  chat.messages.push(message);
  chat.updated = Date.now();
  setDraft("");
  persist();
  renderHistory();
  generateReply(chat);
}

function stopJob() {
  if (!job) return;
  job.controller.abort();
  job = null;
  renderChat({ scroll: true });
  renderStatus();
}

function buildModelRequest(history, attachments) {
  const encoder = new TextEncoder();
  const messages = [];
  let bytes = 256;
  for (const { role, text } of history.slice(-24).reverse()) {
    const message = { role, text };
    bytes += encoder.encode(JSON.stringify(message)).byteLength + 1;
    if (bytes > 120 * 1024) break;
    messages.unshift(message);
  }
  if (attachments.length) messages.at(-1).attachments = attachments;
  return JSON.stringify({ language: "en", messages });
}

async function generateReply(chat, replacing = null) {
  if (job || !chat || chat.id !== currentId) return;
  const history = replacing ? chat.messages.slice(0, -1) : [...chat.messages];
  const files = activeFiles();
  if (history.at(-1)?.attachments?.length && !files.length) {
    showNotice("Attach the files again to retry this reply.");
    return;
  }
  if (files.length && !attachmentsEnabled) {
    showNotice(t().attachmentsUnavailable);
    return;
  }
  const request = { chatId: chat.id, controller: new AbortController(), partial: "", replacing };
  job = request;
  abortRecording();
  voice.stopSpeaking();
  hideNotice();
  renderChat({ scroll: true });
  renderStatus();
  let text;
  try {
    if (engineConnected) {
      let attachments;
      try {
        attachments = await Promise.all(files.map(encodeAttachment));
      } catch {
        throw new Error("file-read-failed");
      }
      if (job !== request) return;
      const result = await fetch("./api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: buildModelRequest(history, attachments),
        signal: request.controller.signal,
      });
      const mime = result.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      if (!result.ok || mime !== "text/plain" || !result.body) {
        const problem = mime === "application/json" ? await result.json().catch(() => null) : null;
        throw new Error(problem?.error || "model");
      }
      const reader = result.body.pipeThrough(new TextDecoderStream()).getReader();
      try {
        while (job === request) {
          const chunk = await reader.read();
          if (chunk.done) break;
          request.partial += chunk.value;
          if (request.partial.length > 20000) throw new Error("response length");
          const textElement = $("pending-message")?.querySelector(".message-text");
          if (textElement) {
            const scene = $("scene");
            const atBottom = scene.scrollHeight - scene.clientHeight - scene.scrollTop < 70;
            textElement.textContent = request.partial;
            if (atBottom) scene.scrollTop = scene.scrollHeight;
          }
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      text = request.partial;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (job !== request) return;
      text = await replyLocally(history, "en");
    }
    if (job !== request) return;
    if (!text?.trim()) throw new Error("empty reply");
    const reply = { role: "assistant", text: text.trim(), language: "en", date: Date.now() };
    if (replacing) chat.messages.splice(chat.messages.indexOf(replacing), 1, reply);
    else chat.messages.push(reply);
    chat.updated = Date.now();
    persist();
    job = null;
    renderChat({ scroll: true });
    renderHistory();
    renderStatus();
    if (prefs.autoSpeak && voice.canSpeak) play(reply);
  } catch (error) {
    if (job !== request) return;
    job = null;
    renderChat({ scroll: true });
    renderStatus();
    if (error.message === "provider-unconfigured") {
      engineConnected = false;
      attachmentsEnabled = false;
      renderEngine();
      showNotice(t().modelNeedsKey);
    } else {
      const message = {
        "provider-auth": t().modelKeyError,
        "provider-rate-limited": t().modelLimitError,
        "attachments-unavailable": t().attachmentsUnavailable,
        "invalid-attachment": "One of the files could not be read. Remove it and attach it again.",
        "unsupported-attachment": "One of the files has an unsupported format.",
        "attachment-too-large": "Each attachment must be 8 MB or smaller.",
        "attachments-too-large": "The files must add up to 12 MB or less.",
        "too-many-attachments": "You can include up to three files in a chat.",
        "audio-transcription-failed": "I couldn’t transcribe the audio. Try a clear recording in a supported format.",
        "provider-attachment-rejected": "OpenAI couldn’t read one of the files. Try reopening it and saving a fresh copy.",
        "file-read-failed": "The browser couldn’t read one of the files. Attach it again to retry.",
      }[error.message];
      showNotice(message ?? t().responseError);
    }
  }
}

function toggleSidebar(open) {
  $("sidebar").classList.toggle("is-open", open);
  $("backdrop").hidden = !open;
  $("open-sidebar").setAttribute("aria-expanded", open);
  if (open) $("new-chat").focus();
  else if ($("sidebar").contains(document.activeElement) && matchMedia("(max-width: 850px)").matches) $("open-sidebar").focus();
}

function closeActions() {
  $("actions-menu").hidden = true;
  $("more").setAttribute("aria-expanded", false);
}

function toggleBackgroundMenu(open) {
  $("background-menu").hidden = !open;
  $("background-toggle").setAttribute("aria-expanded", open);
  if (open) $("background-menu").querySelector('[aria-pressed="true"]')?.focus();
}

function exportChat(chat) {
  if (!chat) return;
  const lines = [chat.title, ""];
  for (const message of chat.messages) {
    lines.push(message.role === "user" ? t().you : t().name);
    if (message.attachments?.length) lines.push("Attachments " + message.attachments.map(({ name }) => name).join(", "));
    lines.push(message.text, "");
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
  link.download = chat.title.replace(/[<>:"/\\|?*\u0000-\u001F]/gu, "-").trim().slice(0, 60) + ".txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

for (const element of document.querySelectorAll("[data-icon]")) setIcon(element, element.dataset.icon);
for (const button of document.querySelectorAll("[data-mode-choice]")) button.addEventListener("click", () => setMode(button.dataset.modeChoice));
for (const button of document.querySelectorAll("[data-background-choice]")) {
  button.addEventListener("click", () => {
    setBackground(button.dataset.backgroundChoice);
    toggleBackgroundMenu(false);
    $("background-toggle").focus();
  });
}
$("background-toggle").addEventListener("click", () => toggleBackgroundMenu($("background-menu").hidden));
$("color-mode").addEventListener("click", () => setColorMode(prefs.colorMode === "dark" ? "light" : "dark"));
$("pet-guide").addEventListener("click", () => $("pet-dialog").showModal());
$("pairing-generate").addEventListener("click", createPairingCode);
$("pairing-copy").addEventListener("click", async () => {
  const input = $("pairing-code");
  if (!input.value) return;
  try {
    await navigator.clipboard.writeText(input.value);
    $("pairing-message").textContent = "Code copied.";
  } catch {
    input.focus();
    input.select();
    $("pairing-message").textContent = "Copy the selected code into the extension.";
  }
});
if (location.protocol === "file:") $("pet-download").href = "./dist/baby-page-pet.zip";
for (const button of document.querySelectorAll("[data-close]")) button.addEventListener("click", () => button.closest("dialog").close());
for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}
$("open-sidebar").addEventListener("click", () => toggleSidebar(!$("sidebar").classList.contains("is-open")));
$("backdrop").addEventListener("click", () => toggleSidebar(false));
$("new-chat").addEventListener("click", () => {
  openChat(null);
  setDraft("");
  drafts.delete(null);
  chatFiles.delete(null);
  renderAttachments();
  $("draft").focus();
});
$("search-toggle").addEventListener("click", () => {
  const wasHidden = $("search").hidden;
  $("search").hidden = !wasHidden;
  $("search-toggle").setAttribute("aria-expanded", wasHidden);
  if (wasHidden) $("search").focus();
  else $("search").value = "";
  renderHistory();
});
$("search").addEventListener("input", renderHistory);
$("more").addEventListener("click", () => {
  const opening = $("actions-menu").hidden;
  $("actions-menu").hidden = !opening;
  $("more").setAttribute("aria-expanded", opening);
  if (opening) $("rename").focus();
});
document.addEventListener("click", (event) => {
  if (!$("thread-actions").contains(event.target)) closeActions();
  if (!$("background-toggle").parentElement.contains(event.target)) toggleBackgroundMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!$("actions-menu").hidden) {
    closeActions();
    $("more").focus();
  } else if (!$("background-menu").hidden) {
    toggleBackgroundMenu(false);
    $("background-toggle").focus();
  } else if ($("sidebar").classList.contains("is-open") && !document.querySelector("dialog[open]")) {
    toggleSidebar(false);
  }
});
$("settings").addEventListener("click", () => {
  renderSettings();
  $("voice-feedback").hidden = true;
  $("settings-dialog").showModal();
});
$("engine").addEventListener("click", () => $("engine-dialog").showModal());
$("notice-close").addEventListener("click", hideNotice);
$("mic").addEventListener("click", toggleMicrophone);
$("large-mic").addEventListener("click", toggleMicrophone);
$("replay-last").addEventListener("click", () => play(activeChat()?.messages.findLast(canReadAloud)));
$("file-input").accept = attachmentAccept;
$("attach").addEventListener("click", () => {
  if (attachmentsEnabled) $("file-input").click();
  else showNotice(t().attachmentsUnavailable);
});
$("file-input").addEventListener("change", () => {
  const input = $("file-input");
  const files = activeFiles();
  const { accepted, errors } = validateFiles(input.files, files);
  input.value = "";
  if (accepted.length) {
    chatFiles.set(currentId, [...files, ...accepted]);
    renderAttachments();
  }
  if (errors.length) showNotice(errors[0]);
  else hideNotice();
});
$("speaker").addEventListener("click", () => {
  if (speechStatus === "speaking") voice.stopSpeaking();
  else {
    prefs.autoSpeak = !prefs.autoSpeak;
    renderSettings();
    renderStatus();
    persist();
    if (prefs.autoSpeak && !voice.canSpeak) showNotice(t().speakerUnsupported);
  }
});
$("test-voice").addEventListener("click", () => {
  if (speechStatus === "speaking") voice.stopSpeaking();
  else play({ text: "Hi, I’m BABY. It’s good to hear from you." });
});
$("voice-select").addEventListener("change", () => {
  prefs.voiceURI = $("voice-select").value;
  persist();
});
$("rate").addEventListener("input", () => {
  prefs.rate = Number($("rate").value);
  $("rate-value").value = speedFormat.format(prefs.rate) + "×";
  persist();
});
$("auto-send").addEventListener("change", () => {
  prefs.autoSend = $("auto-send").checked;
  persist();
  renderChat();
});
$("auto-speak").addEventListener("change", () => {
  prefs.autoSpeak = $("auto-speak").checked;
  if (!prefs.autoSpeak) voice.stopSpeaking();
  persist();
  renderStatus();
});
$("draft").addEventListener("input", () => {
  if (recording) {
    recording = null;
    voice.cancelListening();
  }
  resizeDraft();
});
$("draft").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    if (matchMedia("(pointer: coarse)").matches) return;
    event.preventDefault();
    submitMessage($("draft").value);
  }
});
$("composer").addEventListener("submit", (event) => {
  event.preventDefault();
  submitMessage($("draft").value);
});
$("send").addEventListener("click", (event) => {
  if (!job) return;
  event.preventDefault();
  stopJob();
});
$("rename").addEventListener("click", () => {
  const chat = activeChat();
  if (!chat) return;
  dialogChatId = chat.id;
  closeActions();
  $("title-input").value = chat.title;
  $("rename-dialog").showModal();
  $("title-input").select();
});
$("rename-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const chat = conversations.find(({ id }) => id === dialogChatId);
  const title = $("title-input").value.trim();
  if (!chat || !title) return;
  chat.title = title;
  $("rename-dialog").close();
  persist();
  renderHistory();
});
$("export").addEventListener("click", () => {
  closeActions();
  exportChat(activeChat());
});
$("delete").addEventListener("click", () => {
  dialogChatId = currentId;
  closeActions();
  $("delete-dialog").showModal();
});
$("confirm-delete").addEventListener("click", () => {
  $("delete-dialog").close();
  conversations = conversations.filter(({ id }) => id !== dialogChatId);
  if (currentId === dialogChatId) openChat(null);
  drafts.delete(dialogChatId);
  chatFiles.delete(dialogChatId);
  submittedFileIds.delete(dialogChatId);
  persist();
  renderHistory();
});
voice.onVoicesChanged(renderSettings);

localize();
renderSuggestions();
renderHistory();
setBackground(prefs.background);
setColorMode(prefs.colorMode);
setMode(prefs.mode);
resizeDraft();
renderChat({ scroll: true });
const unmountAvatar = mountAvatar($("avatar-stage"));
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) unmountAvatar();
});

if (location.protocol !== "file:") {
  fetch("./api/status", { headers: { Accept: "application/json" } })
    .then((response) => response.ok && response.headers.get("content-type")?.includes("application/json") ? response.json() : null)
    .then((status) => {
      engineConnected = status?.connected === true;
      attachmentsEnabled = engineConnected && status?.attachments === true;
      hostedMode = status?.hosted === true;
      renderEngine();
      renderHostedControls();
    })
    .catch(() => {});
}
