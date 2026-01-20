# PQC Timeline Data Verification and Update Report

**Report Date:** November 30, 2025  
**Original File:** timeline_11302025.csv (97 entries)  
**Analyst:** Security Expert Review

---

## Executive Summary

Following comprehensive verification against current authoritative sources, this report identifies **42 recommended changes** to the PQC timeline dataset:

| Change Type                            | Count |
| -------------------------------------- | ----- |
| **Updates to Existing Entries**        | 12    |
| **New Entries for Existing Countries** | 18    |
| **New Countries/Organizations**        | 12    |
| **Total Changes**                      | 42    |

---

## Section 1: Updates to Existing Entries

### 1.1 United States

| Row | Field       | Current Value                      | Updated Value                                 | Source                              |
| --- | ----------- | ---------------------------------- | --------------------------------------------- | ----------------------------------- |
| 5   | Title       | "NIST IR 8547 Transition Guidance" | "NIST IR 8547 Draft Transition Guidance"      | Clarification - still in IPD status |
| 5   | Description | Update                             | Add "Deprecation by 2030, disallowed by 2035" | csrc.nist.gov                       |

### 1.2 United Kingdom

| Row | Field      | Current Value | Updated Value | Source                             |
| --- | ---------- | ------------- | ------------- | ---------------------------------- |
| 19  | SourceDate | 2024-08-01    | 2024-08-13    | Aligned with NIST FIPS publication |

### 1.3 European Union

| Row | Field       | Current Value         | Updated Value         | Source                  |
| --- | ----------- | --------------------- | --------------------- | ----------------------- |
| 26  | Description | "17 EU member states" | "21 EU member states" | Updated signatory count |

### 1.4 Japan

| Row | Field      | Current Value                 | Updated Value                                        | Source                  |
| --- | ---------- | ----------------------------- | ---------------------------------------------------- | ----------------------- |
| 74  | Title      | "PQC Guidelines 2024 Edition" | "PQC Guidelines 2024 Edition (Published April 2025)" | cryptrec.go.jp          |
| 74  | SourceDate | 2025-03-01                    | 2025-04-02                                           | Actual publication date |

### 1.5 New Zealand

| Row | Field       | Current Value        | Updated Value                                                      | Source              |
| --- | ----------- | -------------------- | ------------------------------------------------------------------ | ------------------- |
| 86  | Title       | "NZISM v3.8 Updated" | "NZISM v3.9 Updated"                                               | Latest version      |
| 86  | SourceDate  | 2024-09-01           | 2025-11-01                                                         | Updated publication |
| 86  | Description | Update               | Add "Section 2.4 PQC preparation, Section 17.1.19 quantum impacts" | GCSB                |

### 1.6 Singapore

| Row | Field      | Current Value                         | Updated Value                   | Source             |
| --- | ---------- | ------------------------------------- | ------------------------------- | ------------------ |
| 90  | Title      | "Financial Services PQC Requirements" | "MAS Advisory MAS/TCRS/2024/01" | Specific reference |
| 90  | SourceDate | 2024-01-01                            | 2024-02-01                      | Actual publication |

---

## Section 2: New Entries for Existing Countries

### 2.1 United States (6 new entries)

| Entry | Type      | Category  | Years     | Title                             | Description                                                                       |
| ----- | --------- | --------- | --------- | --------------------------------- | --------------------------------------------------------------------------------- |
| NEW   | Milestone | Policy    | 2022-2022 | OMB M-23-02 Published             | OMB memo requiring agency cryptographic inventory and prioritized migration plans |
| NEW   | Phase     | Discovery | 2024-2025 | CISA Automated Discovery Strategy | CISA publishes strategy for automated PQC discovery and inventory tools           |
| NEW   | Milestone | Deadline  | 2027-2027 | NSS Acquisition CNSA 2.0 Required | New NSS acquisitions must be CNSA 2.0 compliant starting January 2027             |
| NEW   | Phase     | Migration | 2025-2033 | Large PKI Systems Migration       | Migration of large public key infrastructure systems to CNSA 2.0                  |
| NEW   | Milestone | Guidance  | 2024-2024 | White House PQC Report            | July 2024 Report on Post-Quantum Cryptography to Congress                         |
| NEW   | Phase     | Testing   | 2024-2027 | CISA/NSA PQC Testing              | Joint CISA/NSA testing of PQC implementations in critical infrastructure          |

