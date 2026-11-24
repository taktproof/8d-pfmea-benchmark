const NEGATION_CUES = /\b(no|not|none|unknown|missing|unverified|unpinned|unspecified|tbd|n\/a|absent|failed to)\b/i;

function isConceptNegated(clause, conceptRe) {
  if (NEGATION_CUES.test(clause)) return true;
  // "without <concept>" or "lacks <concept>" negates the concept itself,
  // whereas "<mechanism> without <safeguard> per PFMEA-v2.1" does not.
  const withoutMatch = clause.match(/\b(?:without|lacks?)\s+([^,;]+?)(?:\s+(?:per|under|against|in|on|at|by)\b|$)/i);
  if (withoutMatch && conceptRe.test(withoutMatch[1])) return true;
  return false;
}

export function evaluate8D(rawText) {
  const cleaned = String(rawText || "").trim();
  if (cleaned.length < 20) {
    return {
      score: 0,
      verdict: "INVALID_INPUT",
      findings: [{ code: "INPUT-MIN", severity: "crit", title: "Draft Too Short", detail: "Provide D2, D4, and D5 statements." }]
    };
  }

  const clauses = cleaned
    .toLowerCase()
    .split(/[.;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let score = 100;
  const findings = [];

  // 1. Operator blame trap (unless explicitly ruled out)
  const hasActiveBlame = clauses.some((c) => {
    const mentionsBlame = /(operator error|human error|careless|forgot|inattentive|worker mistake|night-shift operator)/.test(c);
    const ruledOut = /(ruled out|not caused by|excluded|eliminated|rather than)/.test(c);
    return mentionsBlame && !ruledOut;
  });
  if (hasActiveBlame) {
    score -= 32;
    findings.push({ code: "IATF-OPBLAME", severity: "crit", title: "IATF 16949 §10.2.3 Operator-Blame Trap" });
  } else {
    findings.push({ code: "IATF-OPBLAME", severity: "pass", title: "Systemic / Physical Mechanism Focus" });
  }

  // 2. D4b Escape Point
  const escapeRe = /(escape point|d4b|detection gap|detection check|missed by|tester|sensor threshold|nutrunner|cmm|camera|gauge|aoi|projector|vision check)/;
  const hasPositiveEscape = clauses.some(
    (c) => escapeRe.test(c) && !isConceptNegated(c, /(escape point|d4b|detection)/)
  );
  if (!hasPositiveEscape) {
    score -= 22;
    findings.push({ code: "VDA-ESCAPE", severity: "crit", title: "Missing D4b Escape Point" });
  } else {
    findings.push({ code: "VDA-ESCAPE", severity: "pass", title: "D4b Escape Point Verified" });
  }

  // 3. Time-versioned PFMEA revision pin
  const pfmeaRe = /(pfmea-[a-z0-9-]+|rev\s*[0-9]+|v[0-9]+\.[0-9]+|active pfmea)/;
  const hasExplicitVersionPin = clauses.some(
    (c) => pfmeaRe.test(c) && !isConceptNegated(c, /pfmea|rev|version/) && !/latest\s+[a-z]*\s*pfmea/.test(c)
  );
  const hasDriftPhrase = /(latest\s+[a-z]*\s*pfmea|current\s+pfmea\s+without)/.test(cleaned.toLowerCase());
  if (!hasExplicitVersionPin || hasDriftPhrase) {
    score -= 18;
    findings.push({ code: "PFMEA-TIME", severity: "warn", title: "Unpinned or Drifted PFMEA Revision" });
  } else {
    findings.push({ code: "PFMEA-TIME", severity: "pass", title: "Time-Versioned PFMEA Locked" });
  }

  // 4. D5 systemic poka-yoke vs training-only
  const hasWeakTrainingOnly =
    /(retrain|awareness|warning notice|remind operator)/.test(cleaned.toLowerCase()) &&
    !/(interlock|plc|poka-yoke|probe|threshold|automated|closed-loop|auto-lock)/.test(cleaned.toLowerCase());
  if (hasWeakTrainingOnly) {
    score -= 18;
    findings.push({ code: "IATF-D5SYS", severity: "warn", title: "Weak D5 Action (Training-Only)" });
  } else {
    findings.push({ code: "IATF-D5SYS", severity: "pass", title: "Engineering Poka-Yoke / Control Update" });
  }

  // 5. Positive D2 lot/serial traceability
  const lotRe = /(lot\s+[#a-z0-9-]+|batch\s+[#a-z0-9-]+|heat\s+[#a-z0-9-]+|202[0-9]-[01][0-9]-[0-3][0-9])/;
  const hasPositiveLot = clauses.some(
    (c) => lotRe.test(c) && !isConceptNegated(c, /lot|batch|heat|date/)
  );
  if (!hasPositiveLot) {
    score -= 10;
    findings.push({ code: "IATF-LOT", severity: "warn", title: "Missing Exact Lot / Production Date Anchor" });
  }

  score = Math.max(8, Math.min(98, score));
  const verdict = score >= 85 ? "AUDIT_READY" : score >= 65 ? "REVISION_NEEDED" : "HIGH_REJECT_RISK";
  return { score, verdict, findings };
}
