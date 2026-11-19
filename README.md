# BABY

BABY is an English voice companion for chat and file analysis. Talk through your microphone or type, then hear replies through your speakers. Use **Voice** for a larger microphone control and **Chat** for starter prompts.

For password-protected hosting with Gemini, see the [Render Free deployment guide](./RENDER.md).

BABY Desktop is a separate Windows app that keeps the movable pet available across desktop apps and monitors. Its **Screen** control can read visible text from the monitor where you place the pet.

## Run locally

Double-click **BABY.html** to open the portable version in your browser. It includes the guided assistant, voice controls, artwork, and chat history in a single file.

For the localhost version, or if your browser blocks microphone access on a local file, use Node.js 22 or later. Run this from the BABY project folder.

```powershell
node server.mjs
```

Open [BABY on this device](http://127.0.0.1:4173). The project needs no npm dependencies. Run `node build-portable.mjs` after editing the source to refresh the portable copy.

## Chat and voice

- Drag the 3D pet to rotate it. With the pet focused, the arrow keys rotate it and Enter resets its view. The **Background** menu offers Sky, Glacier, and Cobalt. Use the moon or sun button to switch the workspace between light and dark mode.
- When your browser prompts you, allow the microphone. Tap the microphone again to finish dictating.
- The speaker button mutes automatic replies or stops the current playback. Use the speaker icon on a reply to play it again. **Voice settings** controls voice selection, speed, automatic replies, and whether voice input is sent automatically.
- The guided assistant handles everyday prompts such as planning a day, drafting an email, calculating a result, brainstorming, summarizing pasted text, and translating common phrases. It can refer to details within the current conversation. Each conversation can be searched, renamed, exported, or deleted.
- Text works when microphone support is unavailable. Dictation depends on your browser’s speech service, and the English voices available depend on your device and browser. The browser may process speech online. Conversation history is saved in your current browser profile.

## Analyze attachments

With OpenAI connected on the local server, use **Attach files** beside the message field to add up to three files. Each file may be up to 8 MB, with a 12 MB combined limit. Supported files include PNG, JPEG, and WebP images, PDF, Word, Excel, PowerPoint, plain text, Markdown, CSV, TSV, and JSON documents, and MP3, WAV, M4A, OGG, and FLAC speech recordings.

Send a question with the files or press **Send** for a summary. BABY sends the attached files to OpenAI when you send a message. Speech recordings are transcribed before analysis. Files stay available for follow-up questions in that browser tab until you remove them or reload. Chat history saves filenames and messages. To ask about the original content after a reload, attach the files again.

## Connect a model locally

On Windows, double-click **Start-BABY.cmd**. You can also run `node start-private.mjs`. Open [BABY’s local key form](http://127.0.0.1:4173/setup), paste your existing OpenAI key into the password field, and choose **Start BABY**. The launcher window holds the local server open.

The browser sends the key to BABY’s server on this computer. The server holds it in memory for the session. Close the launcher when you finish. Chat prompts go to OpenAI and spoken replies use your browser's voices.

The local server uses the Responses API for OpenAI and supports OpenAI-compatible Chat Completions endpoints for text chat. To keep your key between launches on this computer, copy `.env.example` to `.env` and enter your key on the `SAATHI_AI_API_KEY=` line. Run `npm start` from this folder, then open **Assistant connection** in the sidebar to check the configuration. The local `.env` is ignored by Git. For Render, enter your key in the dashboard.

For an already running local Ollama instance, use `SAATHI_AI_BASE_URL=http://127.0.0.1:11434/v1` and set `SAATHI_AI_MODEL` to a downloaded model name. For OpenAI, use `https://api.openai.com/v1`, set the ID of a model you can access, and set `SAATHI_AI_API_KEY` in the local `.env`. The server sends recent turns to the configured provider. Keep your key in the server environment.
