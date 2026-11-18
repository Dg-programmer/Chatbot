(() => {
  const maxPageCharacters = 22000;
  const excluded = [
    "script", "style", "noscript", "template", "svg", "canvas", "audio", "video", "iframe",
    "form", "input", "textarea", "select", "button", "datalist", "output",
    "[contenteditable]:not([contenteditable='false'])", "[role='textbox']", "[role='searchbox']",
    "[role='dialog']", "[aria-modal='true']", "[hidden]", "[aria-hidden='true']", "[inert]",
    "nav", "footer", "[role='navigation']", "[role='contentinfo']", "[data-saathi-pet-root]",
  ].join(",");
  const blocks = "h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,td,th,dt,dd,section,article,div";
  const clean = (text) => text.replace(/[\u0000-\u001f\u007f\s]+/gu, " ").trim();

  function collect(root, document) {
    if (!root || root.closest(excluded)) return "";
    const view = document.defaultView;
    const filters = view.NodeFilter;
    const hidden = (element) => {
      if (element.matches(excluded)) return true;
      const style = view.getComputedStyle(element);
      return style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse"
        || style.opacity === "0" || style.contentVisibility === "hidden"
        || (style.position === "absolute" && style.width === "1px" && style.height === "1px"
          && (style.clip !== "auto" || style.clipPath !== "none"));
    };
    for (let ancestor = root; ancestor; ancestor = ancestor.parentElement) {
      if (hidden(ancestor)) return "";
    }
    const walker = document.createTreeWalker(root, filters.SHOW_ELEMENT | filters.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === 1) return hidden(node) ? filters.FILTER_REJECT : filters.FILTER_SKIP;
        return clean(node.nodeValue || "") ? filters.FILTER_ACCEPT : filters.FILTER_SKIP;
      },
    });

    let output = "";
    let previousBlock;
    let visited = 0;
    for (let node = walker.nextNode(); node && visited < 8000; node = walker.nextNode()) {
      const block = node.parentElement?.closest(blocks);
      const separator = output ? (block === previousBlock ? " " : "\n") : "";
      output += separator + clean(node.nodeValue || "");
      if (output.length >= maxPageCharacters) break;
      previousBlock = block;
      visited += 1;
    }
    return output.slice(0, maxPageCharacters).trim();
  }

  function capture(document, location) {
    const url = new URL(location.href);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("unsupported-page");
    const isGoogle = /(^|\.)google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})$/iu.test(url.hostname);
    const main = (isGoogle && url.pathname === "/search" && document.querySelector("#search"))
      || document.querySelector("main") || document.querySelector("[role='main']") || document.querySelector("article");
    const focused = collect(main, document);
    const fallback = focused.length < 220 && main !== document.body ? collect(document.body, document) : "";
    const safeUrl = (url.origin + url.pathname).slice(0, 4096);
    return {
      title: clean(document.title || url.hostname).slice(0, 300),
      url: safeUrl,
      text: focused.length >= fallback.length ? focused : fallback,
    };
  }

  function payload(question, page, messages) {
    const history = messages.slice(-10).map(({role, text}) => ({ role, text: text.slice(0, 4000) }));
    const request = { question, page, history };
    const encoder = new TextEncoder();
    while (history.length && encoder.encode(JSON.stringify(request)).length > 120 * 1024) {
      history.splice(0, 2);
    }
    return request;
  }

  globalThis.SaathiPageContext = Object.freeze({ capture, payload });
})();
