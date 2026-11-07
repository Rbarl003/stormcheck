// ============================================================
// StormCheck — app.js
// Connects the screen to the engine (engine.js), the official alerts
// (official.js), and the languages (i18n.js).
// ============================================================

const input = document.getElementById("alert-input");
const checkBtn = document.getElementById("check-btn");
const sampleBtn = document.getElementById("sample-btn");
const resultBox = document.getElementById("result");
const offlineBanner = document.getElementById("offline-banner");
const officialStatus = document.getElementById("official-status");
const officialList = document.getElementById("official-list");
const refreshBtn = document.getElementById("refresh-btn");
const demoToggle = document.getElementById("demo-toggle");
const demoBadge = document.getElementById("demo-badge");

let lang = I18N.getLang();        // "en", "es" or "ht"
let sampleAlerts = [];
let officialState = { alerts: null, fetchedAt: null, source: "none" };
let last = null;                  // last checked { text, result }, so we can re-show it in another language

const t = (key) => I18N.ui(lang, key);

// Small helper to build an element safely (textContent = no code injection)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------- 1. Language ----------
function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  input.placeholder = t("placeholder");
  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
    b.setAttribute("aria-pressed", b.dataset.lang === lang);
  });
  renderOfficial();
  if (last && !resultBox.hidden) showResult(last.text, last.result, false);
}

document.querySelectorAll(".lang-switch button").forEach((b) => {
  b.addEventListener("click", () => {
    stopReading();
    lang = b.dataset.lang;
    I18N.setLang(lang);
    applyLanguage();
  });
});

// ---------- 2. Sample alerts (for testing + demo) ----------
fetch("data/sample-alerts.json")
  .then((res) => res.json())
  .then((data) => { sampleAlerts = data; })
  .catch(() => console.warn("Could not load sample alerts"));

sampleBtn.addEventListener("click", () => {
  if (sampleAlerts.length === 0) return;
  const pick = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];
  input.value = pick.text;
});

// ---------- 3. Check button ----------
checkBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.placeholder = t("placeholderEmpty");
    return;
  }
  stopReading();
  // Give the engine the official alerts (live or saved) so it can compare
  const context = officialState.alerts
    ? { officialAlerts: officialState.alerts, updatedText: formatTime(officialState.fetchedAt) }
    : {};
  const result = StormCheckEngine.analyze(text, context); // the real engine (engine.js)
  last = { text, result };
  showResult(text, result, true);
});

// ---------- 4. Show a result on screen ----------
function showResult(text, r, scroll) {
  resultBox.className = "card result " + r.label;
  resultBox.innerHTML = "";

  // Label + summary + read aloud
  const top = el("div", "result-top");
  top.append(el("p", "result-label", t("titles")[r.label]));
  if ("speechSynthesis" in window) {
    const speakBtn = el("button", "btn-speak", t("readAloud"));
    speakBtn.id = "speak-btn";
    speakBtn.addEventListener("click", () => toggleReading(r));
    top.append(speakBtn);
  }
  resultBox.append(top, el("p", "result-summary", t("summaries")[r.label]));

  // Trust score meter
  const meter = el("div", "meter");
  const meterTop = el("div", "meter-top");
  meterTop.append(el("span", "", t("trust")), el("strong", "", r.score + " / 100"));
  const track = el("div", "meter-track");
  const fill = el("div", "meter-fill");
  fill.style.width = r.score + "%";
  track.append(fill);
  meter.append(meterTop, track);
  resultBox.append(meter);

  // Reasons (translated)
  resultBox.append(el("h3", "section-title", t("why")));
  const list = el("ul", "reasons");
  r.items.forEach((it) => list.append(el("li", "", I18N.reason(lang, it))));
  resultBox.append(list);

  // The message with warning signs highlighted
  if (r.highlights.length) {
    resultBox.append(el("h3", "section-title", t("spotted")));
    resultBox.append(buildHighlightedText(text, r.highlights));
    const [danger, warning, official] = t("legend");
    const legend = el("div", "legend");
    legend.append(el("span", "mark-high", danger), el("span", "mark-medium", warning), el("span", "mark-good", official));
    resultBox.append(legend);
  }

  // Link X-ray
  if (r.links.length) {
    resultBox.append(el("h3", "section-title", t("xray")));
    r.links.forEach((link) => {
      const row = el("div", "xray xray-" + link.verdict);
      const icon = { official: "✅", warning: "⚠️", danger: "🚫", unknown: "❔" }[link.verdict];
      row.append(el("div", "xray-host", icon + " " + link.raw), el("div", "xray-why", I18N.reason(lang, link.explain)));
      resultBox.append(row);
    });
  }

  resultBox.hidden = false;
  if (scroll) resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Rebuilds the pasted message with colored highlights around the flagged parts
function buildHighlightedText(text, highlights) {
  const box = el("div", "highlighted");
  let pos = 0;
  highlights.forEach((h) => {
    if (h.start > pos) box.append(document.createTextNode(text.slice(pos, h.start)));
    box.append(el("mark", "mark-" + h.severity, text.slice(h.start, h.end)));
    pos = h.end;
  });
  if (pos < text.length) box.append(document.createTextNode(text.slice(pos)));
  return box;
}

// ---------- 5. Read aloud (built into the browser, works offline) ----------
let reading = false;

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  for (const code of I18N.SPEECH[lang]) {
    const v = voices.find((x) => x.lang.toLowerCase().replace("_", "-").startsWith(code.toLowerCase()));
    if (v) return v;
  }
  return null;
}

