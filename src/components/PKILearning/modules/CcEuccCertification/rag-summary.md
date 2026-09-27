# Common Criteria, EUCC & eIDAS Certification

## Overview

This advanced Hardware Infrastructure module (LM-068) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers Common Criteria and the CC:2022 transition, EUCC as the EU scheme, eIDAS qualified devices and the Protection Profiles that connect them: what each claim proves and what adding post-quantum cryptography means for a certified product. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

The learner picks one of two paths — Common Criteria, or EUCC & eIDAS — each a timed ~60-minute route. Both paths share the Security IC Platform Protection Profile case. Deeper material is kept as optional reference sections.

## Key Concepts

- **"EAL4+" is meaningless without its augmentations** — the named components are the claim.
- **EUCC is a scheme, not a Protection Profile** — EUCC's Agreed Cryptographic Mechanisms v2 already lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS and LMS, and says (M)LWE-based mechanisms should be combined with a classical mechanism.
- **From eIDAS to a certified device** — eIDAS is the regulation; the certificate comes from EUCC, against a Protection Profile the conformity assessment expects.

## Workshop / Interactive Activities

_Decode the certificate claim_ (Common Criteria path) and _Regulation-to-certificate trace_ (EUCC & eIDAS path).

## Related Standards

- `CCMC-2023-04-001-CC2022-Transition-Policy`
- `CCDB-014-Assurance-Continuity-v3-1`
- `COMMON-CRITERIA`
- `CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme`
- `CIR-EU-2025-2462-EUCC-Amendment`
- `EUCC v2.0 ACM`
- `eIDAS-2-Regulation`
- `ANSSI-CC-PP-2016-05-EN-419221-5`
- `BSI-CC-PP-0084-V2-2026`
