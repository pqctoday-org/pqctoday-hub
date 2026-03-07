---
generated: 2026-03-06
collection: csc_054
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## Infineon TEGRION SLC27 PQC

- **Category**: Smart Cards & Secure Elements
- **Product Name**: Infineon TEGRION SLC27 PQC
- **Product Brief**: Not stated in the provided text.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. The document lists general product categories and microcontroller families but contains no specific details regarding Post-Quantum Cryptography algorithms, implementation status, or maturity for the TEGRION SLC27 PQC.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Context indicates "Smart Cards & Secure Elements" and "Hardware", but specific architecture details are absent from the text).
- **Infrastructure Layer**: Hardware
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated (Text lists "Security and smart card solutions" and "Smart solutions for government ID" as categories, but does not explicitly link them to the TEGRION SLC27 PQC).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filenames provided, but no external URL in text).

---

## NXP JCOP 4.5 P71D600

- **Category**: Smart Cards & Secure Elements
- **Product Name**: JCOP 4.5 on P71D600
- **Product Brief**: Hardware module implementing GlobalPlatform operational environment for smart cards, IoT, and automotive applications.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms or capabilities. It only lists classical algorithms such as ECDSA using NIST P-256 and Brainpool256r1 curves, and KASECC operations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECDSA, KASECC, NIST P-256 curve, Brainpool256r1 curve
- **Key Management Model**: Hardware key storage within a single chip embodiment (Secure Element) with Sensitive Security Parameter (SSP) management; specific injection methods not detailed in provided text.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Single chip hardware module (Secure Element) acting as an auxiliary security device attached to a host controller.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (NXP Semiconductors 2025, Public Material – May be reproduced only in its original entirety)
- **Latest Version**: 1.6 (Document Version); Firmware/Platform ID: J3R6000373181200; Applets: NXP IoT applet v7.2.22, NXP SEMS Lite applet v2.0.2.11
- **Release Date**: 2025-03-20 (Document Date)
- **FIPS Validated**: Yes, FIPS 140-3 Overall Security Level 3 (Physical Security Level 4)
- **Primary Platforms**: Smart cards, IoT, automotive applications; interfaces via ISO 7816, ISO 14443, or NXP I2C.
- **Target Industries**: Not explicitly stated as industries, but mentions market segments: smart cards, IoT, automotive.
- **Regulatory Status**: FIPS 140-3 Validated (Level 3 Overall, Level 4 Physical)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (using NIST P-256 or Brainpool256r1), KASECC
- **Authoritative Source URL**: https://csrc.nist.gov/projects/cryptographicmodulevalidation-program

---

## Microchip ATECC608B

- **Category**: Smart Cards & Secure Elements
- **Product Name**: Microchip ATECC608B (part of CryptoAuth family)
- **Product Brief**: Library for interacting with Microchip Security devices including the ATECC608B secure element.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography, PQC algorithms, or migration plans. It references standard crypto implementations (SHA1, SHA2) and ECC support via device families but no specific PQC primitives.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SHA1, SHA2 (software implementations mentioned); ECC (implied by "CryptoAuth" family and device names like ECC204/608, but specific curves not listed in text).
- **Key Management Model**: Hardware secure element storage; key locking mechanism mentioned ("once you lock a device, it will not be changeable"); no specific injection method details provided.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Secure Element (Hardware); supported via I2C, SPI, and SWI protocols.
- **Infrastructure Layer**: Hardware
- **License Type**: Open Source/Commercial (Library is open source; hardware is commercial)
- **License**: NOASSERTION
- **Latest Version**: Not stated
- **Release Date**: 2026-03-02 (Last Updated timestamp in repository metadata)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Bare-metal, RTOS, Windows, Linux, MacOS; specific MCUs: ATSAMR21, ATSAMD21.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions "Crypto Authentication" and ECC support generally but does not list specific signature schemes like ECDSA or Ed25519).
- **Authoritative Source URL**: https://github.com/MicrochipTech/cryptoauthlib

---
