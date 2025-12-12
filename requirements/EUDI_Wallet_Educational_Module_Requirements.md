# European Digital Identity Wallet (EUDI Wallet) Educational Module

## Cryptographic Flows and Security Architecture

**Document Version:** 1.1  
**Target Platform:** PQC Today Learn Modules  
**Date:** December 8, 2025  
**Classification:** Educational / Training Material  
**Primary Reference:** Architecture and Reference Framework (ARF) v2.4.0+

---

## Executive Summary

This document specifies the educational content structure for a comprehensive EUDI Wallet security learning module covering the cryptographic operations and trust flows from the perspective of each ecosystem actor, **focusing specifically on the Remote HSM architecture** for WSCA/WSCD:

1. **Wallet Provider & Remote HSM (WSCA/WSCD)** - Centralized HSM-based key management and cryptographic operations
2. **PID Provider** - Person Identification Data issuance with identity verification
3. **Attestation Providers** - QEAA, PuB-EAA, and EAA issuance flows
4. **Authentic Sources** - Authoritative data repositories
5. **Relying Party** - Attestation verification and presentation flows
6. **Remote QES Provider** - Qualified Electronic Signature creation
7. **Trust Infrastructure** - Trusted Lists, Access CAs, and Registration

**Architecture Focus:** This module specifically covers the **Remote HSM model** where the Wallet Secure Cryptographic Device (WSCD) is a centralized Hardware Security Module (FIPS 140-3 Level 3 certified) operated by the Wallet Provider. This architecture provides enterprise-grade security through:

- Centralized key management in certified HSM clusters
- Multi-tenant user partition model
- Network-based crypto operations via authenticated TLS channels
- Comprehensive audit logging and key lifecycle management

**Reference Test Data:** The module includes comprehensive reference test data (Part 10) conforming to **ARF v2.4.0+** specifications, covering:

- Complete PID attributes in both ISO/IEC 18013-5 and SD-JWT VC formats
- Mobile driving license (mDL) attributes per ISO/IEC 18013-5
- University diploma attestation (PuB-EAA) in SD-JWT VC format
- Remote QES signing flow with CSC API v2.0
- Combined credential presentation for bank KYC
- HSM key material and cryptographic operations
- Trust infrastructure and certificate chains
- Protocol message examples (OpenID4VCI, OpenID4VP, CSC API)
- Educational testing scenarios including error conditions

The module is designed for security professionals, identity architects, and developers implementing or integrating with the EUDI Wallet ecosystem using Remote HSM infrastructure.

### Educational Availability (OpenSSL Log Transparency)

To support the educational goals of this module, the implementation MUST provide **OpenSSL Log Transparency**:

- **Split View Logging**: All flows must display a real-time log panel with two tabs: "Protocol Log" (high-level steps) and "OpenSSL Log" (raw cryptographic commands).
- **Authentic Commands**: The "OpenSSL Log" must display the actual `openssl` commands (e.g., `dgst`, `ecparam`, `pkeyutl`) executed by the underlying WebAssembly engine.
- **Visual Validation**: Users must be able to correlate UI actions (e.g., "Issue PID") with specific OpenSSL operations (e.g., `openssl dgst -sign`).

---

## Target Use Cases

This educational module is built around **four concrete use cases** that demonstrate the complete lifecycle of EUDI Wallet operations:

### Use Case Overview

| #       | Use Case                            | Actors Involved                                                                  | Key Flows                                                  |
| ------- | ----------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **UC1** | Driver's License (mDL) as PID       | Citizen, Wallet Provider, Motor Vehicle Authority (PID Provider), Remote HSM     | Wallet activation, WUA issuance, PID issuance (OpenID4VCI) |
| **UC2** | University Diploma Attestation      | Citizen, University (PuB-EAA Provider), Ministry of Education (Authentic Source) | QEAA/PuB-EAA issuance, credential binding                  |
| **UC3** | Remote QES Signing of Property Deed | Citizen, Notary (RP), QTSP (Remote QES Provider), Land Registry                  | QES flow (CSC API), document signing, PID presentation     |
| **UC4** | Bank Account Opening                | Citizen, Bank (Relying Party), PID + Diploma presentation                        | Combined presentation (OpenID4VP), RP verification         |

### Use Case Narrative Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        CITIZEN'S EUDI WALLET JOURNEY                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                                      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  PHASE 1: WALLET ACTIVATION & PID ISSUANCE (UC1)                              â”‚   â”‚
â”‚  â”‚                                                                                â”‚   â”‚
â”‚  â”‚  Maria downloads the national EUDI Wallet app. During activation:             â”‚   â”‚
â”‚  â”‚  â€¢ Wallet Provider creates her HSM partition                                  â”‚   â”‚
â”‚  â”‚  â€¢ WUA key pair generated in Remote HSM                                       â”‚   â”‚
â”‚  â”‚  â€¢ WUA issued attesting her Wallet Unit                                       â”‚   â”‚
â”‚  â”‚                                                                                â”‚   â”‚
â”‚  â”‚  Maria then obtains her mDL-based PID from the Motor Vehicle Authority:       â”‚   â”‚
â”‚  â”‚  â€¢ Authenticates with national eID (LoA High)                                 â”‚   â”‚
â”‚  â”‚  â€¢ PID key pair generated in her HSM partition                                â”‚   â”‚
â”‚  â”‚  â€¢ mDL/PID issued with her identity attributes                                â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                         â”‚                                            â”‚
â”‚                                         â–¼                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  PHASE 2: DIPLOMA ATTESTATION (UC2)                                           â”‚   â”‚
â”‚  â”‚                                                                                â”‚   â”‚
â”‚  â”‚  Maria graduated from State University and wants her diploma in her wallet:   â”‚   â”‚
â”‚  â”‚  â€¢ University (as PuB-EAA Provider) queries Ministry of Education             â”‚   â”‚
â”‚  â”‚  â€¢ Ministry confirms graduation from authentic student records                â”‚   â”‚
â”‚  â”‚  â€¢ Diploma attestation key generated in Maria's HSM partition                 â”‚   â”‚
â”‚  â”‚  â€¢ University issues PuB-EAA (diploma) bound to her Wallet Unit               â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                         â”‚                                            â”‚
â”‚                                         â–¼                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  PHASE 3: PROPERTY PURCHASE - QES SIGNING (UC3)                               â”‚   â”‚
â”‚  â”‚                                                                                â”‚   â”‚
â”‚  â”‚  Maria is buying an apartment and needs to sign the deed at the notary:       â”‚   â”‚
â”‚  â”‚  â€¢ Notary prepares the property deed document                                 â”‚   â”‚
â”‚  â”‚  â€¢ Maria presents PID to prove identity                                       â”‚   â”‚
â”‚  â”‚  â€¢ QTSP issues short-lived qualified certificate based on PID                 â”‚   â”‚
â”‚  â”‚  â€¢ Document hash signed in QTSP's remote QSCD                                 â”‚   â”‚
â”‚  â”‚  â€¢ QES embedded in deed, registered with Land Registry                        â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                         â”‚                                            â”‚
â”‚                                         â–¼                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  PHASE 4: BANK ACCOUNT OPENING (UC4)                                          â”‚   â”‚
â”‚  â”‚                                                                                â”‚   â”‚
â”‚  â”‚  Maria wants to open an account at EuroBank for her new property:             â”‚   â”‚
â”‚  â”‚  â€¢ Bank requests PID (identity) + Diploma (proof of employment/education)     â”‚   â”‚
â”‚  â”‚  â€¢ Maria reviews requested attributes and approves                            â”‚   â”‚
â”‚  â”‚  â€¢ Combined presentation with device binding proofs                           â”‚   â”‚
â”‚  â”‚  â€¢ Bank verifies both attestations and issuer signatures                      â”‚   â”‚
â”‚  â”‚  â€¢ KYC requirements satisfied, account opened                                 â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Actors by Use Case

```
UC1: Driver's License PID Issuance
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Maria     â”‚     â”‚   Wallet    â”‚     â”‚   Motor     â”‚     â”‚  National   â”‚
â”‚  (Citizen)  â”‚     â”‚  Provider   â”‚     â”‚  Vehicle    â”‚     â”‚   eID       â”‚
â”‚             â”‚     â”‚  + HSM      â”‚     â”‚  Authority  â”‚     â”‚  System     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     User            WUA Issuer          PID Provider       Identity Source
                     HSM Operator        (mDL Issuer)       (LoA High Auth)

UC2: University Diploma Attestation
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Maria     â”‚     â”‚   State     â”‚     â”‚  Ministry   â”‚     â”‚   Wallet    â”‚
â”‚  (Citizen)  â”‚     â”‚ University  â”‚     â”‚    of       â”‚     â”‚  Provider   â”‚
â”‚             â”‚     â”‚             â”‚     â”‚ Education   â”‚     â”‚   + HSM     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     User           PuB-EAA Provider    Authentic Source    Key Generation

UC3: Remote QES Signing of Deed
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Maria     â”‚     â”‚   Notary    â”‚     â”‚    QTSP     â”‚     â”‚    Land     â”‚
â”‚  (Citizen)  â”‚     â”‚   Office    â”‚     â”‚  (Signing   â”‚     â”‚  Registry   â”‚
â”‚             â”‚     â”‚             â”‚     â”‚  Service)   â”‚     â”‚             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     Signer         Relying Party       QES Provider        Document Store
                    (initiates sign)    (Remote QSCD)

UC4: Bank Account Opening
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Maria     â”‚     â”‚  EuroBank   â”‚     â”‚   Motor     â”‚     â”‚   State     â”‚
â”‚  (Citizen)  â”‚     â”‚   (Bank)    â”‚     â”‚  Vehicle    â”‚     â”‚ University  â”‚
â”‚             â”‚     â”‚             â”‚     â”‚  Authority  â”‚     â”‚             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     User           Relying Party       PID Issuer          Diploma Issuer
                    (Verifier)          (for verification)  (for verification)
```

### Cryptographic Operations Summary by Use Case

| Use Case | Key Generation                 | Signatures Created                                    | Signatures Verified                         |
| -------- | ------------------------------ | ----------------------------------------------------- | ------------------------------------------- |
| **UC1**  | WUA key, PID key (both in HSM) | WUA PoP, PID PoP (HSM), PID by Provider               | Device attestation, WUA signature           |
| **UC2**  | Diploma attestation key (HSM)  | Diploma PoP (HSM), Diploma by University              | WUA signature, PID for binding              |
| **UC3**  | (uses existing PID key)        | PID device binding (HSM), QES on deed (QTSP HSM)      | PID issuer sig, Certificate chain           |
| **UC4**  | (uses existing keys)           | PID device binding, Diploma device binding (both HSM) | PID issuer, Diploma issuer, Device bindings |

---

## Part 1: Applicable Standards & References

### 1.1 European Regulations

| Regulation        | Title                              | Relevance                          |
| ----------------- | ---------------------------------- | ---------------------------------- |
| **eIDAS 2.0**     | Regulation (EU) 2024/1183          | Legal framework for EUDI Wallet    |
| **CIR 2024/2977** | PID and EAA formats                | Attestation data structures        |
| **CIR 2024/2979** | Integrity and core functionalities | WSCD/WSCA requirements             |
| **CIR 2024/2980** | Ecosystem notifications            | Registration and trusted lists     |
| **CIR 2024/2981** | Certification of Wallet Solutions  | Security certification             |
| **CIR 2024/2982** | Protocols and interfaces           | OpenID4VP, OpenID4VCI, ISO 18013-5 |
| **CIR 2025/848**  | Registration of Relying Parties    | RP registration requirements       |
| **CIR 2025/849**  | List of certified wallets          | Wallet certification publication   |
| **CIR 2025/1567** | Remote QSCD management             | QES remote signing                 |

### 1.2 Technical Standards - Attestation Formats

| Standard            | Title                                   | Relevance                              |
| ------------------- | --------------------------------------- | -------------------------------------- |
| **ISO/IEC 18013-5** | Mobile Driving Licence (mDL)            | mdoc format, proximity presentation    |
| **ISO/IEC 23220-2** | Building blocks for identity management | mdoc extensions                        |
| **ISO/IEC 18013-7** | mDL add-on functions                    | Remote mdoc presentation via OpenID4VP |
| **SD-JWT VC**       | SD-JWT-based Verifiable Credentials     | Selective disclosure JWT format        |
| **W3C VC DM 2.0**   | Verifiable Credentials Data Model       | Credential structure reference         |

### 1.3 Technical Standards - Protocols

| Standard                        | Title                                     | Relevance                       |
| ------------------------------- | ----------------------------------------- | ------------------------------- |
| **OpenID4VCI**                  | OpenID for Verifiable Credential Issuance | PID and attestation issuance    |
| **OpenID4VP**                   | OpenID for Verifiable Presentations       | Remote attestation presentation |
| **OpenID4VC HAIP**              | High Assurance Interoperability Profile   | Security profile for OpenID4VC  |
| **W3C Digital Credentials API** | Browser-based credential exchange         | Same-device remote presentation |
| **CSC API v2.0**                | Cloud Signature Consortium API            | Remote QES signing              |
| **GP OMAPI**                    | GlobalPlatform Open Mobile API            | Secure Element access           |

### 1.4 Cryptographic Standards

| Standard                 | Title                              | Relevance                       |
| ------------------------ | ---------------------------------- | ------------------------------- |
| **COSE (RFC 9052)**      | CBOR Object Signing and Encryption | mdoc signatures                 |
| **JOSE (RFC 7515-7519)** | JSON Object Signing and Encryption | SD-JWT signatures               |
| **ES256/ES384/ES512**    | ECDSA with P-256/P-384/P-521       | Primary signature algorithms    |
| **EdDSA (RFC 8032)**     | Edwards-curve Digital Signature    | Alternative signature algorithm |
| **X.509 (RFC 5280)**     | Public Key Infrastructure          | Certificates for providers      |
| **PKCS#11**              | Cryptographic Token Interface      | HSM integration                 |

### 1.5 Trust Framework Standards

| Standard            | Title                                | Relevance                  |
| ------------------- | ------------------------------------ | -------------------------- |
| **ETSI TS 119 612** | Trusted Lists                        | Trust anchor publication   |
| **ETSI EN 319 411** | Policy for TSP issuing certificates  | QEAA Provider requirements |
| **ETSI EN 319 401** | General policy requirements for TSPs | Trust service policies     |
| **Common Criteria** | ISO/IEC 15408                        | WSCD certification         |

---

## Part 2: Architecture Overview

