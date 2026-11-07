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
    { digits: "8006213362", key: "fema-phone", name: "FEMA's official helpline" },
    { digits: "3054685900", key: "md311", name: "Miami-Dade 311" },
  ];

  // Link shorteners hide where a link really goes
  const SHORTENERS = new Set([
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy", "tiny.cc", "t.ly", "s.id",
  ]);

  // Words scammers put in fake website names to look official
  const BRAND_WORDS = [
    { word: "noaa", name: "NOAA" },
    { word: "nhc", name: "NHC" },
    { word: "fema", name: "FEMA" },
    { word: "nws", name: "NWS" },
    { word: "miamidade", name: "Miami-Dade" },
    { word: "miami-dade", name: "Miami-Dade" },
    { word: "floridadisaster", name: "FloridaDisaster" },
    { word: "redcross", name: "Red Cross" },
    { word: "disasterassistance", name: "DisasterAssistance" },
  ];

  // Real agencies people might claim to be
  const AGENCIES = [
    { re: /\b(national hurricane center|nhc)\b/i, name: "the National Hurricane Center", domain: "nhc.noaa.gov" },
    { re: /\b(national weather service|nws)\b/i, name: "the National Weather Service", domain: "weather.gov" },
    { re: /\bfema\b/i, name: "FEMA", domain: "fema.gov" },
    { re: /\bnoaa\b/i, name: "NOAA", domain: "noaa.gov" },
    { re: /\bmiami[-\s]?dade\s+(county\s+)?(emergency|government|office of emergency)/i, name: "Miami-Dade Emergency Management", domain: "miamidade.gov/hurricane", key: "miamidade-em" },
    { re: /\bflorida division of emergency management\b/i, name: "the Florida Division of Emergency Management", domain: "floridadisaster.org" },
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

  // ---------- English text for every reason ----------
  // Each reason has a key (like "payment") + details. The app can show it in
  // Spanish or Haitian Creole using the same key (see i18n.js).
  const upd = (p) => (p.time ? ` (updated ${p.time})` : "");
  const EN = {
    "personal-info": (p) => `It asks for private information ("${p.m}"). Real emergency alerts never ask for your Social Security number, bank details, or passwords.`,
    "payment": (p) => `It asks you to pay ("${p.m}"). Government agencies never charge for alerts, shelters, or aid, and never ask for gift cards, Zelle, or crypto.`,
    "conspiracy": (p) => `It claims officials are hiding the truth ("${p.m}"). This is a classic fake-news tactic. Real hurricane warnings are made public on purpose.`,
    "free-money": (p) => `It promises money or special treatment ("${p.m}"). Real disaster aid is applied for at DisasterAssistance.gov. Nobody "wins" it from a text.`,
    "pressure": (p) => `It pressures you to act fast ("${p.m}"). Scammers rush people so they don't stop to check.`,
    "share-pressure": (p) => `It pushes you to spread it ("${p.m}"). Fake news depends on people forwarding it before checking.`,
    "impossible-category": (p) => `It mentions "${p.m}". There is no such thing: hurricanes only go up to Category 5.`,
    "impossible-wind": (p) => `It claims "${p.m}" winds. That's faster than any hurricane ever recorded, so it's almost certainly made up.`,
    "shouting": () => "It's written in panic style (ALL CAPS or lots of !!!). Official alerts are calm and factual.",
    "link-official": (p) => `Goes to ${p.host}, the real website of ${p.orgName}.`,
    "link-ip": (p) => `Uses a bare number address (${p.host}) instead of a website name. Real agencies never do this. It hides who runs the site.`,
    "link-shortener": (p) => `${p.host} is a link shortener. It hides the real website, so you can't see where it takes you. Official alerts link straight to .gov websites.`,
    "link-punycode": () => "This address uses look-alike letters from other alphabets to imitate a real website.",
    "link-lookalike": (p) => `Looks official but isn't. The real website is "${p.site}", which is not owned by the government. Scammers copy names like ${p.brand} to trick people.`,
    "link-unknown": (p) => `Goes to ${p.host}, which is not an official emergency website, so it can't confirm this alert.`,
    "download": () => "It asks you to download an app file from a link. Official alert apps only come from the App Store or Google Play.",
    "unknown-phone": (p) => `It asks you to contact an unknown number (${p.phone}) about aid or money. Look up the number on an official website first. FEMA's real helpline is 1-800-621-3362.`,
    "authority-mismatch": (p) => `It uses the name of ${p.orgName}, but doesn't send you to their real website (${p.domain}) or official phone line. Scammers often borrow real agency names.`,
    "official-unknown-storm": (p) => `It talks about "${p.storm}", but official National Weather Service data${upd(p)} has no storm by that name affecting Miami-Dade. It may be fake or old.`,
    "official-missing-event": (p) => `It mentions a ${p.event}, but official National Weather Service data${upd(p)} shows no active ${p.event} for Miami-Dade. It may be fake, old, or brand new. Check weather.gov/mfl.`,
    "good-link": (p) => `It links to ${p.host}, the official website of ${p.orgName}.`,
    "good-phone": (p) => `The phone number ${p.phone} is ${p.orgName}.`,
    "good-match": (p) => `It matches an official alert active right now: "${p.event}" from ${p.sender}${upd(p)}.`,
    "good-none": () => "No scam or fake-news warning signs were found.",
    "hearsay": (p) => `It's based on someone's word ("${p.m}"), not an official source.`,
    "claim-no-link": (p) => `It says it's from ${p.orgName}, but gives no official link to prove it. Check ${p.domain} directly.`,
    "no-source": () => "There's no official source or link in this message, so it can't be confirmed.",
    "official-but-flags": () => "It has an official link, but also some warning signs, so double-check it on the official website.",
    "no-flags-rumor": () => "No scam warning signs were found. Treat it as a rumor until an official source confirms it.",
  };
  // Builds one reason: { key, p (details), text (English) }
  function item(key, p) { p = p || {}; return { key, p, text: EN[key](p) }; }

  // ---------- 2. Red-flag rules ----------
  // severity: high (one is enough to be suspicious), medium, low
  const RULES = [
    {
      id: "personal-info", severity: "high", weight: 50,
      patterns: [/social\s+security(\s+number)?/gi, /\bssn\b/gi, /date\s+of\s+birth/gi,
        /\bbank\s+(account|routing|login)\w*/gi, /\b(password|passcode|pin number)\b/gi,
        /credit\s+card(\s+number)?/gi, /seguro\s+social/gi, /fecha\s+de\s+nacimiento/gi, /cuenta\s+bancaria/gi],
    },
    {
      id: "payment", severity: "high", weight: 45,
      patterns: [/gift\s*card/gi, /\b(zelle|venmo|cash\s?app|western union|moneygram|bitcoin|crypto(currency)?)\b/gi,
        /\bwire\s+(money|transfer|funds)/gi, /\b(via|by)\s+wire\b/gi, /\b(pay|send)\s+(a\s+)?\$\s?\d[\d,]*/gi,
        /\bsend\s+(the\s+|us\s+|your\s+)?(funds|money|payment)\b/gi, /\b(application|processing|registration|release)\s+fee\b/gi,
        /tarjeta\s+de\s+regalo/gi, /\benv[ií]e\s+(el\s+)?dinero\b/gi],
    },
    {
      id: "conspiracy", severity: "high", weight: 40,
      patterns: [/\b(government|they|officials|media)\s+(is|are)\s+hiding\b/gi, /\bhiding\s+it\b/gi,
        /\b(they|media|officials)\s+(won'?t|will not|don'?t want to)\s+tell\s+you\b/gi,
        /\bdon'?t\s+want\s+you\s+to\s+know\b/gi, /\bcover[-\s]?up\b/gi],
    },
    {
      id: "free-money", severity: "medium", weight: 25,
      patterns: [/\byou\s+(qualify|are eligible|have been selected)\b/gi, /\bclaim\s+(your|it|now|the)\b/gi,
        /\b(relief|free)\s+(money|cash|payment|check)\b/gi, /\b(usted\s+)?califica\s+para\b/gi,
        /\bdinero\s+gratis\b/gi, /\bpriority\s+list\b/gi],
    },
    {
      id: "pressure", severity: "medium", weight: 20,
      patterns: [/\b(in|within)\s+(the\s+next\s+)?\d+\s+(minutes?|mins?)\b/gi, /\bor\s+lose\s+(it|your)\b/gi,
        /\blose\s+it\s+forever\b/gi, /\b(offer|deal)\s+ends\b/gi, /\blast\s+chance\b/gi,
        /\bact\s+(now|fast|immediately)\b/gi, /\blimited\s+(time|spots?)\b/gi, /\bspots?\s+are\s+limited\b/gi,
        /\b(haga\s+clic|click)\s+(aquí\s+|here\s+)?(ahora|now)/gi],
    },
    {
      id: "share-pressure", severity: "medium", weight: 20,
      patterns: [/\bforward\s+this\b/gi, /\bshare\s+(this\s+)?with\s+everyone\b/gi, /\bshare\s+(this\s+)?now\b/gi,
        /\bcomparte\s+(esto|con\s+todos)\b/gi, /\breenv[ií]a\s+esto\b/gi],
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
    if (/\.(gov|mil)$/.test(host)) return { domain: "gov", name: "a U.S. government agency" };
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
    if (/(^|[.-])gov([.-])/.test(host)) return '"gov"';
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
      return { ...link, verdict: "official", org: trusted.domain, trustedName: trusted.name,
        explain: item("link-official", { host, org: trusted.domain, orgName: trusted.name }) };
    }
    if (isIP) {
      return { ...link, verdict: "danger", dangerousFile, explain: item("link-ip", { host }) };
    }
    if (SHORTENERS.has(host)) {
      return { ...link, verdict: "warning", explain: item("link-shortener", { host }) };
    }
    if (host.startsWith("xn--") || host.includes(".xn--")) {
      return { ...link, verdict: "danger", explain: item("link-punycode") };
    }
    const brand = brandInHost(host);
    if (brand) {
      return { ...link, verdict: "danger", explain: item("link-lookalike", { site: realSiteName(host), brand }) };
    }
    return { ...link, verdict: dangerousFile ? "danger" : "unknown", dangerousFile, explain: item("link-unknown", { host }) };
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
        flags.push({ id: rule.id, severity: rule.severity, weight: rule.weight, reason: item(rule.id, { m: hits[0].text }) });
        hits.forEach((h) => highlights.push({ ...h, severity: rule.severity }));
      }
    }

    // 5b. Impossible storm facts
    const badCat = findAll(text, /\b(?:category|cat\.?|categor[ií]a)\s*(\d{1,2})\b/gi)
      .filter((h) => parseInt(h.text.match(/\d+/)[0], 10) > 5);
    if (badCat.length) {
      flags.push({ id: "impossible-category", severity: "high", weight: 45,
        reason: item("impossible-category", { m: badCat[0].text }) });
      badCat.forEach((h) => highlights.push({ ...h, severity: "high" }));
    }
    const badWind = findAll(text, /\b(\d{2,3})\s*(?:mph|miles per hour)\b/gi)
      .filter((h) => parseInt(h.text, 10) > 215);
    if (badWind.length) {
      flags.push({ id: "impossible-wind", severity: "high", weight: 40,
        reason: item("impossible-wind", { m: badWind[0].text }) });
      badWind.forEach((h) => highlights.push({ ...h, severity: "high" }));
    }

    // 5c. Shouting (ALL CAPS / !!!)
    const letters = text.match(/[a-z]/gi) || [];
    const upper = text.match(/[A-Z]/g) || [];
    const bangs = findAll(text, /!{2,}/g);
    if ((letters.length >= 25 && upper.length / letters.length > 0.6) || bangs.length) {
      flags.push({ id: "shouting", severity: "low", weight: 10,
        reason: item("shouting") });
      bangs.forEach((h) => highlights.push({ ...h, severity: "low" }));
    }

    // 5d. Links
    const links = findLinks(text).map(xrayLink).map((l) => ({ ...l, explanation: l.explain.text }));
    links.forEach((l) => {
      highlights.push({ start: l.start, end: l.end, text: l.raw, severity: l.verdict === "official" ? "good" : l.verdict === "unknown" ? "low" : l.verdict === "warning" ? "medium" : "high" });
    });
    const officialLinks = links.filter((l) => l.verdict === "official");
    if (links.some((l) => l.isIP)) flags.push({ id: "ip-link", severity: "high", weight: 45, reason: links.find((l) => l.isIP).explain });
    if (links.some((l) => l.dangerousFile)) flags.push({ id: "download", severity: "high", weight: 45,
      reason: item("download") });
    const fake = links.find((l) => l.verdict === "danger" && !l.isIP && !l.dangerousFile);
    if (fake) flags.push({ id: "lookalike-link", severity: "high", weight: 50, reason: fake.explain });
    const short = links.find((l) => l.verdict === "warning");
    if (short) flags.push({ id: "shortener", severity: "medium", weight: 30, reason: short.explain });

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
        reason: item("unknown-phone", { phone: unknownPhone.text }) });
      highlights.push({ ...unknownPhone, severity: "medium" });
    }

    // 5f. Does it claim to be from a real agency, but point you somewhere else?
    const claimed = AGENCIES.filter((a) => a.re.test(text));
    const pointsElsewhere = (links.length && !officialLinks.length) || (unknownPhone && !officialPhone && !officialLinks.length);
    if (claimed.length && pointsElsewhere) {
      const a = claimed[0];
      flags.push({ id: "authority-mismatch", severity: "medium", weight: 20,
        reason: item("authority-mismatch", { org: a.key || a.domain, orgName: a.name, domain: a.domain }) });
    }

    // 5g. Rumor wording (not dangerous, but not a source either)
    const hearsay = findAll(text, /\b(my\s+(cousin|friend|neighbou?r|aunt|uncle|mom|dad|brother|sister|coworker)\s+(said|says|told)|someone\s+(posted|said)|i\s+heard|heard\s+(that|the)|people\s+are\s+saying|rumou?r|dicen\s+que|me\s+dijeron)\b/gi)[0];

    // 5h. Compare with official NWS alerts saved on the phone (live or offline copy)
    let officialMatch = null;
    if (Array.isArray(context.officialAlerts)) {
      const official = context.officialAlerts;
      const time = context.updatedText || "";
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
          reason: item("official-unknown-storm", { storm: unknownStorm.text, time }) });
        highlights.push({ ...unknownStorm, severity: "medium" });
      } else if (matched) {
        officialMatch = official.find((a) => (a.event || "").toLowerCase() === matched);
      } else if (missing.length) {
        const ev = missing[0].replace(/\b\w/g, (c) => c.toUpperCase());
        flags.push({ id: "official-mismatch", severity: "medium", weight: 20,
          reason: item("official-missing-event", { event: ev, time }) });
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
    let items = [];

    if (label === "verified") {
      const l = officialLinks[0];
      if (l) goodNotes.push(item("good-link", { host: l.host, org: l.org, orgName: l.trustedName }));
      if (officialPhone) goodNotes.push(item("good-phone", { phone: officialPhone.text, org: officialPhone.match.key, orgName: officialPhone.match.name }));
      if (officialMatch) goodNotes.push(item("good-match", { event: officialMatch.event, sender: officialMatch.senderName || "the National Weather Service", time: context.updatedText || "" }));
      goodNotes.push(item("good-none"));
      items = goodNotes.concat(flags.map((f) => f.reason));
    } else if (label === "suspicious") {
      items = flags.map((f) => f.reason);
    } else {
      items = flags.map((f) => f.reason);
      if (hearsay) items.push(item("hearsay", { m: hearsay.text }));
      if (claimed.length && !links.length) {
        const a = claimed[0];
        items.push(item("claim-no-link", { org: a.key || a.domain, orgName: a.name, domain: a.domain }));
      } else if (!hasOfficialSource) {
        items.push(item("no-source"));
      } else {
        items.push(item("official-but-flags"));
      }
      if (!flags.length) items.push(item("no-flags-rumor"));
    }
    const reasons = items.map((i) => i.text);

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
      reasons,   // English text
      items,     // same reasons as { key, p } so the app can translate them
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

  const api = { analyze, TRUSTED_DOMAINS, REASON_KEYS: Object.keys(EN) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StormCheckEngine = api;
})(typeof self !== "undefined" ? self : this);