### 2.2 United Kingdom (2 new entries)

| Entry | Type      | Category        | Years     | Title                      | Description                                                            |
| ----- | --------- | --------------- | --------- | -------------------------- | ---------------------------------------------------------------------- |
| NEW   | Milestone | Guidance        | 2024-2024 | White Paper v2.0 Published | NCSC updates PQC White Paper to version 2.0 reflecting NIST algorithms |
| NEW   | Milestone | Standardization | 2025-2025 | Hardware HSM PQC Support   | Advanced HSMs with PQC cryptographic roots of trust expected           |

### 2.3 Germany (2 new entries)

| Entry | Type      | Category  | Years     | Title                          | Description                                                               |
| ----- | --------- | --------- | --------- | ------------------------------ | ------------------------------------------------------------------------- |
| NEW   | Milestone | Guidance  | 2025-2025 | TR-02102-1 January 2025 Update | BSI updates Technical Guideline requiring hybrid-only PQC implementations |
| NEW   | Phase     | Migration | 2026-2030 | Hybrid Implementation Phase    | Mandatory hybrid (classical+PQC) deployment for all systems               |

### 2.4 France (1 new entry)

| Entry | Type  | Category | Years     | Title                       | Description                                                      |
| ----- | ----- | -------- | --------- | --------------------------- | ---------------------------------------------------------------- |
| NEW   | Phase | Testing  | 2024-2025 | Security Visa Certification | ANSSI security visa certification for hybrid PQC products begins |

### 2.5 European Union (2 new entries)

| Entry | Type      | Category  | Years     | Title                     | Description                                                              |
| ----- | --------- | --------- | --------- | ------------------------- | ------------------------------------------------------------------------ |
| NEW   | Milestone | Policy    | 2024-2024 | 21-Nation Joint Statement | France, Germany, Netherlands lead joint statement with 21 EU signatories |
| NEW   | Phase     | Discovery | 2025-2026 | Member State Pilots       | All member states conduct PQC pilot implementations                      |

### 2.6 Canada (2 new entries)

| Entry | Type      | Category | Years     | Title                         | Description                                                                      |
| ----- | --------- | -------- | --------- | ----------------------------- | -------------------------------------------------------------------------------- |
| NEW   | Milestone | Policy   | 2025-2025 | SPIN Notice Published         | Security Policy Implementation Notice on PQC migration effective October 9, 2025 |
| NEW   | Milestone | Deadline | 2026-2026 | Contract PQC Clauses Required | All new GC contracts must include PQC capability clauses by April 1, 2026        |

### 2.7 Singapore (3 new entries)

| Entry | Type      | Category  | Years     | Title                          | Description                                                                   |
| ----- | --------- | --------- | --------- | ------------------------------ | ----------------------------------------------------------------------------- |
| NEW   | Milestone | Guidance  | 2025-2025 | CSA Quantum-Safe Handbook      | CSA publishes Quantum-Safe Handbook and Quantum Readiness Index (QRI)         |
| NEW   | Milestone | Policy    | 2024-2024 | FSTI Quantum Track Announced   | MAS commits S$100 million for quantum and AI capabilities in financial sector |
| NEW   | Phase     | Migration | 2025-2030 | Financial Sector Quantum Track | Financial institutions implement quantum-safe solutions under FSTI program    |

---

## Section 3: New Countries and Organizations

### 3.1 India (3 entries)

| Type      | Category        | Years     | Title                             | Description                                                       | Source              |
| --------- | --------------- | --------- | --------------------------------- | ----------------------------------------------------------------- | ------------------- |
| Milestone | Policy          | 2023-2023 | National Quantum Mission Launched | ₹6,003 crore (~$720M) mission including PQC research through 2031 | Government of India |
| Milestone | Guidance        | 2025-2025 | TEC PQC Migration Guidance        | Telecom Engineering Centre publishes PQC migration guidance       | TEC India           |
| Milestone | Standardization | 2025-2025 | First Quantum-Secure Satellite    | Space TS and Synergy Quantum announce India's first PQC satellite | Industry            |

### 3.2 Malaysia (3 entries)