### 2.1 EUDI Wallet Ecosystem Actors

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        EUDI WALLET ECOSYSTEM ARCHITECTURE                        â”‚
â”‚                            (Remote HSM Model)                                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  TRUST LAYER   â”‚                                    â”‚   SUPERVISION      â”‚   â”‚
â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                                    â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚   â”‚
â”‚  â”‚ â”‚ Trusted    â”‚ â”‚                                    â”‚ â”‚ Supervisory    â”‚ â”‚   â”‚
â”‚  â”‚ â”‚ Lists      â”‚ â”‚                                    â”‚ â”‚ Bodies         â”‚ â”‚   â”‚
â”‚  â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚                                    â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚   â”‚
â”‚  â”‚ â”‚ Access CAs â”‚ â”‚                                    â”‚ â”‚ CABs           â”‚ â”‚   â”‚
â”‚  â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚                                    â”‚ â”‚ (Conformity    â”‚ â”‚   â”‚
â”‚  â”‚ â”‚ Registrars â”‚ â”‚                                    â”‚ â”‚ Assessment)    â”‚ â”‚   â”‚
â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                                    â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚           â”‚                                                      â”‚              â”‚
â”‚           â–¼                                                      â–¼              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                           PROVIDER LAYER                                 â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚   â”‚
â”‚  â”‚  â”‚   Wallet     â”‚  â”‚     PID      â”‚  â”‚ Attestation  â”‚  â”‚   Remote    â”‚  â”‚   â”‚
â”‚  â”‚  â”‚   Provider   â”‚  â”‚   Provider   â”‚  â”‚  Providers   â”‚  â”‚    QES      â”‚  â”‚   â”‚
â”‚  â”‚  â”‚              â”‚  â”‚              â”‚  â”‚ (QEAA/PuB/   â”‚  â”‚  Provider   â”‚  â”‚   â”‚
â”‚  â”‚  â”‚ â€¢ WUA Issue  â”‚  â”‚ â€¢ Identity   â”‚  â”‚  EAA)        â”‚  â”‚  (QTSP)     â”‚  â”‚   â”‚
â”‚  â”‚  â”‚ â€¢ HSM Mgmt   â”‚  â”‚   Verify     â”‚  â”‚              â”‚  â”‚             â”‚  â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜  â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚            â”‚                 â”‚                 â”‚                 â”‚              â”‚
â”‚            â”‚    OpenID4VCI   â”‚    OpenID4VCI   â”‚    OpenID4VCI   â”‚   CSC API   â”‚
â”‚            â”‚                 â”‚                 â”‚                 â”‚              â”‚
â”‚            â–¼                 â–¼                 â–¼                 â–¼              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                         USER DEVICE                                      â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚   â”‚
â”‚  â”‚  â”‚                      Wallet Instance (WI)                        â”‚    â”‚   â”‚
â”‚  â”‚  â”‚  â€¢ Business Logic  â€¢ Protocol Handlers  â€¢ User Interface        â”‚    â”‚   â”‚
â”‚  â”‚  â”‚  â€¢ HSM Client Library (communicates with remote WSCA/WSCD)      â”‚    â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                    â”‚                                            â”‚
â”‚                           TLS 1.3  â”‚ (Authenticated Channel)                    â”‚
â”‚                                    â”‚                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚              WALLET PROVIDER HSM INFRASTRUCTURE                          â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚   â”‚
â”‚  â”‚  â”‚            WSCA (HSM Firmware Module)                            â”‚    â”‚   â”‚
â”‚  â”‚  â”‚  â€¢ Key Management  â€¢ Signature Operations  â€¢ User Authenticationâ”‚    â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚   â”‚
â”‚  â”‚                                 â”‚ Internal HSM API                      â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚   â”‚
â”‚  â”‚  â”‚              WSCD (HSM Hardware - FIPS 140-3 L3)                 â”‚    â”‚   â”‚
â”‚  â”‚  â”‚  â€¢ Secure Key Storage  â€¢ TRNG  â€¢ Tamper-Resistant Crypto Engine â”‚    â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                    â”‚                                            â”‚
â”‚            OpenID4VP / ISO 18013-5 â”‚                                            â”‚
â”‚                                    â–¼                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                          RELYING PARTY LAYER                             â”‚   â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                   â”‚   â”‚
â”‚  â”‚  â”‚   Online     â”‚  â”‚  Proximity   â”‚  â”‚Intermediary  â”‚                   â”‚   â”‚
â”‚  â”‚  â”‚   Service    â”‚  â”‚  Verifier    â”‚  â”‚   Service    â”‚                   â”‚   â”‚
â”‚  â”‚  â”‚ (Web/Mobile) â”‚  â”‚ (NFC/BLE)    â”‚  â”‚              â”‚                   â”‚   â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                   â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.2 Key Components Description

| Component                | Function                         | Cryptographic Role                                |
| ------------------------ | -------------------------------- | ------------------------------------------------- |
| **Wallet Instance (WI)** | User-facing application          | Protocol orchestration, credential storage        |
| **WSCA**                 | HSM firmware module              | Key operations, user authentication (runs in HSM) |
| **WSCD**                 | Remote HSM hardware              | Private key storage, secure crypto execution      |
| **PID Provider**         | Identity issuer                  | Signs PIDs, verifies identity at LoA High         |
| **QEAA Provider**        | Qualified attestation issuer     | Signs QEAAs as QTSP                               |
| **PuB-EAA Provider**     | Public body attestation issuer   | Signs PuB-EAAs with qualified certificate         |
| **EAA Provider**         | Non-qualified attestation issuer | Signs EAAs                                        |
| **Remote QES Provider**  | Signature service                | Creates QES on remote QSCD                        |
| **Relying Party**        | Service provider                 | Verifies attestations and device binding          |
| **Access CA**            | Certificate authority            | Issues access certificates for authentication     |
| **Registrar**            | Registration authority           | Registers providers and RPs                       |

---

## Part 3: Wallet Unit Cryptographic Architecture (Remote HSM)

### 3.1 WSCD Architecture: Remote HSM

This document focuses on the **Remote HSM architecture** for WSCD/WSCA, which provides enterprise-grade security through centralized Hardware Security Modules.

#### 3.1.1 Remote HSM Architecture Overview

```
Remote HSM Architecture:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                              USER DEVICE                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                        Wallet Instance (WI)                            â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚  â”‚
â”‚  â”‚  â”‚  Protocol       â”‚  â”‚  User Interface â”‚  â”‚  Crypto Client      â”‚    â”‚  â”‚
â”‚  â”‚  â”‚  Handlers       â”‚  â”‚  & Consent Mgmt â”‚  â”‚  (HSM API calls)    â”‚    â”‚  â”‚
â”‚  â”‚  â”‚  â€¢ OpenID4VCI   â”‚  â”‚  â€¢ Attestation  â”‚  â”‚  â€¢ Key references   â”‚    â”‚  â”‚
â”‚  â”‚  â”‚  â€¢ OpenID4VP    â”‚  â”‚    display      â”‚  â”‚  â€¢ Sign requests    â”‚    â”‚  â”‚
â”‚  â”‚  â”‚  â€¢ CSC API      â”‚  â”‚  â€¢ User auth    â”‚  â”‚  â€¢ Session mgmt     â”‚    â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                           â”‚
                                          TLS 1.3 / mTLS   â”‚
                                     (Authenticated Channel)â”‚
                                                           â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     WALLET PROVIDER INFRASTRUCTURE        â”‚                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                    HSM Cluster (FIPS 140-3 Level 3)   â”‚               â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚
â”‚  â”‚  â”‚                    WSCA (HSM Firmware Module)                    â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ Key Manager  â”‚  â”‚ User Auth    â”‚  â”‚ Crypto Operations    â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ â€¢ Key IDs    â”‚  â”‚ â€¢ PIN verify â”‚  â”‚ â€¢ ECDSA Sign         â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ â€¢ Key policy â”‚  â”‚ â€¢ Biometric  â”‚  â”‚ â€¢ Key generation     â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ â€¢ Access ctl â”‚  â”‚   binding    â”‚  â”‚ â€¢ Key attestation    â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚  â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚
â”‚  â”‚                                â”‚ Internal HSM API                     â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚
â”‚  â”‚  â”‚                    WSCD (HSM Hardware)                           â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ Secure Key   â”‚  â”‚ True Random  â”‚  â”‚ Tamper-Resistant     â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ Storage      â”‚  â”‚ Number Gen   â”‚  â”‚ Crypto Engine        â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚ (per-user    â”‚  â”‚ (FIPS DRBG)  â”‚  â”‚ â€¢ P-256, P-384       â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  key slots)  â”‚  â”‚              â”‚  â”‚ â€¢ AES-256            â”‚   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚  â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                    Supporting Services                                 â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚  â”‚
â”‚  â”‚  â”‚ WUA Issuance    â”‚  â”‚ Key Lifecycle   â”‚  â”‚ Audit & Logging     â”‚    â”‚  â”‚
â”‚  â”‚  â”‚ Service         â”‚  â”‚ Management      â”‚  â”‚ Service             â”‚    â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Key Characteristics:
â€¢ Crypto Operations: All performed inside HSM
â€¢ Key Storage: HSM secure memory (never exported)
â€¢ Multi-tenant: One HSM cluster serves many Wallet Units
â€¢ Availability: HSM cluster with redundancy
â€¢ Certification: FIPS 140-3 Level 3 minimum
```

#### 3.1.2 Remote HSM Communication Model

```
Communication Layers:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Wallet         â”‚                    â”‚        HSM Infrastructure           â”‚
â”‚  Instance       â”‚                    â”‚                                     â”‚
â”‚                 â”‚                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚     TLS 1.3       â”‚  â”‚     API Gateway / LB        â”‚    â”‚
â”‚  â”‚ HSM       â”‚  â”‚  â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚  â”‚  â€¢ Rate limiting            â”‚    â”‚
â”‚  â”‚ Client    â”‚  â”‚  (mTLS optional)  â”‚  â”‚  â€¢ Request routing          â”‚    â”‚
â”‚  â”‚ Library   â”‚  â”‚                    â”‚  â”‚  â€¢ Session management       â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚                    â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                 â”‚                    â”‚                 â”‚                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
                                       â”‚  â”‚      HSM Access Layer       â”‚    â”‚
                                       â”‚  â”‚  â€¢ Authentication           â”‚    â”‚
                                       â”‚  â”‚  â€¢ Authorization            â”‚    â”‚
                                       â”‚  â”‚  â€¢ Key handle resolution    â”‚    â”‚
                                       â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
                                       â”‚                 â”‚                    â”‚
                                       â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
                                       â”‚  â”‚         HSM Cluster         â”‚    â”‚
                                       â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”       â”‚    â”‚
                                       â”‚  â”‚  â”‚ HSM 1 â”‚  â”‚ HSM 2 â”‚  ...  â”‚    â”‚
                                       â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚    â”‚
                                       â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
                                       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Protocol Stack:
â€¢ Application: PKCS#11 / proprietary HSM API / REST
â€¢ Session: Authenticated session with user binding
â€¢ Transport: TLS 1.3 with strong cipher suites
â€¢ Authentication: Client certificate + user credential
```

#### 3.1.3 HSM Security Properties

| Property              | Requirement                     | Implementation                   |
| --------------------- | ------------------------------- | -------------------------------- |
| **Key Storage**       | Keys never leave HSM boundary   | Hardware-enforced key isolation  |
| **Tamper Resistance** | Physical attack protection      | FIPS 140-3 Level 3 enclosure     |
| **TRNG**              | Cryptographic random generation | Hardware entropy source, DRBG    |
| **Audit**             | All operations logged           | Tamper-evident audit trail       |
| **Access Control**    | Per-key authorization           | Role-based + user authentication |
| **Availability**      | High availability required      | Clustered HSMs with failover     |
| **Key Backup**        | Secure key backup/restore       | Key wrapping with master key     |

#### 3.1.4 HSM Certification Requirements

```
Certification Stack for Remote WSCD:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    EUDI Wallet Certification                â”‚
â”‚                    (CIR 2024/2981)                          â”‚
â”‚  â€¢ Wallet Solution certified against national scheme        â”‚
â”‚  â€¢ WSCD assessed against LoA High requirements              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              Common Criteria Certification                   â”‚
â”‚              (ISO/IEC 15408)                                 â”‚
â”‚  â€¢ EAL4+ recommended for HSM                                â”‚
â”‚  â€¢ Protection Profile for cryptographic modules             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              FIPS 140-3 Level 3 (Minimum)                   â”‚
â”‚  â€¢ Cryptographic module validation                          â”‚
â”‚  â€¢ Physical security mechanisms                             â”‚
â”‚  â€¢ Identity-based authentication                            â”‚
â”‚  â€¢ Environmental failure protection                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              Additional Standards                            â”‚
â”‚  â€¢ PCI HSM v3.0 (if payment related)                        â”‚
â”‚  â€¢ eIDAS qualified device requirements                       â”‚
â”‚  â€¢ SOC 2 Type II (operational security)                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.2 WSCA Cryptographic Operations (Remote HSM)

The WSCA runs as a firmware module inside the HSM and performs the following critical cryptographic operations:

| Operation                | Description                                     | When Used                          |
| ------------------------ | ----------------------------------------------- | ---------------------------------- |
| **Key Generation**       | Generate EC key pairs (P-256, P-384) inside HSM | WUA key, PID key, attestation keys |
| **Signing**              | ECDSA signature creation inside HSM             | Device binding proof, WUA proof    |
| **User Authentication**  | Verify user credential before crypto ops        | Before any private key use         |
| **Key Attestation**      | Prove key properties to provider                | During issuance                    |
| **Proof of Association** | Prove keys share same HSM partition             | Combined presentation              |

#### 3.2.1 Key Generation Flow (Remote HSM)

```
Remote HSM Key Generation:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Wallet         â”‚                    â”‚        Remote HSM                    â”‚
â”‚  Instance       â”‚                    â”‚                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
         â”‚                             â”‚  â”‚           WSCA                   â”‚ â”‚
         â”‚ 1. GenerateKey request      â”‚  â”‚      (HSM Firmware)              â”‚ â”‚
         â”‚    (key_type, key_purpose)  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
         â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                 â”‚                    â”‚
         â”‚                             â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
         â”‚                             â”‚  â”‚           WSCD                   â”‚ â”‚
         â”‚                             â”‚  â”‚      (HSM Hardware)              â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  2. Generate random d âˆˆ [1,n-1] â”‚ â”‚
         â”‚                             â”‚  â”‚     using FIPS DRBG              â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  3. Compute Q = d Ã— G            â”‚ â”‚
         â”‚                             â”‚  â”‚     (EC point multiplication)    â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  4. Store (d, Q) in user's       â”‚ â”‚
         â”‚                             â”‚  â”‚     HSM partition                â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  5. Generate key_handle          â”‚ â”‚
         â”‚                             â”‚  â”‚     (reference to stored key)    â”‚ â”‚
         â”‚                             â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
         â”‚                             â”‚                 â”‚                    â”‚
         â”‚ 6. Return (key_handle, Q)   â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚
         â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                                      â”‚
         â”‚                             â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Input:  Key type (EC P-256, P-384, or P-521)
        Key purpose (WUA, PID, Attestation)
        User session token (for HSM partition binding)
Output: Key handle (HSM reference to generated key)
        Public key Q (exportable)

Security Properties (Remote HSM):
- Private key d NEVER leaves HSM boundary
- Key bound to specific user partition in HSM
- TRNG uses hardware entropy (FIPS 140-3 compliant)
- Key handle only valid within authenticated session
- Audit log entry created for key generation
```

#### 3.2.2 Signature Operation Flow (Remote HSM)

```
Remote HSM Signature Operation:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Wallet         â”‚                    â”‚        Remote HSM                    â”‚
â”‚  Instance       â”‚                    â”‚                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
         â”‚                             â”‚  â”‚           WSCA                   â”‚ â”‚
         â”‚ 1. Sign request             â”‚  â”‚      (HSM Firmware)              â”‚ â”‚
         â”‚    (key_handle, data_hash,  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
         â”‚     user_auth_token)        â”‚                 â”‚                    â”‚
         â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                 â”‚                    â”‚
         â”‚                             â”‚  2. WSCA validates user_auth_token  â”‚
         â”‚                             â”‚     (PIN hash or biometric binding) â”‚
         â”‚                             â”‚                 â”‚                    â”‚
         â”‚                             â”‚  3. WSCA resolves key_handle to     â”‚
         â”‚                             â”‚     user's HSM partition             â”‚
         â”‚                             â”‚                 â”‚                    â”‚
         â”‚                             â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
         â”‚                             â”‚  â”‚           WSCD                   â”‚ â”‚
         â”‚                             â”‚  â”‚      (HSM Hardware)              â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  4. Retrieve private key d       â”‚ â”‚
         â”‚                             â”‚  â”‚     from secure storage          â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  5. ECDSA Sign:                  â”‚ â”‚
         â”‚                             â”‚  â”‚     k = random in [1, n-1]       â”‚ â”‚
         â”‚                             â”‚  â”‚     (xâ‚, yâ‚) = k Ã— G             â”‚ â”‚
         â”‚                             â”‚  â”‚     r = xâ‚ mod n                 â”‚ â”‚
         â”‚                             â”‚  â”‚     s = kâ»Â¹(z + rÂ·d) mod n       â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  6. Zero k and d from registers  â”‚ â”‚
         â”‚                             â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
         â”‚                             â”‚                 â”‚                    â”‚
         â”‚ 7. Return signature (r, s)  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚
         â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                                      â”‚
         â”‚                             â”‚  8. Log signature operation          â”‚
         â”‚                             â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Input:  Key handle (HSM reference)
        Data to sign (hash value, z)
        User authentication token
Output: Signature (r, s) or error

Crypto Operation (ECDSA P-256, inside WSCD):
- Algorithm: ECDSA with SHA-256
- Curve: P-256 (secp256r1)
- Output: 64 bytes (r: 32 bytes, s: 32 bytes)
```

#### 3.2.3 User Authentication Binding (Remote HSM)

```
User Authentication in Remote HSM Model:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

User authentication is performed in TWO layers:

