(() => {
  const localOrigin = "http://127.0.0.1:4173";
  if (location.origin === localOrigin || (location.hostname === "localhost" && location.port === "4173")
    || document.querySelector("[data-saathi-pet-root]")) return;

  const context = globalThis.SaathiPageContext;
  const capabilities = globalThis.BabyPetCapabilities;
  const preferences = Object.freeze({ placement: "babyPetPlacement", theme: "babyPetTheme", speech: "babyPetReadAloud" });
  const svgPaths = {
    close: "m6 6 12 12M6 18 18 6",
    page: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zm0 0v6h6M8 13h8m-8 4h5",
    send: "m3 11 17-7-7 17-2-8-8-2Zm8 2 9-9",
    spark: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z",
    settings: "m10 3-.5 2.3L7 6.7l-2.2-.8-2 3.5L4.5 11v2l-1.7 1.6 2 3.5 2.2-.8 2.5 1.4.5 2.3h4l.5-2.3 2.5-1.4 2.2.8 2-3.5-1.7-1.6v-2l1.7-1.6-2-3.5-2.2.8-2.5-1.4L14 3Zm2 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
    moon: "M20.8 14.4A9 9 0 0 1 9.6 3.2 9 9 0 1 0 20.8 14.4Z",
    sun: "M12 4V2m0 20v-2m10-8h-2M4 12H2m17.1-7.1-1.4 1.4M6.3 17.7l-1.4 1.4m14.2 0-1.4-1.4M6.3 6.3 4.9 4.9M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
    mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Zm-3 5v2a6 6 0 1 0 12 0v-2m-6 8v4m-3 0h6",
    speaker: "M3 9v6h4l5 4V5L7 9H3Zm12.5-.5a5 5 0 0 1 0 7m3-9.5a8.5 8.5 0 0 1 0 12",
    speakerOff: "M3 9v6h4l5 4V5L7 9H3Zm13 1 5 5m0-5-5 5",
    paperclip: "m8 13 6.8-6.8a3 3 0 1 1 4.2 4.2l-8.6 8.6a4.6 4.6 0 1 1-6.5-6.5l8-8m4.6 4.4-7.7 7.7a1.4 1.4 0 0 1-2-2l7.4-7.4",
    stop: "M6 6h12v12H6z",
  };

  function icon(name, className) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.65");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.setAttribute("class", className);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", svgPaths[name]);
    svg.append(path);
    return svg;
  }

  function element(tag, className, attributes = {}, children = []) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    for (const [name, value] of Object.entries(attributes)) item.setAttribute(name, value);
    item.append(...children);
    return item;
  }

  const host = element("saathi-page-pet", "", { "data-saathi-pet-root": "" });
  const shadow = host.attachShadow({ mode: "closed" });
  const style = new CSSStyleSheet();
  style.replaceSync(globalThis.SaathiPetTheme);
  shadow.adoptedStyleSheets = [style];

  const bot = element("span", "bot", {}, [
    element("span", "bot-ear left"),
    element("span", "bot-ear right"),
    element("span", "bot-shell"),
    element("span", "bot-visor", {}, [
      element("span", "bot-eye left"),
      element("span", "bot-eye right"),
      element("span", "bot-smile"),
    ]),
  ]);
  const tilt = element("span", "pet-tilt", {}, [bot]);
  const pet = element("button", "pet", {
    type: "button", "aria-label": "Open BABY Page Pet", "aria-expanded": "false",
    "aria-controls": "saathi-panel", "data-hint": "Click to chat · Drag to move",
    "aria-keyshortcuts": "ArrowUp ArrowDown ArrowLeft ArrowRight",
    "aria-description": "Drag BABY or use the arrow keys to move around the page.",
  }, [element("span", "pet-air", { "aria-hidden": "true" }, [tilt]), element("span", "open-light", { hidden: "" })]);
  const mini = element("span", "mini", { "aria-hidden": "true" }, [icon("spark", "mini-icon")]);
  const art = chrome.runtime.getURL("pet.webp");
  const heroImage = element("img", "pet-image", { src: art, alt: "", hidden: "", decoding: "async", draggable: "false" });
  const miniImage = element("img", "", { src: art, alt: "", hidden: "", decoding: "async", draggable: "false" });
  heroImage.addEventListener("load", () => {
    heroImage.hidden = false;
    tilt.classList.add("art-loaded");
  });
  miniImage.addEventListener("load", () => {
    miniImage.hidden = false;
    mini.replaceChildren(miniImage);
  });
  tilt.append(heroImage);
  mini.append(miniImage);

  const title = element("h2", "title", { id: "saathi-title" }, ["BABY"]);
  const indicator = element("span", "indicator", { "aria-hidden": "true" });
  const connectionText = element("span", "", {}, ["BABY assistant"]);
  const connection = element("div", "connection", { role: "status" }, [indicator, connectionText]);
  const volume = element("button", "icon-button voice-toggle", {
    type: "button", "aria-label": "Read replies aloud", "aria-pressed": "false", title: "Read replies aloud",
  }, [icon("speakerOff")]);
  const dark = element("button", "icon-button", {
    type: "button", "aria-label": "Dark mode", "aria-pressed": "false", title: "Dark mode",
  }, [icon("moon")]);
  const settings = element("button", "icon-button", {
    type: "button", "aria-label": "Connection settings", title: "Connection settings",
  }, [icon("settings")]);
  const close = element("button", "icon-button", { type: "button", "aria-label": "Close BABY", title: "Close BABY" }, [icon("close")]);
  const header = element("header", "header", {}, [
    mini, element("div", "header-main", {}, [title, connection]), volume, dark, settings, close,
  ]);

  const sourceTitle = element("span", "source-title");
  const sourceDomain = element("span", "source-domain");
  const source = element("div", "source", { "aria-label": "Current page" }, [icon("page"), sourceTitle, sourceDomain]);
  const log = element("div", "transcript", { role: "log", "aria-label": "Page conversation", "aria-live": "polite" });
  const notice = element("div", "notice", { role: "status", hidden: "" });
  const input = element("textarea", "question", {
    "aria-label": "Ask about this page", placeholder: "Ask about this page…", rows: "1", maxlength: "2000",
  });
  const attachmentsList = element("ul", "attachments", { "aria-label": "Attached files", hidden: "" });
  const fileInput = element("input", "", { type: "file", multiple: "", accept: capabilities.attachmentAccept, hidden: "" });
  const attachmentButton = element("button", "icon-button attachment-button", {
    type: "button", "aria-label": "Attach files", title: "Attach documents, images, or audio",
  }, [icon("paperclip")]);
  const microphone = element("button", "icon-button microphone", {
    type: "button", "aria-label": "Speak a question", title: "Speak a question",
  }, [icon("mic")]);
  const speechNotice = element("span", "speech-status", { role: "status", "aria-live": "polite" });
  const send = element("button", "icon-button send", { type: "submit", "aria-label": "Send question", disabled: "" }, [icon("send")]);
  const form = element("form", "composer", {}, [
    attachmentsList,
    fileInput,
    element("div", "composer-line", {}, [attachmentButton, input, microphone, send]),
    element("div", "composer-footer", {}, [
      element("p", "composer-hint", {}, ["Page text and files are sent only when you ask."]),
      speechNotice,
    ]),
  ]);
  const panel = element("section", "panel", {
    id: "saathi-panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "saathi-title", hidden: "",
  }, [header, source, log, notice, form]);
  shadow.append(element("div", "dock", {}, [panel, pet]));
  document.documentElement.append(host);

  const errors = {
    "server-offline": "Local BABY is unavailable. Start it on this computer and try again.",
    "provider-unconfigured": "Open BABY and connect OpenAI to analyze this page.",
    "provider-auth": "OpenAI rejected the connection. Check the credentials in BABY.",
    "provider-rate-limited": "The OpenAI usage limit was reached. Try again later.",
    "analysis-busy": "BABY is answering another page question. Try again in a moment.",
    "analysis-timeout": "The answer took too long. Try a shorter question or try again.",
    "page-empty": "There isn’t readable page text to analyze. Attach a file or try an article or search results page.",
    "invalid-page": "The page content could not be read. Reload the page and try again.",
    "invalid-question": "Enter a question under 2,000 characters.",
    "message-too-large": "This request is too large. Try smaller attachments or a shorter question.",
    "unsupported-page": "BABY opens on ordinary web pages.",
    "origin-forbidden": "BABY did not recognize this extension. Check that both are up to date.",
    "extension-auth-required": "Pair the pet with hosted BABY in Connection settings using a fresh code from your signed-in BABY.",
    "host-permission-required": "Allow the pet to access the hosted BABY in Connection settings.",
    "connection-unavailable": "The extension could not load its connection. Reload the extension and try again.",
    "invalid-attachment": "A file could not be read. Remove it and attach it again.",
    "unsupported-attachment": "One of the files has an unsupported format.",
    "attachment-too-large": "Each attachment must be 8 MB or smaller.",
    "attachments-too-large": "The files must add up to 12 MB or less.",
    "too-many-attachments": "You can include up to three files.",
    "attachments-unavailable": "Connect BABY to OpenAI to analyze attachments.",
    "audio-transcription-failed": "The recording could not be transcribed. Try a clearer recording or a different file.",
    "provider-attachment-rejected": "OpenAI could not read one of the files. Try saving a fresh copy.",
    "attachment-read": "The browser could not read a file. Attach it again to retry.",
  };
  let pageSession = location.href;
  let history = [];
  let attachments = [];
  let pending;
  let connectionRevision = 0;
  let activeConnection = { mode: "local", origin: localOrigin };
  let speechState = "idle";
  let micDraft = null;
  let readAloud = false;

  const voice = capabilities.createVoice({
    onState(state) {
      speechState = state;
      renderVoice();
    },
    onTranscript(text, { final }) {
      if (!micDraft || micDraft.pageSession !== location.href) return;
      const question = [micDraft.text.trimEnd(), text].filter(Boolean).join(" ");
      input.value = question.slice(0, 2000);
      updateSend();
      if (!final) return;
      micDraft = null;
      if (question.length > 2000) {
        showNotice("Your voice question is longer than 2,000 characters. Edit it before sending.");
        return;
      }
      if (text.trim()) analyze(question);
    },
    onError(code) {
      micDraft = null;
      showNotice(capabilities.voiceErrorMessage(code));
    },
  });

  function savePreference(key, value) {
    chrome.storage?.local?.set({ [key]: value })?.catch(() => {});
  }

  function setTheme(isDark) {
    host.dataset.theme = isDark ? "dark" : "light";
    dark.setAttribute("aria-pressed", String(isDark));
    dark.replaceChildren(icon(isDark ? "sun" : "moon"));
  }

  function renderVoice() {
    const listening = speechState === "listening";
    const speaking = speechState === "speaking";
    host.dataset.speech = speechState;
    microphone.setAttribute("aria-label", listening ? "Stop microphone" : "Speak a question");
    microphone.title = microphone.getAttribute("aria-label");
    microphone.setAttribute("aria-pressed", String(listening));
    microphone.replaceChildren(icon(listening ? "stop" : "mic"));
    volume.setAttribute("aria-pressed", String(readAloud));
    volume.replaceChildren(icon(speaking ? "stop" : readAloud ? "speaker" : "speakerOff"));
    volume.setAttribute("aria-label", speaking ? "Stop speaking" : "Read replies aloud");
    volume.title = volume.getAttribute("aria-label");
    speechNotice.textContent = listening ? "Listening…" : speaking ? "Speaking…" : "";
    updateSend();
  }

  function updateSend() {
    send.disabled = Boolean(pending) || (!input.value.trim() && !attachments.length);
    microphone.disabled = Boolean(pending);
    attachmentButton.disabled = Boolean(pending);
  }

  function renderAttachments() {
    const chips = attachments.map((file) => {
      const remove = element("button", "remove-attachment", {
        type: "button", "aria-label": "Remove " + file.name, title: "Remove " + file.name,
      }, [icon("close")]);
      remove.addEventListener("click", () => {
        attachments = attachments.filter(({ id }) => id !== file.id);
        renderAttachments();
        attachmentButton.focus({ preventScroll: true });
      });
      remove.disabled = Boolean(pending);
      return element("li", "attachment-chip", {}, [
        icon("page"),
        element("span", "file-name", { title: file.name }, [file.name]),
        remove,
      ]);
    });
    attachmentsList.replaceChildren(...chips);
    attachmentsList.hidden = !chips.length;
    updateSend();
    scheduleLayout();
  }

  function refreshSource() {
    sourceTitle.textContent = document.title.trim() || location.hostname;
    sourceTitle.title = sourceTitle.textContent;
    sourceDomain.textContent = location.hostname;
  }

  function clearNotice() {
    notice.hidden = true;
    notice.replaceChildren();
  }

  function showNotice(message) {
    notice.replaceChildren(message || "BABY could not complete this action.");
    notice.hidden = false;
    scheduleLayout();
  }

  function stopVoice() {
    micDraft = null;
    voice.cancelListening();
    voice.stopSpeaking();
  }

  function resetForNewPage() {
    if (pageSession === location.href) return;
    pageSession = location.href;
    history = [];
    attachments = [];
    pending = undefined;
    stopVoice();
    input.value = "";
    clearNotice();
    renderAttachments();
    renderConversation();
  }

  function messageNode(role, text, waiting = false) {
    const label = element("div", "message-label", {}, [role === "user" ? "You" : "BABY"]);
    if (role === "assistant" && !waiting && voice.canSpeak) {
      const replay = element("button", "reply-audio", {
        type: "button", "aria-label": "Play reply", title: "Play reply",
      }, [icon("speaker")]);
      replay.addEventListener("click", () => {
        micDraft = null;
        voice.cancelListening();
        voice.speak(text);
      });
      label.append(replay);
    }
    return element("article", "message " + role + (waiting ? " thinking" : ""), {}, [
      label, element("div", "bubble", {}, [text]),
    ]);
  }

  function renderConversation() {
    const entries = history.map(({ role, text }) => messageNode(role, text));
    if (pending) {
      entries.push(messageNode("user", pending.question));
      entries.push(messageNode("assistant", pending.files.length ? "Analyzing the page and files…" : "Reading the page…", true));
    } else if (!history.length) {
      const summary = element("button", "quick", { type: "button" }, ["Summarize"]);
      summary.addEventListener("click", () => analyze("Summarize this page in a few key points."));
      const points = element("button", "quick", { type: "button" }, ["Key facts"]);
      points.addEventListener("click", () => analyze("What are the most important facts on this page?"));
      entries.push(element("div", "empty", {}, [
        element("strong", "", {}, ["Ask about what you’re reading"]),
        element("p", "", {}, ["Get a summary or ask a specific question."]),
        element("div", "quick-actions", {}, [summary, points]),
      ]));
    }
    log.replaceChildren(...entries);
    log.scrollTop = log.scrollHeight;
    updateSend();
    scheduleLayout();
  }

  function setConnection(state, label) {
    connection.dataset.state = state;
    connectionText.textContent = label;
  }

  function rememberConnection(result) {
    if (result?.mode === "hosted" && typeof result.origin === "string" && /^https:\/\//u.test(result.origin)) {
      activeConnection = { mode: "hosted", origin: result.origin };
    } else if (result?.mode === "local") {
      activeConnection = { mode: "local", origin: localOrigin };
    }
  }

  function disconnectedLabel(code) {
    if (code === "extension-auth-required") return "Pair hosted BABY";
    if (code === "host-permission-required") return "Host permission needed";
    if (!code || code === "provider-unconfigured" || code === "provider-auth") return "Connect OpenAI";
    return activeConnection.mode === "hosted" ? "Hosted BABY unavailable" : "Local BABY unavailable";
  }

  function openConnectionSettings() {
    chrome.runtime.sendMessage({ type: "baby:connection:open" }).catch(() => {});
  }

  function showError(code, question) {
    const hostedOffline = code === "server-offline" && activeConnection.mode === "hosted";
    const hostedTimeout = code === "analysis-timeout" && activeConnection.mode === "hosted";
    let error = errors[code];
    if (hostedOffline) error = "Open hosted BABY and wait for it to load, then retry. A free Render server can take about a minute to wake.";
    if (hostedTimeout) error = "The reply timed out. If BABY has been idle, open it and wait for it to load before retrying.";
    showNotice(error || "BABY couldn’t complete this answer. Try again.");
    if (hostedTimeout || ["server-offline", "provider-unconfigured", "provider-auth", "extension-auth-required"].includes(code)) {
      notice.append(element("a", "", { href: activeConnection.origin + "/", target: "_blank", rel: "noopener noreferrer" }, ["Open BABY"]));
    }
    if (["host-permission-required", "extension-auth-required", "origin-forbidden"].includes(code)) {
      const button = element("button", "retry", { type: "button" }, ["Connection settings"]);
      button.addEventListener("click", openConnectionSettings);
      notice.append(button);
    }
    if (question && !["page-empty", "invalid-question", "unsupported-page", "message-too-large"].includes(code)) {
      const retry = element("button", "retry", { type: "button" }, ["Retry"]);
      retry.addEventListener("click", () => analyze(question));
      notice.append(retry);
    }
  }

  async function checkConnection() {
    const revision = ++connectionRevision;
    setConnection("check", "Connecting…");
    let status;
    try {
      status = await chrome.runtime.sendMessage({ type: "saathi:status" });
    } catch {
      status = { error: "server-offline" };
    }
    if (connectionRevision !== revision) return;
    rememberConnection(status);
    if (status?.connected) setConnection("on", "OpenAI connected");
    else setConnection("off", disconnectedLabel(status?.error));
  }

  async function analyze(raw) {
    resetForNewPage();
    refreshSource();
    const question = raw.trim() || (attachments.length ? "Analyze the attached files. Summarize their key points." : "");
    if (pending || !question) return;
    if (question.length > 2000) {
      showError("invalid-question");
      return;
    }
    clearNotice();
    let page;
    try {
      page = context.capture(document, location);
    } catch {
      if (!attachments.length) {
        showError("invalid-page", question);
        return;
      }
      page = { title: sourceTitle.textContent.slice(0, 300), url: (location.origin + location.pathname).slice(0, 4096), text: "" };
    }
    if (!page.text && !attachments.length) {
      showError("page-empty");
      return;
    }

    const request = { question, pageSession, files: [...attachments] };
    connectionRevision += 1;
    pending = request;
    stopVoice();
    renderAttachments();
    renderConversation();
    let result;
    try {
      const payload = context.payload(question, page, history);
      if (request.files.length) {
        try {
          payload.attachments = await Promise.all(request.files.map(capabilities.encodeAttachment));
        } catch {
          result = { error: "attachment-read" };
        }
      }
      if (!result && pending === request && location.href === request.pageSession) {
        result = await chrome.runtime.sendMessage({ type: "saathi:analyze", payload });
      }
    } catch {
      result = { error: "server-offline" };
    }
    if (pending !== request || location.href !== request.pageSession) {
      resetForNewPage();
      return;
    }
    pending = undefined;
    rememberConnection(result);
    if (typeof result?.reply === "string" && result.reply.trim()) {
      const reply = result.reply.slice(0, 12000);
      history = [...history, { role: "user", text: question }, { role: "assistant", text: reply }].slice(-10);
      if (input.value.trim() === question) input.value = "";
      setConnection("on", "OpenAI connected");
      if (readAloud && !panel.hidden) voice.speak(reply);
    } else {
      const code = result?.error || "analysis-failed";
      if (["server-offline", "provider-unconfigured", "provider-auth", "extension-auth-required", "host-permission-required", "connection-unavailable"].includes(code)) {
        setConnection("off", disconnectedLabel(code));
      }
      showError(code, question);
    }
    renderAttachments();
    renderConversation();
  }

  function togglePanel() {
    const open = panel.hidden;
    panel.hidden = !open;
    pet.setAttribute("aria-expanded", String(open));
    pet.setAttribute("aria-label", open ? "Close BABY Page Pet" : "Open BABY Page Pet");
    pet.dataset.hint = open ? "Close BABY · Drag to move" : "Click to chat · Drag to move";
    pet.querySelector(".open-light").hidden = !open;
    if (open) {
      resetForNewPage();
      refreshSource();
      renderConversation();
      layout();
      input.focus({ preventScroll: true });
      checkConnection();
    } else {
      stopVoice();
      pet.focus({ preventScroll: true });
    }
    scheduleLayout();
  }

  const defaultPlacement = { x: 1, y: 1 };
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));
  let placement = defaultPlacement;
  let drag = null;
  let suppressClickUntil = 0;
  let frame = 0;
  let placementChanged = false;
  let themeChanged = false;
  let speechChanged = false;

  function validPlacement(value) {
    return value && Number.isFinite(value.x) && Number.isFinite(value.y);
  }

  function bounds() {
    const visual = window.visualViewport;
    const left = visual?.offsetLeft ?? 0;
    const top = visual?.offsetTop ?? 0;
    const width = visual?.width || document.documentElement.clientWidth || window.innerWidth;
    const height = visual?.height || document.documentElement.clientHeight || window.innerHeight;
    const petWidth = pet.offsetWidth;
    const petHeight = pet.offsetHeight;
    const insetX = Math.min(10, Math.max(0, (width - petWidth) / 2));
    const insetY = Math.min(10, Math.max(0, (height - petHeight) / 2));
    return {
      left, top, width, height, petWidth, petHeight,
      minX: left + insetX,
      minY: top + insetY,
      spanX: Math.max(0, width - petWidth - insetX * 2),
      spanY: Math.max(0, height - petHeight - insetY * 2),
    };
  }

  function layout() {
    const view = bounds();
    const x = view.minX + view.spanX * clamp(placement.x, 0, 1);
    const y = view.minY + view.spanY * clamp(placement.y, 0, 1);
    host.style.setProperty("--dock-x", x + "px");
    host.style.setProperty("--dock-y", y + "px");
    host.dataset.placed = "";
    host.dataset.hintSide = x - view.left > view.width / 2 ? "left" : "right";
    if (panel.hidden) return;
    const edge = 8;
    const gap = 9;
    const maxWidth = Math.max(0, view.width - edge * 2);
    const maxHeight = Math.max(0, view.height - edge * 2);
    const width = Math.min(370, maxWidth);
    const spaceLeft = x - view.left - edge - gap;
    const spaceRight = view.left + view.width - x - view.petWidth - edge - gap;
    const spaceAbove = y - view.top - edge - gap;
    const spaceBelow = view.top + view.height - y - view.petHeight - edge - gap;
    const side = Math.max(spaceLeft, spaceRight) >= width;
    const towardLeft = spaceLeft >= spaceRight;
    const above = spaceAbove >= spaceBelow;
    const heightLimit = Math.min(540, maxHeight,
      side ? maxHeight : Math.max(220, above ? spaceAbove : spaceBelow));
    panel.style.setProperty("--panel-width", width + "px");
    panel.style.setProperty("--panel-height", heightLimit + "px");
    panel.dataset.compact = String(heightLimit < 310);
    const height = panel.offsetHeight;
    const naturalX = side ? (towardLeft ? x - width - gap : x + view.petWidth + gap)
      : x + (towardLeft ? view.petWidth - width : 0);
    const naturalY = side ? y + view.petHeight / 2 - height / 2
      : above ? y - height - gap : y + view.petHeight + gap;
    const panelX = clamp(naturalX, view.left + edge, view.left + view.width - width - edge);
    const panelY = clamp(naturalY, view.top + edge, view.top + view.height - height - edge);
    panel.style.setProperty("--panel-x", (panelX - x) + "px");
    panel.style.setProperty("--panel-y", (panelY - y) + "px");
    panel.dataset.dock = side ? (towardLeft ? "left" : "right") : above ? "above" : "below";
  }

  function scheduleLayout() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      layout();
    });
  }

  function movePet(x, y) {
    const view = bounds();
    placement = {
      x: view.spanX ? clamp((x - view.minX) / view.spanX, 0, 1) : placement.x,
      y: view.spanY ? clamp((y - view.minY) / view.spanY, 0, 1) : placement.y,
    };
    placementChanged = true;
    scheduleLayout();
  }

  pet.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClickUntil = 0;
    const rect = pet.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      left: rect.left, top: rect.top, moved: false,
    };
    pet.setPointerCapture?.(event.pointerId);
  });
  pet.addEventListener("pointermove", (event) => {
    if (drag?.pointerId === event.pointerId) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      host.classList.add("dragging");
      movePet(drag.left + dx, drag.top + dy);
      return;
    }
    if (motion.matches || event.pointerType === "touch") return;
    const rect = pet.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    tilt.style.setProperty("--tilt-x", ((.5 - (event.clientY - rect.top) / rect.height) * 24) + "deg");
    tilt.style.setProperty("--tilt-y", (((event.clientX - rect.left) / rect.width - .5) * 28) + "deg");
  });
  pet.addEventListener("pointerleave", () => {
    tilt.style.removeProperty("--tilt-x");
    tilt.style.removeProperty("--tilt-y");
  });
  function endDrag(event) {
    if (drag?.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickUntil = performance.now() + 330;
      savePreference(preferences.placement, placement);
    }
    drag = null;
    host.classList.remove("dragging");
  }
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) pet.addEventListener(name, endDrag);
  pet.addEventListener("keydown", (event) => {
    const offsets = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const view = bounds();
    const step = event.shiftKey ? 48 : 20;
    movePet(view.minX + view.spanX * placement.x + offset[0] * step,
      view.minY + view.spanY * placement.y + offset[1] * step);
    savePreference(preferences.placement, placement);
  });
  pet.addEventListener("click", (event) => {
    if (event.detail > 0 && performance.now() < suppressClickUntil) return;
    togglePanel();
  });
  window.addEventListener("resize", scheduleLayout);
  window.visualViewport?.addEventListener("resize", scheduleLayout);
  window.visualViewport?.addEventListener("scroll", scheduleLayout);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(scheduleLayout);
    observer.observe(pet);
    observer.observe(panel);
  }

  const colorPreference = matchMedia("(prefers-color-scheme: dark)");
  setTheme(colorPreference.matches);
  renderVoice();
  scheduleLayout();
  chrome.storage?.local?.get(Object.values(preferences))?.then((saved) => {
    if (!placementChanged && validPlacement(saved[preferences.placement])) {
      placement = saved[preferences.placement];
    }
    if (!themeChanged && typeof saved[preferences.theme] === "boolean") setTheme(saved[preferences.theme]);
    if (!speechChanged) readAloud = saved[preferences.speech] === true;
    renderVoice();
    scheduleLayout();
  }).catch(() => {});
  chrome.storage?.onChanged?.addListener((changes, area) => {
    if (area !== "local") return;
    const position = changes[preferences.placement]?.newValue;
    if (!drag && validPlacement(position)) {
      placement = position;
      scheduleLayout();
    }
    const theme = changes[preferences.theme]?.newValue;
    if (typeof theme === "boolean") setTheme(theme);
    const speech = changes[preferences.speech]?.newValue;
    if (typeof speech === "boolean") {
      readAloud = speech;
      if (!speech) voice.stopSpeaking();
      renderVoice();
    }
  });
  dark.addEventListener("click", () => {
    themeChanged = true;
    const isDark = host.dataset.theme !== "dark";
    setTheme(isDark);
    savePreference(preferences.theme, isDark);
  });
  volume.addEventListener("click", () => {
    if (speechState === "speaking") {
      voice.stopSpeaking();
      return;
    }
    if (!voice.canSpeak) {
      voice.speak("BABY");
      return;
    }
    speechChanged = true;
    readAloud = !readAloud;
    savePreference(preferences.speech, readAloud);
    renderVoice();
    clearNotice();
    if (readAloud && !pending) {
      const latest = history.findLast(({ role }) => role === "assistant");
      if (latest) {
        micDraft = null;
        voice.cancelListening();
        voice.speak(latest.text);
      }
    }
  });
  microphone.addEventListener("click", () => {
    resetForNewPage();
    if (speechState === "listening") {
      voice.stopListening();
      return;
    }
    clearNotice();
    micDraft = { text: input.value, pageSession };
    if (!voice.startListening()) micDraft = null;
  });
  attachmentButton.addEventListener("click", () => {
    resetForNewPage();
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    resetForNewPage();
    const selected = capabilities.validateFiles(fileInput.files, attachments);
    fileInput.value = "";
    attachments = [...attachments, ...selected.accepted];
    renderAttachments();
    if (selected.errors.length) showNotice(selected.errors.join(" "));
    else clearNotice();
  });
  settings.addEventListener("click", openConnectionSettings);
  close.addEventListener("click", togglePanel);
  shadow.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Escape" && !panel.hidden) {
      togglePanel();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    analyze(input.value);
  });
  input.addEventListener("input", () => {
    if (micDraft) {
      micDraft = null;
      voice.cancelListening();
    }
    updateSend();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && !pending) {
      event.preventDefault();
      analyze(input.value);
    }
  });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message?.type !== "saathi:toggle") return;
    togglePanel();
    respond({ toggled: true });
  });
})();
