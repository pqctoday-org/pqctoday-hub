# Scheme Registry Audit — Phase 2a

**Generated**: 2026-04-23
**Purpose**: Enumerate the PQC-relevant certification schemes that Script 2 (`enrich-cert-schemes-ollama.py`) will cover, list each scheme's authoritative reference documents, and flag which docs are already in the library CSV / cached in `public/library/` versus which need to be added before enrichment can run.

**Status legend**

- `✓` row exists in `library_04222026_r4.csv` AND file cached in `public/library/` → ready to enrich
- `⚠` file cached in `public/library/` but NO library CSV row → add library row only
- `⇣` authoritative PDF downloadable but not yet in library → add library row + run `npm run download:library`
- `⊗` paywalled / restricted / inaccessible → skip this doc in Phase 2b; flag in skipped log

---

## US — NIST

### FIPS 140-3 / CMVP

| Doc                                      | Proposed `ref_id`     | Status | Current library ref_id            | Authoritative URL                                                                                                          |
| ---------------------------------------- | --------------------- | ------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| FIPS 140-3 standard                      | `FIPS-140-3-STANDARD` | ⇣      | —                                 | https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf                                                                 |
| FIPS 140-3 IG (PQC-focused, Sep 2025)    | —                     | ✓      | `NIST-FIPS-140-3-IG-Sep-2025-PQC` | (already in library)                                                                                                       |
| FIPS 140-3 IG (earlier PQC snapshot)     | —                     | ✓      | `NIST-FIPS140-3-IG-PQC`           | (already in library)                                                                                                       |
| CMVP Management Manual                   | `CMVP-MGMT-MANUAL`    | ⇣      | —                                 | https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/CMVP%20Management%20Manual.pdf |
| ISO/IEC 19790:2025 (underlying standard) | `ISO-IEC-19790-2025`  | ⊗      | —                                 | paywalled (ISO)                                                                                                            |

### CAVP / ACVP

| Doc                                                        | Proposed `ref_id`  | Status | Current library ref_id | Authoritative URL                                                          |
| ---------------------------------------------------------- | ------------------ | ------ | ---------------------- | -------------------------------------------------------------------------- |
| NIST SP 800-140A (CAVP requirements)                       | `NIST-SP-800-140A` | ⇣      | —                      | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140A.pdf |
| NIST SP 800-140B (CMVP Security Policy Requirements)       | —                  | ✓      | `NIST-SP-800-140B`     | (already in library)                                                       |
| NIST SP 800-140C (CMVP approved security functions)        | `NIST-SP-800-140C` | ⇣      | —                      | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140C.pdf |
| NIST SP 800-140D (CMVP approved SSP establishment methods) | `NIST-SP-800-140D` | ⇣      | —                      | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140D.pdf |
| NIST SP 800-140E (approved authentication mechanisms)      | `NIST-SP-800-140E` | ⇣      | —                      | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140E.pdf |
| NIST SP 800-140F (approved non-invasive attack mitigation) | `NIST-SP-800-140F` | ⇣      | —                      | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140F.pdf |
| NIST ACVP protocol spec                                    | —                  | ✓      | `NIST-ACVP`            | (already in library)                                                       |

### ESV (Entropy Source Validation)

| Doc                                | Proposed `ref_id` | Status | Current library ref_id | Authoritative URL    |
| ---------------------------------- | ----------------- | ------ | ---------------------- | -------------------- |
| NIST SP 800-90B (entropy sources)  | —                 | ✓      | `NIST-SP-800-90B`      | (already in library) |
| NIST SP 800-90A Rev 1 (DRBG)       | —                 | ✓      | `NIST-SP-800-90A-R1`   | (already in library) |
| NIST SP 800-90C (RBG construction) | —                 | ✓      | `NIST-SP-800-90C`      | (already in library) |

### NIAP CCEVS

| Doc                             | Proposed `ref_id`   | Status | Current library ref_id | Authoritative URL                                                                                       |
| ------------------------------- | ------------------- | ------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| NIAP CCEVS Policy Letters index | `NIAP-CCEVS-POLICY` | ⇣      | —                      | https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/policy-ltr-24.cfm (landing; policy PDFs linked) |
| NIAP CCEVS Program Manual       | `NIAP-CCEVS-MANUAL` | ⇣      | —                      | https://www.niap-ccevs.org/Ref/Policies/CCEVS_Scheme_Policies_Manual.pdf                                |

---

## International — Common Criteria (CCRA)

| Doc                                                     | Proposed `ref_id` | Status | Current library ref_id | Authoritative URL                                                    |
| ------------------------------------------------------- | ----------------- | ------ | ---------------------- | -------------------------------------------------------------------- |
| CC:2022 Part 1 — Introduction and General Model (Rev 1) | `CC-2022-PART1`   | ⇣      | —                      | https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART1R1.pdf |
| CC:2022 Part 2 — Security Functional Components (Rev 1) | `CC-2022-PART2`   | ⇣      | —                      | https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART2R1.pdf |
| CC:2022 Part 3 — Security Assurance Components (Rev 1)  | `CC-2022-PART3`   | ⇣      | —                      | https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART3R1.pdf |
| CEM:2022 — Common Evaluation Methodology                | `CC-2022-CEM`     | ⇣      | —                      | https://www.commoncriteriaportal.org/files/ccfiles/CEM2022R1.pdf     |

---

## EU — EUCC / ENISA

