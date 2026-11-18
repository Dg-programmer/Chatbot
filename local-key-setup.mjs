import { randomBytes } from "node:crypto";

const path = "/setup";
const bodyLimit = 4096;
const keyPattern = /^sk-[A-Za-z0-9_-]{15,509}$/;
const headers = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function respond(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    ...headers,
    "Content-Type": "text/plain; charset=utf-8",
    ...extraHeaders,
  });
  response.end(body);
}

function redirect(response, location) {
  respond(response, 303, "", { Location: location });
}

function renderSetup(response, token, error = "") {
  respond(response, error ? 422 : 200, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connect BABY</title>
  <style>
    :root{color-scheme:dark;font:16px/1.55 system-ui,sans-serif;color:#f6f2ff;background:#120f1e}
    *{box-sizing:border-box}
    body{min-height:100vh;margin:0;padding:1.5rem;display:grid;place-items:center;background:radial-gradient(ellipse at top,#2b1d4b,#120f1e 65%)}
    main{max-width:30rem;width:100%;padding:clamp(1.4rem,5vw,2.15rem);border:1px solid #534174;border-radius:1.25rem;background:#1d162e;box-shadow:0 1.5rem 4rem #08061070}
    h1{margin:0 0 .4rem;font-size:1.85rem;line-height:1.2}
    p{margin:0 0 1.35rem;color:#d0c5e2}
    label{display:block;margin-bottom:.45rem;font-weight:650}
    input,button{font:inherit;border-radius:.65rem}
    input{width:100%;padding:.7rem .8rem;border:1px solid #746198;color:inherit;background:#130f20}
    input:focus-visible,button:focus-visible{outline:2px solid #e2c7ff;outline-offset:3px}
    button{margin-top:1rem;padding:.65rem 1rem;border:0;font-weight:700;color:#211037;background:#cbb0ff;cursor:pointer}
    button:hover{background:#e2c7ff}
    .error{margin:.65rem 0 0;color:#ffd0df}
  </style>
</head>
<body>
<main>
  <h1>Connect BABY</h1>
  <p id="key-hint">Paste your existing OpenAI API key to start chatting. BABY keeps the key in memory for this session.</p>
  <form method="post" action="/setup" autocomplete="off">
    <input type="hidden" name="token" value="${token}">
    <label for="api-key">OpenAI API key</label>
    <input id="api-key" name="key" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" minlength="18" maxlength="512" aria-describedby="key-hint" required>
    ${error ? '<p class="error" role="alert">' + error + '</p>' : ''}
    <button type="submit">Start BABY</button>
  </form>
</main>
</body>
</html>`, { "Content-Type": "text/html; charset=utf-8" });
}

async function readForm(request) {
  if (Number(request.headers["content-length"]) > bodyLimit) return undefined;
  let length = 0;
  const chunks = [];
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    length += chunk.length;
    if (length > bodyLimit) return undefined;
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

export function createLocalKeySetup(onKey) {
  let token = randomBytes(32).toString("base64url");

  return async function handleKeySetup(request, response, origin) {
    const pathname = new URL(request.url, origin).pathname;
    if (pathname === "/" && request.method === "GET" && token) {
      redirect(response, path);
      return true;
    }
    if (pathname !== path) return false;

    if (request.method === "GET") {
      if (token) renderSetup(response, token);
      else redirect(response, "/");
      return true;
    }
    if (request.method !== "POST") {
      respond(response, 405, "Method not allowed.", { Allow: "GET, POST" });
      return true;
    }

    if (!token || request.headers.origin !== origin || request.headers["sec-fetch-site"] === "cross-site") {
      respond(response, 403, "Open the setup page in this browser and try again.");
      return true;
    }
    const contentType = request.headers["content-type"]?.split(";")[0].trim().toLowerCase();
    if (contentType !== "application/x-www-form-urlencoded") {
      respond(response, 415, "Submit the key using the BABY setup form.");
      return true;
    }

    let form;
    try {
      form = await readForm(request);
    } catch {
      respond(response, 400, "Unable to read the setup form.");
      return true;
    }
    if (!form) {
      respond(response, 413, "The setup form is too large.");
      return true;
    }
    const tokens = form.getAll("token");
    if (!token || tokens.length !== 1 || tokens[0] !== token) {
      respond(response, 403, "Open the setup page again, then submit the form.");
      return true;
    }
    const keys = form.getAll("key");
    const key = keys.length === 1 ? keys[0].trim() : "";
    if (!keyPattern.test(key)) {
      renderSetup(response, token, "Paste the complete API key by itself, starting with sk-.");
      return true;
    }

    try {
      onKey(key);
    } catch {
      respond(response, 500, "Unable to connect BABY. Restart the launcher and try again.");
      return true;
    }
    token = undefined;
    redirect(response, "/");
    return true;
  };
}
