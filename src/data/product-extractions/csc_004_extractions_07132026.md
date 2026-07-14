---
generated: 2026-07-13
collection: csc_004
documents_processed: 4
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit
---

## Ascertia ADSS PKI Server

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Ascertia ADSS Server
- **Product Brief**: Next-generation high-scale PKI and Certificate Authority software for enterprise, trust service providers, and government infrastructures.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans. It focuses on X.509 services, ECDSA, and standard PKI operations.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECDSA (NIST P-curve)
- **Key Management Model**: HSM-backed (Hardware Security Modules supported in non-containerized deployments; HSM integration in containerized environments is planned for a future release).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, containerized (Docker), on-premises, hybrid; supports load-balanced deployments.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Not stated
- **Latest Version**: v8.4.0
- **Release Date**: Unknown
- **FIPS Validated**: No (Common Criteria EAL4+ certified; FIPS status not stated)
- **Primary Platforms**: Docker, Microsoft SQL Server, Oracle database, Windows (implied by C:\Windows\System32 path for PKCS#11 dlls)
- **Target Industries**: Enterprises, Trust Service Providers, Government
- **Regulatory Status**: Common Criteria EAL4+ Assurance Level
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (NIST P-curve)
- **Authoritative Source URL**: https://www.ascertia.com/product-documentation/platform-support/
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## AUTOCRYPT PKI-Vehicles

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: AutoCrypt PKI-Vehicles
- **Product Brief**: Next-generation PKI solution for automotive systems supporting ML-DSA post-quantum digital signatures.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-DSA, a post-quantum digital signature algorithm selected by NIST for FIPS 204. The product is ready for real-world issuance under this certificate framework across automotive environments and OEM-specific environments.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-12-08
- **FIPS Validated**: No
- **Primary Platforms**: Automotive systems, OEM-specific environments
- **Target Industries**: Automotive
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Plans to show solutions at CES 2026 (January 6-9).
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA
- **Authoritative Source URL**: autocrypt.io
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## AWS Certificate Manager

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: AWS Certificate Manager (specifically AWS Private CA)
- **Product Brief**: A service to create and manage private public key infrastructure (PKI) hierarchies with post-quantum ML-DSA support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports post-quantum ML-DSA signature scheme (specifically ML-DSA-65 variant) for code signing, device authentication, and mTLS. Integrated with AWS KMS for key generation and signing. Standardized in FIPS 204.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-DSA, ML-DSA-65, SHAKE256
- **Key Management Model**: Customer-managed keys generated and stored in AWS KMS; private keys used for signing within KMS; public keys in certificates issued by AWS Private CA.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Managed service (Cloud)
- **Infrastructure Layer**: Cloud
- **License Type**: Commercial
- **License**: Commercial
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: ML-DSA is standardized in FIPS 204.
- **Primary Platforms**: AWS Cloud
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Part of the AWS post-quantum cryptography migration plan; establishes quantum-resistant roots of trust.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, ML-DSA-65
- **Authoritative Source URL**: aws-certificate-manager-858228f9.html
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Supports dual signatures (traditional and quantum-resistant) for backward compatibility with legacy verifiers.
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## Easy-RSA

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Easy-RSA
- **Product Brief**: Open-source PKI software for managing certificate lifecycles, including issuance, renewal, and revocation.
- **PQC Support**: No
- **PQC Capability Description**: No mention of Post-Quantum Cryptography (PQC) algorithms, support, or migration plans in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, Edwards Curve (Edwards Curve based keys), OpenSSL, LibreSSL
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: 3.2.6
- **Release Date**: 2021-03-13
- **FIPS Validated**: No
- **Primary Platforms**: Linux, Windows, *nix
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Edwards Curve based keys, RSA
- **Authoritative Source URL**: easyrsa-openvpn-db1511c1.html
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unit-test, shellcheck
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---
