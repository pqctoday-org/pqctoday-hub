# Common Criteria, EUCC & eIDAS Certification

## Overview

This advanced Hardware Infrastructure module (LM-068) is a scheme deep dive split out of LM-065 _Cryptographic Product Certification: Fundamentals_. It covers Common Criteria and the CC:2022 transition, EUCC as the EU scheme, eIDAS qualified devices and the Protection Profiles that connect them: what each claim proves and what adding post-quantum cryptography means for a certified product. Version 1 is labelled "Practitioner orientation — not laboratory training." Reviewed and signed off by the PQC Today owner on 1 November 2026. It has not been reviewed by an accredited laboratory or certification body. Facts are as of 24 September 2026.

Three distinct paths cover CC evaluation criteria (`cc`), EUCC scheme rules (`eucc`) and eIDAS device/service requirements (legacy URL `eucc-eidas` retained). EUCC uses CC, while eIDAS is a separate legal context, not the next mandatory stage. FIPS 140-3 remains separate. Shared PP examples are optional reference material. Existing section-progress identifiers are preserved.

## Key Concepts

Optional EN 419221-5 history explains the 2016 certification of draft v0.15 and ANSSI's 18 May 2020 maintenance report for published v1.0. ANSSI classified the reported editorial/standardisation changes as minor. This concerns a Protection Profile, not a PQC product update; it does not establish that adding ML-DSA qualifies for maintenance, that a product certificate is currently valid, or that no newer PP edition exists.

Guidance status checked 21 October 2026: ENISA lists ACM v2 as applicable and v3 as a draft for public review. ACM mechanism/parameter recommendations are not standalone certification verdicts or blanket legal requirements for every CC/eIDAS assessment. Check the construction, implementation, applicable scheme rules, PP and Security Target separately.

- **Common Criteria vs EUCC** — the Common Criteria path covers CC and the CCRA only; EUCC-specific rules appear there only as labelled "Under EUCC" pointers. An EUCC evaluation is a CC evaluation run under EU law: it takes the CC:2022 criteria, CEM, Security Target, Protection Profiles and assurance components, and adds two assurance levels (substantial = AVA_VAN 1–2, high = AVA_VAN 3–5; CIR 2024/482 Art 4), Annex I technical domains and Annex II protection profiles, the ECCG Agreed Cryptographic Mechanisms (guidance, including PQC), no self-assessment (Art 6), at most five years' validity (Art 12), its own minor/major change rules (CIR 2025/2462) and a per-certificate route to the CCRA mark (CCMC-011). Adding PQC: under CC, new FCS_COP/FCS_CKM iterations are typically a major change and the certification body decides the route; under EUCC, the cryptography guidelines point evaluators to the ECCG ACM, which lists PQC mechanisms, and CC 3.1 revision 1–4 protection profiles required under eIDAS, Decision 2016/650 or the tachograph rules remain usable with no end date (CIR 2024/3144 Art 3(4)).
- **"EAL4+" is meaningless without its augmentations** — the named components are the claim.
- **EUCC is a scheme, not a Protection Profile** — EUCC's Agreed Cryptographic Mechanisms v2 already lists ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, XMSS and LMS, and says (M)LWE-based mechanisms should be combined with a classical mechanism.
- **eIDAS assessment scope** — eIDAS sets legal device and service requirements. Identify the applicable Article 30 assessment basis and designated body; EUCC is not a universal route. Distinguish an HSM component certificate, certification of the complete QSCD and qualified trust-service status. The remote-signing exercise explicitly selects EUCC evidence for its HSM example.
- **One criteria, many schemes** — Common Criteria (ISO/IEC 15408) is the shared baseline, but certificates come from national schemes (in the EU, the EUCC scheme set out in Regulation (EU) 2024/482). The CCRA (36 countries: 18 issue, 18 recognise) mutually recognises only a collaborative PP or up to EAL2 + ALC_FLR; schemes in this module add their own cryptographic requirements (NIAP's CAVP requirement and PP-only policy, Canada's approved cryptography, Korea's KCMVP for listed product types, Malaysia's MyCV, the EU cryptography guidelines' pointer to the ECCG ACM), plus lighter national methods (CSPN, BSZ, LINCE) and procurement mandates. NIAP Policy #33 stops accepting products — certified by NIAP or any CCRA partner — that do not meet CNSA 2.0 from 1 January 2028. China (GB/T 18336), Russia (GOST R ISO/IEC 15408) and Kazakhstan use the CC text outside the CCRA, without mutual recognition.
- **NIAP and post-quantum cryptography** — the recent NIAP profiles offer post-quantum algorithms as choices; they do not mandate them. The Dedicated Security Component cPP v2.1 (17 November 2025) lists LMS, HSS, XMSS, XMSS-MT, ML-KEM and ML-DSA beside the classical algorithms as selections, and NIAP's Technical Decisions TD1011 (for this profile) and TD1010 (Network Devices v4.0) require at least one CNSA 1.0 or CNSA 2.0 selection for the Product Compliant List, so post-quantum is one allowed route, not the only one; the Application Software profile v2.0 (16 June 2025) has a CNSA 2.0 branch next to a CNSA 1.0 branch and says ML-DSA and ML-KEM are not usable yet. The push comes from a chain: CNSSP 11, CNSSP 15 and CNSA 2.0, NIAP Policy #33, the profiles, their test methods and those Technical Decisions, the Security Target's chosen branch, and CSfC. A CMVP module certificate is a separate ask from the NIAP certificate. A table lists 11 NIAP documents read on 23 October 2026 (8 profiles and 3 profile modules) that carry post-quantum choices beside the classical ones, with none requiring them, plus a list of further profiles reported but not yet read. The section ends with six questions to put to the lab. No NIAP profile written for HSMs was found.
- **Worked example and AVA_VAN.5 box (EUCC path, in "PQC under EUCC today (ACM v2)")** — two collapsed panels, each with a short summary that is always shown. The first is an invented Security Target excerpt for the fictional Orrin N7: FCS_CKM.1(ML-KEM-768) key generation, FCS_COP.1(ML-DSA-65 sign) signing and FCS_CKM.5(Hybrid) key derivation, worded to CC:2022 Part 2 with the mandatory errata v1.2, with a table of the dependencies each pulls in (FCS_CKM.2, FCS_RBG.1 or FCS_RNG.1, FCS_CKM.6) and a note on where NIAP profiles write ML-KEM encapsulation (FCS_COP.1/KeyEncap in three profiles, directly in FCS_CKM.2 in the VPN Client module). The second is orientation on AVA_VAN.5 for lattice-based code: what the CEM asks, which attack-potential table applies (CEM Table B.3, or the EUCC documents for security boxes and for smart cards, neither of which names a post-quantum algorithm), the scope check under EN 419 221-5, and three typical test targets with the published papers (the NTT and decapsulation in ML-KEM, the rejection loop in ML-DSA signing, fault injection on ML-DSA signing and verification). A visible note, "What this example does not settle", lists six open points that depend on scheme or laboratory practice, and a visible line points to the lessons PQC Network Testing & Validation and HSM & PQC Operations. The example is invented and has not been reviewed by any scheme or laboratory; the module's own reading is marked "Module analysis".

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
