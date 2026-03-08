# Executive Quantum Impact

## Overview

The Executive Quantum Impact module equips C-suite leaders, CISOs, and board members with the strategic context and decision-making tools needed to act on the quantum computing threat. It addresses the six most material business risks (HNDL data exposure, regulatory deadlines, board liability, vendor supply chain, competitive disadvantage, and cyber insurance gaps), provides a nine-criterion organizational self-assessment, and walks through building an actionable PQC migration roadmap framed for executive audiences. All content is calibrated for non-technical stakeholders who own budget and risk accountability.

## Key Concepts

- **Harvest Now, Decrypt Later (HNDL)** — adversaries are recording encrypted traffic today to decrypt once a cryptographically relevant quantum computer (CRQC) arrives; data with long confidentiality requirements (health records, IP, state secrets) is already at risk regardless of the CRQC timeline; the HNDL window is the number of years remaining data must stay confidential minus years until a CRQC is available
- **Mosca's Theorem** — if (shelf life of data) + (time to migrate) > (time to CRQC), the organization is at risk; executives should use this formula to prioritize which systems to migrate first based on data lifetime and remediation complexity
- **CNSA 2.0 Deadlines** — NSA mandates: software/firmware signing (preferred 2025, exclusive 2030), new networking equipment by 2026, web/cloud/servers and all national security systems by 2033; non-compliance for defense contractors carries contract termination risk
- **EU Regulatory Mandates** — EU Coordinated PQC Roadmap (v1.1, June 2025) sets 2030 and 2035 milestones; eIDAS 2.0 requires PQC-capable EUDI wallets by December 2026; DORA (enforcement January 2025) requires financial sector digital resilience including crypto agility
- **Board Liability (SEC Cyber Disclosure Rules)** — SEC rules effective December 2023 require material cybersecurity risk disclosure within 4 days of discovery; quantum risk to long-lived data may qualify as a material risk requiring proactive disclosure; CISO and board members face personal liability for failure to disclose known risks
- **Vendor & Supply Chain Exposure** — PQC readiness of software and hardware suppliers directly extends or limits an organization's own migration timeline; a vendor with no PQC roadmap becomes a blocking dependency; third-party risk assessments must include PQC criteria
- **Competitive Disadvantage** — early PQC movers gain customer trust signals, procurement advantages in regulated sectors (government, defense, financial services), and reduced migration pressure as CRQC timelines tighten; laggards face emergency migration costs and reputational damage
- **Cyber Insurance Exclusions** — major cyber insurers are introducing quantum-risk clauses; organizations that cannot demonstrate PQC migration progress may face policy exclusions, higher premiums, or denial of quantum-related breach claims by 2028-2030
- **Crypto Agility Business Case** — the ability to swap cryptographic algorithms without application re-architecture; crypto-agile systems reduce future migration cost from multi-year projects to weeks; the business case for crypto agility investment is strongest when amortized over multiple anticipated algorithm transitions

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **Threat Impact Explorer** — six-panel executive briefing covering HNDL exposure quantification, regulatory deadline mapping across jurisdictions, board liability under SEC disclosure rules, vendor risk scoring, competitive landscape analysis, and cyber insurance gap assessment; each panel includes talking points formatted for board presentation and a risk severity rating
2. **Self-Assessment Survey** — nine-criterion organizational readiness questionnaire covering: long data retention periods (>5 years), regulated industry membership, government/defense contracts, large transaction volumes, IP-intensive operations, international operations with cross-border data flows, public-company disclosure obligations, M&A activity with acquired crypto debt, and critical infrastructure designation; outputs a risk tier (Low / Medium / High / Critical) with tailored action priorities
3. **Action Plan Builder** — generates a phased executive action plan with 90-day quick wins, 12-month strategic initiatives, and 3-year migration targets; integrates with the app's assessment results when available; produces an exportable board briefing memo including timeline, budget framing, and recommended governance structure

## Related Standards

- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0 — 2022 advisory)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards — final March 2025)
- NSM-10 (National Security Memorandum on Promoting U.S. Leadership in Quantum Computing, May 2022)
- EO 14306 (Presidential order sustaining PQC migration, June 2025)
- EU Coordinated Implementation Roadmap for PQC (v1.1, June 2025)
- DORA (EU Digital Operational Resilience Act, enforcement January 2025)
- eIDAS 2.0 (EU Digital Identity framework, mandatory EUDI Wallets December 2026)
- SEC Cybersecurity Disclosure Rules (December 2023)
- FAIR (Factor Analysis of Information Risk) — breach cost quantification methodology

## Cross-References

- `pqc-risk-management` — detailed risk quantification frameworks (FAIR, HNDL window calculation)
- `pqc-business-case` — ROI calculator, breach scenario simulator, board pitch builder
- `pqc-governance` — governance structures, CBOM, steering committee charters
- `compliance-strategy` — jurisdiction mapping, audit readiness, regulatory deadline tracking
- `migration-program` — phased migration planning, infrastructure dependency mapping
- `vendor-risk` — third-party PQC readiness assessment, supply chain exposure scoring