Layer 1: Device-Level Authentication (on User Device)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚           User Device                    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚        Wallet Instance            â”‚  â”‚
â”‚  â”‚                                   â”‚  â”‚
â”‚  â”‚  1. User performs biometric/PIN   â”‚  â”‚
â”‚  â”‚     authentication on device      â”‚  â”‚
â”‚  â”‚                                   â”‚  â”‚
â”‚  â”‚  2. Device generates auth_token   â”‚  â”‚
â”‚  â”‚     (bound to user biometric or   â”‚  â”‚
â”‚  â”‚      PIN verification)            â”‚  â”‚
â”‚  â”‚                                   â”‚  â”‚
â”‚  â”‚  3. auth_token sent with HSM      â”‚  â”‚
â”‚  â”‚     requests                      â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Layer 2: HSM-Level Authentication (in Remote HSM)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              Remote HSM                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚              WSCA                          â”‚  â”‚
â”‚  â”‚                                           â”‚  â”‚
â”‚  â”‚  4. Validate auth_token:                  â”‚  â”‚
â”‚  â”‚     - Verify token signature              â”‚  â”‚
â”‚  â”‚     - Check token freshness               â”‚  â”‚
â”‚  â”‚     - Verify binding to user session      â”‚  â”‚
â”‚  â”‚                                           â”‚  â”‚
â”‚  â”‚  5. If valid:                             â”‚  â”‚
â”‚  â”‚     - Allow access to user's key partitionâ”‚  â”‚
â”‚  â”‚     - Authorize crypto operation          â”‚  â”‚
â”‚  â”‚                                           â”‚  â”‚
â”‚  â”‚  6. If invalid:                           â”‚  â”‚
â”‚  â”‚     - Reject request                      â”‚  â”‚
â”‚  â”‚     - Log failed attempt                  â”‚  â”‚
â”‚  â”‚     - Apply rate limiting                 â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Authentication Token Structure:
{
  "user_id": "<wallet_unit_identifier>",
  "auth_method": "biometric" | "pin",
  "auth_timestamp": <unix_timestamp>,
  "device_binding": "<device_attestation_hash>",
  "nonce": "<random_value>",
  "signature": "<device_key_signature>"
}
```

### 3.3 Wallet Unit Attestation (WUA) - Remote HSM Model

The WUA is a critical trust anchor issued by the Wallet Provider to attest:

- Wallet Unit authenticity
- Remote HSM security properties
- User's key partition validity
- Wallet Unit revocation status

#### 3.3.1 WUA Structure

```
WUA (Wallet Unit Attestation):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Format: SD-JWT or mdoc (provider choice)

Contents:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Issuer              : Wallet Provider identifier                      â”‚
â”‚ Subject             : Wallet Unit identifier                          â”‚
â”‚ WUA_pub_key         : Public key attested by WUA (stored in HSM)     â”‚
â”‚ HSM_properties      : HSM certification, security level               â”‚
â”‚   - hsm_vendor      : HSM manufacturer                                â”‚
â”‚   - hsm_model       : HSM model identifier                            â”‚
â”‚   - certification   : FIPS 140-3 Level 3, Common Criteria, etc.      â”‚
â”‚   - key_protection  : "hardware_backed"                               â”‚
â”‚ User_partition_id   : User's partition in HSM cluster                â”‚
â”‚ Issuance_date       : Timestamp                                       â”‚
â”‚ Expiry_date         : Short-lived (hours to days)                     â”‚
â”‚ Revocation_info     : Status endpoint or embedded status              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Signed by: Wallet Provider's attestation signing key
```

#### 3.3.2 WUA Issuance Flow (Remote HSM)

```
WUA Issuance (during Wallet Unit Activation):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚    Wallet      â”‚              â”‚    Wallet      â”‚              â”‚   Remote HSM   â”‚
â”‚   Instance     â”‚              â”‚   Provider     â”‚              â”‚   (WSCA/WSCD)  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚                               â”‚                               â”‚
        â”‚ 1. Register Wallet Unit       â”‚                               â”‚
        â”‚   (device info, user binding) â”‚                               â”‚
        â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                               â”‚
        â”‚                               â”‚                               â”‚
        â”‚                               â”‚ 2. Create user partition      â”‚
        â”‚                               â”‚    in HSM                     â”‚
        â”‚                               â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
        â”‚                               â”‚                               â”‚
        â”‚                               â”‚ 3. Partition created          â”‚
        â”‚                               â”‚   (partition_id)              â”‚
        â”‚                               â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
        â”‚                               â”‚                               â”‚
        â”‚ 4. Request WUA key generation â”‚                               â”‚
        â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                               â”‚
        â”‚                               â”‚                               â”‚
        â”‚ 5. Generate WUA key pair      â”‚                               â”‚
        â”‚   (via HSM)                   â”‚                               â”‚
        â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
        â”‚                               â”‚                               â”‚
        â”‚                               â”‚                    6. Generate key pair
        â”‚                               â”‚                       in user partition
        â”‚                               â”‚                       d, Q = KeyGen(P-256)
        â”‚                               â”‚                               â”‚
        â”‚ 7. Return (key_handle, WUA_pub_key)                           â”‚
        â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
        â”‚                               â”‚                               â”‚
        â”‚ 8. Send WUA_pub_key +         â”‚                               â”‚
        â”‚    HSM key attestation        â”‚                               â”‚
        â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                               â”‚
        â”‚                               â”‚                               â”‚
        â”‚                               â”‚ 9. Verify HSM key attestation â”‚
        â”‚                               â”‚    - Verify HSM signature     â”‚
        â”‚                               â”‚    - Verify HSM certification â”‚
        â”‚                               â”‚    - Verify key properties    â”‚
        â”‚                               â”‚                               â”‚
        â”‚                               â”‚ 10. Create WUA:               â”‚
        â”‚                               â”‚    - Include WUA_pub_key      â”‚
        â”‚                               â”‚    - Include HSM properties   â”‚
        â”‚                               â”‚    - Include partition_id     â”‚
        â”‚                               â”‚    - Sign with Provider key   â”‚
        â”‚                               â”‚                               â”‚
        â”‚ 11. Return signed WUA         â”‚                               â”‚
        â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                               â”‚
        â”‚                               â”‚                               â”‚
        â”‚ 12. Store WUA locally         â”‚                               â”‚
        â”‚     (public attestation)      â”‚                               â”‚
        â”‚                               â”‚                               â”‚

Crypto Operations:
- Step 6: ECDSA key generation (P-256/P-384) inside HSM WSCD
- Step 7: HSM key attestation signature (proves key is in HSM)
- Step 10: ECDSA signature by Wallet Provider's signing key
```

#### 3.3.3 HSM Key Attestation

```
HSM Key Attestation Structure:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
The HSM provides cryptographic proof that a key was generated
and is stored within the certified HSM.

Key Attestation Contents:
{
  "key_id": "<key_handle>",
  "public_key": "<WUA_pub_key in JWK format>",
  "key_properties": {
    "algorithm": "ES256",
    "key_ops": ["sign"],
    "extractable": false,
    "hardware_backed": true
  },
  "hsm_info": {
    "vendor": "<HSM vendor>",
    "model": "<HSM model>",
    "serial": "<HSM serial number>",
    "firmware_version": "<version>",
    "certifications": [
      "FIPS 140-3 Level 3",
      "Common Criteria EAL4+"
    ]
  },
  "partition_info": {
    "partition_id": "<user partition>",
    "created_at": "<timestamp>"
  },
  "timestamp": "<attestation timestamp>",
  "signature": "<HSM attestation signature>"
}

Verification:
1. Verify signature using HSM vendor's attestation public key
2. Verify HSM vendor is on approved list
3. Verify certifications match requirements
4. Verify key properties (non-extractable, hardware-backed)
```

---

## Part 4: PID Issuance Flow - UC1: Driver's License (mDL)

This section details the complete flow for **Use Case 1: Maria obtains her Driver's License as PID** from the Motor Vehicle Authority.

### 4.1 Use Case Context (UC1)

```
UC1: Driver's License (mDL) as PID
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Scenario: Maria has just activated her EUDI Wallet and needs to obtain her
Person Identification Data (PID) based on her existing driver's license.

Actors:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Maria (Citizen)          - EUDI Wallet user, holds valid DL           â”‚
â”‚  Wallet Provider          - Operates Remote HSM, issued Maria's WUA    â”‚
â”‚  Motor Vehicle Authority  - PID Provider (mDL issuer)                  â”‚
â”‚  National eID System      - Identity Source for LoA High authenticationâ”‚
â”‚  Remote HSM               - Stores Maria's cryptographic keys          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Prerequisites:
â€¢ Maria has a valid driver's license registered with MVA database
â€¢ Maria has activated her Wallet (WUA already issued, HSM partition created)
â€¢ MVA is registered as PID Provider in the national Trust Framework
â€¢ MVA holds Access Certificate from national Access CA

Outcome:
â€¢ Maria receives her mDL-based PID in mdoc format
â€¢ PID is bound to a key in her HSM partition
â€¢ PID contains identity + driving privilege attributes
```

### 4.2 PID Structure (mDL per ISO 18013-5 + CIR 2024/2977)

```
Maria's mDL/PID Data Elements:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    MANDATORY PID ATTRIBUTES (CIR 2024/2977)             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ family_name        : "GarcÃ­a"                                           â”‚
â”‚ given_name         : "MarÃ­a Elena"                                      â”‚
â”‚ birth_date         : "1990-03-15"                                       â”‚
â”‚ issuance_date      : "2024-11-20"                                       â”‚
â”‚ expiry_date        : "2029-11-20"                                       â”‚
â”‚ issuing_authority  : "DirecciÃ³n General de TrÃ¡fico"                     â”‚
â”‚ issuing_country    : "ES"                                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    OPTIONAL PID ATTRIBUTES                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ birth_place        : "Madrid"                                           â”‚
â”‚ birth_country      : "ES"                                               â”‚
â”‚ gender             : "female"                                           â”‚
â”‚ nationality        : ["ES"]                                             â”‚
â”‚ resident_address   : "Calle Mayor 42, 28013 Madrid"                     â”‚
â”‚ age_over_18        : true                                               â”‚
â”‚ age_over_21        : true                                               â”‚
â”‚ portrait           : <base64 encoded JPEG>                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    mDL-SPECIFIC ATTRIBUTES (ISO 18013-5)                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ document_number    : "12345678X"                                        â”‚
â”‚ driving_privileges : [                                                  â”‚
â”‚   { vehicle_category: "B", issue_date: "2010-06-01",                   â”‚
â”‚     expiry_date: "2029-11-20" },                                       â”‚
â”‚   { vehicle_category: "A2", issue_date: "2015-03-20",                  â”‚
â”‚     expiry_date: "2029-11-20" }                                        â”‚
â”‚ ]                                                                       â”‚
â”‚ portrait_capture_date : "2024-11-15"                                    â”‚
â”‚ signature_usual_mark  : <base64 encoded signature image>                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Format: mdoc (CBOR/COSE) - DocType: "org.iso.18013.5.1.mDL"
        with eu.europa.ec.eudi.pid.1 namespace for PID attributes
```

### 4.3 PID Issuance Protocol (OpenID4VCI) - UC1 Flow

```
UC1: Maria's mDL/PID Issuance Flow:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Maria's  â”‚     â”‚  Remote  â”‚     â”‚    Motor     â”‚     â”‚  National    â”‚     â”‚   MVA    â”‚
â”‚  Wallet  â”‚     â”‚   HSM    â”‚     â”‚   Vehicle    â”‚     â”‚    eID       â”‚     â”‚ Database â”‚
â”‚ Instance â”‚     â”‚          â”‚     â”‚  Authority   â”‚     â”‚   System     â”‚     â”‚          â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 1: ISSUER DISCOVERY
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 1. GET /.well-known/openid-credential-issuer          â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 2. Credential Issuer Metadata     â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚   {                               â”‚                    â”‚                  â”‚
     â”‚     credential_issuer: "https://mva.gov.es",          â”‚                  â”‚
     â”‚     credential_endpoint: "/credentials",               â”‚                  â”‚
     â”‚     credentials_supported: [{                          â”‚                  â”‚
     â”‚       format: "mso_mdoc",                              â”‚                  â”‚
     â”‚       doctype: "org.iso.18013.5.1.mDL",               â”‚                  â”‚
     â”‚       cryptographic_suites_supported: ["ES256"]        â”‚                  â”‚
     â”‚     }]                            â”‚                    â”‚                  â”‚
     â”‚   }                               â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 2: AUTHORIZATION (with WUA)
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 3. Generate WUA PoP               â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚ Sign(WUA_priv, nonce)                 â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 4. POST /par (Pushed Authorization Request)           â”‚                  â”‚
     â”‚    + WUA + WUA_PoP                â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 5. Verify WUA:     â”‚                  â”‚
     â”‚                â”‚                  â”‚    - Check WUA signature             â”‚
     â”‚                â”‚                  â”‚    - Verify Wallet Provider          â”‚
     â”‚                â”‚                  â”‚    - Check HSM properties            â”‚
     â”‚                â”‚                  â”‚    - Verify WUA not revoked          â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 6. Authorization Response (request_uri)               â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 3: USER AUTHENTICATION (LoA High)
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 7. Redirect to eID authentication â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 8. Maria authenticates with eID   â”‚                    â”‚                  â”‚
     â”‚   (smart card + PIN or mobile eID)â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 9. Request identityâ”‚                  â”‚
     â”‚                â”‚                  â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 10. Return authenticated identity     â”‚
     â”‚                â”‚                  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚
     â”‚                â”‚                  â”‚   (name, DOB, national ID)            â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 11. Query driving record              â”‚
     â”‚                â”‚                  â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 12. Return driving privileges         â”‚
     â”‚                â”‚                  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
     â”‚                â”‚                  â”‚   (categories, restrictions, etc.)    â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 13. Authorization Code            â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 4: TOKEN EXCHANGE
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 14. POST /token                   â”‚                    â”‚                  â”‚
     â”‚    (code + PKCE verifier)         â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 15. Token Response                â”‚                    â”‚                  â”‚
     â”‚    (access_token, c_nonce)        â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 5: CREDENTIAL ISSUANCE (with HSM key gen)
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 16. Generate mDL key pair         â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚ KeyGen(P-256, "mDL")                  â”‚                  â”‚
     â”‚                â”‚ Store in Maria's partition            â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 17. Return (key_handle, mDL_pub_key)                  â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 18. Create Proof of Possession    â”‚                    â”‚                  â”‚
     â”‚    (JWT with c_nonce)             â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚ Sign PoP JWT with mDL_priv_key        â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 19. POST /credentials             â”‚                    â”‚                  â”‚
     â”‚    {                              â”‚                    â”‚                  â”‚
     â”‚      format: "mso_mdoc",          â”‚                    â”‚                  â”‚
     â”‚      doctype: "org.iso.18013.5.1.mDL",                â”‚                  â”‚
     â”‚      proof: {                     â”‚                    â”‚                  â”‚
     â”‚        proof_type: "jwt",         â”‚                    â”‚                  â”‚
     â”‚        jwt: "<PoP JWT>"           â”‚                    â”‚                  â”‚
     â”‚      }                            â”‚                    â”‚                  â”‚
     â”‚    }                              â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 20. Verify PoP:    â”‚                  â”‚
     â”‚                â”‚                  â”‚    - Extract mDL_pub_key from PoP    â”‚
     â”‚                â”‚                  â”‚    - Verify PoP signature            â”‚
     â”‚                â”‚                  â”‚    - Verify c_nonce matches          â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 21. Create mDL (mdoc):               â”‚
     â”‚                â”‚                  â”‚    - Add identity attributes         â”‚
     â”‚                â”‚                  â”‚    - Add driving privileges          â”‚
     â”‚                â”‚                  â”‚    - Bind to mDL_pub_key            â”‚
     â”‚                â”‚                  â”‚    - Sign with MVA private key       â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 22. Credential Response           â”‚                    â”‚                  â”‚
     â”‚    { credential: "<mdoc>" }       â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 23. Store mDL in Wallet           â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
```

### 4.4 Cryptographic Operations Detail (UC1)

#### WUA Presentation in PAR

```
WUA in PAR (Step 4):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
The Wallet presents the WUA to prove to MVA:
- Maria's Wallet Unit is genuine and certified
- Her keys are in a certified Remote HSM
- Wallet Unit is not revoked

Data Sent:
- WUA (signed attestation from Wallet Provider)
- WUA PoP: Signature over (nonce, timestamp) using WUA_priv_key

