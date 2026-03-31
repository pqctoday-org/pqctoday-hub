---
generated: 2026-03-31
collection: csc_017
documents_processed: 9
enrichment_method: ollama-qwen3.5:27b
---


## sigstore/cosign

- **Category**: Code Signing and Software Integrity
- **Product Name**: sigstore/cosign
- **Product Brief**: Code signing and transparency for containers and binaries using Sigstore.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any migration plans to PQC standards. It focuses on current cryptographic methods like OIDC-based keyless signing and standard public key infrastructure.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "ephemeral keys", "public/private keypair", and "code signing certificate" but does not specify the underlying algorithms such as ECDSA, Ed25519, or RSA).
- **Key Management Model**: Hybrid (Supports "Keyless signing" via Fulcio CA, Hardware/KMS signing, local encrypted private/public keypairs, and Bring-your-own PKI).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based transparency log integration (Rekor) with optional local/HSM/KMS key management.
- **Infrastructure Layer**: Libraries, Security Stack
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 2.4.1 (mentioned in Dockerfile example); v2 series supported generally.
- **Release Date**: Not stated (Last Updated: 2026-03-06T14:26:35Z refers to repository metadata, not a specific release date).
- **FIPS Validated**: No
- **Primary Platforms**: Linux, macOS, Kubernetes, Docker/OCI registries.
- **Target Industries**: Not stated (General software supply chain security).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document describes signing workflows but does not list specific signature algorithms like ECDSA or Ed25519).
- **Authoritative Source URL**: https://github.com/sigstore/cosign

---

## Microsoft SignTool

- **Category**: Code Signing and Software Integrity
- **Product Name**: SignTool
- **Product Brief**: A command-line tool that digitally signs files, verifies signatures, removes signatures, and time stamps files.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms or support. It explicitly recommends SHA256 over SHA1 for digest algorithms but does not list any PQC primitives like CRYSTALS-Kyber or Dilithium.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SHA256, SHA1 (mentioned as less secure), PKCS #7
- **Key Management Model**: Uses Cryptographic Service Providers (CSP) and private key containers; supports PFX files with passwords.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Command-line tool utilizing Windows SDK components and CSPs.
- **Infrastructure Layer**: Libraries, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 10.0.22621.0 (referenced in installation path example)
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows (part of Windows Software Development Kit, Windows Hardware Lab Kit, Windows Driver Kit, Windows Assessment and Deployment Kit)
- **Target Industries**: Enterprise, Software Development
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Digital signatures using signing certificates (specific algorithm not explicitly named beyond digest requirements like SHA256); supports PKCS #7.
- **Authoritative Source URL**: Not stated

---

## Notary Project

- **Category**: Code Signing and Software Integrity
- **Product Name**: Notation
- **Product Brief**: A CLI tool to sign and verify artifacts in the OCI registry ecosystem.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any migration plans for PQC.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated (mentions integration with Azure Key Vault and AWS Signer but does not define the internal architecture model).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Libraries, Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-02-26 (Last Updated date)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (mentions OCI registry ecosystem, container images, and cloud integrations with Azure and AWS).
- **Target Industries**: Not stated (Topics include cloud-native, cncf, container, kubernetes).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/notaryproject/notation

---

## GPG Code Signing

- **Category**: Code Signing and Software Integrity
- **Product Name**: GnuPG (GNU Privacy Guard)
- **Product Brief**: A complete and free implementation of the OpenPGP standard enabling encryption, signing, and key management.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any plans for PQC migration. It only references the OpenPGP standard (RFC4880) and support for S/MIME and SSH.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions OpenPGP, S/MIME, and SSH support but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Versatile key management system with options for SQLite database storage (keyboxd) or file-based storage; supports smartcards.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Command line tool with frontend applications and libraries; uses daemons (gpg-agent, dirmngr, keyboxd).
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: GPL-3.0
- **Latest Version**: 2.5 (stable version mentioned); 2.6 (dependencies listed)
- **Release Date**: Not stated (Last Updated: 2026-03-05T17:32:50Z refers to repository update, not software release date)
- **FIPS Validated**: No
- **Primary Platforms**: Unix, Windows, Apple OSX, Cygwin
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (OpenPGP standard mentioned, specific schemes not listed)
- **Authoritative Source URL**: https://gnupg.org

