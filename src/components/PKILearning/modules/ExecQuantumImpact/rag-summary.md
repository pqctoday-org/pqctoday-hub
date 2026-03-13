# Executive Quantum Impact

## Overview

The Executive Quantum Impact module equips C-suite leaders, CISOs, and board members with the strategic context and decision-making tools needed to act on the quantum computing threat. It addresses the six most material business risks (HNDL data exposure, regulatory deadlines, board liability, vendor supply chain, competitive disadvantage, and cyber insurance gaps), provides a nine-criterion organizational self-assessment, and walks through building an actionable PQC migration roadmap framed for executive audiences. All content is calibrated for non-technical stakeholders who own budget and risk accountability.

## Key Concepts

- **Harvest Now, Decrypt Later (HNDL)** — adversaries are recording encrypted traffic today to decrypt once a cryptographically relevant quantum computer (CRQC) arrives; data with long confidentiality requirements (health records, IP, state secrets) is already at risk regardless of the CRQC timeline; the HNDL window is the number of years remaining data must stay confidential minus years until a CRQC is available
- **Mosca's Theorem** — if (shelf life of data) + (time to migrate) > (time to CRQC), the organization is at risk; executives should use this formula to prioritize which systems to migrate first based on data lifetime and remediation complexity
- **CNSA 2.0 Deadlines** — NSA mandates: software/firmware signing and networking equipment (preferred 2025–2026, exclusive 2030), operating systems and web browsers/cloud/servers (exclusive 2033), complete deprecation of classical asymmetric cryptography by 2035; non-compliance for defense contractors carries contract termination risk
- **EU Regulatory Mandates** — EU Coordinated PQC Roadmap (v1.1, June 2025) sets 2030 and 2035 milestones; eIDAS 2.0 requires PQC-capable EUDI wallets by December 2026; DORA (enforcement January 2025) requires financial sector digital resilience including crypto agility
- **Board Liability (SEC Cyber Disclosure Rules)** — SEC rules effective December 2023 require material cybersecurity risk disclosure within 4 days of discovery; quantum risk to long-lived data may qualify as a material risk requiring proactive disclosure; CISO and board members face personal liability for failure to disclose known risks
- **Vendor & Supply Chain Exposure** — PQC readiness of software and hardware suppliers directly extends or limits an organization's own migration timeline; a vendor with no PQC roadmap becomes a blocking dependency; third-party risk assessments must include PQC criteria
- **Competitive Disadvantage** — early PQC movers gain customer trust signals, procurement advantages in regulated sectors (government, defense, financial services), and reduced migration pressure as CRQC timelines tighten; laggards face emergency migration costs and reputational damage
- **Cyber Insurance Exclusions** — major cyber insurers are introducing quantum-risk clauses; organizations that cannot demonstrate PQC migration progress may face policy exclusions, higher premiums, or denial of quantum-related breach claims by 2028-2030
- **Crypto Agility Business Case** — the ability to swap cryptographic algorithms without application re-architecture; crypto-agile systems reduce future migration cost from multi-year projects to weeks; the business case for crypto agility investment is strongest when amortized over multiple anticipated algorithm transitions

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **Threat Impact Explorer** — six-panel executive briefing covering HNDL exposure (critical, already happening), regulatory deadline mapping (critical, 2025–2035), board and fiduciary liability (high, growing annually), vendor and supply chain risk (high, 2025–2028 assessment window), competitive disadvantage (medium, 2026–2030), and rising cyber insurance costs (medium, 2026–2030); each panel includes an example scenario illustrating the business impact
2. **Self-Assessment Checklist** — nine weighted criteria that calculate a live Quantum Exposure Score (0–100%): long-term data confidentiality (15%), regulated industry membership (15%), government/defense contracts (12%), no documented PQC migration plan (12%), multi-jurisdiction operations (10%), lack of cryptographic inventory (10%), high-value IP or trade secrets (10%), 10+ third-party vendor dependencies (8%), and no PQC budget allocated (8%); score thresholds at 40% (Medium) and 70% (High)
3. **Action Plan Builder** — generates a phased executive action plan across four timeframes: This Week (request crypto inventory, schedule quantum risk briefing), 30 Days (commission PQC risk assessment), 90 Days (present business case to board, establish PQC governance), and 6 Months (fund and launch migration pilot); includes three quick wins to start immediately, six KPI metrics to track progress, and a Markdown export feature for board briefing documents

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
