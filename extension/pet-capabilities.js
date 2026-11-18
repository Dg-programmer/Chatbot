(() => {
  "use strict";

  const voiceMessages = Object.freeze({
    "insecure-page": "Voice input needs a secure page. Type your question here or try an HTTPS page.",
    "recognition-unsupported": "This browser does not offer voice input on this page. You can type your question.",
    "not-allowed": "Allow microphone access for this page to speak to BABY.",
    "service-not-allowed": "Voice input is blocked on this page. You can type your question.",
    "audio-capture": "BABY could not find an available microphone.",
    "audio-busy": "Wait for the current speech to finish and try again.",
    "network": "The browser’s speech service is unavailable. You can type your question.",
    "no-speech": "I didn’t hear a question. Tap the microphone and try again.",
    "language-not-supported": "This browser does not offer English voice input on this page.",
    "recognition-failed": "Voice input did not start. You can try again or type your question.",
    "synthesis-unsupported": "Spoken replies are unavailable in this browser.",
    "speech-blocked": "Use the reply’s play button to start playback.",
    "speech-failed": "I couldn’t play that reply. Try the play button again.",
    "voice-unavailable": "No English speaking voice was available.",
    "speaker-unavailable": "BABY could not find an available speaker.",
  });

  function voiceErrorMessage(code) {
    return Object.hasOwn(voiceMessages, code) ? voiceMessages[code] : voiceMessages["recognition-failed"];
  }

  function createVoice({ onState = () => {}, onTranscript = () => {}, onError = () => {} } = {}) {
    const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    const Utterance = globalThis.SpeechSynthesisUtterance;
    const synthesis = globalThis.speechSynthesis;
    const secure = globalThis.isSecureContext !== false;
    const canListen = secure && typeof Recognition === "function";
    const canSpeak = Boolean(synthesis && typeof Utterance === "function");
    const browserLanguage = globalThis.navigator?.language;
    const language = /^en(?:-|$)/i.test(browserLanguage ?? "") ? browserLanguage : "en-US";
    let state = "idle";
    let capture;
    let playback;
    let queuedSpeech;

    function setState(next) {
      if (state === next) return;
      state = next;
      onState(next);
    }

    function closeCapture(session) {
      if (capture !== session) return;
      clearTimeout(session.timer);
      capture = undefined;
      setState("idle");
      if (queuedSpeech) {
        const parts = queuedSpeech;
        queuedSpeech = undefined;
        play(parts);
      }
      if (session.canceled) return;
      const text = session.finalText || (session.stopping ? session.draft : "");
      if (text && (!session.error || session.error === "no-speech")) {
        onTranscript(text, { final: true });
      } else {
        const code = session.error || "no-speech";
        onError(Object.hasOwn(voiceMessages, code) ? code : "recognition-failed");
      }
    }

    function invokeRecognition(session, method) {
      try { session.instance[method](); }
      catch { /* Pending permission or a native end event can race this call. */ }
    }

    function releaseCaptureAfter(session, delay) {
      clearTimeout(session.timer);
      session.timer = setTimeout(() => {
        if (capture !== session) return;
        session.releasing = true;
        invokeRecognition(session, "abort");
        closeCapture(session);
      }, delay);
    }

    function cancelListening() {
      if (!capture || capture.canceled) return;
      capture.canceled = true;
      releaseCaptureAfter(capture, 1000);
      invokeRecognition(capture, "abort");
    }

    function stopListening() {
      if (!capture || capture.canceled || capture.stopping) return;
      capture.stopping = true;
      releaseCaptureAfter(capture, 2000);
      invokeRecognition(capture, "stop");
    }

    function startListening() {
      if (!canListen) {
        onError(secure ? "recognition-unsupported" : "insecure-page");
        return false;
      }
      if (capture) return false;
      stopSpeaking();
      if (synthesis?.speaking || synthesis?.pending) {
        onError("audio-busy");
        return false;
      }
      let instance;
      try { instance = new Recognition(); }
      catch (error) {
        onError(["NotAllowedError", "SecurityError"].includes(error.name) ? "not-allowed" : "recognition-failed");
        return false;
      }

      const session = { instance, finalText: "", draft: "" };
      capture = session;
      instance.lang = language;
      instance.interimResults = true;
      instance.continuous = false;
      instance.maxAlternatives = 1;
      instance.onstart = () => {
        if (capture !== session || session.canceled) invokeRecognition(session, "abort");
        else if (session.stopping) invokeRecognition(session, "stop");
      };
      instance.onresult = ({ results }) => {
        if (capture !== session || session.canceled) return;
        const items = Array.from(results);
        const join = (entries) => entries.map((entry) => entry[0]?.transcript.trim()).filter(Boolean).join(" ");
        session.finalText = join(items.filter((entry) => entry.isFinal));
        const latest = join(items);
        if (latest !== session.draft) {
          session.draft = latest;
          onTranscript(latest, { final: false });
        }
      };
      instance.onerror = ({ error }) => {
        if (capture !== session || session.canceled || session.releasing) return;
        session.error = error;
        releaseCaptureAfter(session, 500);
      };
      instance.onend = () => closeCapture(session);

      setState("listening");
      try {
        instance.start();
        return true;
      } catch (error) {
        session.error = ["NotAllowedError", "SecurityError"].includes(error.name) ? "not-allowed" : "recognition-failed";
        closeCapture(session);
        return false;
      }
    }

    function closePlayback(session, cancel = false) {
      if (playback !== session) return;
      playback = undefined;
      clearTimeout(session.timer);
      if (cancel && session.utterance) synthesis.cancel();
      setState("idle");
    }

    function stopSpeaking() {
      queuedSpeech = undefined;
      if (playback) closePlayback(playback, true);
    }

    function play(parts) {
      if (synthesis.speaking || synthesis.pending) {
        onError("audio-busy");
        return false;
      }
      const voices = synthesis.getVoices().filter((voice) => /^en(?:-|_|$)/i.test(voice.lang));
      const voice = voices.find((item) => item.lang.toLowerCase() === language.toLowerCase())
        || voices.find((item) => item.default) || voices[0];
      const session = { parts, voice, index: 0 };
      playback = session;
      setState("speaking");
      playNext(session);
      return playback === session;
    }

    function playbackFailed(session, error) {
      if (playback !== session) return;
      closePlayback(session, true);
      const code = error === "not-allowed" ? "speech-blocked"
        : error === "voice-unavailable" || error === "language-unavailable" ? "voice-unavailable"
        : error === "audio-hardware" ? "speaker-unavailable" : "speech-failed";
      onError(code);
    }

    function playNext(session) {
      if (playback !== session) return;
      const text = session.parts[session.index];
      if (!text) {
        closePlayback(session);
        return;
      }
      const utterance = new Utterance(text);
      utterance.lang = session.voice?.lang || language;
      if (session.voice) utterance.voice = session.voice;
      session.utterance = utterance;
      utterance.onstart = () => {
        if (playback !== session || session.utterance !== utterance) return;
        clearTimeout(session.timer);
        session.timer = setTimeout(() => playbackFailed(session), 12000 + text.length * 200);
      };
      utterance.onend = () => {
        if (playback !== session || session.utterance !== utterance) return;
        clearTimeout(session.timer);
        session.utterance = undefined;
        session.index++;
        setTimeout(() => playNext(session), 0);
      };
      utterance.onerror = ({ error }) => {
        if (session.utterance === utterance) playbackFailed(session, error);
      };
      session.timer = setTimeout(() => playbackFailed(session), 6000);
      try {
        if (synthesis.paused) synthesis.resume();
        synthesis.speak(utterance);
      } catch (error) {
        playbackFailed(session, error.name === "NotAllowedError" ? "not-allowed" : error.name);
      }
    }

    function speak(text) {
      if (!canSpeak) {
        onError("synthesis-unsupported");
        return false;
      }
      const parts = text?.trim().replace(/\s+/gu, " ").match(/.{1,170}(?:\s|$)|.{1,170}/gu)
        ?.map((part) => part.trim()).filter(Boolean);
      if (!parts?.length) return false;
      stopSpeaking();
      if (capture) {
        queuedSpeech = parts;
        cancelListening();
        return true;
      }
      return play(parts);
    }

    return { canListen, canSpeak, startListening, stopListening, cancelListening, speak, stopSpeaking };
  }

  // Keep the picker and validation limits aligned with the main BABY app.
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
  const attachmentLimits = Object.freeze({
    maxFiles: 3,
    maxBytes: 12 * mebibyte,
    maxFileBytes: 8 * mebibyte,
  });
  const attachmentAccept = Object.keys(formats).map((extension) => "." + extension).join(",");

  let lastId = 0;

  function validateFiles(files, existing = []) {
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

  async function encodeAttachment({ name, mimeType, file }) {
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

  globalThis.BabyPetCapabilities = Object.freeze({
    createVoice, voiceErrorMessage, attachmentAccept, attachmentLimits, validateFiles, encodeAttachment,
  });
})();
