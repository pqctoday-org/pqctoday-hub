---
generated: 2026-03-06
collection: csc_003
documents_processed: 6
enrichment_method: ollama-qwen3.5:27b
---

## HashiCorp Vault

- **Category**: Key Management Systems (KMS)
- **Product Name**: HashiCorp Vault
- **Product Brief**: A tool for secrets management, encryption as a service, and privileged access management.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "encryption keys", "cryptographically secure tokens", and "encryption parameters" but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Vault encrypts data before writing to persistent storage; supports dynamic secret generation with leasing and automatic revocation; supports key rolling.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized (implied by "Centrally manage secrets"); supports on-prem, cloud (HCP), and agent-based deployment (Vault Agent).
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: NOASSERTION (for the repository); Commercial license required for Enterprise features.
- **Latest Version**: v1.21.x
- **Release Date**: Not stated
- **FIPS Validated**: No mention
- **Primary Platforms**: Go-based; supports disk, Consul storage; deployable on HashiCorp Cloud Platform (HCP), Docker, and local environments.
- **Target Industries**: Enterprise (implied by "Enterprise features", "regulatory compliance", "security teams").
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://developer.hashicorp.com/vault

---

## IBM Guardium Key Lifecycle Manager

- **Category**: Key Management Systems (KMS)
- **Product Name**: IBM Guardium Key Lifecycle Manager
- **Product Brief**: Centralized, secure, scalable encryption key management tool for diverse key lifecycle needs.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention Post-Quantum Cryptography (PQC) capabilities, algorithms, or migration plans for this specific product. Note: A related product, "IBM Guardium Cryptography Manager," is mentioned in the text as preparing for quantum resilience, but no details are provided for Guardium Key Lifecycle Manager.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions protocols KMIP, IPP, REST and interface PKCS#11, but does not list specific cryptographic algorithms like ECDSA or RSA).
- **Key Management Model**: Centralized key management with automated creation, import, distribution, backup, rotation, and destruction; supports grouping devices into domains; role-based access control for administrative accounts.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized; supports deployment on bare-metal servers, virtual machines, or containers; interoperable with HSMs.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Requires software and usage entitlements)
- **Latest Version**: Version 4 (mentioned alongside version 3 in documentation context)
- **Release Date**: Not stated
- **FIPS Validated**: Yes; supports Federal Information Processing Standard (FIPS) 140-3 Level 1, with an option to use FIPS 140-3 Level 3 validated hardware.
- **Primary Platforms**: Bare-metal servers, virtual machines, containers; compatible with Oracle TDE databases, VMware, and KMIP/IPP/REST-compatible devices.
- **Target Industries**: Not stated (Text mentions compliance with PCI DSS, Sarbanes-Oxley, and HIPAA).
- **Regulatory Status**: Helps meet regulations such as PCI DSS, Sarbanes-Oxley, and HIPAA.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: IBM_Guardium_Key_Lifecycle_Manager.html)

---

## Oracle Key Vault

- **Category**: Key Management Systems (KMS)
- **Product Name**: Oracle Key Vault
- **Product Brief**: Centrally manages encryption keys, Oracle wallets, Java keystores, and credential files to accelerate security deployments.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions support for OASIS KMIP standard but does not list specific algorithms like ECDSA or RSA).
- **Key Management Model**: Centralized management of encryption keys, Oracle wallets, Java keystores, and credential files; supports integration with Hardware Security Module.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Full-stack, security-hardened software appliance deployed on compatible hardware.
- **Infrastructure Layer**: Security Stack, Hardware
- **License Type**: Proprietary
- **License**: Not stated (Copyright © 2025, Oracle and/or its affiliates implies proprietary).
- **Latest Version**: 21.13
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Oracle Linux, Oracle Database technology; compatible hardware.
- **Target Industries**: Not stated (Context implies Enterprise/Database security).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: Oracle_Key_Vault.html)

---

## Utimaco ESKM

