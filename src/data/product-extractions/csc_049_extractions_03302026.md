---
generated: 2026-03-30
collection: csc_049
documents_processed: 12
enrichment_method: ollama-qwen3.5:27b
---

## SandboxAQ AQtive Guard

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: AQtive Guard
- **Product Brief**: Enables encryption remediation and enforcement while continuously optimizing cryptography across organizations.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides cryptographic agility and future-proofing via remediation of out-of-policy algorithms. Supports NIST-approved PQC standards HQC (Hamming Quasi-Cyclic) for key encapsulation and SPHINCS+ for signatures, co-invented by SandboxAQ team members. Designed to address vulnerabilities without re-architecting systems.
- **PQC Migration Priority**: High
- **Crypto Primitives**: HQC, SPHINCS+, RSA, ECC (mentioned as legacy/vulnerable)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2025-03-27 (Press release date regarding HQC selection; product availability is "preview")
- **FIPS Validated**: No
- **Primary Platforms**: Enterprise DevOps environments, centralized database with GraphQL API integration
- **Target Industries**: Enterprises, Government agencies
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports NIST-selected algorithms HQC and SPHINCS+; currently available for preview by select partners.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: SPHINCS+ (NIST standard), HQC (Key Encapsulation Mechanism)
- **Authoritative Source URL**: http://www.sandboxaq.com

---