Crypto Operation (in Remote HSM):
1. Wallet Instance retrieves WUA from local storage
2. Gets fresh nonce from MVA
3. Sends sign request to HSM: Sign(WUA_priv_key, nonce || timestamp)
4. HSM returns PoP signature
5. Wallet sends {WUA, PoP_signature} to MVA
```

#### mDL Key Generation (Step 16-17)

```
PID Key Generation (in Remote HSM):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Wallet         â”‚                    â”‚        Remote HSM                    â”‚
â”‚  Instance       â”‚                    â”‚                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
         â”‚                             â”‚  â”‚    WSCA (HSM Firmware)          â”‚ â”‚
         â”‚ 1. GenerateKey(PID)         â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
         â”‚    + user_session_token     â”‚                 â”‚                    â”‚
         â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                 â”‚                    â”‚
         â”‚                             â”‚  2. Validate session, get partition â”‚
         â”‚                             â”‚                 â”‚                    â”‚
         â”‚                             â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
         â”‚                             â”‚  â”‚    WSCD (HSM Hardware)          â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  3. In user's partition:         â”‚ â”‚
         â”‚                             â”‚  â”‚     d_pid = random âˆˆ [1, n-1]   â”‚ â”‚
         â”‚                             â”‚  â”‚     Q_pid = d_pid Ã— G            â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  4. Store (d_pid, Q_pid)         â”‚ â”‚
         â”‚                             â”‚  â”‚     with key_purpose = "PID"     â”‚ â”‚
         â”‚                             â”‚  â”‚                                  â”‚ â”‚
         â”‚                             â”‚  â”‚  5. Link to WUA key (same        â”‚ â”‚
         â”‚                             â”‚  â”‚     partition = proof of assoc)  â”‚ â”‚
         â”‚                             â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
         â”‚                             â”‚                 â”‚                    â”‚
         â”‚ 6. Return (pid_key_handle,  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚
         â”‚           PID_pub_key)      â”‚                                      â”‚
         â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                                      â”‚
         â”‚                             â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Crypto Operation:
1. WSCA requests new key pair for PID purpose
2. WSCD generates: (PID_priv_key, PID_pub_key) in user's HSM partition
   - Algorithm: ECDSA P-256 or P-384
   - Key bound to this user's partition
3. WSCD stores key with association to WUA key
4. WSCD returns key handle and PID_pub_key

Security Properties (Remote HSM):
- PID_priv_key never leaves HSM
- Key in same HSM partition as WUA key
- Proof of Association: Both keys in same partition
- Key handle only usable with valid user session
```

#### Step 13: Proof of Possession (PoP)

```
PoP JWT Structure:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Header:
{
  "alg": "ES256",
  "typ": "openid4vci-proof+jwt",
  "jwk": {                    // PID_pub_key
    "kty": "EC",
    "crv": "P-256",
    "x": "...",
    "y": "..."
  }
}

Payload:
{
  "iss": "<wallet_unit_id>",
  "aud": "<pid_provider_id>",
  "iat": 1701234567,
  "nonce": "<c_nonce from step 11>"
}

Signature:
ECDSA.Sign(PID_priv_key, Base64URL(header) || "." || Base64URL(payload))
```

#### Step 16: PID Signing (Provider Side)

```
Maria's mDL Creation (mdoc format):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
1. Construct IssuerSignedItem for each attribute:
   - digestID: unique identifier
   - random: 32 bytes entropy
   - elementIdentifier: attribute name (e.g., "family_name")
   - elementValue: attribute value (e.g., "GarcÃ­a")

2. Compute digest for each item:
   digest = SHA-256(CBOR.encode(IssuerSignedItem))

3. Construct Mobile Security Object (MSO):
   MSO = {
     "version": "1.0",
     "digestAlgorithm": "SHA-256",
     "docType": "org.iso.18013.5.1.mDL",
     "valueDigests": {
       "org.iso.18013.5.1": {         // mDL namespace
         0: <digest_family_name>,
         1: <digest_given_name>,
         ...
       },
       "eu.europa.ec.eudi.pid.1": {    // PID namespace
         10: <digest_age_over_18>,
         ...
       }
     },
     "deviceKeyInfo": {
       "deviceKey": <mDL_pub_key as COSE_Key>  // Maria's key in HSM
     },
     "validityInfo": {
       "signed": "2024-11-20T10:00:00Z",
       "validFrom": "2024-11-20T00:00:00Z",
       "validUntil": "2029-11-20T23:59:59Z"
     }
   }

4. Sign MSO:
   IssuerAuth = COSE_Sign1(MSO, MVA_priv_key)

Crypto Operation (MVA side):
- Algorithm: ECDSA P-256 (ES256)
- Key: MVA's signing key (from Access Certificate chain)
- Signature over: CBOR-encoded MSO
```

### 4.5 UC1 Security Considerations

```
Security Properties Achieved in UC1:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

1. Identity Binding:
   â€¢ Maria authenticated at LoA High via national eID
   â€¢ Identity verified against authoritative source (eID system)
   â€¢ Driving record retrieved from MVA database

2. Key Binding:
   â€¢ mDL bound to key in Maria's HSM partition
   â€¢ Private key never leaves HSM
   â€¢ Key attestation proves HSM properties

3. Issuer Authenticity:
   â€¢ MVA signs mDL with key from Access Certificate
   â€¢ Certificate chain verifiable via Trusted List
   â€¢ mDL signature cryptographically verifiable

4. Non-Transferability:
   â€¢ mDL only usable by Maria (requires her HSM key)
   â€¢ Device binding proof required for each presentation
   â€¢ User authentication required for signature
```

---

## Part 4b: Attestation Issuance - UC2: University Diploma

This section details **Use Case 2: Maria obtains her University Diploma attestation** as a PuB-EAA from State University.

### 4b.1 Use Case Context (UC2)

```
UC2: University Diploma Attestation
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Scenario: Maria graduated from State University with a Master's degree in
Computer Science. She wants to add her diploma to her EUDI Wallet for use
in job applications and bank account opening.

Actors:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Maria (Citizen)          - EUDI Wallet user, university graduate       â”‚
â”‚  State University         - PuB-EAA Provider (public body)              â”‚
â”‚  Ministry of Education    - Authentic Source (student records)          â”‚
â”‚  Wallet Provider          - Operates Remote HSM                         â”‚
â”‚  Remote HSM               - Stores Maria's cryptographic keys           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Prerequisites:
â€¢ Maria has a valid mDL/PID in her Wallet (from UC1)
â€¢ Maria graduated from State University (records in Ministry database)
â€¢ State University is registered as PuB-EAA Provider
â€¢ State University can query Ministry of Education as Authentic Source

Attestation Type: PuB-EAA (Public Body Electronic Attestation of Attributes)
- Issued by public body (university)
- Based on authentic source (ministry records)
- Signed with qualified certificate

Outcome:
â€¢ Maria receives her diploma attestation in SD-JWT format
â€¢ Diploma bound to a key in her HSM partition
â€¢ Diploma contains: degree, field of study, graduation date, institution
```

### 4b.2 Diploma Attestation Structure

```
Maria's Diploma Attestation (SD-JWT VC):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

SD-JWT Structure:
<Issuer-signed JWT>~<Disclosure_1>~<Disclosure_2>~...~<Disclosure_n>

Issuer-signed JWT Payload (with selective disclosure):
{
  "iss": "https://uni.edu.es",
  "sub": "<wallet_unit_id>",
  "iat": 1732100000,
  "exp": 1795172000,                    // 2 years validity
  "vct": "eu.europa.ec.eudi.diploma.1",
  "cnf": {
    "jwk": {                            // Maria's diploma key in HSM
      "kty": "EC",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  },

  // Selectively disclosable claims (hashed in JWT, revealed in Disclosures)
  "_sd": [
    "<hash of family_name disclosure>",
    "<hash of given_name disclosure>",
    "<hash of degree_type disclosure>",
    "<hash of degree_field disclosure>",
    "<hash of graduation_date disclosure>",
    "<hash of institution_name disclosure>",
    "<hash of diploma_number disclosure>",
    "<hash of honors disclosure>"
  ],

  // Always disclosed (not selective)
  "issuing_country": "ES",
  "issuing_authority": "State University",
  "credential_type": "UniversityDiploma"
}

Disclosures (Base64URL encoded):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Disclosure 1: ["salt1", "family_name", "GarcÃ­a"]                        â”‚
â”‚ Disclosure 2: ["salt2", "given_name", "MarÃ­a Elena"]                    â”‚
â”‚ Disclosure 3: ["salt3", "degree_type", "Master of Science"]             â”‚
â”‚ Disclosure 4: ["salt4", "degree_field", "Computer Science"]             â”‚
â”‚ Disclosure 5: ["salt5", "graduation_date", "2023-06-15"]                â”‚
â”‚ Disclosure 6: ["salt6", "institution_name", "State University"]         â”‚
â”‚ Disclosure 7: ["salt7", "diploma_number", "MSC-2023-12345"]             â”‚
â”‚ Disclosure 8: ["salt8", "honors", "Cum Laude"]                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 4b.3 Diploma Issuance Protocol (OpenID4VCI) - UC2 Flow

```
UC2: Maria's Diploma Attestation Issuance:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Maria's  â”‚     â”‚  Remote  â”‚     â”‚    State     â”‚     â”‚  Ministry    â”‚     â”‚ Student  â”‚
â”‚  Wallet  â”‚     â”‚   HSM    â”‚     â”‚  University  â”‚     â”‚    of        â”‚     â”‚ Records  â”‚
â”‚ Instance â”‚     â”‚          â”‚     â”‚ (PuB-EAA)    â”‚     â”‚ Education    â”‚     â”‚   DB     â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 1: DISCOVERY & AUTHORIZATION
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 1. Maria selects "Add Diploma" in Wallet              â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 2. GET /.well-known/openid-credential-issuer          â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 3. Credential Issuer Metadata     â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚   {                               â”‚                    â”‚                  â”‚
     â”‚     credential_issuer: "https://uni.edu.es",          â”‚                  â”‚
     â”‚     credentials_supported: [{                          â”‚                  â”‚
     â”‚       format: "vc+sd-jwt",                             â”‚                  â”‚
     â”‚       vct: "eu.europa.ec.eudi.diploma.1"              â”‚                  â”‚
     â”‚     }]                            â”‚                    â”‚                  â”‚
     â”‚   }                               â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 4. POST /par + WUA + WUA_PoP      â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 5. Authorization Response         â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 2: IDENTITY VERIFICATION (using existing PID)
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 6. University requests PID presentation               â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚   (OpenID4VP embedded in flow)    â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 7. Maria approves PID disclosure  â”‚                    â”‚                  â”‚
     â”‚    (name, birth_date)             â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 8. Sign device binding proof      â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚ Sign(mDL_priv, session_transcript)   â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 9. Present PID (mDL) + device binding                 â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 10. Verify PID:    â”‚                  â”‚
     â”‚                â”‚                  â”‚    - MVA signature â”‚                  â”‚
     â”‚                â”‚                  â”‚    - Device bindingâ”‚                  â”‚
     â”‚                â”‚                  â”‚    - Extract identity                â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 3: AUTHENTIC SOURCE VERIFICATION
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 11. Query student records            â”‚
     â”‚                â”‚                  â”‚    (name: "GarcÃ­a, MarÃ­a Elena",     â”‚
     â”‚                â”‚                  â”‚     DOB: "1990-03-15")               â”‚
     â”‚                â”‚                  â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚ 12. Query DB     â”‚
     â”‚                â”‚                  â”‚                    â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚ 13. Return       â”‚
     â”‚                â”‚                  â”‚                    â”‚     records      â”‚
     â”‚                â”‚                  â”‚                    â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 14. Confirmed graduate               â”‚
     â”‚                â”‚                  â”‚    (degree, field, date, honors)     â”‚
     â”‚                â”‚                  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 4: CREDENTIAL ISSUANCE
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 15. Authorization Code            â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 16. POST /token                   â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 17. Token Response (access_token, c_nonce)            â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 18. Generate diploma key pair     â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚ KeyGen(P-256, "diploma")              â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 19. Create PoP (signed by diploma_priv_key)           â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                  â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 20. POST /credentials + PoP       â”‚                    â”‚                  â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚ 21. Create SD-JWT VC:                â”‚
     â”‚                â”‚                  â”‚    - Add diploma attributes          â”‚
     â”‚                â”‚                  â”‚    - Create disclosures              â”‚
     â”‚                â”‚                  â”‚    - Bind to diploma_pub_key         â”‚
     â”‚                â”‚                  â”‚    - Sign with University key        â”‚
     â”‚                â”‚                  â”‚      (qualified certificate)         â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 22. Credential Response (SD-JWT)  â”‚                    â”‚                  â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
     â”‚ 23. Store diploma in Wallet       â”‚                    â”‚                  â”‚
     â”‚                â”‚                  â”‚                    â”‚                  â”‚
```

### 4b.4 Key Cryptographic Operations (UC2)

#### PID Presentation for Identity Verification (Step 9)

```
Using mDL to Prove Identity to University:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Maria's Wallet presents her mDL/PID to prove she is the graduate:

Selective Disclosure (mDL):
- Disclose: family_name, given_name, birth_date
- Withhold: address, portrait, driving_privileges (not needed)

Device Binding (in Remote HSM):
1. University provides nonce in authorization request
2. Wallet constructs DeviceAuthenticationBytes
3. HSM signs with mDL_priv_key:
   sig = ECDSA.Sign(mDL_priv_key, DeviceAuthenticationBytes)
4. Include signature in presentation

University Verification:
1. Verify MVA signature on mDL
2. Verify device binding signature (proves Maria controls mDL key)
3. Extract identity (name, DOB) for matching with student records
```

#### SD-JWT Creation with Selective Disclosure (Step 21)

```
University Creates Diploma SD-JWT:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

1. For each attribute, create a Disclosure:
   Disclosure = Base64URL(JSON([salt, claim_name, claim_value]))

   Example:
   ["Xy4fK9", "degree_type", "Master of Science"]
   â†’ Base64URL â†’ "WyJYeTRmSzkiLCAiZGVncmVlX3R5cGUiLCAiTWFzdGVyIG9mIFNjaWVuY2UiXQ"

2. Compute hash of each Disclosure:
   hash = Base64URL(SHA-256(Disclosure))

3. Include hashes in "_sd" array in JWT payload

4. Sign JWT:
   Header: {"alg": "ES256", "typ": "vc+sd-jwt", "kid": "<university_key_id>"}
   Payload: (as shown in 4b.2)
   Signature: ECDSA.Sign(university_priv_key, header || "." || payload)

5. Concatenate: <JWT>~<Disclosure_1>~<Disclosure_2>~...~<Disclosure_n>
```

### 4b.5 UC2 Security Considerations

```
Security Properties Achieved in UC2:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

1. Graduate Verification:
   â€¢ Maria proved identity via PID presentation
   â€¢ University verified against Ministry records (Authentic Source)
   â€¢ Diploma linked to real graduate, not just PID holder

2. Selective Disclosure:
   â€¢ Maria can later present only needed attributes
   â€¢ E.g., prove "has Master's degree" without revealing exact field
   â€¢ Each disclosure has unique salt (unlinkability)

3. PuB-EAA Properties:
   â€¢ Signed by public body (State University)
   â€¢ Based on authentic source (Ministry of Education)
   â€¢ University uses qualified certificate for signing
   â€¢ Verifiable via Trusted List

4. Key Binding:
   â€¢ Diploma bound to separate key from mDL
   â€¢ Both keys in same HSM partition (Proof of Association possible)
   â€¢ Non-transferable (requires Maria's HSM key)
```

---

## Part 5: Attestation Presentation Flow - UC4: Bank Account Opening

This section details **Use Case 4: Maria opens a bank account** by presenting both her PID (mDL) and Diploma attestation to EuroBank.

### 5.1 Use Case Context (UC4)

```
UC4: Bank Account Opening with Combined Presentation
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Scenario: Maria wants to open a premium account at EuroBank. The bank requires:
- Identity verification (PID) for KYC compliance
- Education verification (Diploma) for premium account eligibility

Actors:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Maria (Citizen)          - EUDI Wallet user                            â”‚
â”‚  EuroBank                 - Relying Party (financial institution)       â”‚
â”‚  Wallet Provider          - Operates Remote HSM                         â”‚
â”‚  Remote HSM               - Signs device binding proofs                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Prerequisites:
â€¢ Maria has mDL/PID (from UC1) and Diploma (from UC2) in her Wallet
â€¢ EuroBank is registered as Relying Party in Trust Framework
â€¢ EuroBank holds valid RP Access Certificate
â€¢ EuroBank registration specifies allowed attributes

Outcome:
â€¢ Maria presents both credentials with selective disclosure
â€¢ EuroBank verifies both issuers and device bindings
â€¢ KYC requirements satisfied, premium account opened
```

### 5.2 Remote Presentation (OpenID4VP) - UC4 Flow

```
UC4: Maria Opens Bank Account:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Maria's  â”‚     â”‚  Remote  â”‚     â”‚              EuroBank                     â”‚
â”‚  Wallet  â”‚     â”‚   HSM    â”‚     â”‚  (Relying Party - Financial Institution) â”‚
â”‚ Instance â”‚     â”‚          â”‚     â”‚                                          â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     â”‚                â”‚                                â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 1: AUTHORIZATION REQUEST
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                                â”‚
     â”‚ 1. Maria clicks "Open Account" on EuroBank website/app               â”‚
     â”‚                â”‚                                â”‚
     â”‚ 2. Authorization Request (OpenID4VP)            â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
     â”‚   {                                             â”‚
     â”‚     response_type: "vp_token",                  â”‚
     â”‚     client_id: "https://eurobank.eu",           â”‚
     â”‚     client_id_scheme: "x509_san_dns",           â”‚
     â”‚     nonce: "n-0S6_WzA2Mj",                      â”‚
     â”‚     response_mode: "direct_post",               â”‚
     â”‚     response_uri: "https://eurobank.eu/wallet/response",             â”‚
     â”‚     presentation_definition: {                  â”‚
     â”‚       id: "premium_account_opening",            â”‚
     â”‚       input_descriptors: [                      â”‚
     â”‚         {                                       â”‚
     â”‚           id: "pid_identity",                   â”‚
     â”‚           name: "Identity Verification",        â”‚
     â”‚           purpose: "KYC compliance",            â”‚
     â”‚           format: {"mso_mdoc": {}},             â”‚
     â”‚           constraints: {                        â”‚
     â”‚             fields: [                           â”‚
     â”‚               {path: ["$.family_name"], intent_to_retain: true},     â”‚
     â”‚               {path: ["$.given_name"], intent_to_retain: true},      â”‚
     â”‚               {path: ["$.birth_date"], intent_to_retain: true},      â”‚
     â”‚               {path: ["$.resident_address"], intent_to_retain: true},â”‚
     â”‚               {path: ["$.portrait"], intent_to_retain: false}        â”‚
     â”‚             ]                                   â”‚
     â”‚           }                                     â”‚
     â”‚         },                                      â”‚
     â”‚         {                                       â”‚
     â”‚           id: "diploma_education",              â”‚
     â”‚           name: "Education Verification",       â”‚
     â”‚           purpose: "Premium account eligibility",                    â”‚
     â”‚           format: {"vc+sd-jwt": {}},            â”‚
     â”‚           constraints: {                        â”‚
     â”‚             fields: [                           â”‚
     â”‚               {path: ["$.degree_type"]},        â”‚
     â”‚               {path: ["$.institution_name"]}    â”‚
     â”‚             ]                                   â”‚
     â”‚           }                                     â”‚
     â”‚         }                                       â”‚
     â”‚       ]                                         â”‚
     â”‚     }                                           â”‚
     â”‚   }                                             â”‚
     â”‚                â”‚                                â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 2: WALLET AUTHENTICATES RP
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                                â”‚
     â”‚ 3. Wallet verifies EuroBank:                    â”‚
     â”‚    a. Extract Access Certificate from request   â”‚
     â”‚    b. Build certificate chain to Access CA root â”‚
     â”‚    c. Verify chain signatures                   â”‚
     â”‚    d. Check certificate revocation (OCSP/CRL)   â”‚
     â”‚    e. Verify EuroBank is registered as RP       â”‚
     â”‚    f. Check requested attributes are in EuroBank's registration      â”‚
     â”‚                â”‚                                â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 3: USER CONSENT
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                                â”‚
     â”‚ 4. Display consent screen to Maria:             â”‚
     â”‚    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
     â”‚    â”‚  EuroBank requests:                      â”‚ â”‚
     â”‚    â”‚                                          â”‚ â”‚
     â”‚    â”‚  From your Driver's License (mDL):       â”‚ â”‚
     â”‚    â”‚  â˜‘ Family name: GarcÃ­a                  â”‚ â”‚
     â”‚    â”‚  â˜‘ Given name: MarÃ­a Elena              â”‚ â”‚
     â”‚    â”‚  â˜‘ Birth date: 1990-03-15               â”‚ â”‚
     â”‚    â”‚  â˜‘ Address: Calle Mayor 42, Madrid      â”‚ â”‚
     â”‚    â”‚  â˜‘ Portrait (one-time, not stored)      â”‚ â”‚
     â”‚    â”‚                                          â”‚ â”‚
     â”‚    â”‚  From your University Diploma:           â”‚ â”‚
     â”‚    â”‚  â˜‘ Degree type: Master of Science       â”‚ â”‚
     â”‚    â”‚  â˜‘ Institution: State University        â”‚ â”‚
     â”‚    â”‚                                          â”‚ â”‚
     â”‚    â”‚  Purpose: Open premium bank account      â”‚ â”‚
     â”‚    â”‚                                          â”‚ â”‚
     â”‚    â”‚  [Approve]  [Decline]                   â”‚ â”‚
     â”‚    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
     â”‚                â”‚                                â”‚
     â”‚ 5. Maria approves and authenticates (biometric/PIN)                  â”‚
     â”‚                â”‚                                â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 4: GENERATE PRESENTATION (with HSM)
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                                â”‚
     â”‚ 6. Create mDL device binding proof              â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                                â”‚
     â”‚                â”‚                                â”‚
     â”‚                â”‚ Construct DeviceAuthenticationBytes:               â”‚
     â”‚                â”‚ ["DeviceAuthentication", SessionTranscript,        â”‚
     â”‚                â”‚  "org.iso.18013.5.1.mDL", DeviceNameSpacesBytes]   â”‚
     â”‚                â”‚                                â”‚
     â”‚                â”‚ Sign: ECDSA.Sign(mDL_priv_key, DeviceAuthBytes)    â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                                â”‚
     â”‚                â”‚                                â”‚
     â”‚ 7. Create diploma key binding JWT               â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚                                â”‚
     â”‚                â”‚                                â”‚
     â”‚                â”‚ KB-JWT:                        â”‚
     â”‚                â”‚ {iat, aud: "eurobank.eu", nonce, sd_hash}          â”‚
     â”‚                â”‚ Sign: ECDSA.Sign(diploma_priv_key, KB-JWT)         â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚                                â”‚
     â”‚                â”‚                                â”‚
     â”‚ 8. Construct VP Token:                          â”‚
     â”‚    {                                            â”‚
     â”‚      "vp_token": [                              â”‚
     â”‚        <mDL mdoc with device signature>,        â”‚
     â”‚        <Diploma SD-JWT with KB-JWT>             â”‚
     â”‚      ],                                         â”‚
     â”‚      "presentation_submission": {               â”‚
     â”‚        "id": "submission_1",                    â”‚
     â”‚        "definition_id": "premium_account_opening",                   â”‚
     â”‚        "descriptor_map": [                      â”‚
     â”‚          {"id": "pid_identity", "format": "mso_mdoc", "path": "$[0]"},
     â”‚          {"id": "diploma_education", "format": "vc+sd-jwt", "path": "$[1]"}
     â”‚        ]                                        â”‚
     â”‚      }                                          â”‚
     â”‚    }                                            â”‚
     â”‚                â”‚                                â”‚
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                         PHASE 5: SUBMIT & VERIFICATION
     â”‚ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     â”‚                â”‚                                â”‚
     â”‚ 9. POST /wallet/response                        â”‚
     â”‚    (vp_token + presentation_submission)         â”‚
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
     â”‚                â”‚                                â”‚
     â”‚                â”‚                 10. EuroBank verifies presentation:
     â”‚                â”‚                                â”‚
     â”‚                â”‚                 mDL Verification:
     â”‚                â”‚                 a. Verify MVA issuer signature (COSE)
     â”‚                â”‚                 b. Check MVA in Trusted List
     â”‚                â”‚                 c. Verify device binding signature
     â”‚                â”‚                 d. Verify mDL not expired
     â”‚                â”‚                 e. Check mDL revocation status
     â”‚                â”‚                                â”‚
     â”‚                â”‚                 Diploma Verification:
     â”‚                â”‚                 f. Verify University signature (JWT)
     â”‚                â”‚                 g. Check University in Trusted List
     â”‚                â”‚                 h. Verify KB-JWT signature
     â”‚                â”‚                 i. Verify sd_hash matches SD-JWT
     â”‚                â”‚                 j. Verify Diploma not expired
     â”‚                â”‚                                â”‚
     â”‚                â”‚                 Cross-Verification:
     â”‚                â”‚                 k. Match name from mDL and Diploma
     â”‚                â”‚                 l. Verify both presentations use same nonce
     â”‚                â”‚                                â”‚
     â”‚ 11. Verification successful, account created    â”‚
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
     â”‚                â”‚                                â”‚
     â”‚    Maria can now access her premium EuroBank account               â”‚
     â”‚                â”‚                                â”‚
```

     â”‚  }
     â”‚                     â”‚
     â”‚ 3. Wallet authenticates RP
     â”‚    - Verify Access Certificate
     â”‚    - Check RP registration
     â”‚                     â”‚
     â”‚ 4. Display to User:
     â”‚    - RP identity
     â”‚    - Requested attributes
     â”‚    - Purpose (from registration)
     â”‚                     â”‚
     â”‚ 5. User approves + authenticates â”‚
     â”‚    (biometric/PIN)               â”‚
     â”‚                     â”‚
     â”‚ 6. Generate VP Token:
     â”‚    - Select disclosed attributes
     â”‚    - Create device binding proof
     â”‚    - Package response
     â”‚                     â”‚
     â”‚ 7. Authorization Response
     â”‚    (vp_token + presentation_submission)
     â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
     â”‚                     â”‚
     â”‚                     â”‚ 8. Verify presentation:
     â”‚                     â”‚    - Issuer signature
     â”‚                     â”‚    - Device binding
     â”‚                     â”‚    - Revocation status
     â”‚                     â”‚
     â”‚ 9. Service access granted
     â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
     â”‚                     â”‚

