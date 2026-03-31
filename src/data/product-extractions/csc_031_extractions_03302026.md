---
generated: 2026-03-30
collection: csc_031
documents_processed: 5
enrichment_method: ollama-qwen3.5:27b
---

## Android 16

- **Category**: Operating Systems
- **Product Name**: Android 16
- **Product Brief**: Operating system implementing Post-Quantum Cryptography as announced in a Google Security Blog post.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document announces the implementation of Post-Quantum Cryptography in Android, titled "Security for the Quantum Era," but does not specify specific algorithms, maturity levels, or current deployment status beyond the announcement date.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: OS
- **License Type**: Open Source/Commercial (inferred from "Open Source" label and Google product context, but specific license type not explicitly defined in text) -> Unknown
- **License**: Not stated
- **Latest Version**: Android 16
- **Release Date**: 2026-03-25
- **FIPS Validated**: No
- **Primary Platforms**: Android
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implementation of Post-Quantum Cryptography announced for March 25, 2026; specific algorithm choices or detailed timelines not stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## iOS 26 / macOS 26

- **Category**: Operating Systems
- **Product Name**: iOS 26 / macOS 26 (Apple Operating Systems)
- **Product Brief**: Apple operating systems featuring hybrid post-quantum cryptography support across messaging, TLS, VPN, and developer APIs.
- **PQC Support**: Yes (with details: Hybrid cryptography deployed in iMessage PQ3, TLS, VPN, SSH, and CryptoKit for iOS 26/macOS 26).
- **PQC Capability Description**: Apple uses hybrid cryptography combining classical and post-quantum algorithms. Deployed in iMessage (PQ3), TLS/HTTPS (URLSession/Network framework), native VPN/IKEv2, SSH (macOS 26), and Apple Watch pairing. CryptoKit supports ML-KEM (768, 1024) for encryption and ML-DSA (65, 87) for authentication.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, Elliptic Curve Diffie-Hellman, Elliptic Curve signature, ML-KEM, ML-DSA
- **Key Management Model**: Hybrid cryptography; utilizes Secure Enclave and iCloud Keychain (mentioned in context of OS security).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (combines classic algorithms with post-quantum algorithms); Kernel-level support via native APIs.
- **Infrastructure Layer**: Operating Systems, Security Stack, Network
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: iOS 26, macOS 26, iPadOS 26, watchOS 26, tvOS 26, visionOS 26
- **Release Date**: 2026-01-28 (Published Date of document)
- **FIPS Validated**: Not stated
- **Primary Platforms**: iOS, macOS, iPadOS, watchOS, tvOS, visionOS
- **Target Industries**: Consumer, Enterprise, Government, Education
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Adopting hybrid cryptography; deployed ML-KEM and ML-DSA in CryptoKit for iOS 26/macOS 26; prioritizing sensitive user information protocols.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Elliptic Curve signature, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: Not stated (Document source: iOS_26___macOS_26_doc1.html)

---

## Fedora Linux

