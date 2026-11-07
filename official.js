// ============================================================
// StormCheck — official.js
// Downloads the latest OFFICIAL weather alerts for Miami-Dade from the
// National Weather Service (api.weather.gov) and saves a copy on the phone.
// When the internet goes down, the app uses the saved copy instead.
//
// Demo storm mode loads practice data (fictional Hurricane Kendra) so the
// app can be presented even when there's no real storm.
// ============================================================

const Official = (() => {
  const SAVE_KEY = "stormcheck-official-v1";
  const DEMO_KEY = "stormcheck-demo-mode";
  const NWS_URL = "https://api.weather.gov/alerts/active?area=FL";
  const MIAMI_DADE = /miami[-\s]?dade/i;

  // localStorage can be blocked in some browsers, so always wrap it
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }

  function isDemo() { return read(DEMO_KEY) === "on"; }
  function setDemo(on) { write(DEMO_KEY, on ? "on" : "off"); }

  // Pull a storm name like "Kendra" out of "Hurricane Kendra ..."
  function stormName(text) {
    const m = (text || "").match(/\b(?:Hurricane|Tropical Storm)\s+([A-Z][a-z]{2,})\b/);
    return m && !/^(Warning|Watch|Local|Statement|Force)$/.test(m[1]) ? m[1] : "";
  }

  // Keep only the fields the app needs
  function simplify(feature) {
    const p = feature.properties || {};
    return {
      event: p.event || "",
      headline: p.headline || "",
      areaDesc: p.areaDesc || "",
      senderName: p.senderName || "National Weather Service",
      sent: p.sent || "",
      expires: p.expires || "",
      description: (p.description || "").slice(0, 800),
      storm: stormName((p.headline || "") + " " + (p.description || "")),
    };
  }

  // The NWS sends one copy per zone, so remove duplicates
  function dedupe(alerts) {
    const seen = new Set();
    return alerts.filter((a) => {
      const key = a.event + "|" + a.storm;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Returns { alerts, fetchedAt, source }
  //   source: "live" (just downloaded), "saved" (offline copy), "demo", or "none"
  async function load() {
    if (isDemo()) {
      const res = await fetch("data/demo-official-alerts.json");
      const data = await res.json();
      const now = Date.now();
      const alerts = data.alerts.map((a) => ({ ...a, sent: new Date(now - 2 * 3600e3).toISOString() }));
      return { alerts, fetchedAt: now, source: "demo" };
    }

    try {
      if (!navigator.onLine) throw new Error("offline");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(NWS_URL, {
        headers: { Accept: "application/geo+json" },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("NWS error " + res.status);
      const data = await res.json();
      const alerts = dedupe((data.features || []).map(simplify).filter((a) => MIAMI_DADE.test(a.areaDesc)));
      const saved = { alerts, fetchedAt: Date.now() };
      write(SAVE_KEY, JSON.stringify(saved));
      return { ...saved, source: "live" };
    } catch (err) {
      // No internet (or NWS is down): use the copy saved last time
      const raw = read(SAVE_KEY);
      if (raw) {
        try { return { ...JSON.parse(raw), source: "saved" }; } catch (e) { /* bad copy */ }
      }
      return { alerts: null, fetchedAt: null, source: "none" };
    }
  }

  return { load, isDemo, setDemo };
})();
