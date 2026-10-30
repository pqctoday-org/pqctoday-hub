# Standards, Certification & Compliance Bodies — Module RAG Summary

## Module Overview

**Slug**: `standards-bodies`
**Difficulty**: Intermediate
**Estimated Time**: 60 minutes
**Track**: Strategy

This module teaches learners how to distinguish between standards bodies (which _define_ algorithms and protocols), certification bodies (which _validate_ implementations), and compliance frameworks / regulatory agencies (which _mandate_ usage). It covers 12 key organizations globally and regionally, and directly connects to the app's `/compliance` and `/migrate` pages.

---

## Core Concepts

### The Three Roles

| Role                                     | Function                                                                              | Example                               | Creates                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Standards Body                           | Defines algorithms, protocols, and technical requirements                             | NIST, ISO/IEC, ETSI, IETF             | FIPS 203, RFC 9629, ETSI TS 103 744                        |
| Certification Body                       | Validates that a specific product/implementation meets a standard                     | CMVP, EUCC certification bodies, CCRA | Validation certificates                                    |
| Government Agency / Compliance Framework | Sets requirements in a regulated context, which can include use of certified products | NSA (CNSA 2.0), NIS2, FIPS 140-3      | Mandates and procurement rules, binding within their scope |

**Key distinction**: NIST wrote FIPS 203 (standards body), but the CAVP validates your ML-KEM implementation and the CMVP validates your HSM module (certification bodies), and CNSA 2.0 requires National Security Systems to use NIAP-validated products with CMVP-validated modules (regulatory mandate).

---

## Organizations Covered

### Standards Bodies

**NIST** — US federal agency. Led the PQC competition (call for proposals December 2016; first algorithms selected July 2022 from 7 finalists and 8 alternates). Published FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) in August 2024. Governmental, regional (US), globally influential.

**ISO/IEC JTC 1/SC 27** — International standards body. National member bodies (56 participating and 38 observing in SC 27: ISO committee page, participation view, read 25 October 2026) ballot cryptographic standards. 5-stage process (WD → IS). Published ISO/IEC 14888-4:2024 (XMSS/LMS). Non-governmental, global.

**ETSI** — European SDO. TC CYBER produces normative Technical Specifications (TS, contains "shall") and Technical Reports (TR, guidance). Key PQC outputs: ETSI TS 103 744 (quantum-safe hybrid key establishment: it combines a traditional exchange such as ECDH with ML-KEM, and covers key establishment only), TR 103 619 (migration guide). Non-governmental, regional (EU).

**IETF** — Open, no-membership-fee Internet standards body. Rough consensus + running code. PQC WGs: PQUIP (coordination), LAMPS (CMS/PKIX), TLS, COSE, SSH. Publishes RFCs. Non-governmental, global.

**KpqC research group** (Korea) — Research group set up in 2021 by the National Security Research Institute (NSR) and the National Intelligence Service (NIS), with experts from industry, academia, government and research institutes; KISA sits on its advisory committees. Ran the KpqC national PQC competition (first round from November 2022; final algorithms announced 16 January 2025): HAETAE and AIMer (signatures), SMAUG-T and NTRU+ (KEMs). The July 2023 master plan of NIS and the Ministry of Science and ICT sets 2035 as the target for spreading post-quantum cryptography through Korea's cryptographic systems. As of April 2026 the group reports that Korean Standard proposals for the two KEMs have been submitted and the two signature algorithms are under review; no standardization date is published. Governmental, regional (Asia-Pacific).

### Regulatory Agencies

**BSI** (Germany) — Governmental regulatory agency. TR-02102 series: Technical Guidelines that recommend cryptographic mechanisms and key lengths, including PQC. BSI describes them as recommendations; binding specifications exist only for certain applications, in other BSI documents. Reviewed annually. TR-02102-1 (cryptographic mechanisms), -2 (TLS), -3 (IPsec), -4 (SSH).

**ANSSI** (France) — Governmental regulatory agency. Recommends hybrid PQC (classical + PQC), and makes it mandatory inside the French regulated perimeter (classified and Diffusion Restreinte data, vital information systems, certified or qualified products). Hash-based signatures (SLH-DSA, XMSS, LMS) are the exception: ANSSI does not recommend systematic hybridisation for them (ANSSI PQC FAQ 2025; position paper 2022: a well-studied underlying problem, but a limited range of application). Three-phase roadmap (2022 position paper): Phase 1 (the situation in 2022) hybridation to add post-quantum defence-in-depth to pre-quantum assurance; Phase 2 (not earlier than 2025) hybridation to provide post-quantum security assurance; Phase 3 (probably not earlier than 2030) optional standalone post-quantum cryptography.

**NSA** (US) — Governmental regulatory agency. CNSA 2.0 (September 2022) mandates ML-KEM-1024 and ML-DSA-87 for National Security Systems (NSS). Binding for US government and DoD contractors.

**NCSC** (UK) — Governmental regulatory agency (part of GCHQ). Three-phase roadmap: Discovery (2025–2028), Priority Migration (2028–2031), Full Migration (2031–2035). Aligned with NIST FIPS 203/204/205.

**ENISA** (EU) — EU Agency for Cybersecurity, a governmental agency under the Cybersecurity Act; it is not a certification body. Supports the EU cybersecurity certification framework, including EUCC (the European Common Criteria-based cybersecurity certification scheme, set up by Commission Implementing Regulation (EU) 2024/482), and publishes the EUCC certificates, certification reports and supporting documents (Art. 42). EUCC certificates are issued by certification bodies (Art. 4), not by ENISA; national cybersecurity certification authorities supervise. The Agreed Cryptographic Mechanisms (ACM) are agreed by the ECCG Sub-group on Cryptography (ENISA supports the ECCG); ACM v2 is a cryptography guideline for developers and evaluators, not a legal list of approved algorithms. It lists ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS and FrodoKEM, and says lattice-based schemes should be combined with a classical mechanism. Together with the Commission, ENISA links the EU coordinated PQC migration roadmap (drawn up in the NIS Cooperation Group) to the ECCG work on recommendations for PQC mechanisms and their evaluation.