- **Category**: Operating Systems
- **Product Name**: Fedora Linux
- **Product Brief**: An innovative, free, and open source platform for hardware, clouds, and containers enabling tailored solutions.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports experimental PQ algorithms via liboqs and oqsprovider integrated into OpenSSL and NSS. Includes Kyber, Dilithium, ML-KEM, and ML-DSA in Fedora 39, 40, and Rawhide. Enables hybrid PQ key exchange in TLS for NGINX and curl. Not yet supported for package signature verification or secure boot.
- **PQC Migration Priority**: Medium
- **Crypto Primitives**: Kyber, Dilithium, ML-KEM, ML-DSA (PQ); OpenSSL, NSS, GnuTLS (libraries)
- **Key Management Model**: OS keychain via crypto policies; manual key generation required for testing containers; no specific TPM or HSM integration stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Kernel vs userspace crypto via pluggable provider model (OpenSSL providers API, NSS PKCS#11)
- **Infrastructure Layer**: OS, Security Stack
- **License Type**: Open Source
- **License**: Not stated (described as "free, and open source")
- **Latest Version**: Fedora Rawhide (future Fedora 41)
- **Release Date**: 2024-07-05
- **FIPS Validated**: No
- **Primary Platforms**: Fedora Linux (versions 39, 40, Rawhide/41); containers; Flatpak for Firefox
- **Target Industries**: Software developers, community members, research environments (QUBIP consortium)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Integrating liboqs and oqsprovider; upgrading to match NIST draft standards (ML-KEM, ML-DSA); adding hybrid Kyber algorithms; planning documentation before public release.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Dilithium, ML-DSA (PQ signatures mentioned as supported in Rawhide)
- **Authoritative Source URL**: Not stated

---

## Debian 12 (Bookworm)

- **Category**: Operating Systems
- **Product Name**: Debian 12 (Bookworm)
- **Product Brief**: Operating system platform with a wiki page collating ideas and questions regarding Post-Quantum Cryptography (PQC) use.
- **PQC Support**: Planned (with timeline: "TODO: Add questions, FAQs, links later")
- **PQC Capability Description**: The document is a draft wiki page intended to collate ideas and questions about PQC in Debian. It lists external resources including IETF drafts and NIST FIPS standards (FIPS 203 ML-KEM/Kyber, FIPS 204 ML-DSA/Dilithium, FIPS 205 Sphincs+, DRAFT FIPS 206 FN-DSA/NTRU) and links to Open Quantum Safe libraries. No specific implementation status or maturity level within Debian 12 is stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document lists external standards like ML-KEM, CRYSTALS-Dilithium, Sphincs+, NTRU as references, but does not state they are currently implemented in the OS)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Operating Systems
- **License Type**: Open Source (implied by "Debian" and "Creative Commons Attribution-ShareAlike 4.0 International" for the wiki content)
- **License**: Creative Commons Attribution-ShareAlike 4.0 International (for the wiki page content); OS license not explicitly stated in text.
- **Latest Version**: Debian 12 (Bookworm)
- **Release Date**: Not stated (Document last modified: 2024-11-12)
- **FIPS Validated**: No (Document lists FIPS 203, 204, 205, and DRAFT 206 as external references/links, not as validation status for the OS)
- **Primary Platforms**: Debian 12 (Bookworm)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: "TODO: Add questions, FAQs, links later"; lists external standards and drafts as reference material.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (References to ML-DSA, Sphincs+, FN-DSA are listed as external standards, not current OS capabilities)
- **Authoritative Source URL**: Not stated (Document contains links to IETF, NIST, Open Quantum Safe, but no specific product URL for Debian 12 PQC implementation)

---

## Alpine Linux

- **Category**: Operating Systems
- **Product Name**: Alpine Linux
- **Product Brief**: Operating system providing PQC support via OpenSSL 3.5.x in release 3.22.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: PQC support is available in Alpine Linux 3.22 which ships with OpenSSL 3.5.x, enabling NIST-approved PQC algorithms by default. Version 3.21 uses OpenSSL 3.3.x and does not support PQC. Older versions can use the OQS provider workaround for key exchange but lack server authentication support until OpenSSL 3.2+.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519MLKEM768, X25519, prime256v1, NIST-approved PQC algorithms (specific names not listed beyond hybrid group)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: OS-level crypto support via OpenSSL library integration; supports OQS provider plugin model for older versions.
- **Infrastructure Layer**: Operating Systems, Security Stack
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: 3.22
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Alpine Linux (specifically version 3.22)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC enabled by default in OpenSSL 3.5.x (Alpine 3.22); older versions require manual OQS provider installation with limitations on TLS 1.3 server authentication for OpenSSL <3.2.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document notes PQC signature algorithms are not supported for TLS 1.3 server authentication in OpenSSL 3.0.x/3.1.x)
- **Authoritative Source URL**: github.com/nginxinc (referenced as source context, though document is an NGINX blog post about Alpine compatibility)

---
