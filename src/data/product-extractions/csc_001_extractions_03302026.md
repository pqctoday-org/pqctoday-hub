---
generated: 2026-03-30
collection: csc_001
documents_processed: 10
enrichment_method: ollama-qwen3.5:27b
---

## 01 Quantum IronCAP

- **Category**: Cryptographic Libraries
- **Product Name**: IronCAP ™ Toolkits
- **Product Brief**: Post-quantum cryptography toolkits enabling vendors to secure vertical applications against classical and quantum attacks.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Combines NIST-approved PQC algorithms with patent-protected quantum-safe technology. Supports email/file encryption, digital signatures, blockchain security, remote access/VPN, password management, credit card security, cloud storage, and website security. Designed for seamless integration via OpenSSL, PKCS#11, and OpenPGP standards.
- **PQC Migration Priority**: High
- **Crypto Primitives**: NIST-approved PQC algorithms (specific names not stated), patent-protected quantum-safe technology (specific names not stated)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable (supports blockchain vendors generally, specific networks not listed)
- **Architecture Type**: Software toolkit compliant with OpenSSL, PKCS#11, and OpenPGP standards
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (supports vertical applications, IoT devices, cloud storage)
- **Target Industries**: Blockchain, IoT, Data Storage, Remote Access, Email Security, Financial Transactions, Cloud Storage, Website Security
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Uses NIST-approved PQC algorithms combined with proprietary technology; no specific timeline or algorithm names provided.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Digital signing using NIST-approved PQC algorithms and patent-protected quantum-safe technology (specific schemes not stated)
- **Authoritative Source URL**: Unknown

---

## SafeLogic CryptoComply

- **Category**: Cryptographic Libraries
- **Product Name**: CryptoComply PQ TLS
- **Product Brief**: Drop-in, commercial-grade, quantum-resistant TLS solution leveraging CAVP-certified ML-KEM.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides a drop-in replacement for OpenSSL 3.x based TLS 1.3. Features Pure PQ mode using NIST standard ML-KEM (FIPS 203), Hybrid mode combining classical and PQC, and Legacy mode. Implementation is CAVP-certified and claims to be 20% faster than PKI.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, P256, P384, P521, X25519, RSA (mentioned as vulnerable context), Elliptic Curve Cryptography
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software-based TLS implementation
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (FIPS 140-3 validated algorithms; CAVP-certified ML-KEM implementation)
- **Primary Platforms**: Go, Java, Mobile, .NET (Core); Multiple platforms mentioned generally.
- **Target Industries**: Communications, Cybersecurity, Financial Services, Healthcare, Public Sector, Technology, Government, Military
- **Regulatory Status**: FIPS 140-3, CAVP certified, CNSA 2.0, CMMC 2.0, Common Criteria, FedRAMP, GovRAMP
- **PQC Roadmap Details**: Supports NIST standard ML-KEM (FIPS 203); offers Pure PQ, Hybrid, and Legacy modes for migration.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document focuses on Key Encapsulation Mechanisms like ML-KEM and ECDH curves P256/P384/P521/X25519 for TLS handshakes; specific signature algorithms are not listed).
- **Authoritative Source URL**: www.safelogic.com

---

## SAP Cryptographic Library

