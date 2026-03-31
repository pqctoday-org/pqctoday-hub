---
generated: 2026-03-31
collection: csc_041
documents_processed: 16
enrichment_method: ollama-qwen3.5:27b
---

## EVERTRUST HORIZON

- **Category**: Certificate Lifecycle Management
- **Product Name**: EVERTRUST HORIZON (also referred to as Evertrust CLM)
- **Product Brief**: Automates Certificate Lifecycle Management, seamlessly integrating with corporate and cloud environments for issuance, renewal, and revocation.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The product is described as "Crypto Agile" to adapt to an evolving cryptographic world and prepare for disruption. A whitepaper titled "Preparing for Post-Quantum Migration" (May 2025) indicates the company provides guidance on preparing for the quantum computing era, but specific PQC algorithms or production implementation details are not stated in the text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions support for "weak algorithms" detection and standards like NIST/ANSSI, but does not list specific current primitives like ECDSA or RSA).
- **Key Management Model**: Sovereign model where the customer keeps keys and control; integrates with HSMs; supports open protocols. Specific hierarchy or escrow details are not stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Fully distributed architecture with High Availability mechanisms; SaaS, on-premises, or hybrid deployment options; agent-based (local scanning) and agentless (network scanning).
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary (Subject to license terms and conditions)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Not mentioned in text; mentions NIST standards for quality scoring but not FIPS validation status).
- **Primary Platforms**: AWS, Azure, Google Cloud, on-premises, hybrid environments; supports servers, mobiles, workstations, IoT devices.
- **Target Industries**: Enterprise, Government (public organizations), Aviation (mentioned in testimonial), general corporate sectors.
- **Regulatory Status**: ISO 27001 certified; member of Hexatrust and PKI Consortium; compliant with GDPR, SOX, HIPAA.
- **PQC Roadmap Details**: Company offers a whitepaper on "Preparing for Post-Quantum Migration" (May 2025) and positions the product as "Crypto Agile" to anticipate disruption, but no specific algorithm choices or migration timelines are explicitly stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains navigation links but no explicit base URL).

---

## MTG AG CLM

- **Category**: Certificate Lifecycle Management
- **Product Name**: MTG Certificate Lifecycle Manager (MTG CLM) / MTG Public Key Infrastructure Platform – MTG CARA
- **Product Brief**: A PKI platform providing certificate lifecycle management, key management, and high-availability architecture for enterprise security.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports MLDSA and SLHDSA algorithms. Both are explicitly labeled as "PQC, experimental" in the Supported Cryptographic Algorithms section. No production status is stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, EC, EdDSA, MLDSA, SLHDSA
- **Key Management Model**: HSM-backed (supports Securosys, Nitrokey, nShield, Cloud Based HSM); utilizes clustered HSMs connected via PKCS#11; supports BYOK.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based; supports Single Location (Hot-Standby), Two Location (Cold-Standby), and Three Location architectures using VMs, Galera Cluster (MariaDB), and Keepalived/VRRP.
- **Infrastructure Layer**: Security Stack, Hardware
- **License Type**: Commercial
- **License**: Proprietary (implied by "MTG AG" and lack of open source license mention)
- **Latest Version**: 6.10.0 (Certificate Lifecycle Manager), 3.13.0 (Key Management System)
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Linux Package, Docker Compose, Kubernetes; integrates with Windows Active Directory, Microsoft Intune, Workspace ONE, Keycloak.
- **Target Industries**: Enterprise (implied by "MTG Enterprise Resource Security" and AD/Intune integrations)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: MLDSA and SLHDSA are listed as experimental; no specific timeline or migration plan details provided beyond current support status.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, EC, EdDSA, MLDSA (experimental), SLHDSA (experimental)
- **Authoritative Source URL**: Not stated

---

## essendi xc

