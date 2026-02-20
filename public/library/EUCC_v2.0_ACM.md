---
reference_id: EUCC v2.0 ACM
document_type: Compliance/Guidance
document_status: Certification Framework
date_published: 2025-04-01
date_updated: 2025-04-01
region: EU
migration_urgency: High
local_file: public/library/EUCC_v2.0_ACM.pdf
preview: EUCC v2.0 ACM.png
---

# EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0

## Authors

**Organization:** ECCG/ENISA

## Scope

**Industries:** ICT Products; Services; EU Market
**Region:** EU
**Document type:** Compliance/Guidance

## How It Relates to PQC

EU product certification

**Dependencies:** FIPS 203/204/205; ISO 15408

## PQC Risk Profile

**Harvest Now, Decrypt Later:** Not directly addressed by this document.

**Identity & Authentication Integrity:** **HIGH** — A quantum-capable adversary could forge certificates or impersonate identities protected by classical public-key cryptography. Migration to PQC-safe PKI and authentication systems is essential.

**Digital Signature Integrity:** Not directly addressed by this document.

**Migration urgency:** High

## PQC Key Types & Mechanisms

| Field                  | Value                    |
| ---------------------- | ------------------------ |
| Algorithm family       | Lattice; Hash-based      |
| Security levels        | L1,L3,L5                 |
| Protocol / tool impact | EU product certification |
| Toolchain support      | EU vendors               |

## Short Description

Includes PQC algorithms in Agreed Cryptographic Mechanisms for EUCC certification.

## Long Description

EUROPEAN UNION AGENCY FOR CYBERSECURITY EUCC SCHEME GUIDELINES ON CRYPTOGRAPHY Agreed Cryptographic Mechanisms Version 2, May 2025 EUCC GUIDELINES ON CRYPTOGRAPHY: AGREED CRYPTOGRAPHIC MECHANISMS VERSION 2 | MAY 2025 DOCUMENT HISTORY Date Version Modification Author’s comments 15/05/24 0.1 Creation Version submitted to the ECCG 06/06/24 0.2 Updates based on the comments made during the ECCG subgroup on cryptography meeting of 06/06/24 Endorsed and approved for publication on 16/07/24 by the ECCG 05/05/25 v2 Addition of PQC mechanisms Endorsed and approved for publication by the ECCG subgroup on cryptography 1 EUCC GUIDELINES ON CRYPTOGRAPHY: AGREED CRYPTOGRAPHIC MECHANISMS VERSION 2 | MAY 2025 LEGAL NOTICE LEGAL NOTICE This publication is a guidelines document supporting Commission Implementing Regulation (EU) 2024/482. This document is established under the responsibility of the European Cybersecurity Certification Group (ECCG) and may be updated whenever needed to reflect the developments and best practices in the field of Agreed Cryptographic Mechanisms. This document should be read in conjunction with Regulation (EU) 2019/881, the Commission Implementing Regulation (EU) 2024/482, its annexes, and where applicable supporting documentation that is made available. This document is made publicly accessible through the EU cybersecurity certification website and is free of charge. ENISA is not responsible or liable for the use of the content of this document. Neither ENISA nor any person acting on its behalf or on behalf for the maintenance of the scheme is responsible for the use that might be made of the information contained in this publication. COPYRIGHT NOTICE European Union Agency for Cybersecurity (ENISA), 2025 This publication is licensed under CC-BY-ND 4.0 DEED. Making copies and redistributing this document is permitted. (https://creativecommons.org/licenses/by-nd/4.0/) CONTACT Feedback or questions related to this document can be sent via the European Union Cybersecurity Certification website (https://certification.enisa.europa.eu/index_en) 2 EUCC GUIDELINES ON CRYPTOGRAPHY: AGREED CRYPTOGRAPHIC MECHANISMS VERSION 2 | MAY 2025 TABLE OF CONTENTS 1. INTRODUCTION 4 1.1 OBJECTIVE 4 1.2 NORMATIVE REFERENCES 4 2. RECOMMENDATIONS ON CRYPTOGRAPHIC MECHANISMS 5 3 EUCC GUIDELINES ON CRYPTOGRAPHY: AGREED CRYPTOGRAPHIC MECHANISMS VERSION 2 | MAY 2025 1. INTRODUCTION 1.1 OBJECTIVE This document supporting the EUCC scheme (the European Cybersecurity Certification Scheme on Common Criteria) provides guidelines regarding the cryptographic mechanisms that should preferably be used in ICT products submitted to certification. This document is primarily addressed to developers and evaluators. 1.2 NORMATIVE REFERENCES Regulations Regulation (EU) 2019/881 of the European Parliament and of the Council of 17 April 2019 on ENISA (the European Union Agency for Cybersecurity) and on information and communications technology cybersecurity certification and repealing Regulation (EU) No 526/2013 (Cybersecurity Act). Implementing Regulation (EU) 2024/482 on establishing the Common Criteria-based cybersecurity certification scheme (EUCC) 1, as amended by Implementing Regulation 2024/3144. 1 Available at http://data.europa.eu/eli/reg_impl/2024/482/oj 4 EUCC GUIDELINES ON CRYPTOGRAPHY: AGREED CRYPTOGRAPHIC MECHANISMS VERSION 2 | MAY 2025 2. RECOMMENDATIONS ON CRYPTOGRAPHIC MECHANISMS When deciding which cryptographic mechanisms should cover their need for cryptographic protection, e.g.: confidentiality, integrity, data origin authentication, and authentication, in their protection profiles and ICT products submitted to EUCC certification, developers of protection profiles and developers of ICT products should consider using the agreed cryptographic mechanisms as defined in ECCG Agreed Cryptographic Mechanisms version 2, further referred to as ACM v2, available at EUCC Certification Scheme - EU Cybersecurity Certification When evaluating protection profiles and ICT products under the EUCC scheme, evaluators should verify that these protection profiles and ICT products preferably rely on agreed cryptographic mechanisms as defined in ACM v2 to provide the security services evaluated under this scheme. 5 ABOUT ENISA The European Union Agency for Cybersecurity, ENISA, is the Union’s agency dedicated to achieving a high common level of cybersecurity across

---

_EUROPEAN UNION AGENCY FOR CYBERSECURITY EUCC SCHEME GUIDELINES ON CRYPTOGRAPHY Agreed Cryptographic Mechanisms Version 2, May 2025 EUCC GUIDELINES ON CRYPTOGRAPHY: AGREED CRYPTOGRAPHIC MECHANISMS VERSION 2 | MAY 2025 DOCUMENT HISTORY Date Version Modification Author’s comments 15/05/24 0.1 Creation Version submitted to the ECCG 06/06/24 0.2 Updates based on the comments made during the ECCG subgroup on cryptography meeting of 06/06/24 Endorsed and approved for publication on 16/07/24 by the ECCG 05/05/25 v2 Addition of PQC mechanisms Endorsed and approved_
