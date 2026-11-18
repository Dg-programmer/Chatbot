const intents = {
  translate: /\b(?:translat(?:e|ion)|how (?:do|can) (?:i|you) say)\b|\bwhat (?:is|does) .+ (?:in (?:english|hindi)|mean (?:in (?:english|hindi))?)\b|अनुवाद|तर्जुमा|मतलब (?:बताओ|क्या है)/iu,
  summary: /\b(?:summari[sz]e|summary|key (?:points|takeaways)|tl;dr)\b|सारांश|सार बताओ|मुख्य बातें/iu,
  email: /\b(?:e-?mail|draft a letter)\b|ईमेल|ई-मेल|पत्र लिख/iu,
  checklist: /\b(?:checklist|to-do list|todo list)\b|चेकलिस्ट|कामों की सूची|कार्यों की सूची/iu,
  plan: /\b(?:plan|schedule|organize|organise)\b|योजना|दिनचर्या|समय-सारणी|टाइमटेबल/iu,
  ideas: /\b(?:brainstorm|ideas?|creative prompts?)\b|विचार|आइडिया|सुझाव/iu,
  fact: /\b(?:fun|interesting|random) fact\b|रोचक तथ्य|दिलचस्प तथ्य|मज़ेदार तथ्य|मजेदार तथ्य/iu,
};

const phrasebook = [
  ["hello", "नमस्ते"], ["good morning", "सुप्रभात"], ["good night", "शुभ रात्रि"],
  ["good evening", "शुभ संध्या"], ["how are you", "आप कैसे हैं"],
  ["i am fine", "मैं ठीक हूँ"], ["thank you", "धन्यवाद"], ["please", "कृपया"],
  ["sorry", "माफ़ कीजिए"], ["excuse me", "क्षमा कीजिए"], ["yes", "हाँ"], ["no", "नहीं"],
  ["goodbye", "अलविदा"], ["welcome", "स्वागत है"], ["see you later", "फिर मिलेंगे"],
  ["i don't understand", "मुझे समझ नहीं आया"], ["do you speak english", "क्या आप अंग्रेज़ी बोलते हैं"],
  ["where is the station", "स्टेशन कहाँ है"], ["how much does it cost", "इसकी कीमत कितनी है"],
  ["i need help", "मुझे मदद चाहिए"], ["what is your name", "आपका नाम क्या है"],
  ["nice to meet you", "आपसे मिलकर अच्छा लगा"], ["happy birthday", "जन्मदिन मुबारक हो"],
  ["water", "पानी"], ["today", "आज"], ["friend", "दोस्त"],
];

const extraHindi = new Map([
  ["शुक्रिया", "thank you"], ["नमस्कार", "hello"], ["शुभ प्रभात", "good morning"],
  ["आपका स्वागत है", "welcome"], ["माफ कीजिए", "sorry"],
]);

const spokenNumbers = new Map([
  ..."zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ")
    .map((word, value) => [word, value]),
  ..."शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस".split(" ")
    .map((word, value) => [word, value]),
  ["पांच", 5], ["छः", 6], ["twenty", 20], ["thirty", 30], ["forty", 40], ["fifty", 50],
  ["sixty", 60], ["seventy", 70], ["eighty", 80], ["ninety", 90],
]);

const facts = [
  ["An octopus has three hearts. Two pump blood to the gills and the third pumps it around the rest of the body.",
    "ऑक्टोपस के तीन दिल होते हैं। दो गलफड़ों तक ख़ून पहुँचाते हैं और तीसरा शरीर के बाकी हिस्सों तक।"],
  ["A day on Venus, measured by one full rotation, lasts longer than its year. Venus takes about 243 Earth days to rotate and 225 to orbit the Sun.",
    "शुक्र ग्रह को अपनी धुरी पर एक बार घूमने में सूर्य का एक चक्कर लगाने से ज़्यादा समय लगता है। इसमें लगभग 243 और 225 पृथ्वी दिवस लगते हैं।"],
  ["Wombats produce cube-shaped droppings. Different parts of their intestines stretch by different amounts, which helps form the corners.",
    "वॉम्बैट का मल घन के आकार का होता है। उसकी आँत के हिस्से अलग-अलग मात्रा में खिंचते हैं, जिससे कोने बनते हैं।"],
  ["When honeybees find food, they can use a waggle dance to communicate its direction and distance to other bees.",
    "मधुमक्खियाँ भोजन मिलने पर एक खास नृत्य से दूसरी मधुमक्खियों को उसकी दिशा और दूरी बता सकती हैं।"],
];