- **Category**: Certificate Lifecycle Management
- **Product Name**: essendi xc
- **Product Brief**: A tool for automatic and simple management of digital certificates to prevent disruptions from expired or incorrectly issued certificates.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: The product offers "essendi crypto solutions" enabling end-to-end cryptography management including "post-quantum readiness." It supports discovery, lifecycle management, and future-proofing against quantum attacks. Specific algorithms or implementation details are not stated; the focus is on readiness and monitoring vulnerabilities.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X.509, TLS/SSL (Specific algorithms like ECDSA or RSA not explicitly listed in text)
- **Key Management Model**: Supports integration with Securosys HSMs for secure management; supports key lifecycle (generation, distribution, usage, storage, renewal, deletion).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized platform integrating into existing complex infrastructures; supports agent-based or connector-based installation in target systems.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Manufacturer with own product)
- **Latest Version**: 3.1
- **Release Date**: 2026-03-19
- **FIPS Validated**: Not stated
- **Primary Platforms**: Microsoft world (Microsoft Enrollment Adapter, Microsoft Intune Adapter), IoT devices, servers, target systems.
- **Target Industries**: Financial services, industrial sector, commercial sector, listed corporations.
- **Regulatory Status**: ISO 27001 certified; supports DORA compliance requirements.
- **PQC Roadmap Details**: Focus on "post-quantum readiness" and continuous monitoring of vulnerabilities; no specific algorithm choices or migration timelines stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions digital signatures generally but not specific schemes)
- **Authoritative Source URL**: Not stated

---
## Keyfactor Command

- **Category**: Certificate Lifecycle Management
- **Product Name**: Keyfactor Command
- **Product Brief**: Platform that discovers, protects, and automates every certificate across any CA, cloud, and machine.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports discovery of post-quantum (PQ) and hybrid certificates via real-time visibility. Offers a "PQC Lab" sandbox for quantum readiness and resources. Mentions "Quantum-ready algorithms" and Key Encapsulation Mechanisms (KEMs) in educational content, but specific algorithm names are not listed in the product feature text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions "post-quantum cryptography", "hybrid certificates", and "Key Encapsulation Mechanisms" generally, but does not list specific primitives like ECDSA, Ed25519, or specific PQC algorithms).
- **Key Management Model**: Supports on-device key generation and integrations to popular HSMs and key vaults. Mentions "four-eye / dual-person control" for HSMs.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized governance with modular orchestrators; supports agent-based or agentless discovery; integrates with HSMs and key vaults.
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Commercial / Open Source (Community editions available)
- **License**: Not stated (Text mentions "Commercial" for Enterprise editions and "Open Source" for community editions of EJBCA, SignServer, and Bouncy Castle APIs, but no specific license names like Apache-2.0 are provided).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Partial (Bouncy Castle APIs are described as "FIPS-Certified"; Keyfactor Command mentions HSMs in FIPS mode but does not explicitly state the platform itself is FIPS validated).
- **Primary Platforms**: On-premises, Cloud (Azure), Kubernetes (Helm Charts), SaaS.
- **Target Industries**: Financial Services, Telecom, Automotive, Medical, Industrial IoT, Consumer IoT, Software & IT.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Offers a "PQC Lab" sandbox and resources for quantum readiness; mentions "Achieve Crypto-Agility" as a use case; no specific timeline or algorithm migration schedule provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions "Secure code signing" and "digital signing engine" generally, but does not list specific signature algorithms).
- **Authoritative Source URL**: Not stated (Source text contains navigation links but no explicit base URL string).

---

## Venafi TLS Protect

- **Category**: Certificate Lifecycle Management
- **Product Name**: Venafi TLS Protect (now part of CyberArk Machine Identity Security / Certificate Manager)
- **Product Brief**: Automation platform for certificate lifecycle management, enterprise PKI, and machine identity security.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text. No mention of Post-Quantum Cryptography algorithms, migration plans, or readiness status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions TLS/SSL certificates generally but does not list specific algorithms like ECDSA, RSA, etc.)
- **Key Management Model**: Not stated (Text mentions "Zero Touch PKI" and automation but does not describe key hierarchy, HSM usage, or escrow).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Text mentions SaaS and Self-Hosted options for Secrets Manager, but specific architecture for TLS Protect is not detailed beyond "automation").
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Implied by "CyberArk Software Ltd. All rights reserved" and subscription model)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud-native, on-premises, third-party applications (General deployment targets mentioned); Kubernetes (specifically for Certificate Manager for Kubernetes).
- **Target Industries**: Automotive, Banking, Critical Infrastructure, Financial Services, Government, Healthcare, Insurance, Manufacturing, Managed Service Providers.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains navigation links but no specific product documentation URL).