function toggleReading(r) {
  if (reading) { stopReading(); return; }
  const parts = [t("titles")[r.label].replace(/^\S+\s/, ""), t("summaries")[r.label]]
    .concat(r.items.map((it) => I18N.reason(lang, it)));
  // Read links and quotes more naturally
  const words = parts.join(". ").replace(/https?:\/\//g, "").replace(/["“”]/g, "");
  const speech = new SpeechSynthesisUtterance(words);
  const voice = pickVoice();
  if (voice) { speech.voice = voice; speech.lang = voice.lang; } else { speech.lang = I18N.SPEECH[lang][0]; }
  speech.rate = 0.95;
  speech.onend = speech.onerror = () => setReading(false);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
  setReading(true);
}

function stopReading() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  setReading(false);
}

function setReading(on) {
  reading = on;
  const btn = document.getElementById("speak-btn");
  if (btn) btn.textContent = on ? t("stopReading") : t("readAloud");
}

// Some browsers load voices late
if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = () => {};

// ---------- 6. Official alerts card ----------
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const time = d.toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString() ? time : d.toLocaleDateString(lang, { month: "short", day: "numeric" }) + ", " + time;
}

async function refreshOfficial() {
  officialStatus.textContent = t("checking");
  refreshBtn.disabled = true;
  officialState = await Official.load();
  refreshBtn.disabled = false;
  renderOfficial();
}

function renderOfficial() {
  const { alerts, fetchedAt, source } = officialState;
  const when = formatTime(fetchedAt);
  const statusText = {
    live: t("statusLive")(when),
    saved: t("statusSaved")(when),
    demo: t("statusDemo"),
    none: t("statusNone"),
  }[source];
  officialStatus.textContent = statusText;
  officialStatus.className = "official-status status-" + source;
  demoBadge.hidden = source !== "demo";
  demoToggle.checked = Official.isDemo();

  officialList.innerHTML = "";
  if (!alerts) return;
  if (alerts.length === 0) {
    officialList.append(el("li", "official-none", t("noAlerts")));
    return;
  }
  alerts.forEach((a) => {
    const li = el("li", "official-item");
    li.append(el("strong", "", I18N.event(lang, a.event)), el("span", "", a.headline));
    officialList.append(li);
  });
}

refreshBtn.addEventListener("click", refreshOfficial);
demoToggle.addEventListener("change", () => {
  Official.setDemo(demoToggle.checked);
  resultBox.hidden = true; // old result was based on other data
  stopReading();
  refreshOfficial();
});
window.addEventListener("online", refreshOfficial);

// ---------- 7. Offline banner ----------
function updateOnlineStatus() {
  offlineBanner.hidden = navigator.onLine;
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// ---------- 8. Start ----------
applyLanguage();
updateOnlineStatus();
refreshOfficial();

// ---------- 9. Service worker (makes the app work offline) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .catch((err) => console.warn("Service worker failed:", err));
  });
}
