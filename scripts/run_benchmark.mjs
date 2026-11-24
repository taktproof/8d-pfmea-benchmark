import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate8D } from "../src/evaluate_8d.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datasetPath = path.join(__dirname, "../dataset/synthetic_ev_8d_20cases.jsonl");

const lines = fs.readFileSync(datasetPath, "utf8").trim().split("\n");
let passed = 0;

console.log("TaktProof 8D x PFMEA Deterministic Benchmark (n = " + lines.length + " synthetic cases)");
console.log("------------------------------------------------------------------------");

for (const line of lines) {
  const row = JSON.parse(line);
  const res = evaluate8D(row.draft);
  const ok = res.verdict === row.expected_verdict;
  if (ok) passed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} | ${row.id} | ${row.domain.padEnd(32)} | score=${String(res.score).padStart(2)} | verdict=${res.verdict}`
  );
  if (!ok) {
    console.error(`  Expected ${row.expected_verdict}, got ${res.verdict}`, res.findings);
    process.exitCode = 1;
  }
}

console.log("------------------------------------------------------------------------");
console.log(`Result: ${passed}/${lines.length} benchmark assertions passed.`);
if (passed !== lines.length) process.exit(1);
