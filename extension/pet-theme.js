globalThis.SaathiPetTheme = `
:host {
  all: initial; position: fixed; right: 20px; bottom: 18px; z-index: 2147483647;
  --pet-width: 74px; --pet-height: 74px;
  width: var(--pet-width); height: var(--pet-height);
  color-scheme: light; color: #163650; pointer-events: none;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  font-size: 14px; line-height: 1.36;
}
:host([data-placed]) { left: var(--dock-x); top: var(--dock-y); right: auto; bottom: auto; }
:host([data-theme="dark"]) { color-scheme: dark; color: #e7f1ff; }
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
button, input, textarea { font: inherit; }
button { cursor: pointer; }
button:focus-visible, textarea:focus-visible, a:focus-visible { outline: 2px solid #2076c4; outline-offset: 3px; }
button:disabled { cursor: default; opacity: .53; }
.dock { position: relative; width: 100%; height: 100%; pointer-events: none; }
.pet {
  display: block; position: relative; width: 100%; height: 100%;
  padding: 0; background: none; border: 0; border-radius: 50%; pointer-events: auto;
  -webkit-tap-highlight-color: transparent; perspective: 420px; touch-action: none;
  cursor: grab; user-select: none;
}
:host(.dragging) .pet { cursor: grabbing; }
:host(.dragging) .pet::after { display: none; }
:host(.dragging) .pet-air, :host(.dragging) .pet::before { animation-play-state: paused; }
.pet::before {
  content: ""; position: absolute; width: 54px; height: 15px; bottom: 1px; left: 10px;
  border-radius: 50%; background: #337dad65; filter: blur(5px); animation: saathi-shadow 4s ease-in-out infinite;
}
.pet:hover::after, .pet:focus-visible::after {
  position: absolute; right: calc(100% + 6px); bottom: 20px; pointer-events: none;
  content: attr(data-hint); white-space: nowrap; padding: 5px 9px;
  border: 1px solid #ccdeed; border-radius: 8px; background: #fafdff; color: #1e466b;
  font-weight: 650; font-size: 11px; box-shadow: 0 4px 13px #22659a24;
}
:host([data-hint-side="right"]) .pet::after { right: auto; left: calc(100% + 6px); }
.pet-air {
  position: absolute; inset: 3px 2px 7px; display: grid; place-items: center;
  animation: saathi-hover 4s ease-in-out infinite; transform-style: preserve-3d;
}
.pet-tilt {
  position: relative; width: 64px; height: 62px; display: grid; place-items: center;
  transform: rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg));
  transform-style: preserve-3d; transition: transform 170ms ease-out;
}
.pet:active .pet-air { animation-play-state: paused; }
.bot {
  position: relative; display: block; width: 58px; height: 51px; transform-style: preserve-3d;
}
.bot-shell {
  position: absolute; inset: 2px 1px 2px; display: block; border-radius: 48% 49% 42% 43%;
  border: 1px solid #d0e6f2; background:
    radial-gradient(ellipse at 26% 12%,#ffffff 6%,#f6fbff 24%,transparent 47%),
    linear-gradient(146deg,#eef9ff 30%,#a4c4d9 74%,#668eac);
  box-shadow: .5px 3px 7px #23547c55, inset -2px -2px 4px #5aa1cf77, inset 1px 0 2px white;
}
.bot-visor {
  position: absolute; inset: 12px 7px 8px; display: block; border-radius: 45% 44% 43% 43%;
  border: 1px solid #a0d5f9;
  background: radial-gradient(ellipse at 51% 12%,#366a9b,#112c54 55%,#061c35 86%);
  box-shadow: inset 0 -2px 5px #499ada, 0 1px 1px #f8fcff;
  transform: translateZ(8px);
}
.bot-visor::before {
  content: ""; position: absolute; top: 3px; right: 5px; width: 14px; height: 8px;
  transform: rotate(14deg); border-radius: 50%; background: radial-gradient(#a0d3f651,transparent 73%);
}
.bot-eye {
  position: absolute; width: 4px; height: 8px; top: 11px; border-radius: 9px;
  background: #ddfcff; box-shadow: 0 0 6px #51c0ff, 0 0 2px #fff; animation: saathi-blink 6s linear infinite;
}
.bot-eye.left { left: 11px; }
.bot-eye.right { right: 10px; }
.bot-smile {
  position: absolute; width: 5px; height: 3px; left: calc(50% - 2px); top: 21px;
  border: 1px solid #8adbff; border-width: 0 1px 1px; border-radius: 0 0 8px 8px;
}
.bot-ear {
  position: absolute; top: 15px; width: 7px; height: 22px; border-radius: 5px;
  background: linear-gradient(93deg,#669dca,#e6f7ff 50%,#91b5ce);
  box-shadow: inset 0 0 4px #82b3e0; transform: translateZ(-1px);
}
.bot-ear.left { left: -1px; }
.bot-ear.right { right: -1px; }
.pet-image {
  position: absolute; inset: -2px; width: calc(100% + 4px); height: calc(100% + 4px);
  object-fit: contain; filter: drop-shadow(1px 3px 4px #2560984d); user-select: none; pointer-events: none;
}
.art-loaded .bot { visibility: hidden; }
.open-light {
  position: absolute; right: 8px; bottom: 13px; width: 9px; height: 9px;
  background: #2991e7; box-shadow: 0 0 7px #3188d4aa; border: 1.6px solid #edfbff; border-radius: 50%;
}
.panel {
  pointer-events: auto; position: absolute; top: var(--panel-y,0px); left: var(--panel-x,0px);
  width: var(--panel-width,min(370px,calc(100vw - 16px)));
  max-height: var(--panel-height,min(540px,calc(100dvh - 16px))); display: flex; flex-direction: column;
  overflow: hidden; isolation: isolate; transform-origin: 92% 100%;
  border: 1px solid #c9def0; border-radius: 19px;
  background: linear-gradient(175deg,#e9f4ff 1%,#fcfdff 29%,#f1f7ff 100%);
  box-shadow: 0 26px 90px #0e41684d, 0 5px 14px #3070a225, inset 0 1px #fff;
  animation: saathi-open 230ms cubic-bezier(.18,.76,.32,1) both;
}
.panel[data-dock="below"] { transform-origin: 85% 0%; }
.panel[data-dock="left"] { transform-origin: 100% 50%; }
.panel[data-dock="right"] { transform-origin: 0% 50%; }
.header {
  display: flex; align-items: center; gap: 6px; min-height: 54px; flex: none; padding: 8px 10px 8px 11px;
  border-bottom: 1px solid #d6e6f3; background: linear-gradient(145deg,#fafdffcf,#e1f0ffdb);
}
.mini {
  display: grid; place-items: center; width: 34px; height: 34px; flex: none; overflow: hidden;
  border: 1px solid #bdd9ee; border-radius: 11px; background: radial-gradient(#fcfdff,#c5def7);
}
.mini img { width: 31px; height: 31px; object-fit: contain; }
.mini-icon { color: #336fa7; width: 18px; height: 18px; }
.header-main { flex: 1; min-width: 0; }
.title { margin: 0; color: #122f50; font-size: 15px; line-height: 1.2; font-weight: 750; letter-spacing: -.025em; }
.connection { display: flex; align-items: center; gap: 5px; margin-top: 3px; font-size: 10px; color: #506e86; }
.indicator { width: 6px; height: 6px; border-radius: 50%; background: #638eaf; }
.connection[data-state="on"] .indicator { background: #2c8966; box-shadow: 0 0 0 3px #74c8a137; }
.connection[data-state="off"] .indicator { background: #a47334; }
.icon-button {
  display: grid; place-items: center; flex: none; width: 30px; height: 30px; padding: 0;
  border: 1px solid #c6dbed; border-radius: 8px; background: #f7fbff; color: #22527b;
}
.icon-button:hover { background: #e4f1fc; border-color: #9bbede; }
.icon-button[aria-pressed="true"] { background: #e0efff; border-color: #91b9e2; color: #1c578e; }
.icon-button svg { width: 15px; height: 15px; }
.microphone[aria-pressed="true"] { color: #9e3041; background: #fff1f2; border-color: #e7aeb7; }
.source {
  display: grid; align-items: center; grid-template-columns: 21px 1fr; column-gap: 6px;
  flex: none; margin: 10px 12px 0; padding: 7px 8px; border: 1px solid #d8e8f6; border-radius: 10px; background: #fbfdff;
}
.source svg { grid-row: 1 / 3; width: 16px; height: 16px; color: #3680b5; }
.source-title, .source-domain { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.source-title { font-size: 11px; font-weight: 680; color: #24465f; }
.source-domain { font-size: 9px; color: #55738e; }
.transcript { min-height: 0; padding: 11px 12px 12px; overflow: auto; overscroll-behavior: contain; flex: 1 1 265px; }
.empty { margin: 2px 1px 0; color: #365976; line-height: 1.4; }
.empty strong { display: block; color: #1f415e; font-size: 13px; margin-bottom: 4px; }
.empty p { margin: 0; font-size: 12px; }
.quick-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.quick {
  padding: 4px 8px; border-radius: 7px; border: 1px solid #bcd7ef;
  background: #f9fcff; color: #21578a; font-size: 10px; font-weight: 650;
}
.quick:hover { border-color: #80aed4; background: #e6f2ff; }
.message { margin: 0 0 8px; }
.message:last-child { margin-bottom: 0; }
.message-label { display: flex; align-items: center; gap: 5px; margin: 0 2px 3px; color: #486b88; font-size: 9px; font-weight: 700; }
.message.user .message-label { justify-content: flex-end; }
.reply-audio { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 5px; color: #266da7; background: transparent; }
.reply-audio:hover { background: #e0effb; }
.reply-audio svg { width: 13px; height: 13px; }
.bubble {
  padding: 7px 8px; border-radius: 9px; border: 1px solid #d4e5f5; background: #fff;
  color: #143650; font-size: 11px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5;
}
.message.user .bubble { margin-left: 12px; background: #e4f2ff; border-color: #c6e0f6; }
.thinking .bubble { color: #386383; }
.notice {
  flex: none; max-height: 82px; overflow: auto; margin: 0 12px 7px; padding: 7px 8px; border-radius: 8px; border: 1px solid #d5e2ea;
  color: #43526b; background: #fbfcfe; font-size: 10px; line-height: 1.4;
}
.notice a, .retry { font: inherit; font-weight: 700; color: #13578b; text-decoration: underline; text-underline-offset: 2px; margin-left: 6px; }
.retry { border: 0; padding: 0; background: none; }
.composer { flex: none; margin: 0; padding: 8px 12px 9px; background: #f8fbff; border-top: 1px solid #d7e7f4; }
.composer-line { display: flex; align-items: center; gap: 6px; }
.composer-line .icon-button { height: 33px; width: 32px; }
.question {
  flex: 1; width: 100%; min-width: 0; min-height: 35px; resize: vertical; max-height: 94px;
  border: 1px solid #c4d9eb; border-radius: 8px; padding: 7px 7px; background: white; color: #143a56;
  line-height: 1.3; font-size: 11px;
}
.question::placeholder { color: #5c7992; }
.send { color: #fff; width: 33px; height: 33px; border-color: #1d73b8; border-radius: 8px; background: linear-gradient(145deg,#2e89d2,#216ab4); }
.send:hover { color: #fff; border-color: #155899; background: #1f6eb7; }
.composer-footer { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; column-gap:6px; margin:6px 1px 0; }
.composer-hint, .speech-status { margin:0; font-size: 9px; color: #4e6a82; }
.speech-status { color: #175b94; font-weight: 700; }
.attachments { display:flex; flex-wrap:wrap; gap:4px; max-height:69px; overflow:auto; list-style:none; margin:0 0 6px; padding:2px; }
.attachment-chip {
  display:flex; align-items:center; gap:4px; min-width:0; max-width:100%;
  padding:3px 4px 3px 6px; border:1px solid #c9dff1; border-radius:7px; color:#244b6b;
  background:#edf6ff; font-weight:650; font-size:10px;
}
.attachment-chip > svg { flex:none; width:13px; height:13px; color:#2b729f; }
.file-name { min-width:0; max-width:214px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.remove-attachment { display:grid; place-items:center; flex:none; width:19px; height:19px; padding:0; border:0; border-radius:4px; background:#dfedfc; color:#244b6b; }
.remove-attachment:hover { background:#c9e2f8; }
.remove-attachment svg { width:12px; height:12px; }
.panel[data-compact="true"] .source { display:none; }
.panel[data-compact="true"] .transcript { padding-block: 7px; }
.panel[data-compact="true"] .header { min-height: 38px; padding-block: 4px; }
.panel[data-compact="true"] .mini { width:28px; height:28px; }
.panel[data-compact="true"] .mini img { width:25px; height:25px; }
.panel[data-compact="true"] .attachments { max-height:33px; }
.panel[data-compact="true"] .notice { max-height:39px; }
.panel[data-compact="true"] .composer { padding-block:5px; }
:host([data-speech="speaking"]) .open-light { animation: baby-speech 600ms ease-in-out infinite alternate; }
@keyframes baby-speech { to { box-shadow:0 0 12px 1px #38b8ed; transform:scale(1.16); } }

:host([data-theme="dark"]) .panel {
  border-color: #3b5e7c; background: linear-gradient(155deg,#152f4a,#0c192b 52%,#101d31);
  box-shadow: 0 24px 80px #030911ae, 0 5px 14px #050c1b88, inset 0 1px #dbefff17;
}
:host([data-theme="dark"]) .header { border-color:#2a4661; background:linear-gradient(140deg,#1c3650,#11243b); }
:host([data-theme="dark"]) .mini { border-color:#426786; background:radial-gradient(#accfed,#315b81); }
:host([data-theme="dark"]) .title, :host([data-theme="dark"]) .empty strong { color:#eaf4ff; }
:host([data-theme="dark"]) .connection, :host([data-theme="dark"]) .source-domain,
:host([data-theme="dark"]) .empty, :host([data-theme="dark"]) .message-label,
:host([data-theme="dark"]) .composer-hint, :host([data-theme="dark"]) .question::placeholder { color:#a6bed6; }
:host([data-theme="dark"]) .icon-button, :host([data-theme="dark"]) .quick { color:#d2ebff; background:#172b43; border-color:#355573; }
:host([data-theme="dark"]) .icon-button:hover, :host([data-theme="dark"]) .quick:hover,
:host([data-theme="dark"]) .icon-button[aria-pressed="true"] { color:#ebf6ff; background:#224466; border-color:#5792c2; }
:host([data-theme="dark"]) .microphone[aria-pressed="true"] { color:#ffe0e8; background:#513247; border-color:#a66479; }
:host([data-theme="dark"]) .source, :host([data-theme="dark"]) .bubble,
:host([data-theme="dark"]) .notice { background:#102137; border-color:#2a4562; color:#e1edf9; }
:host([data-theme="dark"]) .source-title { color:#deecff; }
:host([data-theme="dark"]) .source svg, :host([data-theme="dark"]) .reply-audio,
:host([data-theme="dark"]) .speech-status, :host([data-theme="dark"]) .notice a,
:host([data-theme="dark"]) .retry { color:#97caff; }
:host([data-theme="dark"]) .reply-audio:hover { background:#284b6b; }
:host([data-theme="dark"]) .message.user .bubble { background:#173852; border-color:#315776; }
:host([data-theme="dark"]) .thinking .bubble { color:#b6cee4; }
:host([data-theme="dark"]) .composer { background:#101e31; border-color:#29425d; }
:host([data-theme="dark"]) .question { background:#0d1929; border-color:#3a5875; color:#e4efff; }
:host([data-theme="dark"]) .send { color:#fff; border-color:#428ac8; background:linear-gradient(145deg,#227dc0,#19558d); }
:host([data-theme="dark"]) .send:hover { color:#fff; background:#246fae; border-color:#63a3dd; }
:host([data-theme="dark"]) .attachment-chip, :host([data-theme="dark"]) .remove-attachment { background:#20364c; border-color:#3a5572; color:#d5e9fb; }
:host([data-theme="dark"]) .attachment-chip > svg { color:#98ccff; }
:host([data-theme="dark"]) .remove-attachment:hover { background:#365776; }
:host([data-theme="dark"]) .pet::after { color:#e4f2ff; background:#132740; border-color:#41688b; }
@keyframes saathi-hover { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes saathi-shadow { 0%,100% { opacity: .44; transform: scaleX(1); } 50% { opacity: .28; transform: scaleX(.71); } }
@keyframes saathi-blink { 0%,46%,49%,96%,100% { transform: scaleY(1); } 48%,98% { transform: scaleY(.13); } }
@keyframes saathi-open { from { transform: translateY(7px) scale(.96); opacity: .15; } to { transform: none; opacity: 1; } }
@media (max-width: 430px) {
  :host { --pet-width: 66px; --pet-height: 68px; right: 8px; bottom: 8px; }
  .composer { padding-inline: 8px; }
  .composer-line { gap: 4px; }
  .composer-line .icon-button { width:28px; }
}
@media (max-height: 490px) {
  .header { min-height: 41px; }
  .source { margin-top: 5px; }
}
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation: none !important; transition: none !important; } }
`;
