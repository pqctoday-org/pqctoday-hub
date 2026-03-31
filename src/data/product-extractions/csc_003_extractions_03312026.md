---
generated: 2026-03-31
collection: csc_003
documents_processed: 14
enrichment_method: ollama-qwen3.5:27b
---

## MTG AG KMS

- **Category**: Key Management Systems (KMS)
- **Product Name**: MTG Enterprise Key Management System (MTG KMS)
- **Product Brief**: Enterprise key management system supporting KMIP, PKCS#11, and PQC algorithms for cryptographic object lifecycle management.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post-Quantum Cryptography (PQC) specifically SLH-DSA and ML-DSA algorithms and their pre-hash variants. Algorithms are usable for CreateKeyPair, ReKeyKeyPair, Register, Locate, Get, Sign, and SignatureVerify operations. Implementation aligns with Draft of KMIP 3.0.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (44, 65, 87), SLH-DSA (SHA2-128/192/256, SHAKE-128/192/256), Pre-hash variants of ML-DSA and SLH-DSA.
- **Key Management Model**: HSM-backed (supports Hardware Security Modules), supports KMIP v2.0+ and v3.0 draft, includes key lifecycle states (pre-active, active, deactivated, compromised).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based with UI, supports Galera Cluster for database, integrates with HSMs via PKCS#11 and KMIP.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Contact MTG-SupportCenter for details)
- **Latest Version**: 3.13.0
- **Release Date**: 2026-03-26
- **FIPS Validated**: Not stated
- **Primary Platforms**: Linux/Windows (implied by "Supported Operating Systems" link), Spring Boot 3.5.x, Tomcat 10.1.x, MariaDB 11.4.9, Galera Cluster 26.4.24.
- **Target Industries**: Enterprise (System Administrators)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Support for SLH-DSA and ML-DSA algorithms included in version 3.13.0; references Draft of KMIP 3.0 for PQC specifications.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (and pre-hash variants)
- **Authoritative Source URL**: www.mtg.de

---

## Cryptomathic CrystalKey 360