---

## DigiCert Software Trust Manager

- **Category**: Code Signing and Software Integrity
- **Product Name**: DigiCert Software Trust Manager
- **Product Brief**: Enterprise solution for signing software and verifying hash commands using PQC algorithms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-DSA, SLH-DSA, and ML-KEM for private certificates. Features include pure PQC certificate issuance/renewal via EST, SCEP, ACME, CMPv2, REST API; batch issuance; client/server key generation; automated lifecycle management; and a free CLI for CSR generation. Public CA certificates with these algorithms are not currently issued by CertCentral.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: ML-DSA, SLH-DSA, ML-KEM
- **Key Management Model**: PQC-enabled HSM (available in US datacenters only); Client-side and server-side key pair generation
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-backed (PQC-enabled HSM), Software Trust
- **Infrastructure Layer**: Security Stack, Libraries
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025-11-17
- **FIPS Validated**: Yes (DigiCert TrustEdge C-SDK supports FIPS 140-3 certified crypto)
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC-enabled HSM will be available in United States datacenters only; OCSP support for ML-DSA not yet defined in RFC.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated

---

## Venafi CodeSign Protect

- **Category**: Code Signing and Software Integrity
- **Product Name**: Venafi CodeSign Protect
- **Product Brief**: Experimental post-quantum cryptography support for code signing and verification within the Trust Protection Platform.
- **PQC Support**: Partial (Experimental)
- **PQC Capability Description**: Experimental support for ML-DSA, SLH-DSA, and Falcon (TLS only). Requires activation on Trust Protection Platform server. Supported for CodeSign Protect clients, libhsm API, and PKCS#11 applications. Features labeled "Experimental" in console. Higher processing time due to key sizes.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA, SLH-DSA, Falcon
- **Key Management Model**: Software storage required for PQC environments; HSM connectors available for general use but PQC must use "Software" location.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based key storage for PQC; supports HSM connectors generally.
- **Infrastructure Layer**: Libraries, Security Stack
- **License Type**: Proprietary
- **License**: Commercial (subject to active license agreement with Venafi, Inc. and/or CyberArk Ltd.)
- **Latest Version**: 25.3
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Trust Protection Platform server; CodeSign Protect clients (CLI); WebAdmin; Aperture
- **Target Industries**: Enterprise (implied by code signing context)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Experimental support added to help plan for future PQC migration; standardization approaching. Activation requires contacting Venafi.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA, Falcon (TLS only)
- **Authoritative Source URL**: Not stated

---

## RPM Signing (rpm-sign)

- **Category**: Code Signing and Software Integrity
- **Product Name**: Red Hat Enterprise Linux (RHEL) 10.1 with rpm-sign
- **Product Brief**: Operating system enabling RPM package signing with quantum-resistant cryptography via technology preview features.
- **PQC Support**: Partial (Technology preview in RHEL 10.1; not intended for production use)
- **PQC Capability Description**: Technology preview in RHEL 10.1 supporting hybrid ML-DSA-87+Ed448 and ML-DSA-65+Ed25519 signatures via RPMv6 format using Sequoia-PGP tools. SLH-DSA is specified but not yet implemented. Features are not intended for production use.
- **PQC Migration Priority**: Medium (Technology preview status limits immediate criticality, though long-term stability for IoT/enterprise is cited)
- **Crypto Primitives**: ML-DSA-87, Ed448, ML-DSA-65, Ed25519, RSA (RSA-4096), SHA512, SHA256, SHA1, MD5
- **Key Management Model**: Hybrid keys (combining legacy and PQC algorithms) using OpenPGPv6 format with primary key and signing subkey structure
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based hybrid signature architecture using Sequoia-PGP tools within RPM infrastructure
- **Infrastructure Layer**: Security Stack, Libraries
- **License Type**: Commercial (Red Hat Enterprise Linux)
- **License**: Not stated
- **Latest Version**: 10.1
- **Release Date**: 2025-10-07 (Article date; RHEL 10.1 release date not explicitly stated as a separate event)
- **FIPS Validated**: No
- **Primary Platforms**: Red Hat Enterprise Linux 10.1, Fedora (mentioned for configuration differences), upstream RPM
- **Target Industries**: IoT, embedded systems, enterprise systems, developers, vendors
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Technology preview in RHEL 10.1; future improvements planned for primary key generation with signing capabilities and SLH-DSA implementation
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA (OpenPGPv4), ML-DSA-87+Ed448, ML-DSA-65+Ed25519; Planned/Specified: SLH-DSA (not implemented)
- **Authoritative Source URL**: Not stated