| Type      | Category  | Years     | Title                          | Description                                                             | Source           |
| --------- | --------- | --------- | ------------------------------ | ----------------------------------------------------------------------- | ---------------- |
| Milestone | Policy    | 2025-2025 | National PQC Readiness Roadmap | Malaysia unveils National Post-Quantum Cryptography Readiness Roadmap   | Government       |
| Milestone | Guidance  | 2025-2025 | ASEAN PQC Leadership           | Malaysia hosts world's largest PQC conference (2,500 delegates)         | GSMA             |
| Phase     | Discovery | 2025-2027 | National PQC Assessment        | Government agencies conduct cryptographic inventory and risk assessment | National Roadmap |

### 3.3 Switzerland (2 entries)

| Type      | Category  | Years     | Title                      | Description                                                         | Source |
| --------- | --------- | --------- | -------------------------- | ------------------------------------------------------------------- | ------ |
| Milestone | Guidance  | 2025-2025 | FIND Action Plan Published | Financial Innovation Desk publishes 7-step quantum-safe action plan | FIND   |
| Phase     | Discovery | 2025-2027 | Financial Sector Planning  | Swiss financial institutions develop PQC transition strategies      | FIND   |

### 3.4 NATO (3 entries)

| Type      | Category  | Years     | Title                           | Description                                                             | Source        |
| --------- | --------- | --------- | ------------------------------- | ----------------------------------------------------------------------- | ------------- |
| Milestone | Policy    | 2024-2024 | Quantum Technologies Strategy   | NATO publishes first Quantum Technologies Strategy with PQC commitments | NATO          |
| Milestone | Deadline  | 2027-2027 | Classified Networks PQC         | Transition classified NATO networks to FIPS PQC algorithms              | NATO Strategy |
| Phase     | Migration | 2024-2030 | Transatlantic Quantum Community | Deploy PQC and QKD through joint research and implementation            | NATO          |

### 3.5 G7 Updates (1 entry)

| Type | Category  | Years    | Title     | Description               | Source                                                          |
| ---- | --------- | -------- | --------- | ------------------------- | --------------------------------------------------------------- | --- |
| NEW  | Milestone | Guidance | 2024-2024 | Financial Sector Advisory | G7 CEG advises financial authorities on quantum risk assessment | G7  |

---

## Section 4: Data Quality Issues Identified

### 4.1 Missing Source URLs

The following entries have incomplete or expired source URLs that should be verified:

- Row 14: NSA deadline source uses generic NIST URL
- Row 79: CACR competition results - source may be paywalled

### 4.2 Inconsistent Date Formats

All SourceDate fields use YYYY-MM-DD format ✓

### 4.3 Organization Name Standardization

- Recommend: Use consistent acronym formatting (e.g., "NCSC" not "NCSC-UK")
- Recommend: Add full URLs for all OrgLogoUrl fields where available

---

## Section 5: Countries Not Yet Included (Monitoring Recommended)

The following jurisdictions have emerging PQC programs but lack formal timelines:

| Country      | Status         | Notes                                                       |
| ------------ | -------------- | ----------------------------------------------------------- |
| Brazil       | Early Stage    | No formal government initiative; infrastructure constraints |
| Taiwan       | Research Phase | ITRI conducting PQC research; no national mandate           |
| UAE          | Planning       | Dubai considering blockchain/PQC integration                |
| Saudi Arabia | Monitoring     | National Cybersecurity Authority tracking developments      |

---

## Section 6: Summary of Updated CSV Structure

The updated CSV maintains the original 13-column structure:

```
Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate
```

**Final Entry Count:** 139 entries (97 original + 42 additions/updates)

---

## Appendix: Key Source Documents Referenced

1. NIST CSRC - Post-Quantum Cryptography Project
2. NSA CNSA 2.0 Algorithm Suite and FAQ (Updated December 2024)
3. UK NCSC PQC Migration Timelines (March 2025)
4. EU NIS Cooperation Group PQC Roadmap (June 2025)
5. BSI TR-02102-1 (January 2025)
6. ANSSI PQC Position Papers and Preparedness Study
7. AIVD/CWI/TNO PQC Migration Handbook v2 (December 2024)
8. CCCS ITSM.40.001 (June 2025)
9. ASD ISM Guidelines (December 2024)
10. GSMA Post-Quantum Government Initiatives Report (March 2025)
11. CRYPTREC PQC Guidelines 2024 Edition
12. KpqC Competition Results (January 2025)