- **Category**: Key Management Systems (KMS)
- **Product Name**: Enterprise Secure Key Manager (ESKM)
- **Product Brief**: The most interoperable and integrated Key Management System providing a single pane of glass for all cryptographic keys.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Capable to manage keys created with post quantum cryptography algorithms recommended by NIST and BSI due to its crypto-agility. A "Quantum Protect Simulator" is available for testing features.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES, 3-Key Triple DES, HMAC, RSA, ECDSA
- **Key Management Model**: Centralized management with embedded u.trust General Purpose HSM Se-Series and CryptoServer General Purpose HSM; supports distributed clusters with thousands of nodes.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (embedded u.trust GP HSM Se-Series and CryptoServer GP HSM), centralized management for on-premises and cloud workloads, scalable to distributed clusters.
- **Infrastructure Layer**: Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Transparent client licensing mentioned)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-3 Level 2 appliance (pending), FIPS 140-2 L3 and L4 (embedded HSM)
- **Primary Platforms**: On-premises appliances, Cloud workloads; integrates with Dell, HPE, NetApp.
- **Target Industries**: Enterprise, Financial Services (IBM Cloud for Financial Services mentioned), Government (FedRAMP/FISMA compliance mentioned).
- **Regulatory Status**: Common Criteria (CC), FIPS 140-2, ISO 9001, ISO 14001, NITES VS-NfD, FISMA, FedRAMP, FICAM, eIDAS, GDPR, DORA, NIS2 Directive, PCI DSS.
- **PQC Roadmap Details**: Supports management of keys created with PQC algorithms recommended by NIST and BSI; offers a Quantum Protect Simulator. No specific timeline or algorithm names (e.g., Kyber, Dilithium) stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECDSA (Current); PQC algorithms recommended by NIST and BSI (Supported for key management).
- **Authoritative Source URL**: Not stated

---

## Thales CipherTrust Cloud Key Manager

- **Category**: Key Management Systems (KMS)
- **Product Name**: CipherTrust Cloud Key Management (CCKM)
- **Product Brief**: Centralized lifecycle management for BYOK, HYOK and cloud native encryption keys with a single pane of glass view.
- **PQC Support**: Planned (with timeline: "projected to be a few years away", "start planning today")
- **PQC Capability Description**: The document states that post-quantum is projected to be a few years away and enterprises must start planning today. It offers a free risk assessment to determine if an organization is at risk of a post-quantum breach. No specific PQC algorithms, implementation status, or maturity level for the product itself are stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Supports Bring Your Own Key (BYOK), Hybrid Your Own Key (HYOK), and cloud native encryption keys; emphasizes separation of duty by storing keys outside the corresponding cloud (EKM); supports cross-region management.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based managed service offering vendor-independent encryption and key management; supports multi-cloud environments.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (implied by "Commercial" context and Thales product nature, but specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-2 and FIPS 140-3 are listed under compliance requirements the solution helps meet, but specific validation status for this product is not explicitly stated.
- **Primary Platforms**: Amazon Web Services (AWS), Google Cloud, Microsoft Azure, Oracle Cloud Infrastructure; supports multi-cloud.
- **Target Industries**: Financial Services, Government, Healthcare, Manufacturing, Retail, Telecommunications, Automotive, Critical Infrastructure, Education, Insurance, Media and Entertainment.
- **Regulatory Status**: Mentions compliance with GDPR, FIPS 140-2, FIPS 140-3, PCI DSS, SOC 2, HIPAA, NIST standards, and various regional laws (e.g., LGPD, CCPA), but no specific regulatory charter or license for the product itself is stated.
- **PQC Roadmap Details**: No specific timeline or algorithm choices provided; only a general recommendation to start planning now as post-quantum is projected to be a few years away.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filenames provided, but no public URL extracted)

---

## HashiCorp Vault Transit

- **Category**: Key Management Systems (KMS)
- **Product Name**: HashiCorp Vault Transit
- **Product Brief**: A secrets engine handling cryptographic functions on data in-transit, acting as "cryptography as a service" without storing the data.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports experimental Post-Quantum Cryptography algorithms: ML-DSA (signing/verification), SLH-DSA (asymmetric), and hybrid schemes (combination of two signature algorithms). These are explicitly marked as "experimental" and should not be used in production environments.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: AES-GCM (128/256-bit), ChaCha20-Poly1305, Ed25519, ECDSA (P-256, P-384, P-521), RSA (2048, 3072, 4096-bit), HMAC, CMAC (AES-128/192/256), ML-DSA, SLH-DSA, Hybrid schemes.
- **Key Management Model**: Supports key versioning, working set management with archiving of old versions, key derivation, convergent encryption, and Bring Your Own Key (BYOK) via HSM or external systems using PKCS#11 mechanisms.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based secrets engine ("cryptography as a service") supporting integration with HSMs via PKCS#11; supports SaaS (HCP Vault) and customer-deployed models.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Open Source/Commercial
- **License**: NOASSERTION (Open Source); Enterprise features available under Commercial license.
- **Latest Version**: v1.21.x
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-3 mode supported; chacha20-poly1305 and ed25519 are not certified in this mode.
- **Primary Platforms**: Cloud (AWS, Azure, Google Cloud), On-premises (via Terraform, Nomad, Consul integrations).
- **Target Industries**: Enterprise, Security Operations
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: ML-DSA, SLH-DSA, and hybrid schemes are available as experimental functionality; no specific production timeline provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Ed25519, ECDSA (P-256, P-384, P-521), RSA (OAEP, PSS, PKCS#1v1.5), ML-DSA, SLH-DSA, Hybrid schemes.
- **Authoritative Source URL**: https://developer.hashicorp.com/vault

---
