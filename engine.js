// ============================================================
// StormCheck — engine.js
// The "brain" of the app. It reads a message and decides:
//   VERIFIED   = comes from / links to an official source, no warning signs
//   SUSPICIOUS = has scam or fake-news warning signs
//   UNVERIFIED = no warning signs, but nothing official to confirm it
//
// Everything runs ON THE PHONE. Nothing the user pastes is sent anywhere,
// which is also why it keeps working when the internet is down.
// ============================================================

(function (root) {
  "use strict";

  // ---------- 1. Official websites we trust ----------
  const TRUSTED_DOMAINS = [
    { domain: "nhc.noaa.gov", name: "the National Hurricane Center" },
    { domain: "weather.gov", name: "the National Weather Service" },
    { domain: "noaa.gov", name: "NOAA, the national weather agency" },
    { domain: "disasterassistance.gov", name: "FEMA (DisasterAssistance.gov)" },
    { domain: "fema.gov", name: "FEMA" },
    { domain: "ready.gov", name: "Ready.gov (federal government)" },
    { domain: "miamidade.gov", name: "Miami-Dade County" },
    { domain: "floridadisaster.org", name: "the Florida Division of Emergency Management" },
    { domain: "myflorida.com", name: "the State of Florida" },
    { domain: "redcross.org", name: "the American Red Cross" },
  ];

  // Official phone numbers (digits only)
  const OFFICIAL_PHONES = [
    { digits: "8006213362", name: "FEMA's official helpline" },
    { digits: "3054685900", name: "Miami-Dade 311" },
  ];

  // Link shorteners hide where a link really goes
  const SHORTENERS = new Set([
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy", "tiny.cc", "t.ly", "s.id",
  ]);

  // Words scammers put in fake website names to look official
  const BRAND_WORDS = [
    { word: "noaa", name: "NOAA" },
    { word: "nhc", name: "the National Hurricane Center" },
    { word: "fema", name: "FEMA" },
    { word: "nws", name: "the National Weather Service" },
    { word: "miamidade", name: "Miami-Dade County" },
    { word: "miami-dade", name: "Miami-Dade County" },
    { word: "floridadisaster", name: "Florida Emergency Management" },
    { word: "redcross", name: "the Red Cross" },
    { word: "disasterassistance", name: "FEMA's aid website" },
  ];

  // Real agencies people might claim to be
  const AGENCIES = [
    { re: /\b(national hurricane center|nhc)\b/i, name: "the National Hurricane Center", domain: "nhc.noaa.gov" },
    { re: /\b(national weather service|nws)\b/i, name: "the National Weather Service", domain: "weather.gov" },
    { re: /\bfema\b/i, name: "FEMA", domain: "fema.gov" },
    { re: /\bnoaa\b/i, name: "NOAA", domain: "noaa.gov" },
    { re: /\bmiami[-\s]?dade\s+(county\s+)?(emergency|government|office of emergency)/i, name: "Miami-Dade Emergency Management", domain: "miamidade.gov/hurricane" },
    { re: /\bflorida division of emergency management\b/i, name: "Florida Emergency Management", domain: "floridadisaster.org" },
  ];

  // Official alert types the National Weather Service issues
  const EVENT_TYPES = ["hurricane warning", "hurricane watch", "tropical storm warning", "tropical storm watch",
    "storm surge warning", "storm surge watch", "flood warning", "flood watch", "flash flood warning", "tornado warning", "tornado watch"];
  // Words after "Hurricane ..." that are not storm names
  const NOT_NAMES = new Set(["warning", "watch", "season", "center", "advisory", "relief", "damage", "shelter", "shelters",
    "update", "alert", "categoria", "category", "prep", "preparedness", "kit", "supplies", "evacuation", "force", "hunter", "hunters", "local", "statement"]);

  // Endings we accept as website names when there's no "http" or "www"
  const KNOWN_TLDS = new Set(("com net org gov edu mil us io co info biz ly me app xyz site online top " +
    "club live link click ru cn tk ml ga cf gq cc to gl in ca uk de fr es pw ws su icu shop store news " +
    "tv vip win work loan").split(" "));

  // ---------- 2. Red-flag rules ----------
  // severity: high (one is enough to be suspicious), medium, low
  const RULES = [
    {
      id: "personal-info", severity: "high", weight: 50,
      patterns: [/social\s+security(\s+number)?/gi, /\bssn\b/gi, /date\s+of\s+birth/gi,
        /\bbank\s+(account|routing|login)\w*/gi, /\b(password|passcode|pin number)\b/gi,
        /credit\s+card(\s+number)?/gi, /seguro\s+social/gi, /fecha\s+de\s+nacimiento/gi, /cuenta\s+bancaria/gi],
      reason: (m) => `It asks for private information ("${m}"). Real emergency alerts never ask for your Social Security number, bank details, or passwords.`,
    },
    {
      id: "payment", severity: "high", weight: 45,
      patterns: [/gift\s*card/gi, /\b(zelle|venmo|cash\s?app|western union|moneygram|bitcoin|crypto(currency)?)\b/gi,
        /\bwire\s+(money|transfer|funds)/gi, /\b(via|by)\s+wire\b/gi, /\b(pay|send)\s+(a\s+)?\$\s?\d[\d,]*/gi,
        /\bsend\s+(the\s+|us\s+|your\s+)?(funds|money|payment)\b/gi, /\b(application|processing|registration|release)\s+fee\b/gi,
        /tarjeta\s+de\s+regalo/gi, /\benv[ií]e\s+(el\s+)?dinero\b/gi],
      reason: (m) => `It asks you to pay ("${m}"). Government agencies never charge for alerts, shelters, or aid, and never ask for gift cards, Zelle, or crypto.`,
    },
    {
      id: "conspiracy", severity: "high", weight: 40,
      patterns: [/\b(government|they|officials|media)\s+(is|are)\s+hiding\b/gi, /\bhiding\s+it\b/gi,
        /\b(they|media|officials)\s+(won'?t|will not|don'?t want to)\s+tell\s+you\b/gi,
        /\bdon'?t\s+want\s+you\s+to\s+know\b/gi, /\bcover[-\s]?up\b/gi],
      reason: (m) => `It claims officials are hiding the truth ("${m}"). This is a classic fake-news tactic. Real hurricane warnings are made public on purpose.`,
    },
    {
      id: "free-money", severity: "medium", weight: 25,
      patterns: [/\byou\s+(qualify|are eligible|have been selected)\b/gi, /\bclaim\s+(your|it|now|the)\b/gi,
        /\b(relief|free)\s+(money|cash|payment|check)\b/gi, /\b(usted\s+)?califica\s+para\b/gi,
        /\bdinero\s+gratis\b/gi, /\bpriority\s+list\b/gi],
      reason: (m) => `It promises money or special treatment ("${m}"). Real disaster aid is applied for at DisasterAssistance.gov. Nobody "wins" it from a text.`,
    },
    {
      id: "pressure", severity: "medium", weight: 20,
      patterns: [/\b(in|within)\s+(the\s+next\s+)?\d+\s+(minutes?|mins?)\b/gi, /\bor\s+lose\s+(it|your)\b/gi,
        /\blose\s+it\s+forever\b/gi, /\b(offer|deal)\s+ends\b/gi, /\blast\s+chance\b/gi,
        /\bact\s+(now|fast|immediately)\b/gi, /\blimited\s+(time|spots?)\b/gi, /\bspots?\s+are\s+limited\b/gi,
        /\b(haga\s+clic|click)\s+(aquí\s+|here\s+)?(ahora|now)/gi],
      reason: (m) => `It pressures you to act fast ("${m}"). Scammers rush people so they don't stop to check.`,
    },
    {
      id: "share-pressure", severity: "medium", weight: 20,
      patterns: [/\bforward\s+this\b/gi, /\bshare\s+(this\s+)?with\s+everyone\b/gi, /\bshare\s+(this\s+)?now\b/gi,
        /\bcomparte\s+(esto|con\s+todos)\b/gi, /\breenv[ií]a\s+esto\b/gi],
      reason: (m) => `It pushes you to spread it ("${m}"). Fake news depends on people forwarding it before checking.`,
    },
  ];

  // ---------- 3. Small helpers ----------
  function findAll(text, regex) {
    const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
    const out = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
    return out;
  }

  function matchTrusted(host) {
    for (const t of TRUSTED_DOMAINS) {
      if (host === t.domain || host.endsWith("." + t.domain)) return t;
    }
    if (/\.(gov|mil)$/.test(host)) return { domain: host, name: "a U.S. government agency" };
    return null;
  }

  // The part of a web address that actually decides who owns it (last two parts)
  function realSiteName(host) {
    const parts = host.split(".");
    return parts.slice(-2).join(".");
  }

  function brandInHost(host) {
    // Undo common letter tricks: n0aa -> noaa, fema1 -> femal, etc.
    const normal = host.replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/5/g, "s");
    for (const b of BRAND_WORDS) if (normal.includes(b.word)) return b.name;
    // "gov" hidden inside a non-government address, like fema-gov.com or gov.claims.net
    if (/(^|[.-])gov([.-])/.test(host)) return "a government agency";
    return null;
  }

  // ---------- 4. Link X-ray ----------
  function findLinks(text) {
    const re = /(?:https?:\/\/)?(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}|\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?(?:\/[^\s<>"']*)?/gi;
    const links = [];
    for (const m of findAll(text, re)) {
      let raw = m.text.replace(/[.,!?;:)\]]+$/, "");
      const before = text[m.start - 1];
      if (before && /[a-z0-9@]/i.test(before) && before !== "@") continue;
      const hasProtocol = /^https?:\/\//i.test(raw);
      const noProto = raw.replace(/^https?:\/\//i, "");
      const host = noProto.split(/[/:?#]/)[0].toLowerCase().replace(/^www\./, "");
      const path = noProto.slice(noProto.split(/[/?#]/)[0].length);
      const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
      const tld = host.split(".").pop();
      // Skip things like "storm.Stay" (missing space) that aren't really links
      if (!hasProtocol && !/^www\./i.test(noProto) && !isIP && !KNOWN_TLDS.has(tld)) continue;
      links.push({ raw, host, path, isIP, hasProtocol, start: m.start, end: m.start + raw.length });
    }
    return links;
  }

  function xrayLink(link) {
    const { host, path, isIP } = link;
    const dangerousFile = /\.(apk|exe|ipa|dmg|msi|scr|bat|zip)(\?|$)/i.test(path);
    const trusted = matchTrusted(host);

    if (trusted && !dangerousFile) {
      return { ...link, verdict: "official", explanation: `Goes to ${host}, the real website of ${trusted.name}.`, trustedName: trusted.name };
    }
    if (isIP) {
      return { ...link, verdict: "danger", dangerousFile,
        explanation: `Uses a bare number address (${host}) instead of a website name. Real agencies never do this. It hides who runs the site.` };
    }
    if (SHORTENERS.has(host)) {
      return { ...link, verdict: "warning",
        explanation: `${host} is a link shortener. It hides the real website, so you can't see where it takes you. Official alerts link straight to .gov websites.` };
    }
    if (host.startsWith("xn--") || host.includes(".xn--")) {
      return { ...link, verdict: "danger",
        explanation: `This address uses look-alike letters from other alphabets to imitate a real website.` };
    }
    const brand = brandInHost(host);
    if (brand) {
      return { ...link, verdict: "danger",
        explanation: `Looks official but isn't. The real website is "${realSiteName(host)}", which is not owned by the government. Scammers copy names like ${brand} to trick people.` };
    }
    return { ...link, verdict: dangerousFile ? "danger" : "unknown", dangerousFile,
      explanation: `Goes to ${host}, which is not an official emergency website, so it can't confirm this alert.` };
  }

  // ---------- 5. The main check ----------
  function analyze(text, context) {
    context = context || {};
    const flags = [];      // warning signs found
    const highlights = []; // pieces of text to color on screen
    const goodNotes = [];  // reasons to trust it

    // 5a. Text rules
    for (const rule of RULES) {
      const hits = [];
      for (const p of rule.patterns) hits.push(...findAll(text, p));
      if (hits.length) {
        hits.sort((a, b) => a.start - b.start);
        flags.push({ id: rule.id, severity: rule.severity, weight: rule.weight, reason: rule.reason(hits[0].text) });
        hits.forEach((h) => highlights.push({ ...h, severity: rule.severity }));
      }
    }

    // 5b. Impossible storm facts
    const badCat = findAll(text, /\b(?:category|cat\.?|categor[ií]a)\s*(\d{1,2})\b/gi)
      .filter((h) => parseInt(h.text.match(/\d+/)[0], 10) > 5);
    if (badCat.length) {
      flags.push({ id: "impossible-category", severity: "high", weight: 45,
        reason: `It mentions "${badCat[0].text}". There is no such thing: hurricanes only go up to Category 5.` });
      badCat.forEach((h) => highlights.push({ ...h, severity: "high" }));
    }
    const badWind = findAll(text, /\b(\d{2,3})\s*(?:mph|miles per hour)\b/gi)
      .filter((h) => parseInt(h.text, 10) > 215);
    if (badWind.length) {
      flags.push({ id: "impossible-wind", severity: "high", weight: 40,
        reason: `It claims "${badWind[0].text}" winds. That's faster than any hurricane ever recorded, so it's almost certainly made up.` });
      badWind.forEach((h) => highlights.push({ ...h, severity: "high" }));
    }

    // 5c. Shouting (ALL CAPS / !!!)
    const letters = text.match(/[a-z]/gi) || [];
    const upper = text.match(/[A-Z]/g) || [];
    const bangs = findAll(text, /!{2,}/g);
    if ((letters.length >= 25 && upper.length / letters.length > 0.6) || bangs.length) {
      flags.push({ id: "shouting", severity: "low", weight: 10,
        reason: "It's written in panic style (ALL CAPS or lots of !!!). Official alerts are calm and factual." });
      bangs.forEach((h) => highlights.push({ ...h, severity: "low" }));
    }

    // 5d. Links
    const links = findLinks(text).map(xrayLink);
    links.forEach((l) => {
      highlights.push({ start: l.start, end: l.end, text: l.raw, severity: l.verdict === "official" ? "good" : l.verdict === "unknown" ? "low" : l.verdict === "warning" ? "medium" : "high" });
    });
    const officialLinks = links.filter((l) => l.verdict === "official");
    if (links.some((l) => l.isIP)) flags.push({ id: "ip-link", severity: "high", weight: 45, reason: links.find((l) => l.isIP).explanation });
    if (links.some((l) => l.dangerousFile)) flags.push({ id: "download", severity: "high", weight: 45,
      reason: "It asks you to download an app file from a link. Official alert apps only come from the App Store or Google Play." });
    const fake = links.find((l) => l.verdict === "danger" && !l.isIP && !l.dangerousFile);
    if (fake) flags.push({ id: "lookalike-link", severity: "high", weight: 50, reason: fake.explanation });
    const short = links.find((l) => l.verdict === "warning");
    if (short) flags.push({ id: "shortener", severity: "medium", weight: 30, reason: short.explanation });

    // 5e. Phone numbers: official or unknown?
    const phones = findAll(text, /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g)
      .map((p) => ({ ...p, digits: p.text.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "") }))
      .map((p) => ({ ...p, match: OFFICIAL_PHONES.find((o) => o.digits === p.digits) }));
    const officialPhone = phones.find((p) => p.match);
    if (officialPhone) highlights.push({ ...officialPhone, severity: "good" });
    const unknownPhone = phones.find((p) => !p.match);
    const aidWords = /\b(aid|relief|money|funds|fee|shelter|claim|assistance|grant|payment|refund|ayuda|dinero|reserve)\b/i;
    if (unknownPhone && aidWords.test(text)) {
      flags.push({ id: "unknown-phone", severity: "medium", weight: 20,
        reason: `It asks you to contact an unknown number (${unknownPhone.text}) about aid or money. Look up the number on an official website first. FEMA's real helpline is 1-800-621-3362.` });
      highlights.push({ ...unknownPhone, severity: "medium" });
    }

    // 5f. Does it claim to be from a real agency, but point you somewhere else?
    const claimed = AGENCIES.filter((a) => a.re.test(text));
    const pointsElsewhere = (links.length && !officialLinks.length) || (unknownPhone && !officialPhone && !officialLinks.length);
    if (claimed.length && pointsElsewhere) {
      const a = claimed[0];
      flags.push({ id: "authority-mismatch", severity: "medium", weight: 20,
        reason: `It uses the name of ${a.name}, but doesn't send you to their real website (${a.domain}) or official phone line. Scammers often borrow real agency names.` });
    }

    // 5g. Rumor wording (not dangerous, but not a source either)
    const hearsay = findAll(text, /\b(my\s+(cousin|friend|neighbou?r|aunt|uncle|mom|dad|brother|sister|coworker)\s+(said|says|told)|someone\s+(posted|said)|i\s+heard|heard\s+(that|the)|people\s+are\s+saying|rumou?r|dicen\s+que|me\s+dijeron)\b/gi)[0];

    // 5h. Compare with official NWS alerts saved on the phone (live or offline copy)
    let officialMatch = null;
    if (Array.isArray(context.officialAlerts)) {
      const official = context.officialAlerts;
      const when = context.updatedText ? ` (updated ${context.updatedText})` : "";
      const officialEvents = official.map((a) => (a.event || "").toLowerCase());
      const officialText = official.map((a) => [a.event, a.headline, a.description, a.storm].join(" ")).join(" ").toLowerCase();

      // Which official alert types does the message talk about?
      const claimedEvents = EVENT_TYPES.filter((ev) => new RegExp("\\b" + ev.replace(/ /g, "\\s+") + "\\b", "i").test(text));
      const matched = claimedEvents.find((ev) => officialEvents.includes(ev));
      const missing = claimedEvents.filter((ev) => !officialEvents.includes(ev));

      // Does it name a storm that isn't in the official data?
      const named = findAll(text, /\b(?:[Hh]urricane|[Tt]ropical [Ss]torm|[Hh]urac[aá]n|[Tt]ormenta [Tt]ropical)\s+([A-Z][a-z]{2,})\b/g)
        .map((h) => ({ ...h, name: h.text.split(/\s+/).pop() }))
        .filter((h) => !NOT_NAMES.has(h.name.toLowerCase()));
      const unknownStorm = named.find((h) => !officialText.includes(h.name.toLowerCase()));

      if (unknownStorm) {
        flags.push({ id: "official-mismatch", severity: "medium", weight: 20,
          reason: `It talks about "${unknownStorm.text}", but official National Weather Service data${when} has no storm by that name affecting Miami-Dade. It may be fake or old.` });
        highlights.push({ ...unknownStorm, severity: "medium" });
      } else if (matched) {
        officialMatch = official.find((a) => (a.event || "").toLowerCase() === matched);
      } else if (missing.length) {
        const ev = missing[0].replace(/\b\w/g, (c) => c.toUpperCase());
        flags.push({ id: "official-mismatch", severity: "medium", weight: 20,
          reason: `It mentions a ${ev}, but official National Weather Service data${when} shows no active ${ev} for Miami-Dade. It may be fake, old, or brand new. Check weather.gov/mfl.` });
      }
    }

    // ---------- 6. Decide the label ----------
    const risk = flags.reduce((sum, f) => sum + f.weight, 0);
    const hasOfficialSource = officialLinks.length > 0 || !!officialPhone || !!officialMatch;
    let label;
    if (risk >= 40) label = "suspicious";
    else if (hasOfficialSource && risk < 20) label = "verified";
    else label = "unverified";

    // ---------- 7. Plain-language reasons ----------
    const order = { high: 0, medium: 1, low: 2 };
    flags.sort((a, b) => order[a.severity] - order[b.severity]);
    let reasons = [];

    if (label === "verified") {
      if (officialLinks.length) goodNotes.push(`It links to ${officialLinks[0].host}, the official website of ${officialLinks[0].trustedName}.`);
      if (officialPhone) goodNotes.push(`The phone number ${officialPhone.text} is ${officialPhone.match.name}.`);
      if (officialMatch) goodNotes.push(`It matches an official alert active right now: "${officialMatch.event}" from ${officialMatch.senderName || "the National Weather Service"}${context.updatedText ? " (updated " + context.updatedText + ")" : ""}.`);
      goodNotes.push("No scam or fake-news warning signs were found.");
      reasons = goodNotes.concat(flags.map((f) => f.reason));
    } else if (label === "suspicious") {
      reasons = flags.map((f) => f.reason);
    } else {
      reasons = flags.map((f) => f.reason);
      if (hearsay) reasons.push(`It's based on someone's word ("${hearsay.text}"), not an official source.`);
      if (claimed.length && !links.length) {
        reasons.push(`It says it's from ${claimed[0].name}, but gives no official link to prove it. Check ${claimed[0].domain} directly.`);
      } else if (!hasOfficialSource) {
        reasons.push("There's no official source or link in this message, so it can't be confirmed.");
      } else {
        reasons.push("It has an official link, but also some warning signs, so double-check it on the official website.");
      }
      if (!flags.length) reasons.push("No scam warning signs were found. Treat it as a rumor until an official source confirms it.");
    }

    // ---------- 8. Trust score (0–100) ----------
    let score;
    if (label === "suspicious") score = 34 - Math.round((risk - 40) / 3); // more red flags = lower score
    else score = (hasOfficialSource ? 92 : 55) - risk;
    const bands = { verified: [75, 100], unverified: [35, 74], suspicious: [0, 34] };
    score = Math.max(Math.max(bands[label][0], 2), Math.min(bands[label][1], score));

    const summaries = {
      verified: "This matches an official source.",
      suspicious: "This has signs of a scam or fake news. Don't click links, pay, or share personal info.",
      unverified: "We can't confirm this. Treat it as a rumor until an official source says so.",
    };
    const titles = { verified: "✅ Verified", suspicious: "⚠️ Suspicious", unverified: "❔ Unverified" };

    return {
      label,
      title: titles[label],
      summary: summaries[label],
      score,
      reasons,
      flags,
      links,
      highlights: mergeHighlights(highlights),
    };
  }

  // Combine overlapping highlights, keeping the most serious color
  function mergeHighlights(list) {
    const rank = { high: 4, medium: 3, low: 2, good: 1 };
    const sorted = list.slice().sort((a, b) => a.start - b.start || b.end - a.end);
    const out = [];
    for (const h of sorted) {
      const last = out[out.length - 1];
      if (last && h.start < last.end) {
        last.end = Math.max(last.end, h.end);
        if (rank[h.severity] > rank[last.severity]) last.severity = h.severity;
      } else {
        out.push({ start: h.start, end: h.end, severity: h.severity });
      }
    }
    return out;
  }

  const api = { analyze, TRUSTED_DOMAINS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StormCheckEngine = api;
})(typeof self !== "undefined" ? self : this);
