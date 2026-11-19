# Standards, Certification & Compliance Bodies — Module RAG Summary

## Module Overview

**Slug**: `standards-bodies`
**Difficulty**: Intermediate
**Estimated Time**: 40 minutes
**Track**: Strategy

This module teaches learners how to distinguish between standards bodies (which _define_ algorithms and protocols), certification bodies (which _validate_ implementations), and compliance frameworks / regulatory agencies (which _mandate_ usage). It covers 12 key organizations globally and regionally, and directly connects to the app's `/compliance` and `/migrate` pages.

---

## Core Concepts

### The Three Roles

| Role                                     | Function                                                                                                              | Example                                  | Creates                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| Standards Body                           | Defines algorithms, protocols, and technical requirements                                                             | NIST, ISO/IEC, ETSI, IETF                | FIPS 203, RFC 9629, ETSI TS 103 744                                     |
| Certification Body                       | Validates that a specific product/implementation meets a standard                                                     | CMVP, EUCC certification bodies          | Validation certificates                                                 |
| Mutual Recognition Arrangement           | Recognises eligible certificates issued by member certification bodies                                                | CCRA                                     | Cross-border certificate recognition                                    |
| Government agency                        | Public-sector body that may publish guidance or support programs; not automatically a regulator or certification body | ENISA, NIST, NCSC                        | Check the body's statutory remit and the specific instrument            |
| Regulatory agency / Compliance Framework | A regulator or rule set may impose requirements within a defined scope                                                | NSA (CNSA 2.0 for NSS), NIS2, FIPS 140-3 | Binding force depends on the applicable law, policy, contract and scope |

**Key distinction**: NIST wrote FIPS 203 (standards body), but the CAVP validates your ML-KEM implementation and the CMVP validates your HSM module (certification bodies), and CNSA 2.0 requires National Security Systems to use NIAP-validated products with CMVP-validated modules (regulatory mandate).

---

## Organizations Covered

### Standards Bodies

**NIST** — US federal agency. Led the PQC competition (call for proposals December 2016; first algorithms selected July 2022 from 7 finalists and 8 alternates). Published FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) in August 2024; selected code-based HQC in Round 4 (NIST IR 8545, March 2025); advanced Additional Signatures candidates to Round 3 (NIST IR 8610, May 2026; HAWK subsequently withdrawn July 2026); and published its final transition plan NIST IR 8547 (October 2026, supporting Executive Order 14412 and OMB M-26-15). Governmental, regional (US), globally influential.

**ISO/IEC JTC 1/SC 27** — International standards body. National member bodies (56 participating and 38 observing in SC 27: ISO committee page, participation view, read 25 October 2026) ballot cryptographic standards. 5-stage process (WD → IS). Published ISO/IEC 14888-4:2024 (XMSS/LMS). Non-governmental, global.

**ETSI** — European SDO. TC CYBER produces normative Technical Specifications (TS, contains "shall") and Technical Reports (TR, guidance). Key PQC outputs: ETSI TS 103 744 (quantum-safe hybrid key establishment: it combines a traditional exchange such as ECDH with ML-KEM, and covers key establishment only), TR 103 619 (migration guide). Non-governmental, regional (EU).

**IETF** — Open, no-membership-fee Internet standards body. Rough consensus + running code. PQC WGs: PQUIP (coordination; RFC 9958), LAMPS (CMS/PKIX), TLS, COSE, SSH. Published examples cover different layers: RFC 9846 (July 2026, obsoleting RFC 8446) is the base TLS 1.3 spec; RFC 9954 (hybrid design) and RFC 10024 specify TLS 1.3 PQ/T hybrid key agreement groups; RFC 10073 specifies composite ML-DSA signatures for X.509/PKIX; RFC 10082 specifies composite ML-DSA signatures for CMS. A certificate signature format does not itself define TLS negotiation or guarantee endpoint support. Non-governmental, global.

**KpqC research group** (Korea) — Research group set up in 2021 by the National Security Research Institute (NSR) and the National Intelligence Service (NIS), with experts from industry, academia, government and research institutes; KISA sits on its advisory committees. Ran the KpqC national PQC competition (first round from November 2022; final algorithms announced 16 January 2025): HAETAE and AIMer (signatures), SMAUG-T and NTRU+ (KEMs). The July 2023 master plan of NIS and the Ministry of Science and ICT sets 2035 as the target for spreading post-quantum cryptography through Korea's cryptographic systems. As of April 2026 the group reports that Korean Standard proposals for the two KEMs have been submitted and the two signature algorithms are under review; no standardization date is published. Governmental, regional (Asia-Pacific).

### Regulatory Agencies

