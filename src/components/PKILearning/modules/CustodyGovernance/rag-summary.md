# Custody Governance & Assurance

## Overview

The Custody Governance & Assurance module (30 minutes, intermediate, Industries track, LM-086) answers how a digital-asset custody design is evaluated, regulated, insured, and audited. It builds on the controls taught in Custody Key Threats & Controls (Module A1) and operational lifecycle procedures (Module A2), while linking Module B as optional further reading for long-term evidence and post-quantum supervisory roadmaps. All regulatory, insurance, and audit statements are educational — never legal advice — and every cell either cites an admitted Library text with its edition/as-of date or explicitly states "not stated".

## Key Concepts

### 6. Six custody evaluation questions (Q1–Q6) with Rule G1 authority checks

- **Q1 (Where is policy checked?):** Strong pattern checks policy inside the signing boundary; acceptable alternatives use indispensable signers or an on-chain verifier. Residual risk: a host broker in front of a policy-free signer is bypassable. Rule G1: who can alter policy code or configuration?
- **Q2 (Full transaction or hash only?):** Strong pattern parses the full transaction inside the boundary or verifies a decoded form bound to the raw bytes. Rule G1: who controls the parser and clear-signing descriptors (ERC-7730 registry trust)?
- **Q3 (Policy-change governance):** Strong pattern requires the same or higher quorum than spending, enforced inside the boundary with a delay and alerting (Module A2 §5h). Rule G1: can an upgrade, module, or admin key bypass it?
- **Q4 (Attested approver hardware & trusted display):** Strong pattern checks device attestation inside the boundary or an independent verifier and binds approvals to decoded content, with revocation (Module A2 §5e). Attestation alone proves neither display correctness nor decoded-content binding. Rule G1: can one person or vendor enrol a new approver?
- **Q5 (State, replay, and expiry):** Strong pattern binds approvals to nonces and short expiries, storing counters/rate limits in-boundary, on-chain, or in distributed state (Module A2 §5j); no long-lived pre-signed transactions. Stateless HSMs cannot hold durable monotonic counters without authenticated external state. Rule G1: who can reset counters or roll back state?
- **Q6 (Recovery, rotation, and time locks):** Strong pattern enforces time locks and veto windows in-boundary or on-chain, gives recovery an independently satisfiable trigger (Module A2 §5f), and ensures rotation does not bypass the quorum (Module A2 §5e). Rule G1: who holds recovery, guardian, and upgrade authority?

### 6b. Jurisdiction-scoped regulatory control map & applicability gates

- **EU:** MiCA (Reg. 2023/1114, Art. 75 safekeeping & custody policy, Art. 70), MiCA CASP authorisation RTS (EU 2025/305), ESMA First-Package Final Report, DORA (Reg. 2022/2554, Art. 2(1)(f) CASP scope, Arts. 17–19, 24–30), DORA ICT Risk RTS (EU 2024/1774, Arts. 6–7 cryptographic key lifecycle including generating, renewing, storing, revoking, and destroying keys), and EBA/GL/2025/02.
- **Hong Kong:** SFC VATP Guidelines (§10.6 98% cold-storage "should" expectation; §10.8(a) offline generation / HSM with "appropriate certification") and SFC Circular 25EC44 (15 Aug 2025) on minimum custody obligations and monitoring (Module A2 §5h).
- **Dubai:** VARA Custody Services Rulebook (v2) and Technology and Information Rulebook (v2) — neither names FIPS 140 or Common Criteria; insurance sits in the VARA Company Rulebook (Part VI.D).
- **New York:** NYDFS 23 NYCRR Part 500 Amendment 2 (access privileges §500.7, MFA §500.12, audit trails §500.6, pen-testing §500.5, 72-hour incident notice §500.17), 23 NYCRR §200.9 (BitLicense customer asset protection), and the updated 30 September 2025 Custodial Structures Guidance (superseding Jan 2023).
- **Singapore:** Binding Payment Services Regulations 2019 (Regs. 18B–18C statutory trust safeguarding; Reg. 18G security of DPT instruments and segregation of duties) separated from non-binding guidance in MAS PS-G03 (19 Sept 2024) and MAS TRM Guidelines (Jan 2021).
- **Japan:** Payment Services Act (Art. 63-11) and Cabinet Office Order No. 7 of 2017 (cold-wallet segregation, matching proprietary assets in cold storage for hot-wallet customer holdings, and external audit).
- **Switzerland:** DEBA Art. 242a and Banking Act Art. 16(1bis) / Art. 37d for insolvency segregation; FINMA Guidance 08/2023 is scoped specifically to staking, not general custody.
- **US Federal Context Band (excluded from W11 control cells by instrument-type gate):** SEC SAB 121 (rescinded 23 Jan 2025 by SAB 122, directing ASC 450-20 / IAS 37 loss-contingency accounting) and OCC Interpretive Letters 1170 & 1184 (national bank custody permissibility).
- **International / Industry:** IOSCO FR11/2023 (policy recommendations) and CCSS v9.0 (voluntary industry standard, not regulation).
- **Algorithm-neutral vs architecture-neutral:** Held texts rarely name algorithms, MPC vs HSM, or PQC (quantum supervisory roadmaps like NIST IR 8547, BIS Paper 158, MAS Quantum Advisory, and HKMA Blueprint are optional further reading in Module B §8c), but several explicitly constrain architecture (cold-storage ratios, segregation, statutory trusts).

