// Run with:  node tests/run-tests.js
// Checks that the engine labels every sample alert the way we expect.
const path = require("path");
const engine = require(path.join(__dirname, "..", "engine.js"));
const samples = require(path.join(__dirname, "..", "data", "sample-alerts.json"));

let passed = 0;
for (const s of samples) {
  const r = engine.analyze(s.text);
  const ok = r.label === s.expected;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"}  #${s.id}  expected ${s.expected.padEnd(10)} got ${r.label.padEnd(10)} score ${String(r.score).padStart(3)}  ${s.source}`);
  if (!ok || process.argv.includes("--verbose")) r.reasons.forEach((x) => console.log("        - " + x));
}
console.log(`\n${passed}/${samples.length} passed`);
process.exit(passed === samples.length ? 0 : 1);
