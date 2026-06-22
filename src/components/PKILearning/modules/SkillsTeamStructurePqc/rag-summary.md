# Building Your PQC Team (Skills & Team Structure)

## Overview

The Skills & Team Structure module teaches leaders how to staff a post-quantum cryptography (PQC) migration program. PQC migration demands a combination of skills that rarely coexists in one team: deep cryptographic knowledge (algorithms, protocols, PKI architecture), enterprise program management at scale, and domain-specific technical expertise (network, application, OT, cloud). The market for professionals who combine even two of these is thin. The recommended approach is to build a small core of cryptographic expertise, supplement it with upskilled existing security and IT staff, and augment with external specialists for capabilities that cannot be developed internally in the required timeframe. Source: Applied Quantum PQC Migration Framework (Universal Edition 2.1), "Skills & Team Structure" section, pp. 160–164.

## Key Concepts

- **Seven core roles** — Quantum-Readiness Program Manager / QRPM (1.0 FTE), Cryptographic Architect (0.5–1.0), Security Engineers (PQC) (2–4), Application Security Lead (1.0), OT Security Specialist (0.5–1.0 if OT in scope), Vendor/Procurement Lead (0.5), PMO Analyst (0.5–1.0). Each role lists required skills and a recommended source. Role spine reused from `@/data/roleCrosswalk.ts` (`ROLE_CROSSWALK`).
- **Dedicated overhead** — QRPM, Cryptographic Architect, and PMO Analyst are staffed regardless of estate size.
- **Team-sizing heuristic** — one dedicated FTE per **500 cryptographic instances** in the CBOM for the first two years (discovery, CBOM, risk scoring, pilot), dropping to one per 1,000 during production rollout. Constant reused from `@/data/roleCrosswalk.ts` (`FTE_PER_CRYPTO_INSTANCES = 500`). Below 1,000 instances: part-time QRPM plus consulting. Above 10,000 instances: dedicated program office of 8–12 FTEs at peak. Team size tracks the cryptographic estate, not revenue or headcount.
- **Build / Borrow / Buy** — per-capability sourcing: Program management (Build), Cryptographic architecture (Build if possible, borrow for design), Discovery & inventory (Buy the tool, run internally), PKI modernization (Build, augmented), Vendor governance (Build), Strategic quantum CTI (Borrow).
- **Four training levels** — (1) Executive education (half-day to one day), (2) PQC foundations (3–5 days), (3) Deep technical (ongoing, lab-based), (4) Crypto Champion Program (standing).
- **Crypto Champion Program** — one champion per platform/application team (web, mobile, data, infrastructure, OT, identity). Champions attend foundations training, join quarterly crypto-agility briefings, liaise with the program, sign off on crypto readiness in design reviews, and shepherd PQC library upgrades. The model scales reach without making every developer a cryptographer; champions become a standing network after migration.
- **Skills matrix** — six skill domains mapped to primary roles and proficiency targets; a domain with no named owner is a program risk.

## Workshop / Interactive Activities

The workshop has 2 interactive steps:

1. **Team Sizing Calculator** — enter cryptographic-instance count, select program phase (first-two-years 1/500 vs. production-rollout 1/1,000), and toggle OT-in-scope; computes an estimated program FTE count, classifies the estate band (small / standard / program-office), and exports a sizing plan plus the core-role table as Markdown (saved to the learning portfolio as a `skills-team-plan` document).
2. **Crypto Champion Roster** — assign a named champion per platform and track the four readiness commitments (foundations, quarterly briefings, design-review sign-off, library-upgrade shepherding); warns on unstaffed platforms and incomplete readiness; exports the roster as Markdown.

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA, draft)
- NSA CNSA 2.0 (algorithm suite and timelines)
- CycloneDX (CBOM format the team operates and maintains)
