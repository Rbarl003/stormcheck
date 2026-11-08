// Run with:  node tests/run-tests.js   (add --verbose to see every reason)
// 1) Sample alerts: checked with no official data
// 2) Context cases: checked against demo official data (or an empty list)
const path = require("path");
const engine = require(path.join(__dirname, "..", "engine.js"));
const samples = require(path.join(__dirname, "..", "data", "sample-alerts.json"));
const cases = require(path.join(__dirname, "context-cases.json"));
const demo = require(path.join(__dirname, "..", "data", "demo-official-alerts.json"));
const verbose = process.argv.includes("--verbose");

let passed = 0, total = 0;
function check(id, expected, text, context, source) {
  total++;
  const r = engine.analyze(text, context);
  const ok = r.label === expected;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"}  #${String(id).padEnd(3)} expected ${expected.padEnd(10)} got ${r.label.padEnd(10)} score ${String(r.score).padStart(3)}  ${source}`);
  if (!ok || verbose) r.reasons.forEach((x) => console.log("        - " + x));
}

console.log("— Sample alerts —");
samples.forEach((s) => check(s.id, s.expected, s.text, {}, s.source));

console.log("\n— Compared with official alerts —");
cases.forEach((c) => {
  const officialAlerts = c.data === "demo" ? demo.alerts : [];
  check(c.id, c.expected, c.text, { officialAlerts, updatedText: "4:52 PM" }, c.source);
});

console.log("\n— QR share links —");
const share = require(path.join(__dirname, "..", "share.js"));
["Hurricane Warning for Miami-Dade. https://www.nhc.noaa.gov", "ALERTA FEMA: ayuda por el huracán ñ", "Avètisman siklòn: lanmè k ap monte"].forEach((msg, i) => {
  total++;
  const { url } = share.makeLink("https://stormcheck-miami.netlify.app/", msg);
  const back = share.readFromHash(url.slice(url.indexOf("#")));
  const ok = back === msg;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"}  #Q${i + 1}  message survives the QR link round trip  (${url.length} characters)`);
});

console.log(`\n${passed}/${total} passed`);
process.exit(passed === total ? 0 : 1);
