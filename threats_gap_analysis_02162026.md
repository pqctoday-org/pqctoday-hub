# Quantum Threats Data Source — Gap Analysis Report

**Date:** February 16, 2026
**File Reviewed:** `quantum_threats_hsm_industries_02132026.csv` (55 entries)
**Previous Version:** `quantum_threats_hsm_industries_01192026.csv` (149 entries)

---

## Executive Summary

The 02/13/2026 CSV represents a significant quality improvement over the 01/19 version (better sources, higher accuracy), but the aggressive reduction from 149 to 55 entries created coverage gaps. Key standards developments from 2025 are missing (FIPS 206, HQC, EU PQC roadmap, NIST SP 800-227), threat IDs are inconsistent, and several industries with critical infrastructure exposure are absent.

An updated CSV (`quantum_threats_hsm_industries_02162026.csv`) has been produced with 79 entries across 20 industries, restoring high-value entries, adding new developments, normalizing IDs, and introducing two new infrastructure sectors.

---

## Source Quality Methodology

Every entry in the updated CSV adheres to this sourcing standard:

| Accuracy Range | Criteria                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| 90-95%         | Fact directly stated in government or standards body publication (NIST, NSA, CISA, EU, FDA, etc.) |
| 80-89%         | Authoritative source; quantum-specific implications follow established threat models              |
| 70-79%         | Credible source (standards body, major industry consortium); some analyst inference required      |
| 60-69%         | Reputable vendor/research report; significant analyst interpretation                              |

**Excluded from updated CSV:**

- Entries sourced primarily from vendor marketing or blog posts
- Entries with accuracy below 70% that could not be strengthened with better sources
- Speculative claims without verifiable basis

---

## Key Findings

### 1. Data Reduction Created Coverage Gaps

The 02/13 CSV cut 94 entries. While many low-quality entries (accuracy 5-30%) were rightly removed, valuable entries backed by authoritative sources were also lost:

| Removed Entry                  | Source Quality                  | Recommendation                                         |
| ------------------------------ | ------------------------------- | ------------------------------------------------------ |
| CROSS-002 (CRQC timeline)      | IBM — moderate                  | Restore with Global Risk Institute sourcing            |
| GOV-002–010 (8 entries)        | NSA CNSA 2.0, NIST, CISA — high | Restore GOV-004 (Federal PKI) and GOV-005 (Nuclear C2) |
| HLTH-002/013 (medical devices) | FDA — high                      | Restore as merged entry                                |
| HLTH-003 (drug supply chain)   | FDA DSCSA — high                | Restore                                                |
| FIN-004 (HSM backup keys)      | NIST SP 800-227 — high          | Restore with updated source                            |
| FIN (FS-ISAC warning)          | FS-ISAC — high                  | Restore                                                |
| TELCO (SIM/eSIM, 6G)           | GSMA, 3GPP — high               | Restore 2 entries                                      |
| IT-001 (code signing)          | SLSA/OpenSSF — moderate         | Restore                                                |
| IT-003 (SaaS/SSO)              | FIDO Alliance — high            | Restore                                                |
| LEG-004 (court evidence)       | NIST SP 800-86 — moderate       | Restore                                                |
| IOT (smart city)               | ISO/IEC JTC 1 — moderate        | Restore                                                |
| AUTO-004 (in-vehicle)          | ISO/SAE 21434 — high            | Restore                                                |
| CLOUD (HSM/KMS)                | NIST SP 800-210 — high          | Restore                                                |
| ENERGY-004 (pipeline)          | IEC 62443 — high                | Restore                                                |
| CRYPTO-004 (custody)           | NIST PQC/CCSS — moderate        | Restore                                                |

### 2. Threat ID Inconsistencies

| Issue                    | Detail                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Mixed naming conventions | `THREAT-FIN-126` vs `FIN-013` in same dataset                                           |
| Non-sequential IDs       | CLOUD starts at 005, GOV jumps 001→011, HLTH jumps 001→012→014                          |
| Missing ranges           | GOV-002 through GOV-010 absent, suggesting data from a larger dataset was cherry-picked |

**Resolution:** All IDs normalized to sequential `PREFIX-001, PREFIX-002, ...` per industry in the updated CSV.

