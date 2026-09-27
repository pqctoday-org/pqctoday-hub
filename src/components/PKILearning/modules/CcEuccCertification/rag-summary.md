# Common Criteria, EUCC & eIDAS Certification

## Overview

This advanced Hardware Infrastructure module (LM-068) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers Common Criteria and the CC:2022 transition, EUCC as the EU scheme, eIDAS qualified devices and the Protection Profiles that connect them: what each claim proves and what adding post-quantum cryptography means for a certified product. Version 1 is labelled "Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body." Facts are as of 24 September 2026.

The learner picks one of two paths — Common Criteria, or EUCC & eIDAS — each a timed ~60-minute route. Both paths share the Security IC Platform Protection Profile case. Deeper material is kept as optional reference sections.

## Key Concepts

- **"EAL4+" is meaningless without its augmentations** — the named components are the claim.
- **EUCC is a scheme, not a Protection Profile** — EUCC's Agreed Cryptographic Mechanisms v2 already lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS and LMS, and says (M)LWE-based mechanisms should be combined with a classical mechanism.
- **From eIDAS to a certified device** — eIDAS is the regulation; the certificate comes from EUCC, against a Protection Profile the conformity assessment expects.
- **One criteria, many schemes** — Common Criteria (ISO/IEC 15408) is the shared baseline, but certificates come from national schemes. The CCRA (36 countries: 18 issue, 18 recognise) mutually recognises only a collaborative PP or up to EAL2 + ALC_FLR, and never the cryptography — each scheme adds its own (NIAP's CAVP requirement and PP-only policy, Canada's approved cryptography, Korea's KCMVP, Malaysia's MyCV, the EU's ECCG ACM), plus lighter national methods (CSPN, BSZ, LINCE) and procurement mandates. NIAP Policy #33 stops accepting products — certified by NIAP or any CCRA partner — that do not meet CNSA 2.0 from 1 January 2028. China (GB/T 18336), Russia (GOST R ISO/IEC 15408) and Kazakhstan use the CC text outside the CCRA, without mutual recognition.

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
- `UK-NCSC-Migration-Timelines-2025`
- `BSI TR-02102-1`
- `NSA CNSA 2.0`
- `AU-ASD-ISM-Crypto-2024`