---

## AppViewX CERT+

- **Category**: Certificate Lifecycle Management
- **Product Name**: AVX CLM / AVX ONE Platform
- **Product Brief**: The most advanced SaaS certificate lifecycle management (CLM) platform for enterprise PKI, IAM, security, DevOps, cloud, and application teams.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Offers AVX ONE PQC Assessment Tool for crypto risk assessment and CBOM generation; supports quantum-ready PKIaaS issuing FIPS 203, FIPS 204, FIPS 205, and upcoming FIPS 206 (FALCON) algorithms; enables crypto-agility for rapid transition to PQC.
- **PQC Migration Priority**: High
- **Crypto Primitives**: FIPS 203, FIPS 204, FIPS 205, FALCON (FIPS 206)
- **Key Management Model**: Private keys safeguarded in FIPS 140-2 certified HSMs; centralized control plane for enterprise-wide certificate lifecycle management.
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS offering, on-premises deployment, private cloud deployment; centralized control plane (CryptoMesh).
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025-04-23
- **FIPS Validated**: Yes (FIPS 140-2 certified HSMs mentioned for code signing; FIPS 203, 204, 205, 206 algorithms supported)
- **Primary Platforms**: Hybrid multi-cloud environments, Kubernetes, containers, on-premises, private cloud, SaaS.
- **Target Industries**: Enterprise, Healthcare (PacificSource), Finance (Rabobank), Government (Australian Bureau of Statistics).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Aligns with NIST guidance for transition by 2030; supports FIPS 203, 204, 205, and upcoming FALCON (FIPS 206); provides assessment tools and quantum-ready PKIaaS.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: FIPS 203, FIPS 204, FIPS 205, FALCON (FIPS 206)
- **Authoritative Source URL**: Not stated

---

## EJBCA

