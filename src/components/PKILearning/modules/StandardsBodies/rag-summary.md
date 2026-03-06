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

| Role                                     | Function                                                          | Example                          | Creates                             |
| ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------- | ----------------------------------- |
| Standards Body                           | Defines algorithms, protocols, and technical requirements         | NIST, ISO/IEC, ETSI, IETF        | FIPS 203, RFC 9629, ETSI TS 103 744 |
| Certification Body                       | Validates that a specific product/implementation meets a standard | CMVP, ENISA (EUCC), CCRA         | Validation certificates             |
| Regulatory Agency / Compliance Framework | Mandates use of certified products in a regulated context         | NSA (CNSA 2.0), NIS2, FIPS 140-3 | Binding mandates, procurement rules |

**Key distinction**: NIST wrote FIPS 203 (standards body), but the CMVP certifies that your HSM implements it correctly (certification body), and CNSA 2.0 mandates you use a CMVP-validated HSM (regulatory mandate).

---

## Organizations Covered

### Standards Bodies

**NIST** — US federal agency. Led 6-year PQC competition (2016–2024). Published FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) in August 2024. Governmental, regional (US), globally influential.

**ISO/IEC JTC 1/SC 27** — International standards body. 170+ national member bodies vote on cryptographic standards. 5-stage process (WD → IS). Published ISO/IEC 14888-4:2024 (XMSS/LMS). Non-governmental, global.

**ETSI** — European SDO. TC CYBER produces normative Technical Specifications (TS, contains "shall") and Technical Reports (TR, guidance). Key PQC outputs: ETSI TS 103 744 (quantum-safe requirements), TR 103 619 (migration guide). Non-governmental, regional (EU).

**IETF** — Open, no-membership-fee Internet standards body. Rough consensus + running code. PQC WGs: PQUIP (coordination), LAMPS (CMS/PKIX), TLS, COSE, SSH. Publishes RFCs. Non-governmental, global.

### Regulatory Agencies

**BSI** (Germany) — Governmental regulatory agency. TR-02102 series: binding Technical Guidelines for German government and critical infrastructure. Annual updates. TR-02102-1 (cryptographic mechanisms), -2 (TLS), -3 (IPsec), -4 (SSH).

**ANSSI** (France) — Governmental regulatory agency. Requires hybrid PQC (classical + PQC) for sensitive French systems. Unique position: permits standalone SLH-DSA (hash-only security assumption). Three-phase roadmap: Phase 1 classical preferred (2022–2025), Phase 2 hybrid preferred (2025–2030), Phase 3 PQC preferred (2030+).

**NSA** (US) — Governmental regulatory agency. CNSA 2.0 (September 2022) mandates ML-KEM-1024 and ML-DSA-87 for National Security Systems (NSS). Binding for US government and DoD contractors.

**NCSC** (UK) — Governmental regulatory agency (part of GCHQ). Three-phase roadmap: Discovery (2025–2028), Priority Migration (2028–2031), Full Migration (2031–2035). Aligned with NIST FIPS 203/204/205.

**KISA** (Korea) — Governmental regulatory agency. Ran KpqC national PQC competition (2022–2025). Selected HAETAE and AIMer (signatures), SMAUG-T and NTRU+ (KEMs). Target standardization by 2029, migration by 2035.

### Certification Bodies

**CMVP** — Joint NIST/CSE (Canada) program. Validates cryptographic module implementations against FIPS 140-3. Required for US federal procurement under FISMA. Validation takes 18–36 months. ACVP handles individual algorithm testing (FIPS 203/204/205 test vectors).

**ENISA** — EU Agency for Cybersecurity. Manages EUCC (EU Cybersecurity Certification Scheme — the EU adaptation of Common Criteria). Issues certificates valid across all EU member states. Maintains the Agreed Cryptographic Mechanisms (ACM) list specifying approved PQC algorithms.

**Common Criteria / CCRA** — 31-nation mutual recognition arrangement for IT security evaluations (ISO/IEC 15408). Products evaluated by accredited labs; certificates issued by national Certification Bodies (BSI, ANSSI, NCSC, NIAP). EUCC is the EU-specific adaptation.