---

## Garantir GaraTrust

- **Category**: Code Signing and Software Integrity
- **Product Name**: GaraTrust
- **Product Brief**: Integrated cybersecurity platform for enterprise supporting code signing, TLS, SSH, and certificate lifecycle management.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document discusses PQC as a future requirement under CNSA 2.0, mentioning LMS, XMSS, and ML-DSA as algorithms to adopt. It states vendors should support PQC by 2025 with exclusive use by 2030. Garantir offers guidance for this transition but does not explicitly state that GaraTrust currently implements these algorithms in production; it frames the adoption as a necessary future step for compliance.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECC (mentioned as legacy/vulnerable), LMS, XMSS, ML-DSA, Dilithium (mentioned as algorithms to integrate)
- **Key Management Model**: HSM-backed (keys stored in Hardware Security Modules with proxied access)
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Enterprise environments (specific OS or cloud platforms not stated)
- **Target Industries**: Software / SaaS, IoT, Manufacturing, Banking & Finance, Legal, Insurance, Healthcare, Government
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Aligns with CNSA 2.0; recommends supporting PQC algorithms by 2025 and exclusive use of quantum-safe signatures by 2030. Mentions integrating LMS/XMSS and Dilithium into signing workflows.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA, ECC (legacy); Planned/Recommended: LMS, XMSS, ML-DSA, Dilithium
- **Authoritative Source URL**: Not stated

---

## Java jarsigner (JDK)

- **Category**: Code Signing and Software Integrity
- **Product Name**: Java SE / JDK (specifically Release 24)
- **Product Brief**: A Java platform release delivering a quantum-resistant Module-Lattice-Based Digital Signature Algorithm (ML-DSA) implementation.
- **PQC Support**: Yes (with details: ML-DSA implemented in Release 24; TLS and JAR signing support not yet included due to missing standards).
- **PQC Capability Description**: Implements ML-DSA (FIPS 204) via KeyPairGenerator, Signature, and KeyFactory APIs. Supports parameter sets ML-DSA-44, ML-DSA-65, and ML-DSA-87. Does not support Dilithium or Pre-Hash ML-DSA. JAR-file signing and TLS support are explicitly excluded until standards exist.
- **PQC Migration Priority**: High (Critical for government systems handling sensitive information; essential for future-proofing against quantum attacks on RSA/Diffie-Hellman).
- **Crypto Primitives**: ML-DSA, RSA, Diffie-Hellman, ECDSA (implied via EC), AES, ChaCha20-Poly1305, DES, Blowfish.
- **Key Management Model**: Software-based implementation within the JDK security libraries; supports PKCS #8 and X.509 key encodings.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software library (JDK security-libs)
- **Infrastructure Layer**: Libraries, Security Stack
- **License Type**: Open Source/Commercial
- **License**: GPLv2 (stated in footer), Oracle Corporation copyright
- **Latest Version**: Release 24
- **Release Date**: Not stated (Document updated 2025/11/03; JEP created 2024/08/26)
- **FIPS Validated**: No (Algorithm standardized in FIPS 204, but implementation validation status not stated)
- **Primary Platforms**: All platforms to which the JDK is ported (AArch32, AArch64, BSD, Haiku, MIPS, Mobile, PowerPC/AIX, RISC-V, s390x, etc.)
- **Target Industries**: Government (US government systems), Enterprise, General Software Development
- **Regulatory Status**: Not stated (Mentions US government requirement to upgrade to ML-DSA)
- **PQC Roadmap Details**: ML-DSA implemented in Release 24. Support for JAR-file signing and TLS planned for future releases once standards exist. Pre-Hash ML-DSA may be implemented in a future release.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), RSA, DSA, ECDSA (via EC), RSASSA-PSS
- **Authoritative Source URL**: Not stated (Source text references openjdk.org context but no specific URL provided)

---
