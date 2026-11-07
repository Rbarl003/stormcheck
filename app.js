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
    showResult("unverified", "Nothing to check yet", ["Paste an alert or message above first."]);
    return;
  }

  // PLACEHOLDER: Sprint 1 replaces this with the real rules engine.
  const result = checkAlert(text);
  showResult(result.label, result.title, result.reasons);
});

// Temporary checker so the screen works tonight.
function checkAlert(text) {
  return {
    label: "unverified",
    title: "❔ Unverified",
    reasons: ["The checking rules are coming in Sprint 1. This is a test result."],
  };
}

// ---------- 3. Show a result on screen ----------
function showResult(label, title, reasons) {
  resultBox.className = "card result " + label;
  resultBox.innerHTML = "";

  const heading = document.createElement("p");
  heading.className = "result-label";
  heading.textContent = title;

  const list = document.createElement("ul");
  reasons.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r; // textContent keeps pasted text safe (no code injection)
    list.appendChild(li);
  });

  resultBox.append(heading, list);
  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
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