- **Category**: Certificate Lifecycle Management
- **Product Name**: EJBCA
- **Product Brief**: Open-source public key infrastructure (PKI) and certificate authority (CA) software covering full certificate lifecycle.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports all finalist NIST PQC algorithms. Specifically supports Dilithium, FALCON, and SPHINCS+ for certificate issuance and signing. Enables inventory of keys/certificates/algorithms including Dilithium certificates. Allows creation of post-quantum CAs and code signing with PQC certificates. Available in EJBCA 8.0 and SignServer 6.0.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA, EdDSA, RSA, Dilithium (ML-DSA), FALCON, SPHINCS+ (SLH-DSA)
- **Key Management Model**: HSM-backed (supports generic PKCS#11, AWS CloudHSM, Azure Key Vault, Thales Luna, Utimaco, etc.), supports remote authenticators and crypto tokens.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized CA/RA/VA architecture; supports distributed RA/VAs, High Availability, Clustering, Container-based (Docker/Helm), On-premises or Cloud deployment.
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source/Commercial
- **License**: LGPL-2.1 (Community Edition); Commercial License (Enterprise Edition)
- **Latest Version**: 9.5.1
- **Release Date**: Not stated
- **FIPS Validated**: No mention of specific FIPS validation status for the software itself; mentions support for FIPS 203, 204, 205 algorithms in draft format.
- **Primary Platforms**: Linux, Windows (runs on JVM/OpenJDK); Docker, Kubernetes (Helm)
- **Target Industries**: Enterprise, Government (mentions government recommendations), IoT (Matter CAs), Healthcare (EAC/Passport), Automotive (C-ITS)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports NIST PQC finalists (Dilithium, FALCON, SPHINCS+). Mentions transition to PQC will take years and planning is needed now. Supports inventory and migration automation for PQC.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, EdDSA, RSA, Dilithium, FALCON, SPHINCS+
- **Authoritative Source URL**: https://www.ejbca.org/

---

## DigiCert Trust Lifecycle Manager

- **Category**: Certificate Lifecycle Management
- **Product Name**: DigiCert Trust Lifecycle Manager
- **Product Brief**: Platform to issue and manage private post-quantum cryptography (PQC) certificates using ML-DSA or SLH-DSA algorithms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports issuing and managing (revoke, suspend/resume, escrow/recover) private PQC certificates using ML-DSA or SLH-DSA algorithms. Includes network scans for discovery. Does not currently support Falcon or Composite PQC certificates as they are experimental; testing available via DigiCert LABS.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA, SLH-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2025-08-26
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Falcon and Composite PQC certificates are under active development and considered experimental; testing available via DigiCert LABS.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (Falcon and Composite are experimental/planned)
- **Authoritative Source URL**: Not stated

---

## DigiCert CertCentral

- **Category**: Certificate Lifecycle Management
- **Product Name**: DigiCert CertCentral
- **Product Brief**: A certificate lifecycle management platform offering cryptographic agility and automation tools.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document states DigiCert supports the journey with "cryptographic agility, lifecycle automation, and developer tools." It mentions industry leaders are using PQC in production and that DigiCert is active in NIST and European ecosystems. Specific algorithms mentioned for future adoption include ML-KEM, ML-DSA, and SLH-DSA. The text notes "Early enterprise pilots" and "PQC Labs adoption" are expected between 2025-2026.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECC (mentioned as current vulnerable algorithms); ML-KEM, ML-DSA, SLH-DSA (mentioned as NIST-standardized PQC algorithms).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud (Certificate Lifecycle Management)
- **Infrastructure Layer**: Cloud
- **License Type**: Commercial
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise, Government, Finance, Healthcare, Critical Infrastructure
- **Regulatory Status**: Not stated (Document mentions regulatory requirements like CNSA 2.0, CRA, DORA that the product helps address, but does not state specific licenses or charters held by the product).
- **PQC Roadmap Details**: Aligns with NIST standards finalized in 2024 (ML-KEM, ML-DSA, SLH-DSA). Mentions CAB Forum/IETF drafts for PQC certificates and TLS authentication expected 2024-2025. Early enterprise pilots and hybrid certificate discussions expected 2025-2026. Full CNSA 2.0 compliance deadline is 2030.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA, ECC. Planned/Supported: ML-DSA, SLH-DSA.
- **Authoritative Source URL**: Not stated (Source text contains an error message and a PDF title, but no valid product URL).

---

## DigiCert ONE

- **Category**: Certificate Lifecycle Management
- **Product Name**: DigiCert ONE
- **Product Brief**: A cloud-based certificate lifecycle management platform offering cryptographic agility and PQC migration support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST-standardized post-quantum algorithms including ML-KEM (encryption), ML-DSA (signatures), and SLH-DSA (long-lived use cases). Offers cryptographic agility, lifecycle automation, and developer tools. Industry leaders are using PQC in production via DigiCert.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECC, ML-KEM, ML-DSA, SLH-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud (SaaS/Managed service implied by "Cloud KMS" context and "DigiCert ONE" platform nature)
- **Infrastructure Layer**: Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud (AWS, Azure, GCP not explicitly listed in text, only "Cloud" category mentioned)
- **Target Industries**: Enterprise, Government, Finance, Healthcare, Critical Infrastructure
- **Regulatory Status**: Aligns with CNSA 2.0, EU CRA, DORA; supports U.S. Executive actions on cryptographic inventory.
- **PQC Roadmap Details**: NIST finalized standards in 2024 (ML-KEM, ML-DSA, SLH-DSA). Migration window estimated at 3-4 years post-CRQC arrival. CNSA 2.0 mandates adoption by 2030. Early enterprise pilots and hybrid certificate discussions expected 2025-2026.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA, ECC; Planned/Supported: ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated

---

## GlobalSign Atlas CLM

- **Category**: Certificate Lifecycle Management
- **Product Name**: GlobalSign Atlas CLM (Atlas - Digital Identity Platform)
- **Product Brief**: A high-availability, SaaS-based Certificate Authority platform for automated certificate management and signing workflows.
- **PQC Support**: No mention
- **PQC Capability Description**: The document lists "Post Quantum Computing" as a menu item under Solutions but provides no details on implementation status, algorithms used, maturity level, or specific capabilities within the Atlas platform text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "key support" and "multiple protocols" generally but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Text mentions Atlas eliminates the need for in-house CAs and handles key management tasks, but does not specify the underlying architecture such as HSM-backed, MPC, or cloud KMS integration details).
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS-based platform; Cloud Certificate Authority.
- **Infrastructure Layer**: Cloud
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Commercial" nature and purchase options; specific license name not stated)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: SaaS-based platform; supports integration with AD, MDM, Kubernetes (via cert-manager), ServiceNow, HashiCorp Vault.
- **Target Industries**: Finance and Insurance, Government, Health and Dental, Education, Legal and Real Estate, Energy, IoT innovators.
- **Regulatory Status**: Not stated (Text mentions compliance with regulatory obligations generally but lists no specific licenses or charters).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit authoritative source URL for the product page itself).

