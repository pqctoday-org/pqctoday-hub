# Certification Engineer Quantum Impact

## Overview

The Certification Engineer Quantum Impact module (`cert-quantum-impact`, `LM-079`) equips CSTL/ITSEF lab testers, cryptographic module vendor engineers, and scheme/procurement reviewers with the decision framework needed to scope, plan, and verify post-quantum product certifications. It covers six certification-engineering impacts, a nine-criterion Certification Evidence Scope checklist (Yes/No/Unknown), a phased action plan, and three applied decision scenarios. All exercises are educational and do not perform formal laboratory testing or issue certificates.

## Key Concepts

- **FIPS 140-2 Historical List Transition & CMVP Queue Pressure** — active FIPS 140-2 certificates moved to the CMVP Historical List on 21 September 2026; adding PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) requires FIPS 140-3 submissions through a congested Modules in Process (MIP) queue, making submission-route planning (new validation vs. 1SUB/3SUB/5SUB) and lab scheduling critical.
- **ACVP Seed-Driven AFT `keyGen` & `CAST`/`PCT` (IG 10.3.A)** — PQC algorithm testing under ACVP requires deterministic seed-driven Algorithm Functional Tests (AFT) for `keyGen` alongside encapsulation/decapsulation and signing/verification vectors; inside the module boundary, FIPS 140-3 Implementation Guidance (IG 10.3.A) mandates pre-operational Cryptographic Algorithm Self-Tests (CASTs) and conditional Pairwise Consistency Tests (PCTs).
- **Entropy Source Validation (ESV / SP 800-90B / SP 800-90C)** — FIPS 140-3 modules require validated entropy sources under NIST SP 800-90B via CMVP ESV, and Random Bit Generator (RBG) constructions must align with NIST SP 800-90C (finalized September 2025). PQC key generation depends on full-entropy seeding and documented health tests bound to the target operating environment (OE).
- **EUCC (CIR (EU) 2024/482) & NIAP Policy #33 CNSA 2.0 Cut-Offs** — Common Criteria evaluations diverge across regional schemes: EUCC under Commission Implementing Regulation (EU) 2024/482 references EUCC Agreed Cryptographic Mechanisms (ACM v2) for PQC parameter guidance and eIDAS QSCD Protection Profiles, while US NIAP CCEVS Policy Letter #33 enforces CNSA 2.0 algorithm cut-offs for National Security System Protection Profiles.
- **PCI PTS HSM v5.0 vs. PCI DSS v4.0.1 Scope Boundaries** — payment security separates hardware device approval (PCI PTS HSM v5.0, listed by PCI SSC without a current PQC algorithm mandate) from operational environment compliance (PCI DSS v4.0.1, PIN Security v3.1, P2PE, KMO v1.0). Conflating device approval with operational cryptographic inventory causes scoping errors.
- **Avoiding ACVP-vs.-CMVP & Marketing-Claim Conflation** — an ACVP validation record proves only algorithm vector conformance on a specified OE; a MIP listing proves only queue entry; neither is an active FIPS 140-3 module certificate. Reviewers must check exact firmware versions, OEs, and Security Policies in primary registries and record `Unknown` where evidence is missing.

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **Why It Matters** — reviews six certification-engineering impacts with severity, timeframe, and concrete lab/vendor scenarios.
2. **What to Learn** — self-checks validation skill gaps and links to deep-dive modules (`crypto-product-certification`, `fips-140-3-certification`, `acvp-lab-workflow`, `entropy-randomness`, `cc-eucc-certification`, `pci-certification`, `cbom`, `hsm-pqc`, `standards-bodies`).
3. **How to Act** — generates a phased validation-readiness plan across This Week, 30 Days, 90 Days, and 6 Months, with quick wins, example KPIs, and Markdown export.
4. **Certification Evidence Scope** — nine Yes/No/Unknown questions that identify applicable validation drivers and evidence gaps without treating unanswered items as low exposure.

## Related Standards

- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) — August 2024 NIST PQC standards
- FIPS 140-3 & FIPS 140-3 Implementation Guidance (IG 10.3.A; FIPS 140-2 Historical List transition September 2026)
- NIST ACVP (Automated Cryptographic Validation Protocol)
- NIST CMVP ESV, NIST SP 800-90B, and NIST SP 800-90C (final, September 2025)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards — final, October 2026: 2030 deprecation, post-2035 disallowance)
- NSA CNSA 2.0 & CNSA 2.0 FAQ v2.2 (October 2026: 2027 new acquisitions, 2030 phase-out, 2031 NSS mandate)
- EO 14412 (22 June 2026) & OMB M-26-15 (24 June 2026: 2030 key establishment, 2031 digital signatures for US federal civilian HVAs/high-impact systems)
- EUCC CIR (EU) 2024/482 & EUCC ACM v2
- NIAP CCEVS Policy Letter #33
- PCI PTS HSM v5.0 & PCI DSS v4.0.1

## Cross-References

- `crypto-product-certification` — standards, evaluation criteria, and certification schemes overview
- `fips-140-3-certification` — CMVP module boundaries, MIP queue, ESV, and submission routes
- `acvp-lab-workflow` — ACVP PQC vector testing, deterministic seed harnesses, and evidence classes
- `entropy-randomness` — SP 800-90B entropy testing, SP 800-90C RBGs, and CMVP ESV walkthrough
- `cc-eucc-certification` — Common Criteria, EUCC ACM v2, eIDAS QSCDs, and NIAP Policy #33
- `pci-certification` — PCI PTS HSM v5.0 vs. PCI DSS v4.0.1, PIN, P2PE, and KMO boundaries
- `cbom` — CycloneDX CBOM-to-certificate traceability
- `hsm-pqc` — HSM firmware architecture and PKCS#11 PQC mechanisms
- `standards-bodies` — NIST, ENISA, NIAP, and PCI SSC governance landscape
