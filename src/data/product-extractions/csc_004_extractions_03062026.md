---
generated: 2026-03-06
collection: csc_004
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## Keyfactor EJBCA

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: EJBCA Community Edition (EJBCA CE) / Keyfactor EJBCA Enterprise Edition (EJBCA EE)
- **Product Brief**: Open-source public key infrastructure (PKI) and certificate authority (CA) software covering the full certificate lifecycle.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or capabilities.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "cryptography" and "PKI" generally but does not list specific algorithms like ECDSA, RSA, etc.)
- **Key Management Model**: Not stated (Text mentions "key lifecycle management" is covered by the solution but does not describe hierarchy, escrow, or protection mechanisms).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Platform-independent; runs on a JVM (e.g., OpenJDK); available as source code, Docker container, and Helm chart.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: LGPL-2.1 (Community Edition); Commercial license required for Enterprise Edition.
- **Latest Version**: Not stated
- **Release Date**: 2026-02-27 (Last Updated date of the repository)
- **FIPS Validated**: Not stated (Text mentions "security certifications" are available in Enterprise but does not specify FIPS).
- **Primary Platforms**: Linux, Windows (runs on JVM/OpenJDK); Docker; Kubernetes (via Helm).
- **Target Industries**: Not stated (Text mentions "Enterprise-grade operations" and "production PKI deployments").
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/Keyfactor/ejbca-ce (Repository); https://www.ejbca.org/ (Website)

---

## Microsoft AD CS

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Active Directory Certificate Services (AD CS)
- **Product Brief**: Provides public key infrastructure (PKI) for cryptography, digital certificates and signature capabilities.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "Disable weak cryptographic algorithms" but does not explicitly state support for Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "weak cryptographic algorithms" generally but does not list specific primitives like ECDSA, RSA, etc.)
- **Key Management Model**: Key Storage Provider (KSP) mentioned for migrating Certification Authority keys; no details on hierarchy or escrow.
- **Supported Blockchains**: Not stated
- **Architecture Type**: On-premises infrastructure implied by "Active Directory" and "Certification Authority role service"; specific architecture type (centralized/distributed) not explicitly defined beyond PKI hierarchy.
- **Infrastructure Layer**: Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows (implied by "Active Directory" and "Microsoft Edge"), not explicitly listed as an OS requirement in the text.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document mentions "signature capabilities" generally)
- **Authoritative Source URL**: Not stated (Source filename provided: Microsoft_AD_CS.html, but no full URL in text)

---

## smallstep Certificate Authority

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: smallstep Certificate Authority (step-ca)
- **Product Brief**: An online Certificate Authority for secure, automated X.509 and SSH certificate management.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or migration plans. It explicitly lists support for RSA, ECDSA, and EdDSA only.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: RSA, ECDSA, EdDSA
- **Key Management Model**: Supports integrations with PKCS #11 HSMs, Google Cloud KMS, AWS KMS, and YubiKey PIV for signing key protection; designed for a two-tiered PKI with an offline Root CA and online Intermediate CA.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Online Certificate Authority (CA) server; supports centralized deployment or high availability via root federation; can operate as an intermediate CA or Registration Authority (RA).
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (for step-ca/open source); Commercial license available for hosted Smallstep authority and advanced features.
- **Latest Version**: Not stated
- **Release Date**: 2026-03-06 (Repository last updated)
- **FIPS Validated**: No (Document states "FIPS-compliant software" is a feature of the commercial product, implying step-ca open source does not have it).
- **Primary Platforms**: Linux, macOS, Windows (implied by browser/OS integrations), Kubernetes, Docker; Cloud platforms: AWS, GCP, Azure.
- **Target Industries**: Enterprise, DevOps
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECDSA, EdDSA
- **Authoritative Source URL**: https://github.com/smallstep/certificates

---