```

### 5.2 Device Binding (mdoc Authentication) - Remote HSM

```

Device Binding Proof (mdoc) with Remote HSM:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
The Wallet proves possession of PID_priv_key by requesting
the Remote HSM to sign the SessionTranscript.

SessionTranscript = [
DeviceEngagementBytes, // or null for remote
EReaderKeyBytes, // RP ephemeral public key
Handover // Protocol-specific data
]

Flow with Remote HSM:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Wallet â”‚ â”‚ Remote HSM â”‚
â”‚ Instance â”‚ â”‚ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ â”‚
â”‚ 1. User approves presentation â”‚
â”‚ (biometric/PIN on device) â”‚
â”‚ â”‚
â”‚ 2. Construct DeviceAuthenticationBytes: â”‚
â”‚ ["DeviceAuthentication", â”‚
â”‚ SessionTranscript, â”‚
â”‚ docType, â”‚
â”‚ DeviceNameSpacesBytes] â”‚
â”‚ â”‚
â”‚ 3. Sign request â”‚
â”‚ (pid_key_handle, hash, user_auth_token) â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
â”‚ â”‚
â”‚ 4. WSCA validates user_auth
â”‚ 5. WSCD signs with PID_priv_key:
â”‚ sig = ECDSA.Sign(d_pid, hash)
â”‚ â”‚
â”‚ 6. Return COSE_Sign1 signature â”‚
â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ â”‚
â”‚ 7. Construct DeviceAuthentication: â”‚
â”‚ { â”‚
â”‚ "deviceSignature": COSE_Sign1( â”‚
â”‚ payload: DeviceAuthenticationBytes, â”‚
â”‚ signature: <from HSM> â”‚
â”‚ ) â”‚
â”‚ } â”‚
â”‚ â”‚

COSE_Sign1 Structure:

- Protected header: {"alg": "ES256"}
- Payload: DeviceAuthenticationBytes
- Signature: (r, s) from Remote HSM

Crypto Operation (in Remote HSM WSCD):

1. User auth token validated by WSCA
2. WSCD retrieves PID_priv_key from user's partition
3. WSCD computes: sig = ECDSA.Sign(PID_priv_key, hash(DeviceAuthenticationBytes))
4. WSCD returns signature (r, s)

```

### 5.3 Selective Disclosure (SD-JWT) with Remote HSM

```

SD-JWT Selective Disclosure with Remote HSM:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Original SD-JWT (from issuance):
<Issuer-signed JWT>~<Disclosure_1>~<Disclosure_2>~...~<Disclosure_n>

Each Disclosure:
Base64URL([salt, claim_name, claim_value])

For Presentation (selective):
<Issuer-signed JWT>~<Disclosure_2>~<Disclosure_5>~<KB-JWT>

KB-JWT (Key Binding JWT) Creation with Remote HSM:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Wallet â”‚ â”‚ Remote HSM â”‚
â”‚ Instance â”‚ â”‚ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ â”‚
â”‚ 1. Construct KB-JWT payload: â”‚
â”‚ { â”‚
â”‚ "iat": <timestamp>, â”‚
â”‚ "aud": "<RP_id>", â”‚
â”‚ "nonce": "<RP_nonce>", â”‚
â”‚ "sd_hash": SHA-256(<SD-JWT without KB>) â”‚
â”‚ } â”‚
â”‚ â”‚
â”‚ 2. Sign request â”‚
â”‚ (pid_key_handle, kb_jwt_hash, user_auth) â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
â”‚ â”‚
â”‚ 3. WSCA validates user
â”‚ 4. WSCD signs KB-JWT:
â”‚ sig = ECDSA.Sign(d_pid,
â”‚ hash(header.payload))
â”‚ â”‚
â”‚ 5. Return signature â”‚
â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ â”‚
â”‚ 6. Construct complete KB-JWT: â”‚
â”‚ Header: â”‚
â”‚ { â”‚
â”‚ "typ": "kb+jwt", â”‚
â”‚ "alg": "ES256" â”‚
â”‚ } â”‚
â”‚ Payload: (from step 1) â”‚
â”‚ Signature: (from step 5) â”‚
â”‚ â”‚
â”‚ 7. Final SD-JWT for presentation: â”‚
â”‚ <Issuer-JWT>~<Disclosure_2>~<Disclosure_5>~<KB-JWT>
â”‚ â”‚

Crypto Operations:

1. sd_hash = SHA-256 computed locally in Wallet Instance
2. KB-JWT signature created in Remote HSM WSCD
3. Only selected Disclosures included (privacy)

```

### 5.4 Proximity Presentation (ISO 18013-5)

```

Proximity Presentation Flow (NFC/BLE):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Wallet â”‚ NFC/BLE â”‚ mdoc â”‚
â”‚ (Holder)â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ Reader â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ â”‚
â”‚ 1. Device Engagement â”‚
â”‚ (QR code or NFC tap) â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
â”‚ â”‚
â”‚ 2. Session Establishment â”‚
â”‚ (HKDF key derivation) â”‚
â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
â”‚ â”‚
â”‚ 3. mdoc Request â”‚
â”‚ (encrypted with session key) â”‚
â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ â”‚
â”‚ 4. User consent â”‚
â”‚ â”‚
â”‚ 5. mdoc Response â”‚
â”‚ (encrypted with session key) â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
â”‚ â”‚

Session Key Derivation:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

1. Wallet generates ephemeral EC key pair (wallet_eph)
2. Reader generates ephemeral EC key pair (reader_eph)
3. ECDH shared secret: Z = wallet_eph_priv Ã— reader_eph_pub
4. Session keys = HKDF(Z, salt, info)
   - SKReader: Reader-to-Wallet encryption key
   - SKDevice: Wallet-to-Reader encryption key

Encryption:

- Algorithm: AES-GCM-256
- Each message encrypted with appropriate session key

```

---

## Part 6: Qualified Electronic Signature (QES) Flow

### 6.1 Remote QES Architecture

```

Remote QES Components:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ EUDI Wallet Unit â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Signature Creation Application (SCA) â”‚ â”‚
â”‚ â”‚ - Hash computation â”‚ â”‚
â”‚ â”‚ - Signature request orchestration â”‚ â”‚
â”‚ â”‚ - User consent management â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚
â”‚ CSC API v2.0
â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ QTSP (Remote Signing Service) â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Authorization â”‚ â”‚ Signature â”‚ â”‚ Remote â”‚ â”‚
â”‚ â”‚ Server â”‚ â”‚ Server â”‚ â”‚ QSCD/HSM â”‚ â”‚
â”‚ â”‚ (OAuth 2.0) â”‚ â”‚ (CSC API) â”‚ â”‚ â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”‚ â”‚ â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

```

### 6.2 Remote QES Flow (Wallet-Centric Model)

```

