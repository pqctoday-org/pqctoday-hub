# Executive Quantum Impact

## Overview

The Executive Quantum Impact module equips C-suite leaders, CISOs, and board members with the strategic context and decision-making tools needed to act on the quantum computing threat. It addresses the six most material business risks (HNDL data exposure, regulatory milestones, board oversight, vendor supply chain, competitive disadvantage, and cyber insurance questions), provides a nine-criterion organizational self-assessment, and walks through building an actionable PQC migration roadmap framed for executive audiences. All content is calibrated for non-technical stakeholders who own budget and risk accountability.

## Key Concepts

- **Harvest Now, Decrypt Later (HNDL)** — adversaries are recording encrypted traffic today to decrypt once a cryptographically relevant quantum computer (CRQC) arrives; data with long confidentiality requirements (health records, IP, state secrets) is already at risk regardless of the CRQC timeline; the HNDL window is the number of years remaining data must stay confidential minus years until a CRQC is available
- **Mosca's Theorem** — if (shelf life of data) + (time to migrate) > (time to CRQC), the organization is at risk; executives should use this formula to prioritize which systems to migrate first based on data lifetime and remediation complexity
- **CNSA 2.0 Deadlines (National Security Systems)** — NSA mandates: software/firmware signing and networking equipment (preferred 2025–2026, exclusive 2030), operating systems and web browsers/servers/cloud (exclusive 2033, along with niche equipment and custom/legacy applications); NSA expects the NSS transition to quantum-resistant algorithms to be complete by 2035 in line with NSM-10 — an NSS target, not a global sunset of RSA and ECC; non-compliance for defense contractors carries contract termination risk
- **EO 14412 Deadlines (federal civilian systems)** — Executive Order 14412, "Securing the Nation Against Advanced Cryptographic Attacks" (signed 22 June 2026, published 25 June 2026), is the operative US mandate for federal civilian High Value Assets, high-impact systems and covered contractors: PQC for key establishment (ML-KEM, FIPS 203) by 31 December 2030 and for digital signatures by 31 December 2031 — the split is deliberate, since key establishment carries the HNDL exposure. OMB Memorandum M-26-15 (24 June 2026) is the implementing guidance, setting a five-phase agency schedule and requiring agency PQC migration plans at OMB; it does not apply to National Security Systems. EO 14412 also directs a FAR Council proposed rule on contractor FIPS/PQC compliance (due 19 December 2026) and CISA guidance on minimum CBOM elements (due 19 March 2027)
- **EU Regulatory Mandates** — EU Coordinated PQC Roadmap (v1.1, June 2025) sets 2030 and 2035 milestones; eIDAS 2.0 mandates EUDI wallet availability by December 2026, but PQC readiness for EUDI wallets follows the EU PQC roadmap (2030 for high-risk systems, 2035 full transition) — wallet deployment and PQC capability are separate timelines; DORA (enforcement January 2025) and NIS2 impose ICT and cyber risk-management duties, including cryptography policy, but set no PQC algorithm deadline
- **Board Oversight & Disclosure (SEC Cyber Disclosure Rules)** — the SEC rules effective December 2023 require US-listed companies to file Form 8-K Item 1.05 within four business days after determining that a cybersecurity incident is material, and to describe cyber risk management, strategy and board oversight annually (Regulation S-K Item 106); the rules do not prescribe particular technologies and set no PQC requirement; quantum risk to long-lived data is a reasonable topic for that annual risk-management description; any personal exposure of directors depends on jurisdiction and facts and is a question for counsel
- **Vendor & Supply Chain Exposure** — PQC readiness of software and hardware suppliers directly extends or limits an organization's own migration timeline; a vendor with no PQC roadmap becomes a blocking dependency; third-party risk assessments must include PQC criteria
- **Competitive Disadvantage** — buyers in regulated sectors (government, defense, financial services) are starting to ask suppliers about PQC readiness; early movers may gain a trust or procurement advantage and avoid compressed late migrations, though the size of that advantage is not yet measured
- **Cyber Insurance Questions** — there is no published evidence yet of insurers pricing or excluding quantum risk; executives can ask their broker whether renewal questionnaires cover cryptographic inventory or a PQC migration plan, and keep a documented answer ready
- **Crypto Agility Business Case** — the ability to swap cryptographic algorithms without application re-architecture; crypto-agile systems reduce future migration cost from multi-year projects to weeks; the business case for crypto agility investment is strongest when amortized over multiple anticipated algorithm transitions

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **Why It Matters** — explores six possible executive impact areas as scenarios and decision prompts, while separating sourced context from organization-specific conclusions.
2. **What to Learn** — a learning self-check that helps the learner choose relevant executive topics without presenting the result as a risk assessment.
3. **How to Act** — generates a phased executive action plan across four timeframes: This Week, 30 Days, 90 Days, and 6 Months; includes quick wins, example KPI prompts, and a Markdown export for a draft board briefing.
4. **Organisational Evidence Scope** — nine Yes/No/Unknown questions that identify possible decision drivers and evidence requests. It deliberately does not calculate a risk or exposure score, and unanswered questions remain unknown rather than being treated as low exposure.

## Related Standards

- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0 — 2022 advisory)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards — final, October 2026)
- NSM-10 (National Security Memorandum on Promoting U.S. Leadership in Quantum Computing, May 2022)
- EO 14306 (Presidential order sustaining PQC migration, June 2025)
- EO 14412 (Securing the Nation Against Advanced Cryptographic Attacks, signed 22 June 2026) — PQC transition for HVAs and high impact systems (excluding National Security Systems): key establishment by December 31, 2030
- OMB M-26-15 (Execution of the Migration to Post-Quantum Cryptography, 24 June 2026) — implementing guidance for EO 14412
- EU Coordinated Implementation Roadmap for PQC (v1.1, June 2025)
- DORA (EU Digital Operational Resilience Act, enforcement January 2025)
- eIDAS 2.0 (EU Digital Identity framework, mandatory EUDI Wallet availability December 2026; PQC readiness follows EU PQC roadmap — not required by December 2026)
- SEC Cybersecurity Disclosure Rules (December 2023)
- FAIR (Factor Analysis of Information Risk) — breach cost quantification methodology

## Cross-References

- `pqc-risk-management` — detailed risk quantification frameworks (FAIR, HNDL window calculation)
- `pqc-business-case` — ROI calculator, breach scenario simulator, board pitch builder
- `pqc-governance` — governance structures, CBOM, steering committee charters
- `compliance-strategy` — jurisdiction mapping, audit readiness, regulatory deadline tracking
- `migration-program` — phased migration planning, infrastructure dependency mapping
- `vendor-risk` — third-party PQC readiness assessment, supply chain exposure scoring