## Keyfactor AgileSec Analytics

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Keyfactor AgileSec Analytics
- **Product Brief**: Discovers, inventories, and remediates cryptographic assets to accelerate quantum readiness.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Provides visibility into quantum-vulnerable algorithm usage and supports reporting on the migration process to post-quantum cryptography. It identifies risks such as deprecated algorithms but does not explicitly state it generates or manages PQC keys itself, focusing instead on discovery and inventory for migration planning.
- **PQC Migration Priority**: High
- **Crypto Primitives**: TLS certificates, SSH keys, tokens, algorithms, protocols, cryptographic libraries (specific algorithm names like ECDSA or RSA are not explicitly listed in the text).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Sensor-based scanning with centralized inventory; supports on-prem or cloud deployment.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (implied by "Request a Demo" and commercial context, specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Core systems, hosts, endpoints, networks, code repositories, cloud workloads; deployable on-prem or in the cloud.
- **Target Industries**: Financial Services, Telecom, Automotive, Medical, Industrial IoT, Consumer IoT, Software & IT
- **Regulatory Status**: Not stated (mentions compliance with NIST and PCI-DSS frameworks, but no specific regulatory licenses or charters).
- **PQC Roadmap Details**: Discovery is identified as the first step; enables prioritization of migration steps to post-quantum cryptography; supports reporting on the migration process. No specific algorithm choices or timelines stated.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (mentions "Signing Platform" and "code signing" generally, but no specific signature algorithms listed).
- **Authoritative Source URL**: Not stated

---

## Zscaler Zero Trust Exchange

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Zscaler Zero Trust Exchange
- **Product Brief**: A cloud-native, in-line security platform providing zero trust connectivity and crypto discovery to prepare for quantum threats.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Provides 100% visibility into cryptographic protocols and algorithms. Acts as a "Quantum Bridge" using hybrid approaches (classical-to-quantum key exchange) to secure connections from Zscaler to destinations, protecting against "Harvest Now, Decrypt Later" attacks even if endpoints do not support PQC. Centrally manages crypto policies and updates algorithms via the cloud without hardware upgrades.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, Elliptic Curve Cryptography (ECC), Diffie-Hellman (identified as vulnerable); Hybrid approaches mentioned for transition.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, SaaS-based Zero Trust Exchange; acts as a bridge for hybrid key exchange.
- **Infrastructure Layer**: Security Stack, Cloud, Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Cloud (Distributed across 150+ data centers globally); supports users, devices, and applications in any location.
- **Target Industries**: Healthcare, Banking & Financial Services, Manufacturing, Education, Government (Australia, China, US Public/Federal/State), Enterprise.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Aligns with NIST 2024 standards and CISA/NSM-10; recommends inventorying crypto, prioritizing long-life data, and using hybrid approaches. Estimates "Q-Day" between 2030 and 2035.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA, ECC (vulnerable); Planned/Supported: Hybrid approaches for key exchange; specific PQC signature algorithms not named.
- **Authoritative Source URL**: zscaler.com

---

## ISARA Advance

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: ISARA Advance®
- **Product Brief**: Agentless cryptographic inventory and risk assessment tool providing visibility, scoring, and remediation for PQC readiness.
- **PQC Support**: Planned (with details)
- **PQC Capability Description**: The product prepares organizations for PQC migration by translating insights into targeted actions to support crypto agility and build a quantum-ready foundation. It identifies vulnerable RSA and ECC implementations and supports modernization steps aligned with NIST and NSA PQC guidance, but does not explicitly state it currently implements PQC algorithms itself.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC (mentioned as vulnerable/deprecated to be flagged)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Agentless-first discovery; integrates with existing Key Management Systems and Certificate Management Systems.
- **Infrastructure Layer**: Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (inferred from "Book Your Demo" and commercial nature, not explicitly named)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud, on-prem, and hybrid environments; Microsoft Azure mentioned as a partner context.
- **Target Industries**: Financial Services, Government & Public Sector, Energy & Utilities
- **Regulatory Status**: Supports compliance with PCI-DSS, DORA, NERC CIP standards; aligns with NIST and NSA PQC guidance.
- **PQC Roadmap Details**: Provides prioritized remediation actions to support adoption of crypto agility and build a quantum-ready foundation; aligns with NIST and NSA PQC guidance.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (mentions flagging vulnerable RSA and ECC implementations)
- **Authoritative Source URL**: Not stated

---

## Q-CORE Q-Scanner

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Q-CORE Q-Scanner (part of Q-CORE Platform)
- **Product Brief**: Free, open-source PQC vulnerability audit tool analyzing TLS, cipher suites, and post-quantum readiness.
- **PQC Support**: Yes (with details: Detects ML-KEM, ML-DSA; implements ML-KEM-768, ML-DSA, SLH-DSA, FALCON, HQC, BIKE, NTRU, MAYO, CROSS, UOV, SNoVA)
- **PQC Capability Description**: Platform offers scanning for PQC readiness (ML-KEM/Kyber, ML-DSA/Dilithium). Core modules include Q-SHIELD (ML-KEM-768), Q-SIGN (ML-DSA with ECDSA fallback), Q-HYBRID (classical+PQC), and Enterprise/Sovereign tiers supporting 19+ algorithms including CNSA 2.0, McEliece, FrodoKEM, ZKP, and FHE.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (Kyber-768), ML-DSA (Dilithium), ECDSA P-384, AES-256-GCM, HKDF, Ed25519, SLH-DSA, FALCON, HQC, BIKE, NTRU, MAYO, CROSS, UOV, SNoVA, McEliece, FrodoKEM
- **Key Management Model**: Hybrid (Q-HYBRID), HSM-backed (Q-HSM TPM 2.0/PKCS#11), Automated lifecycle (Q-CYCLE)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid classical+PQC, HSM-based, Cloud/On-premise
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Open Source/Commercial
- **License**: Free/Open-source for Q-SCANNER; Commercial (Starter, Business, Enterprise, Sovereign) for full platform
- **Latest Version**: v2.1
- **Release Date**: Not stated
- **FIPS Validated**: Yes (Q-SHIELD NIST FIPS 203, Q-SIGN FIPS 204 compliant; Q-AUDIT FIPS-ready)
- **Primary Platforms**: Cloud, On-premise (Enterprise/Sovereign tiers)
- **Target Industries**: Small businesses, Enterprise, Banks, Hospitals, Government, Defense, Critical Infrastructure
- **Regulatory Status**: CRA (EU Cyber Resilience Act), NIS2, GDPR, ISO 27001, SOC 2, HIPAA, PCI DSS, DORA compliant
- **PQC Roadmap Details**: Includes Q-MIGRATE toolkit for crypto inventory and algorithm replacement; Q-ROADMAP generator for transition planning; supports all 247 algorithms in Sovereign tier.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (Dilithium), ECDSA P-384, Ed25519, SLH-DSA, FALCON, LMS (Stateful hash signatures)
- **Authoritative Source URL**: https://qcore.systems (inferred from text "info @ qcore . systems" and context, though exact URL not fully explicit in snippet, domain is clear)

---

## IBM Guardium Safe

- **Category**: Security Testing & Discovery
- **Product Name**: IBM Guardium Cryptography Manager
- **Product Brief**: Helps organizations achieve crypto-agility, encrypt sensitive data, and prepare for PQC readiness.
- **PQC Support**: Planned (with scope)
- **PQC Capability Description**: The product helps organizations "prepare for PQC readiness," "assess post-quantum cryptography risk," and "assess the efficiency and feasibility of PQC algorithms." It enables a "quantum-resilient algorithm posture" but does not explicitly state that it currently implements specific PQC algorithms in production.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: Centralized key management; automates key generation and certificate renewal; supports IBM and non-IBM storage solutions including cloud storage.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software-based centralized management tool (crypto-agility architecture).
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2026-03-31 (Date of a live session mentioned in the text)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Hybrid environments; IBM and non-IBM storage solutions; cloud storage solutions.
- **Target Industries**: Enterprise (general organizations facing quantum threats).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Focuses on discovering cryptographic objects, assessing PQC risk, flagging outdated algorithms, and enabling crypto-agility to prepare for "Q-Day." Specific algorithm choices or timelines are not detailed.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown

---

## CryptoNext COMPASS Probe

- **Category**: Security Testing & Discovery
- **Product Name**: CryptoNext COMPASS Probe (specifically "CryptoNext COMPASS Network Probe")
- **Product Brief**: High-performance passive network probe detecting and extracting cryptographic data in real time.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The product features enhanced security with encrypted communications using post-quantum TLS 1.3. It is part of a suite designed to help organizations map assets and prepare for PQC migration, but the probe itself primarily detects existing protocols rather than implementing PQC algorithms for data protection beyond its own management interface.
- **PQC Migration Priority**: High
- **Crypto Primitives**: TLS 1.3 (with post-quantum encryption), SSH, ISAKMP
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Passive Network Probe (Hardware/Appliance)
- **Infrastructure Layer**: Network, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2025-06 (Context: "June 2025 We Launch CryptoNext COMPASS Discovery")
- **FIPS Validated**: No (Document mentions NIST CAVP certification for algorithms, not FIPS validation for this specific probe)
- **Primary Platforms**: Network infrastructure via TAP; integrates with CryptoNext COMPASS Analytics via APIs
- **Target Industries**: Banking, Finance, Defense, Energy, Aerospace, Public sectors
- **Regulatory Status**: Not stated (Document mentions EU Commission recommendations and NIST standardization efforts, but no specific regulatory license for the product)
- **PQC Roadmap Details**: Supports migration strategy planning; detects cryptographic assets to prioritize PQC migration; uses post-quantum TLS 1.3 for its own communications.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions detection of protocols but does not list specific signature algorithms supported or used by the probe)
- **Authoritative Source URL**: Unknown (Source filename provided, but no explicit URL in text)

---

## Recorded Future

- **Category**: Security Testing & Discovery
- **Product Name**: Recorded Future
- **Product Brief**: Threat intelligence platform providing data to enhance security tools, inform strategic planning, and mitigate business risk.
- **PQC Support**: No
- **PQC Capability Description**: The document contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or related migration plans. It focuses exclusively on threat intelligence usage, adoption, and spending trends.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025 (Report year, specific product release date not stated)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Mandiant (Google Cloud)

- **Category**: Security Testing & Discovery
- **Product Name**: Unknown
- **Product Brief**: Not stated
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application (as per user context, not explicitly in text)
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://cloud.google.com/blog/products/identity-security/why-google-is-marching-toward-a-quantum-safe-future (URL referenced in 404 error message)

---

## Cyberint (Check Point)

- **Category**: Security Testing & Discovery
- **Product Name**: Unknown
- **Product Brief**: Not stated
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack, Cloud, Network
- **License Type**: Proprietary
- **License**: Commercial
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No mention
- **Primary Platforms**: AWS Cloud, Google Cloud Platform, Azure Cloud
- **Target Industries**: Education, Entertainment & Sports, Federal Government, Financial Services, Healthcare, Manufacturing, Retail, State and Local Government, Telco / Service Provider
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown

---

## SOC 2 (Quantum Trust Criteria)

- **Category**: Security Testing & Discovery
- **Product Name**: Unknown
- **Product Brief**: Not stated
- **PQC Support**: No
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application (inferred from context prompt, but not explicitly stated in document text) -> Not stated
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Accounting and Finance (mentioned regarding the hosting organization)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown

---

## HIPAA (Quantum Security Rule)

- **Category**: Security Testing & Discovery
- **Product Name**: HIPAA Security Rule
- **Product Brief**: A federal regulation establishing national standards to protect electronic protected health information.
- **PQC Support**: No
- **PQC Capability Description**: The document describes a regulatory framework (HIPAA Security Rule) and does not mention Post-Quantum Cryptography, specific algorithms, or implementation status.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application (as a regulatory framework for application-layer security)
- **License Type**: Not stated
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2026-03-19 (Content last reviewed date)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Healthcare, Health Information Technology
- **Regulatory Status**: Federal Regulation (45 CFR Part 160 and Subparts A and C of Part 164)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.hhs.gov/hipaa/for-professionals/security/index.html (Inferred from context of HHS official website, though exact URL not explicitly listed in text)

---
