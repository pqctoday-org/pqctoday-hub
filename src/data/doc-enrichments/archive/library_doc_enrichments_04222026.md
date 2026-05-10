---
generated: 2026-04-22
collection: library
documents_processed: 17
enrichment_method: ollama-qwen3.5:27b
---

## Microsoft-Crypto-Inventory-CPM-2026

- **Reference ID**: Microsoft-Crypto-Inventory-CPM-2026
- **Title**: Building your cryptographic inventory: a customer strategy for cryptographic posture management
- **Authors**: Microsoft Security
- **Publication Date**: 2026-04-16
- **Last Updated**: 2026-04-16
- **Document Status**: Published
- **Main Topic**: Establishing a comprehensive cryptographic inventory as the foundational step for a customer-led Cryptography Posture Management (CPM) program to enable quantum readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: 15 countries and the EU; Bodies: NIST, IETF
- **Leaders Contributions Mentioned**: Aviram Shemesh; Jennifer Rutzer
- **PQC Products Mentioned**: GitHub Advanced Security; Microsoft Defender for Vulnerability Management; Microsoft Defender for Endpoint; Microsoft Defender for Cloud; Azure Key Vault; Azure Network Watcher; Microsoft Sentinel; CodeQL
- **Protocols Covered**: TLS; SSL; SSH; IPsec
- **Infrastructure Layers**: PKI; Key management systems; Hardware security modules (HSMs); Trusted Platform Modules (TPMs); Cloud infrastructure; Source code repositories; Configuration files; Vaults
- **Standardization Bodies**: NIST; IETF
- **Compliance Frameworks Referenced**: DORA; OMB M-23-02; PCI DSS 4.0
- **Classical Algorithms Referenced**: RSA; ECC; AES; hashing functions
- **Key Takeaways**: Organizations must build a comprehensive cryptographic inventory to identify where cryptography is used before migrating; Cryptography Posture Management is an ongoing lifecycle requiring continuous monitoring rather than a one-time scan; Risk prioritization should be based on asset criticality, exposure, and compliance requirements; Microsoft Security tools can generate signals across code, runtime, storage, and network domains to support inventory creation; Clear ownership and measurable outputs are required for each stage of the CPM operating model.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Operations; Policy Maker
- **Implementation Prerequisites**: GitHub Advanced Security activation; Microsoft Defender for Endpoint deployment; Azure Key Vault audit; Network protection enablement in MDE; Azure Network Watcher configuration; Common view and schema for tracking outputs
- **Relevant PQC Today Features**: Assess; Compliance; Migration-program; pqc-governance; code-signing; api-security-jwt; iot-ot-pqc; crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Certificate inventory; Key material audit; Algorithm enumeration; Deprecated cipher detection; Secret scanning; Source code analysis for cryptographic primitives
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Third-party library trust; Dependency chains via vulnerable components detection
- **Deployment & Migration Complexity**: Migration phase (Discover, Normalize, Assess risk, Prioritize, Remediate, Continuous monitoring); Phased rollout across code, network, runtime, and storage domains
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Governance prerequisites; Dedicated ownership for each stage; Change management scope via operating model; Maturity assessment via continuous monitoring
- **Source Document**: Microsoft-Crypto-Inventory-CPM-2026.html (307,717 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:24:21

---

## EJBCA-Understanding-CPM

- **Reference ID**: EJBCA-Understanding-CPM
- **Title**: Understanding Cryptographic Posture Management and Asset Visibility
- **Authors**: Keyfactor / EJBCA
- **Publication Date**: 2024-10-01
- **Last Updated**: 2025-06-15
- **Document Status**: Published
- **Main Topic**: The document frames Cryptographic Posture Management (CPM) as a necessity for continuous visibility and automated policy enforcement across all cryptographic assets, extending beyond traditional certificate lifecycle management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dr. Vladimir Soukharev, VP of Cryptography at InfoSec Global (part of Keyfactor); Sven Rajala
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; mTLS
- **Infrastructure Layers**: PKI; Key stores and security modules
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA-1; RSA; AES
- **Key Takeaways**: CLM covers only a small portion of the cryptographic ecosystem requiring full visibility into algorithms, keys, and libraries; Risk assessment must account for business criticality as weak cryptography in high-value systems poses greater threats; Cryptographic assets are ubiquitous even in default operating system installations; Binary scanning is essential to detect hidden risks in third-party software without source code access; Transitioning to post-quantum cryptography is critical to prevent total system vulnerability.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Compliance Officer; Operations
- **Implementation Prerequisites**: Ability to scan compiled binaries; Capability to analyze embedded cryptographic components; Mechanism to identify outdated libraries or algorithms
- **Relevant PQC Today Features**: Assess; pqc-risk-management; migration-program; vendor-risk; iot-ot-pqc
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Scanning compiled binaries; Analyzing embedded cryptographic components; Identifying outdated libraries or algorithms; Detecting hundreds of cryptographic artifacts in default installations
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: Digital identities for IoT products; Secure device identity in Industrial Cybersecurity
- **Supply Chain & Vendor Risk**: Third-party applications and libraries; Lack of source code access; Hidden risks in compiled binaries
- **Deployment & Migration Complexity**: Legacy cryptographic implementations remaining after upgrades; Failure to remove legacy versions leaving unnecessary vulnerabilities
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Continuous visibility and evaluation required; Shift from manual audit-driven compliance to automated continuous practice
- **Source Document**: EJBCA-Understanding-CPM.html (80,392 bytes, 11,283 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:26:36

---

## EJBCA-Beyond-CBOM

- **Reference ID**: EJBCA-Beyond-CBOM
- **Title**: Looking Beyond the CBOM: Building Stronger Cryptographic Posture
- **Authors**: Keyfactor / EJBCA
- **Publication Date**: 2025-02-20
- **Last Updated**: 2025-02-20
- **Document Status**: Published
- **Main Topic**: The document argues that Cryptographic Bills of Materials (CBOMs) are insufficient without proactive cryptographic discovery, prioritization, and lifecycle management to ensure strong cryptographic posture.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dr. Vladimir Soukharev, VP of Cryptography at InfoSec Global (part of Keyfactor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.0, TLS 1.2, TLS 1.3
- **Infrastructure Layers**: PKI, Key Management Systems (KMS), Certificate management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Triple DES, DES, SHA-1, MD5, AES, SHA-2, SHA-3
- **Key Takeaways**: CBOMs provide transparency but rely on trust rather than verification; Proactive cryptographic discovery via scanning is essential to detect actual usage; Prioritization strategies are critical to manage overwhelming volumes of findings; Deprecated algorithms like DES and MD5 must be replaced with modern alternatives; Protocol upgrades must fully disable legacy versions to prevent downgrade attacks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility, cryptographic lifecycle management
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Developer, Operations
- **Implementation Prerequisites**: Proactive cryptographic discovery tools; Internal crypto inventory; Capability for crypto agility; Key Management Systems (KMS)
- **Relevant PQC Today Features**: Assess, crypto-agility, pki-workshop, code-signing, iot-ot-pqc
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: CBOM, proactive cryptographic discovery, internal crypto inventory, deprecated cipher detection, certificate inventory
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: Digital identities for IoT products, Secure device identity in Industrial Cybersecurity
- **Supply Chain & Vendor Risk**: CBOM, vendor-provided CBOMs, third-party library trust, open-source vs proprietary
- **Deployment & Migration Complexity**: Protocol upgrades, removing legacy versions, crypto agility, cryptographic lifecycle management
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Cryptographic hygiene, multi-dimensional prioritization approach, engineering team capacity
- **Source Document**: EJBCA-Beyond-CBOM.html (79,434 bytes, 9,987 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:28:17

---

## IBM-CBOM-Harishankar

- **Reference ID**: IBM-CBOM-Harishankar
- **Title**: Cryptographic Bill of Materials (CBOM)
- **Authors**: Ray Harishankar et al. (IBM)
- **Publication Date**: 2023-06-01
- **Last Updated**: 2024-09-01
- **Document Status**: Published
- **Main Topic**: Introduction to IBM's Cryptography Bill of Materials (CBOM) as a tool for inventorying and migrating software to quantum-safe cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Obsolescence of current encryption schemes due to future quantum computers; risk to sensitive data like financial and health records.
- **Migration Timeline Info**: NIST expects to finalize four quantum-safe algorithms by 2024; World Economic Forum estimates 10-20 years for device upgrades or replacements.
- **Applicable Regions / Bodies**: United States; White House; U.S. National Institute of Standards and Technology (NIST); GSMA; The World Economic Forum.
- **Leaders Contributions Mentioned**: Alessandro Curioni; Michael Osborne; IBM scientists (developed three of four NIST algorithms).
- **PQC Products Mentioned**: IBM Quantum Safe solutions; IBM Tape; IBM z16 systems; Cryptography Bill of Materials (CBOM) tooling.
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Software supply chains; Software as a Service (SaaS); essential business applications; IT environment.
- **Standardization Bodies**: U.S. National Institute of Standards and Technology (NIST).
- **Compliance Frameworks Referenced**: Executive Order 14028; National Security Memorandum 10 (NSM-10); Migration to Post-Quantum Cryptography (M-23-02).
- **Classical Algorithms Referenced**: RSA; elliptic curves.
- **Key Takeaways**: Organizations can use CBOM to quickly address migration needs for software and infrastructure; Three of four NIST quantum-safe algorithms were developed by IBM scientists; Agencies must establish a security software supply chain and prioritized inventory per M-23-02; Over 20 billion digital devices may need upgrading in the next 10-20 years.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Drop-in replacements for upgrading systems; extension of Software Bill of Materials (SBOM) concept.
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations; Policy Maker.
- **Implementation Prerequisites**: Cryptography inventory; standardized list of components, libraries, and dependencies; quantum-proofed software repository.
- **Relevant PQC Today Features**: Assess; Migrate; Algorithms; Supply Chain & Vendor Risk; CBOM.
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Cryptography Bill of Materials (CBOM); passive or active scanning of IT environment; deep scan for root cause; cryptography inventory prioritization.
- **Testing & Validation Methods**: End-to-end validation of automatically inspecting live essential business applications.
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Software supply chain security; dependency chains via CBOM; third-party library trust via standardized component lists.
- **Deployment & Migration Complexity**: Three-step approach: Discover, Analyze, Remediate; non-intrusive and active methods; risk-based prioritization of cryptography inventory.
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Need for security software supply chain; prioritized inventory of deployed cryptographic systems; governance triggered by White House executive orders.
- **Source Document**: IBM-CBOM-Harishankar.html (66,962 bytes, 6,792 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:29:55

---

## Keyfactor-Introducing-CBOM

- **Reference ID**: Keyfactor-Introducing-CBOM
- **Title**: Introducing the Cryptographic Bill of Materials (CBOM)
- **Authors**: Keyfactor
- **Publication Date**: 2024-03-15
- **Last Updated**: 2024-03-15
- **Document Status**: Published
- **Main Topic**: The document introduces the Cryptographic Bill of Materials (CBOM) as a static inventory of cryptographic components and argues for its integration with a dynamic, organization-wide cryptographic inventory to achieve full visibility and risk management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Chris Hickman (Keyfactor CSO)
- **PQC Products Mentioned**: Bouncy Castle APIs; Keyfactor PQC Lab
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI; HSM; Keystores
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-256; RSA-2048; ECC-384; SHA-1; SHA-256
- **Key Takeaways**: A CBOM provides a static view of built-in cryptographic capabilities but lacks operational context; Organizations must combine CBOM with a dynamic cryptographic inventory to capture configurations and usage; This integrated approach enables proactive posture management and prepares for quantum computing challenges without costly replatforming.
- **Security Levels & Parameters**: RSA-2048; ECC-384; AES-256
- **Hybrid & Transition Approaches**: Crypto-Agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Compliance Officer; Developer
- **Implementation Prerequisites**: Cryptographic inventory; CBOM assessment; integration of static capability mapping and dynamic inventory
- **Relevant PQC Today Features**: Assess; crypto-agility; pqc-risk-management; migration-program; code-signing
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: CBOM; cryptographic inventory; algorithm enumeration; certificate inventory; key material audit
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: SBOM; CBOM; third-party library trust
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: Keyfactor-Introducing-CBOM.html (145,192 bytes, 8,808 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:31:47

---

## Deloitte-TechTrends-2025-Quantum

- **Reference ID**: Deloitte-TechTrends-2025-Quantum
- **Title**: Tech Trends 2025: The new math of quantum cryptography
- **Authors**: Deloitte Insights
- **Publication Date**: 2024-12-10
- **Last Updated**: 2024-12-10
- **Document Status**: Published
- **Main Topic**: Deloitte analyst brief arguing that post-quantum cryptography investment is defensible on operational and regulatory grounds independent of quantum-arrival timing.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computer (CRQC); harvest-now, decrypt-later attacks
- **Migration Timeline Info**: Experts estimate a cryptographically relevant quantum computer could appear within five to 10 years; federal agencies must migrate to quantum-resistant systems in the coming decade
- **Applicable Regions / Bodies**: United States; US Office of Management and Budget; National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Kelly Raskovich (Senior Manager, Office of the CTO Leader); Bill Briggs (Principal, US Chief Technology Officer); Ed Burns (Manager, Office of the CTO); Colin Soutar (Managing Director, leads US and Global quantum cyber readiness program); Sunny Aziz (Principal, Cyber & Strategic Risk Services); Mike Redding (Chief Technology Officer at Quantropi); Gomeet Pant (Group Vice President of Security Technologies for Indi)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework
- **Classical Algorithms Referenced**: SHA1; SHA2
- **Key Takeaways**: Future quantum computers will break today's encryption exposing digital signatures and sensitive data; The immediate threat is harvest-now, decrypt-later attacks where adversaries steal encrypted data today; Organizations should start migrating to NIST post-quantum cryptography standards now due to long infrastructure update times; Preparing for CRQCs is highly important but often deferred due to unknown timescales
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Timeline; Compliance; Assess; Leaders; pqc-business-case; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Third-party dependencies; vendor PQC roadmap maturity implied by vendor adoption discussion
- **Deployment & Migration Complexity**: Migrating from cryptographic hashing algorithms SHA1 to SHA2 took significant time; updating infrastructures and third-party dependencies may take eight to twelve years
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: 52% of organizations are assessing exposure and developing quantum-related risk strategies; 30% are taking decisive action to implement solutions
- **Source Document**: Deloitte-TechTrends-2025-Quantum.html (330,438 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:33:20

---

## IBM-IBV-Secure-PostQuantum-2025

- **Reference ID**: IBM-IBV-Secure-PostQuantum-2025
- **Title**: Secure the post-quantum future (IBM IBV 2025)
- **Authors**: Ray Harishankar et al. (IBM IBV)
- **Publication Date**: 2025-01-20
- **Last Updated**: 2025-01-20
- **Document Status**: Published
- **Main Topic**: IBM Institute for Business Value report on enterprise quantum-safe readiness, organizational maturity models, and investment sequencing.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; data at risk as quantum computers become cryptographically relevant
- **Migration Timeline Info**: Originally published 03 October 2025; The Quantum Decade indicates quantum computing is fast approaching practical applications
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Ray Harishankar (IBM Fellow & Vice President, IBM Quantum Safe); Gregg Barrow (Vice President & Global Offering Leader, Quantum Safe Transformation & Growth, IBM Consulting); Antti Ropponen (Executive Partner, Quantum Safe Transformation and Cyber Defend Services Leader, IBM Consulting); Veena Pureswaran (Research Director, Quantum Computing and Emerging Technologies, IBM Institute for Business Value); Gerald Parham (Global Research Leader, Security & CIO, IBM Institute for Business Value)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should assess quantum readiness to strengthen cyber resilience for today and tomorrow; Quantum-ready organizations are more likely to embrace ecosystems and accelerate innovation; Leaders who do not adapt to the approaching quantum advantage could be years behind; IBM Quantum Safe provides services and tools to help organizations migrate to post-quantum cryptography
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Migrate; Assess; Leaders; pqc-business-case; pqc-governance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Organizations need to migrate to post-quantum cryptography; investment sequencing is required for organizational maturity
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Organizational maturity model and investment sequencing are central themes; Quantum-ready organizations bridge talent gaps and embrace ecosystems
- **Source Document**: IBM-IBV-Secure-PostQuantum-2025.html (540,437 bytes, 5,651 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:35:28

---

## Sectigo-State-Crypto-Agility-2025

- **Reference ID**: Sectigo-State-Crypto-Agility-2025
- **Title**: 2025 State of Crypto Agility Report: Preparing for Post-Quantum
- **Authors**: Sectigo
- **Publication Date**: 2025-03-10
- **Last Updated**: 2025-03-10
- **Document Status**: Published
- **Main Topic**: The 2025 State of Crypto Agility Report details organizational preparedness for post-quantum cryptography and shrinking SSL/TLS certificate lifespans through a survey of enterprise leaders.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL) attacks
- **Migration Timeline Info**: March 15, 2026: Max public TLS lifespan drops to 200 days; March 15, 2027: Drops to 100 days; March 15, 2029: Drops to 47 days; NIST plans to deprecate RSA and ECC in 2030 with full disallowance by 2035
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Tim Callan (Chief Compliance Officer); Nick France (CTO); Alex Pena (Product Marketing Director); Jason Soroko (Fellow)
- **PQC Products Mentioned**: Sectigo Certificate Manager
- **Protocols Covered**: TLS, SSL
- **Infrastructure Layers**: Cryptographic Center of Excellence (CCOE), certificate lifecycle management (CLM), cryptographic infrastructure
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Organizations must automate certificate lifecycle management to handle 12x more renewals by 2029; Crypto agility is a business imperative to survive the quantum era and shrinking certificate lifespans; Establishing a Cryptographic Center of Excellence (CCOE) can save 50% in PQC transition costs; Manual certificate management poses significant risks of outages and compliance failures as validity windows shrink
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility, automated certificate lifecycle management (CLM), Cryptographic Center of Excellence (CCOE)
- **Performance & Size Considerations**: Certificate lifespan dropping from 398 days to 47 days by 2029; 12x more renewals required by 2029
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Automated certificate lifecycle management (CLM); Cryptographic Center of Excellence (CCOE); complete inventory of certificates; visibility into rogue or shadow certificates
- **Relevant PQC Today Features**: crypto-agility, timeline, threats, migration-program, pqc-governance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Complete inventory of certificates; tracking rogue or shadow certificates
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: 12x more work by 2029; competing roadmap priorities are a significant obstacle; 57% cite competing priorities as critical to automation adoption
- **Financial & Business Impact**: Organizations with CryptoCOE by 2028 will save 50% in PQC transition costs; lost revenue from outages due to expired certificates
- **Organizational Readiness**: Only 19% feel prepared for monthly renewals; only 28% have a complete inventory of certificates; only 14% have conducted a full assessment of quantum-vulnerable systems; 57% cite competing roadmap priorities as obstacles
- **Source Document**: Sectigo-State-Crypto-Agility-2025.html (419,345 bytes, 12,212 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:37:06

---

## Meta-PQC-Migration-2026

- **Reference ID**: Meta-PQC-Migration-2026
- **Title**: Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways
- **Authors**: Meta Engineering
- **Publication Date**: 2026-04-16
- **Last Updated**: 2026-04-16
- **Document Status**: Published
- **Main Topic**: Meta's framework and lessons learned on large-scale post-quantum cryptography migration, including prioritization, inventory, and maturity levels.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, HQC, BIKE, Classical McEliece
- **Quantum Threats Addressed**: Store now, decrypt later (SNDL), Shor's algorithm, Grover's attack, offline attacks, online attacks
- **Migration Timeline Info**: Experts estimate quantum computers could break conventional cryptography within 10–15 years; NIST and NCSC guidance discusses target timeframes including 2030.
- **Applicable Regions / Bodies**: United States (US National Institute of Standards and Technology), United Kingdom (UK's National Cyber Security Centre)
- **Leaders Contributions Mentioned**: Rafael Misoczki, Isaac Elbaz, Forrest Mertens (authors sharing lessons); Meta cryptographers (co-authors of HQC)
- **PQC Products Mentioned**: LibOQS, Crypto Visibility service
- **Protocols Covered**: TLS, X.509
- **Infrastructure Layers**: HSM, CPU, PKI, internal infrastructure, production engineering
- **Standardization Bodies**: NIST, IETF, ISO, Open Quantum Safe consortium, Linux Foundation Post-Quantum Cryptography Alliance
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should adopt PQC Migration Levels to assess readiness from PQ-Unaware to PQ-Enabled; Prioritize applications susceptible to store now, decrypt later attacks using public-key encryption and key exchange; Build a comprehensive cryptographic inventory using automated discovery and developer reporting; Address external dependencies including community-vetted standards and hardware support before full migration; Implement guardrails by disallowing creation of new keys for affected APIs.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, CISO, Compliance Officer, Researcher
- **Implementation Prerequisites**: Community-vetted PQC standards; PQC support in hardware (HSM, CPU); Production-level PQC implementations; Cryptographic inventory; External dependency resolution
- **Relevant PQC Today Features**: Migrate, Assess, Algorithms, Threats, migration-program, pqc-risk-management, hsm-pqc, pki-workshop
- **Implementation Attack Surface**: Side-channel vulnerabilities, bugs in implementations
- **Cryptographic Discovery & Inventory**: Automated discovery via monitoring tools (Crypto Visibility service), developer reporting for shadow dependencies and legacy usage
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: External dependencies on hardware vendors (HSM, CPU), third-party library trust (LibOQS), open-source vs proprietary considerations
- **Deployment & Migration Complexity**: Multi-year process; phased rollout; prioritization of high, medium, and low risk applications; external dependency blocking; guardrails implementation
- **Financial & Business Impact**: Cost efficiency principle to avoid unnecessary expenditure; balancing investment with risk mitigation
- **Organizational Readiness**: PQC Migration Levels (PQ-Unaware, PQ-Aware, PQ-Ready, PQ-Hardened, PQ-Enabled); governance via prioritization criteria; dedicated workstreams for inventory and dependencies
- **Source Document**: Meta-PQC-Migration-2026.html (126,436 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:39:27

---

## InfoSec-Global-Hype-Cycles

- **Reference ID**: InfoSec-Global-Hype-Cycles
- **Title**: Crypto-Agility Hype: InfoSec Global Featured in Three Gartner Hype Cycles
- **Authors**: InfoSec Global
- **Publication Date**: 2025-07-20
- **Last Updated**: 2025-07-20
- **Document Status**: Published
- **Main Topic**: The document presents Keyfactor's market positioning as a leader in digital trust and quantum-safe security, highlighting their product suite and blog content regarding crypto-agility and PQC readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Q-Day deadline moved to 2029; certificate lifespans shifting to 47 days
- **Applicable Regions / Bodies**: APAC
- **Leaders Contributions Mentioned**: Chris Hickman (Keyfactor CSO)
- **PQC Products Mentioned**: Keyfactor, Bouncy Castle APIs, PQC Lab
- **Protocols Covered**: SSH, SSL/TLS
- **Infrastructure Layers**: PKI, Cryptographic Discovery & Inventory, Certificate Lifecycle Automation, Signing Platform, HSM (implied via "Secure Devices" and "Signing as a Service" context but not explicitly named as HSM layer), Cloud KMS (not explicitly named)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must prepare for shorter certificate lifespans of 47 days; Q-Day deadline has been moved to 2029 requiring updated planning; Crypto-agility is a recognized category by Gartner; Cryptographic visibility is essential for quantum readiness; Endpoints represent a blind spot in post-quantum cryptography strategies
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: cryptographic inventory; PKI upgrade path; endpoint visibility
- **Relevant PQC Today Features**: crypto-agility, code-signing, pki-workshop, migration-program, pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Cryptographic Discovery & Inventory; Automate discovery of every cryptographic asset
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: Build Secure Devices; Industrial Internet of Things (IIoT); Consumer IoT
- **Supply Chain & Vendor Risk**: Ecosystem Integrations; Open Source Trust and Compliance
- **Deployment & Migration Complexity**: Achieve Crypto-Agility; Surviving the Shift to 47-Day Certificate Lifespans
- **Financial & Business Impact**: Put a Real Dollar Value on PKI
- **Organizational Readiness**: Quantum Readiness Needs Cryptographic Visibility; APAC Isn't Waiting for Quantum
- **Source Document**: InfoSec-Global-Hype-Cycles.html (144,153 bytes, 4,609 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:41:49

---

## NIST-CMVP-MIP-List

- **Reference ID**: NIST-CMVP-MIP-List
- **Title**: NIST CMVP Modules In Process (MIP) List
- **Authors**: NIST CMVP
- **Publication Date**: 2023-01-01
- **Last Updated**: 2026-04-15
- **Document Status**: Live
- **Main Topic**: Authoritative list of cryptographic modules currently undergoing FIPS 140-3 validation by the NIST CMVP, including status and vendor details.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Queue backlog often 18–24 months; Last Updated: 4/22/2026
- **Applicable Regions / Bodies**: United States; NIST; CMVP
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Code Siren Post-Quantum Cryptographic (PQC) Library for Desktop; Code Siren Post-Quantum Cryptographic (PQC) Library for Mobile
- **Protocols Covered**: IPsec; MACsec; TLS; SSH; GnuTLS; OpenSSL; Libgcrypt; Strongswan; NSS
- **Infrastructure Layers**: HSM; Kernel; Secure Key Store; Hardware; Software; Cloud KMS; SEDs; NVMe; TCG Opal
- **Standardization Bodies**: NIST; CMVP
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS 140-3 Management Manual
- **Classical Algorithms Referenced**: AES; RSA; ECDSA; SHA-2; DH; X25519; DSA; 3DES; None detected
- **Key Takeaways**: The CMVP validation queue backlog is often 18–24 months; Modules transition from Pending Review to Review only after the lab pays the NIST Cost Recovery fee; Action items for module status resolution may reside with the CMVP, the lab, or the vendor; Hold statuses are triggered by circumstances stated in FIPS 140-3 Management Manual Section 4.3.4
- **Security Levels & Parameters**: SL1; SL2; PHY3; Suite B
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Vendor; Laboratory
- **Implementation Prerequisites**: NIST Cost Recovery fee payment; FIPS 140-3 validation report submission; vendor contact for schedule details
- **Relevant PQC Today Features**: Compliance, Migrate, Assess, Algorithms, vendor-risk, hsm-pqc, pki-workshop, migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: FIPS 140-3 validation; Comment Resolution; Review; Finalization; Pending Resubmission
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: Mobile; Desktop; Embedded; On-chip; PHY; WiFi Access Points; Smartcard; HSM
- **Supply Chain & Vendor Risk**: Vendor action required for module status resolution; Third-party library validation (OpenSSL, GnuTLS, NSS); Cost Recovery fee dependency
- **Deployment & Migration Complexity**: Pending Review; Review; Finalization; Comment Resolution - CMVP; Comment Resolution - Lab; Pending Resubmission; Hold states
- **Financial & Business Impact**: NIST Cost Recovery fee required for module transition
- **Organizational Readiness**: Joint effort between CMVP, laboratory, and vendor required for validation process
- **Source Document**: NIST-CMVP-MIP-List.html (214,722 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:43:28

---

## NIST-CMVP-Validated-Modules

- **Reference ID**: NIST-CMVP-Validated-Modules
- **Title**: NIST CMVP Validated Modules Search
- **Authors**: NIST CMVP
- **Publication Date**: 2001-01-01
- **Last Updated**: 2026-04-15
- **Document Status**: Live
- **Main Topic**: The document describes the NIST Cryptographic Module Validation Program (CMVP) database for searching FIPS 140-2 and FIPS 140-3 validated cryptographic modules.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST; Computer Security Resource Center (CSRC); Information Technology Laboratory (ITL)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cryptographic Module Validation Program; Validated Modules
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 140-1; FIPS 140-2; FIPS 140-3
- **Classical Algorithms Referenced**: AES; AES-CBC-CS; CCM; CKG; CVL; DES; DRBG; DSA; ECDSA; ENT; HMAC; KAS; KAS-RSA; KAS-RSA-SSC; KAS-SSC; KBKDF; KDA; KMAC; KTS; PBKDF; PBKDF2; RNG; RSA; RSAEP; SHA; SHA-3; SHS; Skipjack; Triple-DES
- **Key Takeaways**: All questions regarding validated cryptographic modules must be directed to the vendor point of contact; General CMVP inquiries should be sent to [email protected]; Users can search active, historical, or revoked module lists via basic or advanced search types; Modules are validated against FIPS 140-1, FIPS 140-2, or FIPS 140-3 standards; The database includes validation status, embodiment type, and year validated for each module.
- **Security Levels & Parameters**: Level 1; Level 2; Level 3; Level 4
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Developer; Vendor
- **Implementation Prerequisites**: FIPS 140-1 module; FIPS 140-2 module; FIPS 140-3 module; Vendor point of contact identification
- **Relevant PQC Today Features**: Compliance, Assess, Algorithms, vendor-risk
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Validated Modules search; Certificate Number lookup; Module Name search; Validation Status check
- **Testing & Validation Methods**: Cryptographic Module Validation Program; FIPS 140 validation; Third-party lab testing (Acumen Security, ADVANCED DATA SECURITY, AEGISOLVE, Inc., Asia Pacific IT Laboratory, TUV NORD, atsec information security corporation, CyberSecurity Malaysia, Cryptographic Evaluation Laboratory, DEKRA Cybersecurity Certification Laboratory, ECSEC Laboratory Inc., EWA - Canada, Gossamer Security Solutions, IT SECURITY CENTER, Leidos Accredited Testing & Evaluation (AT&E) Lab, Lightship Security, Inc., Penumbra Security, Inc., SERMA SAFETY AND SECURITY, Teron Labs Aspect, BAE SYSTEMS APPLIED INTELLIGENCE, BOOZ ALLEN HAMILTON, BT, CGI Information Systems & Management Consultants Inc, COACT INC, CAFE LAB, CYGNACOM SOLUTIONS INC, DEKRA Testing and Certification S.A.U, DOMUS, DXC Technology, ICSA, LogicaCMG, SAIC-VA, TTC, TUVIT Evaluation Body for IT Security, UL TRANSACTION SECURITY, UL Verification Services, Inc., Underwriters Laboratories, Inc.)
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: ENT; DRBG; RNG
- **Constrained Device & IoT Suitability**: Single Chip; Multi-chip embedded; Multi-chip standalone; Firmware; Hardware; Software
- **Supply Chain & Vendor Risk**: Vendor point of contact required for implementation questions; Third-party lab validation required
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: NIST-CMVP-Validated-Modules.html (51,638 bytes, 4,593 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:46:07

---

## NIST-ACVP

- **Reference ID**: NIST-ACVP
- **Title**: NIST Automated Cryptographic Validation Protocol (ACVP)
- **Authors**: NIST CAVP
- **Publication Date**: 2018-06-01
- **Last Updated**: 2026-03-01
- **Document Status**: Live
- **Main Topic**: The NIST Cryptographic Algorithm Validation Program (CAVP) provides automated testing and validation for approved cryptographic algorithms as a prerequisite for FIPS 140 module validation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Government of Canada
- **Leaders Contributions Mentioned**: Chris Celi - Program Manager - NIST
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Cryptographic Module Validation
- **Standardization Bodies**: NIST; CCCS (Government of Canada)
- **Compliance Frameworks Referenced**: FIPS 140; FIPS 203; FIPS 204; FIPS 205; FIPS 186-4; FIPS 186-2; FIPS 198-1; SP 800-140C; SP 800-140D; SP 800-56A; SP 800-135; SP 800-56B
- **Classical Algorithms Referenced**: AES; Triple DES; Skipjack; CCM; CMAC; GCM; GMAC; XPN; Key Wrap; XTS; DSA; ECDSA; RSA; KBKDF; KAS; HMAC; DRBG; SHA-2; SHA-1; SHA-3; ECC-CDH; KDF; DES; MAC; ANSI X9.17; RNG
- **Key Takeaways**: Algorithm validation is a mandatory prerequisite for cryptographic module validation under FIPS 140; ACVTS testing is entirely black-box and does not require providing the implementation to NIST; Vendors must use NVLAP-accredited laboratories to access the Production ACVTS server for certification; The CAVP generates test vectors matching specific implementation capabilities to ensure correctness and robustness.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Compliance Officer; Security Architect; Testing Laboratories
- **Implementation Prerequisites**: NVLAP-accredited Cryptographic and Security Testing (CST) Laboratory access; FIPS 140 module validation requirements; Algorithm implementation capabilities definition for ACVTS
- **Relevant PQC Today Features**: Compliance, Assess, Algorithms, crypto-agility, tls-basics, pki-workshop, hsm-pqc, vendor-risk, compliance-strategy, migration-program, pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: ACVP/CAVP; KAT vectors; conformance testing; black-box testing; test vector generation
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: DRBG; Random Number Generation
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: NVLAP-accredited Cryptographic and Security Testing (CST) Laboratories; vendor validation lists identifying implementation details
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: NIST-ACVP.html (64,629 bytes, 9,919 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:48:28

---

## IETF-RFC-7030-EST

- **Reference ID**: IETF-RFC-7030-EST
- **Title**: Enrollment over Secure Transport (EST)
- **Authors**: IETF
- **Publication Date**: 2013-10-01
- **Last Updated**: 2013-10-01
- **Document Status**: Published
- **Main Topic**: This document profiles the Enrollment over Secure Transport (EST) protocol for certificate management using CMC messages over TLS and HTTP.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Pritikin, Ed.; P. Yee, Ed.; D. Harkins, Ed.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.1; TLS 1.2; HTTP; HTTPS; CMC; CMP; TCP
- **Infrastructure Layers**: PKI; Certificate Management; Registration Authority (RA) functions
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EST profiles certificate enrollment using CMC messages over a secure transport; The protocol supports both client-generated and CA-generated key pairs; EST operates over HTTPS using HTTP headers and media types in conjunction with TLS; The service performs functions traditionally allocated to the Registration Authority role; Trust anchor distribution can be effected via the EST server but requires out-of-band verification for authenticity.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Operations
- **Implementation Prerequisites**: TLS 1.1 or 1.2 support; HTTP over TCP; CMC message handling capability; Trust anchor configuration (Explicit or Implicit)
- **Relevant PQC Today Features**: pki-workshop, tls-basics, migration-program, crypto-agility, digital-id
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: IETF-RFC-7030-EST.html (166,146 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:50:36

---

## IETF-RFC-4210-CMP

- **Reference ID**: IETF-RFC-4210-CMP
- **Title**: Certificate Management Protocol (CMP)
- **Authors**: IETF
- **Publication Date**: 2005-09-01
- **Last Updated**: 2023-12-01
- **Document Status**: Published
- **Main Topic**: This document specifies the Internet X.509 Public Key Infrastructure Certificate Management Protocol (CMP) for certificate creation and management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: C. Adams, S. Farrell, T. Kause, T. Mononen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMP, X.509v3, Diffie-Hellman
- **Infrastructure Layers**: PKI, Certification Authority, Registration Authority
- **Standardization Bodies**: IETF, Internet Society
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman
- **Key Takeaways**: CMP obsoletes RFC 2510 with updated message profiles and confirmation mechanisms; The protocol supports on-line interactions between PKI components including CAs and client systems; A new implicit confirmation method is introduced to reduce the number of protocol messages exchanged; Proof-of-Possession (POP) structures are defined for signature, encryption, and key agreement keys; Version negotiation is required to support legacy RFC 2510 implementations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: Support for X.509v3 certificates; ASN.1 definitions; Version negotiation for RFC 2510 compatibility
- **Relevant PQC Today Features**: pki-workshop, tls-basics, crypto-agility, migration-program, pqc-risk-management
- **Implementation Attack Surface**: Attack Against Diffie-Hellman Key Exchange
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Obsoletes RFC 2510; Version negotiation required for legacy support; Split of mandatory and optional profiles
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: IETF-RFC-4210-CMP.html (263,449 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:52:31

---

## SecBoulevard-Carielli-CryptoAgility-2025

- **Reference ID**: SecBoulevard-Carielli-CryptoAgility-2025
- **Title**: Forrester (Sandy Carielli) on Cryptoagility: Shared Intel Q&A
- **Authors**: Sandy Carielli (Forrester) / Security Boulevard
- **Publication Date**: 2025-03-15
- **Last Updated**: 2025-03-15
- **Document Status**: Published
- **Main Topic**: Forrester analysts discuss the urgency of cryptoagility and quantum security migration due to harvest now, decrypt later threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later; nation-state actors stockpiling encrypted data
- **Migration Timeline Info**: Cryptographic migration can realistically take three to five years; 1 in 10 probability of quantum attack against RSA-2048 in 5 years; 33% probability in 10 years
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Sandy Carielli (Forrester Principal Analyst); Heidi Shey (Forrester Principal Analyst); Dr. Michele Mosca (author of theorem of quantum risk)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Certificate and key management; data encryption; digital signature; networking infrastructure; authentication; cryptographic agility provider proxies
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-2048
- **Key Takeaways**: Organizations must take a cryptographic inventory of homegrown software, purchased software, devices, and infrastructure immediately; Security leaders should assess vendor cryptoagility efforts and PQC migration plans in RFPs; Cryptoagility allows adapting to algorithm changes without ripping and replacing systems or code; Financial services and government sectors face the highest urgency due to regulations and sensitive data types
- **Security Levels & Parameters**: RSA-2048
- **Hybrid & Transition Approaches**: Cryptoagility; wrapping existing systems in proxies to conduct cryptographic functions at the proxy level
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory of homegrown developed software, purchased software, devices, and supporting infrastructure; vendor PQC migration plans and timelines
- **Relevant PQC Today Features**: crypto-agility; harvest now decrypt later; vendor-risk; pqc-risk-management; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Cryptographic inventory of homegrown developed software, purchased software, devices, and supporting infrastructure
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Assessing technology vendor cryptoagility efforts in RFPs; assessing vendor capability to help in PQC migration; third-party dependencies
- **Deployment & Migration Complexity**: Three to five years for cryptographic migration; planning, piloting, testing involved; pockets of environment where migrating between algorithms will take more time
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Inventorying cryptographic dependencies; upgrading key management; retrofitting security infrastructure; treating cryptoagility as an aspirational goal
- **Source Document**: SecBoulevard-Carielli-CryptoAgility-2025.html (645,468 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:54:31

---

## NIST-FIPS-140-3-IG-Sep-2025-PQC

- **Reference ID**: NIST-FIPS-140-3-IG-Sep-2025-PQC
- **Title**: FIPS 140-3 Implementation Guidance — September 2025 PQC update
- **Authors**: NIST CMVP
- **Publication Date**: 2025-09-02
- **Last Updated**: 2025-09-02
- **Document Status**: Published Update
- **Main Topic**: Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program including self-test requirements for PQC algorithms.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Canada; National Institute of Standards and Technology; Canadian Centre for Cyber Security
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.2
- **Infrastructure Layers**: Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program; Cryptographic and Security Testing Laboratories
- **Standardization Bodies**: National Institute of Standards and Technology; Canadian Centre for Cyber Security; ISO/IEC
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS PUB 140-3; ISO/IEC 24759:2017(E); FIPS 186-5; SP 800-140 series; SP 800-38D; SP 800-38E; SP 800-38G; SP 800-107; SP 800-208; SP 800-90B; SP 800-90A; SP 800-108; SP 800-132; SP 800-56CREV2; SP 800-133; SP 800-67REV2; SP 800-63B
- **Classical Algorithms Referenced**: RSA; Triple-DES; HMAC; AES; XTS-AES; Elliptic Curves; FFC Safe-Prime Groups; Hash Algorithms
- **Key Takeaways**: Self-test requirements for ML-KEM, ML-DSA, and SLH-DSA are added to FIPS 140-3 guidance; Modules validated under prior IG revisions are retroactively affected; Guidance clarifies testing requirements for cryptographic modules based on ISO/IEC 24759:2017(E); Approved security functions include specific parameter sizes and algorithm families defined in referenced standards; Entropy estimation must comply with SP 800-90B requirements.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Developer, Researcher
- **Implementation Prerequisites**: FIPS 140-3 conformance; NVLAP accredited Cryptographic and Security Testing Laboratories; adherence to ISO/IEC 24759:2017(E); SP 800-140 series compliance
- **Relevant PQC Today Features**: Compliance, Algorithms, Migrate, Assess, entropy-randomness
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program; conformance testing; self-tests; pre-operational integrity technique self-test; cryptographic algorithm self-test; periodic self-testing; error logging
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: SP 800-90B; SP 800-90A DRBGs; entropy estimation; post-processing in key generation; combining entropy from multiple sources
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: NIST-FIPS-140-3-IG-Sep-2025-PQC.pdf (2,588,488 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:57:42

---
