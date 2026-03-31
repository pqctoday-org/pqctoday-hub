---
generated: 2026-03-31
collection: csc_049
documents_processed: 18
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

## IBM Guardium Quantum Safe

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: IBM Guardium Cryptography Manager
- **Product Brief**: Centralize, simplify, and automate certificate and key lifecycle management to achieve crypto-agility and PQC readiness.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Helps organizations prepare for PQC readiness and assess post-quantum cryptography risk. Enables assessment of the efficiency and feasibility of PQC algorithms. Protects against "harvest now, decrypt later" attacks. Related products include Quantum Safe Explorer for identifying artifacts and Quantum Safe Remediator for testing remediation patterns.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: Centralized key management; automates key generation and certificate renewal; enforces consistent policies.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized tool for lifecycle operations; supports hybrid cryptographic environments (via related product Quantum Safe Remediator).
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Supports IBM and non-IBM storage solutions, including cloud storage solutions and applications.
- **Target Industries**: Enterprise (implied by "organizations", "CIOs", "compliance standards")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Focuses on achieving crypto-agility, assessing PQC algorithm efficiency/feasibility, and preparing for Q-Day. No specific timeline or algorithm choices listed.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: IBM_Guardium_Quantum_Safe.html

---

## Cloudflare Zero Trust

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Cloudflare One
- **Product Brief**: The agile SASE platform to connect and protect workforce, AI agents, and infrastructure on a global connectivity cloud.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Provides "quantum-safe access" for remote access and describes Network-as-a-service as "quantum-safe SASE." Mentions "Post-quantum cryptography" under CxO topics to safeguard data and meet compliance. No specific algorithms or production deployment details stated.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS, unified platform with one control plane, data plane, and infrastructure layer; composable and programmable.
- **Infrastructure Layer**: Security Stack, Cloud, Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: SASE platform (Cloudflare One), global connectivity cloud; supports integration via API and Terraform.
- **Target Industries**: Healthcare, Financial services, Retail, Gaming, Public sector, Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Mentions "Post-quantum cryptography" as a topic to safeguard data and meet compliance standards; no specific timeline or algorithm choices provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
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

## Splunk Enterprise

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Splunk Enterprise
- **Product Brief**: Gain operational intelligence by collecting, indexing, and visualizing data using a powerful on-premises engine.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document describes data collection, indexing, visualization, SIEM, SOAR, and observability capabilities but contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: On-premises engine; also available as Cloud Platform (SaaS) and hybrid options.
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Commercial
- **License**: Proprietary (Splunk LLC/Splunk Inc.)
- **Latest Version**: Enterprise Security 8, Enterprise Security 7
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: On-premises, Cloud Platform, Hybrid; mentions support for mobile, TV, and augmented reality capabilities.
- **Target Industries**: Aerospace and Defense, Communications and Media, Energy and Utilities, Financial Services, Healthcare, Higher Education, Manufacturing, Nonprofits, Online Services, Public Sector, Retail, Technology.
- **Regulatory Status**: FedRamp Support mentioned; Gartner® Magic Quadrant™ Leader for SIEM and Observability Platforms.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document source filenames provided: Splunk_Enterprise.html, Splunk_Enterprise_doc1.html)

---

## Elastic Stack (ELK)

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Elastic Stack (ELK)
- **Product Brief**: A search platform comprised of Elasticsearch, Kibana, Beats, and Logstash to search, analyze, and visualize data.
- **PQC Support**: No
- **PQC Capability Description**: Not stated in the provided text. The document mentions "security" as a feature but does not specify Post-Quantum Cryptography algorithms, implementation status, or maturity levels.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Distributed; SaaS (Elastic Cloud) and On-Prem; Agent-based (Elastic Agent, Beats) and agentless options.
- **Infrastructure Layer**: Security Stack, Cloud, Application
- **License Type**: Open Source/Commercial
- **License**: Apache-2.0 (mentioned for specific repositories like `docs-builder`); Commercial (implied by "Start free trial", "See pricing", and trademark notices).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: AWS, Google Cloud, Azure; On-Premise installations.
- **Target Industries**: Enterprises, Small and medium teams, Startups, Nonprofits, Healthcare, Financial services, Manufacturing, Government.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.elastic.co/

---

## CrowdStrike Falcon

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: CrowdStrike Falcon
- **Product Brief**: AI-powered endpoint protection, detection, and response platform backed by adversary intelligence.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document focuses on endpoint security, threat detection, and AI-driven response but contains no mention of Post-Quantum Cryptography algorithms, implementation status, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Agent-based (single lightweight sensor), SaaS/Cloud (Falcon platform)
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Every major operating system (implied by "protects every major operating system")
- **Target Industries**: Enterprise, Government (mentioned via "Fal.Con Gov 2026" event)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown

---

## Palo Alto Cortex XDR