### 3. Missing Standards & Developments

| Missing Topic                  | Significance                                                                                       | Source Authority                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **FIPS 206 (FN-DSA/Falcon)**   | 4th NIST PQC standard, draft submitted Aug 2025. Critical for constrained devices and certificates | NIST CSRC                                  |
| **HQC selection**              | 5th PQC algorithm selected Mar 2025. Only backup KEM not based on lattices                         | NIST announcement                          |
| **EU Coordinated PQC Roadmap** | EU-wide milestones: Dec 2026, Dec 2030, Dec 2035. Affects all EU operations                        | European Commission                        |
| **NIST SP 800-227**            | Final KEM guidance published Sep 2025. Companion to FIPS 203                                       | NIST                                       |
| **CRQC timeline estimates**    | Removed CROSS-002 from 01/19. No current entry addresses when CRQCs may arrive                     | Global Risk Institute                      |
| **Real-world PQC deployments** | Apple PQ3, Signal PQXDH/SPQR — billions of messages protected. No mention as mitigation evidence   | Apple Security Research, Signal Foundation |
| **GSMA PQ.03 guidance**        | Jul 2025 telecom PQC migration document. Not referenced in TELCO entries                           | GSMA                                       |
| **EO 14306 context**           | June 2025 Executive Order underpinning CISA federal buying mandate. Missing from GOV entries       | White House/CISA                           |

### 4. Missing Industries

| Industry                   | Regulatory Basis                                   | Added to CSV?                            |
| -------------------------- | -------------------------------------------------- | ---------------------------------------- |
| **Water / Wastewater**     | EPA AWIA 2018, CISA critical infrastructure sector | Yes — 2 entries                          |
| **Rail / Transit**         | EN 50159, ERA ERTMS/ETCS, TSA Security Directives  | Yes — 2 entries                          |
| Education / Academia       | FERPA — no quantum-specific guidance exists        | No — insufficient authoritative sourcing |
| Real Estate / Property     | Overlaps with Legal/eSignature entries             | No — would duplicate LEG entries         |
| Agriculture / AgTech       | No quantum-specific standards identified           | No                                       |
| Mining / Natural Resources | No quantum-specific standards identified           | No                                       |

### 5. Specific Factual Items to Note

- **NIST IR 8547** is correctly labeled "Initial Public Draft" — final version has NOT been published as of Feb 2026
- **OpenSSL 3.5**: Correctly referenced. Latest patch is 3.5.4 (Sep 30, 2025)
- **Bitcoin $718B estimate**: Highly volatile, marked as "price-dependent" — acceptable
- **GSMA PQ Taskforce**: Established September 2022 (not 2025 as some entries stated)
- **EMV card count**: 14.7B at end 2024 — from EMVCo published statistics
- **CNSA 2.0 "January 2027" deadline**: Correctly stated for NSS acquisitions

---

## Changes Made in Updated CSV

### Restored from 01/19 (15 entries, all strengthened with better sources)

- AUTO-004: In-vehicle network security (ISO/SAE 21434)
- CLOUD-004: Cloud HSM and key management (NIST SP 800-210)
- CROSS-004: CRQC timeline estimates (Global Risk Institute)
- CRYPTO-004: Cryptocurrency custody HSM (CCSS/NIST PQC)
- ENERGY-004: Pipeline and oil/gas SCADA (IEC 62443)
- FIN-004: HSM backup key extraction (NIST SP 800-227)
- FIN-005: FS-ISAC crypto-procrastination (FS-ISAC White Paper)
- GOV-004: Federal PKI signature forgery (Federal PKI Policy Authority)
- GOV-005: Nuclear command and control (NSA CNSA 2.0)
- HLTH-004: Connected medical device lifecycle (FDA Section 524B)
- HLTH-005: Drug supply chain authentication (FDA DSCSA)
- IOT-004: Smart city infrastructure (ISO/IEC 30182)
- IT-004: Code signing supply chain (SLSA/OpenSSF)
- IT-005: SaaS authentication infrastructure (FIDO Alliance)
- LEG-004: Court electronic evidence (NIST SP 800-86)

