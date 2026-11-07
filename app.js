// ============================================================
// StormCheck — app.js
// Sprint 0: page wiring + offline support.
// The real checking rules get built in Sprint 1 (Saturday morning).
// ============================================================

const input = document.getElementById("alert-input");
const checkBtn = document.getElementById("check-btn");
const sampleBtn = document.getElementById("sample-btn");
const resultBox = document.getElementById("result");
const offlineBanner = document.getElementById("offline-banner");

let sampleAlerts = [];

// ---------- 1. Load sample alerts (used for testing + demo) ----------
fetch("data/sample-alerts.json")
  .then((res) => res.json())
  .then((data) => { sampleAlerts = data; })
  .catch(() => console.warn("Could not load sample alerts"));

sampleBtn.addEventListener("click", () => {
  if (sampleAlerts.length === 0) return;
  const pick = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];
  input.value = pick.text;
});

// ---------- 2. Check button ----------
checkBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    input.placeholder = "Paste an alert or message here first.";
    return;
  }
  // Give the engine the official alerts (live or saved) so it can compare
  const context = officialState.alerts
    ? { officialAlerts: officialState.alerts, updatedText: formatTime(officialState.fetchedAt) }
    : {};
  const result = StormCheckEngine.analyze(text, context); // the real engine (engine.js)
  showResult(text, result);
});

// ---------- 2b. Official alerts card ----------
const officialStatus = document.getElementById("official-status");
const officialList = document.getElementById("official-list");
const refreshBtn = document.getElementById("refresh-btn");
const demoToggle = document.getElementById("demo-toggle");
const demoBadge = document.getElementById("demo-badge");
let officialState = { alerts: null, fetchedAt: null, source: "none" };

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString() ? time : d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + time;
}

async function refreshOfficial() {
  officialStatus.textContent = "Checking official alerts…";
  refreshBtn.disabled = true;
  officialState = await Official.load();
  refreshBtn.disabled = false;
  renderOfficial();
}

function renderOfficial() {
  const { alerts, fetchedAt, source } = officialState;
  const when = formatTime(fetchedAt);
  const statusText = {
    live: `Live from the National Weather Service · updated ${when}`,
    saved: `Offline: using saved official data from ${when}`,
    demo: "Demo storm: fictional Hurricane Kendra (practice data, not real)",
    none: "Not downloaded yet. Connect to the internet once to save official alerts on this phone.",
  }[source];
  officialStatus.textContent = statusText;
  officialStatus.className = "official-status status-" + source;
  demoBadge.hidden = source !== "demo";
  demoToggle.checked = Official.isDemo();

  officialList.innerHTML = "";
  if (!alerts) return;
  if (alerts.length === 0) {
    officialList.append(el("li", "official-none", "✓ No active weather alerts for Miami-Dade right now."));
    return;
  }
  alerts.forEach((a) => {
    const li = el("li", "official-item");
    li.append(el("strong", "", a.event), el("span", "", a.headline));
    officialList.append(li);
  });
}

refreshBtn.addEventListener("click", refreshOfficial);
demoToggle.addEventListener("change", () => {
  Official.setDemo(demoToggle.checked);
  resultBox.hidden = true; // old result was based on other data
  refreshOfficial();
});
window.addEventListener("online", refreshOfficial);
refreshOfficial();

// ---------- 3. Show a result on screen ----------
// Small helper to build an element safely (textContent = no code injection)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showResult(text, r) {
  resultBox.className = "card result " + r.label;
  resultBox.innerHTML = "";

  // Label + summary
  resultBox.append(el("p", "result-label", r.title), el("p", "result-summary", r.summary));

  // Trust score meter
  const meter = el("div", "meter");
  const meterTop = el("div", "meter-top");
  meterTop.append(el("span", "", "Trust score"), el("strong", "", r.score + " / 100"));
  const track = el("div", "meter-track");
  const fill = el("div", "meter-fill");
  fill.style.width = r.score + "%";
  track.append(fill);
  meter.append(meterTop, track);
  resultBox.append(meter);

  // Reasons
  resultBox.append(el("h3", "section-title", "Why?"));
  const list = el("ul", "reasons");
  r.reasons.forEach((reason) => list.append(el("li", "", reason)));
  resultBox.append(list);

  // The message with warning signs highlighted
  if (r.highlights.length) {
    resultBox.append(el("h3", "section-title", "What we spotted in the message"));
    resultBox.append(buildHighlightedText(text, r.highlights));
    const legend = el("div", "legend");
    legend.append(el("span", "mark-high", "danger"), el("span", "mark-medium", "warning"), el("span", "mark-good", "official"));
    resultBox.append(legend);
  }

  // Link X-ray
  if (r.links.length) {
    resultBox.append(el("h3", "section-title", "🔍 Link X-ray"));
    r.links.forEach((link) => {
      const row = el("div", "xray xray-" + link.verdict);
      const icon = { official: "✅", warning: "⚠️", danger: "🚫", unknown: "❔" }[link.verdict];
      row.append(el("div", "xray-host", icon + " " + link.raw), el("div", "xray-why", link.explanation));
      resultBox.append(row);
    });
  }

  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
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

// ---------- 4. Offline banner ----------
function updateOnlineStatus() {
  offlineBanner.hidden = navigator.onLine;
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

// ---------- 5. Service worker (makes the app work offline) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .catch((err) => console.warn("Service worker failed:", err));
  });
}
