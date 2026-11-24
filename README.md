# TaktProof 8D × PFMEA Audit Readiness Benchmark

Zero-dependency deterministic rule linter and **20-case synthetic manufacturing evaluation dataset** for auditing IATF 16949 / AIAG-VDA 8D corrective action drafts before customer submission.

- **Interactive Web Checker**: [https://taktproof.com/#auditor](https://taktproof.com/#auditor)
- **Maintainer**: TaktProof Engineering (Operated by Jetspeed Consulting, 300 West Yan An Road, Shanghai, China · `hello@taktproof.com`)

---

## Why This Exists

Generic LLM wrappers and naive RAG pipelines fail customer IATF 16949 quality audits in predictable ways:

1. **Operator-Blame Traps (IATF §10.2.3)**: Accepting *"operator carelessness"* as a D4 root cause instead of identifying the physical process or poka-yoke gap.
2. **PFMEA Revision Drift**: Retrieving the latest PDF in a folder rather than locking the PFMEA and Control Plan revision active on the defective batch's exact production date.
3. **Missing D4b Escape Point**: Explaining why the defect occurred (D4a) without explaining why the active Control Plan detection station failed to catch it before shipment (D4b).
4. **Negation-Blind Keyword Scoring**: Naive checklists reward a draft that states *"Lot number unknown; no escape point verified"* simply because the words *"lot"* and *"escape point"* appear.

This repository provides a clause-level, negation-aware deterministic linter (`src/evaluate_8d.mjs`) alongside 20 synthetic discrete manufacturing cases (`dataset/synthetic_ev_8d_20cases.jsonl`) spanning EV inverter housings, CNC machining spindle runout, PCBA SMT reflow, battery tab laser welding, medical injection molding, and torque-controlled assembly.

> **Dataset Provenance**: All 20 benchmark cases in `dataset/synthetic_ev_8d_20cases.jsonl` are 100% synthetic reference scenarios constructed from public AIAG-VDA / IATF 16949 quality engineering principles. No customer data is included.

---

## Quick Start

Requires Node.js 18+ (zero external `npm` dependencies):

```bash
git clone https://github.com/taktproof/8d-pfmea-benchmark.git
cd 8d-pfmea-benchmark
npm test
```

## Five Deterministic Checks

| Rule ID | Audit Invariant | Failure Condition |
| --- | --- | --- |
| `IATF-LOT` | D2 Lot & Date Traceability | Missing or negated lot/serial/heat identifier |
| `IATF-OPBLAME` | Physical Mechanism vs. Operator Blame | Unnegated blame on human carelessness without poka-yoke analysis |
| `PFMEA-TIME` | Time-Versioned PFMEA Pin | Missing revision ID or explicit `"latest PFMEA"` temporal drift |
| `VDA-ESCAPE` | D4b Detection Escape Point | Missing or negated analysis of why EOL/in-process inspection missed defect |
| `IATF-D5SYS` | Systemic D5 Interlock & D6 Validation | Relying solely on `"retrain operator"` without parameter/interlock control |

## License

MIT License. Copyright (c) 2026 Jetspeed Consulting (TaktProof).