---

## Standards → Certification → Compliance Chains

**US NSS Chain**: FIPS 203 (NIST) → CMVP validation (NIST/CSE) → CNSA 2.0 mandate (NSA)

**EU Digital Services Chain**: ETSI TS 103 744 (ETSI) → EUCC evaluation (ENISA) → eIDAS 2.0 mandate (European Commission)

**EU Government IT Procurement Chain**: ISO/IEC 14888-4:2024 (ISO/IEC JTC 1/SC 27) → CC evaluation (CCRA/BSI/ANSSI) → NIS2 compliance (European Commission)

**US Cloud Services Chain**: NIST IR 8547 (NIST) → ACVP algorithm validation (NIST CAVP) → FedRAMP PQC requirement (GSA/CISA)

---

## Regional Coverage Map

| Region       | Standards                 | Certification              | Compliance                          | Regulatory                   |
| ------------ | ------------------------- | -------------------------- | ----------------------------------- | ---------------------------- |
| Global       | ISO/IEC JTC 1/SC 27, IETF | CCRA (31 nations)          | No global binding framework         | ITU-T (recommendations only) |
| US           | NIST                      | CMVP, ACVP, NIAP           | FIPS 140-3, CNSA 2.0, FedRAMP, CMMC | NSA, CISA                    |
| EU           | ETSI TC CYBER             | ENISA (EUCC), national CAs | NIS2, eIDAS 2.0, DORA, CRA          | EC, ENISA                    |
| UK           | BSI (British Standards)   | NCSC (CAPS)                | UK PQC Roadmap (3 phases)           | NCSC, DSIT                   |
| Asia-Pacific | KISA/KpqC, AIST, CAS      | OSCCA/NGCC, NISC           | KpqC adoption (2029), SM mandate    | KISA, OSCCA, NISC, MAS       |

---

## Connection to App Pages

### /compliance page (48 frameworks)

Each framework's `enforcement_body` column maps to organizations in this module:

- CNSA 2.0 → NSA
- FIPS 140-3 → NIST/CMVP
- NIS2 → European Commission / ENISA
- ETSI TS 103 744 → ETSI TC CYBER
- BSI TR-02102-1 → BSI
- ANSSI PQC Papers → ANSSI
- EUCC → ENISA
- KpqC mandate → KISA

### /migrate page (FIPS badges)

- **FIPS Validated** (green) → CMVP certificate from NIST/CSE program
- **FIPS Partial** (amber) → FedRAMP/WebTrust/FIPS-mode claims without full CMVP cert
- **FIPS No** (gray) → no CMVP certification
- **CC badge** → Common Criteria CCRA certificate
- **EUCC badge** → ENISA EUCC certificate

### Procurement Pipeline

NIST FIPS 203 → ACVP test vectors → CMVP module certificate → CNSA 2.0 mandate → federal procurement. Note: CMVP backlog = 18–36 months.

---

## Key Distinctions to Memorize

1. **NIST vs CMVP**: NIST wrote the standard; CMVP certifies implementations against it.
2. **ETSI TS vs ETSI TR**: TS = normative ("shall"), TR = informational guidance.
3. **ANSSI's unique position**: Requires hybrid PQC (classical + PQC) for sensitive systems; permits standalone SLH-DSA.
4. **CCRA vs EUCC**: CCRA is the global 31-nation scheme; EUCC is the EU-specific harmonized adaptation managed by ENISA.
5. **IETF vs NIST**: NIST defines algorithms; IETF integrates them into Internet protocols (TLS, CMS, SSH).
6. **ISO/IEC vs ETSI**: ISO/IEC is global (170+ countries, 5-stage IS process); ETSI is European (800+ members, TC-based TS/TR process).
7. **BSI vs ANSSI**: Both are governmental regulatory agencies for their respective countries; BSI = Germany, ANSSI = France.
8. **KpqC (KISA) vs NIST**: Parallel national competition; Korean algorithms (HAETAE, AIMer, SMAUG-T, NTRU+) are NOT the same as FIPS 203/204/205.
