# Cryptographic Product Certification

## Overview

This advanced Hardware Infrastructure module teaches what a cryptographic product certificate proves under four schemes — FIPS 140-3 (CMVP), Common Criteria, EUCC (with eIDAS), and PCI — how to read one, and how to add post-quantum cryptography to a certified product without losing certification. It is written for product vendors and product-assurance leads; the common core also serves buyers and evaluators. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

The learner picks one of four paths — FIPS 140-3 / CMVP, Common Criteria, EUCC & eIDAS, or PCI (full stack). Each path is a timed 120-minute route: the common core, the chosen scheme, and shared material on PQC impact, crypto agility versus certification latency, deadlines and a capstone. Deeper material is kept as optional reference sections that do not count toward duration or completion.

## Key Concepts

- **Four schemes, four questions** — each scheme answers a different question, so the first step is choosing the scheme that can answer the question being asked.
- **Scope before level** — a certificate covers a defined module, target or device at a version and configuration. The module's anchor is a fictional network HSM ("Orrin N7") sold as an appliance and as a multi-tenant cloud service into four markets.
- **Algorithm validation is not the certificate** — CAVP/ACVP algorithm validation is necessary evidence, not a FIPS 140-3 module certificate.
- **Modules in Process is a queue, not an outcome** — a CMVP MIP entry is not evidence of validation.
- **FIPS 140-3 is unchanged** — no 2025–2026 draft revises FIPS 140-3 or Level 3. Executive Order 14412 §6(b) directs NIST to revise CMVP processes to accelerate validations, with a deadline of about 19 December 2026. FIPS 140-2 certificates moved to the Historical list on 21/22 September 2026.
- **"EAL4+" is meaningless without its augmentations** — the named components are the claim.
- **EUCC is a scheme, not a Protection Profile** — EUCC's Agreed Cryptographic Mechanisms v2 already lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS and LMS, and says (M)LWE-based mechanisms should be combined with a classical mechanism.
- **PCI device approval is not entity assessment** — PTS HSM approval covers a device; PIN Security, P2PE and KMO assess the entities that operate it. A PCI listing's PQC flag means PQC support exists; it does not approve a specific algorithm.
- **A market deadline creates urgency, not a shortcut** — it does not make a PQC addition eligible for a scheme's lighter change route.

## Workshop / Interactive Activities

Shared steps: _Which scheme answers the question?_, _Draw the certification boundary_, and the capstone _One product, four markets_. Path steps: _Level and boundary planner_ (FIPS), _Decode the certificate claim_ (CC), _Regulation-to-certificate trace_ (EUCC & eIDAS), _Payment HSM evidence review_ (PCI). Optional reference steps: _PQC change analyzer_ and _Evidence exchange demo_ (a synthetic teaching demo).

## Source Currency

PCI-licence-gated documents (PTS HSM v5.0 requirements, Program Guide v2.3, KMO v1.0, P2PE v3.2) are cited by title, version and date only; their requirement text is not taught. The public PCI PTS Program Guide v1.9 (June 2020) is superseded by Program Guide v2.3 (May 2026) and is used only to explain the historical delta-change concept. The P2PE v3.1 text is superseded by v3.2 (June 2025).

## Related Standards

- `FIPS-140-3-STANDARD`
- `CMVP-MGMT-MANUAL`
- `NIST-FIPS140-3-IG-PQC`
- `NIST-CMVP-MIP-List`
- `NIST-CMVP-Validated-Modules`
- `NIST-CMVP-140-2-to-140-3-Transition-Timeline`
- `EO-2026-06-22-Securing-the-Nation`
- `NIST-SP-800-140`
- `NIST-ACVP`
- `NIST-SP-1800-40B-IPD`
- `CCMC-2023-04-001-CC2022-Transition-Policy`
- `CCDB-014-Assurance-Continuity-v3-1`
- `CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme`
- `CIR-EU-2025-2462-EUCC-Amendment`
- `EUCC v2.0 ACM`
- `eIDAS-2-Regulation`
- `ANSSI-CC-PP-2016-05-EN-419221-5`
- `BSI-CC-PP-0084-V2-2026`
- `PCI-SSC-Blog-Publishes-PTS-HSM-v5-0`
- `PCI-PTS-Listing-Field-Definitions`
- `PCI-SSC-Blog-KMO-v1-0-Published`