**BSI** (Germany) — Governmental regulatory agency. TR-02102 series: Technical Guidelines that recommend cryptographic mechanisms and key lengths, including PQC. BSI describes them as recommendations; binding specifications exist only for certain applications, in other BSI documents. Reviewed annually. TR-02102-1 (cryptographic mechanisms), -2 (TLS), -3 (IPsec), -4 (SSH).

**ANSSI** (France) — Governmental cybersecurity agency. Its 2022 position paper describes phased hybridisation guidance: PQC as optional defence-in-depth in Phase 1, hybridisation for products claiming post-quantum assurance in the proposed Phase 2, and possible standalone PQC later. The paper says hybrid deployment was not mandatory at publication; this is a roadmap, not a blanket legal mandate for a named regulated perimeter or binding migration deadline. Check the applicable law, procurement terms, evaluation conditions and current ANSSI guidance for a particular deployment. The 2025 FAQ says ANSSI does not recommend systematic hybridisation for hash-based signatures (SLH-DSA, XMSS, LMS), noting their limited application range.

**NSA** (US) — Governmental regulatory agency. CNSA 2.0 (September 2022) mandates ML-KEM-1024 and ML-DSA-87 (plus LMS/XMSS for software/firmware signing; SLH-DSA is not part of CNSA 2.0) for National Security Systems (NSS). Under CNSA 2.0 FAQ Version 2.2 (October 2026), compliant new NSS acquisitions are required from 1 January 2027, unsupported equipment/services must be phased out by 31 December 2030 absent an exception, and CNSA 2.0 algorithms are mandated by 31 December 2031 unless otherwise noted. Binding for US NSS and DoD contractors (separate from EO 14412 / OMB M-26-15, which govern federal civilian agencies).

**NCSC** (UK) — Governmental regulatory agency (part of GCHQ). Milestones: discovery, inventories and migration plans by 2028; priority upgrades by 2031; full PQC deployment by 2035.

**ENISA** (EU) — EU Agency for Cybersecurity, a governmental agency under the Cybersecurity Act; it is not an EUCC regulator or certification body. Supports the EU cybersecurity certification framework, including EUCC (the European Common Criteria-based cybersecurity certification scheme, set up by Commission Implementing Regulation (EU) 2024/482), and publishes the EUCC certificates, certification reports and supporting documents (Art. 42). EUCC certificates are issued by certification bodies (Art. 4), not by ENISA; national cybersecurity certification authorities supervise. The Agreed Cryptographic Mechanisms (ACM) are agreed by the ECCG Sub-group on Cryptography (ENISA supports the ECCG); ACM v2 is a cryptography guideline for developers and evaluators, not a legal list of approved algorithms. It lists ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS and FrodoKEM, and says lattice-based schemes should be combined with a classical mechanism. Together with the Commission, ENISA links the EU coordinated PQC migration roadmap (EU NIS Cooperation Group Coordinated Implementation Roadmap v1.1) to the ECCG work on recommendations for PQC mechanisms and their evaluation.

### Certification Bodies