const help = [
  "I can work with text you share, turn tasks into a plan, draft emails, suggest ideas, calculate expressions, and translate common English and Hindi phrases.\n\nTry ‘Make a checklist for packing’ or ‘Summarize:’ followed by your text.",
  "मैं दिए गए पाठ का सार लिख सकता हूँ, आपके कामों की योजना बना सकता हूँ, ईमेल का मसौदा लिख सकता हूँ, सुझाव दे सकता हूँ, गणना कर सकता हूँ और आम अंग्रेज़ी-हिंदी वाक्यांशों का अनुवाद कर सकता हूँ।\n\n‘पैकिंग की चेकलिस्ट बनाओ’ लिखें, या ‘सारांश:’ के बाद अपना पाठ जोड़ें।",
];

function choose(pair, hindi) {
  return pair[hindi ? 1 : 0];
}

function normalize(text) {
  return text.normalize("NFKC").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').trim();
}

function phraseKey(text) {
  return normalize(text).toLowerCase().replace(/^[\s'"«]+|[\s'"»?.!।,]+$/g, "");
}

function payload(text) {
  return text.match(/[:：]\s*([\s\S]+)$/u)?.[1].trim() || "";
}

function quoted(text) {
  return text.match(/"([^"\n]+)"|“([^”\n]+)”|‘([^\n]+?)’(?=\s|[.!?,]|$)|'([^\n]+?)'(?=\s|[.!?,]|$)/u)?.slice(1).find(Boolean) || "";
}

function previousUser(messages) {
  return messages.slice(0, -1).findLast(({ role }) => role === "user")?.text || "";
}

function pastName(messages) {
  const introduction = /(?:^|[.!?]\s*)(?:my name is |call me |मेरा नाम\s+|मुझे\s+)([\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+){0,3}?)(?:\s+(?:है|कहो|बुलाओ))?[.!?।]*$/iu;
  return messages.findLast(({ role, text }) => role === "user" && introduction.test(text.trim()))?.text.trim().match(introduction)?.[1];
}

function translate(text, hindi, previous) {
  const target = (value) => value.match(/\b(?:to|in|into) (english|hindi)\b|(अंग्रेज़?ी|हिंदी|हिन्दी) में/iu);
  const requested = target(text) || target(previous);
  const phrase = quoted(text) || (payload(text) || text)
    .replace(/^\s*(?:please\s+)?(?:translate|translation(?: of)?|how (?:do|can) (?:i|you) say|what (?:is|does))\s*/iu, "")
    .replace(/(?:^|\s+)(?:to|into|in) (?:english|hindi)[.?!]*$/iu, "")
    .replace(/\s+mean[.?!]*$/iu, "")
    .replace(/\s*(?:का\s+)?(?:हिंदी|हिन्दी|अंग्रेज़?ी)?\s*(?:में\s+)?(?:अनुवाद|मतलब)(?:\s+(?:करो|बताओ|करें|क्या है))?[.?!।]*$/iu, "")
    .trim();

  const key = phraseKey(phrase);
  const sourceHindi = /\p{Script=Devanagari}/u.test(key);
  const targetHindi = requested ? /hindi|हिंदी|हिन्दी/iu.test(requested[0]) : !sourceHindi;
  const pair = phrasebook.find(([en, hi]) => key === phraseKey(targetHindi ? en : hi));
  const extra = !targetHindi && extraHindi.get(key);
  if (pair || extra) {
    const translation = extra || pair[targetHindi ? 1 : 0];
    return targetHindi ? translation : translation[0].toUpperCase() + translation.slice(1);
  }

  if (!key || /^(?:english|hindi|अनुवाद करो)$/iu.test(key)) {
    return choose(["Which phrase should I translate? Try ‘good morning’ or ‘धन्यवाद’.",
      "किस वाक्यांश का अनुवाद करूँ? ‘good morning’ या ‘धन्यवाद’ से शुरू करें।"], hindi);
  }

  return choose(["I couldn’t find that phrase in my local phrasebook. Try ‘How are you?’, ‘Where is the station?’, or ‘आपका नाम क्या है?’.",
    "यह वाक्यांश मेरी स्थानीय शब्दावली में नहीं मिला। ‘How are you?’, ‘Where is the station?’ या ‘आपका नाम क्या है?’ आज़माएँ।"], hindi);
}

function summarize(text, hindi, followup) {
  const source = (followup && text) || payload(text) || text
    .replace(/^\s*(?:please\s+)?(?:summari[sz]e(?: this| the following)?|summary of|tl;dr)\s*/iu, "")
    .replace(/^\s*(?:इसका\s+)?सारांश(?:\s+लिखो|\s+बताओ|\s+बनाओ)?\s*/u, "");
  const sentences = source.split(/(?<=[.!?।])\s+|\n+/u).map((sentence) => sentence.trim()).filter(Boolean);
  if (source === text && !followup || source.length < 26) {
    return choose(["Paste the text you want summarized. I’ll pull out its key sentences.",
      "जिस पाठ का सार चाहिए, उसे यहाँ डालें। मैं उसके मुख्य वाक्य चुन दूँगा।"], hindi);
  }

  const common = new Set(("the a an and was were is this these that with for from they you " +
    "are has have will not but then into our their its एक और यह के से का की को पर इस वह है हैं था थे").split(" "));
  const words = (sentence) => (sentence.toLowerCase().match(/[\p{L}\p{M}]+/gu) || [])
    .filter((word) => word.length > 2 && !common.has(word));
  const frequency = new Map();
  const vocabulary = sentences.map((sentence) => [...new Set(words(sentence))]);
  for (const terms of vocabulary) {
    for (const word of terms) frequency.set(word, (frequency.get(word) || 0) + 1);
  }
  const score = (terms, index) => terms.reduce((total, word) => total + (frequency.get(word) || 0), 0)
    / Math.max(1, terms.length) + (index === 0 ? 0.25 : 0);
  const count = Math.min(3, Math.max(1, Math.ceil(sentences.length / 2)));
  const summary = vocabulary.map((terms, index) => ({ index, score: score(terms, index) }))
    .sort((first, second) => second.score - first.score).slice(0, count)
    .sort((first, second) => first.index - second.index).map(({ index }) => `• ${sentences[index]}`);
  return `${hindi ? "पाठ के मुख्य बिंदु" : "Key points from your text"}\n\n${summary.join("\n")}`;
}

function draftEmail(text, hindi, followup) {
  const description = (followup && text) || payload(text) ||
    text.match(/\b(?:e-?mail|letter)\s+(.+)/iu)?.[1] ||
    text.match(/^(.{5,}?)\s*(?:का|के लिए|को)\s+(?:एक\s+)?(?:छोटा\s+)?ईमेल/u)?.[1] || "";
  const recipient = description.match(/(?:^|\s)to\s+(?:my\s+)?([^,.!\n]+?)(?=\s+(?:to|about|for|asking|requesting|regarding)\b|[,\n]|$)/iu)?.[1]
    || description.match(/^(?:(?:मेरे|मेरी|अपने|अपनी)\s+)?(.{2,35}?)\s*को\s/u)?.[1] || (hindi ? "[नाम]" : "[Name]");
  const topic = description.replace(/^to\s+(?:my\s+)?[^,.!\n]+?(?=\s+(?:to|about|for|asking|requesting|regarding)\b|[,\n]|$)/iu, "")
    .replace(/^.{2,35}?\s*को\s/u, "").replace(/^(?:[,:\s]+|(?:about|for|regarding|to)\s+)+/iu, "")
    .replace(/[.!।?\s]+$/u, "").trim();

  if (!topic || /^(?:draft|please|लिखो|बनाओ|लिखें)$/iu.test(topic)) {
    return choose(["Who’s the email for, and what should it say? For example, ‘To my professor, asking for an extension until Friday.’",
      "ईमेल किसे भेजना है और उसमें क्या कहना है? उदाहरण के लिए, ‘मेरे शिक्षक को शुक्रवार तक अतिरिक्त समय माँगने के लिए।’"], hindi);
  }

  const sender = hindi ? "[आपका नाम]" : "[Your name]";
  const request = topic.match(/^(?:ask(?:ing)? for|request(?:ing)?)\s+(.+)$/iu)?.[1];
  if (hindi) {
    const hindiRequest = topic.match(/^(.+?)\s+माँगने(?:\s+के लिए)?$/u)?.[1];
    const subject = hindiRequest ? `${hindiRequest} का अनुरोध` : topic.replace(/\s+के लिए$/u, "");
    const body = hindiRequest ? `क्या मुझे ${hindiRequest} मिल सकता है?`
      : `${subject} के बारे में आपसे बात करना चाहता हूँ। कृपया बताइए कि इस पर आगे कैसे बढ़ा जा सकता है।`;
    return `विषय — ${subject}\n\nनमस्ते ${recipient},\n\n${body}\n\nआपके समय के लिए धन्यवाद।\n\nसादर,\n${sender}`;
  }

  const subject = request ? `Request for ${request}` : topic[0].toUpperCase() + topic.slice(1);
  const body = request ? `I’m writing to request ${request}. Would that be possible?`
    : `I’m reaching out about ${topic}. Could you let me know the best way to move forward?`;
  return `Subject — ${subject}\n\nHi ${recipient},\n\n${body}\n\nThanks for your time.\n\nBest,\n${sender}`;
}

function planDay(text, hindi, followup) {
  const source = (followup && text) || payload(text) ||
    text.match(/\b(?:day|week|afternoon|morning|schedule)\s+(?:with|around)\s+(.+)/iu)?.[1] ||
    text.match(/(?:इन कामों के लिए|इन कामों को शामिल करके)\s+(.+)/u)?.[1] || "";
  const tasks = source.split(/[,;\n]+|\s+(?:and|और)\s+/iu)
    .map((task) => task.trim().replace(/[.!।?]+$/u, "")).filter(Boolean);
  const headings = hindi ? ["सुबह", "दोपहर", "शाम"] : ["Morning", "Afternoon", "Evening"];
  const examples = hindi ? ["सबसे ज़रूरी काम के लिए 60–90 मिनट रखें।", "छोटे काम निपटाएँ और अगले काम से पहले थोड़ा आराम करें।", "जो पूरा हुआ उसे देखें और कल की पहली प्राथमिकता चुनें।"]
    : ["Give your most important task 60–90 minutes.", "Group smaller tasks and leave room for a break.", "Review what you finished and pick tomorrow’s first priority."];
  const blocks = headings.map((heading, index) => {
    const group = tasks.filter((_, taskIndex) => Math.floor(taskIndex * 3 / Math.max(1, tasks.length)) === index);
    const content = group.length ? group.join(hindi ? " और " : " and ") : examples[index];
    return `• ${heading} — ${content}`;
  });

  const close = tasks.length ? "" : choose(["\n\nSend me the tasks you need to fit in, and I’ll put them into the plan.",
    "\n\nअपने काम बताइए, मैं उन्हें योजना में शामिल कर दूँगा।"], hindi);
  return `${hindi ? "आज की योजना" : "A plan for your day"}\n\n${blocks.join("\n")}${close}`;
}

function checklist(text, hindi, followup) {
  const topic = (followup && text) || quoted(text) || payload(text) ||
    text.match(/\b(?:checklist|to-?do list)\s+(?:for|of|to)\s+(.+)/iu)?.[1] ||
    text.match(/^(.{2,}?)\s+(?:की|के लिए)\s+(?:चेकलिस्ट|सूची)/u)?.[1] || "";
  if (!topic) return choose(["What’s the checklist for? You can also paste a comma-separated list of tasks.",
    "चेकलिस्ट किस काम के लिए चाहिए? चाहें तो कामों को कॉमा लगाकर लिखें।"], hindi);

  const explicit = topic.split(/[,;\n]+/u).map((item) => item.trim()).filter(Boolean);
  const packing = /pack|travel|trip|यात्रा|पैकिंग|सफ़र|सफर/iu.test(topic);
  const pack = hindi ? ["पहचान पत्र, टिकट और बुकिंग की जानकारी रखें।", "मौसम और यात्रा की अवधि के हिसाब से कपड़े रखें।", "दवाएँ, चार्जर और ज़रूरी सामान रखें।", "निकलने से पहले बैग, चाबियाँ और फ़ोन जाँचें।"]
    : ["Pack ID, tickets, and booking details.", "Pack clothing for the weather and trip length.", "Gather medication, chargers, and toiletries.", "Check your bag, keys, and phone before leaving."];
  const steps = hindi ? ["ज़रूरी सामान और जानकारी जुटाएँ।", "समय सीमा तय करें।", "पहला काम पूरा करें और बाकी कामों को क्रम दें।", "नतीजा जाँचें और बाकी काम लिखें।"]
    : ["Gather the materials and information you need.", "Set a deadline.", "Finish the first task, then order the remaining ones.", "Check the result and note anything still open."];
  const items = explicit.length > 1 ? explicit : packing ? pack : steps;
  const name = explicit.length > 1 ? (hindi ? "कामों की सूची" : "Task checklist") : topic;
  return `${name}\n\n${items.map((item) => `☐ ${item}`).join("\n")}`;
}

function brainstorm(text, hindi, followup) {
  const subject = (followup && text) || quoted(text) || payload(text) ||
    text.match(/\b(?:ideas?|brainstorm)\s+(?:(?:for|about|on)\s+)?(.+)/iu)?.[1] ||
    text.match(/^(.+?)\s+के लिए\s+(?:विचार|आइडिया|सुझाव)/u)?.[1];
  if (!subject) return choose(["What are you brainstorming? Share a topic and who it’s for.",
    "आप किस विषय पर विचार चाहते हैं? विषय और श्रोता या उपयोगकर्ता बताइए।"], hindi);

  const ideas = /gift|birthday|उपहार|तोहफ़ा|जन्मदिन/iu.test(subject)
    ? choose([["Collect photos or memories in a small printed book.", "Plan an activity you can do together.", "Put together a kit for a hobby they already enjoy."],
      ["तस्वीरों या यादों की छोटी किताब बनाइए।", "साथ में करने के लिए कोई गतिविधि चुनिए।", "उनके पसंदीदा शौक से जुड़ी चीज़ों की किट बनाइए।"]], hindi)
    : choose([["Start with a version you can try in one hour with materials you already have.", "Ask someone who would use it what they find hardest, then make an option for that need.", "Create two versions that solve the same problem, and ask one person to try both."],
      ["मौजूदा साधनों से ऐसा पहला रूप बनाइए जिसे एक घंटे में आज़मा सकें।", "जिसके लिए बना रहे हैं, उससे उसकी सबसे बड़ी परेशानी पूछिए और उसके लिए कोई विकल्प बनाइए।", "एक ही समस्या के दो समाधान बनाइए और किसी एक व्यक्ति से दोनों आज़माने को कहिए।"]], hindi);
  return `${hindi ? "शुरुआती विचार" : "Starting ideas"} · ${subject}\n\n${ideas.map((idea) => `• ${idea}`).join("\n")}`;
}

function calculate(text, hindi) {
  const spokenExpression = /\b(?:plus|minus|times|multiplied|divided|percent|calculate|compute|solve)\b|प्लस|जोड़|घटा|माइनस|भाग|गुणा|गुना|प्रतिशत|गणना|हल करो/iu.test(text);
  let expression = text.toLowerCase().replace(/[०-९]/gu, (digit) => String(digit.codePointAt(0) - 0x966))
    .replace(/^(?:please\s+)?(?:what (?:is|equals)|calculate|compute|solve|गणना करो|हल करो)\s*[:：]?\s*/iu, "")
    .replace(/\s*(?:कितना है|कितना होगा|बराबर)?[?=।]*$/u, "");
  if (spokenExpression) {
    expression = expression
      .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[ -](one|two|three|four|five|six|seven|eight|nine)\b/gu,
        (_, tens, units) => String(spokenNumbers.get(tens) + spokenNumbers.get(units)))
      .replace(/[\p{L}\p{M}]+/gu, (word) => String(spokenNumbers.get(word) ?? word))
      .replace(/\bplus\b|प्लस|जोड़(?:ो)?/gu, "+").replace(/\bminus\b|माइनस|घटा(?:ओ)?/gu, "-")
      .replace(/\b(?:multiplied by|times)\b|गुणा|गुना/gu, "*").replace(/\bdivided by\b|भाग(?:\s+दो)?/gu, "/")
      .replace(/\b(?:percent|per cent)\b|प्रतिशत/gu, "%");
  }
  expression = expression.replace(/[×x]/gu, "*").replace(/÷/gu, "/").replace(/[−–]/gu, "-")
    .replace(/(\d+(?:\.\d+)?)\s*का\s*(\d+(?:\.\d+)?)\s*%/iu, "($2/100)*$1")
    .replace(/(\d+(?:\.\d+)?)\s*%\s*(?:of\b|का)/iu, "($1/100)*").replace(/(\d+(?:\.\d+)?)\s*%/gu, "($1/100)")
    .replace(/\s+/gu, "");
  if (!expression || expression.length > 128 || !/^[0-9.+*/^()-]+$/u.test(expression) || !/\d/u.test(expression)) return null;

  let index = 0;
  const consume = (character) => {
    if (expression[index] !== character) return false;
    index++;
    return true;
  };

  function primary() {
    if (consume("(")) {
      const value = add();
      if (!consume(")")) throw new Error("parenthesis");
      return value;
    }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)/u.exec(expression.slice(index))?.[0];
    if (!number) throw new Error("number");
    index += number.length;
    return Number(number);
  }

  function unary() {
    if (consume("-")) return -unary();
    if (consume("+")) return unary();
    const value = primary();
    return consume("^") ? value ** unary() : value;
  }

  function multiply() {
    let value = unary();
    while (expression[index] === "*" || expression[index] === "/") {
      const operator = expression[index++];
      const right = unary();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function add() {
    let value = multiply();
    while (expression[index] === "+" || expression[index] === "-") {
      const operator = expression[index++];
      const right = multiply();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  try {
    const value = add();
    if (index !== expression.length) throw new Error("trailing input");
    if (!Number.isFinite(value)) return choose(["That expression has no finite result. Check any division by zero or large power.",
      "इस गणना का परिणाम सीमित संख्या नहीं है। देखें कि कहीं शून्य से भाग या बहुत बड़ी घात तो नहीं है।"], hindi);
    return `${hindi ? "उत्तर" : "Answer"} · ${new Intl.NumberFormat(hindi ? "hi-IN" : "en-IN", { maximumSignificantDigits: 13 }).format(value)}`;
  } catch {
    return choose(["I couldn’t read that expression. Try ‘(12 + 8) / 4’ or ‘15% of 200’.",
      "मैं इस गणना को समझ नहीं पाया। ‘(12 + 8) / 4’ या ‘15% of 200’ आज़माएँ।"], hindi);
  }
}

export function replyLocally(messages, language) {
  const text = messages.findLast(({ role }) => role === "user")?.text.trim() || "";
  const hindi = language === "hi";
  const previous = previousUser(messages);
  const previousAnswer = messages.slice(0, -1).findLast(({ role }) => role === "assistant")?.text || "";
  const matched = Object.keys(intents).find((key) => intents[key].test(text));
  const newCommand = /^(?:(?:please|can you|could you|help me)\s+)*(?:translate|summari[sz]e|draft|write|create|make|plan|brainstorm|give me|tell me|सारांश|अनुवाद|बताओ|लिखो)\b/iu.test(text)
    || /(?:बनाओ|बताओ|लिखो|करो|कीजिए)[.?!।]*$/u.test(text);
  const again = /^(?:another(?: one)?|one more|again|tell me another|और बताओ|एक और(?: बताओ)?|फिर से)[.!?।]*$/iu.test(text);
  const mathAnswer = !matched && calculate(text, hindi);
  if (mathAnswer) return mathAnswer;
  const greeting = /^(?:hi|hello|hey|good morning|good evening|namaste|नमस्ते|नमस्कार|हैलो)[!?.।\s]*$/iu.test(text);
  const helpRequested = /\b(?:what can you do|how can you help|capabilities)\b|^help[!?\s]*$|तुम क्या कर सकते हो|आप क्या कर सकते हैं|^मदद[!।\s]*$/iu.test(text);
  if (helpRequested) return choose(help, hindi);
  const typedReply = (!matched || !newCommand) && !again && text.length > 1;
  const pending = typedReply && Object.keys(intents).find((key) => intents[key].test(previous) && (
    key === "translate" && /Which phrase|किस वाक्यांश/u.test(previousAnswer) ||
    key === "summary" && /Paste the text|जिस पाठ का सार/u.test(previousAnswer) ||
    key === "email" && /Who’s the email|ईमेल किसे/u.test(previousAnswer) ||
    key === "plan" && /Send me the tasks|अपने काम बताइए/u.test(previousAnswer) ||
    key === "checklist" && /What’s the checklist|चेकलिस्ट किस/u.test(previousAnswer) ||
    key === "ideas" && /What are you brainstorming|आप किस विषय/u.test(previousAnswer)
  ));

  const lastReplyWasFact = facts.some((pair) => pair.includes(previousAnswer));
  const intent = pending || matched || (again && lastReplyWasFact ? "fact" : null);
  switch (intent) {
    case "translate": return translate(text, hindi, pending ? previous : "");
    case "summary": return summarize(text, hindi, Boolean(pending));
    case "email": return draftEmail(text, hindi, Boolean(pending));
    case "plan": return planDay(text, hindi, Boolean(pending));
    case "checklist": return checklist(text, hindi, Boolean(pending));
    case "ideas": return brainstorm(text, hindi, Boolean(pending));
    case "fact": {
      const count = messages.filter(({ role, text }) => role === "assistant" && facts.some((pair) => pair.includes(text))).length;
      return choose(facts[count % facts.length], hindi);
    }
  }

  if (/\b(?:what(?:'s| is) my name|do you remember my name)\b|मेरा नाम क्या है|मेरा नाम याद है/iu.test(text)) {
    const name = pastName(messages.slice(0, -1));
    return name ? choose([`You told me your name is ${name}.`, `आपने बताया था कि आपका नाम ${name} है।`], hindi)
      : choose(["Tell me your name and I can use it in this conversation.", "अपना नाम बताइए, मैं इस बातचीत में उसका इस्तेमाल कर सकता हूँ।"], hindi);
  }

  const name = pastName([{ role: "user", text }]);
  if (name) return choose([`Nice to meet you, ${name}! What would you like to work on?`, `आपसे मिलकर खुशी हुई, ${name}! आप किस काम में मदद चाहेंगे?`], hindi);

  if (/\b(?:what(?:'s| is) (?:your name|the date|the time)|what day is it|what time is it|today'?s date|current time)\b|आज कौन सा दिन|आज की तारीख|कितने बजे|क्या समय है|तुम्हारा नाम/iu.test(text)) {
    if (/your name|तुम्हारा नाम/iu.test(text)) return choose(["I’m BABY, your English and Hindi assistant.", "मैं साथी हूँ, आपका अंग्रेज़ी और हिंदी सहायक।"], hindi);
    const time = /\btime\b|कितने बजे|समय/iu.test(text);
    const now = new Intl.DateTimeFormat(hindi ? "hi-IN" : "en-IN", time ? { timeStyle: "short" } : { dateStyle: "full" }).format(new Date());
    return `${hindi ? (time ? "अभी का समय" : "आज की तारीख") : (time ? "Local time" : "Today")} · ${now}`;
  }

  if (greeting) {
    const savedName = pastName(messages.slice(0, -1));
    return choose([`Hello${savedName ? `, ${savedName}` : ""}! What can I help you with?`,
      `नमस्ते${savedName ? `, ${savedName}` : ""}! मैं आपकी क्या मदद कर सकता हूँ?`], hindi);
  }

  if (/^(?:how (?:are you|is it going)|आप कैसे हैं|तुम कैसे हो|कैसे हो)[!?।\s]*$/iu.test(text)) {
    return choose(["I’m here and ready to help. How’s your day going?", "मैं आपकी मदद के लिए तैयार हूँ। आपका दिन कैसा जा रहा है?"], hindi);
  }

  if (/^(?:thank(?:s| you)(?: so much)?|धन्यवाद|शुक्रिया)[!?।\s]*$/iu.test(text)) {
    return choose(["You’re welcome!", "खुशी हुई कि मदद कर सका!"], hindi);
  }

  return choose(["I can help with a specific task in local mode. Try a calculation, a daily plan, a short email draft, or paste text for a summary.",
    "इस मोड में मैं किसी तय काम में मदद कर सकता हूँ। गणना, दिन की योजना या ईमेल का मसौदा माँगें, या सारांश के लिए अपना पाठ डालें।"], hindi);
}
