export const localOrigin = "http://127.0.0.1:4173";

export function hostedOrigin(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.pathname === "/" && !url.port
      && !url.username && !url.password && !url.search && !url.hash
      && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/iu.test(url.hostname)) return url.origin;
  } catch {
    // An incomplete or invalid URL cannot be granted host access.
  }
  return null;
}

export const pairingCodePattern = /^BABY-[A-Za-z0-9_-]{20}$/u;
