import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const cookieName = "__Host-baby_session";
const browserSessionSeconds = 7 * 24 * 60 * 60;
const bodyLimit = 6 * 1024;
const ticketPattern = /^v1\.web\.([0-9]{1,12})\.[A-Za-z0-9_-]{22}\.([A-Za-z0-9_-]{43})$/u;
const csp = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

export class HostedAuthError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

function requireMethod(request, response, allowed) {
  if (allowed.includes(request.method)) return;
  response.setHeader("Allow", allowed.join(", "));
  throw new HostedAuthError(405, "method-not-allowed");
}

async function bodyText(request, mime, errorCode) {
  if (request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() !== mime) {
    throw new HostedAuthError(415, errorCode);
  }
  if (Number(request.headers["content-length"]) > bodyLimit) {
    throw new HostedAuthError(413, "message-too-large");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > bodyLimit) throw new HostedAuthError(413, "message-too-large");
    chunks.push(chunk);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw new HostedAuthError(400, "invalid-body");
  }
}

function limitCalls(limit, windowSeconds, errorCode) {
  let recent = [];
  return () => {
    const now = Date.now();
    recent = recent.filter((time) => now - time < windowSeconds * 1000);
    if (recent.length >= limit) throw new HostedAuthError(429, errorCode);
    recent.push(now);
  };
}

function digest(text) {
  return createHash("sha256").update(text).digest();
}

function cookie(value = "", maxAge = 0) {
  return `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function cookieToken(request) {
  const values = (request.headers.cookie ?? "").split(";").map((part) => part.trim())
    .filter((part) => part.startsWith(cookieName + "="));
  return values.length === 1 ? values[0].slice(cookieName.length + 1) : "";
}

function redirect(response, location, sessionCookie) {
  const headers = { Location: location };
  if (sessionCookie) headers["Set-Cookie"] = sessionCookie;
  response.writeHead(303, headers);
  response.end();
}

function renderLogin(response, notice = "", status = 200) {
  response.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": csp,
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "DENY",
  });
  response.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in to BABY</title>
  <style>
    :root{color-scheme:dark;font:16px/1.55 system-ui,sans-serif;color:#eef4ff;background:#0d1524}
    *{box-sizing:border-box}
    body{min-height:100vh;margin:0;padding:1.5rem;display:grid;place-items:center;background:radial-gradient(ellipse at top,#213b65,#0d1524 65%)}
    main{width:100%;max-width:28rem;padding:clamp(1.4rem,5vw,2rem);border:1px solid #394f70;border-radius:1.25rem;background:#142138;box-shadow:0 1.5rem 4rem #050a1480}
    h1{margin:0 0 .4rem;font-size:1.85rem;line-height:1.2}
    p{margin:0 0 1.35rem;color:#b9cbe4}
    label{display:block;margin-bottom:.45rem;font-weight:650}
    input,button{font:inherit;border-radius:.65rem}
    input{width:100%;padding:.7rem .8rem;border:1px solid #5a7193;color:inherit;background:#0e192c}
    input:focus-visible,button:focus-visible{outline:2px solid #90c5ff;outline-offset:3px}
    button{margin-top:1rem;padding:.65rem 1rem;border:0;font-weight:700;color:#102039;background:#a4cbff;cursor:pointer}
    button:hover{background:#c0dbff}
    .notice{margin:.75rem 0 0;color:#ffd1da}
  </style>
</head>
<body>
<main>
  <h1>Sign in to BABY</h1>
  <p>Use your BABY owner password to open your private workspace.</p>
  <form method="post" action="/login">
    <label for="owner-password">Owner password</label>
    <input id="owner-password" name="password" type="password" autocomplete="current-password" maxlength="512" required>
    ${notice ? '<p class="notice" role="alert">' + notice + '</p>' : ""}
    <button type="submit">Sign in</button>
  </form>
</main>
</body>
</html>`);
}

function readOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Set BABY_PUBLIC_ORIGIN to the app’s HTTPS origin or use Render’s RENDER_EXTERNAL_URL.");
  }
  if (url.protocol !== "https:" || url.pathname !== "/" || url.username || url.password || url.search || url.hash) {
    throw new Error("BABY_PUBLIC_ORIGIN must be an HTTPS origin without credentials, path, query, or fragment.");
  }
  return url;
}

export function createHostedAuth(env) {
  const override = env.BABY_PUBLIC_ORIGIN?.trim();
  if (env.RENDER !== "true" && !override) return null;

  const url = readOrigin(override || env.RENDER_EXTERNAL_URL?.trim());
  const ownerPassword = env.BABY_OWNER_PASSWORD;
  const secret = env.BABY_SESSION_SECRET?.trim();
  if (!ownerPassword || ownerPassword.trim().length < 12 || ownerPassword.length > 512) {
    throw new Error("Set BABY_OWNER_PASSWORD to a password with 12–512 characters.");
  }
  if (!secret || secret.length < 32) {
    throw new Error("Set BABY_SESSION_SECRET to a random secret of at least 32 characters.");
  }
  const password = digest(ownerPassword);
  const signingKey = createHmac("sha256", secret).update("BABY hosted session v1\0")
    .update(url.origin).update("\0").update(password).digest();
  const signature = (value) => createHmac("sha256", signingKey).update(value).digest("base64url");
  const limitLogin = limitCalls(12, 60, "signin-rate-limited");

  function mint() {
    const value = ["v1", "web", Math.floor(Date.now() / 1000) + browserSessionSeconds, randomBytes(16).toString("base64url")].join(".");
    return value + "." + signature(value);
  }

  function validToken(token) {
    const parts = ticketPattern.exec(token);
    if (!parts || Number(parts[1]) <= Math.floor(Date.now() / 1000)) return false;
    const value = token.slice(0, -(parts[2].length + 1));
    return timingSafeEqual(Buffer.from(parts[2]), Buffer.from(signature(value)));
  }

  function assertSameOrigin(request) {
    if (request.headers.origin !== url.origin || request.headers["sec-fetch-site"] === "cross-site") {
      throw new HostedAuthError(403, "origin-forbidden");
    }
  }

  function requireOwner(pathname, request, response) {
    if (validToken(cookieToken(request))) return false;
    if (pathname.startsWith("/api/") || !["GET", "HEAD"].includes(request.method)) {
      throw new HostedAuthError(401, "signin-required");
    }
    redirect(response, "/login");
    return true;
  }

  async function handle(pathname, request, response) {
    if (pathname === "/login") {
      requireMethod(request, response, ["GET", "POST"]);
      if (request.method === "GET") {
        if (validToken(cookieToken(request))) redirect(response, "/");
        else renderLogin(response);
        return true;
      }
      assertSameOrigin(request);
      try {
        limitLogin();
      } catch {
        // The request body remains bounded before returning the retry page.
        await bodyText(request, "application/x-www-form-urlencoded", "form-required");
        response.setHeader("Retry-After", "60");
        renderLogin(response, "Too many attempts. Wait a minute and try again.", 429);
        return true;
      }
      const body = await bodyText(request, "application/x-www-form-urlencoded", "form-required");
      const passwords = new URLSearchParams(body).getAll("password");
      const received = passwords.length === 1 ? passwords[0] : "";
      if (!received || received.length > 512 || !timingSafeEqual(password, digest(received))) {
        renderLogin(response, "That password didn’t match. Try again.", 401);
        return true;
      }
      redirect(response, "/", cookie(mint(), browserSessionSeconds));
      return true;
    }

    if (pathname === "/logout") {
      requireMethod(request, response, ["POST"]);
      assertSameOrigin(request);
      redirect(response, "/login", cookie());
      return true;
    }

    return false;
  }

  return { host: url.host, origin: url.origin, handle, requireOwner, assertSameOrigin };
}
