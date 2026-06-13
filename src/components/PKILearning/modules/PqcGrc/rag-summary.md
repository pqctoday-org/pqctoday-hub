# PQC GRC

## Overview

The PQC GRC module teaches the Governance, Risk, and Compliance function that makes a post-quantum migration governable, measurable, and auditable. Where the SOC detects and responds, the GRC function measures, reports, and governs — producing the instruments the board uses to oversee the program, the CISO uses to manage it, and internal audit uses to verify it. The module is adapted from the GRC Implementation section of the Applied Quantum PQC Migration Framework. It starts from why quantum risk breaks the standard ERM playbook (uncertain timing, no historical incidents, risk that straddles technology/compliance/strategic/operational categories) and shows how to give quantum risk the same structured treatment as any other top-tier risk rather than building a separate framework.

## Key Concepts

- **KRI Three-Level Cascade** — Key Risk Indicators cascade across three levels, each serving a different audience at a different cadence. **Board (quarterly):** Migration Completion Rate (variance >5pp triggers SteerCo review + board notification), HNDL Residual Exposure (must decrease each quarter), Regulatory Compliance Buffer (<12mo amber, <6mo red + board intervention), Third-Party Quantum Readiness (Tier 1 below "planning" triggers engagement), Material Developments Flag. **CISO (monthly):** Inventory Completeness (<80% = plan unreliable), Migration Velocity (<70% for 2 months = program review), Crypto-Agility Adoption (<95% = architecture review), Regulatory Horizon Tracker, Vendor Readiness Scores, Budget Consumption vs Plan (underspend >15% = review). **Operational (weekly/real-time):** Weekly Migration Throughput, Cryptographic Drift Count, Hybrid Downgrade Alerts, Certificate Transition Progress, Open Exceptions/Deferrals (>6 months without remediation plan = escalation), TTR-PQC.
- **Risk Appetite Statement** — operates at two levels: a strategic board-language sentence (complete migration of >10-year-secrecy data before earliest credible CRQC, with a 12-month regulatory buffer) plus measurable operational tolerances for HNDL, TNFL, regulatory compliance, and crypto-agility dimensions. Board-approved in Phase 0, reviewed annually.
- **Regulatory Horizon Report** — a quarterly (monthly in regulated sectors) report to the Steering and risk committees. Classifies each development as Confirmed (enacted; immediate SteerCo assessment), Proposed (in process; impact assessment within 30 days), or Signaled (guidance/speeches; monitoring entry). Sources span NIST/NCCoE, NSA CNSA 2.0, EU NIS Cooperation Group, CISA, sector regulators, and standards bodies.
- **Third-Party Quantum Readiness** — vendor tiering: Tier 1 migration-constraining (HSMs, CAs, cloud, payment processors, MSSPs) require a CycloneDX 1.6+ CBOM and a product-security review; Tier 2 cryptographic dependency require standard assessment; Tier 3 no dependency require none. Maintain substitution assessments to manage concentration risk; treat M&A as first-party crypto debt inherited at close.
- **GRC-SOC Handoff** — GRC produces four outputs the SOC consumes: the risk appetite statement (defines alert escalation thresholds), the compliance tracker (monitoring priority), vendor assessments (third-party connection treatment), and the **exception/deferral register as a dynamic suppression list** — without it, drift-detection rules drown in alerts from legitimately deferred legacy systems.
- **Audit, Insurance & Crisis Comms** — auditable artifact set (inventory with timestamps, quarterly CBOM snapshots, SteerCo minutes, board-approved appetite statement, Horizon Reports, vendor records, exception register); audit at <6 months, 18–24 months, then annually. Cyber underwriters now price quantum readiness. GRC owns pre-drafted crisis-communication templates (customer, regulator, counterparty, market) with a named spokesperson and approval chain, exercised in tabletop exercises.

## Workshop / Interactive Activities

The workshop has 2 interactive steps:

1. **KRI Cascade Builder** — assign each of 17 KRIs to a board / CISO / operational level and set a status (on track / watch / breach); validation warns when a level is empty (an audience is flying blind at its cadence) or when a board KRI is in breach (board-intervention threshold tripped); exports a board-ready cascade dashboard to the learning portfolio.
2. **Exception Register Triage** — classify deferral entries and decide which propagate to the SOC suppression list versus which escalate, applying the framework rule that an exception is safe to suppress only while ≤6 months old AND carrying a remediation plan; check-and-reveal scoring; exports the triaged register plus the derived SOC suppression list.

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- NIST SP 800-208 (Stateful Hash-Based Signatures)
- CycloneDX 1.6 (CBOM)
- ISO 27005 / ISO 31000 (risk management), COBIT (governance)