- **Category**: Key Management Systems (KMS)
- **Product Name**: CrystalKey 360
- **Product Brief**: A centralized key management and data security platform enabling crypto-agility, HSM-as-a-Service, and post-quantum readiness.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform enables "true cryptographic agility" allowing a seamless switch to quantum-safe cryptography or emerging standards without changing individual applications. It supports centralized enforcement of quantum-resistant algorithms and future-proofing operations, though specific PQC algorithm names are not listed in the text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, AES, 3DES, HMAC, ECDSA, SHA256, SHA384, SHA512, PKCS#1v1.5, OAEP, PSS
- **Key Management Model**: Centralized platform managing keys across HSMs, secure cloud enclaves (ESMs), and cloud key stores; supports vendor-agnostic interfaces, dual control, multi-factor authentication, and role-based access control (RBAC).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (On-premises, Private Cloud, Public Cloud); HSM-backed with support for Enclave Security Modules (ESMs) and Crypto-as-a-Service.
- **Infrastructure Layer**: Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes; Supports FIPS 140-2/3 Level 3 HSMs and FIPS 140-3 Level 1 compliant Enclave Security Modules (ESMs).
- **Primary Platforms**: Windows, Red Hat Enterprise Linux, CentOS; Cloud: GCP Cloud KMS, Azure Key Vault, AWS.
- **Target Industries**: Trust Service Providers, FinTech, Banking, Payment Issuers, Regulated Markets.
- **Regulatory Status**: Supports compliance with PCI DSS 4.0, GDPR, CCPA, Privacy Act, and FIPS 140-2/3.
- **PQC Roadmap Details**: Described as "Future Proofing" with the ability to seamlessly switch to quantum-safe cryptography via centralized policy enforcement; no specific timeline or algorithm selection roadmap provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, RSA (PKCS#1v1.5, OAEP, PSS)
- **Authoritative Source URL**: www.cryptomathic.com

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

## Entrust KeyControl

- **Category**: Key Management Systems (KMS)
- **Product Name**: Entrust KeyControl
- **Product Brief**: Enterprise key management and compliance platform combining lifecycle management with decentralized vault architecture.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform supports NIST-approved post-quantum algorithms including ML-DSA, ML-KEM, and SLH-DSA via integration with Entrust nShield HSMs. It enables the issuance of hybrid and pure PQC certificates through Entrust's PQ-ready PKI. The solution offers crypto-agility to transition from classical algorithms (RSA, ECC) to quantum-safe cryptography.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, Elliptic Curve Cryptography (ECC), ML-DSA, ML-KEM, SLH-DSA
- **Key Management Model**: Decentralized vault-based architecture with centralized policy/compliance visibility; supports HSM-backed root of trust (nShield) and optional third-party HSMs.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (On-premises, SaaS/Cloud, or Hybrid); Decentralized vaults with centralized Compliance Manager dashboard; HSM-integrated.
- **Infrastructure Layer**: Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (Compatible with FIPS 140-3 certified nShield HSMs; nShield HSMs are NIST-validated for post-quantum algorithms)
- **Primary Platforms**: On-premises, Cloud (US and European regions), AWS, Google Cloud Platform (GCP)
- **Target Industries**: Enterprise, Government (implied by NSA/NIST mandates), Critical Infrastructure, Payment Systems
- **Regulatory Status**: Supports compliance with NIST SP 800-57, PCI DSS, NSA CNSA 2.0, and data sovereignty mandates.
- **PQC Roadmap Details**: Aligns with NSA CNSA 2.0 deadlines (prefer quantum-safe by 2025, exclusive use by 2033) and NIST deprecation of classical algorithms (2030/2035). Supports hybrid and pure PQC certificate issuance.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (PQC); RSA, ECC (Classical)
- **Authoritative Source URL**: www.entrust.com

---

## IBM Guardium Key Lifecycle Manager

- **Category**: Key Management Systems (KMS)
- **Product Name**: IBM Guardium Key Lifecycle Manager
- **Product Brief**: Centralized, secure, scalable encryption key management tool for diverse key lifecycle needs.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention Post-Quantum Cryptography (PQC) capabilities, algorithms, or migration plans for this specific product. Note: A related product, "IBM Guardium Cryptography Manager," is mentioned as preparing for quantum resilience, but no details are provided for Key Lifecycle Manager.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Protocols KMIP, IPP, REST and interface PKCS#11 are listed, but specific cryptographic algorithms like ECDSA or RSA are not explicitly named).
- **Key Management Model**: Centralized key management with automated creation, import, distribution, backup, rotation, and destruction; supports grouping devices into domains; offers role-based access control; supports FIPS 140-3 Level 1 software and optional FIPS 140-3 Level 3 validated hardware.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized; supports deployment on bare-metal servers, virtual machines, or containers; interoperable with HSMs.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Requires software and usage entitlements)
- **Latest Version**: Version 4 (mentioned alongside version 3 in documentation context)
- **Release Date**: Not stated
- **FIPS Validated**: Yes; supports Federal Information Processing Standard (FIPS) 140-3 Level 1, with an option to use FIPS 140-3 Level 3 validated hardware.
- **Primary Platforms**: Bare-metal servers, virtual machines, containers; compatible with IBM and non-IBM storage solutions, cloud storage, Oracle TDE databases, VMware.
- **Target Industries**: Not stated (Mentions compliance with PCI DSS, Sarbanes-Oxley, and HIPAA).
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
- **Supported Blockchains**: Not stated (Blockchain Protect is listed as an application package for HSMs, but specific networks are not mentioned).
- **Architecture Type**: HSM-based (embedded u.trust GP HSM Se-Series and CryptoServer GP HSM), centralized management for on-premises and cloud workloads.
- **Infrastructure Layer**: Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Transparent client licensing mentioned; no open source license stated).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-3 Level 2 appliance (pending), FIPS 140-2 L3 and L4 (embedded HSM)
- **Primary Platforms**: On-premises appliances, Cloud workloads; integrates with Dell, HPE, NetApp.
- **Target Industries**: Enterprise, Financial Services (IBM Cloud for Financial Services mentioned), Government (FedRAMP/FISMA compliance listed).
- **Regulatory Status**: Common Criteria (CC), FIPS 140-2, ISO 9001, ISO 14001, NITES VS-NfD, FISMA, FedRAMP, FICAM, eIDAS, GDPR, DORA, NIS2 Directive, PCI DSS.
- **PQC Roadmap Details**: Supports management of keys created with PQC algorithms recommended by NIST and BSI; offers a Quantum Protect Simulator. No specific timeline or algorithm names (e.g., Kyber, Dilithium) are stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, ECDSA (Current); PQC algorithms recommended by NIST and BSI (Planned/Supported via crypto-agility).
- **Authoritative Source URL**: Not stated