Remote QES Signing Flow:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Relying â”‚ â”‚ Wallet â”‚ â”‚ QTSP â”‚ â”‚ Remote â”‚
â”‚ Party â”‚ â”‚ Unit â”‚ â”‚ â”‚ â”‚ QSCD â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
â”‚ â”‚ â”‚ â”‚
â”‚ 1. Request signature â”‚ â”‚
â”‚ (document to sign) â”‚ â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 2. Get credential info â”‚
â”‚ â”‚ (CSC: /credentials/info) â”‚
â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 3. Credential metadata â”‚
â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 4. Compute document hash â”‚
â”‚ â”‚ hash = SHA-256(document) â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 5. Authorize signature â”‚
â”‚ â”‚ (CSC: oauth2/authorize) â”‚
â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 6. OID4VP: Request PID â”‚
â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 7. User presents PID â”‚
â”‚ â”‚ (+ transaction data consent) â”‚
â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ 8. Issue short-lived
â”‚ â”‚ â”‚ qualified certificate
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 9. Authorization code â”‚
â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 10. Token request â”‚
â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 11. Access token â”‚
â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 12. Sign hash request â”‚
â”‚ â”‚ (CSC: /signatures/signHash) â”‚
â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ 13. Sign in QSCD
â”‚ â”‚ â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ 14. Signature â”‚
â”‚ â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 15. Return signature â”‚
â”‚ â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚
â”‚ â”‚ â”‚ â”‚
â”‚ â”‚ 16. Embed signature in documentâ”‚
â”‚ â”‚ â”‚ â”‚
â”‚ 17. Signed document â”‚ â”‚
â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚ â”‚ â”‚
â”‚ â”‚ â”‚ â”‚

```

### 6.3 QES Cryptographic Operations

#### Step 4: Document Hash Computation

```

Document Hash (in SCA):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Input: Document bytes (PDF, XML, etc.)
Output: Hash digest

Algorithm:

1. Prepare document for signing (per format spec)
   - PDF: Compute ByteRange hash
   - XAdES: Canonicalize XML
2. hash = SHA-256(prepared_document)
3. Encode hash for CSC API

Crypto Operation:

- Algorithm: SHA-256 (or SHA-384/512)
- Output: 32 bytes (256 bits)

```

#### Step 7: Transaction Data Signing

```

Transaction Data in QES Authorization:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
The user must explicitly consent to sign specific content.

Transaction Data Structure:
{
"document_name": "Contract_2025.pdf",
"document_hash": "SHA256:abc123...",
"signature_time": "2025-12-08T10:30:00Z",
"dtbs": "<hash of document to be signed>"
}

User sees and approves:

- Document identifier
- Hash of document content
- Timestamp of signature request

```

#### Step 13: Remote Signature Creation (in QSCD)

```

Signature Creation (Remote HSM):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Input: hash (from wallet)
Signing key (in HSM)
Output: Digital signature

Crypto Operation (inside HSM):

1. Retrieve private key for user
2. Perform PKCS#1 padding (for RSA) or direct sign (for ECDSA)
3. sig = Sign(private_key, padded_hash)
   - RSA-PSS: sig = RSA_PSS_Sign(priv, hash)
   - ECDSA: (r, s) = ECDSA_Sign(priv, hash)
4. Return signature bytes

Certificate Association:

- Signature linked to qualified certificate
- Certificate contains user identity from PID
- Short-lived certificate (valid for single use)

```

---

## Part 7: Trust Infrastructure

### 7.1 Access Certificate Hierarchy

```

Access Certificate Trust Chain:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ EU Trusted List (LOTL) â”‚
â”‚ (List of national Trusted Lists) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â–¼ â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ MS Trusted â”‚ â”‚ MS Trusted â”‚
â”‚ List (DE) â”‚ â”‚ List (FR) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ â”‚
â–¼ â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Access CA â”‚ â”‚ Access CA â”‚
â”‚ Root (DE) â”‚ â”‚ Root (FR) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ â”‚
â–¼ â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Access Cert â”‚ â”‚ Access Cert â”‚
â”‚ (Provider/RP) â”‚ â”‚ (Provider/RP) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

```

### 7.2 Access Certificate Structure

```

Access Certificate (X.509v3):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Subject:
CN = <Entity name>
O = <Organization>
C = <Country>

Extensions:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ KeyUsage: digitalSignature â”‚
â”‚ ExtendedKeyUsage: (TBD - EUDI-specific OIDs) â”‚
â”‚ SubjectAltName: URI:<entity_identifier> â”‚
â”‚ CertificatePolicies: <EUDI policy OID> â”‚
â”‚ â”‚
â”‚ EUDI-specific extensions: â”‚
â”‚ - Entity type (PID Provider, QEAA Provider, RP, etc.) â”‚
â”‚ - Registered attributes (for RPs) â”‚
â”‚ - Attestation types (for Providers) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Signed by: Access CA
Validity: Typically 1-2 years

```

### 7.3 Relying Party Authentication

```

RP Authentication Flow (Remote):
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Wallet â”‚ â”‚ Relying â”‚
â”‚ Unit â”‚ â”‚ Party â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ â”‚
â”‚ 1. Authorization Request â”‚
â”‚ + RP Access Certificate â”‚
â”‚ + Registration Certificate â”‚
â”‚â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ â”‚
â”‚ 2. Verify Access Certificate: â”‚
â”‚ a. Build cert chain to â”‚
â”‚ Access CA root â”‚
â”‚ b. Verify each signature â”‚
â”‚ c. Check revocation (OCSP/CRL)â”‚
â”‚ d. Validate certificate â”‚
â”‚ policies â”‚
â”‚ â”‚
â”‚ 3. Verify Registration Cert: â”‚
â”‚ a. Check RP is registered â”‚
â”‚ b. Verify registered â”‚
â”‚ attributes match request â”‚
â”‚ â”‚
â”‚ 4. Display RP info to User â”‚
â”‚ â”‚

Crypto Operations (Wallet):

1. Signature verification: ECDSA.Verify(CA_pub, cert_signature)
2. Chain validation: Repeat for each cert in chain
3. OCSP stapling verification (if present)

```

---

## Part 8: Revocation Mechanisms

### 8.1 Attestation Revocation Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Status List 2021** | Bitstring-based status | High-volume, privacy-preserving |
| **OCSP** | Online Certificate Status Protocol | Real-time check |
| **CRL** | Certificate Revocation List | Batch updates |
| **Short-lived attestations** | No revocation needed | Privacy-first approach |

### 8.2 Status List Verification

```

Status List 2021 Flow:
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Attestation contains:
{
"status": {
"idx": 12345,
"uri": "https://provider.eu/status/list1"
}
}

Verification:

1. Fetch status list from URI
2. Decompress bitstring (GZIP)
3. Check bit at index 12345
4. If bit = 0: Valid
   If bit = 1: Revoked

Crypto: Status list is signed by Provider

```

---

## Part 9: Educational Module Structure

### 9.1 Proposed Module Breakdown

| Module | Title | Duration | Prerequisites |
|--------|-------|----------|---------------|
| **M1** | Introduction to EUDI Wallet Ecosystem | 45 min | None |
| **M2** | Remote HSM Architecture (WSCA/WSCD) | 75 min | M1 |
| **M3** | Wallet Unit Attestation (WUA) with HSM | 60 min | M2 |
| **M4** | PID Issuance with OpenID4VCI | 90 min | M1, M3 |
| **M5** | Attestation Formats (mdoc & SD-JWT) | 60 min | M1 |
| **M6** | Remote Presentation (OpenID4VP) | 75 min | M4, M5 |
| **M7** | Proximity Presentation (ISO 18013-5) | 60 min | M5 |
| **M8** | Qualified Electronic Signatures (Remote QES) | 75 min | M4 |
| **M9** | Trust Infrastructure & PKI | 60 min | M1 |
| **M10** | Security Analysis & Threat Model | 90 min | All above |
| **M11** | Hands-on Lab: End-to-End Flows with HSM | 180 min | All above |

### 9.2 Learning Objectives per Module

#### Module 2: Remote HSM Architecture (WSCA/WSCD)
- Explain the Remote HSM architecture for EUDI Wallet
- Describe the communication model between Wallet Instance and HSM
- Identify WSCA functions (key management, user auth, crypto operations)
- Explain HSM certification requirements (FIPS 140-3, Common Criteria)
- Describe user partition model in multi-tenant HSM

#### Module 3: Wallet Unit Attestation (WUA) with HSM
- Describe the WUA structure and contents for Remote HSM model
- Walk through the WUA issuance flow with HSM key generation
- Explain HSM key attestation and its verification
- Identify the role of WUA in PID and attestation issuance

#### Module 4: PID Issuance
- Walk through the complete OpenID4VCI flow with Remote HSM
- Explain Proof of Possession (PoP) generation via HSM
- Describe key binding in mdoc and SD-JWT formats
- Identify LoA High requirements for identity verification
- Explain HSM key generation during issuance

#### Module 6: Remote Presentation
- Explain the OpenID4VP authorization request/response
- Demonstrate selective disclosure in SD-JWT with HSM signing
- Describe device binding proof generation via Remote HSM
- Implement Relying Party authentication verification

#### Module 8: Qualified Electronic Signatures (Remote QES)
- Describe the CSC API v2.0 signing flow
- Explain the role of short-lived qualified certificates
- Differentiate between wallet-centric and RP-centric models
- Identify QTSP requirements for remote QES
- Explain the relationship between Wallet HSM and QTSP HSM

---

## Part 10: Reference Test Data

### 10.1 Overview

This section provides reference test data conforming to the **ARF v2.4.0+ specifications** and official EUDI Wallet standards. All data structures follow:
- **PID Rule Book (Annex 3.1)** - ISO/IEC 18013-5 and SD-JWT VC formats
- **mDL Rule Book (Annex 3.2)** - ISO/IEC 18013-5 format only
- **OpenID4VCI v1.0** - Credential issuance protocol
- **OpenID4VP v1.0** - Credential presentation protocol
- **CSC API v2.0** - Remote signature creation

### 10.2 Test Persona: Maria Rossi

#### 10.2.1 Base Identity Data

```

Personal Information:
├─ Legal Name: Maria Lucia Rossi
├─ Name at Birth: Maria Lucia Bianchi
├─ Date of Birth: 1995-03-15
├─ Age: 30 years (as of 2025-12-08)
├─ Gender: Female (ISO/IEC 5218: 2)
├─ Nationality: IT (Italy)
│
├─ Place of Birth:
│ ├─ Country: IT
│ ├─ State/Region: Lazio
│ └─ City: Roma
│
└─ Current Residence:
├─ Full Address: Via Giuseppe Verdi 42, 00198 Roma RM, Italy
├─ Country: IT
├─ State: Lazio (RM)
├─ City: Roma
├─ Postal Code: 00198
├─ Street: Via Giuseppe Verdi
└─ House Number: 42

```

#### 10.2.2 Digital Identifiers

```

Wallet Identifiers:
├─ Wallet Instance ID: WI-IT-2024-8F3D92A1
├─ WUA Key ID: wua_key_c7b4e9f2a8d1
├─ HSM Partition: /hsm/users/maria.rossi@wallet.it
├─ User Activation Date: 2024-06-15T09:30:00Z
│
National Identifiers:
├─ Tax Code (Codice Fiscale): RSSMRL95C55H501B
├─ National Health Number: 1234567890123
├─ PID Document Number: IT-PID-2024-7891234
│
Credentials:
├─ University ID: UNIROMA-STU-20180915-4721
├─ Bank Account (IBAN): IT60X0542811101000000123456
└─ Mobile: +39 340 123 4567

````

### 10.3 Use Case 1: Driver's License (mDL) as PID

#### 10.3.1 PID Provider Information

```yaml
pid_provider:
  name: "Motorizzazione Civile - Dipartimento per i Trasporti"
  issuing_authority: "IT"
  issuing_country: "IT"
  issuing_jurisdiction: "IT-62"  # Lazio
  certificate_issuer: "CN=Italy PID Provider CA, O=Ministero dell'Interno, C=IT"
  trusted_list_url: "https://eidas.agid.gov.it/TL/TSL-IT.xml"
  authentication_method: "eIDAS LoA High (SPID Level 3)"
````

#### 10.3.2 PID Attributes (ISO/IEC 18013-5 Format)

```json
{
  "docType": "eu.europa.ec.eudi.pid.1",
  "namespace": "eu.europa.ec.eudi.pid.1",
  "issuerSigned": {
    "nameSpaces": {
      "eu.europa.ec.eudi.pid.1": [
        {
          "elementIdentifier": "family_name",
          "elementValue": "Rossi"
        },
        {
          "elementIdentifier": "given_name",
          "elementValue": "Maria Lucia"
        },
        {
          "elementIdentifier": "birth_date",
          "elementValue": "1995-03-15"
        },
        {
          "elementIdentifier": "age_over_18",
          "elementValue": true
        },
        {
          "elementIdentifier": "age_over_21",
          "elementValue": true
        },
        {
          "elementIdentifier": "age_in_years",
          "elementValue": 30
        },
        {
          "elementIdentifier": "age_birth_year",
          "elementValue": 1995
        },
        {
          "elementIdentifier": "family_name_birth",
          "elementValue": "Bianchi"
        },
        {
          "elementIdentifier": "given_name_birth",
          "elementValue": "Maria Lucia"
        },
        {
          "elementIdentifier": "birth_place",
          "elementValue": "Roma, Lazio, IT"
        },
        {
          "elementIdentifier": "birth_country",
          "elementValue": "IT"
        },
        {
          "elementIdentifier": "birth_state",
          "elementValue": "Lazio"
        },
        {
          "elementIdentifier": "birth_city",
          "elementValue": "Roma"
        },
        {
          "elementIdentifier": "resident_address",
          "elementValue": "Via Giuseppe Verdi 42, 00198 Roma RM, Italy"
        },
        {
          "elementIdentifier": "resident_country",
          "elementValue": "IT"
        },
        {
          "elementIdentifier": "resident_state",
          "elementValue": "Lazio"
        },
        {
          "elementIdentifier": "resident_city",
          "elementValue": "Roma"
        },
        {
          "elementIdentifier": "resident_postal_code",
          "elementValue": "00198"
        },
        {
          "elementIdentifier": "resident_street",
          "elementValue": "Via Giuseppe Verdi"
        },
        {
          "elementIdentifier": "resident_house_number",
          "elementValue": "42"
        },
        {
          "elementIdentifier": "gender",
          "elementValue": 2
        },
        {
          "elementIdentifier": "nationality",
          "elementValue": "IT"
        },
        {
          "elementIdentifier": "issuance_date",
          "elementValue": "2024-06-15T09:30:00Z"
        },
        {
          "elementIdentifier": "expiry_date",
          "elementValue": "2034-06-15T23:59:59Z"
        },
        {
          "elementIdentifier": "issuing_authority",
          "elementValue": "IT"
        },
        {
          "elementIdentifier": "document_number",
          "elementValue": "IT-PID-2024-7891234"
        },
        {
          "elementIdentifier": "administrative_number",
          "elementValue": "ADM-IT-2024-982736"
        },
        {
          "elementIdentifier": "issuing_country",
          "elementValue": "IT"
        },
        {
          "elementIdentifier": "issuing_jurisdiction",
          "elementValue": "IT-62"
        }
      ]
    }
  }
}
```

#### 10.3.3 PID Attributes (SD-JWT VC Format)

```json
{
  "iss": "https://pid-provider.motorizzazione.gov.it",
  "sub": "urn:uuid:8f3d92a1-c7b4-4e9f-a8d1-2b5c6e7f8a9b",
  "iat": 1718443800,
  "exp": 2029161599,
  "vct": "eu.europa.ec.eudi.pid.1",
  "_sd_alg": "sha-256",
  "cnf": {
    "jwk": {
      "kty": "EC",
      "crv": "P-256",
      "x": "TCAER19Zvu3OHF4j4W4vfSVoHIP1ILilDls7vCeGemc",
      "y": "ZxjiWWbZMQGHVWKVQ4hbSIirsVfuecCE6t4jT9F2HZQ"
    }
  },
  "_sd": [
    "WyJzYWx0IiwiZmFtaWx5X25hbWUiLCJSb3NzaSJd",
    "WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIk1hcmlhIEx1Y2lhIl0",
    "WyJzYWx0IiwiYmlydGhfZGF0ZSIsIjE5OTUtMDMtMTUiXQ",
    "WyJzYWx0IiwiYWdlX292ZXJfMTgiLHRydWVd",
    "WyJzYWx0IiwiYWdlX292ZXJfMjEiLHRydWVd",
    "WyJzYWx0IiwiYWdlX2luX3llYXJzIiwzMF0",
    "WyJzYWx0IiwiYWdlX2JpcnRoX3llYXIiLDE5OTVd",
    "WyJzYWx0IiwiZmFtaWx5X25hbWVfYmlydGgiLCJCaWFuY2hpIl0",
    "WyJzYWx0IiwiZ2l2ZW5fbmFtZV9iaXJ0aCIsIk1hcmlhIEx1Y2lhIl0",
    "WyJzYWx0IiwiYmlydGhfcGxhY2UiLCJSb21hLCBMYXppbywgSVQiXQ",
    "WyJzYWx0IiwiYmlydGhfY291bnRyeSIsIklUIl0",
    "WyJzYWx0IiwiYmlydGhfc3RhdGUiLCJMYXppbyJd",
    "WyJzYWx0IiwiYmlydGhfY2l0eSIsIlJvbWEiXQ",
    "WyJzYWx0IiwicmVzaWRlbnRfYWRkcmVzcyIsIlZpYSBHaXVzZXBwZSBWZXJkaSA0MiwgMDAxOTggUm9tYSBSTSwgSXRhbHkiXQ",
    "WyJzYWx0IiwicmVzaWRlbnRfY291bnRyeSIsIklUIl0",
    "WyJzYWx0IiwicmVzaWRlbnRfc3RhdGUiLCJMYXppbyJd",
    "WyJzYWx0IiwicmVzaWRlbnRfY2l0eSIsIlJvbWEiXQ",
    "WyJzYWx0IiwicmVzaWRlbnRfcG9zdGFsX2NvZGUiLCIwMDE5OCJd",
    "WyJzYWx0IiwicmVzaWRlbnRfc3RyZWV0IiwiVmlhIEdpdXNlcHBlIFZlcmRpIl0",
    "WyJzYWx0IiwicmVzaWRlbnRfaG91c2VfbnVtYmVyIiwiNDIiXQ",
    "WyJzYWx0IiwiZ2VuZGVyIiwyXQ",
    "WyJzYWx0IiwibmF0aW9uYWxpdHkiLCJJVCJd",
    "WyJzYWx0IiwiaXNzdWFuY2VfZGF0ZSIsIjIwMjQtMDYtMTVUMDk6MzA6MDBaIl0",
    "WyJzYWx0IiwiZXhwaXJ5X2RhdGUiLCIyMDM0LTA2LTE1VDIzOjU5OjU5WiJd",
    "WyJzYWx0IiwiaXNzdWluZ19hdXRob3JpdHkiLCJJVCJd",
    "WyJzYWx0IiwiZG9jdW1lbnRfbnVtYmVyIiwiSVQtUElELTIwMjQtNzg5MTIzNCJd",
    "WyJzYWx0IiwiYWRtaW5pc3RyYXRpdmVfbnVtYmVyIiwiQURNLUlULTIwMjQtOTgyNzM2Il0",
    "WyJzYWx0IiwiaXNzdWluZ19jb3VudHJ5IiwiSVQiXQ",
    "WyJzYWx0IiwiaXNzdWluZ19qdXJpc2RpY3Rpb24iLCJJVC02MiJd"
  ]
}
```

#### 10.3.4 mDL Attributes (ISO/IEC 18013-5)

```json
{
  "docType": "org.iso.18013.5.1.mDL",
  "namespace": "org.iso.18013.5.1",
  "issuerSigned": {
    "nameSpaces": {
      "org.iso.18013.5.1": [
        {
          "elementIdentifier": "family_name",
          "elementValue": "Rossi"
        },
        {
          "elementIdentifier": "given_name",
          "elementValue": "Maria Lucia"
        },
        {
          "elementIdentifier": "birth_date",
          "elementValue": "1995-03-15"
        },
        {
          "elementIdentifier": "issue_date",
          "elementValue": "2022-04-10"
        },
        {
          "elementIdentifier": "expiry_date",
          "elementValue": "2032-04-10"
        },
        {
          "elementIdentifier": "issuing_country",
          "elementValue": "IT"
        },
        {
          "elementIdentifier": "issuing_authority",
          "elementValue": "Motorizzazione Civile"
        },
        {
          "elementIdentifier": "document_number",
          "elementValue": "IT-DL-RM-2022-451289"
        },
        {
          "elementIdentifier": "portrait",
          "elementValue": "<base64_encoded_photo>"
        },
        {
          "elementIdentifier": "driving_privileges",
          "elementValue": [
            {
              "vehicle_category_code": "B",
              "issue_date": "2013-09-20",
              "expiry_date": "2032-04-10"
            },
            {
              "vehicle_category_code": "AM",
              "issue_date": "2011-06-15",
              "expiry_date": "2032-04-10"
            }
          ]
        },
        {
          "elementIdentifier": "un_distinguishing_sign",
          "elementValue": "I"
        },
        {
          "elementIdentifier": "sex",
          "elementValue": 2
        },
        {
          "elementIdentifier": "height",
          "elementValue": 168
        },
        {
          "elementIdentifier": "age_in_years",
          "elementValue": 30
        },
        {
          "elementIdentifier": "age_birth_year",
          "elementValue": 1995
        },
        {
          "elementIdentifier": "age_over_18",
          "elementValue": true
        },
        {
          "elementIdentifier": "age_over_21",
          "elementValue": true
        }
      ]
    }
  }
}
```

### 10.4 Use Case 2: University Diploma Attestation

#### 10.4.1 Attestation Provider Information

```yaml
attestation_provider:
  organization: 'Università degli Studi di Roma La Sapienza'
  type: 'PuB-EAA Provider'
  attestation_type: 'eu.europa.ec.eudi.diploma.higher_education.1'
  authentic_source: "Ministero dell'Università e della Ricerca (MUR)"
  authentic_source_url: 'https://anagrafe.miur.it/'
  issuing_country: 'IT'
  qualified_status: false
  trust_framework: 'eIDAS Article 45a'
