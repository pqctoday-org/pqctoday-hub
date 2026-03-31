---
generated: 2026-03-31
collection: csc_051
documents_processed: 10
enrichment_method: ollama-qwen3.5:27b
---

## IDEMIA Digital Identity Platform

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: IDEMIA Digital Identity Platform
- **Product Brief**: A digital identity and verifiable credentials platform offering biometrics, cryptography, and secure transaction solutions.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Offers "Quantum-ready cryptographic libraries" and "Post-Quantum Security Consulting." Actively deploying NIST-standardized algorithms (ML-DSA, ML-KEM). Conducted proofs of concept including quantum-resistant smart cards (2019), Quantum-Safe 5G SIMs with Telefónica España, and quantum-safe TLS connections using crypto-agile eSIMs. Focuses on hybrid approaches and crypto-agility for embedded systems.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-DSA, ML-KEM (NIST standardized); Classical cryptography (specific algorithms not listed).
- **Key Management Model**: Hybrid approach (combining traditional and post-quantum cryptography); Crypto-agile architecture; HSM-backed (Hardware Security Module mentioned).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (Classical + Post-Quantum), Hardware-based (Smart cards, eSIMs, Secure Elements)
- **Infrastructure Layer**: Security Stack, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2024-11-18 (Date of the article update; specific product release date not stated)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Embedded systems, Smart cards, eSIMs, IoT devices, Secure Elements
- **Target Industries**: Government, Public Security, Payment, Connectivity, Travel, Justice & Public Safety, Enterprise
- **Regulatory Status**: Not stated (Mentions NIST standardization contributions and ETSI/GSMA standards anticipation)
- **PQC Roadmap Details**: Implementing NIST finalized standards (August 2024); advocating for hybrid approach; developing crypto-agile solutions to allow remote updates; focusing on side-channel resistance for embedded implementations.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (Planned/Deployed), Classical signatures (specifics not listed)
- **Authoritative Source URL**: Unknown

---

## Procivis One

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Procivis One Open Core
- **Product Brief**: A Rust library providing cryptographic and metadata management tools for issuing, holding, and verifying decentralized digital identities and credentials.
- **PQC Support**: Yes (CRYSTALS-DILITHIUM 3 supported; FIPS-204 planned)
- **PQC Capability Description**: Supports CRYSTALS-DILITHIUM 3 (CRYDI3) as a post-quantum resistant signature scheme selected by NIST. The library includes this in the Credential formatter provider for JOSE/VC-JOSE-COSE proofs. Support for FIPS-204 is planned for the near future.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA (ES256), EdDSA (Ed25519), BBS+, ML-DSA, CRYSTALS-DILITHIUM 3
- **Key Management Model**: HSM-backed (Azure Key Vault) and Internal encrypted database
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software library with modular providers supporting HSM integration
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Not stated
- **Release Date**: 2025-10-06
- **FIPS Validated**: No (Support for FIPS-204 is planned; Crypto provider delimited for future NIST CMVP certification)
- **Primary Platforms**: Rust (≥ 1.75), Mobile devices (caching support mentioned)
- **Target Industries**: Government (funded by DHS SVIP), Enterprise, Digital Identity
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Support for FIPS-204 is planned for the near future; CRYSTALS-DILITHIUM 3 currently supported.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (ES256), EdDSA (Ed25519), BBS+, ML-DSA, CRYSTALS-DILITHIUM 3
- **Authoritative Source URL**: https://github.com/procivis/one-open-core

---

## walt.id

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: walt.id
- **Product Brief**: Open-source identity and wallet infrastructure for issuing, storing, and verifying W3C Verifiable Credentials.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any migration plans related to PQC. It focuses on standard cryptographic verification for W3C Verifiable Credentials.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "cryptographically verified" and "cryptographic underpinnings" but does not list specific algorithms like ECDSA, Ed25519, or RSA).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated (Mentions NFTs and Ethereum in repository descriptions, but no specific blockchain network support is detailed for the core platform).
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (for Community Stack); Commercial (for Enterprise Stack)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Based on repository update date "Updated Mar 6, 2026")
- **FIPS Validated**: No
- **Primary Platforms**: Multi-Platform Support for all major platforms and languages; Kotlin, Java, JavaScript, TypeScript, Vue, Go, Rust, Shell.
- **Target Industries**: Not stated (Mentions "Enterprise Ready" and compliance with regulations like eIDAS 2.0 and GDPR).
- **Regulatory Status**: Aligned with W3C, ISO, OIDF, IETF standards; Compliant with eIDAS 2.0 and GDPR.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
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
- **Product Brief**: Digital trust infrastructure for government services enabling secure identity solutions and verifiable credentials.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated. The document mentions "FIPS-compliant cryptography" and "strong privacy protections" but does not explicitly mention Post-Quantum Cryptography (PQC) algorithms, migration plans, or readiness.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: FIPS-compliant cryptography (specific algorithms not listed); standards mentioned include W3C Verifiable Credentials, ISO/IEC 18013 mDLs, SD-JWTs, OID4VP.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated (Tezos SDK is forked but not described as a supported network for the core product)
- **Architecture Type**: Standards-based, open, interoperable infrastructure; modular, scalable architecture; Zero Trust patterns.
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (for repositories like ssi, isomdl, sprucekit-mobile); Commercial (implied for full platform services)
- **Latest Version**: Not stated (Repository "w3c-vc-barcodes" mentions v0.7 implementation)
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-3 compliant cryptography mentioned; specific validation status of modules not detailed.
- **Primary Platforms**: Mobile (Apple, Google, OEM), Cloud, Legacy systems; Rust and Swift implementations.
- **Target Industries**: Government, Public Services
- **Regulatory Status**: NIST SP 800-63-4, NIST IAL2, NIST IAL3, FIPS 140-3, ISO/IEC 18013, W3C standards.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (General reference to "FIPS-compliant cryptography" and "strong identity proofing")
- **Authoritative Source URL**: https://spruceid.com