---

## Thales CipherTrust Cloud Key Manager

- **Category**: Key Management Systems (KMS)
- **Product Name**: CipherTrust Cloud Key Manager
- **Product Brief**: Centralized lifecycle management for BYOK, HYOK and cloud native encryption keys with a single pane of glass view.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document states that post-quantum is projected to be a few years away and enterprises must start planning today. It offers a free risk assessment to determine if an organization is at risk of a post-quantum breach. No specific algorithms or production implementations are mentioned.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: Supports Bring Your Own Key (BYOK), Hybrid Your Own Key (HYOK), and cloud native encryption keys; emphasizes separation of duty by storing keys outside the corresponding cloud provider.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-based managed service offering vendor-independent encryption and key management across public clouds and on-premises environments.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated (Document lists FIPS 140-2 and FIPS 140-3 under compliance sections but does not explicitly state validation status for this specific product).
- **Primary Platforms**: Amazon Web Services, Google Cloud, Microsoft Azure, Oracle Cloud Infrastructure
- **Target Industries**: Financial Services, Government, Healthcare, Manufacturing, Retail, Telecommunications, Insurance Providers, Media and Entertainment, Automotive, Critical Infrastructure, Education
- **Regulatory Status**: Not stated (Document lists various compliance standards like GDPR, PCI DSS, FIPS, etc., but no specific regulatory licenses or charters for the product).
- **PQC Roadmap Details**: No specific timeline or algorithm choices provided; only a general recommendation to start planning and take a risk assessment.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## HashiCorp Vault Transit

