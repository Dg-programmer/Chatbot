const locales = { en: 'en-IN', hi: 'hi-IN' };
const recognitionErrors = new Set([
  'no-speech', 'aborted', 'audio-capture', 'network', 'not-allowed',
  'service-not-allowed', 'language-not-supported',
]);

function voiceLanguage(voice) {
  return voice.lang.toLowerCase().replace(/_/g, '-');
}

function speechParts(text) {
  const parts = [];
  let part = '';

  for (const word of text.trim().split(/\s+/u)) {
    if (part && part.length + word.length + 1 > 170) {
      parts.push(part);
      part = '';
    }
    part += part ? ` ${word}` : word;
  }
  if (part) parts.push(part);
  return parts;
}

export function createVoice({ onState = () => {}, onTranscript = () => {}, onError = () => {} } = {}) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const Utterance = window.SpeechSynthesisUtterance;
  const synthesis = window.speechSynthesis;
  const canListen = typeof Recognition === 'function';
  const canSpeak = Boolean(synthesis && typeof Utterance === 'function');
  let state = 'idle';
  let recognition;
  let playback;
  let queuedAction;

  function setState(next) {
    if (state === next) return;
    state = next;
    onState(next);
  }

  function getVoices() {
    return canSpeak ? Array.from(synthesis.getVoices()) : [];
  }

  function onVoicesChanged(callback) {
    if (!canSpeak) return () => {};
    const listener = () => callback(getVoices());
    synthesis.addEventListener('voiceschanged', listener);
    return () => synthesis.removeEventListener('voiceschanged', listener);
  }

  function finishRecognition(session) {
    if (recognition !== session) return;
    clearTimeout(session.timer);
    recognition = undefined;

    if (queuedAction) {
      const action = queuedAction;
      queuedAction = undefined;
      action.run();
      return;
    }

    setState('idle');
    if (session.canceled) return;

    const text = session.finalText || (session.stopping ? session.latestText : '');
    if (text && (!session.error || session.error === 'no-speech')) {
      onTranscript(text, { final: true });
      return;
    }
    const reason = session.error || 'no-speech';
    onError(recognitionErrors.has(reason) ? reason : 'recognition-failed', { reason });
  }

  function finishRecognitionSoon(session, delay) {
    clearTimeout(session.timer);
    session.timer = setTimeout(() => {
      if (recognition !== session) return;
      session.finishing = true;
      try { session.instance.abort(); } catch { /* Browser already closed the session. */ }
      finishRecognition(session);
    }, delay);
  }

  function abortRecognition() {
    if (!recognition || recognition.canceled) return;
    const session = recognition;
    session.canceled = true;
    finishRecognitionSoon(session, 1200);
    try { session.instance.abort(); } catch { /* The end event or timeout closes the session. */ }
  }

  function beginRecognition(language) {
    let instance;
    try {
      instance = new Recognition();
    } catch (error) {
      setState('idle');
      const reason = error.name;
      const code = ['NotAllowedError', 'SecurityError'].includes(reason) ? 'not-allowed' : 'recognition-failed';
      onError(code, { reason });
      return false;
    }
    const session = { instance, finalText: '', latestText: '' };
    recognition = session;
    instance.lang = locales[language] || locales.en;
    instance.interimResults = true;
    instance.continuous = false;
    instance.maxAlternatives = 1;

    instance.onresult = ({ results }) => {
      if (recognition !== session || session.canceled) return;
      const entries = Array.from(results);
      const join = (items) => items.map((result) => result[0]?.transcript.trim()).filter(Boolean).join(' ');
      const latestText = join(entries);
      session.finalText = join(entries.filter((result) => result.isFinal));
      if (latestText !== session.latestText) {
        session.latestText = latestText;
        onTranscript(latestText, { final: false });
      }
    };

    instance.onstart = () => {
      if (recognition !== session) return;
      try {
        if (session.canceled) instance.abort();
        else if (session.stopping) instance.stop();
      } catch { /* The stop or cancel timeout will release the microphone. */ }
    };

    instance.onerror = ({ error }) => {
      if (recognition !== session || session.canceled || session.finishing) return;
      session.error = error;
      finishRecognitionSoon(session, 650);
    };

    instance.onend = () => finishRecognition(session);

    try {
      instance.start();
      return true;
    } catch (error) {
      session.error = ['NotAllowedError', 'SecurityError'].includes(error.name) ? 'not-allowed' : error.name;
      finishRecognition(session);
      return false;
    }
  }

  function startListening(language) {
    if (!canListen) {
      onError('recognition-unsupported');
      return false;
    }
    if (recognition && !recognition.canceled) return false;

    stopSpeaking();
    setState('listening');
    if (recognition) {
      queuedAction = { type: 'listen', run: () => beginRecognition(language) };
      return true;
    }
    return beginRecognition(language);
  }

  function stopListening() {
    if (queuedAction?.type === 'listen') {
      queuedAction = undefined;
      setState('idle');
      return;
    }
    if (!recognition || recognition.stopping || recognition.canceled) return;

    recognition.stopping = true;
    finishRecognitionSoon(recognition, 2500);
    try { recognition.instance.stop(); } catch { /* A pending microphone prompt can delay the start. */ }
  }

  function cancelListening() {
    if (queuedAction?.type === 'listen') queuedAction = undefined;
    if (state === 'listening') setState('idle');
    abortRecognition();
  }

  function stopSpeaking() {
    if (queuedAction?.type === 'speak') {
      queuedAction = undefined;
      setState('idle');
    }
    if (!playback) return;

    const session = playback;
    playback = undefined;
    clearTimeout(session.timer);
    clearTimeout(session.voiceTimer);
    session.removeVoiceListener?.();
    if (session.utterance) synthesis.cancel();
    setState('idle');
  }

  function findVoice(language, uri) {
    const locale = locales[language] || locales.en;
    const voices = getVoices().filter((voice) => (
      voiceLanguage(voice).split('-')[0] === locale.slice(0, 2)
    ));
    return voices.find((voice) => voice.voiceURI === uri)
      || voices.find((voice) => voiceLanguage(voice) === locale.toLowerCase())
      || voices.find((voice) => voice.default)
      || voices[0];
  }

  function playbackError(session, reason) {
    if (playback !== session) return;
    stopSpeaking();
    const code = ['voice-unavailable', 'language-unavailable'].includes(reason) ? 'voice-unavailable'
      : reason === 'not-allowed' ? 'speech-blocked' : 'speech-failed';
    onError(code, { language: session.language, reason });
  }

  function speakNext(session) {
    if (playback !== session) return;
    const text = session.parts[session.index];
    if (!text) {
      session.utterance = undefined;
      stopSpeaking();
      return;
    }

    const utterance = new Utterance(text);
    utterance.lang = session.voice?.lang || locales[session.language];
    if (session.voice) utterance.voice = session.voice;
    utterance.rate = session.rate;
    session.utterance = utterance;

    utterance.onstart = () => {
      if (playback !== session || session.utterance !== utterance) return;
      clearTimeout(session.timer);
      session.timer = setTimeout(() => playbackError(session, 'playback-timeout'), 15000 + text.length * 200 / session.rate);
    };
    utterance.onend = () => {
      if (playback !== session || session.utterance !== utterance) return;
      clearTimeout(session.timer);
      session.index += 1;
      session.utterance = undefined;
      setTimeout(() => speakNext(session), 0);
    };
    utterance.onerror = ({ error }) => {
      if (session.utterance === utterance) playbackError(session, error);
    };

    session.timer = setTimeout(() => playbackError(session, 'playback-timeout'), 8000);
    try {
      if (synthesis.paused) synthesis.resume();
      synthesis.speak(utterance);
    } catch (error) {
      playbackError(session, error.name === 'NotAllowedError' ? 'not-allowed' : error.name);
    }
  }

  function beginPlayback(language, parts, voiceURI, rate) {
    const session = { language, parts, rate, index: 0 };
    playback = session;

    const play = () => {
      clearTimeout(session.voiceTimer);
      session.removeVoiceListener?.();
      session.voice = findVoice(language, voiceURI);
      if (!session.voice && (language === 'hi' || getVoices().length)) {
        playbackError(session, 'voice-unavailable');
        return;
      }
      speakNext(session);
    };

    if (getVoices().length) {
      play();
    } else {
      session.removeVoiceListener = onVoicesChanged((voices) => {
        if (voices.length) play();
      });
      session.voiceTimer = setTimeout(play, 500);
    }
  }

  function speak(text, language, { voiceURI, rate = 1 } = {}) {
    if (!canSpeak) {
      onError('synthesis-unsupported');
      return false;
    }
    const parts = speechParts(text);
    if (!parts.length) return false;

    const locale = language === 'hi' ? 'hi' : 'en';
    const speed = Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1;
    stopSpeaking();
    setState('speaking');
    const run = () => beginPlayback(locale, parts, voiceURI, speed);
    if (recognition) {
      queuedAction = { type: 'speak', run };
      abortRecognition();
    } else {
      run();
    }
    return state === 'speaking';
  }

  return {
    canListen, canSpeak, startListening, stopListening, cancelListening,
    speak, stopSpeaking, getVoices, onVoicesChanged,
  };
}
