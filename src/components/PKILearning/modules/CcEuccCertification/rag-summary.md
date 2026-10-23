# Common Criteria, EUCC & eIDAS Certification

## Overview

This advanced Hardware Infrastructure module (LM-068) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers Common Criteria and the CC:2022 transition, EUCC as the EU scheme, eIDAS qualified devices and the Protection Profiles that connect them: what each claim proves and what adding post-quantum cryptography means for a certified product. Version 1 is labelled "Practitioner orientation — not laboratory training." It was reviewed and signed off by the PQC Today owner on 22 October 2026; it has not been reviewed by an accredited laboratory or certification body. Facts are as of 24 September 2026.

Three distinct paths cover CC evaluation criteria (`cc`), EUCC scheme rules (`eucc`) and eIDAS device/service requirements (legacy URL `eucc-eidas` retained). EUCC uses CC, while eIDAS is a separate legal context, not the next mandatory stage. FIPS 140-3 remains separate. Shared PP examples are optional reference material. Existing section-progress identifiers are preserved.

## Key Concepts

Optional EN 419221-5 history explains the 2016 certification of draft v0.15 and ANSSI's 18 May 2020 maintenance report for published v1.0. ANSSI classified the reported editorial/standardisation changes as minor. This concerns a Protection Profile, not a PQC product update; it does not establish that adding ML-DSA qualifies for maintenance, that a product certificate is currently valid, or that no newer PP edition exists.

Guidance status checked 21 October 2026: ENISA lists ACM v2 as applicable and v3 as a draft for public review. ACM mechanism/parameter recommendations are not standalone certification verdicts or blanket legal requirements for every CC/eIDAS assessment. Check the construction, implementation, applicable scheme rules, PP and Security Target separately.

- **Common Criteria vs EUCC** — the Common Criteria path covers CC and the CCRA only; EUCC-specific rules appear there only as labelled "Under EUCC" pointers. An EUCC evaluation is a CC evaluation run under EU law: it takes the CC:2022 criteria, CEM, Security Target, Protection Profiles and assurance components, and adds two assurance levels (substantial = AVA_VAN 1–2, high = AVA_VAN 3–5; CIR 2024/482 Art 4), Annex I technical domains and Annex II protection profiles, the ECCG Agreed Cryptographic Mechanisms (guidance, including PQC), no self-assessment (Art 6), at most five years' validity (Art 12), its own minor/major change rules (CIR 2025/2462) and a per-certificate route to the CCRA mark (CCMC-011). Adding PQC: under CC, new FCS_COP/FCS_CKM iterations are typically a major change and the certification body decides the route; under EUCC, the ACM's PQC rules also apply, and CC 3.1 revision 1–4 protection profiles required under eIDAS, Decision 2016/650 or the tachograph rules remain usable with no end date (CIR 2024/3144 Art 3(4)).
- **"EAL4+" is meaningless without its augmentations** — the named components are the claim.
- **EUCC is a scheme, not a Protection Profile** — EUCC's Agreed Cryptographic Mechanisms v2 already lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS and LMS, and says (M)LWE-based mechanisms should be combined with a classical mechanism.
- **eIDAS assessment scope** — eIDAS sets legal device and service requirements. Identify the applicable Article 30 assessment basis and designated body; EUCC is not a universal route. Distinguish an HSM component certificate, certification of the complete QSCD and qualified trust-service status. The remote-signing exercise explicitly selects EUCC evidence for its HSM example.
- **One criteria, many schemes** — Common Criteria (ISO/IEC 15408) is the shared baseline, but certificates come from national schemes. The CCRA (36 countries: 18 issue, 18 recognise) mutually recognises only a collaborative PP or up to EAL2 + ALC_FLR, and never the cryptography — each scheme adds its own (NIAP's CAVP requirement and PP-only policy, Canada's approved cryptography, Korea's KCMVP, Malaysia's MyCV, the EU's ECCG ACM), plus lighter national methods (CSPN, BSZ, LINCE) and procurement mandates. NIAP Policy #33 stops accepting products — certified by NIAP or any CCRA partner — that do not meet CNSA 2.0 from 1 January 2028. China (GB/T 18336), Russia (GOST R ISO/IEC 15408) and Kazakhstan use the CC text outside the CCRA, without mutual recognition.

## Workshop / Interactive Activities

_Decode the certificate claim_ (CC and EUCC paths) and _Regulation-to-certificate trace_ (eIDAS path; explicitly scoped scenarios).

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
