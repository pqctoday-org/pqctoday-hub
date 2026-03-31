---
generated: 2026-03-31
collection: csc_045
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## Google Cloud KMS

- **Category**: Cloud Key Management Service (KMS)
- **Product Name**: Google Cloud KMS
- **Product Brief**: A cloud key management service providing encryption, signing, and key encapsulation with software and HSM protection levels.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: PQC signing algorithms are in "Preview" status under Pre-GA Offerings Terms. Supported signing algorithms include ML-DSA-65 (Module-lattice-based) and SLH-DSA-SHA2-128S (Stateless hash-based), available as pure or pre-hash variants. Key Encapsulation Mechanisms (KEMs) are fully supported with ML-KEM-768, ML-KEM-1024 (FIPS 203), and KEM-XWING (hybrid).
- **PQC Migration Priority**: High
- **Crypto Primitives**: AES-256-GCM, EdDSA (Curve25519), ECDSA (P-256, P-384, Secp256k1), RSA (PKCS#1 v1.5, RSASSA-PSS), HMAC (SHA-1 to SHA-512), ML-DSA, SLH-DSA, ML-KEM, X25519
- **Key Management Model**: Cloud-managed keys with protection levels for software or Hardware Security Module (HSM); supports Customer-Managed Encryption Keys (CMEK), External Key Manager (EKM) for off-cloud keys, and Autokey.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Managed cloud service with options for Single-tenant Cloud HSM and External Key Manager (EKM) integration.
- **Infrastructure Layer**: Cloud, Security Stack, Hardware
- **License Type**: Commercial
- **License**: Proprietary (subject to General Service Terms and Pre-GA Offerings Terms)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (ML-KEM algorithms reference FIPS 203 parameter sets; specific module validation status not explicitly detailed beyond algorithm standards).
- **Primary Platforms**: Google Cloud Platform
- **Target Industries**: Enterprise, Government, General Cloud Users
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQC signing algorithms are currently in "Preview" (Pre-GA) status. Key Encapsulation Mechanisms include hybrid options like KEM-XWING for layered defense against classical and quantum adversaries.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, EdDSA, RSA-PSS, RSA-PKCS1, ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated

---

## AWS KMS

- **Category**: Cloud Key Management Service (KMS)
- **Product Name**: AWS Key Management Service (AWS KMS)
- **Product Brief**: Create and control keys used to encrypt or digitally sign your data across AWS workloads.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Generally available support for ML-DSA (FIPS 204) signing operations in US West (N. California) and Europe (Milan). Supports key specs ML_DSA_44, ML_DSA_65, and ML_DSA_87 with the ML_DSA_SHAKE_256 algorithm. Also supports PQ-TLS hybrid modes (SecP256r1MLKEM768, X25519MLKEM768) via AWS SDK and PQ-SFTP policies (mlkem768nistp256-sha256, etc.) in AWS Transfer Family.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-DSA (ML_DSA_44, ML_DSA_65, ML_DSA_87), ML-KEM (via TLS/SFTP hybrid modes), ECDSA (SecP256r1), X25519, SHAKE256
- **Key Management Model**: Cloud-managed keys stored in FIPS-140-3 Level 3 certified HSMs; supports Customer-managed keys (CMK) and AWS-managed keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Managed service, HSM-backed
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated (AWS-LC-FIPS-3.0 mentioned in context of deployment timeline)
- **Release Date**: 2025-06-13 (Blog post date for ML-DSA integration announcement)
- **FIPS Validated**: Yes, FIPS-140-3 Level 3 certified HSMs used for ML-DSA signing operations.
- **Primary Platforms**: AWS Cloud (Regions: US West N. California, Europe Milan initially), AWS SDK for Java v2, AWS CLI
- **Target Industries**: Enterprise, Manufacturers (long-lived roots of trust), Government (CNSA 2.0 context)
- **Regulatory Status**: FIPS 140-3 Level 3 certified HSMs; aligned with NIST SP800-208 and CNSA 2.0 timelines.
- **PQC Roadmap Details**: ML-DSA generally available in select regions with remaining commercial regions to follow. PQ-TLS and PQ-SFTP deployed. Timeline references NIST FIPS 203/204 publication and CNSA 2.0 adoption by 2035.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML_DSA_SHAKE_256 (ML-DSA), ECDSA (historical reference)
- **Authoritative Source URL**: https://aws.amazon.com/kms/ (implied from context, specific blog: AWS Security Blog post dated 13 JUN 2025)

---

## Azure Key Vault

- **Category**: Cloud Key Management Service (KMS)
- **Product Name**: Azure Key Vault
- **Product Brief**: A cloud service for securely storing and accessing secrets, including API keys, passwords, certificates, and cryptographic keys.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. The document mentions "Quantum computing" as a general Azure solution category but does not link it to Azure Key Vault's specific cryptographic capabilities or PQC algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "cryptographic keys" and "encryption" generally, but lists no specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Cloud-based managed service using Hardware Security Modules (HSMs); supports customer-managed keys (import from own HSMs) and provider-managed keys; centralized management of keys, secrets, and policies.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Managed cloud service (SaaS) utilizing HSMs for key storage and encryption.
- **Infrastructure Layer**: Cloud
- **License Type**: Commercial
- **License**: Proprietary (Microsoft Azure service)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated (Text mentions ">100 Compliance certifications" but does not explicitly list FIPS 140-2 or 140-3 validation).
- **Primary Platforms**: Microsoft Azure (Cloud)
- **Target Industries**: Enterprise, Small and Medium Businesses (mentioned in "Cloud solutions for small and medium businesses")
- **Regulatory Status**: Not stated (Text mentions ">100 Compliance certifications" generally but does not list specific licenses or charters).
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit authoritative source URL string for the product page itself).

---