**CMVP** — Joint NIST/CSE (Canada) program. Validates cryptographic module implementations against FIPS 140-3. Required for US federal procurement under FISMA. Validation time varies by module and queue (the public Modules in Process list shows each submission's status; a queue position is not evidence of the outcome). The CAVP validates the individual algorithm implementations (FIPS 203/204/205); that testing runs through NIST's ACVTS over the ACVP protocol. An algorithm certificate is not a module certificate.

**CCRA** — International mutual-recognition arrangement for qualifying Common Criteria certificates and Protection Profiles. It does not evaluate products or issue product certificates; those tasks belong to evaluation facilities and national certification bodies. EUCC is a separate EU scheme that applies Common Criteria under Regulation (EU) 2024/482.

---

## Standards → Certification → Compliance Chains

**US NSS Chain**: FIPS 203 (NIST) → CMVP validation (NIST/CSE) → CNSA 2.0 mandate (NSA)

**EU Digital Services Chain**: ETSI TS 103 744 hybrid key establishment (ETSI TC CYBER) → EUCC certification (certification bodies issue; national cybersecurity certification authorities supervise; ENISA publishes) → eIDAS 2.0

**EU Government IT Procurement Chain**: ISO/IEC 14888-4:2024 (ISO/IEC JTC 1/SC 27) → CC evaluation (CCRA/BSI/ANSSI) → NIS2 (Directive (EU) 2022/2555: Member States may require certified ICT products under Art. 24; it does not itself require them)

**US Cloud Services Chain**: NIST IR 8547 (NIST) → CAVP algorithm validation (tested via ACVP) → FedRAMP PQC migration (led by CISA and DOW, in coordination with GSA)

**EU legal instruments**: the European Parliament and the Council legislate (NIS2 Directive, eIDAS 2.0, DORA, Cyber Resilience Act); the Commission proposes the acts and adopts implementing acts such as EUCC (Regulation (EU) 2024/482). NIS2 is a Directive that Member States transpose into national law; its Art. 24 lets Member States require essential and important entities to use ICT products certified under a European cybersecurity certification scheme.

---

## Regional Coverage Map

| Region       | Standards                 | Certification                                             | Recognition | Compliance                           | Regulatory                   |
| ------------ | ------------------------- | --------------------------------------------------------- | ----------- | ------------------------------------ | ---------------------------- |
| Global       | ISO/IEC JTC 1/SC 27, IETF | —                                                         | CCRA        | No global binding framework          | ITU-T (recommendations only) |
| US           | NIST                      | CMVP, CAVP, NIAP                                          | —           | FIPS 140-3, CNSA 2.0, FedRAMP, CMMC  | NSA, CISA                    |
| EU           | ETSI TC CYBER             | EUCC certification bodies                                 | —           | NIS2, eIDAS 2.0, DORA, CRA           | Commission, ENISA            |
| UK           | BSI (British Standards)   | NCSC (CAPS, High Grade products; NCSC no longer runs CPA) | —           | UK PQC Roadmap (3 phases)            | NCSC, DSIT                   |
| Asia-Pacific | KpqC group, AIST, CAS     | OSCCA/NGCC, NISC                                          | —           | K-PQC master plan (2035), SM mandate | NIS/MSIT, OSCCA, NISC, MAS   |

---

## Connection to App Pages

### /compliance page (48 frameworks)

Each framework's `enforcement_body` column maps to organizations in this module:

- CNSA 2.0 → NSA
- FIPS 140-3 → NIST/CMVP
- NIS2 → EU Member States / ENISA
- eIDAS 2.0 → the compliance data lists the European Commission; in the Regulation, Member States designate supervisory bodies (Art. 46b) and the Commission adopts implementing acts
- ETSI TS 103 744 → ETSI TC CYBER
- BSI TR-02102-1 → BSI
- ANSSI PQC Papers → ANSSI
- EUCC → ECCG/ENISA (they maintain and publish the scheme; certification bodies issue the certificates)
- KpqC Standardization → KISA/NIS/MSIT (as listed in the compliance data)

### /migrate page (FIPS badges)

- **FIPS Validated** (green) → CMVP certificate from NIST/CSE program (FIPS 140-3 certificates are current; FIPS 140-2 certificates moved to the CMVP Historical list on 21/22 September 2026, so check the certificate status)
- **FIPS Partial** (amber) → FedRAMP/WebTrust/FIPS-mode claims without full CMVP cert
- **FIPS No** (gray) → no CMVP certification
- **CC badge** → Common Criteria CCRA certificate
- **EUCC badge** → EUCC certificate (issued by a certification body, published by ENISA)

### Procurement Pipeline

NIST FIPS 203 → CAVP algorithm validation (via ACVP) → CMVP module certificate → CNSA 2.0 mandate → federal procurement. Note: the CMVP backlog is a critical-path dependency; a module certificate states one overall security level and lists its approved algorithms — it does not assign a level to each algorithm.

---

## Key Distinctions to Memorize

1. **NIST vs CMVP**: NIST wrote the standard; CMVP certifies implementations against it.
2. **ETSI TS vs ETSI TR**: TS = normative ("shall"), TR = informational guidance.
3. **ANSSI's position**: phased guidance recommends appropriate hybrid PQC; its 2022 position paper does not establish a blanket regulated-perimeter mandate. The 2025 FAQ says hybridisation is not systematically recommended for hash-based signatures (SLH-DSA, XMSS, LMS).
4. **CCRA vs EUCC**: the CCRA is the global arrangement (36 countries; recognition limited to collaborative Protection Profiles or up to EAL2 + ALC_FLR); EUCC is a separate EU scheme set up by Commission Implementing Regulation (EU) 2024/482 that applies Common Criteria under EU rules. Certification bodies issue EUCC certificates, national cybersecurity certification authorities supervise, and ENISA publishes.
5. **IETF vs NIST**: NIST defines algorithms; IETF integrates them into Internet protocols (TLS, CMS, SSH).
6. **ISO/IEC vs ETSI**: ISO/IEC SC 27 is global (56 participating and 38 observing national bodies on the ISO committee page, read 25 October 2026; 5-stage IS process); ETSI is European (over 950 members across more than 60 countries on etsi.org/about, read 26 October 2026; TC-based TS/TR process).
7. **BSI vs ANSSI**: Both are governmental regulatory agencies for their respective countries; BSI = Germany, ANSSI = France.
8. **KpqC (NSR/NIS research group) vs NIST**: Parallel national competition; Korean algorithms (HAETAE, AIMer, SMAUG-T, NTRU+) are NOT the same as FIPS 203/204/205.