- **Category**: Key Management Systems (KMS)
- **Product Name**: HashiCorp Vault Transit
- **Product Brief**: A secrets engine handling cryptographic functions on data in-transit, acting as "cryptography as a service" without storing the data.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports experimental Post-Quantum Cryptography algorithms: ML-DSA (signing/verification), SLH-DSA (asymmetric), and hybrid schemes (combination of two signature algorithms). These are marked as experimental and should not be used in production environments.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: AES-GCM (128/256-bit), ChaCha20-Poly1305, Ed25519, ECDSA (P-256, P-384, P-521), RSA (2048, 3072, 4096-bit), HMAC, CMAC (AES-128/192/256), ML-DSA, SLH-DSA, Hybrid schemes.
- **Key Management Model**: Supports key versioning, working set management with archiving of old versions, key derivation, convergent encryption, and Bring Your Own Key (BYOK) via HSM or external systems using PKCS#11 mechanisms.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based secrets engine ("cryptography as a service") supporting integration with HSMs for key import/wrapping; supports Raft or Paxos for HA capabilities.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Open Source/Commercial
- **License**: NOASSERTION (Open Source); Enterprise features available via Vault ENT license.
- **Latest Version**: v1.21.x
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-3 mode supported; chacha20-poly1305 and ed25519 are not certified in this mode.
- **Primary Platforms**: Cloud (AWS, Azure, Google Cloud mentioned as secrets engines), On-premises (via Terraform, Nomad, Consul integrations).
- **Target Industries**: Enterprise, Security Operations
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: ML-DSA, SLH-DSA, and hybrid schemes are currently experimental; no specific production timeline provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Ed25519, ECDSA (P-256, P-384, P-521), RSA (OAEP, PSS, PKCS#1v1.5), ML-DSA, SLH-DSA, Hybrid schemes.
- **Authoritative Source URL**: https://developer.hashicorp.com/vault

---

## A10 Networks Thunder ADC

- **Category**: Network Security Appliances
- **Product Name**: A10 Networks Thunder ADC
- **Product Brief**: High-performance advanced load balancing solution enabling highly available, accelerated, and secure application delivery.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions support for "modern ECC ciphers" but does not explicitly mention Post-Quantum Cryptography (PQC) algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: TLS/SSL, modern ECC ciphers
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Application Delivery Controller (ADC), inline encryptor (implied by SSL offload), virtual appliance, cloud-native, hardware appliance
- **Infrastructure Layer**: Network, Application, Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Hardware, virtual, cloud, bare metal, container form factors; Kubernetes environments
- **Target Industries**: Financial Services, Healthcare, Higher Education, Telecommunications & Service Providers, Gaming, Government, Manufacturing, Retail
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: A10_Networks_Thunder_ADC.html (Source filename provided in text)

---

## Citrix ADC (NetScaler)

- **Category**: Network Security Appliances
- **Product Name**: Citrix ADC (NetScaler)
- **Product Brief**: Network security appliance providing production-ready hybrid post-quantum cryptography and application-layer security.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Production-ready, NIST-aligned hybrid post-quantum cryptography using X25519 + ML-KEM768. Provides forward-looking protection and backward compatibility. Available now for external-facing services.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM768
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Network Security Appliance (VPN concentrator/gateway context implied by category)
- **Infrastructure Layer**: Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2025-07-01 (Inferred from document code CON1792-202507 and copyright 2025)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Hybrid and multi-cloud environments
- **Target Industries**: Governments, Healthcare, Finance, Enterprises
- **Regulatory Status**: Listed on Department of Defense Information Network Approved Products List (DODIN APL)
- **PQC Roadmap Details**: Begin internal validation in Q2 2025; Inventory systems in Q3 2025; Start phased rollout in Q4 2025.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document mentions hybrid PQC algorithms X25519 + ML-KEM768, but does not explicitly list signature schemes)
- **Authoritative Source URL**: Not stated

---

## Microsoft Defender for Endpoint

- **Category**: Network Security Appliances
- **Product Name**: Microsoft Defender for Endpoint
- **Product Brief**: Not stated in the provided text (text focuses on Microsoft's general PQC strategy and SymCrypt library).
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: PQC capabilities previewed for Windows Insiders and Linux via SymCrypt updates. Supports ML-KEM and ML-DSA through CNG. TLS 1.3 hybrid key exchange enabled in SymCrypt-OpenSSL v1.9.0. Full transition roadmap aims for completion by 2033, with early adoption starting 2029.
- **PQC Migration Priority**: High
- **Crypto Primitives**: AES, RSA, ECDSA, ML-KEM, ML-DSA, FrodoKEM (research/standardization context)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based cryptographic library (SymCrypt), Hybrid approach (classical + quantum-resistant)
- **Infrastructure Layer**: Security Stack, Cloud, Hardware (via Adams Bridge Accelerator mention in broader context)
- **License Type**: Commercial / Open Source (mixed: SymCrypt is open source; Defender is commercial)
- **License**: Not stated for specific product; SymCrypt and Adams Bridge Accelerator are open-source.
- **Latest Version**: 1.9.0 (SymCrypt-OpenSSL)
- **Release Date**: 2025-08-20 (Document date; specific software release dates not provided)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows, Linux, Microsoft Azure, Microsoft 365
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail, Education, Automotive
- **Regulatory Status**: Aligned with NIST, CISA, OMB, NSA (CNSA 2.0), ISO, IETF, ETSI standards; aligned with US and international government timelines.
- **PQC Roadmap Details**: Three-phase strategy: 1) Foundational components (SymCrypt, TLS); 2) Core infrastructure services (Entra, Key Vault); 3) All services/endpoints. Early adoption by 2029, default in subsequent years, full transition by 2033.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (current), ML-DSA (planned/previewed), FrodoKEM (research/standardization)
- **Authoritative Source URL**: Not stated (Text is from a blog post, specific product URL not extracted)

