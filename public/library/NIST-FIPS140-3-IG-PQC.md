---
reference_id: NIST-FIPS140-3-IG-PQC
document_type: Compliance/Guidance
document_status: Published Update
date_published: 2025-09-02
date_updated: 2025-09-02
region: USA; Global
migration_urgency: High
local_file: public/library/NIST-FIPS140-3-IG-PQC.pdf
preview: NIST-FIPS140-3-IG-PQC.png
---

# FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography

## Author & Organization

**Organization:** NIST CMVP

## Scope

**Industries:** Government; Finance; Defense; HSM Vendors
**Region:** USA; Global
**Document type:** Compliance/Guidance

## How It Relates to PQC

FIPS 140-3 validation requirements

**Dependencies:** FIPS 203; FIPS 204; FIPS 205; FIPS 140-3

## Risks Addressed

**Migration urgency:** High
**Security levels:** L1,L3,L5

## PQC Key Types & Mechanisms

| Field                  | Value                               |
| ---------------------- | ----------------------------------- |
| Algorithm family       | Lattice; Hash-based                 |
| Security levels        | L1,L3,L5                            |
| Protocol / tool impact | FIPS 140-3 validation requirements  |
| Toolchain support      | HSM vendors; FIPS module developers |

## Description

Updated FIPS 140-3 Implementation Guidance adding self-test requirements for FIPS 203/204/205 PQC algorithms and new guidance for Key Encapsulation Mechanisms.

---

_Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program National Institute of Standards and Technology Canadian Centre for Cyber Security Initial Release: September 21, 2020 Last Update: September 2, 2025 Implementation Guidance for FIPS PUB 140-3 and the Cryptographic Module Validation Program National Institute of Standards and Technology Table of Contents OVERVIEW ....................................................................................................................................................... 5 SECTION 1 – GENERAL ................................................................................................................................. 6 1.A BINDING AND EMBEDDING CRYPTOGRAPHIC MODULES ............................................................................. 6 SECTION 2 – CRYPTOGRAPHIC MODULE SPECIFICATION ............................................................ 11 2.3.A BINDING OF CRYPTOGRAPHIC ALGORITHM VALIDATION CERTIFICATES ............................................... 11 2.3.B SUB-CHIP CRYPTOGRAPHIC SUBSYSTEMS ............................................................................................. 13 2.3.C PROCESSOR ALGORITHM ACCELERATORS (PAA) AND PROCESSOR ALGORITHM IMPLEMENTATION (PAI) ........................................................................................................................................................................ 16 2.3.D EXCLUDED COMPONENTS ...................................................................................................................... 20 2.4.A DEFINITION AND USE OF A NON-APPROVED SECURITY FUNCTION ........................................................ 22 2.4.B TRACKING THE COMPONENT VALIDATION LIST .................................................................................... 27 2.4.C APPROVED SECURITY SERVICE INDICATOR ........................................................................................... 33 SECTION 3 – CRYPTOGRAPHIC MODULE INTERFACES .................................................................. 38 3.4.A TRUSTED CHANNEL ............................................................................................................................... 38 SECTION 4 – ROLES, SERVICES, AND AUTHENTICATION ............................................................... 41 4.1.A AUTHORISED ROLES .............................................................................................................................. 41 4.4.A MULTI-OPERATOR AUTHENTICATION ................................................................................................... 44 4.4.B ENTITY OF REPLACING DEFAULT AUTHENTICATION DATA ................................................................... 46 SECTION 5 – SOFTWARE/FIRMWARE SECURITY ............................................................................... 47 5.A NON-RECONFIGURABLE MEMORY INTEGRITY TEST ................................................................................. 47 SECTION 6 – OPERATIONAL ENVIRONMENT ...................................................................................... 48 SECTION 7 – PHYSICAL SECURITY ......................................................................................................... 49 7.A REUSABILITY OF PHYSICAL SECURITY TEST EVIDENCE ........................................................................... 49 7.3.A TESTING TAMPER EVIDENT SEALS ........................................................................................................ 57 7.3.B HARD COATING TEST METHODS (LEVEL 3 AND 4) ................................................................................ 58 SECTION 8 – NON-INVASIVE SECURITY ................................................................................................ 60 SECTION 9 – SENSITIVE SECURITY PARAMETER MANAGEMENT ............................................... 61 9.3.A ENTROPY CAVEATS ............................................................................................................................... 61 9.5.A SSP ESTABLISHMENT AND SSP ENTRY AND OUTPUT ............................................................................ 67 9.6.A ACCEPTABLE ALGORITHMS FOR PROTECTING STORED SSPS ................................................................ 75 9.7.A ZEROISATION OF ONE TIME PROGRAMMABLE (OTP) MEMORY ............................................................ 77 9.7.B INDICATOR OF ZEROISATION .................................................................................................................. 79 SECTION 10 – SELF-TESTS ......................................................................................................................... 82 10.2.A PRE-OPERATIONAL INTEGRITY TECHNIQUE SELF-TEST ......................................................................._
