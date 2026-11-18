import { hostedOrigin, localOrigin, pairingCodePattern } from "./connection-origin.js";

const get = (id) => document.getElementById(id);
const [status, open, check, local, pair, originInput, codeInput, connect, feedback] = [
  "status", "open", "check", "local", "pair", "origin", "code", "connect", "feedback",
].map(get);
const errors = {
  "invalid-host": "Enter the HTTPS address of your hosted BABY without a page path.",
  "invalid-pairing-code": "Copy the complete pairing code from your signed-in BABY.",
  "pairing-code-expired": "This code has expired or was already used. Generate a new one in BABY.",
  "pairing-rate-limited": "Too many pairing attempts. Wait a moment before trying again.",
  "host-permission-required": "Allow BABY to connect to this host in the browser permission prompt.",
  "server-offline": "Open the hosted BABY, wait for it to load, then try again.",
  "analysis-timeout": "Open the hosted BABY, wait for it to load, then try again.",
  "origin-forbidden": "This BABY server doesn’t recognize the extension. Check that both are up to date.",
};
let revision = 0;

function describe(result) {
  const name = result.mode === "hosted" ? `Hosted BABY (${new URL(result.origin).hostname})` : "Local BABY";
  if (result.connected) return `${name} is connected to OpenAI.`;
  if (result.error === "extension-auth-required") return `${name} needs to be paired again. Generate a new code after signing in.`;
  if (result.error === "host-permission-required") return `${name} needs access to its host. Pair it again to allow access.`;
  if (result.error === "server-offline" || result.error === "analysis-timeout") {
    return result.mode === "hosted"
      ? `${name} did not respond. Open BABY and wait for it to load, then check again.`
      : "Local BABY did not respond. Start it on this computer, then check again.";
  }
  if (result.error && !["provider-auth", "provider-unconfigured"].includes(result.error)) {
    return errors[result.error] || "Could not check the connection. Reload the extension and try again.";
  }
  return `${name} needs an OpenAI connection. Open BABY to check its setup.`;
}

function render(result) {
  const origin = result?.mode === "hosted" ? hostedOrigin(result.origin) : result?.mode === "local" ? localOrigin : null;
  open.hidden = !origin;
  if (origin) open.href = `${origin}/`;
  else open.removeAttribute("href");
  local.hidden = result?.mode !== "hosted";
  if (result?.mode === "hosted" && origin && !originInput.value) originInput.value = origin;
  status.textContent = origin ? describe(result) : "Could not read the connection. Reload the extension and try again.";
}

async function refresh() {
  const current = ++revision;
  check.disabled = true;
  status.textContent = "Checking connection…";
  try {
    const result = await chrome.runtime.sendMessage({ type: "baby:connection:status" });
    if (current === revision) render(result);
  } catch {
    if (current === revision) render();
  } finally {
    if (current === revision) check.disabled = false;
  }
}

function report(message, error = false) {
  feedback.dataset.error = String(error);
  feedback.textContent = message;
}

function busy(value) {
  connect.disabled = value;
  local.disabled = value;
  check.disabled = value;
}

pair.addEventListener("submit", async (event) => {
  event.preventDefault();
  const origin = hostedOrigin(originInput.value);
  const code = codeInput.value.trim();
  if (!origin || !pairingCodePattern.test(code)) {
    report(errors[!origin ? "invalid-host" : "invalid-pairing-code"], true);
    return;
  }
  busy(true);
  report("Connecting…");
  try {
    // Request the exact host from this user gesture before awaiting anything else.
    if (!await chrome.permissions.request({ origins: [`${origin}/*`] })) {
      report(errors["host-permission-required"], true);
      return;
    }
    const result = await chrome.runtime.sendMessage({ type: "baby:connection:pair", origin, code });
    if (result?.mode === "hosted") {
      codeInput.value = "";
      originInput.value = origin;
      report("Paired with hosted BABY.");
      await refresh();
    } else {
      report(errors[result?.error] || "Could not pair with BABY. Check the URL and generate a new code.", true);
    }
  } catch {
    report("Could not pair with BABY. Check the URL and generate a new code.", true);
  } finally {
    busy(false);
  }
});

local.addEventListener("click", async () => {
  busy(true);
  report("");
  try {
    const result = await chrome.runtime.sendMessage({ type: "baby:connection:local" });
    if (result?.mode !== "local") throw new Error("Connection did not change");
    originInput.value = "";
    codeInput.value = "";
    report("Using local BABY.");
    await refresh();
  } catch {
    report("Could not switch to local BABY. Reload the extension and try again.", true);
  } finally {
    busy(false);
  }
});

check.addEventListener("click", refresh);
refresh();