| Doc                                        | Proposed `ref_id`     | Status | Current library ref_id | Authoritative URL                                           |
| ------------------------------------------ | --------------------- | ------ | ---------------------- | ----------------------------------------------------------- |
| EUCC Implementing Regulation (EU) 2024/482 | `EUCC-IR-2024-482`    | ⇣      | —                      | https://eur-lex.europa.eu/eli/reg_impl/2024/482/oj/eng      |
| EUCC v2.0 Agreed Cryptographic Mechanisms  | —                     | ✓      | `EUCC v2.0 ACM`        | (already in library)                                        |
| ENISA EUCC State of Play / scheme guidance | `ENISA-EUCC-GUIDANCE` | ⇣      | —                      | https://www.enisa.europa.eu/publications/eucc-state-of-play |
| ENISA PQC Guidelines                       | —                     | ✓      | `ENISA PQC Guidelines` | (already in library)                                        |

---

## FR — ANSSI

| Doc                                                  | Proposed `ref_id`   | Status | Current library ref_id                            | Authoritative URL                                                                         |
| ---------------------------------------------------- | ------------------- | ------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ANSSI RGS v2.0 Annexe B1 (cryptographic mechanisms)  | `ANSSI-RGS-B1-V2`   | ⇣      | —                                                 | https://cyber.gouv.fr/sites/default/files/2014/06/RGS_v-2-0_B1.pdf                        |
| ANSSI RGS v2.0 Annexe B2 (key management)            | `ANSSI-RGS-B2-V2`   | ⇣      | —                                                 | https://cyber.gouv.fr/sites/default/files/2014/06/RGS_v-2-0_B2.pdf                        |
| ANSSI RGS v2.0 Annexe B3 (authentication)            | `ANSSI-RGS-B3-V2`   | ⇣      | —                                                 | https://cyber.gouv.fr/sites/default/files/2014/06/RGS_v-2-0_B3.pdf                        |
| ANSSI CSPN methodology                               | `ANSSI-CSPN-METHOD` | ⇣      | —                                                 | https://cyber.gouv.fr/sites/default/files/document/anssi-cspn-methodologie-evaluation.pdf |
| ANSSI Guide — règles cryptographiques (PG-083, 2026) | —                   | ✓      | `France_ANSSI_Crypto-Mechanisms-Rules-PG083-2026` | (already in library — treat as the canonical RGS successor)                               |
| ANSSI PQC Position Paper                             | —                   | ✓      | `ANSSI_PQC_Position_Paper`                        | (already in library)                                                                      |

---

## DE — BSI

| Doc                                                      | Proposed `ref_id` | Status | Current library ref_id | Authoritative URL                                                                                                 |
| -------------------------------------------------------- | ----------------- | ------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| BSI TR-02102-1 (crypto recommendations + key lengths)    | —                 | ✓      | `BSI TR-02102-1`       | (already in library)                                                                                              |
| BSI TR-02102-2 (TLS)                                     | —                 | ✓      | `BSI TR-02102-2`       | (already in library)                                                                                              |
| BSI TR-02102-3 (IPsec)                                   | —                 | ✓      | `BSI TR-02102-3`       | (already in library)                                                                                              |
| BSI TR-02102-4 (SSH)                                     | —                 | ✓      | `BSI TR-02102-4`       | (already in library)                                                                                              |
| BSI BSZ methodology (accelerated security certification) | `BSI-BSZ-METHOD`  | ⇣      | —                      | https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Certification/Interpretations/BSZ-Certification-Procedure.pdf |

---

## JP — JCMVP / JISEC

| Doc                                     | Proposed `ref_id`   | Status | Current library ref_id | Authoritative URL                                                                        |
| --------------------------------------- | ------------------- | ------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| JCMVP Evaluation Standard (JIS X 19790) | `JCMVP-JIS-X-19790` | ⇣      | —                      | https://www.ipa.go.jp/security/jcmvp/documents/pdf/jismvp.pdf                            |
| JISEC program overview                  | `JISEC-PROGRAM`     | ⇣      | —                      | https://www.ipa.go.jp/en/security/jisec/about/index.html (landing; check for linked PDF) |

---

## KR — KCMVP

| Doc                             | Proposed `ref_id` | Status | Current library ref_id | Authoritative URL                                                                      |
| ------------------------------- | ----------------- | ------ | ---------------------- | -------------------------------------------------------------------------------------- |
| KISA KCMVP operational guidance | `KCMVP-GUIDANCE`  | ⇣      | —                      | https://seed.kisa.or.kr/kisa/kcmvp/EgovVerification.do (landing; check for linked PDF) |

---

## Summary

| Status                                   | Count             |
| ---------------------------------------- | ----------------- |
| ✓ Ready to enrich (in library + cached)  | **15**            |
| ⚠ Cached but no library row              | 0                 |
| ⇣ Needs download + library row           | **23**            |
| ⊗ Paywalled / inaccessible               | 1 (ISO/IEC 19790) |
| **Total scheme reference docs proposed** | **39**            |

**Enrichment run size estimate** (Phase 2c, full corpus): 38 docs × ~15 rows/doc ≈ **570 CSV rows**, ~25-30 min wall-clock on qwen3.5:27b at ~40 s/doc.

**Test-pair (Phase 2c initial run)**: `FIPS-140-3-STANDARD` + `CC-2022-PART1`. Both are ⇣ — they must be downloaded and added to the library CSV before Script 2 runs. The rest of the full corpus can be widened afterward.

---

## Decision points for you

1. **Include all 38 downloadable docs in Phase 2b**, or start with a narrower set (e.g. US + CC + EUCC = 16 docs)?
2. **Paywalled docs** — skip ISO/IEC 19790 entirely, or note it as a metadata-only entry (description-based enrichment)?
3. **Landing pages** (JISEC, KCMVP) — keep as best-effort enrichment targets, or drop until a direct PDF is identified?
4. **ANSSI RGS v2.0 (2014)** — the library already has the 2026 PG-083 successor. Include RGS v2.0 for historical context, or treat PG-083 as the canonical RGS representative and drop RGS?