- **Category**: Cryptographic Libraries
- **Product Name**: SAP Cryptographic Library
- **Product Brief**: Enables applications like SAP S/4 HANA to support security protocols such as TLS, SNC, SSF, and X.509 with quantum-safe cryptography.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Version 8.6 enables quantum-safe TLS 1.3 handshake using hybrid ECDHE-MLKEM key agreement based on X25519MLKEM768. ML-KEM is a standardized FIPS-203 algorithm for key encapsulation, preventing session key decryption by quantum computers.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDHE, X25519, MLKEM (ML-KEM), Elliptic Curve Cryptography
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (ECDHE-MLKEM)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 8.6 (specifically CommonCryptoLib 8.6.2 mentioned in release note)
- **Release Date**: 2025-12-12
- **FIPS Validated**: Yes, FIPS 140-3 certified (Certificate #5093) for the FIPS crypto kernel module.
- **Primary Platforms**: SAP NetWeaver Application Server for ABAP, SAP HANA
- **Target Industries**: US public sector agencies, healthcare, financial industries, Enterprise
- **Regulatory Status**: FIPS 140-3 certified (Certificate #5093)
- **PQC Roadmap Details**: Version 8.6 implements hybrid ECDHE-MLKEM (X25519MLKEM768) for TLS 1.3; ML-KEM standardized as FIPS-203.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions key agreement algorithms ECDHE and MLKEM, but does not explicitly list signature schemes like ECDSA or Ed25519)
- **Authoritative Source URL**: Not stated

---

## PQShield PQSDK

- **Category**: Cryptographic Libraries
- **Product Name**: PQShield PQSDK
- **Product Brief**: Software development kit integrating post-quantum and classical cryptographic primitives with OpenSSL and mbedTLS.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides implementations of PQC key agreement and digital signature algorithms via PQCryptoLib integrated into OpenSSL (v3.2.0+) and mbedTLS (v3.2.1). Supports hybrid modes (classical plus PQC). Enables post-quantum TLS 1.3 and X.509 PKI support. Algorithms include Falcon, ML-KEM, and ML-DSA.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Falcon 512/1024, FIPS-203 ML-KEM 512/768/1024, FIPS-204 ML-DSA 2/3/5 (OpenSSL); Falcon 512/1024, FIPS-204 ML-DSA 44/65/87, FIPS-203 ML-KEM 512/768/1024 (mbedTLS); All existing classical cryptography via OpenSSL.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library integration (OpenSSL/mbedTLS)
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: R24.3.1
- **Release Date**: 2024-07-12
- **FIPS Validated**: No (References FIPS-203 and FIPS-204 standards for algorithms, but no validation status mentioned)
- **Primary Platforms**: Linux (x86_64 and ARM64), macOS, MS Windows
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Enables experimentation and prototyping before full deployment; supports migration use cases including TLS, PKI, VPN, web servers, user authentication, software signing, and Zero Trust.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Falcon 512/1024, FIPS-204 ML-DSA 2/3/5 (OpenSSL), FIPS-204 ML-DSA 44/65/87 (mbedTLS)
- **Authoritative Source URL**: Not stated

---

## leancrypto

- **Category**: Cryptographic Libraries
- **Product Name**: leancrypto
- **Product Brief**: A cryptographic library exclusively containing PQC-resistant algorithms with minimal dependencies and support for multiple environments.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The library exclusively contains PQC-resistant algorithms. It implements NIST-approved schemes: ML-DSA/Dilithium, ML-KEM/Kyber, SLH-DSA/Sphincs+, and BIKE. Accelerated implementations exist for x86_64, ARMv7/ARMv8, and RISCV64. Algorithms are tested with NIST ACVP and hold official CAVP certificates.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Ascon, SHA2, SHA-3, Curve 25519, Curve 448, ML-DSA (Dilithium), ML-KEM (Kyber), SLH-DSA (Sphincs+), BIKE, AES, ChaCha20, KMAC
- **Key Management Model**: Programmatic key management via library API; supports PKCS#8 generator and parser; stack-only or heap allocation supported.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software cryptographic library (User space, Linux kernel module, EFI)
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-11-17
- **FIPS Validated**: Yes (Official CAVP certificates received for algorithms tested with NIST ACVP; references FIPS 203, FIPS 204, FIPS 205)
- **Primary Platforms**: Linux user space, Linux kernel space, BSD user space, Apple OSes user space, Windows user space, EFI environment
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Library exclusively contains PQC-resistant algorithms; supports NIST-approved post-quantum asymmetric algorithms (ML-DSA, ML-KEM, SLH-DSA) with composite algorithms and accelerations.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (Dilithium), SLH-DSA (Sphincs+), Ascon-Hash256, SHA-3 derivatives, KMAC256
- **Authoritative Source URL**: Not stated

---

## SandboxAQ Sandwich

- **Category**: Cryptographic Libraries
- **Product Name**: Sandwich
- **Product Brief**: Open source meta-library of cryptographic algorithms enabling agile cryptography implementation.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Includes libOQS library providing access to new post-quantum cryptography (PQC) algorithms from NIST. Enables developers to embed PQC directly into applications and swap algorithms without rewriting code. Supports hybrid mode via "sandwich" of protocols.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (mentions support for cryptographic libraries OpenSSL, BoringSSL, libOQS but does not list specific primitives like ECDSA or Ed25519)
- **Key Management Model**: Not stated (mentions future planned features may include key management services (KMS), but current model is not described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Meta-library/Framework
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2023-08-08
- **FIPS Validated**: No
- **Primary Platforms**: MacOS, Linux; Languages: C/C++, Rust, Python, Go
- **Target Industries**: Government (U.S. Air Force, DISA, HHS), Enterprise, Telecommunications, Banking
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Future iterations planned to enable multi-layered stacked sandwiches and access to fundamental primitives or functionalities like authentication, VPNs, or KMS. Supports algorithms soon to be standardized by NIST.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (mentions support for PQC algorithms from NIST via libOQS but does not list specific signature schemes)
- **Authoritative Source URL**: https://www.sandboxaq.com/solutions/sandwich

---

## QuintessenceLabs qSOC

- **Category**: Cloud Key Management
- **Product Name**: QuintessenceLabs qSOC (Trusted Security Foundation® / TSF®)
- **Product Brief**: Centralized, vendor-neutral encryption key management solution supporting PQC and quantum entropy.
- **PQC Support**: Yes (with details: Supports NIST Quantum Resistant Algorithms and NIST approved PQC algorithms via qConnect and TSF).
- **PQC Capability Description**: The Trusted Security Foundation (TSF) provides PQC crypto-agile key management supporting the latest NIST Quantum Resistant Algorithms. The qConnect Quantum Safe Key Distributor enables quantum safe key distribution using NIST approved PQC algorithms, standard industry protocols, and supports hybrid QKD/PQC key delivery. Integration with PQShield quantum resistant algorithm implementations is described for TSF KMS and qClient SDK.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, DH (mentioned as legacy targets), NIST Quantum Resistant Algorithms (specific names not listed), Symmetric encryption (256-bit keys).
- **Key Management Model**: Centralized, vendor-neutral key and policy management; supports KMIP and PKCS#11 APIs; integrates with QKD for key distribution; supports hybrid QKD/PQC delivery.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Software SDK, Virtual Machine, Network Attached Appliance, Hardware QKD)
- **Infrastructure Layer**: Application, Security Stack, Cloud, Hardware, Network
- **License Type**: Commercial
- **License**: Proprietary (©2025 QuintessenceLabs. All rights reserved.)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No (NIST 800-90B Certified for entropy; mentions NIST algorithms are being developed into FIPS, but does not state the product itself is FIPS validated).
- **Primary Platforms**: Virtual Machine, Network Attached Appliance, On-premise, Cloud, Mobile (via qProtect), any application via SDK.
- **Target Industries**: Insurance, Public sector, Banking, Life sciences, Advanced industries, Global energy and materials, Telecom, media, and technology, Consumer electronics, Travel and logistics.
- **Regulatory Status**: Common Criteria Certified; NIST 800-90B Certified (for qStream QRNG).
- **PQC Roadmap Details**: Supports latest NIST Quantum Resistant Algorithms; integrates with PQShield implementations; designed for seamless transition to a post-quantum world; supports hybrid QKD/PQC delivery.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions support for PQC algorithms and RSA/ECC/DH context, but does not list specific signature schemes like Ed25519 or Dilithium).
- **Authoritative Source URL**: www.quintessencelabs.com

---

## Amazon Web Services (AWS)

- **Category**: Cloud Key Management
- **Product Name**: Amazon Web Services (AWS)
- **Product Brief**: Cloud platform offering PQC migration strategies, TLS/SFTP implementations, and key management services.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements hybrid PQ-TLS 1.3 (SecP256r1MLKEM768, X25519MLKEM768) in AWS SDK for Java v2 and PQ-SFTP policies (mlkem768nistp256-sha256, mlkem1024nistp384-sha384, mlkem768x25519-sha256) via AWS Transfer Family. Mentions ML-KEM and ML-DSA adoption timelines.
- **PQC Migration Priority**: High
- **Crypto Primitives**: SecP256r1, X25519, ML-KEM (MLKEM768, MLKEM1024), NIST P-256, NIST P-384, SHA-256, SHA-384
- **Key Management Model**: Cloud Key Management Service (AWS KMS) with programmatic access via SDK; mentions complications around ML-DSA in cloud key management systems.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cloud-centric, Shared-responsibility model
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Commercial/Open Source (AWS-LC mentioned as Open Source)
- **License**: Not stated
- **Latest Version**: AWS SDK for Java v2; AWS-LC-FIPS-3.0
- **Release Date**: 2025-03-24 (Document date); November, 2024 (AWS-LC-FIPS-3.0); January, 2025 (ML-KEM TLS 1.3 Policies)
- **FIPS Validated**: Yes (AWS-LC-FIPS-3.0 mentioned; FIPS 203 IPD and CMVP Pending noted)
- **Primary Platforms**: AWS Cloud, Java (SDK), OpenSSH, Putty, AsyncSSH, Dropbear, jsch
- **Target Industries**: Enterprise, Government (references CNSA 2.0, NIST timelines)
- **Regulatory Status**: References NIST SP800-208, Draft IR 8547, FIPS 203, FIPS 204, FIPS 205, CNSA 1.0/2.0, CNSSP 15
- **PQC Roadmap Details**: Timeline includes 2025 for ML-KEM TLS 1.3 policies; 2024-2025 for AWS-LC-FIPS-3.0; Long-term migration strategy covering inventorying use cases and long-lived roots of trust.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (planned/complications noted), LMS/XMSS (referenced in CNSA 2.0 context)
- **Authoritative Source URL**: https://github.com/aws-samples/aws-kms-pq-tls-example; https://docs.aws.amazon.com/transfer/latest/userguide/post-quantum-security-policies.html

---

## Microsoft Azure

- **Category**: Cloud Key Management
- **Product Name**: Microsoft Azure (specifically Azure Key Vault and SymCrypt library context)
- **Product Brief**: Cloud platform offering quantum-safe security capabilities via SymCrypt library updates and Azure Key Vault services.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: PQC algorithms (ML-KEM, ML-DSA) are available through CNG and Certificate functions for Windows Insiders and Linux. TLS 1.3 hybrid key exchange is enabled in SymCrypt-OpenSSL v1.9.0. Full transition of services planned by 2033, with early adoption starting 2029.
- **PQC Migration Priority**: High
- **Crypto Primitives**: AES, RSA, ECDSA, ML-KEM, ML-DSA, FrodoKEM (research/standardization context)
- **Key Management Model**: Not stated (mentions key and secret management services but no specific architectural model like MPC or HSM details in text)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Commercial/Open Source
- **License**: Not stated (SymCrypt and Adams Bridge Accelerator mentioned as open-source; Azure services are commercial)
- **Latest Version**: 1.9.0 (SymCrypt-OpenSSL)
- **Release Date**: 2025-08-20 (Blog post date; specific software release dates not stated)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows, Linux, Microsoft Azure, Microsoft 365
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail
- **Regulatory Status**: Aligned with NIST, CISA, OMB, CNSA 2.0, CNSSP-15, ISO standards
- **PQC Roadmap Details**: Early adoption by 2029; default in subsequent years; full transition of services and products by 2033. Uses hybrid approach (classical + PQC) as interim step before full PQC shift.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA, ML-DSA (planned/preview), RSA (current)
- **Authoritative Source URL**: https://www.microsoft.com/security/blog (inferred from context "Microsoft Security Blog" and text source)

---

## Google Cloud Platform (GCP)

- **Category**: Cloud Key Management
- **Product Name**: Google Cloud Platform (GCP) / Cloud KMS
- **Product Brief**: Cloud infrastructure enabling customers to protect workloads with NIST-approved PQC algorithms via libraries like BoringSSL and Tink.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implementing PQC according to NIST standards, specifically prioritizing ML-KEM for store-now-decrypt-later mitigation. Enabling developers to use NIST-approved PQC algorithms via Google libraries BoringSSL and Tink. Starting with Quantum-Safe Signatures in Cloud KMS.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, TLS, SSH, ALTS, PKI, Symmetric Cryptography
- **Key Management Model**: Programmatic key management via libraries (Tink, BoringSSL) and Cloud KMS; supports cryptographic agility and key rotation.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Cloud Infrastructure + 3rd party tooling + Customer Workloads)
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Proprietary / Open Source (libraries)
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: 2025-03-24
- **FIPS Validated**: No
- **Primary Platforms**: Google Cloud Platform (GCP), Chrome, Chromium
- **Target Industries**: Enterprise, Finance (FS-ISAC mentioned), Telco (GSMA mentioned)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Phase 1: Architectural Readiness (Secure by Design, crypto key inventory); Phase 2: Roll Out (enabling customer workload security). Prioritizing ML-KEM implementation.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Quantum-Safe Signatures (specific algorithms not named beyond general PQC context), Digital Signing (PKI)
- **Authoritative Source URL**: https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-why-we-need-to-get-ready-for-pqc

---