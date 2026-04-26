---
enrichment_method: ollama-qwen3.5:27b
generated: 2026-04-13
---

## AERO-001

- **Reference ID**: AERO-001
- **Title**: Aerospace / Aviation
- **Authors**: RTCA DO-326A / DO-356A Airworthiness Security
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: RTCA security standards and training partnerships address airworthiness security processes for aircraft systems with long service lives that rely on classical cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQC
- **Migration Timeline Info**: Aircraft entering service today will operate well beyond CRQC arrival with no practical mid-life cryptographic retrofit path
- **Applicable Regions / Bodies**: Bodies: RTCA, EUROCAE, FAA, EASA, Wichita State University’s National Institute for Aviation Research, ARAC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: RTCA, EUROCAE, FAA, EASA
- **Compliance Frameworks Referenced**: DO-326A, DO-355A, DO-356A, DO-391, DO-392, DO-393, AC119-1, 8900.1, Part IS
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: Aircraft avionics rely on RSA and ECDSA with no practical mid-life cryptographic retrofit path; RTCA DO-326A defines airworthiness security processes for systems with 30-40 year service lives; Security standards must address Intentional Unauthorized Electronic Interaction (IUEI); Organizations need to implement Information Security Event Management processes analogous to Safety Management Systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Policy Maker, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Compliance, Migration-program, pqc-risk-management, iot-ot-pqc
- **Source Document**: AERO-001.html (128,247 bytes, 8,704 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:23:17

---

## AUTO-001

- **Reference ID**: AUTO-001
- **Title**: Automotive / Connected Vehicles
- **Authors**: ISO/SAE 21434 Road Vehicle Cybersecurity
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: ISO/SAE 21434:2021 establishes cybersecurity engineering requirements for road vehicles, addressing the quantum transition risk where V2X systems using ECDSA P-256 may remain vulnerable through 2038.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQCs
- **Migration Timeline Info**: Vehicles produced in 2026 will remain on roads through 2038+ when CRQCs may be operational
- **Applicable Regions / Bodies**: Bodies: UNECE WP.29
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IEEE 1609.2
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: ISO, SAE International
- **Compliance Frameworks Referenced**: UNECE WP.29 regulation on cybersecurity and software updates; ISO 26262
- **Classical Algorithms Referenced**: ECDSA P-256
- **Key Takeaways**: V2X communications currently rely on ECDSA P-256 certificates which are vulnerable to future CRQCs; The 12+ year vehicle lifecycle means 2026 production vehicles will be exposed through 2038+; ISO/SAE 21434 provides a framework for managing cybersecurity risks but is technology-agnostic regarding specific cryptographic solutions; Organizations must align supply chain collaboration to address long-term quantum threats in automotive E/E systems.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, iot-ot-pqc
- **Source Document**: AUTO-004.html (82,417 bytes, 7,934 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:24:32

---

## AUTO-002

- **Reference ID**: AUTO-002
- **Title**: Automotive / Connected Vehicles
- **Authors**: SAE J3061 / ISO/SAE 21434 Vehicle Cybersecurity
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Quantum forgery of OTA firmware update signatures using RSA/ECDSA enables malicious code injection into vehicle ECUs controlling braking, steering, and powertrain systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of update signatures
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: OTA update mechanisms for connected vehicles currently rely on RSA and ECDSA for code signing; Quantum forgery of these signatures allows malicious code injection into critical vehicle systems; Compromised ECUs can control braking, steering, and powertrain functions
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; code-signing; iot-ot-pqc
- **Extraction Note**: No source text available
- **Source Document**: AUTO-002.html (15,025 bytes, no text extracted)
- **Extraction Timestamp**: 2026-04-12T14:25:51

---

## AUTO-004

- **Reference ID**: AUTO-004
- **Title**: Automotive / Connected Vehicles
- **Authors**: ISO/SAE 21434 Road Vehicle Cybersecurity
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: ISO/SAE 21434:2021 defines engineering requirements for cybersecurity risk management across the full lifecycle of road vehicle electrical and electronic systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: UNECE WP.29
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ISO, SAE International
- **Compliance Frameworks Referenced**: UNECE WP.29 regulation on cybersecurity and software updates; ISO 26262
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Mid-lifecycle PQC migration is impractical for vehicles already in production due to constrained crypto-agility; ISO/SAE 21434 covers the full vehicle cybersecurity lifecycle including CAN bus, LIN, FlexRay, and automotive Ethernet; The standard is technology-agnostic and focuses on processes rather than specific tools; Implementing the standard supports compliance with UNECE WP.29 regulatory requirements; Embedded ECUs have limited computational resources impacting security posture.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: compliance-strategy, migration-program, pqc-risk-management, iot-ot-pqc
- **Source Document**: AUTO-004.html (82,417 bytes, 7,934 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:26:34

---

## CLOUD-001

- **Reference ID**: CLOUD-001
- **Title**: Cloud Computing / Data Centers
- **Authors**: Cloud Security Alliance Quantum-Safe Guidelines
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The Cloud Security Alliance Quantum-Safe Security Working Group aims to support the development and deployment of frameworks to protect data in motion and at rest against quantum threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest-now-decrypt-later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Bruno Huttner (Co-Chair, ID Quantique); Mehak Kalsi (Co-Chair, CSA Research Fellow)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key generation and transmission methods; Cloud backup; Disaster recovery
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: Air-gapped backups encrypted with RSA/ECDSA are vulnerable to harvest-now-decrypt-later attacks; Cloud backup data is often retained for 7+ years for compliance, extending the risk window; The CSA Quantum-Safe Security Working Group focuses on protecting data in motion and at rest; Organizations can join the working group to collaborate on quantum-safe frameworks regardless of experience level.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Researcher, Compliance Officer, CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Leaders; Migrate; pqc-risk-management; compliance-strategy
- **Source Document**: CLOUD-002.html (80,670 bytes, 10,540 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:27:46

---

## CLOUD-002

- **Reference ID**: CLOUD-002
- **Title**: Cloud Computing / Data Centers
- **Authors**: Cloud Security Alliance Quantum-Safe Security
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The Cloud Security Alliance Quantum-Safe Security Working Group aims to develop a framework for protecting data in motion and at rest against quantum threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: Cloud Security Alliance
- **Leaders Contributions Mentioned**: Bruno Huttner (Co-Chair, ID Quantique); Mehak Kalsi (Co-Chair, CSA Research Fellow)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Cloud
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Crypto-agility is a critical requirement for cloud deployments; Multi-cloud environments with multiple key management systems face fragmented PQC migration paths; The working group focuses on key generation and transmission methods to protect networks and data.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Researcher, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: crypto-agility, kms-pqc, migration-program, pqc-governance, vendor-risk
- **Source Document**: CLOUD-002.html (80,670 bytes, 10,540 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:28:57

---

## CLOUD-004

- **Reference ID**: CLOUD-004
- **Title**: Cloud Computing / Data Centers
- **Authors**: NIST SP 800-210 Cloud Access Control
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: This document presents cloud access control characteristics and general guidance for IaaS, PaaS, and SaaS service models.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Vincent Hu (NIST); Michaela Iorga (NIST); Wei Bao (University of Arkansas); Ang Li (University of Arkansas); Qinghua Li (University of Arkansas); Antonios Gouglidis (Lancaster University)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud systems; IaaS; PaaS; SaaS
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Access control guidance for lower-level service models applies to higher-level models; Each cloud service model has unique access control requirements; Organizations must manage different types of access based on service delivery models
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: compliance-strategy, cloud-security, access-control
- **Source Document**: CLOUD-004.html (46,016 bytes, 5,121 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:30:02

---

## CROSS-001

- **Reference ID**: CROSS-001
- **Title**: Cross-Industry
- **Authors**: IBM Institute for Business Value — Secure the Post-Quantum Future 2025
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document highlights a significant quantum-safe readiness gap where organizations average 25/100 on the IBM Quantum-Safe Readiness Index and lack complete cryptographic inventories.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Estimated 5-6 year gap between CRQC arrival and organizational readiness completion
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Ray Harishankar, IBM Fellow & Vice President, IBM Quantum Safe; Gregg Barrow, Vice President & Global Offering Leader, Quantum Safe Transformation & Growth, IBM Consulting; Antti Ropponen, Executive Partner, Quantum Safe Transformation and Cyber Defend Services Leader, IBM Consulting; Veena Pureswaran, Research Director, Quantum Computing and Emerging Technologies, IBM Institute for Business Value; Gerald Parham, Global Research Leader, Security & CIO, IBM Institute for Business Value
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations score an average of 25/100 on the IBM Quantum-Safe Readiness Index; 70% of organizations lack a complete cryptographic inventory creating a massive vulnerability window; There is an estimated 5-6 year gap between CRQC arrival and organizational readiness completion
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker
- **Implementation Prerequisites**: Complete cryptographic inventory
- **Relevant PQC Today Features**: Assess, Threats, Timeline, pqc-risk-management, migration-program
- **Source Document**: CROSS-003.html (540,449 bytes, 5,651 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:31:00

---

## CROSS-003

- **Reference ID**: CROSS-003
- **Title**: Cross-Industry
- **Authors**: IBM Institute for Business Value — Secure the Post-Quantum Future 2025
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document highlights a vendor dependency crisis where 62% of organizations incorrectly assume vendors will manage quantum-safe transitions automatically without contractual requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Data at risk as quantum computers become cryptographically relevant; Harvest Now Decrypt Later implied by "secure their data for the quantum era" but not explicitly named as a threat term.
- **Migration Timeline Info**: Originally published 03 October 2025; no specific migration milestones or deadlines stated.
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Ray Harishankar (IBM Fellow & Vice President, IBM Quantum Safe); Gregg Barrow (Vice President & Global Offering Leader, Quantum Safe Transformation & Growth, IBM Consulting); Antti Ropponen (Executive Partner, Quantum Safe Transformation and Cyber Defend Services Leader, IBM Consulting); Veena Pureswaran (Research Director, Quantum Computing and Emerging Technologies, IBM Institute for Business Value); Gerald Parham (Global Research Leader, Security & CIO, IBM Institute for Business Value)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: 62% of organizations incorrectly assume vendors will manage quantum-safe transition automatically; Lack of contractual PQC requirements and service-level agreements for crypto-agility creates risk; Quantum-ready organizations are more likely to embrace ecosystems and accelerate innovation; Data is at risk as quantum computers become cryptographically relevant; Leaders who do not adapt could be years behind
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility mentioned in the context of missing service-level agreements.
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vendor-risk, crypto-agility, pqc-business-case, migration-program, pqc-governance
- **Source Document**: CROSS-003.html (540,449 bytes, 5,651 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:32:08

---

## CROSS-007

- **Reference ID**: CROSS-007
- **Title**: Cross-Industry
- **Authors**: European Commission Digital Strategy — PQC Roadmap
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The European Commission and EU Member States issued a coordinated roadmap establishing milestones for transitioning to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Advanced cyber threats; misuse of quantum technologies posing risks to cybersecurity of communications and connected infrastructure
- **Migration Timeline Info**: By December 2026: national transition roadmaps and initial identification steps; By December 2030: high-risk use cases transitioned and PQC-by-default for new systems; By December 2035: PQC transition completed for as many systems as feasible
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: European Commission, NIS Cooperation Group
- **Leaders Contributions Mentioned**: Henna Virkkunen, Executive Vice-President for Technological Sovereignty, Security and Democracy
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Digital infrastructure; critical infrastructures
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commission's Recommendation published on 11 April 2024
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: All Member States must start transitioning to post-quantum cryptography by the end of 2026; Critical infrastructures must transition to PQC no later than the end of 2030; New systems should adopt PQC-by-default by December 2030; The roadmap responds to the rapid advancement of quantum computer development
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; pqc-governance
- **Source Document**: CROSS-007.html (47,782 bytes, 3,447 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:33:24

---

## CROSS-008

- **Reference ID**: CROSS-008
- **Title**: Cross-Industry
- **Authors**: NIST SP 800-227 Recommendations for KEMs
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: NIST SP 800-227 provides final guidance on definitions, security properties, and implementation recommendations for key-encapsulation mechanisms as a companion to FIPS 203.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Gorjan Alagic (NIST); Elaine Barker (NIST); Lily Chen (NIST); Dustin Moody (NIST); Angela Robinson (NIST); Hamilton Silberg (NIST); Noah Waller (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KEMs establish shared secret keys over public channels for use with symmetric-key algorithms; The document provides definitions and properties of KEMs; Recommendations are provided for secure implementation and usage of KEMs; Best practices cover KEM usage in protocols, hybrid constructions, and key management.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid constructions
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; hybrid-crypto; crypto-agility; pqc-governance; compliance-strategy
- **Source Document**: FIN-004.html (44,321 bytes, 4,431 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:34:30

---

## CRYPTO-002

- **Reference ID**: CRYPTO-002
- **Title**: Cryptocurrency / Blockchain
- **Authors**: Ethereum Foundation PQC Program
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Ethereum roadmap outlines future-proofing strategies including quantum resistance via STARK and lattice-based schemes, alongside EVM simplification efforts like SELFDESTRUCT restrictions and gas calculation overhauls.
- **PQC Algorithms Covered**: STARK-based signing; lattice-based signing
- **Quantum Threats Addressed**: Quantum computers breaking BLS signature scheme; quantum vulnerability of KZG commitment schemes; exposure of public keys on transacted accounts
- **Migration Timeline Info**: Dedicated post-quantum security team established January 2026; full quantum resistance for core protocols may be several years away from implementation
- **Applicable Regions / Bodies**: Bodies: Ethereum Foundation
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BLS signature scheme; KZG commitment schemes; EIP-1559; EIP-6780; EIP-2718; EIP-4844
- **Infrastructure Layers**: Ethereum Virtual Machine (EVM); execution and consensus clients; trusted setups
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: secp256k1 ECDSA; BLS12-381
- **Key Takeaways**: Ethereum accounts with transaction history are quantum-vulnerable due to exposed public keys using secp256k1 and BLS12-381; STARK-based and lattice-based signing are leading research paths for replacing the quantum-vulnerable BLS scheme; KZG commitment schemes currently rely on trusted setups but require long-term quantum-safe replacements; EVM simplification via SELFDESTRUCT restrictions and gas calculation overhauls reduces complexity and vulnerability surface area; full quantum resistance implementation is in the research phase and may take several years
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Trusted setups used to circumvent KZG quantum vulnerability pending long-term quantum safe cryptography incorporation
- **Performance & Size Considerations**: BLS signature scheme noted as very efficient; quantum resistant alternatives noted as not as efficient
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; algorithms; threats; migration-program; code-signing
- **Source Document**: CRYPTO-002.html (302,143 bytes, 6,548 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:35:31

---

## CRYPTO-004

- **Reference ID**: CRYPTO-004
- **Title**: Cryptocurrency / Blockchain
- **Authors**: Cryptocurrency Security Standard (CCSS)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes the CryptoCurrency Security Standard (CCSS) version 9.0, its certification levels, roles for auditors and implementers, and the composition of the CCSS Steering Committee.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: S. Dirk Anderson (CCSS Steering Committee Chair, Founder & Chief Strategist at Imagine Crypto, LLC); Marc Krisjanous (Associate Director of Audit at SixBlocks Audit, conducted first CCSS audit certifying Fireblocks); Jameson Lopp (Co-Founder and Chief Security Officer of Casa); Joshua McDougall (President, Slow Ninja Researcher and Educator); Michael Perklin (Security Expert and Chairman of the Board, C4, drafted CCSS); Ron Stoner (Head of Security at Botanix Labs); Charné van Heerden (Head of Audit at Provenance, CCSS Auditor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: HSM; Key Management
- **Standardization Bodies**: CryptoCurrency Certification Consortium (C4); CCSS Steering Committee
- **Compliance Frameworks Referenced**: ISO 27001:2013; FIPS 140-3
- **Classical Algorithms Referenced**: secp256k1; ECDSA
- **Key Takeaways**: Systems are certified at CCSS Level 1, 2, or 3 rather than entities; Qualified Service Providers (QSPs) meet a subset of requirements while Full Systems meet all applicable requirements; Implementation and audit fees are negotiated directly between the entity and the CCSSI or CCSSA; The standard complements existing frameworks like ISO 27001:2013 but does not replace them; Audits cover the preceding 12-month period and must be performed at least annually.
- **Security Levels & Parameters**: CCSS Level 1; CCSS Level 2; CCSS Level 3
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Auditor; Implementer; CISO
- **Implementation Prerequisites**: Engagement of a Certified CCSS Implementer (CCSSI); Selection of a CryptoCurrency Security Standard Auditor (CCSSA); Production of policies, procedures, diagrams, and evidence; Avoidance of conflict of interest for auditors and implementers.
- **Relevant PQC Today Features**: digital-assets; hsm-pqc; compliance-strategy; migration-program; pqc-risk-management
- **Source Document**: CRYPTO-004.html (216,102 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:36:52

---

## ENERGY-001

- **Reference ID**: ENERGY-001
- **Title**: Energy / Critical Infrastructure
- **Authors**: IEC 62351 Power Systems Security Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The IEC 62351 series specifies security for power system communications using RSA and ECDSA, highlighting quantum vulnerability risks in critical infrastructure with long equipment lifecycles.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum exposure window due to long equipment lifecycles
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: International Electrotechnical Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: DNP3, IEC 61850, IEC 60870-5-104
- **Infrastructure Layers**: Power grid SCADA
- **Standardization Bodies**: International Electrotechnical Commission
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: IEC 62351 relies on RSA and ECDSA for authentication in power systems; Critical infrastructure faces massive quantum exposure due to 20-30 year equipment lifecycles; Limited OTA update capability exacerbates the vulnerability window for SCADA systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, iot-ot-pqc, migration-program, pqc-risk-management
- **Source Document**: ENERGY-001.html (427,968 bytes, 3,804 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:38:45

---

## ENERGY-004

- **Reference ID**: ENERGY-004
- **Title**: Energy / Critical Infrastructure
- **Authors**: IEC 62443 Industrial Automation Security
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines the ISA/IEC 62443 series of standards for securing industrial automation and control systems across critical infrastructure sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: International Society of Automation, International Electrotechnical Commission, United Nations, UNECE, NATO, ISA Global Cybersecurity Alliance
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: International Society of Automation, International Electrotechnical Commission, ISA99 standards committee, IEC Technical Committee 65 Working Group 10
- **Compliance Frameworks Referenced**: ISA/IEC 62443 series, ISASecure Certification schemes (CSA, ICSA, SSA, SDLA)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ISA/IEC 62443 standards define requirements for securing industrial automation and control systems throughout their lifecycle; Shared responsibility among asset owners, suppliers, integrators, and service providers is a founding principle of the standards; ISASecure offers certification schemes to assure conformance to the ISA/IEC 62443 family of cybersecurity standards; The standards apply horizontally across more than 20 different industries including oil and gas, chemicals, and electric power.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Operations, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc, compliance-strategy, migration-program
- **Source Document**: IOT-002.html (92,814 bytes, 11,641 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:39:50

---

## FIN-004

- **Reference ID**: FIN-004
- **Title**: Financial Services / Banking
- **Authors**: NIST SP 800-227 KEM Recommendations
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: NIST SP 800-227 provides formal definitions, properties, and recommendations for implementing Key-Encapsulation Mechanisms (KEMs) to securely establish shared secret keys.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Gorjan Alagic (NIST); Elaine Barker (NIST); Lily Chen (NIST); Dustin Moody (NIST); Angela Robinson (NIST); Hamilton Silberg (NIST); Noah Waller (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KEMs enable two parties to securely establish a shared secret key over a public channel; Shared secret keys from KEMs are used with symmetric-key algorithms for encryption and authentication; The document provides recommendations for implementing and using KEMs in a secure manner.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Compliance; Migrate; pqc-101; key-management
- **Source Document**: FIN-004.html (44,321 bytes, 4,431 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:41:18

---

## FIN-005

- **Reference ID**: FIN-005
- **Title**: Financial Services / Banking
- **Authors**: FS-ISAC — The Timeline for Post Quantum Cryptographic Migration
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: FS-ISAC warns financial sector organizations of roadmap collapse by 2030 due to lack of defined resources and urges global coordination for post-quantum cryptographic migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum computing's ability to break current encryption algorithms; crypto-procrastination risks
- **Migration Timeline Info**: 2030 compliance deadlines; roadmap collapse likely without immediate action
- **Applicable Regions / Bodies**: Regions: Americas, Europe; Bodies: FS-ISAC, Quantum Safe Financial Forum (QSFF), CFDIR Quantum-Readiness Working Group, NSA
- **Leaders Contributions Mentioned**: Mike Silverman (Chief Strategy and Innovation Officer, FS-ISAC); Dr. Michele Mosca (co-founder and professor at the Institute for Quantum Computing, University of Waterloo, Chair of the CFDIR Quantum-Readiness Working Group, CEO, evolutionQ); Jaime Gómez García (Banco Santander, QSFF); Peter Bordow (FS-ISAC PQC Workgroup Chair and Distinguished Engineer & Managing Director of Quantum Security, Wells Fargo)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: payment networks; cloud service providers
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial sector organizations must define and allocate resources immediately to avoid roadmap collapse by 2030; Sector-wide coordination is required to mitigate interdependencies across payment networks and cloud providers; Migration should follow a phased framework starting with high-risk use cases; Industry-aligned action plans are necessary to support a proactive transition measured by defined milestones
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Phased Transition Framework; global transition timeline; synchronized planning
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Establish a focused transition program; identify all relevant stakeholders; remediate high- and medium-risk use cases
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Leaders, migration-program, pqc-governance, vendor-risk
- **Source Document**: FIN-005.html (48,653 bytes, 5,804 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:42:17

---

## GOV-004

- **Reference ID**: GOV-004
- **Title**: Government / Defense
- **Authors**: Federal PKI Policy Authority
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines Federal Public Key Infrastructure (FPKI) governance, policies, annual review requirements, and compliance tools for U.S. federal agencies and affiliates.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: General Services Administration (GSA), Federal PKI Policy Authority (FPKIPA), Federal PKI Management Authority (FPKIMA)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, TLS, SSH
- **Infrastructure Layers**: PKI, Cloud PKI, Certification Authorities (CA), Registration Authority (RA)
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 201, NIST Special Publication 800-53 Revision 5, NIST SP 800-73, X.509 Certificate Policy
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Annual compliance audits are mandatory for all FPKI participating entities; Cloud PKI designs must meet equivalent control guidance defined by the CPWG Tiger Team; Incident reporting requires contacting both fpki@gsa.gov and fpki-help@gsa.gov; Test artifacts including Card Conformance Tool logs must be submitted to fips201ep@gsa.gov for annual reviews.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Program Manager, Security Architect, Auditor
- **Implementation Prerequisites**: Java tool hosted on GitHub (Card Conformance Tool); Self-hosted Certificate Profile Conformance Tool; KSJavaAPI; Annual PIV Credential Issuer Testing Application Form
- **Relevant PQC Today Features**: pki-workshop, compliance-strategy, migration-program, pqc-governance, digital-id
- **Source Document**: GOV-004.html (154,577 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:43:37

---

## HLTH-002

- **Reference ID**: HLTH-002
- **Title**: Healthcare / Pharmaceutical
- **Authors**: Thales 2025 Data Threat Report Healthcare Edition
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The 2025 Thales Data Threat Report highlights low cloud encryption rates in healthcare and the urgent need for post-quantum readiness despite ongoing prototyping.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL)
- **Migration Timeline Info**: Deployment timelines are tight; organizations must start planning today as post-quantum is projected to be a few years away.
- **Applicable Regions / Bodies**: Regions: 20 countries (global survey); Bodies: HHS OCR, FDA/DEA, NIST, CISA, Singapore MAS
- **Leaders Contributions Mentioned**: Todd Moore, Global Vice President, Data Security Products at Thales
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud encryption, Hardware Security Modules (HSMs), Key Management, PKI
- **Standardization Bodies**: NIST, ISO, Singapore MAS
- **Compliance Frameworks Referenced**: HIPAA, FIPS 140-2, FIPS 140-3, FDA/DEA - EPCS, FedRamp, FISMA, NIST 800-53 Revision 4, NIST CSF 2.0, ISO 27799:2016, ISO/IEC 27001:2022, ISO/IEC 27002:2013
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Only 4% of healthcare operators have encrypted 80% or more of sensitive cloud data; 59% of organizations are prototyping or evaluating PQC but actual deployment remains low; Health records retain lifetime sensitivity making them prime targets for Harvest Now Decrypt Later attacks; Three out of five organizations are already prototyping new ciphers but face tight deployment timelines.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 725 major breaches in 2023 exposed 168M+ individuals; 4% of organizations encrypted 80%+ of sensitive cloud data; 59% prototyping or evaluating PQC.
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Assess, Leaders, compliance-strategy, migration-program, pqc-risk-management
- **Source Document**: HLTH-002.html (247,319 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:45:15

---

## HLTH-003

- **Reference ID**: HLTH-003
- **Title**: Healthcare / Pharmaceutical
- **Authors**: FDA Premarket Cybersecurity Guidance 2023
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: FDA guidance on cybersecurity risk assessment and Software Bill of Materials requirements for medical device premarket submissions under Section 524B of the FD&C Act.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQC era
- **Migration Timeline Info**: Medical devices with 10-20 year lifecycles deploying now will operate into the CRQC era
- **Applicable Regions / Bodies**: United States; Food and Drug Administration; Center for Devices and Radiological Health; Center for Biologics Evaluation and Research
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Section 524B of the FD&C Act; Consolidated Appropriations Act 2023; 21 CFR 10.115(g)(5)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: FDA requires cryptographic risk assessment for new device submissions; Software Bill of Materials must be included in premarket submissions; Medical devices with long lifecycles will operate into the CRQC era; Guidance supersedes previous June 27, 2025 document
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Industry; FDA Staff; Medical Device Manufacturers
- **Implementation Prerequisites**: Cryptographic risk assessment; Software Bill of Materials; documentation for premarket submissions
- **Relevant PQC Today Features**: Compliance, Threats, Assess, pqc-risk-management, iot-ot-pqc
- **Source Document**: HLTH-003.html (36,115 bytes, 3,884 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:47:04

---

## HLTH-004

- **Reference ID**: HLTH-004
- **Title**: Healthcare / Pharmaceutical
- **Authors**: FDA Cybersecurity for Medical Devices
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: FDA guidance and regulatory updates regarding cybersecurity risks in connected medical devices, including legislative mandates under Section 524B of the FD&C Act.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQC era
- **Migration Timeline Info**: Devices with 10-20 year lifecycles deployed today will operate well into the CRQC era; Section 524B of the FD&C Act took effect on March 29, 2023.
- **Applicable Regions / Bodies**: United States; FDA; Consolidated Appropriations Act, 2023; Federal Food, Drug, and Cosmetic Act (FD&C Act)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: Section 524B of the FD&C Act; Consolidated Appropriations Act, 2023; Presidential Executive Order on Improving the Cybersecurity of the Federal Government (EO 14028)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Medical devices with long lifecycles face quantum exposure as they will operate into the CRQC era; FDA Section 524B mandates cybersecurity requirements for medical device premarket submissions; Manufacturers and health care delivery organizations share responsibility for mitigating cybersecurity risks to ensure patient safety; Limited computational resources in implantable devices restrict available security options.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 10-20 year device lifecycles; limited computational resources and power constraints in implantable devices
- **Target Audience**: Medical Device Manufacturers, Health Care Delivery Organizations, Clinicians, Patients, Compliance Officer, Security Architect
- **Implementation Prerequisites**: Cybersecurity risk identification and hazard analysis; network security evaluation for hospital systems; threat modeling processes; SBOM processing; digital certificate management
- **Relevant PQC Today Features**: Threats, Compliance, iot-ot-pqc, pqc-risk-management, migration-program
- **Source Document**: HLTH-004.html (96,735 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:48:07

---

## HLTH-005

- **Reference ID**: HLTH-005
- **Title**: Healthcare / Pharmaceutical
- **Authors**: FDA Drug Supply Chain Security Act (DSCSA)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The Drug Supply Chain Security Act (DSCSA) mandates product serialization and verification to prevent counterfeit drug infiltration in the U.S. supply chain.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of verification responses enables counterfeit drug injection into the legitimate supply chain
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: FDA, HHS
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI (implied by digital signatures and verification systems)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Drug Supply Chain Security Act (DSCSA)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: DSCSA mandates product serialization and verification to prevent counterfeit drug infiltration; EPCIS and verification systems rely on digital signatures and TLS; Quantum forgery of verification responses enables counterfeit drug injection into the legitimate supply chain; The act outlines steps to achieve an interoperable and electronic way to identify and trace prescription drugs at the package level
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Policy Maker, Industry Health Professionals
- **Implementation Prerequisites**: Product serialization; Electronic tracing systems; Digital signatures; TLS encryption; 24-hour notification for illegitimate products
- **Relevant PQC Today Features**: Threats, Compliance, Migrate, Assess, pqc-risk-management
- **Source Document**: HLTH-005.html (46,772 bytes, 4,234 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:49:41

---

## INS-001

- **Reference ID**: INS-001
- **Title**: Insurance
- **Authors**: NAIC Insurance Data Security Model Law (MDL-668)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The NAIC Insurance Data Security Model Law (MDL-668) establishes standards for data security programs, risk assessments, and cybersecurity event notifications for insurance licensees.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Association of Insurance Commissioners
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Information Systems; Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: N.Y. Comp. Codes R. & Regs. tit.23, § 500
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Licensees must develop a comprehensive written Information Security Program based on a Risk Assessment; Encryption is required for Nonpublic Information in transit over external networks and at rest on portable devices; Boards of Directors must receive annual written reports on the status of the Information Security Program; Third-Party Service Providers must be vetted and required to implement appropriate security measures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, CISO, Security Architect
- **Implementation Prerequisites**: Conduct a Risk Assessment; Designate employees or vendors responsible for the Information Security Program; Implement Multi-Factor Authentication; Provide cybersecurity awareness training.
- **Relevant PQC Today Features**: Threats, Compliance, Assess, data-asset-sensitivity, vendor-risk
- **Source Document**: INS-001.pdf (238,211 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:50:41

---

## INS-002

- **Reference ID**: INS-002
- **Title**: Insurance
- **Authors**: NY DFS Cybersecurity Regulation (23 NYCRR 500)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines New York DFS Cybersecurity Regulation 23 NYCRR Part 500, noting a quantum gap where long-retention insurance records are vulnerable to Harvest Now Decrypt Later attacks despite the regulation not yet addressing post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: New York; Bodies: Department of Financial Services
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: 23 NYCRR Part 500
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Life insurance and annuity records with 50+ year retention periods are prime targets for Harvest Now Decrypt Later attacks; The current DFS Cybersecurity Regulation does not yet address post-quantum cryptography; Covered entities must comply with encryption requirements under Part 500 effective November 1, 2023; Organizations have phased compliance deadlines ranging from 180 days to two years depending on the requirement.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, CISO, Security Architect
- **Implementation Prerequisites**: DFS ID credentials; Multi-factor authentication (MFA); Authenticator app (e.g., Google or Microsoft Authenticator)
- **Relevant PQC Today Features**: Threats, Compliance, pqc-risk-management, data-asset-sensitivity
- **Source Document**: INS-002.html (205,310 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:52:06

---

## INS-003

- **Reference ID**: INS-003
- **Title**: Insurance
- **Authors**: Geneva Association Systemic Cyber Risk Research
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The Geneva Association research identifies systemic cyber risks including quantum threats to the insurance sector, highlighting vulnerabilities in long-duration life insurance and pension records.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum threats to insurance industry managing multi-decade policy data; vulnerability of reinsurance treaties to data manipulation
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Ariel Levite; Paweł Surówka, CEO, PZU SA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Life insurance and pension records retain sensitivity for 50+ years making them vulnerable to quantum threats; Reinsurance treaties with multi-year duration are susceptible to data manipulation; Insurance is identified as a powerful safeguard against rising cyber threats; Financial innovations like cyber Cat bonds can help address the cyber protection gap
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, CISO, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, data-asset-sensitivity, pqc-business-case, pqc-risk-management
- **Source Document**: INS-003.html (95,894 bytes, 4,451 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:53:35

---

## IOT-002

- **Reference ID**: IOT-002
- **Title**: Internet of Things (IoT)
- **Authors**: IEC 62443 Industrial Automation Security
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines the ISA/IEC 62443 series of standards for securing industrial automation and control systems, highlighting stakeholder responsibilities and certification programs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: International Society of Automation, International Electrotechnical Commission, United Nations, UNECE, NATO
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: International Society of Automation, International Electrotechnical Commission, ISA99 standards committee, IEC Technical Committee 65 Working Group 10
- **Compliance Frameworks Referenced**: ISA/IEC 62443 series, ISASecure Certification schemes (CSA, ICSA, SSA, SDLA)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The ISA/IEC 62443 standards define a holistic approach bridging operations and information technology for industrial automation security; Shared responsibility among asset owners, suppliers, integrators, and service providers is a founding principle of the standards; ISASecure offers certification schemes to assure conformance to the ISA/IEC 62443 family of cybersecurity standards; The standards apply to all industry sectors using IACS including building automation, electric power, medical devices, and process industries
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Operations, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc, compliance-strategy, migration-program
- **Source Document**: IOT-002.html (92,814 bytes, 11,641 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:54:36

---

## IOT-003

- **Reference ID**: IOT-003
- **Title**: Internet of Things (IoT)
- **Authors**: IETF SUIT Working Group (RFC 9019)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The IETF SUIT working group defines firmware update architecture with COSE-based manifest signing, highlighting a security gap where constrained IoT devices cannot support full PQC signature verification during migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Deb Cooley; Akira Tsukamoto; Roman Danyliw; Russ Housley; Jacqueline McCall; Dave Thaler; Thomas Fossati
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SUIT; COSE
- **Infrastructure Layers**: Firmware update architecture; Manifest signing
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA; EdDSA
- **Key Takeaways**: Constrained IoT devices (Class 1-3) cannot support full PQC signature verification creating a security gap during migration; SUIT architecture uses COSE-based manifest signing for firmware authentication; Firmware update security relies on RFC 9019 and related drafts for serialization and encryption.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Support for COSE-based manifest signing; Firmware update architecture per RFC 9019
- **Relevant PQC Today Features**: iot-ot-pqc; code-signing; migration-program
- **Source Document**: IOT-003.html (63,963 bytes, 5,871 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:55:59

---

## IOT-004

- **Reference ID**: IOT-004
- **Title**: Internet of Things (IoT)
- **Authors**: ISO/IEC 30182 Smart City Concept Model
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: ISO/IEC 30182:2017 provides guidance on a smart city concept model to establish data interoperability by aligning ontologies across different sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ISO/IEC JTC 1
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The standard defines a smart city concept model to align ontologies for data interoperability; It maps local models to a parent model to enable joined-up data queries; It focuses on semantic interoperability rather than metadata validity or provenance; It does not cover specific data standards or identifier sources for the concepts defined.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Decision-makers, Policy developers, Organizations providing services to communities in cities
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc
- **Source Document**: IOT-004.html (71,399 bytes, 6,198 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:57:01

---

## IT-001

- **Reference ID**: IT-001
- **Title**: IT Industry / Software
- **Authors**: OpenSSL PQC Integration
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: OpenSSL 3.5 final release introduces support for PQC algorithms ML-KEM, ML-DSA, and SLH-DSA alongside hybrid key exchange capabilities.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: OpenSSL 3.5 supported until April 8, 2030; OpenSSL 3.0 fully supported until September 7, 2025 with security fixes until September 7, 2026; OpenSSL 3.6 release in October 2025
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: OpenSSL 3.5, Libsodium
- **Protocols Covered**: TLS, QUIC (RFC 9000), CMP
- **Infrastructure Layers**: Key Management, PKI
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: X25519
- **Key Takeaways**: OpenSSL 3.5 enables PQC integration with ML-KEM, ML-DSA, and SLH-DSA support; Hybrid key exchange X25519MLKEM768 is available in TLS configurations; Organizations should migrate from OpenSSL 3.0 to 3.5 before September 2025; Libsodium and other libraries lag behind creating dependency risks during PQC transition
- **Security Levels & Parameters**: ML-KEM-768, X25519MLKEM768
- **Hybrid & Transition Approaches**: X25519MLKEM768 hybrid key exchange
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Operations
- **Implementation Prerequisites**: OpenSSL 3.5; OpenSSL 3.0 migration path; FIPS provider configuration for JITTER seed source
- **Relevant PQC Today Features**: Algorithms, Migrate, hybrid-crypto, tls-basics, code-signing
- **Source Document**: IT-001.html (34,492 bytes, 2,720 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:58:04

---

## IT-002

- **Reference ID**: IT-002
- **Title**: IT Industry / Software
- **Authors**: CA/Browser Forum PKI Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The CA/Browser Forum coordinates the migration of the global WebPKI trust hierarchy to post-quantum algorithms, including hybrid key exchange implementations in browsers and root CA key updates.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: CA/Browser Forum; Regions: None detected
- **Leaders Contributions Mentioned**: Stephen Davidson (DigiCert) proposed ballot SMC015v2; Ben Wilson (Mozilla) and Scott Rea (eMudhra) endorsed the ballot.
- **PQC Products Mentioned**: Chrome; Firefox
- **Protocols Covered**: TLS; ISO/IEC 18013-5; ISO/IEC 18013-7
- **Infrastructure Layers**: PKI; Certificate Authority; Trust store
- **Standardization Bodies**: CA/Browser Forum; ISO/IEC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: X25519
- **Key Takeaways**: Chrome and Firefox have shipped ML-KEM hybrid key exchange combining X25519 and ML-KEM-768; Root CA key migration requires coordinated trust store updates across major browsers and operating systems; The CA/Browser Forum must coordinate the global WebPKI trust hierarchy migration to post-quantum algorithms.
- **Security Levels & Parameters**: ML-KEM-768
- **Hybrid & Transition Approaches**: Hybrid key exchange (X25519+ML-KEM-768); Coordinated trust store updates
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pki-workshop; hybrid-crypto; tls-basics; migration-program; code-signing
- **Source Document**: IT-002.html (43,672 bytes, 9,529 extracted chars)
- **Extraction Timestamp**: 2026-04-12T14:59:14

---

## IT-004

- **Reference ID**: IT-004
- **Title**: IT Industry / Software
- **Authors**: SLSA Supply Chain Security Framework (OpenSSF)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The SLSA specification defines supply chain security levels and attestation formats to protect software artifacts, with a noted vulnerability where quantum forgery of code signatures enables malicious package injection.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of code signatures; malicious package injection at scale
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: CI/CD pipelines; open source repositories; package managers
- **Standardization Bodies**: The Linux Foundation
- **Compliance Frameworks Referenced**: SLSA (Supply-chain Levels for Software Artifacts)
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: Code signing using RSA and ECDSA is a critical trust anchor in the software supply chain; Quantum forgery of code signatures poses a risk of malicious package injection at scale; The SLSA framework identifies signing as essential for verifying artifacts and build platforms; Organizations must address quantum vulnerabilities in open source repositories and CI/CD pipelines
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer; Infrastructure Provider
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: code-signing, threats, supply-chain-security, crypto-agility, pki-workshop
- **Source Document**: IT-004.html (16,564 bytes, 1,499 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:00:46

---

## IT-005

- **Reference ID**: IT-005
- **Title**: IT Industry / Software
- **Authors**: FIDO Alliance PQC Roadmap
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The FIDO Alliance is addressing quantum computing impacts on its specifications to ensure a seamless transition to PQC algorithms for authentication systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Impact of quantum computing on cryptographic algorithms and protocols
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, SAML, OAuth, OIDC, FIDO2, WebAuthn
- **Infrastructure Layers**: PKI, Authentication infrastructure
- **Standardization Bodies**: FIDO Alliance
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Enterprise authentication systems rely on quantum-vulnerable PKI; FIDO Alliance has published a PQC roadmap for WebAuthn migration; Migration requires coordinated ecosystem updates; The Alliance is working to retain long-term value of products based on its specifications; A seamless transition from current algorithms to PQC is the goal
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Seamless transition from current cryptographic algorithms to new PQC algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker
- **Implementation Prerequisites**: Coordinated ecosystem updates; FIDO-enabled products and solutions
- **Relevant PQC Today Features**: digital-id, migration-program, pqc-risk-management, compliance-strategy, pki-workshop
- **Source Document**: IT-005.html (258,129 bytes, 4,821 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:01:38

---

## LEG-001

- **Reference ID**: LEG-001
- **Title**: Legal / Notary / eSignature
- **Authors**: EU Regulation 910/2014 (eIDAS)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document highlights the vulnerability of eIDAS long-term signatures to quantum forgery, threatening the legal validity of documents requiring 50-100+ year retention.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum signature forgery
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: EU member states; Bodies: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: EU Regulation 910/2014 Article 25(2)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Quantum signature forgery poses a retroactive threat to legally binding documents; Property deeds and notarial acts require validity periods of 50-100+ years; EU Regulation 910/2014 grants qualified electronic signatures legal equivalence to handwritten signatures across 27 member states
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Policy Maker; Legal Professional
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Compliance; digital-id; pqc-risk-management
- **Extraction Note**: No source text available
- **Source Document**: LEG-001.html (2,035 bytes, no text extracted)
- **Extraction Timestamp**: 2026-04-12T15:02:36

---

## LEG-002

- **Reference ID**: LEG-002
- **Title**: Legal / Notary / eSignature
- **Authors**: EU Regulation 2024/1183 (eIDAS 2.0)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Regulation 2024/1183 amends eIDAS to mandate European Digital Identity Wallets relying on RSA and ECDSA, creating quantum risk.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: EU member states; Bodies: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Regulation 2024/1183; eIDAS
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: European Digital Identity Wallets are mandated for all EU member states under Regulation 2024/1183; Current wallet authentication protocols rely on RSA and ECDSA which face quantum risk; Qualified electronic attestations of attributes must be supported by these wallets.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-id; compliance; threats
- **Extraction Note**: No source text available
- **Source Document**: LEG-002.html (2,035 bytes, no text extracted)
- **Extraction Timestamp**: 2026-04-12T15:03:22

---

## LEG-003

- **Reference ID**: LEG-003
- **Title**: Legal / Notary / eSignature
- **Authors**: ETSI EN 319 422 Qualified Timestamp Policy
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: ETSI EN 319 422 defines a profile for the time-stamping protocol and time-stamp token under the eIDAS framework using IETF RFC 3161.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: ETSI, European Parliament and of the Council
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IETF RFC 3161, HTTP/1.1, HTTP Over TLS
- **Infrastructure Layers**: PKI, Trust Service Providers
- **Standardization Bodies**: ETSI, IETF
- **Compliance Frameworks Referenced**: Regulation (EU) No 910/2014
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines constraints for time-stamping clients and servers to ensure trust in electronic transactions; Time-stamping is critical for verifying digital signature validity periods; Qualified time-stamps must comply with Regulation (EU) No 910/2014; The standard limits options of IETF RFC 3161 by specifying supported fields and algorithms; Time-stamp validation is explicitly out of scope and defined in ETSI EN 319 102.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Developer
- **Implementation Prerequisites**: Support for IETF RFC 3161; Support for optional ESSCertIDv2 update in IETF RFC 5816; Adherence to Regulation (EU) No 910/2014 for qualified electronic time-stamps
- **Relevant PQC Today Features**: Compliance, digital-id, pki-workshop, code-signing
- **Source Document**: LEG-003.pdf (70,119 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:04:07

---

## LEG-004

- **Reference ID**: LEG-004
- **Title**: Legal / Notary / eSignature
- **Authors**: NIST SP 800-86 Guide to Integrating Forensic Techniques
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: This publication provides practical guidance on performing computer and network forensics for incident response and IT operational troubleshooting from an IT perspective.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Karen Kent (NIST); Suzanne Chevalier (BAH); Tim Grance (NIST); Hung Dang (BAH)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FISMA; Federal Information Security Modernization Act
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should consult management and legal counsel before applying forensic practices; Forensic guidance is intended for IT views rather than law enforcement views; The publication covers data sources including files, operating systems, network traffic, and applications; Readers must ensure compliance with local, state, Federal, and international laws.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Researcher; Operations
- **Implementation Prerequisites**: Consultation with management; Consultation with legal counsel; Compliance check for local, state, Federal, and international laws
- **Relevant PQC Today Features**: compliance-strategy, pqc-risk-management, migration-program
- **Source Document**: LEG-004.html (46,077 bytes, 5,559 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:05:43

---

## MEDIA-001

- **Reference ID**: MEDIA-001
- **Title**: Media / Entertainment / DRM
- **Authors**: AACS Licensing Administrator Specifications
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines AACS specifications and highlights the risk of harvesting master encryption keys today to decrypt studio content libraries once CRQCs arrive.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQCs; Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: AACS LA, LLC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA
- **Key Takeaways**: Master encryption keys harvested today enable future mass decryption of studio catalogs; AACS protects Blu-ray and UHD content using an RSA key hierarchy; Studio content libraries possess indefinite commercial value; CRQCs pose a risk to current content protection systems.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Source Document**: MEDIA-002.html (33,944 bytes, 2,210 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:06:42

---

## MEDIA-002

- **Reference ID**: MEDIA-002
- **Title**: Media / Entertainment / DRM
- **Authors**: AACS / Content Protection Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document lists AACS specification books and interim versions for various video formats including Blu-ray, HD DVD, and DVD.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: AACS LA, LLC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: AACS specifications for HD DVD and CBHD have been removed from the website due to inactivity; Removed specification books are available by contacting Admin@AACSLA.com; The document provides download links for various AACS specification revisions posted between 2008 and 2017
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: compliance-strategy, migration-program, pqc-risk-management
- **Source Document**: MEDIA-002.html (33,944 bytes, 2,210 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:07:31

---

## MEDIA-003

- **Reference ID**: MEDIA-003
- **Title**: Media / Entertainment / DRM
- **Authors**: DVB Project — Conditional Access System Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes DVB Conditional Access systems, Common Scrambling Algorithms, and CI Plus specifications used to secure pay-TV content distribution against unauthorized access.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: DVB Project, CI Plus LLP
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: DVB Project, CI Plus LLP
- **Compliance Frameworks Referenced**: European Directive
- **Classical Algorithms Referenced**: RSA, ECDSA, AES, XRC
- **Key Takeaways**: DVB Conditional Access systems currently rely on RSA and ECDSA for Entitlement Control Messages; Set-top boxes and smart TVs have 7-10 year lifecycles limiting crypto-agility; CI Plus mandates mutual authentication and link encryption between CAM and host in Europe; CSA3 utilizes a combination of 128-bit AES and the confidential XRC block cipher; DVB-CI USB form factor reduces hardware costs compared to legacy PCMCIA slots.
- **Security Levels & Parameters**: 128-bit AES
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: crypto-agility, tls-basics, pki-workshop, migration-program, pqc-risk-management
- **Source Document**: MEDIA-003.html (91,366 bytes, 7,481 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:08:20

---

## PCI-001

- **Reference ID**: PCI-001
- **Title**: Payment Card Industry
- **Authors**: EMVCo Book 2 Security and Key Management
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: EMVCo specifications rely exclusively on RSA for offline card authentication, creating a quantum vulnerability that could allow forgery of signatures on approximately 14.7 billion EMV chip cards globally by end 2024.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of RSA signatures enabling counterfeit card acceptance at offline-capable terminals
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: EMVCo; Regions: Global (implied by "globally" in text regarding card circulation)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: EMVCo
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA
- **Key Takeaways**: EMVCo specifications currently use RSA as the only approved asymmetric algorithm for offline card authentication; Approximately 14.7 billion EMV chip cards are in circulation globally as of end 2024; Quantum forgery of RSA signatures enables counterfeit card acceptance at any offline-capable terminal; Offline card authentication (CDA/DDA) is vulnerable to quantum attacks due to reliance on RSA
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Algorithms, Assess, pqc-risk-management, migration-program
- **Source Document**: PCI-001.html (186,293 bytes, 8,522 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:09:25

---

## PCI-002

- **Reference ID**: PCI-002
- **Title**: Payment Card Industry
- **Authors**: PCI Security Standards Council DSS 4.0.1
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document highlights a cryptographic gap in PCI DSS 4.0.1 where strong cryptography is required but post-quantum algorithms are not yet mandated, leaving organizations potentially quantum-vulnerable despite compliance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: PCI Security Standards Council; Regions: Brazil, India-South Asia
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Hardware Security Module (HSM)
- **Standardization Bodies**: PCI Security Standards Council
- **Compliance Frameworks Referenced**: PCI Data Security Standard (PCI DSS), Point-to-Point Encryption (P2PE), Secure Software Lifecycle (Secure SLC), Payment Application Data Security Standard (PA-DSS)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations meeting current PCI compliance may still be quantum-vulnerable; Cryptographic inventory requirements in Req 3/4 do not address PQC readiness assessment; PCI DSS requires strong cryptography but does not yet mandate post-quantum algorithms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, CISO
- **Implementation Prerequisites**: Cryptographic inventory; PQC readiness assessment
- **Relevant PQC Today Features**: Compliance, Assess, pqc-risk-management, migration-program, compliance-strategy
- **Source Document**: RETAIL-001.html (634,634 bytes, 5,480 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:10:34

---

## PCI-003

- **Reference ID**: PCI-003
- **Title**: Payment Card Industry
- **Authors**: PCI PIN Security Requirements
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes quantum vulnerabilities in PIN block encryption within the Payment Card Industry, specifically targeting RSA-based key injection ceremonies and proposing AES-256 DUKPT as a quantum-resistant alternative requiring hardware replacement.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of RSA key transport enabling malicious key injection at scale
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: PCI Security Standards Council, LLC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Injection Facilities (KIFs); Point of Interaction (POI) terminals; Hardware Security Module (HSM)
- **Standardization Bodies**: PCI Security Standards Council, LLC
- **Compliance Frameworks Referenced**: PCI Data Security Standard (PCI DSS); Point-to-Point Encryption (P2PE); Secure Software Lifecycle (Secure SLC); Payment Application Data Security Standard (PA-DSS)
- **Classical Algorithms Referenced**: 3DES; RSA; AES-256
- **Key Takeaways**: PIN encryption at scale relies on 3DES DUKPT with a quantum attack surface in RSA-based key injection ceremonies; Quantum forgery of RSA key transport enables malicious key injection at scale; AES-256 DUKPT provides a quantum-resistant symmetric alternative; Terminal hardware replacement is required at massive scale to implement the quantum-resistant alternative
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Operations
- **Implementation Prerequisites**: Terminal hardware replacement at massive scale
- **Relevant PQC Today Features**: Threats, Migrate, Algorithms, hsm-pqc, compliance-strategy
- **Source Document**: RETAIL-001.html (634,634 bytes, 5,480 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:11:35

---

## RAIL-001

- **Reference ID**: RAIL-001
- **Title**: Rail / Transit
- **Authors**: EN 50159 Railway Communication Security / ERA
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes the European Rail Traffic Management System (ERTMS) and its components, including ETCS and GSM-R, while noting a description of quantum vulnerability in railway signaling authentication.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum compromise of signaling authentication enabling unauthorized train movements
- **Migration Timeline Info**: Signaling infrastructure has 25-40 year lifecycles with limited upgrade paths
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: European Union Agency for Railways, European Commission, National Safety Authorities, National Investigation Bodies
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: GSM-R, FRMCS, ETCS
- **Infrastructure Layers**: Railway signaling system, communication layer, train control system
- **Standardization Bodies**: European Union Agency for Railways
- **Compliance Frameworks Referenced**: EN 50159, Control Command and Signalling TSI, Operation and Traffic Management TSI
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Railway signaling systems face quantum vulnerability in cryptographic authentication; Infrastructure lifecycles of 25-40 years limit upgrade paths for security; EN 50159 governs safety-related communication in railway systems; Quantum compromise could enable unauthorized train movements; ERTMS ensures interoperability across national railway systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Backwards and forwards compatibility of ETCS baselines
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migration-program, iot-ot-pqc, 5g-security, pqc-risk-management
- **Source Document**: RAIL-001.html (60,957 bytes, 7,128 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:12:43

---

## RAIL-002

- **Reference ID**: RAIL-002
- **Title**: Rail / Transit
- **Authors**: ISO/IEC 14443 Contactless Card Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: ISO/IEC 14443-3:2018 defines initialization, anticollision, and communication protocols for contactless proximity cards (PICCs) and devices (PCDs).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ISO/IEC 14443-3, ISO/IEC 14443-4, ISO/IEC 14443-2, ISO/IEC 10373-6
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ISO, ISO/IEC JTC 1/SC 17
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The standard covers initialization and anticollision for contactless proximity objects; It applies to PICCs of Type A and Type B as well as PCDs and PXDs; Higher layer protocols are described in ISO/IEC 14443-4; The standard is scheduled for revision with a new DIS expected soon; Test methods are defined in ISO/IEC 10373-6
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-id, iot-ot-pqc, pki-workshop
- **Source Document**: RAIL-002.html (76,773 bytes, 6,782 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:13:54

---

## RETAIL-001

- **Reference ID**: RETAIL-001
- **Title**: Retail / E-Commerce
- **Authors**: PCI Security Standards Council
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines PCI Security Standards and highlights that TLS protecting e-commerce checkout flows uses RSA/ECDSA key exchange vulnerable to quantum attacks despite PCI DSS 4.0.1 requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum attacks on RSA/ECDSA key exchange
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: PCI Security Standards Council, LLC; Regions: Brazil, India-South Asia
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: Hardware Security Module (HSM)
- **Standardization Bodies**: PCI Security Standards Council, LLC
- **Compliance Frameworks Referenced**: PCI Data Security Standard (PCI DSS), PCI DSS v4.0.1, Point-to-Point Encryption (P2PE), Secure Software Lifecycle (Secure SLC), Payment Application Data Security Standard (PA-DSS)
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: PCI DSS 4.0.1 requires strong cryptography for online payment processing; TLS protecting checkout flows currently uses RSA/ECDSA key exchange vulnerable to quantum attacks; Global e-commerce transaction volume exceeds $6 trillion with payment data in transit continuously exposed; Organizations must address quantum vulnerabilities in payment flows despite existing compliance standards
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Compliance, tls-basics, pqc-risk-management, migration-program
- **Source Document**: RETAIL-001.html (634,634 bytes, 5,480 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:15:06

---

## RETAIL-002

- **Reference ID**: RETAIL-002
- **Title**: Retail / E-Commerce
- **Authors**: NIST Cybersecurity Framework
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes a NIST webpage regarding the Cybersecurity Framework 2.0, highlighting risks to retail customer data from future quantum computers and providing resources for cybersecurity risk management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQCs; Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework 2.0; CSF 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Retailers store customer PII and behavioral analytics for 5-10+ years creating long-term exposure; Encrypted databases harvested today become readable with CRQCs; NIST Cybersecurity Framework identifies data protection as a core function; Organizations should utilize CSF 2.0 resources to manage cybersecurity risk
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Compliance Officer; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Compliance, data-asset-sensitivity, pqc-risk-management
- **Source Document**: RETAIL-002.html (87,353 bytes, 4,612 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:16:10

---

## SUPPLY-001

- **Reference ID**: SUPPLY-001
- **Title**: Supply Chain / Logistics
- **Authors**: IMO Maritime Cyber Risk Management Guidelines
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines IMO guidelines and resolutions for managing maritime cyber risk, highlighting quantum exposure in port management systems, vessel identity PKI, and VPN infrastructure using RSA and ECDSA.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Cyber risks must be addressed in safety management systems no later than the first annual verification of the company's Document of Compliance after 1 January 2021.
- **Applicable Regions / Bodies**: Bodies: International Maritime Organization (IMO), ICS, IUMI, BIMCO, OCIMF, INTERTANKO, INTERCARGO, InterManager, WSC, SYBAss, IACS, IAPH, ISO, IEC, United States National Institute of Standards and Technology.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: AIS, VPN
- **Infrastructure Layers**: PKI, Vessel identity PKI, Maritime VPN infrastructure
- **Standardization Bodies**: International Maritime Organization (IMO), ISO, IEC, United States National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: MSC-FAL.1-Circ.3-Rev.3, Resolution MSC.428(98), ISM Code, SOLAS XI-2, ISPS Code, ISO/IEC 27001, NIST Framework for Improving Critical Infrastructure Cybersecurity
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: Maritime sector carries approximately 80% of world trade by volume and relies on systems using RSA and ECDSA; IMO guidelines require cyber risks to be addressed in safety management systems by the first annual verification after 1 January 2021; AIS is currently an unauthenticated broadcast protocol not yet quantum-affected until authenticated replacements are deployed; Port management systems and vessel identity PKI used in ECDIS and GMDSS utilize classical algorithms vulnerable to quantum threats.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Policy Maker
- **Implementation Prerequisites**: Incorporation of recommendations into existing risk management processes; addressing cyber risks in safety management systems as defined in the ISM Code.
- **Relevant PQC Today Features**: pqc-risk-management, compliance-strategy, migration-program, pki-workshop, vendor-risk
- **Source Document**: SUPPLY-001.html (57,115 bytes, 7,068 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:17:06

---

## SUPPLY-002

- **Reference ID**: SUPPLY-002
- **Title**: Supply Chain / Logistics
- **Authors**: DCSA Electronic Bill of Lading Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The DCSA Bill of Lading standard aims to eliminate paper and manual intervention in container shipping through digital signatures and encryption to prevent fraud and improve efficiency.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: DCSA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Digital signatures and encryption are required to ensure Bill of Lading documents are tamper-proof; Standardized digitalization reduces fraud opportunities inherent in physical document couriering; Full adoption of electronic Bills of Lading could unlock $18bn in trade ecosystem gains; Interoperability across platforms is essential for seamless digital transfer of original Bills of Lading.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Solution providers, Cargo owners, Freight forwarders, Ocean carriers, Banks, Ports, Terminals, Insurers
- **Implementation Prerequisites**: Adoption of DCSA Bill of Lading standard; Use of open source Application Programming Interfaces (APIs); Technical and legal interoperability with eBL solution providers
- **Relevant PQC Today Features**: digital-assets, vendor-risk, pqc-business-case, migration-program, compliance-strategy
- **Source Document**: SUPPLY-002.html (326,350 bytes, 5,249 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:18:31

---

## SUPPLY-003

- **Reference ID**: SUPPLY-003
- **Title**: Supply Chain / Logistics
- **Authors**: WCO SAFE Framework of Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The WCO SAFE Framework of Standards 2025 edition updates global supply chain security measures, including AEO expansion to MSMEs and environmental cooperation, while noting that digital certificates currently use RSA/ECDSA which face quantum forgery risks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery enabling customs fraud at global scale
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: World Customs Organization, WCO Council, Private Sector Consultative Group, WTO, ICAO; Regions: Global (implied by "global trade" and "WCO Members")
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Digital certificates for customs declarations
- **Standardization Bodies**: World Customs Organization, WTO, ICAO
- **Compliance Frameworks Referenced**: WCO SAFE Framework of Standards, Authorized Economic Operators (AEO) Programme, WTO Trade Facilitation Agreement
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: Digital certificates for customs declarations and AEO credentials currently rely on RSA/ECDSA which are vulnerable to quantum forgery; The 2025 SAFE Framework expands AEO eligibility to Micro-sized enterprises (MSMEs); New provisions require AEOs to adopt a Code of Conduct to enhance integrity against insider threats; Enhanced collaboration between Customs and environmental authorities is mandated to support global sustainability agendas.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect, Operations
- **Implementation Prerequisites**: Adoption of Code of Conduct (Ethics) by AEOs; Education of personnel regarding insider threats and internal conspirators; Alignment of procedures between Customs and environmental authorities.
- **Relevant PQC Today Features**: Threats, Compliance, pqc-risk-management, migration-program, digital-id
- **Source Document**: SUPPLY-003.html (67,565 bytes, 13,562 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:19:31

---

## TELCO-003

- **Reference ID**: TELCO-003
- **Title**: Telecommunications
- **Authors**: 3GPP TS 33.501 5G Security Architecture
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines 3GPP specification structures and highlights that 5G security architecture (TS 33.501) relies on quantum-vulnerable algorithms like ECDSA and RSA for network authentication and IPsec key exchange.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum vulnerability in 5G network authentication and key exchange
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: 3GPP, ETSI, GSM Association
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IPsec
- **Infrastructure Layers**: Network authentication, RAN encryption, N2/N3 interface security
- **Standardization Bodies**: 3GPP, ETSI, IETF, IEEE
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA, RSA
- **Key Takeaways**: 5G security architecture defined in TS 33.501 uses quantum-vulnerable algorithms; N2/N3 interface security relies on IPsec with vulnerable key exchange; Network slicing authentication and RAN encryption protect critical enterprise and emergency services; 3GPP specifications are organized by series numbers such as the 38 series for 5G NR
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security, algorithms, threats, tls-basics, vpn-ssh-pqc
- **Source Document**: TELCO-003.html (202,105 bytes, 10,606 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:20:58

---

## TELCO-005

- **Reference ID**: TELCO-005
- **Title**: Telecommunications
- **Authors**: ETSI ISG Quantum-Safe Cryptography / 3GPP
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: ETSI's Quantum-Safe Cryptography working group aims to standardize practical PQC implementations and migration strategies for 6G and other sectors while avoiding crypto-agility retrofit challenges.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; eavesdropping on public channels; loss of integrity and authenticity guarantees
- **Migration Timeline Info**: 2025-2030: 6G standards development window in 3GPP and ETSI for native PQC design
- **Applicable Regions / Bodies**: Europe; ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud storage; corporate networks; public channels
- **Standardization Bodies**: ETSI; 3GPP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography
- **Key Takeaways**: Incorporate PQC during the 6G design phase (2025-2030) to avoid retrofit challenges; current encrypted data is vulnerable to future decryption once quantum computers are available; ETSI TR 103 619 provides migration strategies and recommendations; practical implementation considerations include performance, benchmarking, and technology switching costs; PQC is essential for securing government, financial, medical, and cloud data
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility; technology switching costs; extensible security architectures
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Policy Maker; Researcher; Compliance Officer
- **Implementation Prerequisites**: Review of ETSI TR 103 619 for migration strategies; assessment of current cryptographic primitives and protocols
- **Relevant PQC Today Features**: 5g-security; crypto-agility; migration-program; pqc-risk-management; qkd
- **Source Document**: TELCO-005.html (25,184 bytes, 5,346 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:22:15

---

## WATER-002

- **Reference ID**: WATER-002
- **Title**: Water / Wastewater
- **Authors**: AWWA Cybersecurity Guidance for Water Utilities
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines AWWA cybersecurity resources, standards, and guidance for water utilities to address cyber threats and achieve resilience, with a brief mention of PQC migration challenges in smart water infrastructure.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: AWWA, U.S. EPA, CISA, NIST, FBI, Department of Homeland Security, Director of National Intelligence, Congress, House of Representatives, Senate, SANS, TWLA
- **Leaders Contributions Mentioned**: Kevin Morley (AWWA manager of federal relations)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, AWWA
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework, SDWA §1433, America’s Water Infrastructure Act of 2018 (AWIA) Section 2013, AWWA J100-21
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: All water systems should examine cybersecurity vulnerabilities and develop a risk management program; Federal legislation requires systems serving 3,300 or more persons to consider cybersecurity threats in risk assessments; AWWA provides an interactive Assessment Tool and guidance aligned with NIST Cybersecurity Framework to aid utilities in identifying exposure and implementing controls; Water utilities face PQC migration challenges due to constrained IoT devices deployed for 10-15 year cycles; Cyber-Informed Engineering (CIE) empowers leaders to design infrastructure that anticipates and withstands cyber risks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Utility Managers, Engineers, Operators, Compliance Officer, Security Architect, Policy Maker
- **Implementation Prerequisites**: AWWA website login required for access to Assessment Tool; systems serving 3,300 or more persons must consider cybersecurity threats in risk and resilience assessment; systems serving ≤ 10,000 persons may use Small Systems Option
- **Relevant PQC Today Features**: iot-ot-pqc, compliance-strategy, pqc-risk-management, migration-program, assess
- **Source Document**: WATER-002.html (480,449 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:23:25

---

## EDU-001

- **Reference ID**: EDU-001
- **Title**: Education / Research
- **Authors**: FERPA / US Department of Education
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document outlines FERPA regulations for protecting student education records while highlighting the risk of harvest-now-decrypt-later attacks on long-retained data in the absence of post-quantum cryptography mandates.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; CRQCs
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; U.S. Department of Education; Student Privacy Policy Office; Privacy Technical Assistance Center
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Family Educational Rights and Privacy Act (FERPA); Protection of Pupil Rights Amendment (PPRA); 34 CFR Part 99; General Education Provision Act (GEPA)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: FERPA mandates protection of student records but does not address post-quantum cryptography; Student records including SSNs and health data are retained for over 60 years creating long-term exposure; Encrypted databases harvested today become readable once CRQCs arrive; The PowerSchool breach demonstrates massive data aggregation risks in education
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Policy Maker; K-12 School Officials; Postsecondary School Officials; Vendors
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Compliance, data-asset-sensitivity, pqc-risk-management
- **Source Document**: EDU-001.html (134,852 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:25:04

---

## EDU-002

- **Reference ID**: EDU-002
- **Title**: Education / Research
- **Authors**: Internet2 InCommon Federation / Jisc Trust and Identity
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes InCommon's identity and access management services for research and education, highlighting a quantum threat where forged SAML tokens could compromise federated systems relying on RSA and ECDSA.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of IdP signing keys enabling forged SAML tokens and privilege escalation
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: InCommon Federation, eduroam
- **Leaders Contributions Mentioned**: Jack Suess, vice president of Information Technology at the University of Maryland, Baltimore County
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SAML, EAP, RADIUS
- **Infrastructure Layers**: PKI, Federation metadata, Certificate Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDSA
- **Key Takeaways**: InCommon Federation metadata is signed with 4096-bit RSA keys vulnerable to quantum forgery; Quantum attacks on IdP signing keys enable forged SAML tokens and privilege escalation across federated services; eduroam WiFi authentication relies on EAP with RADIUS using RSA/ECDSA certificates; Institutions must address legacy identity systems to mitigate risks in a post-quantum landscape
- **Security Levels & Parameters**: 4096-bit RSA
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Chief Information Officer, Chief Information Security Officer, Chief Technology Officer, IAM Implementer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, digital-id, pki-workshop, migration-program, pqc-risk-management
- **Source Document**: EDU-002.html (153,248 bytes, 11,336 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:26:30

---

## EDU-003

- **Reference ID**: EDU-003
- **Title**: Education / Research
- **Authors**: W3C Verifiable Credentials Data Model 2.0
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Specification of the extensible data model and ecosystem roles for verifiable credentials to enable cryptographically secure, privacy-respecting digital identity on the Web.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: W3C
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Verifiable credentials use digital signatures to make data tamper-evident and trustworthy; The ecosystem consists of three distinct roles: issuers, holders, and verifiers; Verifiability confirms authenticity but does not imply the truth of claims encoded in the credential; Privacy concerns arise from the persistence and correlation of digital data; Implementations must secure conforming documents using at least one securing mechanism.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Conforming document must be a compacted JSON-LD document; Must include all required properties; Must secure documents using a securing mechanism described in the specification.
- **Relevant PQC Today Features**: digital-id, tls-basics, pki-workshop, crypto-agility, api-security-jwt
- **Source Document**: EDU-003.html (327,555 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:27:45

---

## EDU-005

- **Reference ID**: EDU-005
- **Title**: Education / Research
- **Authors**: Check Point Research / Higher Ed Dive
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The education sector is the most attacked industry globally in 2025, facing a surge in cyberattacks driven by phishing, ransomware, and third-party vendor vulnerabilities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing enabling cryptographic bypass of authentication and encryption
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: CISA, NIST, Check Point Research, Verizon, IBM X Force, EDUCAUSE
- **Leaders Contributions Mentioned**: Mohammed Khalil (Author); K12 SIX leader (Anonymous quote on collaboration)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FERPA; NIST Cybersecurity Framework (CSF); CISA Protecting Our Future K–12 Cybersecurity Initiative; CISA Cybersecurity Guidance for K–12 Technology Acquisitions
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Education is the most attacked sector globally with 4,388 weekly cyberattacks per organization in Q2 2025; Third-party vendor risk accounts for 30% of incidents and requires Secure by Design principles; Phishing resistant MFA is the single most effective defense against credential theft; Immutable offline backups are the only reliable defense against ransomware attacks; AI-driven phishing has surged 224% in the education sector, requiring enhanced staff training.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Average breach cost in higher education exceeds $3.7M; Global average cost of a data breach is $10.22 million; 4,388 weekly cyberattacks per organization; 31% year-over-year increase in attacks.
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Phishing resistant Multi Factor Authentication (MFA); Aggressive patch management process; Immutable offline backups; Endpoint Detection & Response (EDR); Network segmentation; Regular security awareness training; Incident Response Plan with tabletop exercises.
- **Relevant PQC Today Features**: Threats, Compliance, vendor-risk, pqc-risk-management, migration-program
- **Source Document**: EDU-005.html (324,626 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:29:08

---

## CROSS-009

- **Reference ID**: CROSS-009
- **Title**: Cross-Industry
- **Authors**: IETF DNSSEC PQC Strategy / Verisign Research
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: This document proposes a dual-algorithm PQC strategy for DNSSEC combining conservatively designed algorithms with low-impact drop-in algorithms to mitigate large signature sizes and operational risks.
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA, Falcon, XMSS, LMS, MAYO, SNOVA, SQIsign
- **Quantum Threats Addressed**: trust now/forge later; quantum forgery of DNSSEC signatures enabling DNS hijacking
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: National Institute of Standards and Technology (NIST), Internet Engineering Task Force (IETF)
- **Leaders Contributions Mentioned**: Swapneel Sheth, Taejoong Chung, Benno Overeinder
- **PQC Products Mentioned**: BIND, NSD, CoreDNS
- **Protocols Covered**: DNSSEC, DNS, TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST), Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: BCP 78, BCP 79, BCP 14, RFC 2119, RFC 8174, RFC 4034, RFC 4035, RFC 9364, RFC 8391, RFC 8554
- **Classical Algorithms Referenced**: RSASHA256, ECDSA
- **Key Takeaways**: DNSSEC must adopt a dual-algorithm strategy using conservatively designed and low-impact PQC algorithms; PQC signature sizes exceed UDP packet limits requiring mode-of-operation changes like Merkle Tree Ladder; operational risks include excessive TCP fallback and latency degradation during migration; community testing via hackathons in BIND, NSD, and CoreDNS is recommended to measure resilience
- **Security Levels & Parameters**: ML-DSA signature size 2420-4627 bytes; SLH-DSA signature size 7856-49856 bytes; DNS UDP packet limit ~1232 bytes
- **Hybrid & Transition Approaches**: dual-algorithm approach combining conservatively designed algorithms with low-impact drop-in algorithms; Merkle Tree Ladder (MTL) mode to amortize signature size; fallback mechanisms for uncertain adoption timelines
- **Performance & Size Considerations**: ML-DSA signatures 2420-4627 bytes; SLH-DSA signatures 7856-49856 bytes; UDP packet limit ~1232 bytes; risk of excessive TCP fallback and latency degradation
- **Target Audience**: Security Architect, Developer, Policy Maker, Researcher
- **Implementation Prerequisites**: Testing in BIND, NSD, and CoreDNS; measurement of latency and fallback rates; research into countermeasures against denial-of-service risks for MTL mode
- **Relevant PQC Today Features**: Algorithms, Threats, Migration-program, stateful-signatures, merkle-tree-certs
- **Source Document**: CROSS-009.html (54,916 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:30:47

---

## CROSS-010

- **Reference ID**: CROSS-010
- **Title**: Cross-Industry
- **Authors**: APNIC / RIPE Labs RPKI Research
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document analyzes the quantum vulnerability of RPKI's exclusive use of RSA-2048 and evaluates post-quantum signature algorithms for migration to secure BGP route origin validation.
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA, Falcon (FN-DSA), EdDSA, SQIsign, MAYO, HAWK, FAEST, SNOVA
- **Quantum Threats Addressed**: Quantum forgery of ROAs enabling global IP prefix hijacking; breaking RSA signatures to impersonate Certificate Authorities
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dirk Doesburg (author of thesis and blog post)
- **PQC Products Mentioned**: Routinator
- **Protocols Covered**: BGP, RPKI, TLS, DNSSEC, ASPA, BGPsec
- **Infrastructure Layers**: Certificate Authorities, Repositories, Validators, HSMs
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-2048, AES-128, AES-256, Ed25519
- **Key Takeaways**: RPKI currently relies exclusively on RSA-2048 which is vulnerable to quantum forgery; Quantum attackers can weaponize ROV to make BGP attacks more effective by revoking legitimate routes; Hybrid signatures combining post-quantum and traditional schemes are recommended for security resilience; Falcon-512 offers the best performance balance with 1.4GB RPKI size increase compared to RSA; Migration is necessary to prevent network operators from disabling ROV entirely when quantum threats materialize
- **Security Levels & Parameters**: NIST Level 1, NIST Level 2, NIST Level 3, NIST Level 5, RSA-2048 (112 bits security), AES-128, AES-256, ML-DSA-44, Falcon-512, SLH-DSA-SHAKE-128s, SLH-DSA-SHAKE-128f
- **Hybrid & Transition Approaches**: Hybrid signature combining post-quantum and traditional signatures; fallback to a second post-quantum scheme based on different hardness assumptions
- **Performance & Size Considerations**: RSA RPKI size 838MB; ML-DSA RPKI size 3.0GB; Falcon RPKI size 1.4GB; SLH-DSA SHAKE-128s RPKI size 6.7GB; RSA download time 14.5 seconds; RSA verification CPU time 13 seconds; ML-DSA verification CPU time 34.2 seconds; Falcon verification CPU time 23.4 seconds
- **Target Audience**: Security Architect, Network Operator, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Algorithms, Migrate, hybrid-crypto, pki-workshop
- **Source Document**: CROSS-010.html (356,205 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:32:54

---

## CROSS-012

- **Reference ID**: CROSS-012
- **Title**: Cross-Industry
- **Authors**: Sigstore / OpenSSF Supply Chain Security
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The document describes Sigstore and Cosign tools for signing container images using classical cryptography, highlighting a quantum vulnerability where ECDSA-P256 signatures can be forged to inject backdoored images.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of container signatures enabling injection of backdoored images
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OIDC, PKIX
- **Infrastructure Layers**: Key Management, HSM, Cloud KMS, Container Registries, Transparency Log
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA-P256, prime256v1, SHA-256, RSA_4096, RSASSA_PKCS1_V1_5_SHA_256
- **Key Takeaways**: Sigstore/cosign currently relies exclusively on ECDSA-P256 for container signatures creating a quantum vulnerability; Quantum forgery allows attackers to inject backdoored images into registries undetected; Cosign supports keyless signing via OIDC with Google, GitHub, or Microsoft; Signatures can be generated using external tools like OpenSSL and uploaded via Cosign; Multiple KMS providers including Azure, AWS, GCP, Hashicorp Vault, and OpenBao are supported for key storage.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Operations
- **Implementation Prerequisites**: Access to a container registry; OpenSSL for external signing examples; AWS CLI Version 2 for AWS KMS integration; gcloud CLI for GCP KMS integration
- **Relevant PQC Today Features**: Threats, code-signing, kms-pqc, hsm-pqc, pki-workshop
- **Source Document**: CROSS-012.html (77,551 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:34:53

---

## CROSS-013

- **Reference ID**: CROSS-013
- **Title**: Cross-Industry
- **Authors**: NIST SP 800-90B / Quantinuum Quantum Origin
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Quantinuum's Quantum Origin software QRNG achieved NIST SP 800-90B validation to support PQC key generation and federal cybersecurity readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Mandated migration to post-quantum cryptography (PQC) under National Security Memorandum 10
- **Applicable Regions / Bodies**: Regions: United States, Singapore; Bodies: NIST, National Quantum Office, Agency for Science Technology and Research, National Research Foundation, Singapore Economic Development Board
- **Leaders Contributions Mentioned**: Dr. Rajeeb Hazra (President and CEO); Nitesh Sharan (Chief Financial Officer); Dr. Marvin Lee (Country Leader for Quantinuum Singapore); Mrs. Josephine Teo (Minister for Digital Development and Information)
- **PQC Products Mentioned**: Quantum Origin, TKET, Guppy, Lambeq, Qermit, Nexus, InQuanto, Helios, System Model H1, System Model H2
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management, Cloud Access, Air-gapped networks
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST SP 800-90B, National Security Memorandum 10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Quantum Origin is the first software QRNG to achieve NIST SP 800-90B validation; Software-based QRNG enables deployment in air-gapped networks without specialized hardware; Proven quantum randomness is essential for PQC key generation security; U.S.-made software mitigates supply chain risks associated with foreign hardware
- **Security Levels & Parameters**: NIST SP 800-90B
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Zero network connectivity deployment; No impact on size, weight, and power (SWaP) requirements
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Integration with existing NIST-approved cryptographic systems; No recertification required for integration
- **Relevant PQC Today Features**: entropy-randomness, compliance-strategy, migration-program, vendor-risk
- **Source Document**: CROSS-013.html (162,905 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:36:26

---

## RAIL-003

- **Reference ID**: RAIL-003
- **Title**: Rail / Transit
- **Authors**: UIC / ETSI FRMCS Specification
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: European railways are transitioning from GSM-R to FRMCS based on 5G technology, introducing quantum vulnerabilities in asymmetric cryptography while managing legacy A5/1 systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum vulnerabilities in 5G asymmetric cryptography; broken status of legacy A5/1
- **Migration Timeline Info**: 2026-2035 timeline for GSM-R to FRMCS transition; Deutsche Bahn begins live FRMCS tests in 2027; webinar on 3 December 2025
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: GSM-R; FRMCS; 5G Standalone architecture; A5/1
- **Infrastructure Layers**: IP-based networks; operational technology; rolling stock; cloud platforms; intelligent trackside equipment; Zero Trust Architecture
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Control Command and Signalling Technical Specification for Interoperability
- **Classical Algorithms Referenced**: A5/1
- **Key Takeaways**: European railways face quantum vulnerabilities during the 2026-2035 transition to FRMCS; Legacy A5/1 is broken while 5G crypto remains quantum-vulnerable during parallel operation; Operators must strengthen authentication and encryption strategies as networks become IP-based; Multi-vendor ecosystems require updated cyber-security governance frameworks; Early investment in secure digital foundations is critical for resilience by 2030
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Parallel operation of legacy A5/1 and 5G crypto systems
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Operations, Infrastructure Manager
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security; migration-program; pqc-risk-management; timeline; threats
- **Source Document**: RAIL-003.html (169,177 bytes, 8,233 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:38:01

---

## RAIL-005

- **Reference ID**: RAIL-005
- **Title**: Rail / Transit
- **Authors**: ISO/SAE 21434 / IEC 62443 Autonomous Rail
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Autonomous rail systems including CBTC and GoA4 driverless operations face quantum exposure risks to infrastructure authentication.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum forgery of infrastructure authentication
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ISO/SAE; IEC
- **Compliance Frameworks Referenced**: ISO/SAE 21434; IEC 62443
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Autonomous rail systems rely on continuous authenticated communication between trackside and onboard systems; Quantum forgery of infrastructure authentication enables unauthorized commands to driverless trains; Potential consequences include collisions or safety incidents; Systems are governed by ISO/SAE 21434 and IEC 62443 standards
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Compliance; iot-ot-pqc
- **Extraction Note**: No source text available
- **Source Document**: RAIL-005.html (2,063 bytes, no text extracted)
- **Extraction Timestamp**: 2026-04-12T15:39:18

---

## WATER-003

- **Reference ID**: WATER-003
- **Title**: Water / Wastewater
- **Authors**: EPA Cybersecurity for Water Sector (August 2024)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: EPA and CISA guidance on cybersecurity vulnerabilities in water sector IoT systems, specifically unsecured Human Machine Interfaces and the lack of crypto-agility for PQC migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum-enabled data integrity attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Environmental Protection Agency, Cybersecurity and Infrastructure Security Agency, Federal Bureau of Investigation
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Human Machine Interface (HMI) devices
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: America's Water Infrastructure Act
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Water sector IoT sensors currently rely on RSA and ECC for key bootstrap; Constrained sensors lack crypto-agility preventing mid-life PQC migration; Unauthorized remote access to unsecured HMIs can disrupt water treatment processes; EPA and CISA provide resources to secure HMI devices against malicious cyber activity; Quantum-enabled attacks pose a risk of injecting false sensor readings causing public health emergencies
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto-agility (noted as lacking in constrained sensors)
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Operations, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Assess, iot-ot-pqc, crypto-agility, pqc-risk-management
- **Source Document**: WATER-003.html (58,737 bytes, 5,286 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:40:04

---

## WATER-004

- **Reference ID**: WATER-004
- **Title**: Water / Wastewater
- **Authors**: NIST NCCoE Water/Wastewater Cybersecurity Project
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Wastewater SCADA systems face quantum vulnerabilities where decryption of control commands using RSA/ECC could corrupt treatment processes and release untreated sewage.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum-enabled decryption of control commands
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: EPA, CISA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OPC UA, DNP3 Secure Authentication
- **Infrastructure Layers**: Key establishment
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: Wastewater SCADA systems are architecturally distinct from drinking water treatment; EPA and CISA classify wastewater under essential services; Quantum-enabled decryption of control commands poses a risk of releasing untreated sewage; Newer systems rely on RSA and ECC for key establishment in OPC UA and DNP3 Secure Authentication
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Operations, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, iot-ot-pqc, compliance-strategy, pqc-risk-management
- **Source Document**: WATER-004.html (1,178,202 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:41:04

---

## CI-001

- **Reference ID**: CI-001
- **Title**: Critical Infrastructure
- **Authors**: CISA Post-Quantum Cryptography Initiative / PPD-21
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: CISA's Post-Quantum Cryptography Initiative outlines a strategy to assess risks across 55 National Critical Functions and guide critical infrastructure sectors in transitioning to quantum-resistant standards.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Threats to current cryptographic standards ensuring data confidentiality and integrity; risk of breaking public key encryption algorithms by future quantum computers
- **Migration Timeline Info**: NIST does not expect to publish a standard for use by commercial products until 2024; organizations should start preparing now but wait for official release before production implementation
- **Applicable Regions / Bodies**: United States; CISA; Department of Homeland Security (DHS); National Institute of Standards and Technology (NIST); RAND Corporation; Federal Civilian Executive Branch (FCEB); state, local, tribal, and territorial (SLTT) entities
- **Leaders Contributions Mentioned**: Alejandro N. Mayorkas: Secretary of Homeland Security who released a March 2021 vision for cybersecurity resilience
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public-key cryptography; digital communications; Operational Technology (OT); National Critical Functions (NCFs)
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Presidential Policy Directive PPD-21; Executive Order 14306; DHS Post-Quantum Cryptography Roadmap
- **Classical Algorithms Referenced**: public-key cryptography; public key encryption algorithms
- **Key Takeaways**: Organizations must inventory systems using public-key cryptography and categorize data lifecycle before transition; Stakeholders in four priority National Critical Functions (Internet services, Identity Management, IT products, Sensitive Information protection) must lead migration efforts to support other sectors; Entities should test new standards in lab environments but delay production implementation until official NIST release; Transition plans require interdependence analysis to determine system update order and decommissioning of unsupported technology
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Testing new standards in a lab environment before production implementation; Interdependence analysis to determine order of systems transition; Decommissioning old technology upon publication of the new standard
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Inventorying organizational systems for public-key cryptography applications; Categorizing and determining lifecycle of organizational data; Performing interdependence analysis; Creating acquisition policies regarding post-quantum cryptography; Educating workforce about the upcoming transition
- **Relevant PQC Today Features**: pqc-risk-management, migration-program, Assess, Threats, Compliance, digital-id, iot-ot-pqc
- **Source Document**: CI-001.html (70,114 bytes, 12,204 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:44:15

---

## CI-003

- **Reference ID**: CI-003
- **Title**: Critical Infrastructure
- **Authors**: NIST SP 800-82 / IEC 62351 / ISA/IEC 62443
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: This document provides guidance on securing operational technology (OT) systems while addressing their unique performance, reliability, and safety requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers can forge certificates, masquerade as legitimate controllers, and decrypt historical VPN traffic
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology
- **Leaders Contributions Mentioned**: Keith A. Stouffer, Michael Pease, CheeYee Tang, Timothy Zimmerman, Victoria Yan Pillitteri, Suzanne Lightman, Adam Hahn, Stephanie Saravia, Aslam Sherule, Michael Thompson
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Modbus, DNP3, OPC UA, TLS, VPN
- **Infrastructure Layers**: Operational Technology (OT), Industrial Control Systems (ICS), Supervisory Control and Data Acquisition (SCADA) systems, Programmable Logic Controllers (PLC)
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECC
- **Key Takeaways**: OT systems encompass programmable devices interacting with the physical environment; Modbus and DNP3 lack native cryptographic authentication requiring TLS/VPN overlays; OPC UA uses native RSA/ECC certificate authentication vulnerable to quantum forgery; Quantum computers pose risks of masquerading as controllers and decrypting historical traffic; Security countermeasures must address unique OT performance and safety requirements
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Operations, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc, threats, tls-basics, vpn-ssh-pqc, pki-workshop
- **Source Document**: CI-003.html (82,551 bytes, 5,240 extracted chars)
- **Extraction Timestamp**: 2026-04-12T15:45:54

---

## AERO-003

- **Reference ID**: AERO-003
- **Title**: Aerospace / Aviation
- **Authors**: ICAO Assembly Resolution A41-19
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Air traffic management authentication gap: ICAO Assembly Resolution A41-19 (2022) addresses aviation cybersecurity but ADS-B transmissions remain unencrypted and unauthenticated.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Years mentioned: 2022, 2025, 2026; Keywords: deadline
- **Applicable Regions / Bodies**: Regions: United States, Canada, Bodies: NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## CLOUD-003

- **Reference ID**: CLOUD-003
- **Title**: Cloud Computing / Data Centers
- **Authors**: Moody, Dustin; Perlner, Ray; Regenscheid, Andrew; Robinson, Angela; Cooper, David
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Federal cloud PQC compliance requirements: NIST SP 800-210 general access control guidance for cloud systems combined with NIST IR 8547 deprecation timeline means federal cloud deployments must transition to PQC by 2030.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2024, 2025
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST
- **Leaders Contributions Mentioned**: Dustin Moody
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST IR 8547 (Transition)

---

## CROSS-002

- **Reference ID**: CROSS-002
- **Title**: Cross-Industry
- **Authors**: Moody, Dustin; Perlner, Ray; Regenscheid, Andrew; Robinson, Angela; Cooper, David
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: NIST IR 8547 proposed transition timeline: NIST Initial Public Draft (November 2024) establishes proposed timeline to deprecate RSA, ECDSA, ECDH, and EdDSA by 2030 and disallow them entirely after 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2024, 2025
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST
- **Leaders Contributions Mentioned**: Dustin Moody
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST IR 8547 (Transition)

---

## CROSS-004

- **Reference ID**: CROSS-004
- **Title**: Cross-Industry
- **Authors**: Global Risk Institute Quantum Threat Timeline
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: CRQC timeline uncertainty: Global Risk Institute 2024 survey of 32 quantum experts estimates 19-34% probability of a cryptographically relevant quantum computer (CRQC) within 10 years and 5-14% within 5 years.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## CROSS-005

- **Reference ID**: CROSS-005
- **Title**: Cross-Industry
- **Authors**: NIST FIPS 206 FN-DSA Status
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: FIPS 206 FN-DSA (Falcon) standardization: NIST submitted draft FIPS 206 for approval August 2025.
- **PQC Algorithms Covered**: FN-DSA, Falcon, FIPS 206 (FN-DSA)
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Years mentioned: 2025
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected

---

## CROSS-006

- **Reference ID**: CROSS-006
- **Title**: Cross-Industry
- **Authors**: NIST Post-Quantum Cryptography Standardization
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: HQC selected as 5th PQC algorithm: NIST announced March 11 2025 the selection of HQC (Hamming Quasi-Cyclic) as a backup KEM to ML-KEM.
- **PQC Algorithms Covered**: ML-KEM, Falcon, HQC, FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 206 (FN-DSA)
- **Quantum Threats Addressed**: Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2024, 2025, 2027
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST
- **Leaders Contributions Mentioned**: Dustin Moody
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected

---

## CRYPTO-001

- **Reference ID**: CRYPTO-001
- **Title**: Cryptocurrency / Blockchain
- **Authors**: Jillian Mascelli; Megan Rodden
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Bitcoin ECDSA transaction hijacking: Approximately $718B in quantum-vulnerable P2PK addresses with exposed public keys (price-dependent estimate).
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), HNDL, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, International
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## CRYPTO-003

- **Reference ID**: CRYPTO-003
- **Title**: Cryptocurrency / Blockchain
- **Authors**: Jillian Mascelli; Megan Rodden
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Blockchain HNDL permanence risk: Federal Reserve research confirms distributed ledger networks face permanent data privacy risks from harvest-now-decrypt-later attacks even with future PQC deployment.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), HNDL, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, International
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## FIN-001

- **Reference ID**: FIN-001
- **Title**: Financial Services / Banking
- **Authors**: Bank for International Settlements Project Leap Phase 2
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: BIS Project Leap quantum-safe payment system cryptography: Phase 2 launched July 2025 with Bank of Italy, Bank of France, Deutsche Bundesbank, Nexi-Colt, and SWIFT testing hybrid PQC on TARGET2 real-time gross settlement system.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## FIN-002

- **Reference ID**: FIN-002
- **Title**: Financial Services / Banking
- **Authors**: Jillian Mascelli; Megan Rodden
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Harvest Now Decrypt Later (HNDL) attacks targeting long-lived financial data including transaction records and settlement logs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), HNDL, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, International
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## FIN-003

- **Reference ID**: FIN-003
- **Title**: Financial Services / Banking
- **Authors**: G7 Cyber Expert Group Statement (U.S. Treasury)
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: G7 Cyber Expert Group PQC roadmap: January 2026 statement coordinated by U.S.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, European Union, Bodies: NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## GOV-003

- **Reference ID**: GOV-003
- **Title**: Government / Defense
- **Authors**: CISA Product Categories for PQC Technologies
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: Federal PQC procurement mandate: CISA January 2026 federal buying guidance pursuant to Executive Order 14306 (June 2025) requires agencies to procure only quantum-resistant technology across designated product categories including cloud services, col
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: CRQC (Cryptographically Relevant Quantum Computer), Cryptographically Relevant Quantum, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2023, 2024, 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST, NSA, CISA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: HSM, PKI, Firmware, IoT, Cloud, Email, OT/ICS/SCADA, Disk Encryption
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected

---

## IOT-001

- **Reference ID**: IOT-001
- **Title**: Internet of Things (IoT)
- **Authors**: Forescout Device Risk Research
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: IoT device risk escalation: Forescout 2025 research reports overall average device risk scores increased 15% year-over-year, with country-level averages rising 33%.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Years mentioned: 2024, 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, Germany, France, Australia, Japan, Bodies: CISA, ACSC/ASD
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: IoT, Cloud, OT/ICS/SCADA
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected

---

## IT-003

- **Reference ID**: IT-003
- **Title**: IT Industry / Software
- **Authors**: NIST FIPS 203/204/205 Post-Quantum Cryptography Standards
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: NIST FIPS 203/204/205 standardization milestone: First official PQC standards published August 2024.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, Falcon, HQC, FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- **Quantum Threats Addressed**: Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2024, 2025, 2035; Keywords: deprecat
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST
- **Leaders Contributions Mentioned**: Dustin Moody
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST IR 8547 (Transition)

---