### New Entries Added (9 entries)

- CROSS-005: FIPS 206 FN-DSA standardization (NIST CSRC)
- CROSS-006: HQC selected as 5th PQC algorithm (NIST)
- CROSS-007: EU coordinated PQC transition roadmap (European Commission)
- CROSS-008: NIST SP 800-227 KEM recommendations (NIST)
- TELCO-004: SIM/eSIM authentication (GSMA)
- TELCO-005: 6G native PQC design (3GPP/ETSI)
- RAIL-001: Railway signaling system vulnerability (EN 50159/ERA)
- RAIL-002: Transit ticketing and access control (ISO/IEC 14443)
- WATER-001: Water treatment plant SCADA (EPA AWIA/CISA)
- WATER-002: Smart water infrastructure (AWWA)

### Entries NOT Restored (rationale)

| Old ID                              | Reason for Exclusion                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| CROSS-002 (01/19)                   | Replaced with better-sourced CROSS-004 using Global Risk Institute data |
| FIN-005 (01/19)                     | Source was "IBM Quantum Safe Documentation", accuracy 10%               |
| FIN-009/010/012 (01/19)             | Duplicated content in FIN-001/002/003 or sourced from news articles     |
| GOV-003/006/007/008/009/010 (01/19) | Low accuracy (5-30%), sourced from vendor blogs or news                 |
| HLTH-005–011 (01/19)                | Most had accuracy 5-30%, sourced from vendor press releases             |
| TELCO-003–008 (01/19)               | Low accuracy, significant overlap with TELCO-001/002/003                |
| IOT-002,004–008 (01/19)             | Low accuracy, significant overlap with remaining IOT entries            |
| IT-002,004 (01/19)                  | Low accuracy (5%), vendor sourced                                       |
| All THREAT-\* prefixed (01/19)      | Duplicate content already covered by renumbered entries                 |
| CLOUD-002,004,006,008 (01/19)       | Accuracy 5-30%, news/vendor sourced                                     |
| MEDIA-004–008 (01/19)               | Accuracy 5-30%, vendor sourced                                          |
| INS-002–005 (01/19)                 | Accuracy 5%, vendor sourced                                             |
| SUPPLY-002,004,005 (01/19)          | Accuracy 5%, vendor sourced                                             |
| RETAIL-004,005 (01/19)              | Accuracy 5%, vendor sourced                                             |
| LEG-005–008 (01/19)                 | Accuracy 5-30%, vendor sourced                                          |

---

## ID Mapping (Old → New)