```

#### 10.4.2 Diploma Attestation (SD-JWT VC Format)

```json
{
  "iss": "https://credentials.uniroma1.it",
  "sub": "urn:uuid:diploma-4721-2022",
  "iat": 1657180800,
  "exp": 1972540799,
  "vct": "eu.europa.ec.eudi.diploma.higher_education.1",
  "_sd_alg": "sha-256",
  "cnf": {
    "jwk": {
      "kty": "EC",
      "crv": "P-256",
      "x": "VHJ1c3RlZEtleUZvckRpcGxvbWFBdHRlc3RhdGlvbg",
      "y": "QmluZGluZ1RvV2FsbGV0SW5zdGFuY2VLZXlQYWly"
    }
  },
  "_sd": [
    "WyJzYWx0IiwiZmFtaWx5X25hbWUiLCJSb3NzaSJd",
    "WyJzYWx0IiwiZ2l2ZW5fbmFtZSIsIk1hcmlhIEx1Y2lhIl0",
    "WyJzYWx0IiwiYmlydGhfZGF0ZSIsIjE5OTUtMDMtMTUiXQ",
    "WyJzYWx0IiwiZGVncmVlX3RpdGxlIiwiTGF1cmVhIE1hZ2lzdHJhbGUgaW4gSW5mb3JtYXRpY2EiXQ",
    "WyJzYWx0IiwiZGVncmVlX3R5cGUiLCJNYXN0ZXIncyBEZWdyZWUiXQ",
    "WyJzYWx0IiwiaXNjZWRfY29kZSIsIkwtMzEiXQ",
    "WyJzYWx0IiwiZXFmX2xldmVsIiw3XQ",
    "WyJzYWx0IiwiZWN0c19jcmVkaXRzIiwxMjBd",
    "WyJzYWx0IiwiZ3JhZHVhdGlvbl9kYXRlIiwiMjAyMi0wNy0xNSJd",
    "WyJzYWx0IiwiZmluYWxfZ3JhZGUiLCIxMTAvMTEwIGUgbG9kZSJd",
    "WyJzYWx0IiwiaW5zdGl0dXRpb25fbmFtZSIsIlVuaXZlcnNpdMOgIGRlZ2xpIFN0dWRpIGRpIFJvbWEgTGEgU2FwaWVuemEiXQ",
    "WyJzYWx0IiwiaW5zdGl0dXRpb25fY291bnRyeSIsIklUIl0",
    "WyJzYWx0IiwiZGVwYXJ0bWVudCIsIkRpcGFydGltZW50byBkaSBJbmZvcm1hdGljYSJd",
    "WyJzYWx0IiwidGhlc2lzX3RpdGxlIiwiTWFjaGluZSBMZWFybmluZyBBcHByb2FjaGVzIGZvciBDeWJlcnNlY3VyaXR5IFRocmVhdCBEZXRlY3Rpb24iXQ",
    "WyJzYWx0Iiwic3R1ZGVudF9pZCIsIlVOSVJPTUEtU1RVLTIwMTgwOTE1LTQ3MjEiXQ",
    "WyJzYWx0IiwiaXNzdWFuY2VfZGF0ZSIsIjIwMjItMDctMjBUMTA6MDA6MDBaIl0",
    "WyJzYWx0IiwiYXV0aGVudGljX3NvdXJjZSIsIk1pbmlzdGVybyBkZWxsJ1VuaXZlcnNpdMOgIGUgZGVsbGEgUmljZXJjYSJd",
    "WyJzYWx0IiwiYXV0aGVudGljX3NvdXJjZV92ZXJpZmllZCIsInRydWUiXQ"
  ]
}
```

#### 10.4.3 Attestation Binding to Wallet

```yaml
device_binding:
  binding_method: 'cose_key'
  wallet_key_reference: 'diploma_key_8a4c2e7b'
  hsm_key_path: '/hsm/users/maria.rossi@wallet.it/diploma_8a4c2e7b'
  key_algorithm: 'ES256'
  key_curve: 'P-256'
  proof_of_possession:
    challenge: 'c7b4e9f2-a8d1-4c5e-8f3d-92a1b5c6e7f8'
    response_signature: '<base64_hsm_signature>'
    timestamp: '2022-07-20T10:05:00Z'
```

### 10.5 Use Case 3: Remote QES Signing of Property Deed

#### 10.5.1 QTSP Information

```yaml
qtsp_provider:
  name: 'InfoCert S.p.A.'
  country: 'IT'
  qualified_status: 'eIDAS Qualified'
  services:
    - 'Qualified Electronic Signature'
    - 'Remote Signature (CSC API v2.0)'
  trust_list_entry: 'https://eidas.agid.gov.it/TL/TSL-IT.xml#InfoCert'
  csc_endpoint: 'https://remoteqes.infocert.it/csc/v2'
```

#### 10.5.2 CSC API Transaction Flow

```yaml
# Step 1: Credentials List
credentials_list_request:
  endpoint: 'POST /csc/v2/credentials/list'
  authorization: 'Bearer <oauth_access_token>'
  request_body:
    userID: 'maria.rossi@wallet.it'
    credentialInfo: true

credentials_list_response:
  credentialIDs:
    - 'wallet-qes-temp-20251208-a8f3'
  credential_info:
    - credentialID: 'wallet-qes-temp-20251208-a8f3'
      description: 'Short-lived QES based on PID'
      signatureAlgorithm: '1.2.840.10045.4.3.2' # ECDSA with SHA-256
      keyAlgorithm: 'EC'
      curve: 'P-256'
      certificate:
        status: 'valid'
        certificates: ['<base64_cert_chain>']
        issuer: 'CN=InfoCert Qualified CA, O=InfoCert S.p.A., C=IT'
        subject: 'CN=Maria Lucia Rossi, SERIALNUMBER=TINIT-RSSMRL95C55H501B, C=IT'
        validFrom: '2025-12-08T14:30:00Z'
        validTo: '2025-12-08T16:30:00Z' # 2-hour validity
      authMode: 'explicit'
      SCAL: '2'
      multisign: 5
      lang: 'it-IT'

# Step 2: Calculate Document Hash
document_info:
  filename: 'property_deed_apartment_roma_2025.pdf'
  size_bytes: 2847621
  hash_algorithm: 'SHA-256'
  hash_value: '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b'

# Step 3: Credentials Authorize
credentials_authorize_request:
  endpoint: 'POST /csc/v2/credentials/authorize'
  request_body:
    credentialID: 'wallet-qes-temp-20251208-a8f3'
    numSignatures: 1
    hash:
      - '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b'
    PIN: '<user_entered_pin>'
    OTP: '<user_entered_otp>'

credentials_authorize_response:
  SAD: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' # Signature Authorization Data
  expiresIn: 300 # 5 minutes

# Step 4: Sign Hash
signatures_sign_hash_request:
  endpoint: 'POST /csc/v2/signatures/signHash'
  request_body:
    credentialID: 'wallet-qes-temp-20251208-a8f3'
    SAD: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    hash:
      - '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b'
    signAlgo: '1.2.840.10045.4.3.2'
    signAlgoParams: 'MGQCAQEwDQYJYIZIAWUDBAIBBQA='

signatures_sign_hash_response:
  signatures:
    - 'MEYCIQDxKj7WQf8H9P2nT5vL3mK1pR6sJ4oN8yX2hV9cU7fE3AIhAJm9K2pL7'
```

#### 10.5.3 Qualified Certificate Details

```yaml
qualified_certificate:
  version: 3
  serial_number: '5F:A8:2B:E9:7C:3D:41:09'
  signature_algorithm: 'ecdsa-with-SHA256'
  issuer:
    CN: 'InfoCert Qualified CA'
    O: 'InfoCert S.p.A.'
    C: 'IT'
  validity:
    not_before: '2025-12-08T14:30:00Z'
    not_after: '2025-12-08T16:30:00Z'
  subject:
    CN: 'Maria Lucia Rossi'
    SN: 'RSSMRL95C55H501B' # Tax Code
    GN: 'Maria Lucia'
    SUR: 'Rossi'
    C: 'IT'
  subject_public_key:
    algorithm: 'id-ecPublicKey'
    curve: 'prime256v1'
    public_key: '<base64_encoded_public_key>'
  extensions:
    qcStatements:
      - id-etsi-qcs-QcCompliance
      - id-etsi-qcs-QcType: 'id-etsi-qct-esign'
      - id-etsi-qcs-QcSSCD
    key_usage:
      - digitalSignature
      - nonRepudiation
    extended_key_usage:
      - id-kp-documentSigning
    certificate_policies:
      - '0.4.0.194112.1.0' # eIDAS QC policy
    authority_information_access:
      - 'OCSP - URI:http://ocsp.infocert.it'
      - 'CA Issuers - URI:http://ca.infocert.it/qualified-ca.crt'
```

### 10.6 Use Case 4: Bank Account Opening

#### 10.6.1 Relying Party Information

```yaml
relying_party:
  name: 'EuroBank Italia S.p.A.'
  type: 'Financial Institution'
  country: 'IT'
  registration_number: 'IT-BANK-00584'
  regulatory_authority: "Banca d'Italia"
  kyc_requirements:
    - 'Person Identification (PID)'
    - 'Proof of Education/Employment'
    - 'Residence Verification'
  eidas_registered: true
  access_certificate: 'RP-CERT-EUROBANK-IT-2024-5891'