- **Category**: Cryptographic Discovery Platforms
- **Product Name**: Cortex XDR
- **Product Brief**: AI-driven endpoint security platform providing prevention, detection, and response with a single agent.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The provided text contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Single-agent architecture; AI-driven analytics; unified data foundation.
- **Infrastructure Layer**: Security Stack, Cloud (implied by "Cloud Delivered Security Services" and "Cortex Platform"), Application (Endpoint)
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Endpoints (Windows, macOS, Linux implied by "endpoint" context but not explicitly listed); Cloud; Network; Identity; Email.
- **Target Industries**: Commercial Businesses, Enterprise, Healthcare (Asante Health), Government/Public Sector (North Dakota IT), Automotive/Marketplace (Kavak), Education (Wits University), Banking (Glacier Bancorp).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

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
- **Product Brief**: Protects sensitive data, mitigates risk, and prepares organizations for quantum resilience through crypto-agility.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Helps achieve crypto-agility and prepare for PQC readiness. Features include assessing post-quantum cryptography risk, flagging outdated or vulnerable algorithms, assessing the efficiency and feasibility of PQC algorithms, and protecting against "harvest now, decrypt later" attacks. Specific PQC algorithm names are not stated.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions detecting "outdated or vulnerable algorithms" but does not list specific current primitives like ECDSA or RSA).
- **Key Management Model**: Centralized lifecycle management; automates key generation and certificate renewal.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based crypto-agility platform (Text mentions "hybrid environments" for discovery, but does not specify the underlying cryptographic architecture like HSM or MPC).
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2026-03-31 (Date of a live session mentioned in the text; no specific software release date provided).
- **FIPS Validated**: Not stated
- **Primary Platforms**: Hybrid environments (Text mentions "hybrid environments" and "cloud storage solutions" but does not list specific OS or cloud providers).
- **Target Industries**: Enterprise (Text references "organizations", "CIOs", and general business contexts).
- **Regulatory Status**: Not stated (Text mentions ensuring alignment with "evolving compliance standards" but lists no specific regulations or charters).
- **PQC Roadmap Details**: Focuses on achieving crypto-agility, assessing PQC algorithm efficiency/feasibility, and preparing for Q-Day. No specific timeline or algorithm selection roadmap is provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename "IBM_Guardium_Safe.html" is provided, but no full URL).

---

## CryptoNext COMPASS Probe

- **Category**: Security Testing & Discovery
- **Product Name**: CryptoNext COMPASS Probe (specifically "CryptoNext COMPASS Network Probe")
- **Product Brief**: High-performance passive network probe detecting and extracting cryptographic data in real time.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The product ensures encrypted communications using post-quantum TLS 1.3. It is part of a suite designed to help organizations map assets, evaluate impacts, and prepare for PQC migration. The vendor claims NIST CAVP certification for all three standardized quantum-safe algorithms, though the specific application of these algorithms within the probe's core detection logic (vs. its own security) is not explicitly detailed beyond the TLS 1.3 mention.
- **PQC Migration Priority**: High
- **Crypto Primitives**: post-quantum TLS 1.3; TLS, SSH, ISAKMP (protocols detected); NIST standardized quantum-safe algorithms (specific names not listed in text).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Passive Network Probe (Hardware/Network)
- **Infrastructure Layer**: Network, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2025-06-01 (Referenced as "June 2025 We Launch CryptoNext COMPASS Discovery")
- **FIPS Validated**: No (Text mentions NIST CAVP certification for algorithms, but does not explicitly state FIPS 140-2/140-3 validation status for the product itself).
- **Primary Platforms**: Not stated (Mentions integration via APIs and standard data formats; OS is described as "hardened OS" without specific name).
- **Target Industries**: Banking, Finance, Defense, Energy, Aerospace, Public sectors.
- **Regulatory Status**: NIST CAVP Certification for all three standardized quantum-safe algorithms; European Commission roadmap alignment (2026 inventory requirement).
- **PQC Roadmap Details**: Supports the transition to PQC by providing inventory and analysis; vendor is at the forefront of NIST standardization efforts.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions detection of protocols but does not list specific signature schemes used or detected).
- **Authoritative Source URL**: Unknown (Source filename provided, but no explicit URL in text).

---

## Recorded Future

- **Category**: Security Testing & Discovery
- **Product Name**: Recorded Future
- **Product Brief**: Threat intelligence platform enhancing security tools, informing strategic planning, and mitigating business risk.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document discusses threat intelligence usage, adoption, spending, and challenges but contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or related migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: 2025 (Report year, specific software release date not stated)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
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
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud (inferred from "Google Cloud" in footer, but specific product layer not stated)
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown (Document indicates a 404 error for the requested URL)

---

## Cyberint (Check Point)

- **Category**: Security Testing & Discovery
- **Product Name**: Check Point (Platform)
- **Product Brief**: Not stated (Document is a 404 error page containing navigation links and general company information).
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated. The document contains no information regarding Post-Quantum Cryptography, algorithms, or implementation status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack, Cloud, Network (Inferred from listed product categories like "Network Security", "Cloud", "SASE")
- **License Type**: Proprietary (Implied by "Check Point Software Technologies Ltd. All rights reserved" and commercial service listings)
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Not stated (General categories like AWS, Google Cloud, Azure are listed under partners, not specific product deployment targets in this text)
- **Target Industries**: Education, Entertainment & Sports, Federal Government, Financial Services, Healthcare, Manufacturing, Retail, State and Local Government, Telco / Service Provider
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text indicates a 404 error page; no specific product URL is provided)

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
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Not stated
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Accounting and finance profession
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown

---

## HIPAA (Quantum Security Rule)

- **Category**: Security Testing & Discovery
- **Product Name**: HIPAA Security Rule
- **Product Brief**: National standards to protect electronic protected health information through administrative, physical, and technical safeguards.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document discusses general cybersecurity and the HIPAA Security Rule but contains no mention of Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or related migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Security Stack
- **License Type**: Not stated
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2026-03-19 (Date content last reviewed)
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Healthcare, Government
- **Regulatory Status**: HIPAA Security Rule (45 CFR Part 160 and Subparts A and C of Part 164)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---
