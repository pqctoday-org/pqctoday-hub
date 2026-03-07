---
generated: 2026-03-06
collection: csc_051
documents_processed: 10
enrichment_method: ollama-qwen3.5:27b
---

## IDEMIA Digital Identity Platform

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: IDEMIA Digital Identity Platform
- **Product Brief**: A digital identity and verifiable credentials platform offering biometrics, cryptography, and secure transaction solutions.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Offers quantum-ready cryptographic libraries and Post-Quantum Security Consulting. Actively deploying NIST-standardized algorithms (ML-DSA, ML-KEM) in smart cards, 5G SIMs, and eSIMs. Focuses on hybrid approaches combining classical and PQC cryptography with crypto-agility for embedded systems.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-DSA, ML-KEM, Falcon (research), Mitaka (research), NTRU (research context)
- **Key Management Model**: Hybrid approach (classical + post-quantum); implemented in secure elements and smart cards.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware Security Module (HSM), Secure Element, Smart Card, eSIM
- **Infrastructure Layer**: Application, Security Stack, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2024-11-18 (Article publication date)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Smart cards, 5G SIMs, eSIMs, IoT devices, embedded systems
- **Target Industries**: Banking, Government, Public Security, Travel, Payment, Connectivity, Cybersecurity
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implementing NIST standards (ML-DSA, ML-KEM); testing hybrid protocols; developing crypto-agile solutions for embedded environments; contributing to standardization efforts.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, Falcon (research), Mitaka (research)
- **Authoritative Source URL**: Not stated

---

## Procivis One

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Procivis One Open Core
- **Product Brief**: Library to issue, hold, and verify digital identities and credentials on any device.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports CRYSTALS-DILITHIUM 3 (CRYDI3) for JOSE/COS signatures and ML-DSA for key generation. BBS+ is supported for selective disclosure. FIPS-204 support is planned for the near future.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA, EdDSA, BBS+, CRYSTALS-DILITHIUM 3, ML-DSA
- **Key Management Model**: Supports Azure Key Vault HSM and internal encrypted database storage; supports serialization to multibase, JWK, bytes, and DER.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer library with modular providers for crypto, key storage, and credential formatting.
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2025-10-06
- **FIPS Validated**: No (Support for FIPS-204 is planned; library components are delimited to enable future NIST CMVP certification)
- **Primary Platforms**: Rust (requires Rust ≥ 1.75); supports mobile devices with intermittent connectivity via caching.
- **Target Industries**: Government (funded by U.S. DHS SVIP), Enterprise, Digital Identity
- **Regulatory Status**: Funded by U.S. Department of Homeland Security's Silicon Valley Innovation Program (SVIP) under contract 70RSAT24T00000012.
- **PQC Roadmap Details**: Support for FIPS-204 is planned for the near future.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA (ES256, ecdsa-rdfc-2019), EdDSA (Ed25519, eddsa-rdfc-2022), BBS+ (bbs-2023), CRYSTALS-DILITHIUM 3 (CRYDI3)
- **Authoritative Source URL**: https://github.com/procivis/one-open-core

---

## walt.id

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: walt.id
- **Product Brief**: Open-source identity and wallet infrastructure for issuing, storing, and verifying W3C Verifiable Credentials.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It focuses on standard cryptographic verification of W3C Verifiable Credentials without specifying quantum-resistant primitives.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "cryptographically verified" and "cryptographic underpinnings" but does not list specific algorithms like ECDSA, Ed25519, or RSA).
- **Key Management Model**: Not stated (Text mentions storing credentials in identity wallets but does not describe the underlying key management architecture, formats, or HSM/MPC usage).
- **Supported Blockchains**: Not applicable (Product is an identity/VC stack; while it has examples for NFT auth and SIWE, it does not list supported blockchain networks as a core feature).
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: Apache 2.0 (for Community Stack); Commercial (for Enterprise Stack)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Multi-Platform Support for all major platforms and languages; specific languages mentioned include Kotlin, Java, JavaScript, TypeScript, Vue, Go, Rust.
- **Target Industries**: Not stated (Text mentions "Enterprises", "Government" in the context of GitHub solutions, but walt.id text only mentions general "Enterprise Ready" and compliance with eIDAS 2.0/GDPR).
- **Regulatory Status**: Aligned with W3C, ISO, OIDF, IETF standards; compliant with eIDAS 2.0 and GDPR.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Text mentions signing VCs but does not list specific signature algorithms).
- **Authoritative Source URL**: https://walt.id

---

## Microsoft Entra Verified ID

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Microsoft Entra Verified ID
- **Product Brief**: A digital identity and verifiable credentials solution within the Microsoft Security portfolio.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: PQC is not currently enabled for this specific product but is part of a broader Microsoft Quantum Safe Program (QSP). The roadmap targets early adoption by 2029 and full transition completion by 2033. Foundational components like SymCrypt support ML-KEM and ML-DSA, which underpin future service updates including identity services.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECDSA, AES (current); ML-KEM, ML-DSA (planned/foundational)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based identity service; specific PQC architecture not detailed for this product.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: Not stated
- **Release Date**: 2025-08-20 (Blog post date referencing the program; specific product release not stated)
- **FIPS Validated**: No mention of FIPS validation status for this specific product in the text.
- **Primary Platforms**: Windows, Linux, Microsoft Azure, Microsoft 365 (as part of the broader ecosystem)
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail, Education, Automotive
- **Regulatory Status**: Aligned with NIST, CISA, OMB, CNSA 2.0, and international government timelines; no specific charter or license mentioned for the product itself.
- **PQC Roadmap Details**: Microsoft aims to enable early adoption of quantum-safe capabilities by 2029, gradually making them default, with full transition of services and products completed by 2033. Strategy involves a phased approach: foundational components (SymCrypt), core infrastructure services (including Entra authentication), then all services.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: ECDSA, RSA; Planned: ML-DSA (Module-Lattice Digital Signature Algorithm)
- **Authoritative Source URL**: https://www.microsoft.com/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/ (Inferred from blog title and date in text)