```

#### 10.6.2 OpenID4VP Presentation Request

```json
{
  "response_type": "vp_token",
  "response_mode": "direct_post",
  "client_id": "https://kyc.eurobank.it",
  "client_id_scheme": "x509_san_dns",
  "response_uri": "https://kyc.eurobank.it/wallet/response",
  "nonce": "d2e5f8a1-c4b7-4e9f-a8d1-2b5c6e7f8a9b",
  "state": "kyc-session-2025-12-08-47891",
  "presentation_definition": {
    "id": "eurobank-kyc-full",
    "input_descriptors": [
      {
        "id": "pid_credential",
        "name": "Person Identification Data",
        "purpose": "Identity verification for KYC compliance",
        "format": {
          "mso_mdoc": {
            "alg": ["ES256", "ES384", "ES512"]
          },
          "vc+sd-jwt": {
            "alg": ["ES256", "ES384", "ES512"]
          }
        },
        "constraints": {
          "fields": [
            {
              "path": ["$.family_name", "$.credentialSubject.family_name"],
              "purpose": "Legal last name",
              "intent_to_retain": true
            },
            {
              "path": ["$.given_name", "$.credentialSubject.given_name"],
              "purpose": "Legal first name(s)",
              "intent_to_retain": true
            },
            {
              "path": ["$.birth_date", "$.credentialSubject.birth_date"],
              "purpose": "Date of birth for age verification",
              "intent_to_retain": true
            },
            {
              "path": ["$.age_over_18", "$.credentialSubject.age_over_18"],
              "purpose": "Adult status verification",
              "filter": {
                "type": "boolean",
                "const": true
              }
            },
            {
              "path": ["$.nationality", "$.credentialSubject.nationality"],
              "purpose": "Citizenship verification"
            },
            {
              "path": ["$.resident_address", "$.credentialSubject.resident_address"],
              "purpose": "Current residence address",
              "intent_to_retain": true
            },
            {
              "path": ["$.resident_country", "$.credentialSubject.resident_country"],
              "purpose": "Country of residence"
            }
          ]
        }
      },
      {
        "id": "education_credential",
        "name": "Higher Education Diploma",
        "purpose": "Employment/education verification",
        "format": {
          "vc+sd-jwt": {
            "alg": ["ES256", "ES384", "ES512"]
          }
        },
        "constraints": {
          "fields": [
            {
              "path": ["$.degree_title", "$.credentialSubject.degree_title"],
              "purpose": "Degree information"
            },
            {
              "path": ["$.degree_type", "$.credentialSubject.degree_type"],
              "purpose": "Level of education"
            },
            {
              "path": ["$.institution_name", "$.credentialSubject.institution_name"],
              "purpose": "Issuing institution"
            },
            {
              "path": ["$.graduation_date", "$.credentialSubject.graduation_date"],
              "purpose": "Date of completion"
            }
          ]
        }
      }
    ]
  }
}
```

#### 10.6.3 OpenID4VP Presentation Response

```json
{
  "vp_token": [
    {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiablePresentation"],
      "holder": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "verifiableCredential": [
        {
          "format": "vc+sd-jwt",
          "credential": "eyJhbGciOiJFUzI1NiIsInR5cCI6InZjK3NkLWp3dCJ9...<SD-JWT_PID>~<disclosures>~<kb-jwt>"
        },
        {
          "format": "vc+sd-jwt",
          "credential": "eyJhbGciOiJFUzI1NiIsInR5cCI6InZjK3NkLWp3dCJ9...<SD-JWT_DIPLOMA>~<disclosures>~<kb-jwt>"
        }
      ]
    }
  ],
  "presentation_submission": {
    "id": "submission-2025-12-08-14567",
    "definition_id": "eurobank-kyc-full",
    "descriptor_map": [
      {
        "id": "pid_credential",
        "format": "vc+sd-jwt",
        "path": "$.verifiableCredential[0]",
        "path_nested": {
          "format": "vc+sd-jwt",
          "path": "$.verifiableCredential[0].credential"
        }
      },
      {
        "id": "education_credential",
        "format": "vc+sd-jwt",
        "path": "$.verifiableCredential[1]",
        "path_nested": {
          "format": "vc+sd-jwt",
          "path": "$.verifiableCredential[1].credential"
        }
      }
    ]
  },
  "state": "kyc-session-2025-12-08-47891"
}
```

#### 10.6.4 Device Binding Verification

```yaml
device_binding_proof:
  method: 'key_binding_jwt'

  # PID Binding Proof
  pid_binding:
    header:
      alg: 'ES256'
      typ: 'kb+jwt'
    payload:
      iat: 1733668800
      aud: 'https://kyc.eurobank.it'
      nonce: 'd2e5f8a1-c4b7-4e9f-a8d1-2b5c6e7f8a9b'
      sd_hash: '8f3d92a1c7b4e9f2a8d12b5c6e7f8a9b'
    signature: '<hsm_generated_signature_over_hash>'

  # Diploma Binding Proof
  diploma_binding:
    header:
      alg: 'ES256'
      typ: 'kb+jwt'
    payload:
      iat: 1733668800
      aud: 'https://kyc.eurobank.it'
      nonce: 'd2e5f8a1-c4b7-4e9f-a8d1-2b5c6e7f8a9b'
      sd_hash: 'a8d12b5c6e7f8a9b8f3d92a1c7b4e9f2'
    signature: '<hsm_generated_signature_over_hash>'

verification_result:
  pid_verified: true
  diploma_verified: true
  device_binding_valid: true
  issuer_signatures_valid: true
  revocation_status: 'not_revoked'
  timestamp: '2025-12-08T14:32:15Z'
```

### 10.7 Cryptographic Key Material

#### 10.7.1 Wallet Instance Keys

```yaml
# Wallet Unit Attestation (WUA) Key
wua_key:
  key_id: 'wua_key_c7b4e9f2a8d1'
  algorithm: 'ES256'
  curve: 'P-256'
  hsm_path: '/hsm/users/maria.rossi@wallet.it/wua'
  public_key_jwk:
    kty: 'EC'
    crv: 'P-256'
    x: 'WUA_Public_X_Coordinate_Base64Url'
    y: 'WUA_Public_Y_Coordinate_Base64Url'
  key_operations: ['sign', 'verify']
  created: '2024-06-15T09:30:00Z'

# PID Attestation Key
pid_key:
  key_id: 'pid_key_7e8f9a0b1c2d'
  algorithm: 'ES256'
  curve: 'P-256'
  hsm_path: '/hsm/users/maria.rossi@wallet.it/pid'
  public_key_jwk:
    kty: 'EC'
    crv: 'P-256'
    x: 'PID_Public_X_Coordinate_Base64Url'
    y: 'PID_Public_Y_Coordinate_Base64Url'
  key_operations: ['sign', 'verify']
  created: '2024-06-15T10:15:00Z'
  bound_credentials:
    - 'IT-PID-2024-7891234'
    - 'IT-DL-RM-2022-451289'

# Diploma Attestation Key
diploma_key:
  key_id: 'diploma_key_8a4c2e7b'
  algorithm: 'ES256'
  curve: 'P-256'
  hsm_path: '/hsm/users/maria.rossi@wallet.it/diploma_8a4c2e7b'
  public_key_jwk:
    kty: 'EC'
    crv: 'P-256'
    x: 'DIPLOMA_Public_X_Coordinate_Base64Url'
    y: 'DIPLOMA_Public_Y_Coordinate_Base64Url'
  key_operations: ['sign', 'verify']
  created: '2022-07-20T10:05:00Z'
  bound_credentials:
    - 'diploma-4721-2022'
```

#### 10.7.2 HSM Configuration

```yaml
hsm_infrastructure:
  vendor: 'Thales Luna HSM'
  model: 'Luna Network HSM 7'
  firmware_version: '7.8.4'
  certifications:
    - 'FIPS 140-3 Level 3'
    - 'Common Criteria EAL4+'

  cluster_configuration:
    nodes: 3
    geographic_distribution:
      - 'Rome Primary Data Center'
      - 'Milan Backup Data Center'
      - 'Frankfurt DR Site'

  user_partition:
    partition_id: 'maria.rossi@wallet.it'
    partition_label: 'EUDI-WALLET-USER-8F3D92A1'
    so_authentication: 'M-of-N with Hardware Token'
    key_count: 4
    max_keys: 100

  cryptographic_capabilities:
    algorithms:
      - 'ECDSA (P-256, P-384, P-521)'
      - 'RSA (2048, 3072, 4096)'
      - 'EdDSA (Ed25519)'
    key_generation: 'On-board TRNG (AIS-31 PTG.2)'
    key_backup: 'Encrypted key export to secure backup partition'

  audit_logging:
    enabled: true
    log_retention: '7 years'
    tamper_detection: 'Real-time alerts'
    events_logged:
      - 'Key generation'
      - 'Signature operations'
      - 'Key access attempts'
      - 'Configuration changes'
```

### 10.8 Trust Infrastructure

#### 10.8.1 Certificate Chain Structure

```
Root Trust Anchor
│
├─ EU Trust List (TSL)
│  └─ https://eidas.ec.europa.eu/efda/tl-browser/
│
├─ Italy National Trust List
│  ├─ URL: https://eidas.agid.gov.it/TL/TSL-IT.xml
│  └─ Supervised by: AgID (Agenzia per l'Italia Digitale)
│
└─ Certificate Chains
   │
   ├─ PID Provider Chain
   │  ├─ [Root] IT Government Root CA
   │  ├─ [Intermediate] IT eIDAS Qualified CA
   │  ├─ [Issuer] Italy PID Provider CA
   │  └─ [Document Signer] IT-PID-DS-2024-001
   │
   ├─ Wallet Provider Chain
   │  ├─ [Root] EU Wallet Provider Root CA
   │  ├─ [Intermediate] IT Wallet Provider Intermediate CA
   │  └─ [WUA Issuer] IT-WP-WUA-2024-042
   │
   ├─ QTSP Chain
   │  ├─ [Root] InfoCert Root CA
   │  ├─ [Intermediate] InfoCert Qualified CA
   │  └─ [QES Certificate] User-specific short-lived cert
   │
   └─ Relying Party Chain
      ├─ [Root] EU Relying Party Root CA
      ├─ [Intermediate] IT Financial Services CA
      └─ [Access Certificate] RP-CERT-EUROBANK-IT-2024-5891
```

#### 10.8.2 Revocation Infrastructure

```yaml
revocation_mechanisms:
  # Status List 2021 (for PIDs and Attestations)
  status_list:
    type: 'StatusList2021'
    purpose: 'revocation'
    encoded_list: '<gzip_compressed_bitstring>'
    status_list_credential:
      issuer: 'https://pid-provider.motorizzazione.gov.it'
      validFrom: '2024-06-15T00:00:00Z'
      validUntil: '2024-12-31T23:59:59Z'

    # Maria's PID Status
    status_list_index: 12345
    status_list_url: 'https://pid-provider.motorizzazione.gov.it/status/2024/list1'
    current_status: 'valid' # bit = 0

  # OCSP for X.509 Certificates
  ocsp:
    responder_url: 'http://ocsp.infocert.it'
    response_validity: '24 hours'
    next_update: '2025-12-09T14:30:00Z'
    cert_status: 'good'

  # CRL Distribution
  crl:
    distribution_point: 'http://crl.infocert.it/qualified-ca.crl'
    update_frequency: 'Every 6 hours'
    next_update: '2025-12-08T20:00:00Z'
```

### 10.9 Protocol Message Examples

#### 10.9.1 OpenID4VCI Credential Offer

```http
GET https://pid-provider.motorizzazione.gov.it?
  credential_offer_uri=https%3A%2F%2Fpid-provider.motorizzazione.gov.it%2Foffer%2F8f3d92a1

Response:
{
  "credential_issuer": "https://pid-provider.motorizzazione.gov.it",
  "credential_configuration_ids": [
    "eu.europa.ec.eudi.pid.1_mso_mdoc",
    "eu.europa.ec.eudi.pid.1_vc_sd-jwt"
  ],
  "grants": {
    "authorization_code": {
      "issuer_state": "state-8f3d92a1-c7b4"
    }
  }
}
```

#### 10.9.2 OpenID4VCI Token Request

```http
POST /token HTTP/1.1
Host: pid-provider.motorizzazione.gov.it
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth-code-abc123xyz789
&redirect_uri=eudi-wallet://callback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
&client_id=eudi-wallet-app-it-v1.2.0

Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "c_nonce": "nonce-8f3d92a1",
  "c_nonce_expires_in": 300
}
```

#### 10.9.3 OpenID4VCI Credential Request with PoP

```http
POST /credential HTTP/1.1
Host: pid-provider.motorizzazione.gov.it
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "format": "vc+sd-jwt",
  "credential_definition": {
    "vct": "eu.europa.ec.eudi.pid.1"
  },
  "proof": {
    "proof_type": "jwt",
    "jwt": "eyJhbGciOiJFUzI1NiIsInR5cCI6Im9wZW5pZDR2Y2ktcHJvb2Yrand0In0.eyJpc3MiOiJkaWQ6a2V5Ono2TWtwVEhSOFZOc0J4WUFBV0h1dDJHZWFkZDlqU3d1QlY4eFJvQW53V3Nkdmt0SCIsImF1ZCI6Imh0dHBzOi8vcGlkLXByb3ZpZGVyLm1vdG9yaXp6YXppb25lLmdvdi5pdCIsImlhdCI6MTczMzY2ODgwMCwibm9uY2UiOiJub25jZS04ZjNkOTJhMSJ9.8f3d92a1c7b4e9f2a8d12b5c6e7f8a9b..."
  }
}

Response:
{
  "format": "vc+sd-jwt",
  "credential": "eyJhbGciOiJFUzI1NiIsInR5cCI6InZjK3NkLWp3dCJ9...<SD-JWT>",
  "c_nonce": "new-nonce-a1b2c3d4",
  "c_nonce_expires_in": 300
}
```

### 10.10 Educational Testing Scenarios

#### 10.10.1 Scenario Matrix

| Scenario                            | Actors                                   | Protocols              | Key Learning Points                        |
| ----------------------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------ |
| **S1: Happy Path PID Issuance**     | User, Wallet Provider, PID Provider, HSM | OpenID4VCI, OAuth 2.0  | Complete flow, PoP generation, HSM key ops |
| **S2: Selective Disclosure**        | User, Bank (RP)                          | OpenID4VP, SD-JWT      | Privacy-preserving presentations           |
| **S3: Device Binding Verification** | User, University, RP                     | OpenID4VP, COSE        | Key binding proofs, HSM signatures         |
| **S4: Combined Presentation**       | User, Bank (RP)                          | OpenID4VP              | Multi-credential requests                  |
| **S5: Revocation Check**            | User, RP, Status List                    | Status List 2021       | Real-time revocation verification          |
| **S6: Remote QES Flow**             | User, Notary, QTSP                       | CSC API v2.0           | Document signing, short-lived certs        |
| **S7: Proximity mDL**               | User, Police Officer                     | ISO 18013-5, BLE/NFC   | Offline presentation, reader auth          |
| **S8: Cross-border**                | User (IT), RP (DE)                       | OpenID4VP, Trust Lists | EU interoperability                        |

#### 10.10.2 Error Scenarios for Testing

```yaml
error_scenarios:
  E1_expired_credential:
    description: 'PID expiry date has passed'
    test_data:
      expiry_date: '2024-06-15T23:59:59Z' # Past date
    expected_behavior: 'Wallet warns user, RP rejects credential'

  E2_revoked_credential:
    description: 'Diploma has been revoked'
    test_data:
      status_list_bit: 1 # Revoked
    expected_behavior: 'Status check fails, presentation blocked'

  E3_invalid_device_binding:
    description: 'Key binding proof verification fails'
    test_data:
      signature: '<intentionally_invalid_signature>'
    expected_behavior: 'RP rejects presentation, audit log entry'

  E4_untrusted_issuer:
    description: 'Issuer not in trusted list'
    test_data:
      issuer: 'https://fake-university.com'
    expected_behavior: 'Trust chain validation fails'

  E5_replay_attack:
    description: 'Reused nonce in presentation'
    test_data:
      nonce: '<previously_used_nonce>'
    expected_behavior: 'RP detects replay, rejects'

  E6_hsm_unavailable:
    description: 'HSM cluster unreachable'
    test_data:
      hsm_status: 'offline'
    expected_behavior: 'Graceful degradation, user notified'
```

---

## Part 11: Glossary

| Term               | Definition                                                                  |
| ------------------ | --------------------------------------------------------------------------- |
| **Access CA**      | Certificate Authority issuing access certificates to ecosystem participants |
| **ARF**            | Architecture and Reference Framework for EUDI Wallet                        |
| **CSC API**        | Cloud Signature Consortium API for remote signing                           |
| **EAA**            | Electronic Attestation of Attributes (non-qualified)                        |
| **ECDSA**          | Elliptic Curve Digital Signature Algorithm                                  |
| **FIPS 140-3**     | Federal standard for cryptographic module validation                        |
| **HKDF**           | HMAC-based Key Derivation Function                                          |
| **HSM**            | Hardware Security Module                                                    |
| **LoA High**       | Level of Assurance High (per eIDAS)                                         |
| **mdoc**           | Mobile document format (ISO 18013-5)                                        |
| **MSO**            | Mobile Security Object (issuer signature structure)                         |
| **OpenID4VCI**     | OpenID for Verifiable Credential Issuance                                   |
| **OpenID4VP**      | OpenID for Verifiable Presentations                                         |
| **PID**            | Person Identification Data                                                  |
| **PoP**            | Proof of Possession                                                         |
| **PuB-EAA**        | EAA from public body responsible for authentic source                       |
| **QEAA**           | Qualified Electronic Attestation of Attributes                              |
| **QES**            | Qualified Electronic Signature                                              |
| **QSCD**           | Qualified Signature/Seal Creation Device                                    |
| **QTSP**           | Qualified Trust Service Provider                                            |
| **Remote HSM**     | Centralized Hardware Security Module accessed over network                  |
| **SD-JWT**         | Selective Disclosure JSON Web Token                                         |
| **TRNG**           | True Random Number Generator                                                |
| **User Partition** | Isolated key storage area for a user within multi-tenant HSM                |
| **WI**             | Wallet Instance                                                             |
| **WSCA**           | Wallet Secure Cryptographic Application (HSM firmware module)               |
| **WSCD**           | Wallet Secure Cryptographic Device (HSM hardware)                           |
| **WUA**            | Wallet Unit Attestation                                                     |

---

## Document Control

| Version | Date        | Author    | Changes                                                                                                                             |
| ------- | ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Dec 2025    | PQC Today | Initial release                                                                                                                     |
| 1.1     | Dec 8, 2025 | PQC Today | Added comprehensive reference test data (Part 10) covering all four use cases based on ARF v2.4.0+ and official EUDI specifications |

---

_This document is intended for educational purposes as part of the PQC Today learning platform. For implementation guidance, always refer to the official ARF and Commission Implementing Regulations._