| New ID     | Old 02/13 ID   | Old 01/19 ID               |
| ---------- | -------------- | -------------------------- |
| AERO-001   | AERO-001       | AERO-001                   |
| AERO-002   | AERO-002       | AERO-006                   |
| AERO-003   | AERO-003       | AERO-002                   |
| AUTO-001   | AUTO-001       | AUTO-009 / AUTO-001        |
| AUTO-002   | AUTO-002       | AUTO-002                   |
| AUTO-003   | AUTO-003       | —                          |
| AUTO-004   | —              | AUTO-004                   |
| CLOUD-001  | CLOUD-005      | CLOUD-005                  |
| CLOUD-002  | CLOUD-006      | —                          |
| CLOUD-003  | CLOUD-007      | —                          |
| CLOUD-004  | —              | CLOUD-003                  |
| CROSS-001  | CROSS-001      | CROSS-001                  |
| CROSS-002  | CROSS-004      | —                          |
| CROSS-003  | CROSS-003      | CROSS-003                  |
| CROSS-004  | —              | CROSS-002 (rewritten)      |
| CROSS-005  | —              | — (NEW)                    |
| CROSS-006  | —              | — (NEW)                    |
| CROSS-007  | —              | — (NEW)                    |
| CROSS-008  | —              | — (NEW)                    |
| CRYPTO-001 | CRYPTO-001     | CRYPTO-001                 |
| CRYPTO-002 | CRYPTO-002     | CRYPTO-002                 |
| CRYPTO-003 | CRYPTO-003     | CRYPTO-003                 |
| CRYPTO-004 | —              | CRYPTO-004                 |
| ENERGY-001 | ENERGY-001     | ENERGY-001                 |
| ENERGY-002 | ENERGY-002     | ENERGY-006                 |
| ENERGY-003 | ENERGY-003     | ENERGY-008/009             |
| ENERGY-004 | —              | ENERGY-004                 |
| FIN-001    | FIN-013        | FIN-009/013                |
| FIN-002    | THREAT-FIN-126 | THREAT-FIN-126             |
| FIN-003    | FIN-014        | —                          |
| FIN-004    | —              | FIN-004                    |
| FIN-005    | —              | THREAT-FIN-127 (rewritten) |
| GOV-001    | GOV-001        | GOV-001                    |
| GOV-002    | GOV-011        | GOV-011                    |
| GOV-003    | GOV-012        | GOV-012                    |
| GOV-004    | —              | GOV-003                    |
| GOV-005    | —              | GOV-005                    |
| HLTH-001   | HLTH-001       | HLTH-001                   |
| HLTH-002   | HLTH-012       | HLTH-011/012               |
| HLTH-003   | HLTH-014       | —                          |
| HLTH-004   | —              | HLTH-002/013               |
| HLTH-005   | —              | HLTH-003                   |
| INS-001    | INS-001        | INS-001                    |
| INS-002    | INS-002        | —                          |
| INS-003    | INS-003        | INS-003                    |
| IOT-001    | IOT-001        | IOT-001                    |
| IOT-002    | IOT-003        | IOT-003                    |
| IOT-003    | IOT-002        | —                          |
| IOT-004    | —              | IOT-005                    |
| IT-001     | IT-006         | IT-006                     |
| IT-002     | IT-007         | IT-007                     |
| IT-003     | IT-008         | —                          |
| IT-004     | —              | IT-001                     |
| IT-005     | —              | IT-003/009                 |
| LEG-001    | LEG-001        | LEG-001                    |
| LEG-002    | LEG-002        | LEG-002                    |
| LEG-003    | LEG-003        | LEG-003                    |
| LEG-004    | —              | LEG-004                    |
| MEDIA-001  | MEDIA-001      | MEDIA-001                  |
| MEDIA-002  | MEDIA-002      | MEDIA-002                  |
| MEDIA-003  | MEDIA-003      | MEDIA-004                  |
| PCI-001    | PCI-001        | PCI-002                    |
| PCI-002    | PCI-002        | —                          |
| PCI-003    | PCI-003        | PCI-001                    |
| RAIL-001   | —              | — (NEW)                    |
| RAIL-002   | —              | — (NEW)                    |
| RETAIL-001 | RETAIL-001     | RETAIL-001                 |
| RETAIL-002 | RETAIL-002     | RETAIL-002                 |
| RETAIL-003 | RETAIL-003     | RETAIL-003                 |
| SUPPLY-001 | SUPPLY-001     | SUPPLY-003                 |
| SUPPLY-002 | SUPPLY-002     | SUPPLY-001                 |
| SUPPLY-003 | SUPPLY-003     | —                          |
| TELCO-001  | TELCO-001      | TELCO-001                  |
| TELCO-002  | TELCO-002      | TELCO-006                  |
| TELCO-003  | TELCO-003      | TELCO-005                  |
| TELCO-004  | —              | TELCO-002                  |
| TELCO-005  | —              | TELCO-007/010              |
| WATER-001  | —              | — (NEW)                    |
| WATER-002  | —              | — (NEW)                    |

---

## Recommendations for Future Updates

1. **Track NIST IR 8547 finalization** — when published as final, update CROSS-002 description
2. **Track FIPS 206 IPD release** — when the public draft is released, update CROSS-005
3. **Track HQC FIPS number assignment** — update CROSS-006 when assigned
4. **Monitor EU CRA enforcement dates** — Sep 2026 (reporting), Dec 2027 (full application)
5. **Consider adding Education sector** when FERPA quantum guidance or similar is published
6. **Update Bitcoin value estimates quarterly** — CRYPTO-001 dollar figure is highly volatile
7. **Track CMVP validations** — first FIPS 203/204/205 validated modules will be significant
8. **Monitor 3GPP Release 19** — PQC integration into 5G specifications
