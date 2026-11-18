import { readFile, writeFile } from "node:fs/promises";
import { Script } from "node:vm";

const input = (name) => new URL("./dist/" + name, import.meta.url);
const read = (name) => readFile(input(name), "utf8");
const [html, css, app, locale, assistant, voice, attachments, avatar, character, icon] = await Promise.all([
  read("index.html"), read("styles.css"), read("app.js"), read("locale.js"),
  read("assistant.js"), read("voice.js"), read("attachments.js"), read("avatar.js"), readFile(input("pet.webp")), readFile(input("icon.svg")),
]);

function inlineModule(source, ...symbols) {
  const body = source.replace(/^export /gm, "");
  const binding = symbols.length === 1 ? symbols[0] : "{ " + symbols.join(", ") + " }";
  return "const " + binding + " = (() => {\n" + body + "\nreturn " + binding + ";\n})();";
}

const avatarUrl = "data:image/webp;base64," + character.toString("base64");
const faviconUrl = "data:image/svg+xml;base64," + icon.toString("base64");
const script = [
  "(() => {",
  inlineModule(locale, "locales"),
  inlineModule(assistant, "replyLocally"),
  inlineModule(voice, "createVoice"),
  inlineModule(attachments, "attachmentAccept", "validateFiles", "encodeAttachment"),
  inlineModule(avatar, "mountAvatar"),
  app.replace(/^import .*;\r?\n/gm, "").replaceAll("./pet.webp", avatarUrl),
  "})();",
].join("\n");
new Script(script, { filename: "BABY-inline.js" });

const standalone = html
  .replace("./icon.svg", faviconUrl)
  .replaceAll("./pet.webp", avatarUrl)
  .replace('<link rel="stylesheet" href="./styles.css">', () => "<style>\n" + css.replace(/^@import .*;\r?\n/gm, "") + "\n</style>")
  .replace('<script type="module" src="./app.js"></script>', () => "<script>\n" + script.replace(/<\/script/giu, "<\\/script") + "\n</script>");

await writeFile(new URL("./BABY.html", import.meta.url), standalone);