### 6c. Insurance, audit, and proof of reserves

- **Insurance:** Covers described in broker material (Aon 2025, WTW 2023) include crime/specie (often split cold vs hot), cyber, and D&O, with underwriting scrutiny of key generation, quorum, cold-storage ratios, ceremonies, and exclusions (insider collusion, social engineering / authorised-push transfers, hot-wallet sub-limits, coercion). Statutory hooks: MiCA Art. 75(8) liability cap & Art. 67 prudential own funds/insurance; SFC §10.22–10.23 compensation arrangement (50% cold / 100% hot "should"); VARA Company Rulebook Part VI.D. Insurance caps or transfers loss after the fact; it does not reduce the attack surface.
- **Audit & assurance:** SOC 1 and ISAE 3402 cover internal controls over financial reporting (ICFR); SOC 2 evaluates AICPA Trust Services Criteria; ISAE 3000 (Revised) is a general assurance standard (limited or reasonable assurance against any suitable criteria, not an "international SOC 2"). Type II covers a period over a service-organization-chosen scope and does not inherently test custody key management. DORA TLPT RTS (EU 2025/1190) Art. 2 / Recital 3 sets authority-assessment criteria for TLPT scoping rather than automatically sweeping in every CASP.
- **Proof of Reserves:** Merkle-tree / Provisions (ePrint 2015/1008) cryptographic asset/liability proofs are one construction. Per the PCAOB Investor Advisory (8 March 2023), PoR reports are not audits and may omit complete liabilities, beneficial ownership, encumbrances, or continuing control after the snapshot.

## Workshop Activity

- **W11 — Regulation & Assurance Control Mapper:** Select a built-in custody architecture preset (or mirror a design from Module A1 W4), apply applicability gates (entity type, licence, jurisdiction, effective version, exemptions, binding verb), and compare multiple jurisdictions side by side — never as cumulative mandates — across key-management controls, a separate US federal context band, and market-practice insurer/auditor columns. Unmapped controls report "no mapped control found (reviewer analysis)" rather than "non-compliant".

## Related Standards

- EU MiCA (2023/1114), MiCA RTS (2025/305), DORA (2022/2554), DORA ICT Risk RTS (2024/1774), DORA TLPT RTS (2025/1190)
- Hong Kong SFC VATP Guidelines & Circular 25EC44; Dubai VARA Custody, Technology & Company Rulebooks
- NYDFS 23 NYCRR Parts 500 & 200.9, Sept 2025 Custodial Structures Guidance; SEC SAB 121/122; OCC Letters 1170 & 1184
- Singapore MAS TRM, PS-G03 & Payment Services Regulations 2019; Japan PSA & Cabinet Office Order; Swiss DEBA Art. 242a, Banking Act Art. 16(1bis) & FINMA 08/2023
- IOSCO FR11/2023, CCSS v9.0, AICPA SOC 1 & SOC 2, IAASB ISAE 3402 & ISAE 3000 (Revised), PCAOB 2023 PoR Advisory, Provisions (ePrint 2015/1008)