### Certification Bodies

**CMVP** — Joint NIST/CSE (Canada) program. Validates cryptographic module implementations against FIPS 140-3. Required for US federal procurement under FISMA. Validation time varies by module and queue (the public Modules in Process list shows each submission's status; a queue position is not evidence of the outcome). The CAVP validates the individual algorithm implementations (FIPS 203/204/205); that testing runs through NIST's ACVTS over the ACVP protocol. An algorithm certificate is not a module certificate.

**Common Criteria / CCRA** — Mutual recognition arrangement for IT security evaluations (ISO/IEC 15408). 36 countries take part: 18 authorise (issue) certificates and 18 only recognise them (CC portal members list). Recognition covers only certificates that claim a collaborative Protection Profile or assurance up to EAL2 with ALC_FLR (CCRA Art. 2). A Management Committee administers the arrangement (Art. 10); international Technical Communities write the collaborative Protection Profiles. Products evaluated by accredited labs; certificates issued by national Certification Bodies (BSI, ANSSI, NIAP; the UK is a recognising member only). EUCC is a separate EU scheme that applies Common Criteria under Regulation (EU) 2024/482.

---

## Standards → Certification → Compliance Chains

**US NSS Chain**: FIPS 203 (NIST) → CMVP validation (NIST/CSE) → CNSA 2.0 mandate (NSA)

**EU Digital Services Chain**: ETSI TS 103 744 hybrid key establishment (ETSI TC CYBER) → EUCC certification (certification bodies issue; national cybersecurity certification authorities supervise; ENISA publishes) → eIDAS 2.0 (Regulation 910/2014 as amended by 2024/1183: QSCD certification under Art. 30, EUDI Wallets under Art. 5a; EUCC is one possible route, not required in every case; ECCG ACM v2 is guidance, not mandated by eIDAS)

**EU Government IT Procurement Chain**: ISO/IEC 14888-4:2024 (ISO/IEC JTC 1/SC 27) → CC evaluation (CCRA/BSI/ANSSI) → NIS2 (Directive (EU) 2022/2555: Member States may require certified ICT products under Art. 24; it does not itself require them)

**US Cloud Services Chain**: NIST IR 8547 (NIST) → CAVP algorithm validation (tested via ACVP) → FedRAMP PQC requirement (GSA/CISA)

**EU legal instruments**: the European Parliament and the Council legislate (NIS2 Directive, eIDAS 2.0, DORA, Cyber Resilience Act); the Commission proposes the acts and adopts implementing acts such as EUCC (Regulation (EU) 2024/482). NIS2 is a Directive that Member States transpose into national law; its Art. 24 lets Member States require essential and important entities to use ICT products certified under a European cybersecurity certification scheme. Certification under the Cybersecurity Act is voluntary unless Union or Member State law says otherwise (Art. 56(2)), and a European cybersecurity certificate is recognised in all Member States (Art. 56(10)).

---

## Regional Coverage Map

| Region       | Standards                 | Certification             | Compliance                           | Regulatory                   |
| ------------ | ------------------------- | ------------------------- | ------------------------------------ | ---------------------------- |
| Global       | ISO/IEC JTC 1/SC 27, IETF | CCRA (36 countries)       | No global binding framework          | ITU-T (recommendations only) |
| US           | NIST                      | CMVP, CAVP, NIAP          | FIPS 140-3, CNSA 2.0, FedRAMP, CMMC  | NSA, CISA                    |
| EU           | ETSI TC CYBER             | EUCC certification bodies | NIS2, eIDAS 2.0, DORA, CRA           | Commission, ENISA            |
| UK           | BSI (British Standards)   | NCSC (CAPS)               | UK PQC Roadmap (3 phases)            | NCSC, DSIT                   |
| Asia-Pacific | KpqC group, AIST, CAS     | OSCCA/NGCC, NISC          | K-PQC master plan (2035), SM mandate | NIS/MSIT, OSCCA, NISC, MAS   |

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
3. **ANSSI's position**: recommends hybrid PQC (classical + PQC) and makes it mandatory in the French regulated perimeter; hash-based signatures (SLH-DSA, XMSS, LMS) are the exception to systematic hybridisation.
4. **CCRA vs EUCC**: the CCRA is the global arrangement (36 countries; recognition limited to collaborative Protection Profiles or up to EAL2 + ALC_FLR); EUCC is a separate EU scheme set up by Commission Implementing Regulation (EU) 2024/482 that applies Common Criteria under EU rules. Certification bodies issue EUCC certificates, national cybersecurity certification authorities supervise, and ENISA publishes.
5. **IETF vs NIST**: NIST defines algorithms; IETF integrates them into Internet protocols (TLS, CMS, SSH).
6. **ISO/IEC vs ETSI**: ISO/IEC SC 27 is global (56 participating and 38 observing national bodies on the ISO committee page, read 25 October 2026; 5-stage IS process); ETSI is European (over 950 members across more than 60 countries on etsi.org/about, read 26 October 2026; TC-based TS/TR process).
7. **BSI vs ANSSI**: Both are governmental regulatory agencies for their respective countries; BSI = Germany, ANSSI = France.
8. **KpqC (NSR/NIS research group) vs NIST**: Parallel national competition; Korean algorithms (HAETAE, AIMer, SMAUG-T, NTRU+) are NOT the same as FIPS 203/204/205.