---

## EUDI Reference Wallet

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: EUDI Reference Wallet
- **Product Brief**: Open source reference implementation for a robust, interoperable digital identity wallet platform based on EU standards.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or research status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "electronic signatures" and "X5C certificate" but does not specify algorithms like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Text mentions "Architecture Reference Framework" but does not detail the cryptographic architecture type)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0, EUPL-1.2
- **Latest Version**: Not stated (Text mentions "release/tag" generally but no specific version number)
- **Release Date**: 2026-03-06 (Based on repository update dates listed as "Mar 6, 2026")
- **FIPS Validated**: No
- **Primary Platforms**: Android, iOS, Web (Backend Restful service), Multiplatform
- **Target Industries**: Government, Public Sector, Private Sector (EU citizens and businesses)
- **Regulatory Status**: Aligned with eIDAS Regulation and the new Digital Identity Regulation; developed under European Commission Recommendation.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://ec.europa.eu/digital-building-blocks/sites/display/EUDIGITALIDENTITYWALLET/EU+Digital+Identity+Wallet+Home

---

## Sphereon SSI SDK

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Sphereon SSI SDK
- **Product Brief**: Self Sovereign Identity SDK adding OID4VC, Presentation Exchange, and MS Entra support to Veramo-based agents.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms or migration plans. It explicitly states support for "BBS+, RSA key support" in a separate crypto extensions project, but no PQC primitives are listed.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BBS+, RSA, JWT, JSON-LD
- **Key Management Model**: Not stated (mentions integration with Key Management system and DID providers)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software SDK / Plugin-based agent architecture
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: v0.37.1
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: NodeJS, React-Native, Browser, REST APIs
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: BBS+, RSA (via crypto extensions), JWT, JSON-LD
- **Authoritative Source URL**: https://github.com/Sphereon-Opensource/SSI-SDK

---

## Hyperledger Aries (ACA-Py)

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Hyperledger Aries (ACA-Py)
- **Product Brief**: An archived project whose core components have transitioned to new locations including ACA-Py, Bifold Wallet, and Credo-TS.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise, Decentralized Identity
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://aca-py.org

---

## CREDEBL

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: CREDEBL
- **Product Brief**: Open-source Decentralized Identity & Verifiable Credentials Management Platform by Linux Foundation Decentralized Trust.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "Open standards", "DIDs", "VCs", "FIDO Passkeys", but does not list specific cryptographic primitives like ECDSA, Ed25519, etc.)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Decentralized Identity & Verifiable Credentials Platform (Issuer–holder–verifier flows)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Last updated date for 'platform' repository)
- **FIPS Validated**: No
- **Primary Platforms**: Web (Studio UI), Mobile (React-Native SDK, Reference App), Server (WebauthN Server)
- **Target Industries**: Government, Education, Enterprise, Regulated industries
- **Regulatory Status**: Digital Public Good (DPG) approved by the UN-endorsed DPG Alliance
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://credebl.id

---

## Paradym (Animo Solutions)

- **Category**: Digital Identity & Verifiable Credentials
- **Product Name**: Paradym Wallet
- **Product Brief**: Mobile wallet to seamlessly manage and present your digital credentials.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any migration plans related to PQC. It focuses on ISO 18013-5/7 mDOC, OpenID4VC, and DIDComm protocols without specifying underlying cryptographic primitives beyond general references to "cryptographic operations."
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "cryptographic operations" and "commit signature verification" generally but does not list specific algorithms like ECDSA, Ed25519, or RSA).
- **Key Management Model**: Uses device Secure Environment behind biometric authentication.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Mobile wallet utilizing device Secure Environment; TypeScript-based SDKs and libraries.
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 (stated for paradym-wallet, openid4vc-playground, paradym-sdk-ts, etc.)
- **Latest Version**: Not stated
- **Release Date**: 2026-03-05 (Last updated date for paradym-wallet repository)
- **FIPS Validated**: No
- **Primary Platforms**: iOS & Android (Mobile), Node.JS, React Native
- **Target Industries**: Self-sovereign identity solutions; Government (mentioned in context of EUDI integration and OpenID Federation).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://animo.id

---
