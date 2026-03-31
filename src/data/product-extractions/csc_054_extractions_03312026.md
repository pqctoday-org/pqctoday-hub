---
generated: 2026-03-31
collection: csc_054
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## Thales MultiApp 5.2 Premium PQC

- **Category**: Smart Cards & Secure Elements
- **Product Name**: Thales MultiApp 5.2 Premium PQC
- **Product Brief**: World's first smartcard certified to resist quantum computer attacks, incorporating FIPS 204 signatures.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Certified by ANSSI as the world's first smartcard to resist quantum attacks. Incorporates cryptographic signatures based on FIPS 204 (NIST-approved post-quantum algorithm derived from structured lattice mathematics). Designed to withstand future quantum decryption methods threatening RSA and ECC.
- **PQC Migration Priority**: High
- **Crypto Primitives**: FIPS 204, RSA, ECC
- **Key Management Model**: Hardware-based key storage within a smartcard; specific injection or generation methods not stated in provided text.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Smartcard (Hardware)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: 5.2
- **Release Date**: 2025-10-14
- **FIPS Validated**: No (Text states it incorporates signatures based on FIPS 204, but does not state the product itself is FIPS 140 validated)
- **Primary Platforms**: Smartcard readers/terminals (implied by smartcard form factor); specific OS not stated.
- **Target Industries**: Not stated
- **Regulatory Status**: Certified by ANSSI (France's national cybersecurity agency); Common Criteria EAL6+
- **PQC Roadmap Details**: Product is already launched and certified; no future roadmap details provided in text.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: FIPS 204, RSA, ECC
- **Authoritative Source URL**: Not stated

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
- **Product Brief**: A secure Java Card Operating System hardware module for smart cards, IoT, and automotive applications.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms or capabilities. It explicitly lists RSA Decryption, ECDSA, and KASECC using NIST P-256 and Brainpool256r1 curves as the supported cryptographic primitives.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, ECDSA, KASECC (using NIST P-256 and Brainpool256r1 elliptic curves)
- **Key Management Model**: Hardware-based key storage within a single chip embodiment; keys managed via GlobalPlatform operational environment (Card Manager ISD/SSD); specific injection methods not detailed in provided text.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Single chip hardware module (Secure Element) designed for smart cards, IoT, and automotive applications.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (NXP Semiconductors)
- **Latest Version**: 1.6 (Security Policy Document); Firmware Platform ID J3R6000373181200; Applets v7.2.22 and v2.0.2.11
- **Release Date**: 2025-03-20 (Security Policy Document Version 1.6)
- **FIPS Validated**: Yes, FIPS 140-3 Overall Security Level 3 (Physical Security Level 4); First Validated: 10/7/2024
- **Primary Platforms**: Smart cards, IoT devices, automotive applications; interfaces via ISO 7816, ISO 14443, or NXP I2C.
- **Target Industries**: Not explicitly stated beyond general "smart cards, IoT and automotive applications"
- **Regulatory Status**: FIPS 140-3 Validated (Level 3 Overall, Level 4 Physical)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (NIST P-256, Brainpool256r1), KASECC
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