---

## SpruceID

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: SpruceID
- **Product Brief**: Digital trust infrastructure for government services powering secure identity solutions and verifiable credentials.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. The document mentions standards (ISO, W3C, OpenID Foundation) but does not explicitly list Post-Quantum Cryptography algorithms or implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0, MIT
- **Latest Version**: v0.7 (for w3c-vc-barcodes)
- **Release Date**: 2026-03-06 (Most recent update date for sprucekit-mobile)
- **FIPS Validated**: No
- **Primary Platforms**: Rust, Swift
- **Target Industries**: Government
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://spruceid.com

---

## EUDI Reference Wallet

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: EUDI Reference Wallet
- **Product Brief**: Open source reference implementation for digital identification, authentication, and electronic signatures based on EU standards.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. The document mentions "electronic signatures" and "secure access" but does not specify Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "X5C certificate" and "electronic signatures" but lists no specific algorithms like ECDSA, RSA, or PQC schemes).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated (Text mentions "Architecture and Reference Framework" and "Toolbox" but does not describe the specific cryptographic architecture type).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0, EUPL-1.2
- **Latest Version**: Unknown (Text mentions "release/tag" generally but no specific version number)
- **Release Date**: 2026-03-06 (Based on repository update dates listed as "Mar 6, 2026")
- **FIPS Validated**: No
- **Primary Platforms**: Android, iOS, Web (Backend Restful service), Multiplatform
- **Target Industries**: Government, Public Sector, Private Sector (EU citizens and businesses)
- **Regulatory Status**: Aligned with eIDAS Regulation and the new Digital Identity Regulation; developed under European Commission Recommendation.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://ec.europa.eu/digital-building-blocks/sites/display/EUDIGITALIDENTITYWALLET/EU+Digital+Identity+Wallet+Home

---

## Sphereon SSI SDK

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Sphereon SSI SDK
- **Product Brief**: Self Sovereign Identity SDK adding OID4VC, Presentation Exchange, and MS Entra support to Veramo-based agents.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It explicitly mentions support for BBS+ and RSA in crypto extensions but does not classify these as PQC or mention hybrid modes involving PQC.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: BBS+, RSA, JWT, JSON-LD (mentioned in context of VC formats and signature support)
- **Key Management Model**: Integrated into Key Management system within the agent; requires use of SSI-SDK or Veramo modules for DID and key management. Specific formats (PKCS#8/PKCS#12) are not stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer SDK/Plugin architecture compatible with Veramo agents.
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown (Text mentions "draft v15" for OID4VCI support and branch names, but no specific software version number)
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: NodeJS, React-Native, Browser, REST APIs (compatible with TypeScript/JavaScript projects)
- **Target Industries**: Digital Identity, Verifiable Credentials (General Enterprise/Government implied by OID4VC standards)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: BBS+, RSA, JWT signatures (implied via JWT VC Presentation Profile support)
- **Authoritative Source URL**: https://github.com/Sphereon-Opensource/SSI-SDK

---

## Hyperledger Aries (ACA-Py)

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Hyperledger Aries (ACA-Py)
- **Product Brief**: An archived project whose core components have transitioned to new locations including ACA-Py, Bifold Wallet, and Credo-TS.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. The document mentions the project is archived and lists component transitions but does not detail cryptographic algorithms or PQC implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://aca-py.org

---

## CREDEBL

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: CREDEBL
- **Product Brief**: Open-source Decentralized Identity & Verifiable Credentials Management Platform by Linux Foundation Decentralized Trust.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text. The document describes the platform as an open-source SSI and VC management tool but does not mention Post-Quantum Cryptography algorithms, hybrid modes, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "Open standards based" and "FIDO Passkeys" via WebauthN, but does not list specific cryptographic primitives like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated (Text mentions "Mobile SDK" and "WebauthN Server" for Passkeys, but does not describe the underlying key management architecture or formats).
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 (Also CC0-1.0 for wiki repository)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Based on "Updated Mar 6, 2026" in repository listings; note: this appears to be a future date in the source text context).
- **FIPS Validated**: No mention
- **Primary Platforms**: Web (Studio UI), Mobile (React-Native SDK), Server-side (TypeScript)
- **Target Industries**: Government (Royal Government of Bhutan, Papua New Guinea), Digital Identity Ecosystems
- **Regulatory Status**: Digital Public Good (DPG) approved by the UN-endorsed DPG Alliance.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://credebl.id

---

## Paradym (Animo Solutions)

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Paradym Wallet
- **Product Brief**: Mobile wallet to seamlessly manage and present your digital credentials.
- **PQC Support**: No
- **PQC Capability Description**: The provided text contains no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It focuses on ISO 18013-5/7, OpenID4VC, and DIDComm protocols without specifying underlying cryptographic primitives.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Uses device Secure Environment behind biometric authentication; specific key formats or programmatic management details not stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Mobile application utilizing device Secure Environment
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-05 (Last updated date for paradym-wallet repository)
- **FIPS Validated**: No
- **Primary Platforms**: iOS, Android (Mobile), TypeScript/Node.js/React Native
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://animo.id

---