---

## Sectigo Certificate Manager (SCM)

- **Category**: Certificate Lifecycle Management
- **Product Name**: Sectigo Certificate Manager (SCM)
- **Product Brief**: CA-agnostic automation platform to discover, manage, and automate digital certificates across hybrid, multi-cloud, and legacy systems.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Offers a "Quantum Safe Certificate Toolkit" described as a demo/POC solution for enterprises to evaluate quantum safe solutions. Mentions "Post-quantum cryptography (PQC)" and "Crypto agility" in resource tags, but no specific production algorithms or full implementation details are stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS (Cloud-based Certificate Lifecycle Management)
- **Infrastructure Layer**: Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2026-03-02 (Date of "Sectigo Certificate Integration for Dynatrace" datasheet)
- **FIPS Validated**: No
- **Primary Platforms**: Hybrid, multi-cloud, and legacy systems; integrates with ServiceNow, Dynatrace, WHMCS.
- **Target Industries**: Enterprise, smaller organizations
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Mentions a "47-day Toolkit" for crypto agility readiness and a "Quantum PKI Toolkit Demo," but no specific migration timeline or algorithm choices are detailed.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Sectigo Certificate Manager

- **Category**: Certificate Lifecycle Management
- **Product Name**: Sectigo Certificate Manager
- **Product Brief**: Not stated in the provided text.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated in the provided text.
- **Key Management Model**: Not stated in the provided text.
- **Supported Blockchains**: Not stated in the provided text.
- **Architecture Type**: Not stated in the provided text.
- **Infrastructure Layer**: Security Stack (as per user prompt context, not explicitly defined in text)
- **License Type**: Unknown
- **License**: Not stated in the provided text.
- **Latest Version**: Not stated in the provided text.
- **Release Date**: Not stated in the provided text.
- **FIPS Validated**: Not stated in the provided text.
- **Primary Platforms**: Not stated in the provided text.
- **Target Industries**: Not stated in the provided text.
- **Regulatory Status**: Not stated in the provided text.
- **PQC Roadmap Details**: Not stated in the provided text.
- **Consensus Mechanism**: Not stated in the provided text.
- **Signature Schemes**: Not stated in the provided text.
- **Authoritative Source URL**: sectigo.com (mentioned in cookie domain list)

---

## EVERTRUST HORIZON

- **Category**: Certificate Lifecycle Management
- **Product Name**: EVERTRUST HORIZON (also referred to as Evertrust CLM)
- **Product Brief**: Automates Certificate Lifecycle Management, seamlessly integrating with corporate and cloud environments for issuance, renewal, and revocation.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The product is described as "Crypto Agile" to adapt to an evolving cryptographic world and prepare for disruption. A whitepaper titled "Preparing for Post-Quantum Migration" (May 2025) indicates the company provides guidance on preparing for the quantum computing era, but specific PQC algorithms or production implementation details are not stated in the text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions support for "weak algorithms" detection and standards like NIST/ANSSI, but does not list specific current primitives like ECDSA or RSA).
- **Key Management Model**: Sovereign model where the customer keeps keys and control; integrates with HSMs; supports open protocols. Specific hierarchy or escrow details are not stated.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Fully distributed architecture with High Availability mechanisms; SaaS, on-premises, or hybrid deployment options; agent-based (local scanning) and agentless (network scanning).
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary (Subject to license terms and conditions)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Not mentioned in text; mentions NIST standards for quality scoring but not FIPS validation status).
- **Primary Platforms**: AWS, Azure, Google Cloud, on-premises, hybrid environments; supports servers, mobiles, workstations, IoT devices.
- **Target Industries**: Enterprise, Government (public organizations), Aviation (mentioned in testimonial), general corporate sectors.
- **Regulatory Status**: ISO 27001 certified; member of Hexatrust and PKI Consortium; compliant with GDPR, SOX, HIPAA.
- **PQC Roadmap Details**: Company offers a whitepaper on "Preparing for Post-Quantum Migration" (May 2025) and positions the product as "Crypto Agile" to anticipate disruption, but no specific algorithm choices or migration timelines are explicitly stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text contains navigation links but no explicit base URL).