---

## MTG AG KMS

- **Category**: Key Management Systems (KMS)
- **Product Name**: MTG Enterprise Key Management System (MTG KMS)
- **Product Brief**: Enterprise key management system supporting KMIP, PKCS#11, and PQC algorithms for cryptographic object lifecycle management.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post-Quantum Cryptography (PQC) specifically SLH-DSA and ML-DSA algorithms and their pre-hash variants. Algorithms are usable for CreateKeyPair, ReKeyKeyPair, Register, Locate, Get, Sign, and SignatureVerify operations. Implementation aligns with Draft of KMIP 3.0.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (44, 65, 87), SLH-DSA (SHA2-128/192/256, SHAKE-128/192/256), Pre-hash variants of ML-DSA and SLH-DSA.
- **Key Management Model**: HSM-backed (supports Hardware Security Modules), supports KMIP v2.0+ and v3.0 draft, includes key lifecycle states (pre-active, active, deactivated, compromised).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based with UI, supports Galera Cluster for database, integrates with HSMs via PKCS#11 and KMIP.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Contact MTG-SupportCenter for details)
- **Latest Version**: 3.13.0
- **Release Date**: 2026-03-26
- **FIPS Validated**: Not stated
- **Primary Platforms**: Linux/Windows (implied by "Supported Operating Systems" link), Spring Boot 3.5.x, Tomcat 10.1.x, MariaDB 11.4.9, Galera Cluster 26.4.24.
- **Target Industries**: Enterprise (System Administrators)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Support for SLH-DSA and ML-DSA algorithms included in version 3.13.0; references Draft of KMIP 3.0 for PQC specifications.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (and pre-hash variants)
- **Authoritative Source URL**: www.mtg.de

---

## Cryptomathic CrystalKey 360

- **Category**: Key Management Systems (KMS)
- **Product Name**: CrystalKey 360
- **Product Brief**: A centralized key management and data security platform enabling crypto-agility, HSM-as-a-Service, and post-quantum readiness.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform enables "true cryptographic agility" allowing a seamless switch to quantum-safe cryptography or emerging standards without changing individual applications. It supports centralized enforcement of quantum-resistant algorithms and future-proofing operations, though specific PQC algorithm names are not listed in the text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, AES, 3DES, HMAC, ECDSA, SHA256, SHA384, SHA512, PKCS#1v1.5, OAEP, PSS
- **Key Management Model**: Centralized platform managing keys across HSMs, secure cloud enclaves (ESMs), and cloud key stores; supports vendor-agnostic interfaces, dual control, multi-factor authentication, and role-based access control (RBAC).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (On-premises, Private Cloud, Public Cloud); HSM-backed with support for Enclave Security Modules (ESMs) and Crypto-as-a-Service.
- **Infrastructure Layer**: Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes; Supports FIPS 140-2/3 Level 3 HSMs and FIPS 140-3 Level 1 compliant Enclave Security Modules (ESMs).
- **Primary Platforms**: Windows, Red Hat Enterprise Linux, CentOS; Cloud: GCP Cloud KMS, Azure Key Vault, AWS.
- **Target Industries**: Trust Service Providers, FinTech, Banking, Payment Issuers, Regulated Markets.
- **Regulatory Status**: Supports compliance with PCI DSS 4.0, GDPR, CCPA, Privacy Act, and FIPS 140-2/3.
- **PQC Roadmap Details**: Described as "Future Proofing" with the ability to seamlessly switch to quantum-safe cryptography via centralized policy enforcement; no specific timeline or algorithm selection roadmap provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, RSA (PKCS#1v1.5, OAEP, PSS)
- **Authoritative Source URL**: www.cryptomathic.com

---