---

## MTG AG CLM

- **Category**: Certificate Lifecycle Management
- **Product Name**: MTG Certificate Lifecycle Manager (MTG CLM) / MTG Public Key Infrastructure Platform – MTG CARA
- **Product Brief**: A PKI platform providing certificate lifecycle management, key management, and high-availability architecture for enterprise security.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Supports MLDSA and SLHDSA algorithms. Both are explicitly labeled as "PQC, experimental" in the Supported Cryptographic Algorithms section. No production status is stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, EC, EdDSA, MLDSA, SLHDSA
- **Key Management Model**: HSM-backed (supports Securosys, Nitrokey, nShield, Cloud Based HSM); utilizes clustered HSMs connected via PKCS#11; supports BYOK.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based; supports Single Location (Hot-Standby), Two Location (Cold-Standby), and Three Location architectures using VMs, Galera Cluster (MariaDB), and Keepalived/VRRP.
- **Infrastructure Layer**: Security Stack, Hardware
- **License Type**: Commercial
- **License**: Proprietary (implied by "MTG AG" and lack of open source license mention)
- **Latest Version**: 6.10.0 (Certificate Lifecycle Manager), 3.13.0 (Key Management System)
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Linux Package, Docker Compose, Kubernetes; integrates with Windows Active Directory, Microsoft Intune, Workspace ONE, Keycloak.
- **Target Industries**: Enterprise (implied by "MTG Enterprise Resource Security" and AD/Intune integrations)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: MLDSA and SLHDSA are listed as experimental; no specific timeline or migration plan details provided beyond current support status.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, EC, EdDSA, MLDSA (experimental), SLHDSA (experimental)
- **Authoritative Source URL**: Not stated

---

## essendi xc

- **Category**: Certificate Lifecycle Management
- **Product Name**: essendi xc
- **Product Brief**: A tool for automatic and simple management of digital certificates to prevent disruptions from expired or incorrectly issued certificates.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: The product offers "essendi crypto solutions" enabling end-to-end cryptography management including "post-quantum readiness." It supports discovery, lifecycle management, and future-proofing against quantum attacks. Specific algorithms or implementation details are not stated; the focus is on readiness and monitoring vulnerabilities.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X.509, TLS/SSL (Specific algorithms like ECDSA or RSA not explicitly listed in text)
- **Key Management Model**: Supports integration with Securosys HSMs for secure management; supports key lifecycle (generation, distribution, usage, storage, renewal, deletion).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized platform integrating into existing complex infrastructures; supports agent-based or connector-based installation in target systems.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Manufacturer with own product)
- **Latest Version**: 3.1
- **Release Date**: 2026-03-19
- **FIPS Validated**: Not stated
- **Primary Platforms**: Microsoft world (Microsoft Enrollment Adapter, Microsoft Intune Adapter), IoT devices, servers, target systems.
- **Target Industries**: Financial services, industrial sector, commercial sector, listed corporations.
- **Regulatory Status**: ISO 27001 certified; supports DORA compliance requirements.
- **PQC Roadmap Details**: Focus on "post-quantum readiness" and continuous monitoring of vulnerabilities; no specific algorithm choices or migration timelines stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions digital signatures generally but not specific schemes)
- **Authoritative Source URL**: Not stated

---
