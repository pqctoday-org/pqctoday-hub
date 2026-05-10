---
generated: 2026-03-22
collection: timeline
documents_processed: 207
enrichment_method: ollama-qwen3.5:27b
---

## European Union:EU Horizon — QARC Project Execution

- **Reference ID**: European Union:EU Horizon — QARC Project Execution
- **Title**: QARC Project Execution
- **Authors**: European Union Horizon Europe Program
- **Publication Date**: 2026-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The QARC project coordinates EU-funded research to develop and pilot hybrid post-quantum cryptographic implementations across e-government and cloud infrastructures.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers threaten to break today's cryptography
- **Migration Timeline Info**: Start date 1 January 2026; End date 31 December 2028
- **Applicable Regions / Bodies**: Regions: Czechia, Estonia, Spain, Slovakia, Latvia, Norway; Bodies: National Cyber Security Authorities (NCSAs)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud infrastructures; embedded constrained devices; Field Programmable Gate Arrays (FPGAs); eGovernment services
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid schemes guarantee security even if legacy or some PQC families fail; Cryptographic agility provides easy cryptographic updates; Pilots in e-government and open-source platforms test deployment strategies across the EU; National Cyber Security Authorities ensure coordinated transition strategies and aligned national roadmaps; Special attention is given to helping smaller countries manage the transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid schemes; cryptographic agility; transition from legacy to PQC cryptography; coordinated transition strategies; aligned national roadmaps
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Policy Maker; Researcher; Developer; Compliance Officer
- **Implementation Prerequisites**: Open-source software platforms; embedded constrained devices; Field Programmable Gate Arrays (FPGAs); collaboration with National Cyber Security Authorities
- **Relevant PQC Today Features**: hybrid-crypto; crypto-agility; migration-program; pqc-governance; iot-ot-pqc
- **Phase Classification Rationale**: The document describes a Horizon Europe Research and Innovation Action (RIA) focused on developing novel prototypes, evaluating them in realistic pilots, and creating policy briefs, which characterizes the research phase.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Technology; Academic
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from theoretical PQC concepts to practical deployment pilots and policy development, enabling coordinated national roadmaps and standardization activities.
- **Historical Significance**: Represents a major EU-funded initiative to accelerate the transition to PQC by involving National Cyber Security Authorities in real-world pilots across multiple member states.
- **Implementation Timeline Dates**: 1 January 2026; 31 December 2028
- **Successor Events & Dependencies**: Requires development of novel prototypes for embedded devices and FPGAs; Enables creation of exemplary deployment strategies and good practices for the transition from legacy to PQC cryptography.

---

## Global:IBM — Quantum Safe Explorer Launched

- **Reference ID**: Global:IBM — Quantum Safe Explorer Launched
- **Title**: Quantum Safe Explorer Launched
- **Authors**: International Business Machines Corporation
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: IBM launches Quantum Safe Explorer to automate cryptographic asset discovery, vulnerability identification, and CBOM generation for crypto-agility.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later
- **Migration Timeline Info**: NIST 2035 inventory requirements
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jai Arun (Head of IBM Quantum Safe Product Management & Strategy); Sukanta Bhattacharjee (Solution Architect for IBM Quantum Safe Explorer); Kyle Brown (IBM Fellow, CTO IBM CIO Office); James McGugan (Chief Architect, Quantum Safe Tools); Biswajit Roy (Solution Architect, App modernization - CIO DevEx)
- **PQC Products Mentioned**: IBM Quantum Safe Explorer; Portfolio View; Developer Data Lake; VS Code Extension; CLI; Nimbus JOSE + JWT 10.2; Apache Commons Codec 1.18; Bouncy Castle; OpenSSL; Crypto; PyCrypto; HashiCorp Vault; JCA
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Cloud KMS; CI/CD pipeline; DevSecOps; Tekton-based cloud native CI/CD pipeline platform
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST PQC migration requirements; NIST 2035 inventory requirements
- **Classical Algorithms Referenced**: RSA; ECDSA (implied via Cipher.getInstance ("RSA/ECB/PKCS1Padding")); AES (not explicitly named but implied by context of ciphers); SHA-2 (not explicitly named); DH (not explicitly named); X25519 (not explicitly named); DSA (not explicitly named); 3DES (not explicitly named)
- **Key Takeaways**: Organizations must identify all cryptography in applications to reduce security risk and meet regulations; Manual discovery is impractical for scattered codebases requiring automated scans integrated into DevSecOps; Upgrading libraries does not automatically inherit PQC support as code must be updated to request algorithms explicitly; Automated CBOMs enable audit, governance, and prioritization of high-risk issues like unsafe public-key usage.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto-agility; fallback negotiation paths; missing fallback logic
- **Performance & Size Considerations**: 6000 repositories scanned; 47 million lines of code scanned; 3900+ vulnerabilities identified; 2,499 crypto-assets detected; 5,815 total code repositories scanned; 440,689 total files scanned; 47,599,426 total lines of code scanned
- **Target Audience**: CIO; Developer; Security Architect; Compliance Officer; Operations; Policy Maker
- **Implementation Prerequisites**: VS Code Extension installed in under 5 minutes; CI/CD integration via CLI or RESTful API; support for Java, Python, C, C++, C#, Go, Dart; Tekton-based cloud native CI/CD pipeline platform; Postgres database for Portfolio View
- **Relevant PQC Today Features**: Assess; Migrate; crypto-agility; pqc-risk-management; code-signing
- **Phase Classification Rationale**: The document describes IBM's CIO Office acting as "Client Zero" to test and prove the tool's capabilities, scanning 6000 repositories to establish a foundation for crypto-agility before broader customer adoption.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from theoretical risk awareness to practical tool deployment and validation, enabling organizations to transition from manual audits to automated crypto-agility workflows.
- **Historical Significance**: Represents a major vendor's internal "Client Zero" proof of concept demonstrating the feasibility of scanning millions of lines of code for quantum vulnerabilities using automated tools.
- **Implementation Timeline Dates**: 2035: NIST inventory requirements
- **Successor Events & Dependencies**: Enables transition to IBM Quantum Safe product suite (Advisor, Posture Management, Remediator); Requires integration into existing DevSecOps pipelines and Tekton-based CI/CD platforms.

---

## Global:IBM — IBM Heron R2 Processor Available

- **Reference ID**: Global:IBM — IBM Heron R2 Processor Available
- **Title**: IBM Heron R2 Processor Available
- **Authors**: International Business Machines Corporation
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: IBM announces the availability of the Heron R2 processor with 156 qubits and software updates enabling quantum circuits with up to 5,000 two-qubit gates.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jay Gambetta; Ryan Mandelbaum
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IBM Heron R2 processor enables circuits with 5,000 two-qubit gates surpassing classical simulation limits; Qiskit software stack updates allow clients to replicate utility experiments 50x faster; New coupler technologies (l-couplers and m-couplers) demonstrated for scaling quantum chips; Quantum-centric supercomputing workflows demonstrated by connecting AiMOS and IBM Quantum System One via Slurm.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 156 qubits; 5,000 two-qubit gate operations; 150,000 circuit layer operations per second (CLOPS); 3.5% error per gate for CNOT on test devices; 235 nanosecond operation time; 30% depth improvement in circuits via Qiskit Transpiler Service.
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: Qiskit software stack; Qiskit SDK v1.0; Premium Plan for Qiskit Transpiler Service and Qiskit Code Assistant; Slurm resource manager for quantum-centric supercomputing workflows.
- **Relevant PQC Today Features**: Algorithms; Leaders; Playground; pqc-101; quantum-threats
- **Phase Classification Rationale**: The document describes a "proof-of-concept" demonstration of l-couplers via IBM Quantum Flamingo and m-couplers via IBM Quantum Crossbill, explicitly stating these are prototypes or test devices not yet production-ready for clients.
- **Regulatory Mandate Level**: Informational (educational, advisory only)
- **Sector / Industry Applicability**: Technology; Academic; Healthcare
- **Migration Urgency & Priority**: Exploratory (research phase, no specific deadline)
- **Phase Transition Narrative**: Moves from hardware prototyping to utility-scale demonstration, enabling future production-ready systems like Flamingo by end of 2025 and advancing toward error-corrected quantum computing.
- **Historical Significance**: Represents the first delivery on IBM's 100x100 challenge, demonstrating accurate calculation of circuits beyond exact classical simulation with 5,000 two-qubit gates.
- **Implementation Timeline Dates**: End of 2025: debut production-ready Flamingo-based system; 2026: demonstrate c-couplers with Kookaburra.
- **Successor Events & Dependencies**: Requires development of c-couplers and error correcting codes; Enables deployment of IBM Quantum Flamingo production systems and scaled-up devices like Crossbill.

---

## Global:Microsoft — Quantum Safe Program Launch

- **Reference ID**: Global:Microsoft — Quantum Safe Program Launch
- **Title**: Quantum Safe Program Launch
- **Authors**: Microsoft Corporation
- **Publication Date**: 2023-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: None detected; the document announces a program launch but does not explicitly state it is a policy phase event or define governance policies.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record Microsoft-QSP-Roadmap-2025; timeline dimensions extracted separately

---

## Global:Microsoft — Majorana 1 Quantum Chip

- **Reference ID**: Global:Microsoft — Majorana 1 Quantum Chip
- **Title**: Majorana 1 Quantum Chip
- **Authors**: Microsoft Corporation
- **Publication Date**: 2025-02-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Microsoft announces Majorana 1, the world's first quantum processor powered by topological qubits built on a topoconductor material.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: Defense Advanced Research Projects Agency (DARPA), Air Force Research Laboratory, Johns Hopkins University Applied Physics Laboratory, Los Alamos National Laboratory, Oak Ridge National Laboratory, NASA Ames Research Center
- **Leaders Contributions Mentioned**: Chetan Nayak, Technical Fellow and Corporate Vice President of Quantum Hardware
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Microsoft has demonstrated the world's first topological qubit using a new topoconductor material; The company aims to build a fault-tolerant prototype in years rather than decades under DARPA's US2QC program; Measurement-based quantum error correction reduces overhead roughly tenfold compared to previous approaches; Majorana 1 is designed to scale to one million qubits on a single chip
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Error probability of 1%; External energy events occurring once per millisecond on average; Scalable to one million qubits; QEC overhead reduced roughly tenfold
- **Target Audience**: Researcher; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Leaders, Algorithms, Timeline, quantum-threats, migration-program
- **Phase Classification Rationale**: The document describes a "transformative leap" and "scientific exploration to technological innovation," detailing the demonstration of a new state of matter (topoconductor) and the first topological qubit, which aligns with fundamental research breakthroughs rather than standardization or deployment.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Technology; Defense; Academic
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from scientific exploration of topological qubits to engineering a scalable architecture and building a fault-tolerant prototype.
- **Historical Significance**: Marks the announcement of the world's first Quantum Processing Unit powered by a Topological Core, representing a pivotal moment in advancing from theoretical physics to practical quantum computing implementation.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires building a 4x2 tetron array for entanglement and measurement-based braiding; Enables the construction of a fault-tolerant prototype based on topological qubits as part of the DARPA US2QC program final phase.

---

## Global:PQShield — UltraPQ-Suite Launched

- **Reference ID**: Global:PQShield — UltraPQ-Suite Launched
- **Title**: UltraPQ-Suite Launched
- **Authors**: PQShield Ltd
- **Publication Date**: 2025-04-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: PQShield launches the UltraPQ-Suite, featuring specialized PQC implementations including PQPlatform-TrustSys for ASIC/FPGA CNSA 2.0 compliance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Complete phase-out of RSA by 2035; adoption of PQC required by NIST timelines.
- **Applicable Regions / Bodies**: Bodies: NSA, NIST
- **Leaders Contributions Mentioned**: Ali El Kaafarani (Founder and CEO); Dr Axel Poschmann (VP of Product)
- **PQC Products Mentioned**: UltraPQ-Suite; PQPlatform-TrustSys; PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex; PQPerform-Lattice; PQCryptoLib-Embedded
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Root of Trust; Secure Boot; Secure Update; Key Management; HSM; Private Peripheral Bus
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: CNSA 2.0; FIPS 140-3; Common Criteria; SESIP; PSA
- **Classical Algorithms Referenced**: RSA
- **Key Takeaways**: Organizations must phase out RSA by 2035 to meet regulatory requirements; PQPlatform-TrustSys enables ASIC and FPGA hardware to achieve CNSA 2.0 compliance; Manufacturers require specialized PQC implementations categorized as ultra fast, ultra secure, or ultra small; Side channel attack and fault injection attack resistance are critical for device attestation in critical infrastructure; The PKfail vulnerability highlights the need to update Secure Boot mechanisms with PQC.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility; phase-out of RSA by 2035
- **Performance & Size Considerations**: Ultra fast implementations optimize key encapsulations per second; ultra small targets memory-constrained devices; PQCryptoLib-Embedded is the smallest implementation of PQC on the market.
- **Target Audience**: Security Architect; Developer; Compliance Officer; System Integrators; Manufacturer
- **Implementation Prerequisites**: ASIC or FPGA hardware; FIPS 140-3 certification; integration with Private Peripheral Bus for cryptographic accelerators
- **Relevant PQC Today Features**: Compliance; Migrate; Algorithms; Leaders; iot-ot-pqc; hsm-pqc; crypto-agility
- **Phase Classification Rationale**: The document announces the launch of a product suite designed to help manufacturers achieve compliance and address implementation challenges, indicating a transition from standardization to commercial deployment.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Semiconductors and Manufacturing; Military and Aerospace; Identity and Paymentech; Automotive; Industrial IoT; Network & Telecommunications; Healthcare; Critical Infrastructure
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Moves from standardization and vulnerability discovery (PKfail) to commercial implementation, enabling manufacturers to deploy quantum-safe Root of Trust solutions.
- **Historical Significance**: Represents a commercial response to the PKfail vulnerability and the 2035 RSA phase-out mandate, offering specialized hardware implementations for CNSA 2.0 compliance.
- **Implementation Timeline Dates**: 2035: complete phase-out of RSA
- **Successor Events & Dependencies**: Requires adoption of PQC standards set out in regulations like CNSA 2.0; enables ASIC and FPGA manufacturers to bring quantum-safe products to market.

---

## Global:PQShield — 100th Research Paper Milestone

- **Reference ID**: Global:PQShield — 100th Research Paper Milestone
- **Title**: 100th Research Paper Milestone
- **Authors**: PQShield Ltd
- **Publication Date**: 2025-10-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: PQShield celebrates its 100th research paper milestone, highlighting contributions to PQC theory and commercial deployment including awards at CCS 2025.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; Jazzline; SPQR
- **Quantum Threats Addressed**: Shor's algorithm; physical attacks; side-channel protection; power leakage
- **Migration Timeline Info**: 2035 migration deadline
- **Applicable Regions / Bodies**: Bodies: NIST; IETF; NCSC; NEDO; ANSSI; AIST; The Signal Foundation
- **Leaders Contributions Mentioned**: Dr Thomas Prest (Author); Shuichi Katsumata (WireGuard research); Guilhem Niot (WireGuard research); Thom Wiggers (WireGuard research); Keitaro Hashimoto (AIST researcher, WireGuard research); Ben Marshall (Power leakage paper); Pierre-Yves Strub (Jazzline proofing method); Mélissa Rossi (Mask compression security proof)
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex
- **Protocols Covered**: WireGuard; SPQR (Sparse Post Quantum Ratchet)
- **Infrastructure Layers**: Key management; embedded and silicon implementations; secure messaging
- **Standardization Bodies**: NIST; IETF; NCSC; NEDO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: PQShield has published 100 research papers bridging PQC theory and real-world deployment; New masking countermeasures improve ML-DSA resistance to physical attacks; Existing protocols like WireGuard can be upgraded to PQC with minimal performance impact; Collaboration with bodies like NIST and The Signal Foundation is driving standardization and secure messaging adoption; A 2035 migration deadline drives the need for high-assurance implementations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Reinforced KEMs; upgrading existing protocols to post-quantum security
- **Performance & Size Considerations**: Minimal impact on performance for WireGuard upgrades; reduced memory footprint of masking
- **Target Audience**: Security Architect; Developer; Researcher; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Leaders; Timeline; migration-program; iot-ot-pqc; vpn-ssh-pqc
- **Phase Classification Rationale**: The document explicitly details the release of the 100th research paper, describing work on correctness proofs, masking countermeasures, and security analysis as foundational academic innovation.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Semiconductors and Manufacturing; Identity and Paymentech; Military and Aerospace; Automotive; Industrial IoT; Network & Telecommunications; Enterprise Platforms; Healthcare
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from theoretical research to commercial deployment — signals that PQC is transitioning from academic innovation to securing real-world systems and supply chains.
- **Historical Significance**: Marks a major milestone where a single company has produced 100 papers, demonstrating a unique position in both theoretical foundations and driving commercial deployment of PQC.
- **Implementation Timeline Dates**: 2035: migration deadline; 2025: CCS conference; 2026: TCHES publication; 2026: IEEE Symposium on Security & Privacy publication
- **Successor Events & Dependencies**: Enables high-assurance, side-channel-resistant implementations for embedded and silicon; supports next-generation secure messaging; requires continued collaboration with NIST, IETF, NCSC, and NEDO.

---

## Global:PQShield — Carahsoft Government Partnership

- **Reference ID**: Global:PQShield — Carahsoft Government Partnership
- **Title**: Carahsoft Government Partnership
- **Authors**: PQShield Ltd
- **Publication Date**: 2025-10-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: PQShield announces a strategic partnership with Carahsoft to distribute NIST PQC Standards-compliant solutions to US government agencies via key procurement contracts.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum-enabled threats
- **Migration Timeline Info**: 2035: deadline set by national cybersecurity agencies for transition to post-quantum cryptography
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NASA, NSA
- **Leaders Contributions Mentioned**: Johannes Lintzen (Author); Ben Packman (Chief Strategy Officer, PQShield)
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud; chips; applications
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST PQC Standards
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: PQShield partners with Carahsoft to simplify procurement for US government agencies; Solutions are accessible via SEWP V, OMNIA Partners, E&I Cooperative Services Contract, and The Quilt; Government agencies must transition to post-quantum cryptography by 2035 to meet NSA deadlines; NIST-aligned quantum-safe products are available today; Education and clear guidance are essential for enterprise adoption
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Compliance Officer; Policy Maker; Security Architect
- **Implementation Prerequisites**: Access to SEWP V, OMNIA Partners, E&I Cooperative Services Contract, or The Quilt contracts
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; Leaders; migration-program
- **Phase Classification Rationale**: This document represents a Guidance phase event as it announces a partnership to help government customers navigate the transition and provides clear guidance on procurement paths.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Academic
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Moves from standardization availability to commercial distribution, enabling government agencies to procure and deploy PQC solutions via established federal contracts.
- **Historical Significance**: Marks a strategic milestone where a leading PQC vendor partners with a Master Government Aggregator to accelerate adoption ahead of the 2035 national deadline.
- **Implementation Timeline Dates**: 2035: transition to post-quantum cryptography deadline
- **Successor Events & Dependencies**: Requires access to specific government contracts (SEWP V, OMNIA Partners, E&I Cooperative Services Contract, The Quilt); Enables procurement of NIST PQC Standards-compliant solutions by Federal, State, and Local Government agencies.

---

## United States:SandboxAQ — AQtive Guard Pentagon 5-Year Agreement

- **Reference ID**: United States:SandboxAQ — AQtive Guard Pentagon 5-Year Agreement
- **Title**: AQtive Guard Pentagon 5-Year Agreement
- **Authors**: SandboxAQ Inc
- **Publication Date**: 2025-12-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: SandboxAQ secures a five-year agreement with the Department of Defense CIO to deploy AQtive Guard for automated cryptographic discovery and managed PQC transition.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing rendering traditional cryptography unsafe; AI-driven cyber threats
- **Migration Timeline Info**: Gartner warning that quantum computing will render traditional cryptography unsafe by 2029
- **Applicable Regions / Bodies**: United States; Department of Defense (DoD); DoD Chief Information Officer (CIO); DISA Emerging Technology
- **Leaders Contributions Mentioned**: Jack Hidary, CEO of SandboxAQ
- **PQC Products Mentioned**: AQtive Guard
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; cryptographic assets inventory
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must urgently migrate to PQC as quantum computing threatens traditional cryptography by 2029; Automated cryptographic discovery and inventory is a foundational step for managed PQC transition; AQtive Guard enables continuous visibility into cryptographic assets to counter AI-driven threats; The DoD CIO agreement paves the way for other agencies to implement similar solutions
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Managed transition to post-quantum cryptography; automated cryptographic discovery and inventory (ACDI)
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Operations
- **Implementation Prerequisites**: Automated cryptographic discovery and inventory (ACDI); foundational understanding of cryptographic footprint
- **Relevant PQC Today Features**: Assess; Migrate; Threats; Timeline; migration-program
- **Phase Classification Rationale**: The document describes a five-year agreement following a successful demonstration during a prototype project with DISA Emerging Technology, indicating a transition from proof-of-concept to operational deployment.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Defense; Government
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from prototype demonstration to comprehensive, automated deployment across Pentagon systems, enabling a foundational understanding of the cryptographic footprint for other agencies.
- **Historical Significance**: Represents a major government commitment to deploy AI-driven PQC discovery tools at scale within the Department of Defense, setting a precedent for other agencies.
- **Implementation Timeline Dates**: Dec. 10, 2025: Agreement announced; 2029: Gartner warning date for traditional cryptography becoming unsafe
- **Successor Events & Dependencies**: Enables other DoD agencies to access and implement AQtive Guard; requires foundational understanding of cryptographic footprint across the department

---

## United States:SandboxAQ — AQtive Guard FedRAMP Ready

- **Reference ID**: United States:SandboxAQ — AQtive Guard FedRAMP Ready
- **Title**: AQtive Guard FedRAMP Ready
- **Authors**: SandboxAQ Inc
- **Publication Date**: 2025-12-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: SandboxAQ announces that its AQtive Guard platform has achieved FedRAMP Ready status to facilitate federal agency evaluation of automated cryptographic discovery and post-quantum migration planning.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Federal Risk and Authorization Management Program (FedRAMP)
- **Leaders Contributions Mentioned**: Jack Hidary, CEO of SandboxAQ
- **PQC Products Mentioned**: AQtive Guard
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: FedRAMP; SOC 2 Type I; ISO/IEC 27001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SandboxAQ achieved FedRAMP Ready status for AQtive Guard to provide a standardized evaluation path for federal agencies; The platform enables automated cryptographic discovery, inventory, and posture management; Agencies can use the tool to plan and coordinate steps toward post-quantum cryptography adoption; 79% of organizations run AI in production but only 28% have completed comprehensive AI risk assessments.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: FedRAMP Ready status; SOC 2 Type I report; ISO/IEC 27001 certificate
- **Relevant PQC Today Features**: Assess; Migrate; Compliance; pqc-risk-management; migration-program
- **Phase Classification Rationale**: The document describes a vendor achieving a regulatory readiness designation (FedRAMP Ready) that enables federal agencies to evaluate the product within a unified framework, signaling alignment with government security controls.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Defense; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from vendor readiness to market availability for federal buyers, enabling agencies to evaluate automated cryptographic discovery tools within the FedRAMP framework.
- **Historical Significance**: Represents a milestone where an AI-driven cybersecurity platform achieves standardized security controls consistent with the FedRAMP framework, facilitating post-quantum migration planning for federal entities.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Enables agencies to evaluate AQtive Guard in the FedRAMP Marketplace; Requires independent third-party assessment completion.

---

## United States:SandboxAQ/MITRE/LF — RWPQC 2025 Conference

- **Reference ID**: United States:SandboxAQ/MITRE/LF — RWPQC 2025 Conference
- **Title**: RWPQC 2025 Conference
- **Authors**: SandboxAQ MITRE and Linux Foundation PQCA
- **Publication Date**: 2025-03-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Announcement of the RWPQC 2025 conference co-hosted by SandboxAQ, MITRE, and The Linux Foundation's PQCA to advance post-quantum cryptography adoption.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum threats to modern encryption systems; challenges posed by quantum computing
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Bulgaria, United States, UK, France, Germany, South Korea; Bodies: NIST, NSA, CISA
- **Leaders Contributions Mentioned**: Dr. Marc Manzano (General Manager of the Cybersecurity Group at SandboxAQ); Dr Wen Masters (vice president of cyber technologies at MITRE); Hart Montgomery (The Linux Foundation)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; Key Management; Cloud KMS; HSM; digital infrastructures; IoT
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Cyber resilience in the quantum era requires proactive planning and strategic investment; Cross-industry collaboration is essential for cybersecurity innovation; Organizations must address regulatory and policy implications of PQC adoption; Migration strategies are needed across banking, IoT, and large-scale digital infrastructures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: transitioning to quantum-safe solutions; PQC migration
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Developer; Policy Maker; Researcher; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Leaders; Migration-program; pqc-governance; compliance-strategy; iot-ot-pqc
- **Phase Classification Rationale**: The document describes a conference designed to foster collaboration, share best practices, and provide strategic guidance on PQC migration rather than issuing a binding mandate.
- **Regulatory Mandate Level**: Informational (educational, advisory only)
- **Sector / Industry Applicability**: Government; Finance; Banking; Technology; Academic; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from research and standardization discussions to real-world application and strategic implementation planning across industries.
- **Historical Significance**: Represents the third annual conference dedicated to the intersection of cybersecurity and post-quantum cryptography, uniting global experts and policymakers.
- **Implementation Timeline Dates**: March 24–25, 2025: RWPQC 2025 conference dates; February 18, 2025: Press release date
- **Successor Events & Dependencies**: None detected

---

## Australia:ASD — ISM December 2024 Update

- **Reference ID**: Australia:ASD — ISM December 2024 Update
- **Title**: ISM December 2024 Update
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2024-12-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The Australian Signals Directorate updates the Information Security Manual with specific Post-Quantum Cryptography algorithm requirements and migration deadlines by 2030.
- **PQC Algorithms Covered**: ML-DSA, ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: DH will not be approved for use beyond 2030; PQC algorithms required by 2030
- **Applicable Regions / Bodies**: Australia; Australian Signals Directorate (ASD)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; High Assurance Cryptographic Equipment (HACE)
- **Standardization Bodies**: International Organization for Standardization (ISO); International Electrotechnical Commission (IEC); National Institute of Standards and Technology (NIST); Canadian Centre for Cyber Security
- **Compliance Frameworks Referenced**: FIPS 140-3; ISO/IEC 19790:2012; ISO/IEC 24759:2017; Common Criteria; Information Security Manual (ISM)
- **Classical Algorithms Referenced**: Diffie-Hellman (DH); Elliptic Curve Diffie-Hellman (ECDH); Elliptic Curve Digital Signature Algorithm (ECDSA); Rivest-Shamir-Adleman (RSA); Secure Hashing Algorithm 2 (SHA-2); Advanced Encryption Standard (AES)
- **Key Takeaways**: Organizations must transition from DH to ECDH or PQC algorithms by 2030; ML-DSA and ML-KEM are the approved asymmetric PQC algorithms for digital signatures and key encapsulation; SHA-3 is approved exclusively for use within ML-DSA and ML-KEM; Full disk encryption is required for data at rest protection; Cryptographic equipment must be ASD-approved or meet Common Criteria evaluations based on data classification.
- **Security Levels & Parameters**: 112 bits for non-classified, OFFICIAL: Sensitive, and PROTECTED data; 128 bits for SECRET data; 192 bits for TOP SECRET data; 2048-bit DH modulus provides 112 bits of effective security strength
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; CISO; Developer
- **Implementation Prerequisites**: ASD-Approved Cryptographic Algorithm (AACA) or high assurance cryptographic algorithm; Common Criteria evaluation against a Protection Profile for OFFICIAL: Sensitive or PROTECTED data; High Assurance Cryptographic Equipment (HACE) for SECRET or TOP SECRET data
- **Relevant PQC Today Features**: Compliance; Algorithms; Migration Program; Timeline; Crypto-Agility
- **Phase Classification Rationale**: The document represents a Guidance phase event as it provides "Guidelines for Cryptography" and specifies controls that organizations "should" comply with, such as using ECDH in preference to DH.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Moves from general cryptographic guidance to specific PQC algorithm mandates, signaling the formal adoption of ML-DSA and ML-KEM while setting a hard end-of-life for classical DH.
- **Historical Significance**: This update marks the Australian Signals Directorate's explicit inclusion of NIST-standardized PQC algorithms (ML-DSA, ML-KEM) into national security guidelines with a defined 2030 sunset date for legacy Diffie-Hellman.
- **Implementation Timeline Dates**: 2030: DH will not be approved for use beyond this year; December 2024: Document last updated
- **Successor Events & Dependencies**: Requires implementation of ML-DSA and ML-KEM in cryptographic modules; Contingent upon ASD approval of High Assurance Cryptographic Equipment (HACE) for classified data.

---

## International:BIS — Paper 158 Quantum Roadmap

- **Reference ID**: International:BIS — Paper 158 Quantum Roadmap
- **Title**: Paper 158 Quantum Roadmap
- **Authors**: Bank for International Settlements
- **Publication Date**: 2025-07-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: A framework to support the financial system in transitioning to quantum-safe cryptographic infrastructures, emphasizing early awareness and inventory.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking today's widely used encryption
- **Migration Timeline Info**: Start the transition today with broad awareness and cryptographic inventory as critical foundations; phased migration required
- **Applicable Regions / Bodies**: Global financial system; central banks
- **Leaders Contributions Mentioned**: Raphael Auer, Donna Dodson, Angela Dupont, Maryam Haghighi, Nicolas Margaine, Danica Marsden, Sarah McCarthy, Andras Valko
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Quantum-safe cryptographic infrastructures; infrastructure challenges for quantum key distribution
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Start the transition to quantum-safe cryptography today with broad awareness; conduct a cryptographic inventory as a critical foundation; avoid viewing the change as simple algorithm replacement; implement cryptographic agility, defense in depth, and hybrid models; recognize that quantum key distribution faces infrastructure challenges limiting immediate applicability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid models; cryptographic agility; defense in depth; phased migration
- **Performance & Size Considerations**: Performance trade-offs mentioned but no concrete values provided
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: Broad awareness; cryptographic inventory; coordinated planning for system integration
- **Relevant PQC Today Features**: Assess, Migrate, hybrid-crypto, crypto-agility, qkd, pqc-governance
- **Phase Classification Rationale**: The document provides a framework and emphasizes the need to start the transition today with broad awareness and cryptographic inventory as critical foundations. It explicitly offers guidance on coordinated planning rather than enforcing specific technical mandates.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial awareness to coordinated planning and cryptographic inventory, enabling the phased migration to quantum-safe infrastructures.
- **Historical Significance**: This roadmap marks a pivotal moment where the financial system is urged to begin immediate transition efforts to ensure resilience against future quantum threats by the early 2030s.
- **Implementation Timeline Dates**: early 2030s: critical systems quantum-safe; 07 July 2025: publication date
- **Successor Events & Dependencies**: cryptographic inventory; broad awareness; coordinated planning; phased migration; hybrid models; cryptographic agility
- **Extraction Note**: Base enrichment reused from library record BIS-Paper-158; timeline dimensions extracted separately

---

## Canada:ISED — PQC Best Practices Published

- **Reference ID**: Canada:ISED — PQC Best Practices Published
- **Title**: PQC Best Practices Published
- **Authors**: Innovation, Science and Economic Development Canada
- **Publication Date**: 2023-06-12
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Canadian Forum for Digital Infrastructure Resilience (CFDIR) best practices and guidelines for quantum-readiness covering algorithm selection, hybrid approaches, and migration planning.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking currently deployed public-key cryptography; significantly weakening symmetric key cryptography; risks to personal information, financial systems, utility grids, infrastructure, and national security.
- **Migration Timeline Info**: NIST on-track to publish first set of PQC standards in 2024; transition expected over many years; planning should occur now as changes are still years away.
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Forum for Digital Infrastructure Resilience (CFDIR), Quantum-Readiness Working Group (QRWG), Bank of Canada, Government of Canada (GC).
- **Leaders Contributions Mentioned**: Hisham El-Bihbety (CISO – Bank of Canada); Michele Mosca (author of "Cybersecurity in an era with quantum computers").
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Secure Socket Layer (SSL), Transport Layer Security (TLS), Kerberos, sFTP.
- **Infrastructure Layers**: PKI/CAs, Key Management (key transport, key-wrapping, initialization vectors), Digital Signatures, Identity Authentication, Privilege Authorization.
- **Standardization Bodies**: U.S. National Institute of Standards and Technology (NIST).
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must plan an orderly transition to quantum-safe cryptography over the next few years; Hybrid cryptography standards and technology are recommended for migration; Third-party vendors should be assessed using specific PQC roadmap questions; Cryptographic agility is essential for future-proofing systems; Critical Infrastructure owners need to inventory current cryptographic uses immediately.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid cryptography standards and technology; Composite certificates (implied via Annex H title); Crypto-agility exercise notes; Migration of quantum-vulnerable cryptography.
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations, Researcher.
- **Implementation Prerequisites**: Cryptographic inventory (discovery and documentation of use cases); Engagement with QSC vendors; Development of quantum-readiness questionnaires for third parties; Understanding of hybrid cryptography standards.
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Hybrid-crypto, Crypto-agility, Vendor-risk, Migration-program, Pqc-risk-management, Compliance-strategy, Pqc-governance
- **Phase Classification Rationale**: The document explicitly provides "Best Practices and Guidelines" to help organizations plan and prepare for PQC migration rather than enforcing immediate compliance. It outlines a phased approach starting with preparation and discovery.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Finance; Banking; Critical Infrastructure; Technology; Academic
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions organizations from initial awareness to structured preparation, discovery, and risk assessment phases before implementation.
- **Historical Significance**: Represents the first national framework published by Canada's financial sector working group to operationalize quantum-readiness planning across critical infrastructure.
- **Implementation Timeline Dates**: June 12, 2023; 2024
- **Successor Events & Dependencies**: NIST publication of PQC standards in 2024; availability of quantum-resistant solutions; organizational discovery and risk assessment completion
- **Extraction Note**: Base enrichment reused from library record CA-CFDIR-Quantum-Readiness-2023; timeline dimensions extracted separately

---

## Canada:CCCS — PQC Migration Roadmap Published

- **Reference ID**: Canada:CCCS — PQC Migration Roadmap Published
- **Title**: PQC Migration Roadmap Published
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: This document outlines the Canadian Centre for Cyber Security's recommended roadmap and execution phases for migrating Government of Canada IT systems to post-quantum cryptography. It provides specific milestones, governance structures, and planning guidance rather than a binding legislative mandate.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from initial awareness and threat assessment to structured preparation, identification of cryptographic assets, and execution of migration phases.
- **Historical Significance**: Represents the first formalized, whole-of-government roadmap for PQC migration in Canada, establishing a definitive timeline extending to 2035 for federal departments.
- **Implementation Timeline Dates**: June 23, 2025: Publication effective date; April 2026: Develop initial departmental PQC migration plan; End of 2031: Completion of high priority systems migration; End of 2035: Completion of remaining systems migration
- **Successor Events & Dependencies**: Development of departmental PQC migration plans; Creation of cryptographic asset inventories; Updates to ITSP.40.111 and ITSP.40.062 guidance; Procurement of PQC-compliant systems
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## Canada:TBS — SPIN Notice Published

- **Reference ID**: Canada:TBS — SPIN Notice Published
- **Title**: SPIN Notice Published
- **Authors**: Treasury Board of Canada Secretariat
- **Publication Date**: 2025-10-09
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Treasury Board of Canada Secretariat Security Policy Implementation Notice 2025-01 mandates a three-phase migration plan for Government of Canada systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptographically relevant quantum computer (CRQC); harvest now, decrypt later (HNDL) threat
- **Migration Timeline Info**: Phase 1 Preparation by April 1, 2026; Phase 2 Identification updates by April 1, 2027 and 2028; Phase 3 Transition begins April 1, 2028; High-priority systems complete by end of 2031; Remaining systems complete by end of 2035
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Treasury Board of Canada Secretariat (TBS), Canadian Centre for Cyber Security (Cyber Centre), Shared Services Canada (SSC)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: IT supply chain; cryptographic modules; network services; operating systems; applications; code development pipelines; physical information technology (IT) assets
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Policy on Government Security; Policy on Service and Digital; Directive on Security Management; Cryptographic Module Validation Program (CMVP); ITSP.40.111; ITSM.40.001; Framework for the Management of Compliance
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Departments must develop high-level PQC migration plans by April 1, 2026; All contracts with digital components entered after April 1, 2026 must include PQC procurement clauses; High-priority systems susceptible to harvest now, decrypt later threats must be identified and migrated first; Complete migration of all remaining systems is required by the end of 2035
- **Security Levels & Parameters**: Protected B information; Protected C information; Protected A information; Unclassified information
- **Hybrid & Transition Approaches**: cryptographic agility; three-phase migration plan (Preparation, Identification, Transition); upgrades versus replacement strategies
- **Performance & Size Considerations**: None detected
- **Target Audience**: Chief Information Officer (CIO), Chief Security Officer (CSO), Designated Official for Cyber Security (DOCS), Designated Official for Procurement, Deputy Heads, Compliance Officers
- **Implementation Prerequisites**: Cryptographic inventory of systems; updates to contract clauses for PQC procurement; identification of system architecture and cryptographic details; engagement with Shared Services Canada (SSC) client executive; CMVP certified cryptographic modules
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, crypto-agility, migration-program, pqc-governance, vendor-risk
- **Phase Classification Rationale**: This document is a Security Policy Implementation Notice (SPIN) that establishes mandatory requirements and specific deadlines for the Government of Canada to migrate to post-quantum cryptography. It formalizes the transition from preparation to execution through defined phases under existing government security policies.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: This document initiates a structured three-phase migration plan (Preparation, Identification, Transition) to move from current cryptographic standards to quantum-safe cryptography across all applicable government information systems.
- **Historical Significance**: This SPIN marks the formal operationalization of Canada's PQC migration strategy with binding deadlines for federal departments and Shared Services Canada to achieve quantum resilience by 2035. It addresses the "harvest now, decrypt later" threat by mandating immediate planning and inventory creation.
- **Implementation Timeline Dates**: October 9, 2025: SPIN effective; April 1, 2026: Develop high-level PQC migration plans and begin annual reporting; April 1, 2027: Update migration plans for Phase 2; April 1, 2028: Update IT system records in APM tool, identify high-priority systems, update plans for Phase 3, and begin transitioning systems; End of 2031: Complete PQC migration of high-priority systems; End of 2035: Complete PQC migration of remaining systems
- **Successor Events & Dependencies**: Development of departmental PQC migration plans; Creation of cryptographic inventory in Treasury Board Application Portfolio Management tool; Implementation of procurement clauses for PQC compliance; Transition of high-priority systems susceptible to "harvest now, decrypt later" threats; Collaboration with Shared Services Canada for infrastructure dependencies
- **Extraction Note**: Base enrichment reused from library record CA-TBS-SPIN-PQC-2025; timeline dimensions extracted separately

---

## China:CACR — CACR PQC Competition Results

- **Reference ID**: China:CACR — CACR PQC Competition Results
- **Title**: CACR PQC Competition Results
- **Authors**: Chinese Association for Cryptologic Research
- **Publication Date**: 2020-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The Chinese Association for Cryptologic Research (CACR) held a national competition from 2018 to 2020 to select post-quantum cryptographic algorithms, resulting in 36 submissions and multiple winners.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: August 2018: competition announced; February 2019: applications closed; January 2020: winners announced
- **Applicable Regions / Bodies**: Regions: China; Bodies: Chinese Association for Cryptologic Research (CACR)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: PQLR SDK; Qtunnel; TAF
- **Protocols Covered**: digital signature; public-key encryption; key agreement protocols
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Chinese Association for Cryptologic Research (CACR); ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CACR competition selected 36 algorithms with a strong preference for lattice-based solutions; Competition materials are currently only available in Chinese, limiting international access; China is expected to pursue international standardization of its PQC developments at the ISO level; The QApp team plans to integrate recognized Chinese cryptosystems into the PQLR SDK library
- **Security Levels & Parameters**: 128 bits; 256 bits; NIST levels I and V
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Standardization; Timeline; Assess; Migration-program
- **Phase Classification Rationale**: The document describes a competition held by the Chinese Association for Cryptologic Research to select promising algorithms, which is a precursor to standardization efforts. It explicitly mentions China's likely eagerness to standardize developments according to global standards like ISO.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; Academic; All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from Research to Standardization — signals formal selection of algorithms for potential national and future international standardization.
- **Historical Significance**: Represents a major national effort by China to select post-quantum algorithms parallel to the NIST competition, indicating significant influence on global data security industry standards.
- **Implementation Timeline Dates**: August 2018; February 2019; January 2020
- **Successor Events & Dependencies**: Future international level competition; Standardization at ISO level; Integration of Chinese-developed cryptosystems into PQLR SDK

---

## China:ICCS — NGCC Program Launched

- **Reference ID**: China:ICCS — NGCC Program Launched
- **Title**: NGCC Program Launched
- **Authors**: Institute of Commercial Cryptography Standards
- **Publication Date**: 2025-02-18
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: China launches an independent Next-Generation Commercial Cryptographic (NGCC) program to develop post-quantum cryptographic standards, diverging from US-led NIST efforts.
- **PQC Algorithms Covered**: CRYSTALS-Kyber; CRYSTALS-Dilithium; FALCON; SPHINCS+
- **Quantum Threats Addressed**: Quantum computers performing calculations exponentially faster than classical computers; threats to current encryption methods
- **Migration Timeline Info**: Public comments on draft guidelines open until March 15, 2025
- **Applicable Regions / Bodies**: Regions: China; Bodies: Institute of Commercial Cryptography Standards (ICCS), Chinese Cryptography Standardization Technical Committee, National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Dustin Moody (mathematician at NIST); Matt Swayne (writer, editor, analyst at The Quantum Insider)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Institute of Commercial Cryptography Standards (ICCS); Chinese Cryptography Standardization Technical Committee; National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: China is establishing independent PQC standards to avoid potential US intelligence back doors; The ICCS initiative invites global participation for algorithm proposals; NIST may incorporate strong Chinese-developed algorithms if they offer improvement; Concerns over technological self-reliance drive the divergence from US-led efforts
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Leaders; Compliance; Migration-program; pqc-governance
- **Phase Classification Rationale**: The document describes the launch of a program to solicit proposals and evaluate algorithms for national standards, explicitly stating the aim to "establish national standards for encryption."
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from research and proposal solicitation to standardization evaluation; signals the formal beginning of China's independent PQC standardization process.
- **Historical Significance**: Represents a strategic divergence from US-led global encryption standards, marking a major shift toward technological self-reliance in cryptography by a major power.
- **Implementation Timeline Dates**: March 15, 2025: public comments open for draft guidelines
- **Successor Events & Dependencies**: Requires evaluation of submitted proposals for security, performance, and feasibility; contingent on the release of final national standards by ICCS.

---

## China:China Telecom — Hybrid Quantum-Safe System Launched

- **Reference ID**: China:China Telecom — Hybrid Quantum-Safe System Launched
- **Title**: Hybrid Quantum-Safe System Launched
- **Authors**: China Telecom Quantum Group
- **Publication Date**: 2025-05-20
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: China Telecom launches a hybrid quantum-safe encryption system combining QKD and PQC across a 1,000-kilometer network spanning 16 cities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; quantum computer attacks; future quantum decryption threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: China; Beijing; Hefei; Shanghai; Guangzhou
- **Leaders Contributions Mentioned**: Matt Swayne (writer, editor, analyst at The Quantum Insider)
- **PQC Products Mentioned**: Quantum Secret; Quantum Cloud Seal
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Quantum key distribution layer; post-quantum cryptography layer; application layer
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; elliptic curve cryptography
- **Key Takeaways**: Hybrid architectures combining QKD and PQC provide redundancy against quantum threats; China Telecom has deployed a commercial-grade distributed cryptography system across 16 cities; Traditional public-key cryptography like RSA is vulnerable to Shor's algorithm; The Hefei network supports over 500 government departments and 380 state-owned firms with quantum-secure platforms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid architecture combining quantum key distribution and post-quantum cryptography; three-tier architecture for end-to-end quantum security
- **Performance & Size Considerations**: 1,000-kilometer quantum-encrypted phone call distance; 1,100 kilometers of quantum key distribution fiber in Hefei network; 8 core nodes; 159 access points
- **Target Audience**: CISO; Security Architect; Policy Maker; Government Agencies; State-Owned Enterprises
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto; qkd; migration-program; pqc-business-case; vendor-risk
- **Phase Classification Rationale**: The document describes the launch of a commercial product and its rollout across 16 cities, indicating a transition from research/demonstration to active deployment and operational use.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Telecommunications; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from demonstration (1,000km call) to commercial rollout across a nationwide backbone, enabling widespread adoption of hybrid quantum-classical systems.
- **Historical Significance**: Represents the claimed world's first distributed cryptography system resistant to quantum computer attacks combining QKD and PQC in a commercial setting.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires specialized hardware for QKD; Enables protection of sensitive data against future quantum decryption threats; Signals intent to dominate technological and commercial domains of quantum security.

---

## Czech Republic:NUKIB — Cryptographic Recommendations

- **Reference ID**: Czech Republic:NUKIB — Cryptographic Recommendations
- **Title**: Cryptographic Recommendations
- **Authors**: National Cyber and Information Security Agency
- **Publication Date**: 2023-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Czech National Cyber and Information Security Agency (NÚKIB) minimum requirements for cryptographic algorithms including PQC readiness guidance with a 2027 migration deadline.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-KEM-768, Kyber-1024, Kyber-768, FrodoKEM-1344, FrodoKEM-976, mceliece8192128, mceliece6688128, mceliece460896, mceliece8192128f, mceliece6688128f, mceliece460896f, LMS, XMSS, ML-DSA-87, SLH-DSA, CRYSTALS-Dilithium Level 5, SPHINCS+, Falcon
- **Quantum Threats Addressed**: Quantum vulnerability of classical asymmetric algorithms; quantum threat to symmetric ciphers with key lengths below 256 bits; quantum threat to hash functions with output length below 384 bits
- **Migration Timeline Info**: Valid as of February 1, 2025; 2027 deadline for key establishment migration
- **Applicable Regions / Bodies**: Regions: Czech Republic; Bodies: National Cyber and Information Security Agency (NÚKIB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, Decree No. 82/2018 Coll., Act No. 181/2014 Coll.
- **Classical Algorithms Referenced**: AES, Twofish, Camellia, Serpent, SNOW 2.0, SNOW 3G, ChaCha20, CCM, EAX, OCB1, OCB3, GCM, Poly1305, CTR, OFB, CBC, CBC-CS, CFB, HMAC, CMAC, KMAC, GMAC, EMAC2, UMAC2, XTS, EME2, DSA, EC-DSA, RSA-PSS, EC-Schnorr, DH, ECDH, ECIES-KEM, PSEC-KEM, ACE-KEM, RSA-OAEP, RSA-KEM, SHA-256, SHA-384, SHA-512, SHA-512/256, SHA3-256, SHA3-384, SHA3-512, SHAKE128, SHAKE256, Whirlpool, BLAKE2, Argon2id
- **Key Takeaways**: Organizations must migrate key establishment to quantum-resistant cryptography by 2027; Hybrid approaches combining classical and post-quantum algorithms are recommended for both key establishment and digital signatures; Symmetric ciphers with 128 or 192-bit keys are quantum-vulnerable and require 256-bit keys for resistance; Stand-alone PQC signatures like LMS and XMSS are restricted to firmware and software integrity protection; NIST standardized versions (ML-KEM, ML-DSA, SLH-DSA) are preferred over original algorithm names
- **Security Levels & Parameters**: NIST security levels 3 and 5; ML-KEM-1024; ML-KEM-768; ML-DSA-87; ML-DSA-65; AES key lengths 128, 192, 256 bits; DSA key length 3072 bits or more; EC-DSA key length 256 bits or more; SHA output length at least 256 bits (recommended 384 bits); Argon2id parameters t=1, m=2^21, p=4
- **Hybrid & Transition Approaches**: Hybrid quantum-resistant cryptography for key establishment combining PQC KEM with classical algorithms; Hybrid quantum-resistant cryptography for digital signatures combining PQC signatures with classical signatures; Security of hybrid combination preserved even if one component is broken
- **Performance & Size Considerations**: Key load limit 256 GB for ChaCha20 and ChaCha20+Poly1305; XTS sector length limit 2^20 blocks (approx 16 MB for 128-bit block cipher); Argon2id memory requirement 2 GiB or 64 MiB
- **Target Audience**: Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Implementation according to NIST standard FIPS 203 for ML-KEM; Implementation according to NIST standard FIPS 204 for ML-DSA; Implementation according to NIST standard FIPS 205 for SLH-DSA; Use of random attacker-unpredictable initialization vector for CBC and CFB modes
- **Relevant PQC Today Features**: Compliance, Migrate, Algorithms, hybrid-crypto, stateful-signatures, code-signing
- **Phase Classification Rationale**: The document explicitly issues non-binding cryptographic recommendations and lists approved algorithms to guide liable entities in preparing for the transition to quantum-resistant cryptography. It serves as a preparatory framework rather than an immediate enforcement mandate.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from classical asymmetric cryptography usage to a hybrid and stand-alone post-quantum state, enabling the replacement of quantum-vulnerable algorithms.
- **Historical Significance**: Represents the formalization of NIST-standardized PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) into national security guidance by the Czech National Cyber and Information Security Agency.
- **Implementation Timeline Dates**: February 1, 2025: document validity start date
- **Successor Events & Dependencies**: Adoption of FIPS 203, FIPS 204, and FIPS 205 standards; implementation of hybrid key establishment and digital signature schemes; future standardization of Falcon algorithm variants
- **Extraction Note**: Base enrichment reused from library record CZ-NUKIB-Crypto-Requirements-2023; timeline dimensions extracted separately

---

## Czech Republic:NUKIB — Key Establishment Migration

- **Reference ID**: Czech Republic:NUKIB — Key Establishment Migration
- **Title**: Key Establishment Migration
- **Authors**: National Cyber and Information Security Agency
- **Publication Date**: 2023-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: The document summarizes government guidelines and roadmaps specifically focused on planning, inventorying, and transitioning to post-quantum cryptography across multiple nations. It details active migration programs with defined timelines for key establishment and encryption systems.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Finance; Banking; Critical Infrastructure; Telecommunications
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial planning and inventory phases to active implementation of standards-based PQC algorithms and hybrid modes.
- **Historical Significance**: Represents a coordinated global shift where major governments have moved from theoretical research to concrete, time-bound mandates for quantum-resistant cryptography adoption.
- **Implementation Timeline Dates**: 2030: Complete transition to quantum resistant cryptography (Australia); 2025-26: Introduce standards-based PQC (Canada); 2027: Migrate key establishment and encryption (Czech Republic); 2026: Define coordinated PQC roadmap for Member States (European Union); 2024: Transition start (France); 2026-27: Transition start (New Zealand); 2035: PQC Roadmap completion (South Korea); 2025-2028: Pilot transition plan (South Korea); post-2030: Four phase approach (Spain); 2023-2033: Implement (United States)
- **Successor Events & Dependencies**: Cryptographic inventory creation; development of detailed PQC guidance; selection of PQC EU algorithms; pilot transition plans; adoption of hybrid mode for TLS.
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## European Union:ENISA — PQC Integration Study

- **Reference ID**: European Union:ENISA — PQC Integration Study
- **Title**: PQC Integration Study
- **Authors**: European Union Agency for Cybersecurity
- **Publication Date**: 2022-10-18
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: ENISA study analyzing post-standardisation challenges and providing recommendations for integrating post-quantum cryptography into existing protocols like TLS, PKI, and code signing for European organizations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: ENISA, European Union Agency for Cybersecurity
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must design new cryptographic protocols to integrate post-quantum systems; European organizations need guidance on algorithm selection and migration priorities; Integration challenges exist specifically for TLS, PKI, and code signing; Stakeholder awareness and risk analysis are necessary in evolving threat landscapes.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Compliance Officer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: tls-basics, pki-workshop, code-signing, migration-program, pqc-risk-management
- **Phase Classification Rationale**: The document is an ENISA report explicitly designed to provide insight on post-standardisation challenges and explore the necessity of integrating post-quantum systems into existing protocols. It serves as a strategic overview rather than a binding regulation or technical specification.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from the current state assessment (2021 study) to exploring post-standardisation challenges and the necessity of designing new cryptographic protocols.
- **Historical Significance**: This report marks ENISA's shift from assessing the current state of quantum threats to addressing the practical integration challenges following standardization efforts. It establishes a framework for understanding the transition to post-quantum systems within the EU context.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Designing new cryptographic protocols; integrating post-quantum systems into existing protocols
- **Extraction Note**: Base enrichment reused from library record ENISA-PQC-Integration-Study-2022; timeline dimensions extracted separately

---

## European Union:EC — EU PQC Recommendation Published

- **Reference ID**: European Union:EC — EU PQC Recommendation Published
- **Title**: EU PQC Recommendation Published
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: EU Commission Recommendation encouraging Member States to develop a coordinated strategy and joint implementation roadmap for Post-Quantum Cryptography adoption in public sectors and critical infrastructures by 2030.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Target 2030 for critical systems; definition of a joint Post-Quantum Cryptography Implementation Roadmap with clear goals, milestones, and timelines.
- **Applicable Regions / Bodies**: Regions: Union (European Union); Bodies: Member States, public sectors, Commission.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Critical infrastructures; existing public administration systems.
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must develop a comprehensive strategy for Post-Quantum Cryptography adoption; Transition should be coordinated and synchronized across different Member States and public sectors; Deployment should utilize hybrid schemes combining Post-Quantum Cryptography with existing cryptographic approaches or Quantum Key Distribution.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid schemes combining Post-Quantum Cryptography with existing cryptographic approaches or with Quantum Key Distribution.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: Definition of clear goals, milestones, and timelines; development of a comprehensive strategy for adoption.
- **Relevant PQC Today Features**: Timeline, hybrid-crypto, qkd, migration-program, pqc-governance
- **Phase Classification Rationale**: This document is a Commission Recommendation encouraging Member States to develop strategies and roadmaps, which defines policy direction without imposing binding legal obligations. It represents the Policy phase by establishing a coordinated framework for PQC adoption across the EU public sector.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: Transitions from initial policy formulation to the development of comprehensive national strategies and joint implementation roadmaps for deploying PQC technologies.
- **Historical Significance**: This is the first EU-wide coordinated recommendation specifically mandating a synchronized transition roadmap for Post-Quantum Cryptography across Member States' public sectors.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Development of comprehensive national strategies; Definition of joint PQC Implementation Roadmap; Deployment of PQC technologies via hybrid schemes
- **Extraction Note**: Base enrichment reused from library record EU PQC Recommendation; timeline dimensions extracted separately

---

## European Union:EC — Critical Infrastructure Migration

- **Reference ID**: European Union:EC — Critical Infrastructure Migration
- **Title**: Critical Infrastructure Migration
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The EU NIS Cooperation Group issued a coordinated implementation roadmap and timeline for the transition to Post-Quantum Cryptography across EU Member States.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing identified as a threat to cryptographic algorithms protecting confidentiality and authenticity of data
- **Migration Timeline Info**: Commission published Recommendation on 11 April 2024; document issued 23 June 2025
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: EU NIS Cooperation Group, Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must implement recommendations for a synchronised transition to PQC; Stakeholders need to be informed on the quantum threat to cryptography; A work stream on PQC was established with the NIS Cooperation Group; The roadmap provides harmonized timelines and priority sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: Establishment of a work stream on PQC with the NIS Cooperation Group; Implementation of recommendations for synchronised transition
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, pqc-governance
- **Phase Classification Rationale**: The document explicitly outlines a roadmap and timeline for the transition to Post-Quantum Cryptography, targeting Member States to implement recommendations for a synchronized migration of critical systems. It addresses the threat of quantum computing to existing cryptographic algorithms by proposing coordinated measures for adoption.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Critical Infrastructure; Government
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from the identification of quantum threats to a coordinated implementation phase where Member States begin adopting PQC measures.
- **Historical Significance**: This document marks the first high-level deliverable from the EU Commission and Member States establishing a synchronized roadmap for PQC adoption across Europe. It formalizes the establishment of a work stream on PQC within the NIS Cooperation Group to guide national transitions.
- **Implementation Timeline Dates**: 11 April 2024: Commission published Recommendation; 23 June 2025: Roadmap publication date
- **Successor Events & Dependencies**: Establishment of a work stream on PQC with the NIS Cooperation Group; Member States implementing recommendations for synchronized transition
- **Extraction Note**: Base enrichment reused from library record EU-NIS-CG-Roadmap-v1.1; timeline dimensions extracted separately

---

## European Union:Europol — QSFF Call to Action

- **Reference ID**: European Union:Europol — QSFF Call to Action
- **Title**: QSFF Call to Action
- **Authors**: European Union Agency for Law Enforcement Cooperation
- **Publication Date**: 2025-02-07
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Europol calls on European financial institutions to begin immediate PQC migration planning to address harvest-now-decrypt-later threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later
- **Migration Timeline Info**: Immediate PQC migration planning recommended
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: Europol
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: European financial institutions must begin immediate PQC migration planning; Harvest-now-decrypt-later poses a threat to financial data; A coordinated sector response is recommended
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, pqc-risk-management, migration-program
- **Phase Classification Rationale**: The document represents a Guidance phase as it is a call to action from Europol highlighting executive unpreparedness rather than issuing a binding regulation. It serves to inform stakeholders of the current readiness gap in the financial sector.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from awareness to urgent preparation by highlighting that 86% of executives are unprepared.
- **Historical Significance**: This milestone marks a critical warning from Europol regarding the lack of quantum readiness among financial sector leadership.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record Europol-QSFF-Call-to-Action-2025; timeline dimensions extracted separately

---

## European Union:NIS CG — EU PQC Survey Launched

- **Reference ID**: European Union:NIS CG — EU PQC Survey Launched
- **Title**: EU PQC Survey Launched
- **Authors**: NIS Cooperation Group
- **Publication Date**: 2025-08-11
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The NIS Cooperation Group has launched a public survey to gather feedback on the Coordinated Implementation Roadmap for Post-Quantum Cryptography transition in Europe.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Feedback deadline September 29, 2025; Publication of updated/additional roadmap pending feedback review.
- **Applicable Regions / Bodies**: Regions: Europe; Bodies: NIS Cooperation Group, Directorate-General for Communications Networks, Content and Technology, European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Critical infrastructures
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Public consultation is open until September 29, 2025 for feedback on the PQC roadmap; Providers of critical infrastructures and industry stakeholders are specifically invited to contribute; Submissions may include concrete proposals or mentions of beneficial open-source tools; Product advertisements will not be accepted in the consultation process.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Migrate; Assess; pqc-governance; migration-program
- **Phase Classification Rationale**: This document represents a Policy phase event as it announces a public consultation by the NIS Cooperation Group to gather feedback on an official "Coordinated Implementation Roadmap" to guide the transition to quantum-safe infrastructure.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Critical Infrastructure; Technology; Academic; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from the publication of an initial roadmap to a feedback collection phase that will inform the creation of an updated or additional roadmap.
- **Historical Significance**: Represents a coordinated European effort to engage stakeholders in shaping the next steps for PQC migration following the initial roadmap publication.
- **Implementation Timeline Dates**: 29 September 2025, 18:00 CEST
- **Successor Events & Dependencies**: Publication of an updated/additional roadmap contingent on the review of feedback and promising proposals from the consultation.

---

## European Union:ECCG — Agreed Cryptographic Algorithms v2

- **Reference ID**: European Union:ECCG — Agreed Cryptographic Algorithms v2
- **Title**: Agreed Cryptographic Algorithms v2
- **Authors**: European Cybersecurity Certification Group
- **Publication Date**: 2025-05-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Overview of global government roadmaps and regulatory guidance for transitioning to post-quantum cryptography, including timelines for US, Canada, EU, UK, Australia, and Japan.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest-now-decrypt-later attacks; quantum computing vulnerability in early 2030s
- **Migration Timeline Info**: US CNSA 2.0: 2025 signatures/browsers, 2026 networking, 2027 OS, 2030 legacy phase-out, 2035 full transition; Canada: 2026 planning, 2031 high-risk completion, 2035 full completion; EU: 2026 initial roadmaps, 2030 high-risk implementation, 2035 full transition; UK: 2028 discovery, 2028-31 pilot, 2031-35 adoption; Australia: 2026 plan, 2028 critical systems start, 2030 asymmetric crypto ban; Japan: 2030 Cryptography Problem focus
- **Applicable Regions / Bodies**: United States (CNSA 2.0); Canada (Government of Canada, Canadian Centre for Cyber Security); European Union (European Commission, NIS Cooperation group, ENISA); United Kingdom (NCSC); Australia (Australian Signals Directorate); Japan (CRYPTREC, Cabinet Office)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI (implied by signatures/certificates); Cloud servers; Operating systems; VPNs; Routers; Legacy systems
- **Standardization Bodies**: NIST (referenced via CNSA 2.0 context and PQShield description); ENISA; CRYPTREC
- **Compliance Frameworks Referenced**: CNSA 2.0; ECCG Agreed Cryptographic Algorithms v2; Australian Signals Directorate Information Security Manual
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting 2035 as a common target for full PQC transition; Hybrid schemes and adjusted symmetric key lengths are recommended to mitigate risks in new mechanisms; Organizations must inventory vulnerable systems and prioritize high-risk assets before 2028; Traditional asymmetric cryptography is mandated to be phased out by 2030 in Australia; Transition strategies emphasize centralized management and testing to avoid fragmented security risks
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQ/T hybrid schemes; standardized and tested hybrid solutions; dual-track approach (PQC and QKD); phased transition; centrally-managed migration
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker; Developer
- **Implementation Prerequisites**: Cryptographic inventory of vulnerable systems; departmental migration plan; testing and validation in test environments; understanding of current estate; prioritization based on sensitive assets
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Assess; qkd; hybrid-crypto; crypto-agility; migration-program; pqc-governance
- **Phase Classification Rationale**: The document outlines "roadmaps," "guidance," and "recommendations" from multiple governments, explicitly stating that users should develop plans and transition systems rather than mandating immediate legal enforcement for all entities.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Defense; Healthcare; Telecommunications; Technology; Critical Infrastructure; Finance; Banking; Transportation; Energy
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from awareness and planning phases to active implementation and pilot testing, signaling the shift from theoretical preparation to mandatory operational migration for national security and critical systems.
- **Historical Significance**: Represents a coordinated global effort where major nations have established synchronized 2035 deadlines for full PQC adoption, marking the transition of quantum resistance from an optional upgrade to a strategic imperative.
- **Implementation Timeline Dates**: 2025: New software and firmware signatures; 2025: Web browsers, servers and cloud servers; 2026: Traditional networking equipment such as VPNs and routers; 2027: New NSS, operating systems; 2030: Legacy systems unable to support CNSA 2.0 phased out; 2035: All NSS quantum-resistant; April 2026: Develop an initial departmental migration plan; End of 2031: Completion of PQC migration of high-risk, high-priority systems; End of 2035: Completion of PQC migration of remaining systems; 31 Dec 2026: Initial national transition roadmaps and first steps; 31 Dec 2030: High-risk use cases and next steps implemented; 31 Dec 2035: Full transition; 2028: Discover and plan; 2028-31: Prioritize and pilot; 2031-35: Complete adoption; End of 2026: Develop a refined plan for transition; End of 2028: Commencing transition of critical systems and data; End of 2030: Traditional asymmetric cryptography must not be used
- **Successor Events & Dependencies**: Requires development of departmental migration plans by 2026; Enables full PQC migration completion by 2035; Contingent on the availability of CNSA 2.0 compliant algorithms and hybrid solutions.

---

## France:ANSSI — Initial PQC Position Paper

- **Reference ID**: France:ANSSI — Initial PQC Position Paper
- **Title**: Initial PQC Position Paper
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: ANSSI presents France's position on PQC transition, advocating hybrid schemes and providing phased guidance for government and regulated entities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, BetaGouv, Direction interministérielle du numérique
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid post-quantum/classical schemes are the primary migration path; A phased approach is recommended for transition; Guidance applies to French government and regulated entities
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid post-quantum/classical schemes; Phased approach guidance
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, migration-program, pqc-governance, compliance-strategy
- **Phase Classification Rationale**: The document is explicitly titled an "Initial PQC Position Paper" and describes the publication of a position mandating a hybrid approach, which characterizes a guidance phase event.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: Transitions from initial assessment to formalized guidance by mandating a hybrid approach for the transition.
- **Historical Significance**: Represents ANSSI's initial formal stance on PQC, establishing a mandatory hybrid framework for the French cybersecurity landscape.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-Position-2022; timeline dimensions extracted separately

---

## France:ANSSI — PQC Position Paper Follow-up

- **Reference ID**: France:ANSSI — PQC Position Paper Follow-up
- **Title**: PQC Position Paper Follow-up
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2023-12-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record ANSSI PQC Follow-up Paper; timeline dimensions extracted separately

---

## France:ANSSI/BSI/NLNCSA/SE — Joint QKD Position Paper

- **Reference ID**: France:ANSSI/BSI/NLNCSA/SE — Joint QKD Position Paper
- **Title**: Joint QKD Position Paper
- **Authors**: ANSSI, BSI, NLNCSA, Swedish NCSA
- **Publication Date**: 2024-01-26
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Joint position paper concluding that QKD is insufficient for most government communications and recommending PQC as the primary quantum-safe approach with QKD as a complementary niche solution.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; store-now-decrypt-later scenario
- **Migration Timeline Info**: First selection of NIST standards will be available sometime in 2024
- **Applicable Regions / Bodies**: Bodies: French Cybersecurity Agency (ANSSI); Federal Office for Information Security (BSI); Netherlands National Communications Security Agency (NLNCSA); Swedish National Communications Security Authority, Swedish Armed Forces; European Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: QKD protocols; one-time pad scheme
- **Infrastructure Layers**: Public-key infrastructure; trusted nodes; quantum communication networks; EuroQCI project
- **Standardization Bodies**: NIST; ISO
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES; symmetric keying; symmetric message authentication
- **Key Takeaways**: QKD is currently only viable for niche use cases due to technological limitations and high costs; migration to post-quantum cryptography and symmetric keying should be the clear priority for quantum-safe key establishment; QKD implementations lack rigorous standardization and comprehensive security proofs compared to PQC; practical QKD systems cannot achieve end-to-end security over long distances without trusted nodes; claims of absolute security for QKD do not apply to actual implementations due to device imperfections
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Use of pre-shared symmetric keys in combination with classically secure public-key cryptography; use of post-quantum signature schemes with an associated public-key infrastructure for QKD authentication
- **Performance & Size Considerations**: Commercial QKD systems typically reach about one hundred kilometres; QKD demonstrations at present can reach at most a few hundred kilometres; QKD channel bandwidth must equal classical data channel bandwidth for one-time pad security
- **Target Audience**: Policy Maker; Security Architect; General audience
- **Implementation Prerequisites**: Specialised hardware such as single-photon sources and detectors; pre-shared secret keys for authentication; quantum repeaters (not practical at present); satellite infrastructure
- **Relevant PQC Today Features**: qkd, threats, migration-program, pqc-risk-management, compliance-strategy
- **Phase Classification Rationale**: This document represents a Guidance phase event as it is a joint position paper from national cybersecurity agencies explicitly recommending the prioritization of PQC over QKD due to current technological limitations and maturity issues.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Telecommunications; Defense
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from theoretical exploration of QKD to practical guidance favoring PQC migration and symmetric keying for immediate quantum-safe needs.
- **Historical Significance**: This milestone marks a unified stance by major European cybersecurity agencies (ANSSI, BSI, NLNCSA, Swedish NCSA) clarifying that QKD is not a viable primary solution for general quantum-safe cryptography compared to PQC.
- **Implementation Timeline Dates**: 2024: first selection of NIST standards will be available; January 26, 2024: publication date
- **Successor Events & Dependencies**: Migration to post-quantum cryptography; adoption of symmetric keying; development of standardized QKD protocols with rigorous security proofs
- **Extraction Note**: Base enrichment reused from library record BSI-ANSSI-QKD-Position-2024; timeline dimensions extracted separately

---

## France:ANSSI — PQC Market Studies Published

- **Reference ID**: France:ANSSI — PQC Market Studies Published
- **Title**: PQC Market Studies Published
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2024-11-25
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: ANSSI published two market studies assessing PQC readiness among French cybersecurity developers and consultants, revealing significant preparedness gaps.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: store now, decrypt later; collapse of public key cryptography security
- **Migration Timeline Info**: Studies conducted between July 2023 and January 2024; no specific migration deadlines stated
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI (Agence nationale de la sécurité des systèmes d'information)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: digital infrastructures; public key cryptography
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Significant preparedness gaps exist in the French cybersecurity ecosystem regarding PQC; The threat of store now, decrypt later attacks requires immediate risk consideration; ANSSI will launch practical actions to assist industry transition based on study findings; Public availability of studies aims to sensitize the ecosystem to early PQC transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Policy Maker; Consultant
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Assess; Migration-program; pqc-risk-management; compliance-strategy
- **Phase Classification Rationale**: The document describes market studies conducted to understand the state of knowledge and advancement in PQC, serving as a foundation for future practical actions rather than enforcing immediate mandates.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Technology; Critical Infrastructure
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from Research to Planning — signals the collection of baseline data to inform future practical actions and support for industrial transition.
- **Historical Significance**: Represents ANSSI's initial market assessment to establish a baseline for PQC readiness within the French cybersecurity ecosystem before launching formal support programs.
- **Implementation Timeline Dates**: July 2023; January 2024
- **Successor Events & Dependencies**: Enables a future series of practical actions by ANSSI to assist cybersecurity industries and beneficiaries in their transition to PQC.

---

## France:ANSSI — Cryptographic Accreditation Doctrine Updated

- **Reference ID**: France:ANSSI — Cryptographic Accreditation Doctrine Updated
- **Title**: Cryptographic Accreditation Doctrine Updated
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-03-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: ANSSI updates its cryptographic accreditation doctrine to include PQC evaluation requirements and issues France's first security certifications for products containing lattice-based post-quantum cryptography.
- **PQC Algorithms Covered**: cryptographie post-quantique à base de réseaux euclidiens
- **Quantum Threats Addressed**: menace quantique; ordinateur quantique
- **Migration Timeline Info**: 2027: obligation d'intégrer de la PQC lors de l'entrée en qualification de solutions de cryptographie pour certaines typologies de produits
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, Centre de Certification National (CCN), CEA-Leti
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Smartcard MultiApp 5.2 Premium PQC; Microcontrôleur S3SSE2A
- **Protocols Covered**: IPsecDR
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ANSSI; ECCG
- **Compliance Frameworks Referenced**: Critères Communs (CC); Visa de sécurité ANSSI; PG-083; RGS
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: France has issued its first security certifications for products integrating lattice-based PQC algorithms; ANSSI will mandate PQC integration in cryptographic solution qualifications starting in 2027 for certain product types; The CCN updated its accreditation doctrine in March 2025 to support PQC evaluation; CESTI centers are developing competencies to evaluate hybrid mechanisms and side-channel attacks on PQC algorithms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: évaluation des mécanismes hybrides
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: agrément CESTI pour évaluer des solutions intégrant de la PQC; mise à jour de la doctrine d'agrément cryptographique
- **Relevant PQC Today Features**: Compliance; Migration-program; Algorithms; hsm-pqc; digital-id
- **Phase Classification Rationale**: The document describes the update of the "doctrine d'agrément cryptographique" by ANSSI and the issuance of the first official certifications, marking a shift from preparation to formal standardization and regulatory enforcement.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from doctrine update and evaluator accreditation to the issuance of first certifications and sets a mandatory integration requirement for future qualifications.
- **Historical Significance**: Represents the first issuance of security certifications in France for products containing post-quantum cryptography algorithms based on Euclidean lattices.
- **Implementation Timeline Dates**: mars 2025: mise à jour de la doctrine d'agrément cryptographique; 29 septembre 2025: agrément du CESTI CEA-Leti et certification Thales; 1er octobre 2025: certification Samsung; 2027: obligation d'intégrer de la PQC pour certaines typologies de produits
- **Successor Events & Dependencies**: Requires the accreditation of additional CESTI centers; Enables the mandatory integration of PQC in cryptographic solution qualifications starting in 2027.

---

## France:ANSSI — PQC FAQ Published

- **Reference ID**: France:ANSSI — PQC FAQ Published
- **Title**: PQC FAQ Published
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-10-07
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: ANSSI FAQ providing guidance on post-quantum cryptography algorithm selection, hybrid approaches, migration timelines, and practical steps for French organizations.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Start inventory immediately; PQC obligations for product qualification from 2027; unreasonable to buy non-PQC products after 2030; guide updates expected by end of 2025.
- **Applicable Regions / Bodies**: Regions: France, European Union; Bodies: ANSSI, Commission européenne
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI/IGC, systèmes embarqués
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: Référentiel général de sécurité, dispositif SAIV, Visas de sécurité ANSSI
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must start a cryptographic inventory immediately to identify critical data and usage cases; Hybridation is essential for short and medium term except for hash-based signatures; It will be unreasonable to purchase products without PQC after 2030; Regulatory obligations for PQC in product qualification begin in 2027.
- **Security Levels & Parameters**: IND-CCA2
- **Hybrid & Transition Approaches**: Hybridation (combining post-quantum and pre-quantum algorithms), CatKDF, CasKDF, crypto-agilité, signature concatenation, non-séparabilité
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory; identification of critical data and usage cases; contact suppliers for roadmaps; renewal calendar planning; awareness of side-channel and fault injection attacks in embedded systems.
- **Relevant PQC Today Features**: Timeline, hybrid-crypto, crypto-agility, pki-workshop, iot-ot-pqc, compliance-strategy
- **Phase Classification Rationale**: This document represents a Guidance phase as it provides non-binding recommendations, best practices, and strategic timelines from ANSSI rather than immediate legal mandates for all entities. It explicitly states that current PQC pre-conclusions do not have regulatory obligation character outside specific regulated perimeters.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: All Sectors; Defense; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions organizations from initial risk analysis and inventory phases to active planning for hybrid implementation and product qualification updates.
- **Historical Significance**: Marks a pivotal shift where ANSSI sets a 2030 market expectation for PQC integration and establishes a 2027 qualification requirement, formalizing the transition from theoretical preparation to mandatory product standards for regulated sectors.
- **Implementation Timeline Dates**: 2025: European roadmap publication; 2027: PQC obligations for product qualification entry; 2030: Deadline after which buying non-PQC products is unreasonable
- **Successor Events & Dependencies**: Update of ANSSI cryptographic mechanisms guide by end of 2025; Publication of technical advice on crypto-agility by end of year; Evolution of regulatory texts for classified defense data and SIIV systems
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-FAQ-2025; timeline dimensions extracted separately

---

## International:GSMA — PQ.03 v2.0 Guidelines

- **Reference ID**: International:GSMA — PQ.03 v2.0 Guidelines
- **Title**: PQ.03 v2.0 Guidelines
- **Authors**: GSM Association
- **Publication Date**: 2024-10-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: GSMA PQ.03 v2.0 provides updated Post-Quantum Cryptography guidelines for telecom use cases including 5G, SIM/eSIM, roaming, and IMS.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKE, X.509
- **Infrastructure Layers**: PKI, Public Key Infrastructure, Cloud Infrastructure, Firmware, Constrained Devices
- **Standardization Bodies**: IETF, GSM Association
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Mobile network operators must conduct cryptographic discovery and analysis before remediation; Hybrid schemes are recommended for migration to ensure interoperability; Migration planning requires prioritization based on business risk analysis; Zero Trust Architecture considerations are essential in the context of PQC; Legacy systems and constrained devices present specific implementation challenges.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Schemes, Hybrid X.509 overview, Mixing Algorithms, Crypto-Agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Operations, Policy Maker
- **Implementation Prerequisites**: Cryptographic Inventory; Firmware Validation; Middleware Compatibility; Infrastructure Capacity assessment; Vendor Migration Strategy alignment
- **Relevant PQC Today Features**: 5g-security, migration-program, pqc-governance, hybrid-crypto, crypto-agility
- **Phase Classification Rationale**: The document is explicitly titled "Guidelines for Telecom Use Cases" and provides structured recommendations for planning, prioritization, and execution of PQC migration within the telecom sector. It outlines a phased approach including capability development, risk analysis, and remediation rather than enforcing mandatory compliance.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Telecommunications
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from initial awareness and capability development to detailed planning, prioritization, and remediation execution phases for telecom operators.
- **Historical Significance**: Represents a formalized industry-specific framework by the GSMA for Post Quantum Cryptography adoption in telecommunications, published in October 2024 as Version 2.0.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Vendor Migration Strategy; Operator Migration Strategy; Standards, certification, regulation guidance and legislation; Zero Trust Architecture Framework Consideration
- **Extraction Note**: Base enrichment reused from library record GSMA-PQ03-v2-2024; timeline dimensions extracted separately

---

## Germany:BSI — EU Joint Statement on PQC

- **Reference ID**: Germany:BSI — EU Joint Statement on PQC
- **Title**: EU Joint Statement on PQC
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2024-11-27
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Joint statement by 21 EU member state cybersecurity agencies urging coordinated PQC migration and endorsing NIST-standardized algorithms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: BSI, ANSSI, NCSC-NL
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: 21 EU member state agencies urge coordinated PQC migration; Organizations should adopt common migration principles; NIST-standardized algorithms are endorsed for European organizations
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, CISO, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program, pqc-governance, compliance-strategy, algorithms, leaders
- **Phase Classification Rationale**: The document represents a Policy phase event as it is a joint statement by government bodies (BSI and EU member states) explicitly urging a transition to PQC. It establishes a coordinated political stance rather than technical implementation details.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial standardization awareness to coordinated governmental policy advocacy for migration.
- **Historical Significance**: This milestone marks the first unified call to action by a significant bloc of EU nations, signaling a shift toward collective regulatory pressure for PQC adoption.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record EU-BSI-PQC-Joint-Statement-2024; timeline dimensions extracted separately

---

## Germany:BSI — TR-02102-1 PQC Update

- **Reference ID**: Germany:BSI — TR-02102-1 PQC Update
- **Title**: TR-02102-1 PQC Update
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: BSI publishes Version 2025-01 of TR-02102-1 providing recommendations for migrating to post-quantum cryptography including ML-KEM and ML-DSA.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: store now, decrypt later; cryptanalysis of algorithms used
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Germany; BSI; 17 other European states; three more European states
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Migration to post-quantum cryptography should be pushed forward independently of quantum computer availability; Post-quantum schemes should only be used in combination with classical schemes (hybrid) if possible; Key-agreement schemes are primarily threatened by "store now, decrypt later" attacks; Quantum Key Distribution is currently not sufficiently mature from a security perspective for general use
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid approach; cryptographic agility; combination with classical schemes
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd; hybrid-crypto; crypto-agility; pqc-risk-management; migration-program
- **Phase Classification Rationale**: The document represents a Guidance phase event as it explicitly states that "recommendations" are published and uses language such as "should be pushed forward" and "care should be taken," indicating advisory rather than mandatory directives.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from initial standardization awareness to active migration guidance, urging industry and public administration to start the transition to Post-Quantum Cryptography.
- **Historical Significance**: This update represents a significant step in European PQC adoption by formalizing recommendations for ML-KEM and ML-DSA within the BSI technical guideline TR-02102-1 Version 2025-01.
- **Implementation Timeline Dates**: November 2024: joint-statement on Post-Quantum Cryptography published; December 2021: guideline "Quantum-safe cryptography – fundamentals, current developments and recommendations" published; April 2020: recommendations for "Migration to Post Quantum Cryptography" published
- **Successor Events & Dependencies**: Requires industry, critical infrastructure providers, and public administration to start the transition; contingent on the development of cryptographically relevant quantum computers for full threat realization.

---

## Germany:BSI/Bundesdruckerei — Quantum-Secure ID Card Demonstrator

- **Reference ID**: Germany:BSI/Bundesdruckerei — Quantum-Secure ID Card Demonstrator
- **Title**: Quantum-Secure ID Card Demonstrator
- **Authors**: BSI with Bundesdruckerei and G+D
- **Publication Date**: 2025-11-10
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Unveiling of the world's first functional quantum-secure ID card demonstrator developed by Bundesdruckerei, G+D, BSI, and Infineon for Germany's national identity documents.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Breaking established cryptographic systems specifically key exchange and digital signature schemes; computation of discrete logarithms or prime factorizations faster than classical computers
- **Migration Timeline Info**: EU roadmap calls for PQC adoption in critical and high-risk applications by 2030; assumption that by 2030 quantum computers will be capable of breaking today's cryptographic algorithms
- **Applicable Regions / Bodies**: Regions: Germany; Bodies: German Federal Office for Information Security (BSI), Bundesdruckerei GmbH, Giesecke+Devrient (G+D), Infineon, Fraunhofer Institute
- **Leaders Contributions Mentioned**: Dr. Kim Nguyen (Senior Vice President of Innovation at Bundesdruckerei); Gabriel von Mitschke-Collande (Member of the Management Board and Group CDO at G+D); Claudia Plattner (President of the BSI)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: ID chips; secure hardware components; specialized chips
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Germany is transitioning to quantum-secure ID cards in two stages starting with protecting personal data from forgery; PQC adoption in critical applications is targeted by 2030 per EU roadmap; Infineon chips feature new designs supporting fast, side-channel-resistant software implementation of PQC algorithms; The demonstrator combines classical and post-quantum cryptography following latest recommendations
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Combines classical and post-quantum cryptography; transition occurs in two stages with the first phase protecting personal data using quantum-resistant digital signature schemes
- **Performance & Size Considerations**: Minimizing computational footprint of resource-intensive PQC algorithms; fast software implementation of PQC algorithms
- **Target Audience**: Security Architect, Policy Maker, Government Official, CISO
- **Implementation Prerequisites**: Specialized chips produced by Infineon with new design supporting side-channel-resistant software; meeting new security requirements while minimizing computational footprint
- **Relevant PQC Today Features**: digital-id; hybrid-crypto; migration-program; pqc-risk-management; government-sector
- **Phase Classification Rationale**: The document describes a "demonstrator" and "proof of concept" representing a functional implementation that combines classical and post-quantum cryptography, indicating a testing phase before full deployment.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from research and concept development to functional demonstration, enabling the two-stage transition plan for national ID cards starting with quantum-resistant signatures.
- **Historical Significance**: Represents one of the world's first functional implementations of a national ID card combining classical and post-quantum cryptography, marking a decisive step toward future security of digital identities in Germany.
- **Implementation Timeline Dates**: 2030: PQC adoption required for critical and high-risk applications per EU roadmap; 2030: quantum computers assumed capable of breaking today's cryptographic algorithms
- **Successor Events & Dependencies**: Enables the first phase of transition protecting personal data from forgery using quantum-resistant digital signature schemes; requires specialized Infineon chips with new design supporting PQC.

---

## Germany:BSI/DLR — QUANTITY Initiative Launched

- **Reference ID**: Germany:BSI/DLR — QUANTITY Initiative Launched
- **Title**: QUANTITY Initiative Launched
- **Authors**: BSI with German Aerospace Center
- **Publication Date**: 2025-03-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Analysis of lattice-based key exchange implementations for compliance with BSI TR-02102-1 guidelines, highlighting vulnerabilities and performance metrics.
- **PQC Algorithms Covered**: ML-KEM, FrodoKEM, Classic McEliece
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Germany; Bodies: BSI, DLR
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: NIST; BSI
- **Compliance Frameworks Referenced**: BSI TR-02102-1; AIS 20/31
- **Classical Algorithms Referenced**: X25519, ECDH, RSA, AES-192, AES-256
- **Key Takeaways**: Implement hybrid modes combining classical and post-quantum algorithms as recommended by BSI; Side-channel vulnerabilities are frequent in randomness generation and error sampling routines; FrodoKEM offers superior side-channel resistance but incurs significant performance costs; Organizations must budget for 15-25% increases in cryptographic infrastructure costs during transition.
- **Security Levels & Parameters**: ML-KEM-768 (~AES-192); ML-KEM-1024 (~AES-256); FrodoKEM-976 (~AES-192); FrodoKEM-1344 (~AES-256); Minimum 120-bit security; Recommended 128-bit security
- **Hybrid & Transition Approaches**: Hybrid mode with classical mechanisms; Cryptographic agility; Dual-stack deployment implied via hybrid recommendation
- **Performance & Size Considerations**: ML-KEM-768 public key 1,184 bytes; ML-KEM-768 ciphertext 1,088 bytes; ML-KEM-768 encapsulation ~0.11 ms; FrodoKEM-976 public key 15,632 bytes; FrodoKEM-976 ciphertext 15,744 bytes; FrodoKEM-976 encapsulation 1.80 ms; Classic McEliece public key 1,044,992 bytes; ML-KEM ~2x slower than X25519; FrodoKEM up to ~10x slower than ECDH
- **Target Audience**: Developer; Security Architect; Compliance Officer; Researcher
- **Implementation Prerequisites**: BSI TR-02102-1 compliance; Cryptographically secure randomness (PTRNG or DRNG per AIS 20/31); Constant-time implementation; Comprehensive side-channel evaluation; Hardware upgrades for bandwidth and computation
- **Relevant PQC Today Features**: Compliance; Algorithms; hybrid-crypto; crypto-agility; entropy-randomness; pqc-risk-management
- **Phase Classification Rationale**: The document is a research report synthesizing findings from laboratory evaluations of post-quantum implementations, identifying vulnerability patterns and proposing solutions rather than mandating immediate deployment.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Defense; Government; Technology; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from Research to Implementation Guidance — signals the availability of practical solutions and compliance checklists for organizations preparing to deploy BSI-compliant systems.
- **Historical Significance**: Represents a detailed evaluation of real-world implementation pitfalls for BSI TR-02102-1 compliance, highlighting the gap between theoretical security and practical deployment in German federal contexts.
- **Implementation Timeline Dates**: March 2025: QUANTITY initiative launched; June 2025: Report published; 2025: BSI strongly recommends hybrid mode; 2024-2025: Implementation cost data period
- **Successor Events & Dependencies**: Requires adherence to BSI TR-02102-1 updates; Enables deployment of ML-KEM and FrodoKEM in hybrid modes; Contingent on ongoing cryptanalysis from the QUANTITY initiative.

---

## India:TEC — TEC Technical Report Published

- **Reference ID**: India:TEC — TEC Technical Report Published
- **Title**: TEC Technical Report Published
- **Authors**: Telecommunication Engineering Centre
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Technical report by India's Telecommunication Engineering Centre on migrating to post-quantum cryptography, covering algorithm selection, hybrid approaches, and implementation guidance for telecom operators.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; Shor's Algorithm; Grover's Algorithm; Man-in-the-Middle Attacks; Individual Attacks; Threat to Digital Signatures; Data Breaches; Document Integrity compromise
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: India; Telecommunication Engineering Centre (TEC); Department of Telecommunications; Ministry of Communications; Government of India
- **Leaders Contributions Mentioned**: Ms. Tripti Saxena (Sr DDG & Head, TEC, DoT); Sh. Kamal Kr Agarwal (DDG (QT), TEC, DoT); Dr. Goutam Paul (ISI Kolkata); Dr. Swagata Mandal (Jalpaiguri Government Engineering College); Dr. Sucheta Chakrabarti (Former Scientist-G, SAG, DRDO); Dr. Angshuman Karmakar (IIT Kanpur); Sh. Vinayaka Pandit (IBM); Sh. Bhupendra Singh (CAIR, DRDO); Sh. B. Srinivas Goud (NCIIPC); Dr. Shravani Shahapure (M/s Deloitte); Sh. Rakesh Singh Rawat (C-DoT); Dr. Roopika Chaudhary (DIT & CS, DRDO); Dr. Mahavir Jhawar (Ashoka University); Sh. Venkata Rama Raju Chelle (Director (QT), TEC, DoT); Sh. Rakesh Goyal (ADG, TEC)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Application Cryptography; Infrastructure Cryptography; Digital Signatures; Encryption; Key Management (implied via crypto-agility and trust management)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: ISO 9001:2015
- **Classical Algorithms Referenced**: RSA, ECDSA, ECDH
- **Key Takeaways**: Organizations must identify critical digital infrastructure including data and applications before quantum computers are deployed; Immediate transition to quantum-safe cryptography is required as current standards like RSA and ECDSA will be broken; Hybrid solutions should be used to mitigate short-term risks during migration; Crypto-agility is essential for achieving a smooth transition to post-quantum cryptographic protocols
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Solution approach; Trust management during migration; Isolation approaches during migration; Mitigate Short-Term Risks with Hybrid Solutions; Crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Operations, Compliance Officer
- **Implementation Prerequisites**: Conduct a Risk Assessment; Define Post Quantum Requirements; Evaluate the Vendor's Roadmap; Request Proof of Concept (PoC) or Pilots; Test and Validate the Implementation
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, Hybrid-crypto, Crypto-agility, Migration-program, Pqc-risk-management, Vendor-risk
- **Phase Classification Rationale**: The document is a Technical Report providing a framework for migration planning and best practices rather than a binding law or standard. It explicitly aims to sensitize organizations and guide proactive investments without imposing legal mandates.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; Telecommunications; Technology; Academic; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from threat awareness to actionable migration planning and implementation roadmaps for quantum-safe cryptography.
- **Historical Significance**: Represents a formalized national guidance document from India's Telecommunication Engineering Centre addressing the urgent need to migrate critical digital infrastructure before cryptographically relevant quantum computers emerge.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Identification of critical digital infrastructure; Risk Assessment; Vendor alignment for PQC requirements; Proof of Concept (PoC) or Pilots; Implementation of hybrid solutions
- **Extraction Note**: Base enrichment reused from library record IN-TEC-PQC-Migration-Report-2025; timeline dimensions extracted separately

---

## India:CERT-In — BOM Guidelines Expanded

- **Reference ID**: India:CERT-In — BOM Guidelines Expanded
- **Title**: BOM Guidelines Expanded
- **Authors**: Indian Computer Emergency Response Team
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Technical guidelines issued by CERT-In defining minimum elements and best practices for Software, Quantum, Cryptographic, AI, and Hardware Bills of Materials to enhance supply chain security and quantum readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: India; Bodies: Indian Computer Emergency Response Team (CERT-In), Ministry of Electronics and Information Technology, Government of India
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must make SBOM creation a mandatory standard practice in software procurement and development; Entities should implement QBOM and CBOM to assess quantum-readiness and maintain cryptographic inventory; Security teams must integrate SBOM inventory into vulnerability management workflows; Government, Public Sector, and Essential Services organizations are required to include SBOM requirements in all software purchases.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Developer, Compliance Officer, Operations
- **Implementation Prerequisites**: Software Composition Analysis (SCA) tools; Cryptographic inventory; Quantum-readiness assessment; SBOM ecosystem development at organizational level
- **Relevant PQC Today Features**: Assess, Compliance, Migrate, vendor-risk, pqc-governance
- **Phase Classification Rationale**: The document provides technical guidelines and best practices for implementing QBOM and CBOM rather than enforcing immediate legal penalties or specific compliance deadlines. It outlines a roadmap for organizations to develop and adopt these materials as part of their security procedures.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Technology
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from general SBOM adoption to specialized quantum and cryptographic inventory management, enabling the next phase of vulnerability tracking and migration strategy planning.
- **Historical Significance**: Represents a formal expansion of software supply chain transparency requirements by CERT-In to explicitly include quantum readiness and cryptographic asset visibility in national guidelines.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Development of organizational SBOM ecosystem; Establishment of roles and responsibilities; Secure SBOM distribution; Vulnerability tracking and analysis
- **Extraction Note**: Base enrichment reused from library record IN-CERTIN-QBOM-Guidelines-2025; timeline dimensions extracted separately

---

## International:PQCC — PQC Migration Roadmap Published

- **Reference ID**: International:PQCC — PQC Migration Roadmap Published
- **Title**: PQC Migration Roadmap Published
- **Authors**: Post-Quantum Cryptography Coalition
- **Publication Date**: 2025-05-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The PQCC publishes a Post-Quantum Cryptography Migration Roadmap featuring a four-category framework to assist organizations in navigating PQC transition complexities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: emerging quantum threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: industry standards
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should utilize a four-category framework covering Preparation, Baseline Understanding, Planning and Execution, and Monitoring and Evaluation; Stakeholders must be aligned to prioritize assets and implement solutions; Continuous monitoring of progress is essential to ensure a secure transition to quantum-safe cryptography.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program, pqc-governance, data-asset-sensitivity, compliance-strategy
- **Phase Classification Rationale**: The document explicitly announces the publication of a "comprehensive and tailorable guide" designed to assist organizations in navigating PQC migration complexities through a strategic framework. It provides actionable tools and methodologies rather than enforcing specific compliance requirements or deadlines.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Enables organizations to move from initial awareness to structured preparation, baseline understanding, planning, and execution of PQC migration strategies.
- **Historical Significance**: Represents the formal release of a four-category strategic framework by PQCC in May 2025 to standardize organizational approaches to quantum-safe cryptography transitions.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record PQCC-Migration-Roadmap-2025; timeline dimensions extracted separately

---

## Israel:INCD — National Cybersecurity Strategy 2025-2028

- **Reference ID**: Israel:INCD — National Cybersecurity Strategy 2025-2028
- **Title**: National Cybersecurity Strategy 2025-2028
- **Authors**: Israel National Cyber Directorate
- **Publication Date**: 2025-02-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Israel's National Cybersecurity Strategy 2025-2028 outlines a comprehensive approach to securing critical infrastructure, enhancing public awareness, and developing future capabilities in response to evolving cyber threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Israel; Bodies: National Cyber Directorate (INCD)
- **Leaders Contributions Mentioned**: Gabi Portnoy, Head of the National Cyber Directorate
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Israel must establish a national program for secure digital identification; Critical infrastructure protection requires zero significant damage mandates; Public awareness and education are essential to counter phishing and malign foreign influence; National defense efforts require joint management across government, security agencies, and the private sector; Investment in high-quality technological and human capabilities is necessary to contend with future challenges.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, CISO, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-id, migration-program, pqc-governance, vendor-risk, compliance-strategy
- **Phase Classification Rationale**: This document outlines a national strategic vision and objectives for cybersecurity resilience following the October 7th attack, establishing high-level policy direction rather than technical implementation details. It explicitly defines a "National Cybersecurity Strategy 2025-2028" to guide government and sectoral actions.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Government; Defense; Critical Infrastructure; Technology; All Sectors
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: 2028: completion of national implementation plan derived from strategy
- **Successor Events & Dependencies**: Development of a national implementation plan; execution by a national team combining government entities, security agencies, and industry representatives
- **Extraction Note**: Base enrichment reused from library record IL-INCD-Cybersecurity-Strategy-2025; timeline dimensions extracted separately

---

## Israel:BOI — Banking PQC Directive

- **Reference ID**: Israel:BOI — Banking PQC Directive
- **Title**: Banking PQC Directive
- **Authors**: Bank of Israel
- **Publication Date**: 2025-01-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The document is a website navigation and news feed for the Bank of Israel containing economic data, interest rates, and exchange rates, with no content regarding Post-Quantum Cryptography directives.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Israel; Bodies: Bank of Israel
- **Leaders Contributions Mentioned**: Prof. Amir Yaron, Governor of the Bank of Israel
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected; None detected; None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-risk-management; compliance-strategy; migration-program
- **Phase Classification Rationale**: The document text does not contain the Directive Letter 202501EN or any content regarding quantum risk management; it only lists general banking and economic news.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Banking; Finance
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected

---

## Israel:INCD — Government Threat Assessment

- **Reference ID**: Israel:INCD — Government Threat Assessment
- **Title**: Government Threat Assessment
- **Authors**: Israel National Cyber Directorate
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Israel's National Digital Agency mandates government bodies to complete quantum threat assessments and require post-quantum encryption in new contracts by end of 2025.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later; intercepting encrypted communications; stealing encrypted computers to decrypt data in the future; forging digital signatures; compromising blockchain protections; undermining cryptocurrency transactions
- **Migration Timeline Info**: End of 2025: complete threat assessment; New contracts must require post-quantum encryption capabilities
- **Applicable Regions / Bodies**: Regions: Israel; Bodies: National Digital Agency, U.S. National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Ofra Frenkel (Israel's chief government information officer at the National Digital Agency); Joe Biden (U.S. President referenced regarding updated guidelines)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Computing and communication infrastructure; Government-developed encryption systems
- **Standardization Bodies**: U.S. National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Government ministries must map computing infrastructure and identify sensitive data by end of 2025; New contracts with external tech providers must require post-quantum encryption capabilities; Current NIST algorithms are not yet commercially available for immediate implementation; Priority is on preparation and mapping rather than immediate deployment due to performance issues
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Mapping of computing and communication infrastructure; Identification of data that could be exposed; Assessment of potential damage if compromised; Development of response plan
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Assess; qkd; pqc-risk-management; migration-program
- **Phase Classification Rationale**: The document explicitly states a directive requiring government bodies to complete a "threat assessment" by the end of 2025 and mandates post-quantum encryption in new contracts, establishing a fixed compliance deadline.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Defense
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from general awareness to active preparation and inventory mapping, enabling future implementation once commercially viable solutions are available.
- **Historical Significance**: Represents a national directive in Israel requiring government-wide quantum threat assessment and contractual PQC requirements by 2025, aligning with global preparations led by the U.S.
- **Implementation Timeline Dates**: End of 2025: complete thorough threat assessment; New contracts: require post-quantum encryption capabilities
- **Successor Events & Dependencies**: Contingent on the availability of commercially viable post-quantum solutions and resolution of performance issues with NIST algorithms; Enables swift action once technology becomes practical.

---

## Japan:CRYPTREC — PQC Guideline GL-2004-2022

- **Reference ID**: Japan:CRYPTREC — PQC Guideline GL-2004-2022
- **Title**: PQC Guideline GL-2004-2022
- **Authors**: Cryptographic Research and Evaluation Committees
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: CRYPTREC publishes guidelines and reports on post-quantum cryptography and cryptographic technology management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Japan; Bodies: CRYPTREC, Advisory Board for Cryptographic Technology, Cryptographic Technology Evaluation Committee, Cryptographic Technology Promotion Committee, Cryptographic Scheme Committee, Cryptographic Technique Monitoring Subcommittee, Cryptography Research and Evaluation Committees, Cryptographic Operation Committee, Cryptographic Module Committee, Cryptographic Module Subcommittee
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: CRYPTREC
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CRYPTREC publishes technical guidance for post-quantum cryptography; The organization maintains a list of cryptographic ciphers and strength requirements; Reports and guidelines are updated regularly with the latest publications in 2025; The Advisory Board for Cryptographic Technology releases annual reports; Guidance is available for the management of cryptographic keys
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Compliance; Migrate; Assess; pqc-governance
- **Phase Classification Rationale**: The document title explicitly states "PQC Guideline" and the description notes CRYPTREC publishes "Guidelines for Post-Quantum Cryptography technical guidance," indicating a non-mandatory advisory phase.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: This event represents the publication of ongoing technical guidance and reports, enabling organizations to access updated cryptographic standards and management practices without signaling a specific transition from research to standardization.
- **Historical Significance**: CRYPTREC continues its long-standing role since 2000 in providing cryptographic technology guidelines and evaluations for Japan, maintaining an active update cycle through 2025.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected

---

## Japan:NEDO — K Program PQC Research

- **Reference ID**: Japan:NEDO — K Program PQC Research
- **Title**: K Program PQC Research
- **Authors**: New Energy and Industrial Technology Development Organization
- **Publication Date**: 2024-07-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: PQShield joins the Cyber Research Consortium to design PQC primitives and protocols under Japan's NEDO K Program research initiative.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum-enabled cyber attacks; future quantum attacks
- **Migration Timeline Info**: Project runs from 2024 to 2026 with final standardization documents due in 2026
- **Applicable Regions / Bodies**: Regions: Japan; Bodies: NEDO, CRC, AIST
- **Leaders Contributions Mentioned**: Dr Shuichi Katsumata (Lead Cryptography Researcher leading company work under CRC); Dr Ali El Kaafarani (Founder and CEO of PQShield); Tsutomu Matsumoto (AIST Fellow / Director of CPSEC)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: technology supply chain; cybersecurity infrastructure
- **Standardization Bodies**: NIST, Internet Engineering Task Force
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Japan is launching a national R&D initiative to implement PQC across its technology supply chain; PQShield will design new PQC primitives including ring signatures and threshold encryption; Results will be submitted to NIST for multi-party threshold cryptography standardization and shared with IETF as public RFCs; The project aims to update non-PQC protocols to align with NIST's latest standards
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: updating existing protocols to support NIST's latest standards
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document describes an R&D initiative to investigate critical technologies and design new primitives, explicitly stating the goal is to achieve advanced functionality in quantum-resistant cryptography.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Defense; Technology; Telecommunications; Healthcare; Automotive; Industrial IoT; Semiconductors and Manufacturing; Identity and Paymentech
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from Research to Standardization — signals formal adoption beginning with the delivery of final standardization documents in 2026.
- **Historical Significance**: Represents a major government-funded project in Japan to enhance national defense against quantum-enabled cyber attacks and establish a common cybersecurity infrastructure.
- **Implementation Timeline Dates**: 2024: Project start; 2026: Final standardization documents delivered
- **Successor Events & Dependencies**: Requires submission of primitives to NIST's standardization call for multi-party threshold cryptography; Enables sharing of protocols with the Internet Engineering Task Force to become public RFCs.

---

## Japan:METI/NISC — Cybersecurity Industry Policy Package

- **Reference ID**: Japan:METI/NISC — Cybersecurity Industry Policy Package
- **Title**: Cybersecurity Industry Policy Package
- **Authors**: METI and NISC
- **Publication Date**: 2025-03-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Japan's coordinated national strategy involving government mandates, strategic investments, and dual-track technological leadership in PQC and QKD to counter quantum-driven threats.
- **PQC Algorithms Covered**: CRYSTALS-Kyber; Dilithium
- **Quantum Threats Addressed**: Shor's algorithm; Harvest Now Decrypt Later (described as attacks harvested now and decrypted later)
- **Migration Timeline Info**: March 18, 2025: NISC International Cybersecurity Challenge; September 2025: METI and NISC shared vision for Software Bill of Materials; January 2025: NTT Communications PQC rollout; April 2025: NEC wireless optical communication demo; September 16, 2025: NEC integrated QKD system unveiling
- **Applicable Regions / Bodies**: Regions: Japan; Bodies: NISC, METI, NICT, Quad, G7, ITU
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI (implied via certificates); Key Management; Optical Network; Wireless Network
- **Standardization Bodies**: NIST; ITU
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC
- **Key Takeaways**: Japan is implementing a dual-track strategy combining Post-Quantum Cryptography and Quantum Key Distribution; Hybrid migration using composite certificates is necessary to maintain compatibility during transition; A full cryptographic inventory is required to identify attack surfaces before deploying quantum-ready solutions; International cooperation through the Quad and G7 is essential for global data security alignment
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid certificates; hybrid protocols; crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect; CISO; Researcher
- **Implementation Prerequisites**: Cryptographic inventory; Software Bill of Materials; Quantum Technology Innovation Strategy Roadmap alignment
- **Relevant PQC Today Features**: qkd; hybrid-crypto; crypto-agility; migration-program; pqc-governance
- **Phase Classification Rationale**: The document describes a "Government Mandate and Strategic Investment" where METI released a policy package and NISC set security standards, indicating a formal Policy phase event.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Finance; Banking; Energy; Telecommunications; Critical Infrastructure; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from theoretical threat assessment to active government-led implementation and industry coordination, enabling real-world testing of PQC and QKD systems.
- **Historical Significance**: Represents a coordinated national effort by Japan to establish a dual-track defense strategy (PQC and QKD) with specific policy packages and shared visions for software supply chain security.
- **Implementation Timeline Dates**: March 18, 2025; September 2025; January 2025; April 2025; September 16, 2025
- **Successor Events & Dependencies**: Requires full cryptographic inventory of government and critical infrastructure systems; Enables deployment of hybrid certificates and protocols; Contingent on NICT technical testing and standardization alignment with NIST.

---

## NATO:NATO — Quantum Technologies Strategy

- **Reference ID**: NATO:NATO — Quantum Technologies Strategy
- **Title**: Quantum Technologies Strategy
- **Authors**: North Atlantic Treaty Organization
- **Publication Date**: 2024-01-17
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NATO's first Quantum Technologies Strategy establishes quantum-safe cryptography as a priority for Alliance cybersecurity and commits member nations to post-quantum migration of classified communications and critical military systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Malicious use of quantum technologies
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NATO, North Atlantic Council (NAC), Supreme Allied Commander Europe (SACEUR), Defence Innovation Accelerator for the North Atlantic (DIANA); Regions: Transatlantic
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NATO has approved its first quantum strategy to ensure the Alliance is quantum-ready; The strategy prioritizes quantum-resistant cryptography for securing data communications and classified systems; Six companies in the DIANA programme are developing innovations in next-generation cryptography; Quantum technologies are being applied to sensing, imaging, and precise positioning for defence; The strategy aims to foster a transatlantic quantum technologies ecosystem while defending against malicious use.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Leaders, pqc-governance, migration-program
- **Phase Classification Rationale**: The document outlines NATO's first-ever quantum strategy approved by Foreign Ministers, establishing a strategic framework for adopting quantum-resistant cryptography and guiding cooperation with industry. It represents a Policy phase event as it sets high-level direction rather than technical implementation details.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Defense; Government; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from exploratory innovation efforts to a formalized strategic commitment, enabling the development of a transatlantic quantum technologies ecosystem and specific defense applications.
- **Historical Significance**: This marks the first time NATO has published a dedicated strategy for quantum technologies, formally committing the Alliance to becoming "quantum-ready" against malicious uses. It establishes quantum as a prioritized technological area alongside AI and hypersonics for collective defense.
- **Implementation Timeline Dates**: 28 November: Strategy approved by NATO Foreign Ministers; 17 January 2024: Strategy summary released
- **Successor Events & Dependencies**: Development of transatlantic quantum technologies ecosystem; cooperation with industry via DIANA; deployment of next-generation cryptography solutions
- **Extraction Note**: Base enrichment reused from library record NATO-Quantum-Strategy-2024; timeline dimensions extracted separately

---

## New Zealand:GCSB/NCSC — NZISM v3.9 Published

- **Reference ID**: New Zealand:GCSB/NCSC — NZISM v3.9 Published
- **Title**: NZISM v3.9 Published
- **Authors**: Government Communications Security Bureau / NCSC
- **Publication Date**: 2025-11-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The New Zealand Information Security Manual (NZISM) v3.9 update introduces new controls for authentication, incident reporting, device logging, and Wi-Fi security.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: New Zealand; Bodies: Government Communications Security Bureau (GCSB), Chief Information Security Officer (GCISO)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: WPA3, WPA2, WPA
- **Infrastructure Layers**: Wireless local area networks; Multifunction devices
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NZISM v3.9
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must update password controls to align with industry standards including NIST; Passwordless and phishing-resistant multi-factor authentication are now introduced; Mandated agencies must improve incident reporting to build a consolidated operating environment picture; Multifunction device logs for TS, S, and CTS classifications require central logging with restricted access; Wi-Fi Protected Access 3 (WPA3) is now required for government wireless networks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, CISO, Operations
- **Implementation Prerequisites**: Alignment with NIST standards; Central logging infrastructure for multifunction devices; WPA3 capable wireless hardware
- **Relevant PQC Today Features**: Compliance, digital-id, tls-basics, migration-program, pqc-governance
- **Phase Classification Rationale**: The document represents a Guidance phase event as it releases an updated version of the New Zealand Information Security Manual (NZISM) to improve guidance for detecting and managing security incidents and aligning with industry standards.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from previous NZISM versions to v3.9, enabling updated controls for authentication, incident reporting, and wireless security across government agencies.
- **Historical Significance**: This update marks the formal inclusion of passwordless authentication and WPA3 requirements in New Zealand's national security manual, aligning government practices with current industry standards.
- **Implementation Timeline Dates**: 9 May 2025: NZISM v3.9 Release; November 2025: NZISM Version 3.9 publication date mentioned in description
- **Successor Events & Dependencies**: Requires agencies to implement updated controls for passwords, incident reporting, and WPA3; Enables participation in the development of the next NZISM update via nzism@gcsb.govt.nz

---

## Singapore:CSA/MAS — Financial Sector Planning

- **Reference ID**: Singapore:CSA/MAS — Financial Sector Planning
- **Title**: Financial Sector Planning
- **Authors**: Cyber Security Agency / Monetary Authority of Singapore
- **Publication Date**: 2024-02-20
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Monetary Authority of Singapore advisory requiring financial institutions to develop quantum risk management programs and conduct cryptographic inventory assessments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Monetary Authority of Singapore
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial institutions must develop quantum risk management programs; Cryptographic inventory assessments are mandated; PQC planning timelines are established for the financial sector
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, CISO, Security Architect
- **Implementation Prerequisites**: Develop quantum risk management programs; Conduct cryptographic inventory assessments
- **Relevant PQC Today Features**: pqc-risk-management, compliance-strategy, migration-program, assess
- **Phase Classification Rationale**: The document explicitly mentions the development of quantum risk management and PQC transition plans by financial services firms, indicating an initial assessment and planning stage characteristic of the Discovery phase.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Enables the transition from initial risk awareness to the formulation of structured PQC transition plans.
- **Historical Significance**: Represents a regulatory advisory from the Monetary Authority of Singapore prompting the financial sector to initiate quantum risk management planning.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Development of quantum risk management plans; development of PQC transition plans
- **Extraction Note**: Base enrichment reused from library record SG-MAS-Quantum-Advisory-2024; timeline dimensions extracted separately

---

## Singapore:CSA/GovTech/IMDA — Quantum-Safe Handbook and Quantum Readiness Index

- **Reference ID**: Singapore:CSA/GovTech/IMDA — Quantum-Safe Handbook and Quantum Readiness Index
- **Title**: Quantum-Safe Handbook and Quantum Readiness Index
- **Authors**: See document
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: A draft handbook providing voluntary guidance and practical advice for organizations to prepare for quantum-safe migration across five key domains.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: Cryptanalytically Relevant Quantum Computer (CRQC), Shor's algorithm, Grover's algorithm, Q-day
- **Migration Timeline Info**: Expert estimates place the horizon for Q-day within the next 5-10 years; migration is a multi-year endeavour.
- **Applicable Regions / Bodies**: CSA, GovTech, IMDA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, SSH, IPSEC, S/MIME
- **Infrastructure Layers**: Critical Information Infrastructure (CII), Identity management, Access control, ICS, SCADA
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDH, DSA, DH, ECDSA, AES, SHA-1, SHA-2, SHA-3
- **Key Takeaways**: The quantum threat amplifies the likelihood and impact of breaking cryptography affecting confidentiality, integrity, and availability; Organizations should start preparation now as migration is a non-trivial multi-year effort; There is no need to rush implementation immediately due to evolving solutions and potential first-mover disadvantages; Some actions are "no-regrets" and can be taken immediately while others require careful evaluation.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Conduct risk assessment; Establish governance; Evaluate technology solutions; Build training and capability; Engage externally.
- **Relevant PQC Today Features**: Threats; Assess; Migrate; Algorithms; pqc-governance; migration-program; pqc-risk-management
- **Phase Classification Rationale**: The document is explicitly labeled as a "Draft for Public Consultation" intended to provide voluntary guidance rather than mandatory requirements, indicating an exploratory phase where organizations are encouraged to seed readiness without rushing into implementation.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Technology; Finance; Healthcare
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from general awareness to structured readiness planning by defining five key domains for migration while acknowledging the uncertainty of Q-day timelines.
- **Historical Significance**: Represents a collaborative effort between public and private sectors in Singapore to formalize quantum-safe migration guidance before final standards are universally adopted.
- **Implementation Timeline Dates**: 23 OCT 2025: Release of Draft Quantum-safe Handbook for Public Consultation; Next 5-10 years: Estimated horizon for Q-day.
- **Successor Events & Dependencies**: Requires organizations to conduct risk assessments and build capability before full implementation; Contingent on the maturation of quantum-safe solutions and standards.

---

## Singapore:MAS — Financial Sector QKD Sandbox Completed

- **Reference ID**: Singapore:MAS — Financial Sector QKD Sandbox Completed
- **Title**: Financial Sector QKD Sandbox Completed
- **Authors**: Monetary Authority of Singapore
- **Publication Date**: 2025-09-29
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Technical report on a QKD proof-of-concept sandbox involving MAS and industry partners demonstrating quantum-safe key distribution feasibility in financial settlement systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Sept 2024-March 2025
- **Applicable Regions / Bodies**: Monetary Authority of Singapore; DBS; HSBC; OCBC; UOB
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-256
- **Key Takeaways**: QKD proof-of-concept demonstrates feasibility for financial settlement systems; Sandbox generated 6.75M AES-256 keys per day per bank; Collaboration between MAS and major banks validates quantum-safe key distribution
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 6.75M AES-256 keys/day per bank
- **Target Audience**: Security Architect; CISO; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd; migration-program; pqc-business-case
- **Phase Classification Rationale**: The document explicitly describes a completed proof-of-concept sandbox where banks tested QKD for settlement files, which defines a testing phase event.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from conceptual planning to practical validation of QKD in financial settlement environments.
- **Historical Significance**: Represents a significant milestone where major Singaporean banks successfully validated Quantum Key Distribution for high-volume key generation in real-world settlement scenarios.
- **Implementation Timeline Dates**: Sept 2024; March 2025
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record SG-MAS-QKD-Sandbox-Report-2025; timeline dimensions extracted separately

---

## South Korea:NIS/KISA — KpqC Competition Results

- **Reference ID**: South Korea:NIS/KISA — KpqC Competition Results
- **Title**: KpqC Competition Results
- **Authors**: National Intelligence Service / KISA
- **Publication Date**: 2025-01-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Announcement of the final selected algorithms (AIMer, NTRU+, HAETAE, SMAUG-T) from Round 2 of the KpqC Competition on January 16, 2025.
- **PQC Algorithms Covered**: AIMer; NTRU+; HAETAE; SMAUG-T; MQ-Sign; NCC-Sign; PALOMA; REDOG
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Korea; Bodies: 양자내성암호연구단 (Quantum Resistant Cryptography Research Team)
- **Leaders Contributions Mentioned**: Seongkwang Kim; Jincheol Ha; Mincheol Son; Byeonghak Lee; Dukjae Moon; Joohee Lee; Sangyub Lee; Jihoon Kwon; Jihoon Cho; Hyojin Yoon; Jooyoung Lee; Jung Hee Cheon; Hyeongmin Choe; Julien Devevey; Tim Güneysu; Dongyeon Hong; Markus Krausz; Georg Land; Marc Möller; Junbum Shin; Damien Stehlé; MinJune Yi; Kyung-Ah Shim; Hyeokdong Kwon; Jeongsu Kim; Jonghyun Kim; Jong Hwan Park; Dong-Chan Kim; Chang-Yeol Jeon; Minji Kim; Dong Hyun Park; Dong Hyeon Kim; Yeonghyo Kim; Jon-Lark Kim; Jihoon Hong; Terry Shue Chien Lau; YounJae Lim; Byung-Sun Won; Bo-seung Yang; Joongeun Choi; Jeongdae Hong; Chi-Gon Jung; Honggoo Kang; Janghyun Lee; Seonghyuck Lim; Aesun Park; Seunghwan Park; Hyoeun Seong
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KpqC Round 2 selected AIMer and SMAUG-T as Digital Signature algorithms; NTRU+ and HAETAE were selected for PKE/KEM; The competition aimed to advance research in Korea's PQC field and foster technology exchange; Public reviewers provided valuable feedback on the algorithms during the selection process.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Developer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Leaders; Timeline; Assess
- **Phase Classification Rationale**: The document announces the "final algorithms" selected after "careful consideration during Round 2," indicating a conclusion of an evaluation phase leading to standardization or formal selection within the Korean context.
- **Regulatory Mandate Level**: Informational (educational, advisory only)
- **Sector / Industry Applicability**: Academic; Technology; All Sectors
- **Migration Urgency & Priority**: Exploratory (research phase, no specific deadline)
- **Phase Transition Narrative**: Moves from competitive evaluation (Round 1 and Round 2) to final algorithm selection, enabling further development and potential standardization in Korea's PQC domain.
- **Historical Significance**: Represents the conclusion of the KpqC competition with the announcement of four finalist algorithms on January 16, 2025, marking a key milestone in advancing Korea's domestic PQC research and human resource development.
- **Implementation Timeline Dates**: January 16, 2025; April 2024 ~ November 2024
- **Successor Events & Dependencies**: None detected

---

## United Kingdom:NCSC — PQC White Paper Updated

- **Reference ID**: United Kingdom:NCSC — PQC White Paper Updated
- **Title**: PQC White Paper Updated
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2024-08-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-PQC-Whitepaper-2024; timeline dimensions extracted separately

---

## United Kingdom:NCSC — PQC Migration Roadmap Published

- **Reference ID**: United Kingdom:NCSC — PQC Migration Roadmap Published
- **Title**: PQC Migration Roadmap Published
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2025-03-20
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: UK NCSC guidance outlining a three-phase PQC migration timeline with sector-specific advice for government and CNI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Phase 1 by 2028 for discovery and planning; Phase 2 from 2028 to 2031 for active migration of priority systems; Phase 3 by 2035 for complete PQC migration.
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete discovery and planning by 2028; Priority systems require active migration between 2028 and 2031; Full PQC migration must be achieved by 2035; Guidance includes specific timelines for UK government and CNI sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Migrate, Assess, migration-program, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-Migration-Timelines-2025; timeline dimensions extracted separately

---

## United Kingdom:CMORG — Financial Sector PQC Guidance

- **Reference ID**: United Kingdom:CMORG — Financial Sector PQC Guidance
- **Title**: Financial Sector PQC Guidance
- **Authors**: Cross Market Operational Resilience Group
- **Publication Date**: 2025-04-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: CMORG guidance for UK financial sector institutions on managing quantum computing risks through cryptographic inventory, risk assessment, and migration to post-quantum algorithms.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; SLH-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); Store now and decrypt later; Shor's algorithm; Grover's algorithm
- **Migration Timeline Info**: NIST finalised first set of PQC algorithms in August 2024; Experts estimate CRQC availability within the next decade; Migration effort requires starting immediately due to 7-10 year preparation window
- **Applicable Regions / Bodies**: United Kingdom (NCSC); France (ANSSI); Germany (BSI); European Union (eighteen member states); United States (CISA, NCCoE)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cryptographic inventory; Crypto-agile systems; Third-party vendor solutions
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); National Cyber Security Centre (NCSC); ETSI; ANSSI; BSI; CISA
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic curve cryptography (ECC); Advanced Encryption Standard (AES)
- **Key Takeaways**: Financial institutions must establish comprehensive cryptographic inventories covering data-in-transit, at-rest, and in-use; Organizations should prioritize systems protecting long-lived sensitive data due to store now decrypt later risks; Vendor readiness assessment is critical given reliance on third-party solutions; Institutions should adopt hybrid cryptographic solutions combining classical and PQC algorithms for smoother transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid cryptographic solutions; Crypto-agile systems; Phased approach for integrating PQC
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Comprehensive cryptographic inventory; Risk assessment framework; Vendor readiness assessment; Crypto-agile system capability
- **Relevant PQC Today Features**: Threats; Migrate; Assess; Algorithms; Hybrid-crypto; Crypto-agility; Vendor-risk; Migration-program; Pqc-risk-management
- **Phase Classification Rationale**: This document represents a Guidance phase event as it explicitly states that CMORG-endorsed capabilities are voluntary and do not constitute regulatory rules or supervisory expectations. It provides a structured roadmap for financial institutions to begin cryptographic inventory and transition planning without enforcing mandatory compliance.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Finance; Banking; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: This guidance enables the transition from initial awareness to active planning by establishing cryptographic inventories and risk assessments, facilitating the subsequent remediation phase of migrating to quantum-safe algorithms.
- **Historical Significance**: This document marks a significant milestone as the first industry-endorsed PQC roadmap specifically tailored for the UK financial sector, aligning with NIST's August 2024 algorithm finalization and NCSC guidance to address the "store now, decrypt later" threat.
- **Implementation Timeline Dates**: April 2025: Publication of Guidance v1.0; August 2024: NIST finalized first set of PQC algorithms; December 2024: EU member states released joint statement on PQC transition
- **Successor Events & Dependencies**: Creation of comprehensive cryptographic inventories; Conducting risk assessments for quantum vulnerability; Prioritization of high-risk assets; Remediation via migration to NIST algorithms (ML-KEM, ML-DSA, SLH-DSA); Vendor readiness assessment
- **Extraction Note**: Base enrichment reused from library record UK-CMORG-PQC-Guidance-2025; timeline dimensions extracted separately

---

## United Kingdom:DSIT — CNI Perspectives Report

- **Reference ID**: United Kingdom:DSIT — CNI Perspectives Report
- **Title**: CNI Perspectives Report
- **Authors**: Department for Science Innovation and Technology
- **Publication Date**: 2025-11-27
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: UK DSIT report exploring how critical national infrastructure sectors in the UK are engaging with the need to migrate cyber security schemes to post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking encryption schemes commonly used for cyber security; compromising privacy and security of digital communications
- **Migration Timeline Info**: Within the next decade, quantum computers could be able to break encryption schemes; National Cyber Security Centre has published timelines for migration
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: Department for Science, Innovation and Technology, National Cyber Security Centre
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Quantum hardware and algorithm development are advancing faster than initially predicted; UK critical national infrastructure sectors face sector-specific challenges in PQC transition; Government and commercial organizations are investing significantly in cryptographically-relevant quantum computers; Organizations must carry out activities to migrate safely to post-quantum cryptography in the coming years
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, CISO, Security Architect, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Assess, pqc-governance, migration-program
- **Phase Classification Rationale**: The document is explicitly titled as "Independent research" commissioned to explore how UK critical national infrastructure organisations are engaging with the need to migrate to post-quantum cryptography. It presents regulator and industry perspectives rather than binding mandates or implementation schedules.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; Energy; Financial Services; Healthcare; Telecommunications; Transport; Critical Infrastructure
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: This research assesses current engagement levels to inform the government's wider work on assessing threats and improving cyber resilience, enabling future policy or mandate development.
- **Historical Significance**: This report marks a specific assessment of UK critical national infrastructure readiness for PQC transition within five key sectors as of late 2025. It highlights the acceleration of quantum hardware development relative to initial predictions.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Migration activities outlined by the National Cyber Security Centre; Government assessment of threats and opportunities posed by critical technologies
- **Extraction Note**: Base enrichment reused from library record UK-DSIT-CNI-PQC-Perspectives-2025; timeline dimensions extracted separately

---

## United States:White House — NSM-10 Published

- **Reference ID**: United States:White House — NSM-10 Published
- **Title**: NSM-10 Published
- **Authors**: Executive Office of the President
- **Publication Date**: 2022-05-04
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: National Security Memorandum 10 directs U.S. federal agencies to inventory cryptographic systems and transition to quantum-resistant cryptography by 2035 while promoting leadership in quantum information science.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptanalytically relevant quantum computer (CRQC)
- **Migration Timeline Info**: Goal of mitigating quantum risk as much as feasible by 2035; first sets of standards expected by 2024; deprecation timeline proposed within 90 days of standard release with a goal to move systems off vulnerable cryptography within a decade.
- **Applicable Regions / Bodies**: Regions: United States; Bodies: National Institute of Standards and Technology (NIST), National Security Agency (NSA), Cybersecurity and Infrastructure Security Agency (CISA), Office of Management and Budget (OMB), National Cyber Director, Office of Science and Technology Policy, Federal Civilian Executive Branch (FCEB) Agencies.
- **Leaders Contributions Mentioned**: President Joe Biden; Vice President Kamala Harris; First Lady Dr. Jill Biden; Second Gentleman Douglas Emhoff; Secretary of Commerce; Secretary of Homeland Security; Director of NIST; Director of NSA; Director of CISA; Director of OMB; National Cyber Director; Assistant to the President for National Security Affairs (APNSA).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public-key cryptography; digital signatures; system administrator protocols; non-security software and firmware; High Value Assets; High Impact Systems.
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); technical standards bodies.
- **Compliance Frameworks Referenced**: National Quantum Initiative Act (Public Law 115-368); National Defense Authorization Act for Fiscal Year 2022 (Public Law 117-81).
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal agencies must inventory all currently deployed cryptographic systems excluding National Security Systems; NIST and NSA are developing technical standards for quantum-resistant cryptography expected by 2024; The United States aims to mitigate quantum risk as much as feasible by 2035; Agencies must establish a Migration to Post-Quantum Cryptography Project at the National Cybersecurity Center of Excellence; Cryptographic agility is central to reducing transition time and allowing seamless updates.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; interoperable quantum-resistant cryptography; migration planning; inventorying vulnerable systems.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect, CISO, Operations
- **Implementation Prerequisites**: Inventory of IT systems vulnerable to CRQCs; identification of key information technology assets to prioritize; development of migration plans addressing most significant risks first; coordination with the National Quantum Coordination Office.
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, Leaders, crypto-agility, pqc-risk-management, migration-program, pqc-governance
- **Phase Classification Rationale**: This document is a National Security Memorandum that explicitly outlines the Administration's policies and directs specific actions for agencies to migrate systems to quantum-resistant cryptography. It establishes a formal government strategy rather than providing technical specifications or voluntary guidelines.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense; Critical Infrastructure; Technology; Academic; All Sectors
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from general awareness of quantum risks to a formalized, whole-of-government mandate requiring inventorying, planning, and migration execution.
- **Historical Significance**: NSM-10 is the first U.S. presidential directive to formally establish a national policy for transitioning to post-quantum cryptography, setting a 2035 goal for risk mitigation.
- **Implementation Timeline Dates**: May 04, 2022: Memorandum issued; Within 90 days of May 04, 2022: Agencies coordinate with OSTP and NIST initiates working group; By October 18, 2023: National Cyber Director delivers status report; By 2024: First sets of NIST standards expected; By 2035: Goal to mitigate quantum risk as much as feasible
- **Successor Events & Dependencies**: Release of first set of NIST standards for quantum-resistant cryptography; Establishment of Migration to Post-Quantum Cryptography Project; Annual inventorying of vulnerable IT systems by FCEB Agencies; Deprecation timeline for quantum-vulnerable cryptography
- **Extraction Note**: Base enrichment reused from library record NSM-10; timeline dimensions extracted separately

---

## United States:OMB — M-23-02 Cryptographic Inventory

- **Reference ID**: United States:OMB — M-23-02 Cryptographic Inventory
- **Title**: M-23-02 Cryptographic Inventory
- **Authors**: Office of Management and Budget
- **Publication Date**: 2022-11-18
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: OMB Memorandum M-23-02 directs federal agencies to conduct prioritized inventories of cryptographic systems vulnerable to cryptanalytically relevant quantum computers and outlines migration planning requirements.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC); Harvest Now Decrypt Later (encrypted data recorded now and later decrypted)
- **Migration Timeline Info**: Designate lead within 30 days; submit first inventory by May 4, 2023; annual inventories until 2035; goal to mitigate quantum risk by 2035
- **Applicable Regions / Bodies**: United States; Executive Departments and Agencies; Office of Management and Budget (OMB); Office of the National Cyber Director (ONCD); Department of Homeland Security Cybersecurity and Infrastructure Security Agency (CISA); National Security Agency (NSA); National Institute of Standards and Technology (NIST); FedRAMP Program Management Office (PMO)
- **Leaders Contributions Mentioned**: Shalanda D. Young (Director, OMB); Federal Chief Information Security Officer (Chair of Cryptographic Migration Working Group)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; Cloud service providers; Continuous Diagnostics and Mitigation (CDM)
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) 199; Federal Information Security Modernization Act (FISMA); Executive Order 14028; OMB Memorandum M-22-09; National Security Memorandum 10 (NSM-10)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must submit a prioritized inventory of CRQC-vulnerable systems by May 4, 2023, and annually thereafter until 2035; Inventories must focus on High Value Assets (HVAs), high impact systems, and data expected to remain mission-sensitive in 2035; Agencies are required to assess funding needs for PQC migration within 30 days of each annual inventory submission; Testing of pre-standardized PQC is encouraged in production environments alongside current algorithms; A cryptographic migration working group will be established to coordinate agency efforts
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Testing pre-standardized PQC alongside current approved and validated algorithms; Hybrid environment hosting options for information systems
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Compliance Officer, Security Architect, Policy Maker
- **Implementation Prerequisites**: Designation of a cryptographic inventory and migration lead; Prioritized inventory of active cryptographic systems; Assessment of funding required for PQC migration; Identification of High Value Assets (HVAs) and high impact systems
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, data-asset-sensitivity, migration-program
- **Phase Classification Rationale**: This document is an OMB Memorandum that establishes mandatory requirements for federal agencies to inventory cryptographic systems and assess funding for PQC migration in compliance with NSM-10. It directs specific actions and timelines rather than offering optional guidance.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from strategic direction under NSM-10 to operational execution by mandating the creation of cryptographic inventories and funding assessments as prerequisites for future migration.
- **Historical Significance**: This memorandum marks the first formal directive requiring U.S. federal agencies to systematically inventory CRQC-vulnerable systems, initiating the government-wide transition to post-quantum cryptography.
- **Implementation Timeline Dates**: November 18, 2022: Publication date; Within 30 days of publication: Designate cryptographic inventory and migration lead; Within 60 days of publication: Establish mechanism for PQC testing information exchange; Within 90 days of publication: Release instructions for inventory collection and funding assessments; By May 4, 2023: Submit initial prioritized inventory; Annually thereafter until 2035: Submit annual inventories; Within 1 year of publication: Release strategy on automated tooling.
- **Successor Events & Dependencies**: Submission of prioritized cryptographic system inventory; Assessment of funding required for PQC migration; Release of instructions for inventory collection and transmission; Establishment of a cryptographic migration working group; Release of strategy on automated tooling for PQC assessment.
- **Extraction Note**: Base enrichment reused from library record OMB-M-23-02; timeline dimensions extracted separately

---

## United States:Congress — Quantum Computing Cybersecurity Preparedness Act

- **Reference ID**: United States:Congress — Quantum Computing Cybersecurity Preparedness Act
- **Title**: Quantum Computing Cybersecurity Preparedness Act
- **Authors**: United States Congress
- **Publication Date**: 2022-12-21
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: US federal law requiring federal agencies to inventory and migrate cryptographic systems to quantum-resistant standards while directing NIST and OMB to develop migration guidelines.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Adversaries stealing sensitive encrypted data today using classical computers to wait until sufficiently powerful quantum systems are available to decrypt it; integer factorization vulnerability
- **Migration Timeline Info**: Inventory guidance within 180 days of enactment; agency reports within 1 year of enactment; migration plan development within 1 year after NIST issues PQC standards; annual reporting for 5 years after PQC standards issuance
- **Applicable Regions / Bodies**: United States; Office of Management and Budget (OMB); National Institute of Standards and Technology (NIST); Cybersecurity and Infrastructure Security Agency (CISA); National Cyber Director; Federal Government agencies
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Information technology systems; national security systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); International Organization for Standardization
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) under chapter 35 of title 44, United States Code
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal agencies must establish and maintain an inventory of IT vulnerable to quantum decryption within 180 days; OMB must issue migration guidance prioritizing IT for post-quantum cryptography; Agencies must develop migration plans within one year of NIST issuing PQC standards; Annual reporting on PQC adoption progress is required for five years after standard issuance; National security systems are exempt from this Act
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Cryptographic agility to support easily updated applications, hardware intellectual property, and software
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect, Operations
- **Implementation Prerequisites**: Current inventory of information technology vulnerable to quantum decryption; prioritization criteria for migration; automated process for evaluating migration progress
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, crypto-agility, pqc-governance, migration-program
- **Phase Classification Rationale**: This document is a federal law (Public Law 117–260) that legally mandates the Office of Management and Budget to issue guidance requiring federal agencies to inventory and migrate to post-quantum cryptography.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from the exploratory phase of quantum threat assessment to a mandated policy phase requiring inventory establishment and migration planning for federal IT systems.
- **Historical Significance**: This Act formally codifies the United States government's requirement to migrate to post-quantum cryptography, establishing a legal framework for agency compliance and funding estimation.
- **Implementation Timeline Dates**: 180 days after Dec. 21, 2022: OMB guidance on inventory; 1 year after Dec. 21, 2022: Agency reports on inventory; 15 months after Dec. 21, 2022: OMB report on strategy and funding; 1 year after NIST issues PQC standards: OMB guidance on migration prioritization; 5 years after NIST issues PQC standards: End of progress reporting period
- **Successor Events & Dependencies**: OMB issuance of migration guidance; Agency establishment of IT inventories; NIST issuance of post-quantum cryptography standards; Development of agency migration plans; Submission of OMB reports to Congress
- **Extraction Note**: Base enrichment reused from library record US-QCCPA-2022; timeline dimensions extracted separately

---

## United States:NSA — CNSA 2.0 Published

- **Reference ID**: United States:NSA — CNSA 2.0 Published
- **Title**: CNSA 2.0 Published
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: The document announces the release of CNSA 2.0, which explicitly notifies National Security Systems owners and operators of future quantum-resistant algorithm requirements. This constitutes a formal policy directive establishing mandatory cryptographic standards for specific government systems.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from legacy public-key systems to quantum-resistant algorithms to assure sustained protection against cryptanalytically-relevant quantum computers.
- **Historical Significance**: This milestone marks the official publication of the Commercial National Security Algorithm Suite 2.0, establishing the first formal US government mandate for quantum-resistant cryptography in national security systems.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Planning; Preparation; Budgeting for transition to QR algorithms
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NIST — FIPS 203, 204, 205 Published

- **Reference ID**: United States:NIST — FIPS 203, 204, 205 Published
- **Title**: FIPS 203, 204, 205 Published
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2024-08-13
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NIST publishes FIPS 203, 204, and 205 as the first set of Post-Quantum Cryptography standards for ML-KEM, ML-DSA, and SLH-DSA.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Adversaries who possess a quantum computer
- **Migration Timeline Info**: Effective August 13, 2024
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key management
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Processing Standards; FIPS 203; FIPS 204; FIPS 205
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NIST has finalized the first three PQC standards effective August 13, 2024; ML-KEM is specified with three parameter sets (ML-KEM-512, ML-KEM-768, ML-KEM-1024) offering increasing security strength and decreasing performance; The security of ML-KEM relies on the Module Learning with Errors problem; These standards enable secure key establishment against quantum adversaries.
- **Security Levels & Parameters**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Compliance; Timeline; Migrate; pqc-101
- **Phase Classification Rationale**: The document explicitly states "FIPS 203 (Final)" and describes the publication of standards, indicating a transition from draft to formal standardization.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from Draft to Final Standardization — signals the official release of FIPS 203, 204, and 205 for implementation.
- **Historical Significance**: This represents the first set of PQC standards published by NIST, marking the formal standardization of ML-KEM, ML-DSA, and SLH-DSA.
- **Implementation Timeline Dates**: August 13, 2024; 08/24/23: FIPS 203 (Draft); 08/13/24: FIPS 203 (Final)
- **Successor Events & Dependencies**: Enables adoption of ML-KEM, ML-DSA, and SLH-DSA in systems requiring Federal Information Processing Standards compliance.

---

## United States:NIST — NIST IR 8547 Transition Guidance (Draft)

- **Reference ID**: United States:NIST — NIST IR 8547 Transition Guidance (Draft)
- **Title**: NIST IR 8547 Transition Guidance (Draft)
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2024-11-12
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NIST's initial public draft guidance outlining the expected approach and timelines for transitioning federal agencies, industry, and standards organizations from quantum-vulnerable algorithms to post-quantum cryptography standards.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, federal agencies, industry, standards organizations
- **Leaders Contributions Mentioned**: Dustin Moody (NIST); Ray Perlner (NIST); Andrew Regenscheid (NIST); Angela Robinson (NIST); David Cooper (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The report identifies existing quantum-vulnerable cryptographic standards and the quantum-resistant standards for migration; It is intended to foster engagement with industry, standards organizations, and relevant agencies; Public comments received will be used to revise this transition plan; The guidance aims to accelerate the adoption of post-quantum cryptography in information technology products and services
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Compliance Officer; Security Architect; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Migrate; Algorithms; Leaders; migration-program
- **Phase Classification Rationale**: The document is explicitly titled "Transition Guidance (Draft)" and describes NIST's "expected approach" to transitioning, indicating it provides strategic direction rather than a final mandate.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from algorithm standardization to transition planning — signals the beginning of formal migration guidance for federal agencies and industry.
- **Historical Significance**: Represents NIST's first public draft of a comprehensive transition plan to move from quantum-vulnerable algorithms to post-quantum standards, setting the stage for future mandatory requirements.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires revision based on public comments received by January 10, 2025; Enables algorithm- and application-specific guidance for the transition to PQC.

---

## United States:White House — PQC Report to Congress

- **Reference ID**: United States:White House — PQC Report to Congress
- **Title**: PQC Report to Congress
- **Authors**: Executive Office of the President
- **Publication Date**: 2024-07-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: White House report outlining the Federal Government's strategy, funding estimates, and NIST-led standardization efforts for migrating to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC); record-now-decrypt-later attacks
- **Migration Timeline Info**: Migration progress expected during 2024 and beyond; budget projections through 2035; data expected to remain mission-sensitive in 2035 prioritized for migration
- **Applicable Regions / Bodies**: United States; Office of Management and Budget (OMB); National Institute of Standards and Technology (NIST); Department of Homeland Security Cybersecurity and Infrastructure Security Agency (CISA); Senate Committee on Homeland Security and Governmental Affairs; House Committee on Oversight and Accountability
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public-key cryptography; digital signature schemes; automated cryptographic inventory solutions; zero trust architecture
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Quantum Computing Cybersecurity Preparedness Act, Public Law No: 117-260; National Security Memorandum 10 (NSM-10); OMB Memorandum M-23-02; Executive Order 14028; OMB Memorandum M-22-09
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must maintain a comprehensive and ongoing cryptographic inventory to baseline migration efforts; Migration must begin immediately due to the threat of record-now-decrypt-later attacks before CRQCs exist; Agencies must prioritize high impact systems and data expected to remain sensitive in 2035 for early migration; Interoperability failures may occur if systems are not migrated simultaneously, requiring careful planning
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Compliance Officer; Security Architect; CISO
- **Implementation Prerequisites**: Comprehensive cryptographic inventory; automated inventory capability evolution; annual manual inventory of hardware and software; identification of systems unable to support PQC algorithms
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Compliance, Timeline, migration-program, pqc-risk-management, data-asset-sensitivity
- **Phase Classification Rationale**: This document is a formal report to Congress mandated by the Quantum Computing Cybersecurity Preparedness Act (Public Law No: 117-260) and National Security Memorandum 10, outlining the Federal Government's strategy and funding estimates for PQC migration.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from strategic planning and inventory assessment to the execution of prioritized migration for high-value assets, enabling the development of automated inventory capabilities.
- **Historical Significance**: Represents a formal congressional reporting milestone that quantifies the $7.1B government-wide cost for PQC migration and establishes a federal strategy under NSM-10 to address record-now-decrypt-later threats before CRQCs exist.
- **Implementation Timeline Dates**: 2024: significant progress in migrating to PQC; 2035: data expected to remain mission-sensitive; 2025-2035: government-wide migration cost estimate period
- **Successor Events & Dependencies**: Development of automated cryptographic inventory solutions; annual manual inventory requirements under M-23-02; prioritization of high impact information systems and agency high value assets for migration
- **Extraction Note**: Base enrichment reused from library record WH-PQC-Report-2024; timeline dimensions extracted separately

---

## United States:NSA — CNSA 2.0 Algorithms Revised

- **Reference ID**: United States:NSA — CNSA 2.0 Algorithms Revised
- **Title**: CNSA 2.0 Algorithms Revised
- **Authors**: National Security Agency
- **Publication Date**: 2025-05-30
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases an update to CNSA 2.0 guidance specifying required quantum-resistant algorithms and transition timelines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024; ML-DSA-87; LMS; XMSS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Transition timeline between 2025 and 2030 for US National Security Systems.
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NSA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex
- **Protocols Covered**: IKEv2
- **Infrastructure Layers**: Root-of-trust; Hardware validation (CVMP)
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: CNSA 2.0; CNSA 1.0; CAVP; CVMP
- **Classical Algorithms Referenced**: AES-256; SHA-384; SHA-512; SHA-256; SHA-192
- **Key Takeaways**: US National Security Systems must transition to CNSA 2.0 algorithms between 2025 and 2030; NSA does not require hybrid certified products for security purposes but anticipates keeping CNSA 1.0 as a hybrid layer in IKEv2; Quantum Key Distribution is considered impractical and inappropriate for quantum resilience; SLH-DSA, HSS, XMSS MT, SHA-3, SHAKE, and ASCON are excluded from CNSA 2.0; Code signing requires hardware validated by CVMP or other NSA guidance with no waivers granted.
- **Security Levels & Parameters**: ML-KEM-1024; ML-DSA-87; AES-256; SHA-384; SHA-512; LMS (SHA-256/192 recommended); XMSS
- **Hybrid & Transition Approaches**: PQ/T hybrid schemes not recommended for security purposes but CNSA 1.0 algorithms kept as a hybrid layer with CNSA 2.0 for IKEv2 key establishment indefinitely.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker; Developer
- **Implementation Prerequisites**: CAVP testing for software/firmware validation if only validating signatures; CVMP validated hardware or other NSA guidance for code signing; collaboration with IETF through RFC series for protocol details.
- **Relevant PQC Today Features**: Compliance; Algorithms; Migration-program; qkd; stateful-signatures; code-signing
- **Phase Classification Rationale**: The document represents a Policy phase event as it is an official update to NSA guidance (CNSA 2.0) that reinforces requirements for US National Security Systems and clarifies algorithm mandates.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Defense; Technology
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from initial guidance publication to reinforced mandatory implementation with clarified algorithm exclusions and hybrid transition strategies for specific protocols like IKEv2.
- **Historical Significance**: This update solidifies the first national security mandate for specific post-quantum algorithms (ML-KEM, ML-DSA) while explicitly rejecting Quantum Key Distribution as a viable alternative for US National Security Systems.
- **Implementation Timeline Dates**: 2025: Start of transition timeline; 2030: End of transition timeline
- **Successor Events & Dependencies**: Requires IETF RFC series to add detail to protocol options and algorithm choices; Enables vendors to upgrade supply chains to quantum resilience based on approved solutions.

---

## United States:CISA — Automated PQC Discovery Strategy

- **Reference ID**: United States:CISA — Automated PQC Discovery Strategy
- **Title**: Automated PQC Discovery Strategy
- **Authors**: Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2024-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: CISA strategy outlining the approach for Federal Civilian Executive Branch agencies to adopt automated cryptography discovery and inventory tools for assessing Post-Quantum Cryptography migration progress.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: Data expected to remain mission-sensitive in 2035; annual submission of inventory required
- **Applicable Regions / Bodies**: United States; Federal Civilian Executive Branch (FCEB); Cybersecurity and Infrastructure Security Agency (CISA); Office of Management and Budget (OMB); Office of the National Cyber Director (ONCD); National Institute of Standards and Technology (NIST); National Security Agency
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; cloud-based information systems; on-premises information systems; database systems; file systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act of 2014 (FISMA); Federal Information Processing Standard 199 (FIPS 199); Memorandum 2302 (M-23-02); National Security Memorandum 10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must inventory active cryptographic systems using automated tools where possible and manual means for embedded or custom software; Three specific data items (algorithm, service provided, key length) can be collected via ACDI or CDM tools while six other items require manual collection; Integration of ACDI tools with the Continuous Diagnostics and Mitigation (CDM) Program aims to reduce resource requirements for inventory generation; Vendors may simplify inventory processes by advertising product roadmaps for PQC-hybrid or PQC-only modes; The strategy applies to high impact systems, High Value Assets, and systems containing data sensitive in 2035.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC-hybrid mode; PQC-only mode
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Operations; Policy Maker
- **Implementation Prerequisites**: Automated Cryptography Discovery and Inventory (ACDI) tools; Continuous Diagnostics and Mitigation (CDM) Program integration; CyberScope for reporting; Manual tracking for embedded cryptography or customized applications
- **Relevant PQC Today Features**: Assess; Migrate; Compliance; Threats; Migration-program
- **Phase Classification Rationale**: This document outlines CISA's strategy for using automated tools to assess agency progress toward PQC adoption as directed by OMB Memorandum M-23-02; it provides specific methodologies for inventorying cryptographic systems rather than setting new independent mandates.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from the initial mandate to inventory cryptographic systems (M-23-02) into the operational phase of automated discovery and reporting via ACDI tools and CDM integration.
- **Historical Significance**: Represents a pivotal shift from manual reporting requirements to an automated, tool-driven approach for federal agencies to identify quantum-vulnerable cryptography across their infrastructure.
- **Implementation Timeline Dates**: August 15, 2024: Publication date; November 18, 2022: OMB M-23-02 issuance date; 2035: Data sensitivity threshold for mission-sensitive information
- **Successor Events & Dependencies**: NIST SP 1800-38 Volume B publication; Integration of ACDI tools with CDM Program; Annual inventory submission to ONCD and CISA
- **Extraction Note**: Base enrichment reused from library record US-CISA-ACDI-Strategy-2024; timeline dimensions extracted separately

---

## United States:CISA — PQC Considerations for OT

- **Reference ID**: United States:CISA — PQC Considerations for OT
- **Title**: PQC Considerations for OT
- **Authors**: Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2024-10-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: CISA guidance on post-quantum cryptography considerations and migration challenges specific to operational technology (OT) environments including ICS and SCADA systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptanalytically relevant quantum computer (CRQC); threats to data confidentiality and integrity; unauthorized remote access; machine-in-the-middle attacks; persistent malware installations via Secure Boot exploitation; decryption of sensitive information.
- **Migration Timeline Info**: Transition is a complex, multi-year process; planning steps can begin immediately; post-quantum algorithms available from NIST in 2024 are expected to be resilient against CRQCs.
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); Department of Homeland Security (DHS).
- **Leaders Contributions Mentioned**: Alejandro N. Mayorkas (Secretary of Homeland Security, March 2021 vision for cybersecurity resilience).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Open Platform Communications United Architecture (OPC UA); Modbus Transmission Control Protocol (TCP); Virtual Private Network (VPN).
- **Infrastructure Layers**: Public-key cryptography; Secure Boot; BIOS; boot loader; kernel; identity and access management mechanisms.
- **Standardization Bodies**: National Institute for Standards and Technology (NIST).
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: OT owners and operators must plan for emerging CRQC capabilities now rather than waiting; minimize OT exposure to quantum threats via strong network segmentation; ensure crypto-agility in applications and protocols; apply quantum mitigation considerations to platform update schedules and upgrade lifecycles.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility in applications and protocols; minimizing OT exposure via strong network segmentation.
- **Performance & Size Considerations**: None detected
- **Target Audience**: U.S. critical infrastructure owners and operators; OT vendors and manufacturers; Security Architect; Compliance Officer.
- **Implementation Prerequisites**: Identifying personnel and resources; inventorying systems; addressing long software patching cycles; managing hardware replacement times; adhering to strict procedures and governance.
- **Relevant PQC Today Features**: iot-ot-pqc; pqc-risk-management; migration-program; crypto-agility; vendor-risk
- **Phase Classification Rationale**: This document provides strategic guidance and recommendations for OT owners and operators to plan for quantum threats rather than enforcing specific technical mandates or deadlines. It outlines risks and mitigation strategies without prescribing a mandatory compliance framework.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Critical Infrastructure; Energy; Transportation; Technology; Government
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from general awareness of quantum threats to actionable planning and inventorying for OT-specific post-quantum migration.
- **Historical Significance**: Represents a critical milestone where CISA explicitly addresses the unique challenges of Operational Technology in the context of post-quantum cryptography, distinguishing OT risks from standard IT environments.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Inventorying systems; identifying personnel and resources; implementing strong OT network segmentation; ensuring crypto-agility; applying quantum mitigation to platform update schedules
- **Extraction Note**: Base enrichment reused from library record US-CISA-PQC-OT-2024; timeline dimensions extracted separately

---

## United States:NIST — HQC Selected as Fifth Algorithm

- **Reference ID**: United States:NIST — HQC Selected as Fifth Algorithm
- **Title**: HQC Selected as Fifth Algorithm
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2025-03-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NIST selects HQC as a backup post-quantum encryption algorithm based on error-correcting codes to complement ML-KEM.
- **PQC Algorithms Covered**: HQC, ML-KEM, FALCON
- **Quantum Threats Addressed**: Quantum computers breaking current encryption; future quantum computer attacks on stored data and internet traffic
- **Migration Timeline Info**: Draft standard for HQC in about a year; finalized standard expected in 2027; organizations should migrate to standards finalized in 2024
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Dustin Moody, mathematician who heads NIST's Post-Quantum Cryptography project
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Encapsulation Mechanisms (KEMs)
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, FIPS 206, NIST Special Publication 800-227
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HQC serves as a backup defense for general encryption if ML-KEM is compromised; organizations should continue migrating to standards finalized in 2024; HQC uses error-correcting codes while ML-KEM uses structured lattices; HQC demands more computing resources than ML-KEM
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Backup standard based on different math approach; fallback in case ML-KEM proves vulnerable
- **Performance & Size Considerations**: HQC is a lengthier algorithm than ML-KEM; HQC demands more computing resources
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Timeline; Migrate; Leaders; crypto-agility
- **Phase Classification Rationale**: The document announces the selection of HQC as a fifth algorithm and states NIST plans to issue a draft standard in about a year with a finalized standard in 2027, marking the transition from candidate selection to formal standardization.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: All Sectors; Government; Healthcare; Finance; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from algorithm selection to standardization development; enables the creation of a draft standard for public comment and eventual finalization in 2027.
- **Historical Significance**: HQC is the first backup KEM algorithm selected by NIST to provide a second line of defense based on error-correcting codes, diversifying the mathematical foundation of post-quantum standards.
- **Implementation Timeline Dates**: March 11, 2025: Selection announcement; about a year from March 2025: Draft standard release; 90-day comment period following draft; 2027: Finalized standard release
- **Successor Events & Dependencies**: Requires release of draft standard for public comment; contingent on addressing comments during the 90-day period; enables finalization of HQC standard in 2027.

---

## United States:White House — Executive Order 14144

- **Reference ID**: United States:White House — Executive Order 14144
- **Title**: Executive Order 14144
- **Authors**: Executive Office of the President
- **Publication Date**: 2025-01-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The document is an access control page for FederalRegister.gov and eCFR.gov requiring CAPTCHA verification due to automated scraping flags.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States government
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Programmatic access to FederalRegister.gov and eCFR.gov is limited due to aggressive automated scraping; Human users must complete a CAPTCHA bot test to request access; Technical help for IP range requests is available via the Site Help button; Confidential information should not be provided in the contact form.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Operations
- **Implementation Prerequisites**: CAPTCHA completion; Access to FederalRegister.gov API documentation or eCFR.gov API documentation
- **Relevant PQC Today Features**: compliance-strategy, migration-program
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record EO-14144; timeline dimensions extracted separately

---

## United States:White House — Executive Order 14306 Issued

- **Reference ID**: United States:White House — Executive Order 14306 Issued
- **Title**: Executive Order 14306 Issued
- **Authors**: Executive Office of the President
- **Publication Date**: 2025-06-06
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: CISA released a list of product categories supporting post-quantum cryptography standards pursuant to Executive Order 14306 to assist organizations in migration strategies.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing poses a threat to the confidentiality, integrity, and accessibility of sensitive data relying on public-key cryptography
- **Migration Timeline Info**: Requires TLS 1.3 adoption by 2030; Executive Order 14306 issued June 6, 2025
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); Department of Homeland Security (DHS); National Security Agency (NSA)
- **Leaders Contributions Mentioned**: Madhu Gottumukkala, Acting Director of CISA; President Trump
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Cloud services; web software; networking hardware and software; endpoint security; key establishment; digital signatures
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Executive Order 14306; Executive Order 13694; Executive Order 14144
- **Classical Algorithms Referenced**: public-key cryptography
- **Key Takeaways**: Organizations must prioritize procurement of PQC-capable technologies to address quantum threats; CISA list identifies hardware and software categories supporting PQC standards; Migration strategies should focus on key establishment and digital signatures; The product list will be regularly updated to reflect the evolving technology landscape
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Technologies transitioning to use PQC standards
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Assess
- **Phase Classification Rationale**: This document represents a Policy phase event as it is an Executive Order issued by the President that amends previous orders to establish federal mandates and deadlines for post-quantum cryptography transition.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense; Critical Infrastructure
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from preparatory guidance to enforceable federal requirements, enabling the shift toward PQC-supportive Transport Layer Security protocols by 2030.
- **Historical Significance**: This order formally codifies the transition to post-quantum cryptography within US federal policy, setting a specific 2030 deadline for agencies to support TLS 1.3 or successors resistant to cryptanalytically relevant quantum computers.
- **Implementation Timeline Dates**: December 1, 2025: release of PQC product availability list; January 2, 2030: deadline for agencies to support TLS 1.3 or successor versions
- **Successor Events & Dependencies**: Release of PQC product category list by CISA; issuance of agency requirements by NSA and OMB; transition to cryptographic algorithms not vulnerable to CRQC
- **Extraction Note**: Base enrichment reused from library record EO-14306; timeline dimensions extracted separately

---

## United States:NIST — IR 8547 Public Comments Published

- **Reference ID**: United States:NIST — IR 8547 Public Comments Published
- **Title**: IR 8547 Public Comments Published
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2025-01-10
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Publication of public comments received on the initial public draft of NIST IR 8547 regarding the transition to Post-Quantum Cryptography Standards.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, Ascon-AEAD128, Ascon-Hash256, Ascon-XOF128, Ascon-CXOF128
- **Quantum Threats Addressed**: CRQC; Harvest now, decrypt later
- **Migration Timeline Info**: Quantum-vulnerable digital signature algorithms generally disallowed after 2035; deprecation suggested starting 2030+ for specific use cases.
- **Applicable Regions / Bodies**: United States; NIST; Federal agencies; Government contractors
- **Leaders Contributions Mentioned**: Sonmez Turan, Meltem; Martin Schläffer; Prof. Steve Babbage; Andreas Bartelt; Abel C. H. Chen; Deirdre Connolly
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; IKE (Internet Key Exchange)
- **Infrastructure Layers**: PKI; Key Management; Embedded systems
- **Standardization Bodies**: NIST; IETF (implied via lightweight-crypto context); IEEE (mentioned in author bio)
- **Compliance Frameworks Referenced**: FIPS 204; FIPS 205; SP 800-56A; FIPS publications
- **Classical Algorithms Referenced**: SHAKE-128; RSA (implied via "quantum-vulnerable"); ECDSA (implied via "quantum-vulnerable")
- **Key Takeaways**: Confidentiality migration is more urgent than authenticity due to harvest now decrypt later scenarios; Hybrid schemes require clarity on whether classical components are disallowed after deprecation dates; Engineering tradeoffs for PQC signatures in TLS may be unacceptable for short-lived or low-value data; Ascon family algorithms should be included in the final standard with specific security levels.
- **Security Levels & Parameters**: Level 1 (Ascon-AEAD128); Level 2 (Ascon-Hash256, Ascon-XOF128, Ascon-CXOF128); ML-KEM-768; ML-KEM-1024; ML-DSA-44; ML-DSA-768; ML-DSA-1024; 128 bits security strength; 192 bits security strength
- **Hybrid & Transition Approaches**: Hybrid schemes combining classical and PQC algorithms; Composite mechanisms for key establishment and digital signature; Pre-hash versions of ML-DSA and SLH-DSA
- **Performance & Size Considerations**: Integration of ML-DSA into TLS results in an additional round-trip during handshake due to TCP initial window size; Engineering tradeoffs for ML-KEM are typically acceptable.
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker; Developer
- **Implementation Prerequisites**: Approved RBG with at least 128 bits of security strength; Digest algorithm providing same classical security strength as PQC parameter set
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Algorithms; hybrid-crypto; crypto-agility; tls-basics; pki-workshop; migration-program
- **Phase Classification Rationale**: The document represents a Standardization phase event as it contains public comments on the "Initial Public Draft" of NIST IR 8547, which is a formal guidance document for transitioning to PQC standards.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Telecommunications; Technology; Critical Infrastructure
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from Initial Public Draft to Final Version development based on public feedback; signals the formalization of transition timelines for federal and contractor systems.
- **Historical Significance**: Represents a critical step in finalizing NIST's official guidance on deprecating quantum-vulnerable algorithms, impacting federal agencies and government contractors.
- **Implementation Timeline Dates**: November 12, 2024: Publication of Initial Public Draft; January 10, 2025: Comment period closed; 2030+: Suggested start for deprecation of quantum-vulnerable signatures in specific use cases; 2035: General disallowance date for quantum-vulnerable digital signature algorithms.
- **Successor Events & Dependencies**: Requires finalization of NIST IR 8547; Enables implementation of hybrid schemes compliant with FIPS 204 and FIPS 205; Contingent on global industry-led standards bodies for non-federal systems.

---

## United States:NIST — FIPS 206 (FN-DSA) Draft Submitted

- **Reference ID**: United States:NIST — FIPS 206 (FN-DSA) Draft Submitted
- **Title**: FIPS 206 (FN-DSA) Draft Submitted
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2025-08-28
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NIST submits a draft standard for FN-DSA (FIPS 206) based on the FALCON algorithm for approval.
- **PQC Algorithms Covered**: FN-DSA; FALCON
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Initial Public Draft expected Q4 2025; Final standard expected late 2026/early 2027
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 206
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: FN-DSA draft standard submitted for approval; Initial public draft anticipated in Q4 2025; Final standard expected by late 2026 or early 2027
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Algorithms; Compliance; Standardization
- **Phase Classification Rationale**: The document describes the submission of a draft standard for approval, indicating a formal move into the standardization process.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Long-Term
- **Phase Transition Narrative**: Moves from draft submission to public review and final standardization; enables future adoption of FN-DSA in systems requiring FIPS compliance.
- **Historical Significance**: Represents the formal submission of the FN-DSA algorithm as a NIST draft standard, marking a key step toward its official adoption.
- **Implementation Timeline Dates**: Q4 2025: Initial Public Draft expected; late 2026/early 2027: Final standard expected
- **Successor Events & Dependencies**: None detected

---

## United States:NIST — Sixth PQC Standardization Conference

- **Reference ID**: United States:NIST — Sixth PQC Standardization Conference
- **Title**: Sixth PQC Standardization Conference
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2025-09-25
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NIST holds the Sixth PQC Standardization Conference to discuss FIPS 206 and FN-DSA (Falcon) algorithm updates.
- **PQC Algorithms Covered**: FN-DSA, Falcon
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Ray Perlner: Presented FIPS 206: FN-DSA (Falcon) at the Sixth PQC Standardization Conference
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 206
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NIST is finalizing FN-DSA (Falcon) under FIPS 206; The Sixth PQC Standardization Conference serves as a venue for discussing algorithm updates; Migration guidance is a key discussion topic alongside standardization
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Researcher; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document describes the "Sixth PQC Standardization Conference" where NIST presents "FIPS 206: FN-DSA (Falcon)", indicating a formal standardization event.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from draft discussion to final FIPS publication presentation, enabling formal adoption of FN-DSA (Falcon).
- **Historical Significance**: Represents the official presentation of FIPS 206 for FN-DSA (Falcon) at a major NIST standardization conference.
- **Implementation Timeline Dates**: September 24, 2025; September 25, 2025; September 26, 2025
- **Successor Events & Dependencies**: None detected

---

## United States:NIST NCCoE — CSWP 48 PQC Migration Mappings Draft

- **Reference ID**: United States:NIST NCCoE — CSWP 48 PQC Migration Mappings Draft
- **Title**: CSWP 48 PQC Migration Mappings Draft
- **Authors**: NIST National Cybersecurity Center of Excellence
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NCCoE publishes a draft white paper mapping PQC migration capabilities to NIST Cybersecurity Framework 2.0 and SP 800-53 security controls.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later; future quantum computing breaking conventional algorithms
- **Migration Timeline Info**: Comment period closed October 20, 2025; predictions suggest cryptographically relevant quantum computers may be possible in less than 10 years
- **Applicable Regions / Bodies**: United States; NCCoE; NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST Cybersecurity Framework 2.0; SP 800-53
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should start planning now to migrate to PQC to protect high value long-lived sensitive data; Migration takes a long time from standardization to full integration; Harvest now decrypt later attacks threaten encrypted data even before quantum computers are built; CSWP 48 aligns PQC migration with established risk management practices and security controls
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Compliance; Migrate; pqc-risk-management; migration-program
- **Phase Classification Rationale**: The document is an initial public draft of a white paper inviting feedback, indicating it serves as guidance to align risk management practices with PQC capabilities rather than a binding mandate.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: All Sectors; Government
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from general awareness of quantum threats to actionable alignment with existing risk frameworks, enabling organizations to map PQC migration capabilities to specific security controls.
- **Historical Significance**: Represents the first NCCoE draft mapping PQC project capabilities directly to NIST CSF 2.0 and SP 800-53, bridging the gap between technical migration and risk management compliance.
- **Implementation Timeline Dates**: October 20, 2025: Comment period closed; September 18, 2025: Draft published
- **Successor Events & Dependencies**: Requires public feedback submission by October 20, 2025 to finalize the white paper; Enables organizations to identify specific security controls needed for PQC implementation.

---

## United States:NIST NCCoE — PQC Interoperability Testing

- **Reference ID**: United States:NIST NCCoE — PQC Interoperability Testing
- **Title**: PQC Interoperability Testing
- **Authors**: NIST National Cybersecurity Center of Excellence
- **Publication Date**: 2024-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NIST's Post-Quantum Cryptography (PQC) project, standards, and migration to quantum-resistant cryptography
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, Falcon, HQC
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: NIST will deprecate and ultimately remove quantum-vulnerable algorithms from its standards by 2035, with high-risk systems transitioning much earlier
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, NSA
- **Leaders Contributions Mentioned**: Dr. Dustin Moody (PQC Crypto Technical Inquiries)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly states that the NCCoE performs interoperability testing of standardized PQC algorithms and supports interoperable solutions as part of the migration effort.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from standardization to deployment by validating interoperable solutions and enabling organizations to migrate systems to quantum-resistant cryptography.
- **Historical Significance**: Marks the operational phase following the 2024 release of principal PQC standards, initiating the global effort to secure electronic information against future quantum threats.
- **Implementation Timeline Dates**: August 2024: NIST released principal PQC standards; 2035: NIST will deprecate and remove quantum-vulnerable algorithms from its standards
- **Successor Events & Dependencies**: Organizations identifying vulnerable algorithms; updating cybersecurity products, services, and protocols; high-risk systems transitioning much earlier than 2035
- **Extraction Note**: Base enrichment reused from library record FIPS 206; timeline dimensions extracted separately

---

## United States:NSA — NSS Acquisitions CNSA 2.0 Required

- **Reference ID**: United States:NSA — NSS Acquisitions CNSA 2.0 Required
- **Title**: NSS Acquisitions CNSA 2.0 Required
- **Authors**: National Security Agency
- **Publication Date**: 2024-12-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: New National Security Systems acquisitions must be CNSA 2.0 compliant starting January 2027, driven by NSA requirements and NIST standardization.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC), Harvest Now Decrypt Later (HNDL), Shor's algorithm
- **Migration Timeline Info**: Software/firmware signing support 2025; Networking Equipment support 2026; Operating Systems support 2027; Exclusive CNSA 2.0 use for most categories by 2030-2033; Legacy systems by 2035
- **Applicable Regions / Bodies**: United States; National Security Systems (NSS); NSA; White House; NIST
- **Leaders Contributions Mentioned**: Matthew Stubbs (Author)
- **PQC Products Mentioned**: PQMicroLib-Core, PQCryptoLib-Core, PQCryptoLib-SDK, PQPlatform-CoPro, PQPlatform-TrustSys, PQPerform-Flare, PQPerform-Inferno, PQPerform-Flex, UltraPQ suite
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST; NSA
- **Compliance Frameworks Referenced**: CNSA 2.0; FIPS 197; FIPS 203; FIPS 204; FIPS 180-4; NIST SP 800-208; FIPS 202
- **Classical Algorithms Referenced**: AES-256, SHA-384, SHA-512, SHA-256, ECC (elliptic curve cryptography)
- **Key Takeaways**: New NSS acquisitions must be CNSA 2.0 compliant starting January 2027; Organizations should prioritize high-value assets for PQC transition to mitigate Harvest Now Decrypt Later threats; CNSA 2.0 mandates a multi-stage roadmap with exclusive use deadlines between 2030 and 2035; Vendors selling to the US government must prove compliance to fuel the supply chain; The NSA recommends PQC over alternatives such as QKD
- **Security Levels & Parameters**: ML-KEM-1024; ML-DSA-87; SHA-256/192 (LMS recommended); 256-bit keys; SHA3-384 or SHA3-512
- **Hybrid & Transition Approaches**: Cryptographic agility; Defense-in-depth strategy using different mathematical foundations
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Policy Maker, Vendor
- **Implementation Prerequisites**: Inventory and prioritization of high-value assets; CNSA 2.0 compliant algorithms; Proof of compliance for vendors selling to US government
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; code-signing
- **Phase Classification Rationale**: The document explicitly sets a "deadline for compliance" and states that starting in 2027, any vendor selling new equipment to the US government must prove CNSA 2.0 compliance, marking a mandatory transition point.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Defense; Technology; Telecommunications; Healthcare; Automotive; Industrial IoT; Semiconductors and Manufacturing
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from proposed recommendations to ready for implementation following NIST standardization, transitioning National Security Systems from legacy cryptography to exclusive CNSA 2.0 usage by defined dates.
- **Historical Significance**: Represents the formalization of the NSA's post-quantum roadmap into a procurement mandate for US government systems, solidifying the shift from theoretical risk to actionable compliance requirements.
- **Implementation Timeline Dates**: 2025: Support and Prefer CNSA 2.0 for Software/firmware signing; Web Browsers/Cloud Services; 2026: Support and Prefer CNSA 2.0 for Networking Equipment; 2027: Support and Prefer CNSA 2.0 for Operating Systems; Mandatory compliance start for new NSS acquisitions; 2030: Exclusively Use CNSA 2.0 for Software/firmware signing; Networking Equipment; Niche/Custom Equipment; 2033: Exclusively Use CNSA 2.0 for Operating Systems; Web Browsers/Cloud Services; 2035: Exclusively Use CNSA 2.0 for Legacy Systems
- **Successor Events & Dependencies**: Requires NIST standardization of ML-KEM, ML-DSA, and SLH-DSA; Enables vendors to deploy compliance into commercial products; Contingent on inventory and prioritization of high-value assets by organizations.

---

## United States:CISA — CISA PQC Product Category List Publication

- **Reference ID**: United States:CISA — CISA PQC Product Category List Publication
- **Title**: CISA PQC Product Category List Publication
- **Authors**: Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2026-01-23
- **Last Updated**: Not specified
- **Document Status**: Completed
- **Main Topic**: CISA provides updated lists of hardware and software product categories where post-quantum cryptography (PQC) products are widely available or transitioning, in response to Executive Order 14306.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, HMS, XMSS, XMSSMT
- **Quantum Threats Addressed**: cryptographically relevant quantum computer (CRQC)
- **Migration Timeline Info**: By December 1, 2025, CISA shall release and regularly update a list of product categories with widely available PQC products; organizations should plan acquisitions to procure only PQC-capable products in listed categories.
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); National Security Agency (NSA); General Services Administration (GSA); Federal Civilian Executive Branch (FCEB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public key infrastructure (PKI); Hardware security modules (HSM); Key establishment; Digital signatures
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) 203; Federal Information Processing Standards (FIPS) 204; Federal Information Processing Standards (FIPS) 205; NISTSP 800-208; Executive Order 14306
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should acquire only PQC-capable products in categories listed as widely available; Table 3 lists categories where manufacturer implementation of PQC is encouraged but not yet widely available; Products must support PQC for key establishment and digital signatures to be fully quantum resistant; Operational technology (OT) and internet of things (IoT) devices are out of scope for these specific lists.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Organizations may need to use non-PQC algorithms for a time for interoperability reasons even after procuring PQC products; CISA will move product categories from Table 3 to Table 2 as they mature their capabilities and transition to PQC.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Procurement Officer, Policy Maker
- **Implementation Prerequisites**: Products must implement PQC for core features and all secondary functionality such as software updates; Organizations must plan acquisitions in accordance with typical procurement policies and procedures.
- **Relevant PQC Today Features**: Compliance, Migrate, Assess, Algorithms, stateful-signatures
- **Phase Classification Rationale**: This document represents a Regulation phase event as it outlines CISA's initiative to foster adoption of policies and standards mandated by Executive Order 14306 and developed with the NSA. It explicitly directs stakeholders to follow the DHS Post-Quantum Cryptography Roadmap for inventorying systems and planning transitions.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from risk assessment and awareness to active planning, inventorying of public-key cryptography systems, and preparation for the implementation of new standards.
- **Historical Significance**: This milestone marks the formal establishment of CISA's PQC Initiative on July 6, 2022, unifying federal efforts to address quantum threats across 55 National Critical Functions. It initiates the coordinated transition from current cryptographic standards to post-quantum cryptography for critical infrastructure and government networks.
- **Implementation Timeline Dates**: July 6, 2022: CISA announced the establishment of the PQC Initiative; 2024: NIST expected to publish a standard for use by commercial products
- **Successor Events & Dependencies**: Publication of official NIST standards in 2024; Inventorying organizational systems for public-key cryptography; Testing new standards in lab environments; Creating acquisition policies regarding post-quantum cryptography
- **Extraction Note**: Base enrichment reused from library record CISA-PQC-CATEGORY-LIST-2026; timeline dimensions extracted separately

---

## International:PKI Consortium — PKI Consortium PQC Conference 2025 Conclusions

- **Reference ID**: International:PKI Consortium — PKI Consortium PQC Conference 2025 Conclusions
- **Title**: PKI Consortium PQC Conference 2025 Conclusions
- **Authors**: Public Key Infrastructure Consortium
- **Publication Date**: 2025-11-03
- **Last Updated**: Not specified
- **Document Status**: Completed
- **Main Topic**: The PKI Consortium's Post-Quantum Cryptography Conference 2025 in Kuala Lumpur concluded with an urgent global call to migrate to quantum-resistant encryption and the announcement of Malaysia's national PQC roadmap.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers rendering today's encryption obsolete; compromise of financial systems, national defense, healthcare, and transportation within minutes; exposure of vast data stores and critical infrastructure
- **Migration Timeline Info**: Conference held 28-30 October 2025; next conference in Germany in 2026; urgent call to act now before quantum computers make data unsafe
- **Applicable Regions / Bodies**: Regions: Malaysia, ASEAN, Southeast Asia, Germany; Bodies: PKI Consortium, Ministry of Digital Malaysia, National Cyber Security Agency (NACSA)
- **Leaders Contributions Mentioned**: Paul van Brouwershaven (Chair of the PKI Consortium and its Post-Quantum Cryptography Working Group); Chris Bailey (Board and Executive Council Chair of the PKI Consortium)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure (PKI), critical infrastructure, Internet of Things (IoT)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must begin replacing vulnerable cryptography immediately to safeguard the digital economy; Malaysia has launched a National Post-Quantum Cryptography Readiness Roadmap for ASEAN; The PKI Consortium introduced the Post-Quantum Cryptography Maturity Model (PQCMM) to assess preparedness; Global coordination is required across government, industry, and academia to accelerate migration; High-risk sectors like healthcare and IoT require specific protection strategies
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Cryptographic agility; migration planning; system-wide cryptographic migrations
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Government Leaders, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Migrate, Assess, Leaders, Threats, Timeline, pki-workshop, iot-ot-pqc
- **Phase Classification Rationale**: The document outlines the launch of the Post-Quantum Cryptography Maturity Model (PQCMM) and a national roadmap to help organizations assess preparedness and plan migration, rather than enforcing immediate compliance.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; Healthcare; Transportation; Critical Infrastructure; Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from global awareness and warning to coordinated action and the deployment of practical assessment frameworks for migration planning.
- **Historical Significance**: Marks the conclusion of the world's largest dedicated PQC gathering, signaling the beginning of a collective global move toward post-quantum readiness with Malaysia leading regional efforts in ASEAN.
- **Implementation Timeline Dates**: 28-30 October 2025: Post-Quantum Cryptography Conference 2025; 2026: Next Post-Quantum Cryptography Conference in Germany
- **Successor Events & Dependencies**: Next Post-Quantum Cryptography Conference in Germany 2026; implementation of the National Post-Quantum Cryptography Readiness Roadmap; deployment of the Post-Quantum Cryptography Maturity Model (PQCMM)
- **Extraction Note**: Base enrichment reused from library record PKI-Consortium-PQC-2025; timeline dimensions extracted separately

---

## United States:SEALSQ — US Post-Quantum Root of Trust Service Launch

- **Reference ID**: United States:SEALSQ — US Post-Quantum Root of Trust Service Launch
- **Title**: US Post-Quantum Root of Trust Service Launch
- **Authors**: SEALSQ Corp
- **Publication Date**: 2025-11-21
- **Last Updated**: Not specified
- **Document Status**: Completed
- **Main Topic**: SEALSQ launches a US-based Post-Quantum Root of Trust service aligned with NIST PQC standards and NSA CNSA 2.0, integrating with Quantum Shield QS7001 hardware.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, NSA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Quantum Shield QS7001
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Root of Trust; Hardware Security Module (implied by hardware integration)
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SEALSQ has launched a US-based Post-Quantum Root of Trust service for enterprises and government agencies; The service aligns with NIST PQC standards and the NSA CNSA 2.0 framework; The solution integrates specifically with Quantum Shield QS7001 hardware.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer
- **Implementation Prerequisites**: Integration with Quantum Shield QS7001 hardware; Alignment with NIST PQC standards and NSA CNSA 2.0 framework
- **Relevant PQC Today Features**: Compliance; Migrate; digital-id; hsm-pqc; vendor-risk
- **Phase Classification Rationale**: The document describes the launch of a commercial service ("SEALSQ launched US-based Post-Quantum Root of Trust service") specifically for enterprises and government agencies, indicating a transition from standardization to active market deployment.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; Technology
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from Standardization (NIST/NSA frameworks) to Commercial Deployment — signals the availability of sovereign, hardware-integrated PQC solutions for enterprise adoption.
- **Historical Significance**: Represents a specific commercial launch of a US-based Post-Quantum Root of Trust service explicitly aligned with NSA CNSA 2.0 and NIST standards.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires integration with Quantum Shield QS7001 hardware; Enables enterprises and government agencies to adopt PQC-aligned Root of Trust services.

---

## International:Samsung/Thales — ML-KEM Embedded Secure Element Breakthrough

- **Reference ID**: International:Samsung/Thales — ML-KEM Embedded Secure Element Breakthrough
- **Title**: ML-KEM Embedded Secure Element Breakthrough
- **Authors**: Samsung System LSI and Thales
- **Publication Date**: 2026-01-06
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Samsung System LSI and Thales announce the S3SSE2A, the first embedded Secure Element integrating ML-KEM post-quantum cryptography for IoT and consumer electronics.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Harvest now, decrypt later; quantum-enabled cyber threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Eva Rudin (Vice President, Mobile Connectivity Solutions at Thales); Hwa Yeal Yu (vice president and head of the System LSI Security & Power Product Development Team at Samsung Electronics)
- **PQC Products Mentioned**: S3SSE2A; Thales secure operating system; Thales quantum-resistant cryptographic libraries
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Secure Element (eSE); embedded security
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: First commercial PQC implementation for IoT and embedded systems is now available; ML-KEM integration enables hardware-based quantum-resistant protection from device power-on; "Harvest now, decrypt later" attacks threaten current encryption standards requiring immediate mitigation; The S3SSE2A chip delivers high-speed cryptography with reduced power and memory consumption; Post-quantum security is essential for all connected devices, not just high-end systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: High speed cryptographic operations; reduced power consumption; reduced memory consumption; smallest footprint
- **Target Audience**: Security Architect; Developer; CISO; Operations
- **Implementation Prerequisites**: Integration of Thales secure operating system; integration of quantum-resistant cryptographic libraries; Samsung S3SSE2A chip hardware
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document describes the commercial launch of the first embedded Secure Element with PQC, marking a transition from research/standardization to active market deployment and product availability.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; Consumer Electronics; IoT
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from Standardization to Commercial Deployment — signals the availability of hardware-based PQC solutions for mass-market connected devices.
- **Historical Significance**: Represents the industry's first PQC total solution for embedded systems, setting a new benchmark for protecting IoT and consumer electronics against future quantum threats.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires integration of Thales OS and libraries; Enables long-term data protection against harvest now, decrypt later attacks in connected devices.

---

## International:IETF — RFC 9794 PQC Hybrid Terminology

- **Reference ID**: International:IETF — RFC 9794 PQC Hybrid Terminology
- **Title**: RFC 9794 PQC Hybrid Terminology
- **Authors**: Internet Engineering Task Force
- **Publication Date**: 2025-06-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Defines terminology for Post-Quantum Traditional hybrid schemes including composite KEMs and signatures to ensure consistency across protocols and standards.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: Shor's Algorithm; Cryptographically Relevant Quantum Computer (CRQC); Harvest Now Decrypt Later
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United Kingdom; UK National Cyber Security Centre; Naval Postgraduate School
- **Leaders Contributions Mentioned**: F. Driscoll; M. Parsons; B. Hale
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); National Institute of Standards and Technology (NIST); European Telecommunications Standards Institute (ETSI)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Diffie-Hellman (ECDH)
- **Key Takeaways**: Hybrid schemes combine post-quantum and traditional algorithms to mitigate risks during transition; Terminology standardization is required to prevent confusion across different protocols and organizations; Security of hybrid schemes requires breaking all component algorithms to compromise the system; Data encrypted today with vulnerable algorithms can be stored for future decryption by a CRQC
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQ/T hybrid scheme; PQ/T hybrid Key Encapsulation Mechanism (KEM); PQ/T hybrid Public Key Encryption (PKE); multi-algorithm scheme
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Hybrid-crypto; Crypto-agility; Tls-basics
- **Phase Classification Rationale**: This document is an IETF Informational RFC that standardizes terminology for hybrid schemes to ensure consistency across protocols and organizations. It establishes a shared language necessary for the development of future standards but does not mandate specific implementations itself.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from fragmented terminology usage to a standardized reference framework, enabling consistent implementation of hybrid schemes in future protocols.
- **Historical Significance**: Marks the formalization of "hybrid" definitions by the IETF to resolve ambiguity between traditional and post-quantum algorithm combinations. It serves as a foundational reference for over 20 subsequent IETF drafts addressing PQC integration.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Enables consistent referencing in protocols like RFC9370, HYBRID-TLS, COMPOSITE-KEM, and RFC9763; requires adoption of defined terms by standards bodies and organizations.
- **Extraction Note**: Base enrichment reused from library record RFC 9794; timeline dimensions extracted separately

---

## International:PQCC — PQC Inventory Workbook Published

- **Reference ID**: International:PQCC — PQC Inventory Workbook Published
- **Title**: PQC Inventory Workbook Published
- **Authors**: Post-Quantum Cryptography Coalition
- **Publication Date**: 2025-06-12
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The PQC Inventory Workbook provides a structured resource for organizations to build centralized cryptographic inventories for migration planning, asset identification, and risk prioritization.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must create a centralized inventory to track cryptographic migration efforts at the system or asset level; Assets should be categorized by priority such as high, medium, or low; The inventory should be updated continuously as new data or systems are identified; A glossary of key cryptographic terms and common algorithm vulnerabilities is included to support understanding.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess; Migrate; migration-program; pqc-risk-management
- **Phase Classification Rationale**: The document provides a workbook resource to assist organizations in creating centralized inventories and planning migration efforts, aligning with the PQC Migration Roadmap rather than enforcing specific mandates.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Enables organizations to move from baseline understanding of assets to prioritized migration planning and lifecycle assessment.
- **Historical Significance**: Represents a collaborative effort by major industry leaders (IBM, Microsoft, MITRE, PQShield, SandboxAQ) to standardize the inventory-building process following the May 2025 PQC Migration Roadmap.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Creating centralized inventory; tracking cryptographic migration efforts; prioritizing assets for migration
- **Extraction Note**: Base enrichment reused from library record PQCC-Inventory-Workbook-2025; timeline dimensions extracted separately

---

## Global:Quantinuum — Helios Quantum Computer Commercial Launch

- **Reference ID**: Global:Quantinuum — Helios Quantum Computer Commercial Launch
- **Title**: Helios Quantum Computer Commercial Launch
- **Authors**: Quantinuum
- **Publication Date**: 2025-11-05
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Quantinuum announces the commercial launch of Helios, a high-fidelity quantum computer designed to enable Generative Quantum AI and accelerate enterprise adoption.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Singapore; Bodies: National Quantum Office (NQO), National Quantum Computing Hub (NQCH), Defense Advanced Research Projects Agency (DARPA)
- **Leaders Contributions Mentioned**: Dr. Rajeeb Hazra, President & CEO of Quantinuum
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud Access; Hardware-as-a-Service
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Helios offers 98 physical qubits with industry-leading fidelity for commercial applications; Quantinuum partners with NVIDIA to integrate GB200 and NVQLink for real-time error correction; Strategic partnerships established with Singapore's NQO and DARPA to advance utility-scale quantum computing by 2033; Early adopters include Amgen, BMW Group, JPMorganChase, and SoftBank Corp.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid compute capabilities combining quantum and classical in a single program via Guppy language
- **Performance & Size Considerations**: 98 physical qubits; 99.921% two-qubit gate fidelity; 99.9975% one-qubit gate fidelity; 94 logical qubits (error detected); 48 logical qubits (error corrected)
- **Target Audience**: Developer; Security Architect; Researcher; CISO
- **Implementation Prerequisites**: NVIDIA GB200 integration; NVIDIA NVQLink; Quantinuum Guppy language; NVIDIA CUDA-Q platform
- **Relevant PQC Today Features**: quantum-threats, vendor-risk, pqc-business-case, entropy-randomness, migration-program
- **Phase Classification Rationale**: The document describes the commercial launch of Helios as a "first-of-its-kind" system enabling developers to program quantum computers similarly to classical ones, marking a transition from research to commercial utility-scale demonstration.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Healthcare; Finance; Banking; Energy; Transportation; Technology; Academic
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from Research and Development to Commercial Launch — signals the availability of high-fidelity quantum hardware for enterprise applications and GenQAI.
- **Historical Significance**: Represents the launch of the world's most accurate general-purpose commercial quantum computer, enabling real-time error correction and hybrid classical-quantum programming at scale.
- **Implementation Timeline Dates**: November 5, 2025: Helios commercial launch; 2026: Helios deployment in Singapore; 2029: Apollo system scheduled for launch; 2033: Target date for utility-scale quantum computer availability per DARPA QBI
- **Successor Events & Dependencies**: Requires integration with NVIDIA GB200 and NVQLink; Enables Stage B of DARPA's Quantum Benchmarking Initiative; Paves the way for the Apollo system in 2029.

---

## United States:Congress — National Quantum Initiative Reauthorization Act

- **Reference ID**: United States:Congress — National Quantum Initiative Reauthorization Act
- **Title**: National Quantum Initiative Reauthorization Act
- **Authors**: United States Congress
- **Publication Date**: 2026-01-08
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Bipartisan legislation introduced to reauthorize and extend the National Quantum Initiative by five years through December 2034, authorizing funding for NIST, NSF, and NASA quantum research centers.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Extends the National Quantum Initiative by five years to December 2034
- **Applicable Regions / Bodies**: Regions: United States; Bodies: U.S. Senate Committee on Commerce, Science, & Transportation, NIST, NSF, NASA, White House Office of Science and Technology Policy, Department of Commerce
- **Leaders Contributions Mentioned**: Maria Cantwell (introduced Act); Todd Young (introduced Act); Dick Durbin (supporting); Steve Daines (introduced Act); Ben Ray Luján (supporting); Marsha Blackburn (supporting); Tammy Baldwin (supporting); Ted Budd (supporting); Chuck Schumer (supporting); Mike Rounds (supporting); Dave McCormick (supporting); John Fetterman (supporting); Tim Sheehy (supporting); Andy Kim (supporting); Paul Stimers (Executive Director, Quantum Industry Coalition); Celia Merzbacher (Executive Director, QED-C); Paul Lekas (Executive Vice President, SIIA); Arvind Krishna (Chairman and CEO, IBM); Fred Humphries (Corporate VP U.S. Government Affairs, Microsoft); Hartmut Neven (Founder and Lead, Google Quantum AI); Niccolo de Masi (Chairman & CEO, IonQ); Matt Kinsella (CEO, Infleqtion)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal investment is vital to accelerate the transition from basic science to quantum innovation; The legislation extends the National Quantum Initiative to December 2034 to maintain U.S. leadership against foreign competitors; New NIST and NSF centers will be established to scale research and train a quantum workforce; The Act expands scope to include NASA initiatives in quantum satellite communications and sensing; Public-private collaboration is required to translate breakthroughs into real-world applications
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Researcher, Government Official
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Leaders; Compliance; Migration-program; pqc-governance
- **Phase Classification Rationale**: The document describes the introduction of the "National Quantum Initiative Reauthorization Act," which is a legislative bill designed to authorize funding and establish new research centers, representing a formal policy decision.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Technology; Healthcare; Energy; Defense; Academic; Critical Infrastructure
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from fragmented research efforts to a nationally coordinated engine for innovation and commercialization by extending federal support through 2034.
- **Historical Significance**: This legislation reauthorizes the National Quantum Initiative originally enacted in 2018, extending its mandate to ensure sustained U.S. leadership in quantum technology against global competitors.
- **Implementation Timeline Dates**: December 2034: End of extended National Quantum Initiative; January 8, 2026: Date legislation introduced
- **Successor Events & Dependencies**: Requires development of an international quantum cooperation strategy by the White House Office of Science and Technology Policy; Requires Secretary of Commerce to submit a plan to strengthen quantum supply chain resilience; Enables creation of up to three new NIST quantum centers and five new NSF Multidisciplinary Centers.

---

## G7:G7 CEG — Financial Sector PQC Roadmap

- **Reference ID**: G7:G7 CEG — Financial Sector PQC Roadmap
- **Title**: Financial Sector PQC Roadmap
- **Authors**: G7 Cyber Expert Group
- **Publication Date**: 2026-01-12
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The G7 Cyber Expert Group released a roadmap advising financial sector stakeholders on transitioning to quantum-resilient technology through coordinated inventory, risk prioritization, and algorithm selection.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: Breaking widely used cryptographic protocols by sufficiently advanced quantum computers
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: G7 countries; European Union
- **Leaders Contributions Mentioned**: Cory Wilson (U.S. Treasury’s Deputy Assistant Secretary for Cybersecurity and Critical Infrastructure Protection); Duncan Mackinnon (Bank of England’s Executive Director for Supervisory Risk)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial entities must consider cryptographic risks associated with quantum computers; Organizations should implement transition activities as appropriate for their unique situation; The roadmap provides flexibility rather than prescriptive mandates; Coordinated action is required to address risks to the safety and soundness of the financial ecosystem
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Migration-program; pqc-governance; Leaders
- **Phase Classification Rationale**: The document releases a public statement advising financial entities on considerations and activities for transitioning to quantum-resilient technology, explicitly stating the roadmap is not prescriptive but provides flexibility.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking; Critical Infrastructure
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from initial risk awareness to coordinated planning, enabling organizations to prepare systems and data for quantum resilience based on a shared timeline.
- **Historical Significance**: Represents the first coordinated G7 roadmap specifically targeting the financial sector's transition to post-quantum cryptography, establishing a unified international approach to mitigate encryption risks.
- **Implementation Timeline Dates**: 2030-2032: critical financial systems quantum-safe; 2035: non-critical systems quantum-safe
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record G7-Financial-PQC-Roadmap-2026; timeline dimensions extracted separately

---

## Global:Ethereum Foundation — Post-Quantum Security Top Priority

- **Reference ID**: Global:Ethereum Foundation — Post-Quantum Security Top Priority
- **Title**: Post-Quantum Security Top Priority
- **Authors**: Ethereum Foundation
- **Publication Date**: 2026-01-24
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Ethereum Foundation has elevated post-quantum security to a top strategic priority by forming a dedicated team, launching $2M in research prizes, and initiating bi-weekly developer sessions.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing breaking today's encryption; exposing wallet keys
- **Migration Timeline Info**: Bi-weekly developer sessions starting February 2026; Post-quantum event in October 2026; Post-quantum day in late March 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Thomas Coratger (leads new Post Quantum team); Emile (supports leanVM cryptographic work); Justin Drake (EF researcher driving strategy and engineering shift); Antonio Sanso (leading biweekly developer sessions); Franklin Bi (commented on traditional finance adaptation speed)
- **PQC Products Mentioned**: leanVM
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Wallets; Consensus test networks
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Ethereum is shifting from background research to active engineering for post-quantum security; A dedicated team led by Thomas Coratger will drive wallet safety upgrades and test networks; $2M in prizes (Poseidon and Proximity) are launched to harden cryptography; Bi-weekly developer sessions and multi-client consensus test networks are being established; Blockchains may coordinate full-stack software transitions faster than traditional finance
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Multi-client post-quantum consensus dev networks; aggregating transaction signatures using leanVM; account abstraction paths
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Researcher; Policy Maker
- **Implementation Prerequisites**: Dedicated cryptographic tools inside the protocol; multi-client post-quantum consensus test networks; biweekly developer sessions
- **Relevant PQC Today Features**: Timeline; Threats; Leaders; digital-assets; migration-program
- **Phase Classification Rationale**: The document explicitly states Ethereum is "shifting from background research to active engineering" and moving into a "build phase," indicating a transition from theoretical work to practical implementation.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; Finance
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from long-running post-quantum research to a public engineering push involving dedicated teams, test networks, and community events.
- **Historical Significance**: Marks an inflection point where a major blockchain foundation elevates PQC to a top strategic priority with significant funding and active engineering resources.
- **Implementation Timeline Dates**: February 2026: bi-weekly developer sessions start; late March 2026: post-quantum day; October 2026: post-quantum event
- **Successor Events & Dependencies**: Requires coordination of multi-client consensus test networks; enables wallet safety upgrades and user-facing defenses via account abstraction paths.

---

## Singapore:Quantinuum/NQO — Helios Quantum Computer Singapore Deployment

- **Reference ID**: Singapore:Quantinuum/NQO — Helios Quantum Computer Singapore Deployment
- **Title**: Helios Quantum Computer Singapore Deployment
- **Authors**: Quantinuum and Singapore National Quantum Office
- **Publication Date**: 2026-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Quantinuum partners with Singapore's National Quantum Office to deploy the Helios quantum computer and establish an R&D center in 2026.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: National Quantum Office, Agency for Science, Technology and Research (A\*STAR), National Quantum Computing Hub
- **Leaders Contributions Mentioned**: Mr. Ling Keok Tong (Executive Director of the National Quantum Office); Dr. Rajeeb Hazra (President & CEO of Quantinuum); Mrs. Josephine Teo (Minister for Digital Development and Information)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Singapore becomes the first country outside the US to host the Quantinuum Helios system; Installation of Helios is expected in 2026 with immediate cloud access; Partnership targets applications in pharmaceuticals, materials science, and finance; New R&D and Operations Centre will bridge classical and quantum systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 98 qubits; Helios system installation expected in 2026
- **Target Audience**: Researcher; Policy Maker; Developer; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: quantum-threats, vendor-risk, migration-program, pqc-business-case, leaders
- **Phase Classification Rationale**: The document describes a strategic partnership and deployment plan rather than a regulatory mandate or technical standard, positioning it as guidance for ecosystem development.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Finance; Healthcare; Technology; Academic
- **Migration Urgency & Priority**: Long-Term
- **Phase Transition Narrative**: Moves from research collaboration to commercial deployment and infrastructure establishment, enabling direct access to utility-scale quantum computing capabilities.
- **Historical Significance**: Marks the first deployment of a Quantinuum Helios system outside the United States, establishing Singapore as a leading global hub for quantum computing.
- **Implementation Timeline Dates**: November 6th, 2025: Partnership announced; 2026: Installation of Helios system expected to be completed
- **Successor Events & Dependencies**: Requires completion of Helios installation in 2026; Enables co-development of end-to-end middleware and applications bridging classical and quantum systems.

---

## International:ETSI/IQC — ETSI/IQC QSC Conference 2026

- **Reference ID**: International:ETSI/IQC — ETSI/IQC QSC Conference 2026
- **Title**: ETSI/IQC QSC Conference 2026
- **Authors**: ETSI and University of Waterloo IQC
- **Publication Date**: 2026-06-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Announcement of the 11th ETSI/IQC Quantum Safe Cryptography Conference to be held in Ottawa, Canada, from June 16-18, 2026.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptographically relevant quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: ETSI, Institute for Quantum Computing, Carleton University
- **Leaders Contributions Mentioned**: Michele Mosca (Programme Committee Chair); Jaya Baloo; Matthew Campagna; Sofia Celi; Martin Charbonneau; Lily Chen; Donna Dodson; Axel Ferrazzini; Jaime Gómez García; James Howe; Bruno Huttner; Go Kato; Ayesha Khalid; Vicente Martin; Sarah McCarthy; Emily N; Kim Nordström; Daniel Panario; Mark Pecen; Gabriele Perone; Bart Preneel; Johanna Sepulveda; Martin Ward; Colin Whorlow; Hong Xiang; Sara Zafar Jafarzadeh; Nathalie Guinet; Caroline Flocari
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: digital infrastructures; cyber infrastructures
- **Standardization Bodies**: ETSI, NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations are running out of time to transition to quantum-safe technologies as progress toward cryptographically relevant quantum computers advances; The conference facilitates knowledge exchange and collaboration on securing cyber infrastructures against quantum computing challenges; Attendees can determine next steps and learn from experts through specific tracks for executives and technical experts; Registration will open at the end of March 2026 when the conference programme is announced.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; transition to quantum-safe digital infrastructure
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: crypto-agility; qkd; migration-program; pqc-governance; Leaders
- **Phase Classification Rationale**: The document announces a conference designed to facilitate knowledge exchange and collaboration on securing cyber infrastructures against quantum computing challenges, indicating a guidance phase focused on education and planning rather than enforcement.
- **Regulatory Mandate Level**: Informational (educational, advisory only)
- **Sector / Industry Applicability**: Government; Finance; Banking; Telecommunications; Technology; Academic; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from general awareness to actionable planning by providing a forum for business, government, and research communities to exchange knowledge on securing infrastructures against quantum computing challenges.
- **Historical Significance**: Represents the 11th iteration of the joint ETSI/IQC conference, highlighting the maturation of the global dialogue on quantum-safe cryptography and the urgency expressed regarding the timeline for transition.
- **Implementation Timeline Dates**: 16-18 June 2026: Conference dates; end of March: Registration opens when programme is announced
- **Successor Events & Dependencies**: Requires the Programme Committee to review and select input for the 2026 conference programme before registration can open.

---

## Hong Kong:LegCo — Critical Infrastructure Cybersecurity Ordinance

- **Reference ID**: Hong Kong:LegCo — Critical Infrastructure Cybersecurity Ordinance
- **Title**: Critical Infrastructure Cybersecurity Ordinance
- **Authors**: Legislative Council of Hong Kong
- **Publication Date**: 2025-06-27
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Protection of Critical Infrastructures (Computer Systems) Ordinance (Cap. 653) will come into effect on January 1, 2026, imposing statutory obligations on designated operators to protect computer systems against cyberattacks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Ordinance comes into operation on January 1, 2026; Gazette notice published June 27, 2025; Ordinance gazetted March 28, 2025.
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Legislative Council, Secretary for Security, The Government.
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Protection of Critical Infrastructures (Computer Systems) Ordinance (Cap. 653).
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Designated operators must adopt appropriate measures to protect computer systems; The Ordinance aims to minimize risks of essential service disruption due to cyberattacks; Statutory obligations commence on January 1, 2026.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Policy Maker, Operations
- **Implementation Prerequisites**: Adoption of appropriate measures to protect computer systems; Compliance with statutory obligations under Cap. 653.
- **Relevant PQC Today Features**: Compliance, Migration-program, pqc-governance, compliance-strategy
- **Phase Classification Rationale**: The document announces the commencement of a statutory ordinance imposing legal obligations on designated operators to protect computer systems; this represents a formal regulatory enforcement event.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Energy; Banking; Air Transport; Land Transport; Maritime; Healthcare; Telecommunications; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from legislative passage to operational enforcement, enabling statutory compliance requirements for critical infrastructure operators.
- **Historical Significance**: This ordinance marks the formal establishment of statutory cybersecurity obligations for eight critical sectors in Hong Kong effective January 2026.
- **Implementation Timeline Dates**: March 28, 2025: Ordinance gazetted; June 27, 2025: Commencement Notice published; July 2, 2025: Negative vetting at Legislative Council; January 1, 2026: Ordinance comes into operation
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record HK-CI-Ordinance-2025; timeline dimensions extracted separately

---

## Hong Kong:HKMA — HKMA Fintech Adoption Report: PQC Commitment

- **Reference ID**: Hong Kong:HKMA — HKMA Fintech Adoption Report: PQC Commitment
- **Title**: HKMA Fintech Adoption Report: PQC Commitment
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2025-07-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The HKMA commits to promoting post-quantum cryptography as a primary quantum-safety mechanism while reviewing Fintech adoption progress in Hong Kong's financial sector.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Carmen Chu, Executive Director (Banking Supervision), Hong Kong Monetary Authority
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Only 7% of Hong Kong banks are currently engaged with quantum computing; The HKMA commits to promoting post-quantum cryptography as the primary mechanism for quantum safety; Data excellence and cyber resilience are identified as dual imperatives driving Fintech maturity; Collaboration between financial institutions, academia, and government is essential for future-proofing the financial system.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; CISO; Security Architect; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-governance; migration-program; vendor-risk; compliance-strategy; pqc-business-case
- **Phase Classification Rationale**: The document represents a Policy phase event as the HKMA explicitly "commits to promoting post-quantum cryptography" and plans to highlight its importance for the financial sector, signaling a shift from observation to active regulatory promotion.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from initial awareness (7% engagement) to active policy promotion and strategic collaboration, enabling future practical adoption of quantum safety measures in the financial sector.
- **Historical Significance**: This report marks a formal commitment by the Hong Kong Monetary Authority to prioritize post-quantum cryptography as a primary defense mechanism for the local financial ecosystem.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires collaborative development of a new data strategy; Depends on continued cross-sectoral collaboration with academia and government agencies in the Greater Bay Area.

---

## Hong Kong:HKMA — Fintech 2030 Strategy: PQC Resilience Pillar

- **Reference ID**: Hong Kong:HKMA — Fintech 2030 Strategy: PQC Resilience Pillar
- **Title**: Fintech 2030 Strategy: PQC Resilience Pillar
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2025-11-03
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Hong Kong Monetary Authority unveils the "Fintech 2030" strategy, committing to drive industry readiness for post-quantum cryptography and build quantum-safe infrastructure under the Resilience pillar.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority (HKMA)
- **Leaders Contributions Mentioned**: Mr Eddie Yue, Chief Executive of the HKMA, outlined the vision of "Fintech 2030" and highlighted driving industry readiness for post-quantum cryptography.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: quantum-safe infrastructure; fintech-specific cybersecurity certification framework; real-time analysis system
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA commits to driving industry readiness for post-quantum cryptography under the Resilience pillar; The strategy includes building quantum-safe infrastructure for secured financial services; Over 40 initiatives are planned across four strategic pillars (DART) to support future-ready fintech development.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect; CISO; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-governance; migration-program; compliance-strategy; digital-assets; pqc-business-case
- **Phase Classification Rationale**: The document represents a Policy phase event as it outlines the "Fintech 2030" strategy with explicit commitments to drive industry readiness and build infrastructure, marking a strategic direction rather than technical implementation details.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from general fintech development to a structured strategic phase with explicit PQC readiness goals, enabling the transition toward quantum-safe infrastructure in financial services.
- **Historical Significance**: This is a significant milestone as it marks the first explicit commitment by the Hong Kong Monetary Authority to drive post-quantum cryptography readiness within the "Fintech 2030" strategy at the Hong Kong FinTech Week 2025.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected

---

## Hong Kong:HKMA — Fintech Promotion Blueprint: Quantum Preparedness

- **Reference ID**: Hong Kong:HKMA — Fintech Promotion Blueprint: Quantum Preparedness
- **Title**: Fintech Promotion Blueprint: Quantum Preparedness
- **Authors**: See document
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: The Hong Kong Monetary Authority unveils a Fintech Promotion Blueprint featuring a Quantum Preparedness Index to assess banking sector readiness for Post-Quantum Cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Mr Arthur Yuen, Deputy Chief Executive of the HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: High-Performance Computing
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA will develop a Quantum Preparedness Index to assess banking sector readiness for PQC; The Blueprint establishes Data Excellence and Cyber Resilience as foundational pillars for fintech advancement; A new Fintech Cybersecurity Baseline will be established for solution providers focusing on AI and DLT applications
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess; pqc-risk-management; migration-program; compliance-strategy; vendor-risk
- **Phase Classification Rationale**: The document represents an Unknown phase event as it announces the development of a "Quantum Preparedness Index" to assess readiness rather than mandating immediate implementation or detailing specific technical standards.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from general fintech promotion to structured quantum risk assessment, enabling the banking sector to measure readiness and guide future PQC transition efforts.
- **Historical Significance**: Represents a regulatory body's formal commitment to creating a measurable index for Post-Quantum Cryptography readiness within the financial sector.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires the development of the Quantum Preparedness Index; Enables practical support throughout the PQC transition journey.

---

## Hong Kong:HKMA — Fintech Promotion Blueprint Published

- **Reference ID**: Hong Kong:HKMA — Fintech Promotion Blueprint Published
- **Title**: Fintech Promotion Blueprint Published
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2026-02-03
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Hong Kong Monetary Authority (HKMA) publishes a Fintech Promotion Blueprint to advance sophisticated fintech adoption, including a Quantum Preparedness Index for banking sector readiness.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong Special Administrative Region; Bodies: Hong Kong Monetary Authority (HKMA)
- **Leaders Contributions Mentioned**: Arthur Yuen, Deputy Chief Executive, HKMA; Ms Carmen Chu, Executive Director (Banking Supervision), HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA formalizes the Quantum Preparedness Index as a flagship initiative to measure PQC readiness; The Blueprint shifts focus from foundational adoption to strategic advancement of fintech; Cyber Resilience is identified as a foundational capability requiring advanced cybersecurity embedding; The "Fintech 2030" strategy includes enhancing Business, Technology and Quantum Resilience as a key pillar
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Policy Maker; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-risk-management; migration-program; compliance-strategy; pqc-governance; data-asset-sensitivity
- **Phase Classification Rationale**: The document represents a Policy phase event as it is a "Fintech Promotion Blueprint" published by the HKMA to formalize strategic measures and set measurable targets for quantum-safe migration.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from raising awareness and enabling adoption to strategic advancement and the formalization of quantum resilience metrics.
- **Historical Significance**: This document marks the formalization of the Quantum Preparedness Index as a flagship initiative by the HKMA to measure banking sector PQC readiness in Hong Kong.
- **Implementation Timeline Dates**: February 3, 2026: Publication of Fintech Promotion Blueprint; 2025: Tech Maturity Stock-take conducted; 2023: Fintech Promotion Roadmap introduced; 2030: Target year for "Fintech 2030" strategy
- **Successor Events & Dependencies**: Requires coordinated actions across ecosystem collaboration, technological advancement, and talent development; Enables the implementation of the Quantum Preparedness Index.

---

## Singapore:IMDA — NQSN+ Launched

- **Reference ID**: Singapore:IMDA — NQSN+ Launched
- **Title**: NQSN+ Launched
- **Authors**: Infocomm Media Development Authority
- **Publication Date**: 2023-06-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Singapore launches the National Quantum-Safe Network Plus (NQSN+) to pilot and deploy quantum-safe networking solutions across government, financial, and critical infrastructure sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking encryption algorithms relied on today; quantum computing risks
- **Migration Timeline Info**: NQSN+ launched in 2023 as part of the Digital Connectivity Blueprint to 2030; goal to achieve a quantum-safe Singapore in 10 years
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Infocomm Media Development Authority (IMDA), Cyber Security Agency of Singapore (CSA), Government Technology Agency of Singapore (GovTech), Centre for Quantum Technologies (CQT)
- **Leaders Contributions Mentioned**: Mr Heng Swee Keat announced the launch of NQSN+ at ATxSG 2023
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Critical Information Infrastructure (CII); nationwide fibre network; quantum-safe networks
- **Standardization Bodies**: International Telecommunication Union (ITU)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IMDA, CSA, and GovTech jointly developed a Quantum-Safe Handbook to guide Critical Information Infrastructure owners; NQSN+ enables businesses to integrate Quantum Key Distribution (QKD) and Post-Quantum Cryptography (PQC); Singapore is co-leading with Japan to establish a QKD protocol framework at the ITU; Two network operators, Singtel and SPTel, alongside SpeQtral, will build interoperable quantum-safe networks nationwide
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Integration of Quantum Key Distribution (QKD) and Post-Quantum Cryptography (PQC); integration with quantum-ready networks from like-minded countries
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Critical Information Infrastructure owners, Government agencies, Network operators
- **Implementation Prerequisites**: Access to NQSN+ operators (Singtel, SPTel, SpeQtral); adoption of Quantum Key Distribution (QKD) or Post-Quantum Cryptography (PQC) solutions; alignment with QKD reference specification
- **Relevant PQC Today Features**: qkd, migration-program, pqc-governance, 5g-security, compliance-strategy
- **Phase Classification Rationale**: The document describes the launch of NQSN+ following successful testbed trials, enabling nationwide deployment of quantum-safe solutions by operators. This marks the transition from research and pilot testing to operational infrastructure readiness.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Telecommunications; Technology; All Sectors
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from the NQSN testbed trials phase to a nationwide operational deployment phase, enabling businesses to integrate QKD and PQC solutions.
- **Historical Significance**: Represents Singapore's first local QKD network standard and the launch of an islandwide quantum-safe communications network by government authorities. It establishes a framework for interoperable quantum-safe networks in collaboration with international partners like Japan.
- **Implementation Timeline Dates**: 2030: Digital Connectivity Blueprint target; 05 FEB 2026: Document last updated
- **Successor Events & Dependencies**: Integration with quantum-ready networks from like-minded countries; deployment of nationwide interoperable quantum-safe networks by Singtel, SPTel, and SpeQtral; establishment of QKD protocol framework at ITU
- **Extraction Note**: Base enrichment reused from library record Singapore-NQSN-Plus; timeline dimensions extracted separately

---

## Singapore:MAS/BdF — Cross-Border PQC Experiment

- **Reference ID**: Singapore:MAS/BdF — Cross-Border PQC Experiment
- **Title**: Cross-Border PQC Experiment
- **Authors**: Monetary Authority of Singapore and Banque de France
- **Publication Date**: 2024-10-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: MAS and Banque de France conduct a cross-border post-quantum cryptography experiment to enhance communication security between central banks.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Monetary Authority of Singapore; Banque de France
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Central banks are conducting cross-border PQC experiments; The experiment aims to enhance communication security; Collaboration involves Monetary Authority of Singapore and Banque de France
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Leaders; Algorithms; Migrate; Threats; Compliance
- **Phase Classification Rationale**: The document describes an "experiment" conducted by central banks, which aligns with a testing phase where concepts are validated in a controlled environment before full deployment.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Finance; Banking; Government
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from theoretical research to practical cross-border testing, enabling future standardization and adoption in central bank communications.
- **Historical Significance**: Represents a pioneering cross-border collaboration between central banks to test PQC algorithms for secure communication.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected

---

## India:DST/NQM — National Quantum-Safe Roadmap Published

- **Reference ID**: India:DST/NQM — National Quantum-Safe Roadmap Published
- **Title**: National Quantum-Safe Roadmap Published
- **Authors**: Department of Science and Technology National Quantum Mission
- **Publication Date**: 2026-02-04
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: India DST Task Force report outlining a phased roadmap for migrating to Post-Quantum Cryptography under the National Quantum Mission with milestones through 2033.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL); Shor's algorithm; Grover's algorithm; Q-Day
- **Migration Timeline Info**: CII foundations by 2027; high-priority systems by 2028; full CII by 2029; nationwide by 2033
- **Applicable Regions / Bodies**: Regions: India; Bodies: Department of Science and Technology (DST), National Quantum Mission (NQM), Centre for Development of Telematics (C-DOT), Telecommunication Engineering Centre (TEC), Data Security Council of India (DSCI)
- **Leaders Contributions Mentioned**: Dr. Rajkumar Upadhyay, CEO, C-DOT, chaired the Task Force; Mr. Kamal Kumar Agarwal, DDG, QT, TEC, chaired Sub-Group 1 for standards and testing; Mr. Vinayak Godse, CEO, DSCI, chaired Sub-Group 2 for quantum resiliency and migration
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI systems; National Evaluation and Testing infrastructure; national testbeds; Quantum Key Distribution (QKD) backbone
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Indian Standards
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); symmetric encryption; cryptographic hash functions
- **Key Takeaways**: India must establish CII foundations by 2027 and achieve nationwide PQC adoption by 2033; Organizations should launch PQC/hybrid solution pilots in high-priority systems immediately; A National PQC Testing & Certification Program is required to validate quantum-safe products; Long-term confidential data faces immediate risk from Harvest Now, Decrypt Later attacks; Migration requires progressive adoption of indigenously developed quantum-safe products while maintaining global interoperability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC/hybrid solution pilots; hybrid PQC–QKD solutions; crypto agility; phased transition to PQC
- **Performance & Size Considerations**: Average cost of a data breach is 4.44 million USD; 15% increase in breach costs since 2020
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher, Operations
- **Implementation Prerequisites**: Cryptographic inventory; establishment of National Evaluation and Testing infrastructure; development of PQC-ready PKI systems; creation of national testbeds for hybrid solutions
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; qkd; crypto-agility; migration-program; pqc-governance; digital-id
- **Phase Classification Rationale**: The document outlines a comprehensive phased roadmap with specific milestones and mandates issued by the DST Task Force to guide India's transition to quantum-safe security. It provides strategic direction and policy frameworks rather than immediate technical implementation details.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Finance; Banking; Defense; Healthcare; Telecommunications; Critical Infrastructure; Technology; Academic
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial threat assessment and task force constitution to a structured, time-bound national migration strategy with defined deadlines for CII foundations and full adoption.
- **Historical Significance**: Represents India's first official, government-mandated roadmap for Post-Quantum Cryptography under the National Quantum Mission, establishing a formal timeline for nationwide quantum-safe ecosystem implementation.
- **Implementation Timeline Dates**: 2027: CII foundations; 2028: high-priority migration; 2029: full CII quantum-safe; 2033: nationwide adoption; FY 2027-28: CBOM submissions
- **Successor Events & Dependencies**: Launching PQC/hybrid solution pilots in high-priority systems; establishing a National PQC Testing & Certification Program; adopting common PQC procurement requirements; developing PQC-ready PKI systems; deploying QKD for strategic links
- **Extraction Note**: Base enrichment reused from library record India-DST-NQM-Roadmap; timeline dimensions extracted separately

---

## Japan:NCO — Government PQC Transition Deadline

- **Reference ID**: Japan:NCO — Government PQC Transition Deadline
- **Title**: Government PQC Transition Deadline
- **Authors**: National Cyber Command Office
- **Publication Date**: 2025-10-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Japan's National Cyber Command Office sets a 2035 deadline for government agencies to complete their transition to post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL) attacks
- **Migration Timeline Info**: Deadline: 2035 for complete PQC transition; Detailed implementation roadmap planned for FY2026
- **Applicable Regions / Bodies**: Regions: Japan, United States, European Union, UK, Canada; Bodies: National Cyber Command Office (NCO), CRYPTREC, NIST, AIST, NEDO
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Critical infrastructure; Supply chains; Private businesses
- **Standardization Bodies**: NIST; CRYPTREC
- **Compliance Frameworks Referenced**: FIPS-recognized schemes
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Government agencies must transition to PQC by 2035; Hybrid PQ/T schemes combining PQC with traditional techniques are recommended; A detailed implementation roadmap will be developed in FY26; Transition efforts will cascade from government to critical infrastructure and supply chains; Cryptographic agility is essential for migration
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQ/T schemes; Cryptographic agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect; Compliance Officer; Government Agency
- **Implementation Prerequisites**: Detailed implementation roadmap in FY26; System upgrades; Support measures
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; hybrid-crypto; crypto-agility; pqc-governance; migration-program
- **Phase Classification Rationale**: The document explicitly states that the National Cyber Command Office has "set 2035 as deadline" for government agencies to complete the transition, marking a definitive endpoint for compliance.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Technology; Defense
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from policy alignment and interim reporting to a formalized transition phase requiring a detailed implementation roadmap in FY26 leading to full migration by 2035.
- **Historical Significance**: Represents a major national mandate aligning Japan's timeline with international partners (US, EU, UK, Canada) for complete PQC adoption by 2035.
- **Implementation Timeline Dates**: 2035: Deadline for complete PQC transition; FY26: Detailed implementation roadmap planned
- **Successor Events & Dependencies**: Requires development of a detailed implementation roadmap in FY26; Enables coordinated system upgrades and support measures across government and critical infrastructure.

---

## Malaysia:NACSA — National PQC Migration

- **Reference ID**: Malaysia:NACSA — National PQC Migration
- **Title**: National PQC Migration
- **Authors**: National Cyber Security Agency of Malaysia
- **Publication Date**: 2025-10-28
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Announcement of the world's largest Post-Quantum Cryptography conference in Kuala Lumpur featuring Malaysia's national PQC migration roadmap and regional leadership initiatives.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers breaking encryption protecting digital communications, financial systems, and government data
- **Migration Timeline Info**: Conference dates: 28 to 30 October 2025; Next conference: November 2026
- **Applicable Regions / Bodies**: Regions: Malaysia; Bodies: Ministry of Digital (Malaysia), National Cyber Security Agency (NACSA), PKI Consortium, Government of Malaysia
- **Leaders Contributions Mentioned**: Paul van Brouwershaven (Chair of the PKI Consortium and its Post-Quantum Cryptography Working Group); Secretary General of the Ministry of Digital (Malaysia)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; digital infrastructure
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Malaysia is the first ASEAN nation to publish a comprehensive national PQC migration roadmap; Global leaders are moving PQC transition from planning to execution; The PKI Consortium will publish a Global PQC Summary Report with recommendations and best practices; Key sectors including telecommunications, finance, healthcare, and government are sharing migration frameworks
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect; CISO; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program; Leaders; digital-id; pki-workshop; pqc-governance
- **Phase Classification Rationale**: The document describes a transition from planning to execution, highlighted by the publication of Malaysia's national PQC readiness plan and roadmap.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; Finance; Healthcare; Telecommunications
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from planning to execution, enabling the publication of a national roadmap and fostering regional collaboration for quantum resilience.
- **Historical Significance**: Marks Malaysia as the first ASEAN nation to publish a comprehensive national PQC migration roadmap and hosts the world's largest dedicated global conference on post-quantum cryptography.
- **Implementation Timeline Dates**: 28 October 2025; 29 October 2025; 30 October 2025; November 2026
- **Successor Events & Dependencies**: Publication of a Global PQC Summary Report by the PKI Consortium; Next PQC Conference in Munich, Germany in November 2026

---

## United Arab Emirates:TII — NIST Additional Signatures Round 2 Contributions

- **Reference ID**: United Arab Emirates:TII — NIST Additional Signatures Round 2 Contributions
- **Title**: NIST Additional Signatures Round 2 Contributions
- **Authors**: Technology Innovation Institute
- **Publication Date**: 2024-10-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: TII researchers contributed to six digital signature schemes advancing to Round 2 of the NIST Post-Quantum Cryptography Standardization process.
- **PQC Algorithms Covered**: LESS; Mirath; PERK; RYDE; SDitH; SQISign; FN-DSA (FALCON)
- **Quantum Threats Addressed**: potential threats posed by quantum computing; emerging computational threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Abu Dhabi, UAE; National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Dr. Najwa Aaraj, CEO of TII
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: FIPS 206
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: TII researchers contributed to six signature schemes advancing to NIST Round 2; Updates in February 2025 focused on reducing signature sizes while maintaining security; Further optimization efforts are planned to improve performance and resilience; The initiative aims to safeguard digital security against quantum computing threats.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: reduced signature sizes
- **Target Audience**: Researcher; Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Leaders; Standardization; Timeline; Threats
- **Phase Classification Rationale**: The document explicitly states researchers contributed to schemes advancing to "Round 2 of the National Institute of Standards and Technology (NIST) Post-Quantum Cryptography (PQC) Standardization" process.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Technology; Academic; All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from initial candidate selection to Round 2 of standardization, enabling further design refinements and optimization efforts.
- **Historical Significance**: Represents a milestone where TII researchers advanced six specific schemes into the second round of NIST's additional digital signature standardization process.
- **Implementation Timeline Dates**: Mar 06, 2025; October 2024; February 2025
- **Successor Events & Dependencies**: Further optimization efforts planned to improve performance and resilience; advancement to subsequent rounds of NIST standardization.

---

## United Arab Emirates:DESC — Dubai PQC Guideline Launched

- **Reference ID**: United Arab Emirates:DESC — Dubai PQC Guideline Launched
- **Title**: Dubai PQC Guideline Launched
- **Authors**: Dubai Electronic Security Center
- **Publication Date**: 2025-05-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Dubai Electronic Security Center launches a Post-Quantum Cryptography Guideline at GISEC Global 2025 to prepare Dubai's digital infrastructure for quantum threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: emerging quantum-based threats; advancements in quantum computing
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Dubai, UAE; Bodies: Dubai Electronic Security Center
- **Leaders Contributions Mentioned**: H.E. Yousuf Hamad Al Shaibani (Chief Executive of the Dubai Electronic Security Center); Mohammed Faizan (Author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; Critical Information Infrastructure (CII)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Information Security Regulations (ISR)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: DESC launched a PQC Guideline to bolster Dubai's digital infrastructure readiness against quantum threats; The guideline targets both government and private sector entities in Dubai; Zero Trust and Ethaq Plus initiatives complement the PQC strategy for securing networks and transactions; National talent development is emphasized through the ISR Officer Certification Program and cybersecurity challenges.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Government Entities, Private Sector Organizations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Migrate, Leaders, pqc-governance, digital-id
- **Phase Classification Rationale**: The document explicitly announces the launch of a "Post-Quantum Cryptography (PQC) Guideline" designed to prepare digital infrastructure against future quantum threats. This represents a Guidance phase as it provides strategic direction and readiness frameworks rather than enforcing immediate mandatory compliance or technical specifications.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from general awareness to structured preparation by establishing a guideline that enables the future implementation of PQC defenses in Dubai's digital infrastructure.
- **Historical Significance**: Marks the formal introduction of a dedicated PQC guideline by the Dubai Electronic Security Center at GISEC Global 2025, signaling a strategic shift toward proactive quantum threat mitigation for government entities.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Implementation across several government entities; integration with existing infrastructure; adoption of Zero Trust and Ethaq Plus initiatives
- **Extraction Note**: Base enrichment reused from library record UAE-DESC-PQC-Guideline; timeline dimensions extracted separately

---

## United Arab Emirates:ADGM/TII — Quantum-Secure Communications Testbed

- **Reference ID**: United Arab Emirates:ADGM/TII — Quantum-Secure Communications Testbed
- **Title**: Quantum-Secure Communications Testbed
- **Authors**: Abu Dhabi Global Market and Technology Innovation Institute
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Launch of the UAE's first quantum-secure communications testbed featuring a three-node QKD network in Abu Dhabi Global Market.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Large-scale quantum computers capable of defeating existing cryptographic mechanisms; retroactive attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United Arab Emirates, Abu Dhabi; Bodies: ADGM, TII, Hub71, ASPIRE, ATRC
- **Leaders Contributions Mentioned**: Salem Al Darei (CEO, ADGM Authority); Dr. Najwa Aaraj (CEO, Technology Innovation Institute); Stephane Timpano (CEO, ASPIRE); Mansoor Jaffar (CEO, ADGM Academy and Research Centre); Ahmad Ali Alwan (CEO, Hub71)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; encrypted network layer
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: First commercial QKD testbed deployed in UAE financial sector to future-proof digital infrastructure; Three-node network enables stakeholders to test use cases and build awareness of quantum capabilities; QKD provides forward security immune to retroactive attacks from future quantum computers; Collaboration bridges advanced research with real-world application across sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Researcher
- **Implementation Prerequisites**: Quantum devices installed at each site; proprietary QKD solution deployment; operational network layer integration
- **Relevant PQC Today Features**: qkd; digital-assets; finance; technology; leaders
- **Phase Classification Rationale**: The document describes a "Testbed" and "living lab" launched to explore ways to transfer ultra-secure data and test use cases in a commercial setting, indicating a Proof of Concept phase.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Finance; Banking; Technology; Government
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from applied research to real-world application by deploying a proprietary QKD solution in a live commercial environment, enabling stakeholders to test use cases and build awareness.
- **Historical Significance**: Marks the launch of the UAE's first quantum-secure communications testbed and the first-of-its-kind test network in a commercial setting within Abu Dhabi Global Market.
- **Implementation Timeline Dates**: August 25, 2025
- **Successor Events & Dependencies**: Enables stakeholders to interact directly with an operational QKD deployment; requires collaboration across sectors to translate advanced research into practical impact.

---

## United Arab Emirates:UAE CSC — National Encryption Policy Approved

- **Reference ID**: United Arab Emirates:UAE CSC — National Encryption Policy Approved
- **Title**: National Encryption Policy Approved
- **Authors**: UAE Cybersecurity Council
- **Publication Date**: 2025-11-26
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The UAE Cybersecurity Council approved a National Encryption Policy mandating government entities to develop PQC transition plans and maintain crypto agility by 2026.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: quantum computing; next generation of cryptographic threats
- **Migration Timeline Info**: Milestones: submit migration roadmaps by 2026; 2026 moves into the year of implementation of PQC
- **Applicable Regions / Bodies**: Regions: UAE; Bodies: UAE Cybersecurity Council, National Information Assurance Program
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: PQMicroLib-Core; PQCryptoLib-Core; PQCryptoLib-SDK; PQPlatform-CoPro; PQPlatform-TrustSys; PQPerform-Flare; PQPerform-Inferno; PQPerform-Flex; UltraPQ suite
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; digital infrastructure; data pipelines; AI models; hardware reliability
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: National Encryption Policy; Executive Regulation; National Information Assurance Program
- **Classical Algorithms Referenced**: RSA; ECC
- **Key Takeaways**: Government entities must submit official migration roadmaps by 2026; Automated tools are required for real-time cryptographic asset discovery; New systems must be built with crypto agility to allow algorithm rotation without downtime; Data requiring confidentiality for 10-20 years is prioritized for protection; The UAE is establishing a National Post-Quantum Migration Program to identify vulnerable systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto agility by design; transition plans from traditional encryption methods to post-quantum cryptography
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker; Government Entities
- **Implementation Prerequisites**: automated tools for crypto discovery; clear, well-defined, and officially approved transition plans; crypto agility by design
- **Relevant PQC Today Features**: compliance-strategy; migration-program; pqc-governance; data-asset-sensitivity; crypto-agility
- **Phase Classification Rationale**: The document describes the formal approval of a "National Encryption Policy" and "Executive Regulation" that mandates specific actions, representing a Policy phase event.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Healthcare; Defense; Finance
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from policy formulation to active implementation planning, requiring entities to submit roadmaps by 2026 and initiating the National Post-Quantum Migration Program.
- **Historical Significance**: Represents a significant pivot for the UAE as a global pioneer in issuing centralized oversight and mandated compliance approaches for PQC adoption ahead of quantum threats.
- **Implementation Timeline Dates**: 2026: submit migration roadmaps; 2026: year of implementation of PQC
- **Successor Events & Dependencies**: Requires development of clear transition plans; Enables the National Post-Quantum Migration Program to identify vulnerable systems; Contingent on maintaining automated cryptographic asset inventories.

---

## United Arab Emirates:UAE CSC — National PQC Migration Program

- **Reference ID**: United Arab Emirates:UAE CSC — National PQC Migration Program
- **Title**: National PQC Migration Program
- **Authors**: UAE Cybersecurity Council
- **Publication Date**: 2025-11-26
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The UAE Cybersecurity Council and QuantumGate are advancing national post-quantum readiness by shifting from strategy to large-scale implementation across three key government programs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Future quantum decryption threats; future quantum decryption capabilities
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: UAE; Bodies: UAE Cybersecurity Council, ATRC, VentureOne, QuantumGate
- **Leaders Contributions Mentioned**: Dr. Mohamed Al-Kuwaiti (Head of Cyber Security for the UAE Government); Dr. Najwa Aaraj (CEO of QuantumGate)
- **PQC Products Mentioned**: Crypto Discovery Tool; QSphere; Salina; Secure VMI
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: UAE is shifting from planning to large-scale implementation of quantum-safe security; Collaboration focuses on identifying vulnerable cryptographic assets and prioritizing migration pathways; National programs include the National Information Assurance Program, National Cybersecurity Index Platform, and National Post-Quantum Migration Program; Deployment includes Crypto Discovery Tool for asset visibility and QSphere for quantum-resilient VPN protection
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect; CISO; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program; pqc-risk-management; data-asset-sensitivity; vpn-ssh-pqc; pqc-governance
- **Phase Classification Rationale**: The document explicitly states the UAE is moving "from strategy to coordinated national implementation" and "beyond awareness into actionable, nationwide preparedness," marking a shift from planning to operational deployment.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from Strategy to Large-Scale Implementation — signals the operationalization of a comprehensive post-quantum strategy across national programs.
- **Historical Significance**: Positions the UAE among the first nations globally to operationalize a comprehensive post-quantum strategy and implement a coordinated national model for post-quantum security.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires deployment of Crypto Discovery Tool and QSphere; Enables identification of vulnerable cryptographic assets and prioritization of migration pathways.

---

## Saudi Arabia:NCA — ECC-2:2024 Cybersecurity Controls

- **Reference ID**: Saudi Arabia:NCA — ECC-2:2024 Cybersecurity Controls
- **Title**: ECC-2:2024 Cybersecurity Controls
- **Authors**: National Cybersecurity Authority
- **Publication Date**: 2024-12-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The National Cybersecurity Authority (NCA) of Saudi Arabia has issued new regulations granting enforcement authority over cybersecurity standards, including penalties for non-compliance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Saudi Arabia; Bodies: National Cybersecurity Authority (NCA)
- **Leaders Contributions Mentioned**: Simon Shooter (Head of Country for Saudi Arabia, Head of TMT for the Middle East); Nikita Manro (Associate in International Commercial Group)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: National Cybersecurity Authority Regulations 2024; Essential Cybersecurity Controls 2024 (ECC-2:2024)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Non-compliance with NCA Standards can result in fines up to SAR 25,000,000 or license revocation; Entities must obtain licenses from NCA to practice regulated cybersecurity activities; Comprehensive records and audit trails are imperative for inspection readiness; Violators must remedy violations and deposit gains into the state treasury; Decisions can be appealed to the Administrative Court within 60 days.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; CISO; Legal Counsel; Policy Maker
- **Implementation Prerequisites**: Familiarization with NCA Standards; Obtaining necessary licenses from NCA; Retention of comprehensive records with clear audit trails
- **Relevant PQC Today Features**: Compliance; pqc-governance; compliance-strategy; migration-program; vendor-risk
- **Phase Classification Rationale**: The document describes the "National Cybersecurity Authority Regulations 2024" which establish a regulatory framework granting the NCA authority to enforce compliance with Standards, superseding conflicting regulations and imposing penalties.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Critical Infrastructure; Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from a lack of clear enforcement authority to a formal regulatory regime with defined penalties and inspection procedures.
- **Historical Significance**: Marks the first time the NCA has been granted explicit authority to enforce compliance with its cybersecurity standards through fines and license revocation in Saudi Arabia.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires entities to familiarize themselves with Standards; NCA mandated to submit a comprehensive report on implementation after a four-year period.

---

## Saudi Arabia:C4IR — Quantum Economy Landscape Report

- **Reference ID**: Saudi Arabia:C4IR — Quantum Economy Landscape Report
- **Title**: Quantum Economy Landscape Report
- **Authors**: Center for the Fourth Industrial Revolution
- **Publication Date**: 2024-12-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Saudi Arabia's national quantum strategy and economy landscape report detailing current capabilities, societal impacts, and a roadmap aligned with Vision 2030.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm; quantum divide; cyberattacks against sensitive data
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Saudi Arabia; Bodies: Centre for the Fourth Industrial Revolution Saudi Arabia (C4IR Saudi Arabia), World Economic Forum (WEF)
- **Leaders Contributions Mentioned**: Dr. Basma AlBuhairan (Managing Director, C4IR Saudi Arabia); Bohr; Heisenberg; Planck; Schrödinger; Richard Feynman
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: World Economic Forum (WEF)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Saudi Arabia is the first nation to pilot the WEF Quantum Economy Blueprint; A national quantum strategy with a $200M initial budget is aligned with Vision 2030; The report identifies key stakeholders including universities and companies like Aramco to build a robust quantum ecosystem; Quantum technology applications span cybersecurity, energy, healthcare, and manufacturing sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Researcher; Security Architect; CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: quantum-threats, qkd, pqc-business-case, migration-program, pqc-governance
- **Phase Classification Rationale**: The document outlines a "national quantum roadmap" and strategy to integrate quantum technologies, representing a policy-level planning phase rather than technical implementation.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Government; Healthcare; Energy; Finance; Technology; Academic
- **Migration Urgency & Priority**: Long-Term
- **Phase Transition Narrative**: Moves from landscape analysis and fundamental understanding to the development of a national roadmap and strategy for quantum economy integration.
- **Historical Significance**: Saudi Arabia is identified as the first country to pilot the World Economic Forum's Quantum Economy Blueprint, marking a pioneering step in national quantum strategy adoption.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires integration of efforts from government bodies, academic institutions, and industry; Enables the development of a comprehensive national quantum strategy.

---

## Saudi Arabia:Aramco/Pasqal — First Quantum Computer in KSA

- **Reference ID**: Saudi Arabia:Aramco/Pasqal — First Quantum Computer in KSA
- **Title**: First Quantum Computer in KSA
- **Authors**: Saudi Aramco and Pasqal
- **Publication Date**: 2025-11-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Aramco and Pasqal deploy Saudi Arabia's first quantum computer dedicated to industrial applications at an Aramco data center in Dhahran.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Saudi Arabia; Middle East; Bodies: None detected
- **Leaders Contributions Mentioned**: Ahmad O. Al-Khowaiter (Aramco EVP of Technology & Innovation); Loïc Henriet (Pasqal CEO)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Saudi Arabia has deployed its first quantum computer dedicated to industrial applications; The system utilizes neutral-atom technology with 200 qubits; The deployment aims to accelerate quantum application development in energy, materials, and industrial sectors; Pasqal will provide training programs and joint research opportunities for local talent
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Plans to upgrade to hybrid analog-digital mode
- **Performance & Size Considerations**: 200 qubits arranged in programmable two-dimensional arrays
- **Target Audience**: Researcher; Policy Maker; Technology Leader
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Leaders; quantum-threats; migration-program; pqc-business-case
- **Phase Classification Rationale**: The document describes a "technological milestone" and "breakthrough" focused on deploying hardware to "explore advanced quantum algorithms," indicating an early-stage research and development phase rather than a finalized standard or mandate.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Energy; Technology; Critical Infrastructure
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from theoretical research to practical industrial deployment, enabling the exploration of real-world use cases and the development of regional quantum expertise.
- **Historical Significance**: Marks the first deployment of a neutral-atom quantum computer in the Middle East dedicated specifically to industrial applications, establishing a new benchmark for regional technology capabilities.
- **Implementation Timeline Dates**: November 24, 2025; January 2023
- **Successor Events & Dependencies**: Enables training programs and joint research opportunities for Saudi engineers; contingent on plans to upgrade the system to hybrid analog-digital mode.

---

## Bahrain:NCSC — National Quantum-Safe Deployment

- **Reference ID**: Bahrain:NCSC — National Quantum-Safe Deployment
- **Title**: National Quantum-Safe Deployment
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2025-12-23
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The National Cyber Security Center of Bahrain partners with SandboxAQ to deploy the AQtive Guard platform across 60+ government ministries to establish a quantum-safe economy.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers (CRQCs); harvest-now, decrypt-later attacks
- **Migration Timeline Info**: Experts estimate CRQCs to be feasible by as early as 2029
- **Applicable Regions / Bodies**: Regions: Kingdom of Bahrain; Bodies: National Cyber Security Center of the Kingdom of Bahrain, UNICC AI Hub on Post-Quantum Cryptography (PQC)
- **Leaders Contributions Mentioned**: Shaikh Salman bin Mohammed Al Khalifa (CEO of NCSC of Bahrain); Mohammed Aboul-Magd (Vice President of Product, Cybersecurity at SandboxAQ)
- **PQC Products Mentioned**: AQtive Guard
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Bahrain is operationalizing post-quantum protection at a national scale across 60+ ministries; The threat of harvest-now, decrypt-later attacks necessitates immediate action against CRQCs estimated by 2029; AI-powered platforms are being deployed to manage cryptographic security and remediate vulnerabilities from weak encryption
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Policy Maker, Security Architect
- **Implementation Prerequisites**: Deployment of AQtive Guard platform; Management of cryptographic security across 60+ ministry environments
- **Relevant PQC Today Features**: Threats; Migrate; Leaders; pqc-governance; migration-program
- **Phase Classification Rationale**: The document describes a "landmark partnership" to "operationalise post-quantum protection" and deploy a specific platform across government ministries, indicating an active transition from planning to execution.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from strategic partnership announcement to operational deployment of AI-driven cryptographic management across national government systems.
- **Historical Significance**: Described as one of the world's first large-scale commitments to transitioning towards a quantum-safe economy and operationalizing post-quantum protection at national scale.
- **Implementation Timeline Dates**: December 23, 2025: Partnership announcement; 2029: Estimated feasibility of CRQCs
- **Successor Events & Dependencies**: Requires deployment of AQtive Guard across 60+ ministry environments; Enables securing sovereign data and critical infrastructure against quantum threats.

---

## Jordan:CBJ — Financial Sector PQC Roadmap

- **Reference ID**: Jordan:CBJ — Financial Sector PQC Roadmap
- **Title**: Financial Sector PQC Roadmap
- **Authors**: Central Bank of Jordan
- **Publication Date**: 2026-01-05
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Central Bank of Jordan has published a sector-wide roadmap outlining a phased approach for financial institutions to transition to quantum-resistant encryption.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Future cybersecurity risks from advanced computing; potential undermining of current encryption methods by quantum computers; exposure of sensitive data and financial transactions
- **Migration Timeline Info**: Phased approach including cryptographic asset cataloging, risk-based prioritization, governance integration, sandbox testing, and full transition over several years
- **Applicable Regions / Bodies**: Regions: Jordan; Bodies: Central Bank of Jordan
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Non-operational virtual environments for testing; institutional risk registers; governance frameworks
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial institutions must identify and catalog cryptographic assets to assess risk; quantum-related cyber risks must be formally incorporated into institutional risk registers; pilot tests of quantum-resistant encryption should occur in non-operational environments before full deployment; coordination among regulators, banks, and technology providers is essential for alignment with global standards
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Phased transition strategy; testing new encryption methods in non-operational environments before full deployment
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Cryptographic asset identification; integration of quantum risks into governance and risk registers; establishment of senior oversight; capacity building for internal expertise
- **Relevant PQC Today Features**: pqc-governance; migration-program; pqc-risk-management; Assess; Migrate
- **Phase Classification Rationale**: The document outlines a "roadmap" with a "phased approach" that includes steps like "identifying cryptographic assets" and "testing new encryption methods," indicating a strategic guidance phase rather than an immediate mandate.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from general awareness to structured preparation by enabling institutions to catalog assets and conduct sandbox testing before full-scale deployment.
- **Historical Significance**: Represents a proactive national roadmap by the Central Bank of Jordan to position its financial sector against future quantum threats, emphasizing early coordination and stability.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Requires identification of cryptographic assets; enables pilot testing in non-operational environments; contingent on building internal expertise and operational capacity

---

## Global:Ethereum Foundation — Vitalik Buterin Publishes PQ Defense Roadmap

- **Reference ID**: Global:Ethereum Foundation — Vitalik Buterin Publishes PQ Defense Roadmap
- **Title**: Vitalik Buterin Publishes PQ Defense Roadmap
- **Authors**: Ethereum Foundation
- **Publication Date**: 2026-02-26
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Vitalik Buterin outlines a roadmap to protect Ethereum from quantum computing threats by addressing vulnerabilities in consensus, data availability, accounts, and zero-knowledge proofs.
- **PQC Algorithms Covered**: hash-based signatures; Winternitz; STARK aggregation
- **Quantum Threats Addressed**: long-term risks posed by quantum computers; breaking digital signatures and cryptographic systems
- **Migration Timeline Info**: Targets Hegota upgrade H2 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Vitalik Buterin outlined a roadmap to protect the blockchain from the long-term risks posed by quantum computers; Margaux Nijkerk reported on the roadmap; Nikhilesh De edited the article; Davide Crapis sees the network acting as a coordination and verification layer in an increasingly AI-mediated world
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EIP-8141
- **Infrastructure Layers**: validator signatures used in consensus; data availability system; everyday wallet signatures; zero-knowledge proofs
- **Standardization Bodies**: Ethereum Foundation
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: BLS; ECDSA; KZG commitments
- **Key Takeaways**: Ethereum must switch from BLS to hash-based signatures for validator consensus; EIP-8141 enables native account abstraction to support quantum-safe signature schemes; KZG commitments require significant engineering work to replace with quantum-safe alternatives; validation frames in EIP-8141 allow bundling multiple proofs into a single compressed proof to reduce verification costs
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: EIP-8141 allows accounts to switch to different types of signatures in the future; validation frames bundle many signatures and proofs into a single combined proof
- **Performance & Size Considerations**: quantum-safe versions of zero-knowledge proofs are currently far more expensive to verify on Ethereum
- **Target Audience**: Developer; Security Architect; Researcher; Policy Maker
- **Implementation Prerequisites**: significant behind-the-scenes engineering work; planned upgrade called EIP-8141
- **Relevant PQC Today Features**: Timeline; Threats; Algorithms; Migration; digital-assets; stateful-signatures; crypto-agility
- **Phase Classification Rationale**: The document outlines a specific roadmap to counter quantum threats by proposing concrete technical changes like switching to hash-based signatures and implementing EIP-8141, indicating a transition from research to active migration planning.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Technology; Finance
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from identifying vulnerabilities in BLS and ECDSA to proposing specific architectural changes via EIP-8141 and hash-based signatures for the Hegota upgrade.
- **Historical Significance**: Represents a major roadmap publication by Ethereum co-founder Vitalik Buterin targeting quantum resistance for core blockchain components including consensus and account abstraction.
- **Implementation Timeline Dates**: H2 2026: Targets Hegota upgrade
- **Successor Events & Dependencies**: Requires significant behind-the-scenes engineering work to replace KZG commitments; depends on the implementation of EIP-8141 for native account abstraction and validation frames.

---

## United States:Google — Google Cloud ML-KEM Default and Chrome MTC Program

- **Reference ID**: United States:Google — Google Cloud ML-KEM Default and Chrome MTC Program
- **Title**: Google Cloud ML-KEM Default and Chrome MTC Program
- **Authors**: Google LLC
- **Publication Date**: 2026-02-06
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Google announces default deployment of ML-KEM for Cloud network encryption and launches a Chrome Merkle Tree Certificates program with Cloudflare to replace X.509 chains.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); store now, decrypt later attacks
- **Migration Timeline Info**: Chrome Quantum-resistant Root Store (CQRS) planned Q3 2027; Google preparing for post-quantum world since 2016
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Kent Walker, President of Global Affairs, Google & Alphabet; Hartmut Neven, Founder and Lead, Google Quantum AI
- **PQC Products Mentioned**: Chrome Merkle Tree Certificates (MTC) program; Chrome Quantum-resistant Root Store (CQRS); Google Cloud
- **Protocols Covered**: X.509; HTTPS
- **Infrastructure Layers**: Global network; Certificate authorities; Public-key cryptosystems
- **Standardization Bodies**: National Institute Standards & Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; 2048-bit RSA
- **Key Takeaways**: Google is deploying ML-KEM by default for all Cloud network encryption; Chrome and Cloudflare are introducing Merkle Tree Certificates to replace X.509 chains for PQ-safe HTTPS; Policymakers should prioritize migrating legacy systems to the cloud to leverage provider PQC capabilities; Organizations must address workforce challenges in critical sectors like energy, telecommunications, and healthcare; A unified global approach using NIST standards is necessary to avoid partial insecure solutions
- **Security Levels & Parameters**: 2048-bit RSA
- **Hybrid & Transition Approaches**: Crypto agility; replacing cryptographic algorithms without disrupting services
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; CISO; Security Architect; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: merkle-tree-certs; crypto-agility; tls-basics; migration-program; threats
- **Phase Classification Rationale**: The document explicitly states Google is "on track to complete a PQC migration" and has "begun rolling out PQC within our infrastructure," indicating an active transition from research to operational deployment.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Energy; Telecommunications; Healthcare; Finance; Technology; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from research and preparation to active deployment and ecosystem shift, enabling PQ-safe HTTPS via Merkle Tree Certificates and default ML-KEM in cloud networks.
- **Historical Significance**: Represents a major commercial provider's commitment to default PQC deployment and the introduction of a new certificate model (MTC) to replace X.509 chains at scale.
- **Implementation Timeline Dates**: Q3 2027: Chrome Quantum-resistant Root Store (CQRS) planned; 2016: Google began preparing for post-quantum world; 2024: NIST announced first set of PQC standards
- **Successor Events & Dependencies**: Requires widespread adoption of NIST standards; Enables secure AI systems foundation; Depends on certificate authorities to protect trust infrastructure.

---

## Germany:BSI — Hybrid TLS Required for Classified Communications

- **Reference ID**: Germany:BSI — Hybrid TLS Required for Classified Communications
- **Title**: Hybrid TLS Required for Classified Communications
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-31
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly mandates a requirement for hybrid TLS implementation by 2025 for classified communications, establishing a fixed compliance deadline.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Transitions from classical-only or voluntary adoption to mandatory hybrid TLS implementation for classified systems.
- **Historical Significance**: Represents a formal regulatory enforcement of hybrid cryptography combining ECDH and ML-KEM for high-security government communications by 2025.
- **Implementation Timeline Dates**: 2025: mandate for classified communications; as soon as practical: non-classified systems
- **Successor Events & Dependencies**: Adoption of hybrid TLS combining classical (ECDH) and PQC (ML-KEM); None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record BSI TR-02102-2; timeline dimensions extracted separately

---

## Germany:BSI — Hybrid IPsec and SSH Required

- **Reference ID**: Germany:BSI — Hybrid IPsec and SSH Required
- **Title**: Hybrid IPsec and SSH Required
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-31
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly mandates the adoption of hybrid IPsec and SSH protocols by a specific year, establishing a clear compliance deadline. It sets a fixed endpoint for transitioning sensitive communications to post-quantum standards.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Critical Infrastructure; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from legacy cryptographic protocols to hybrid implementations incorporating ML-KEM for sensitive communications.
- **Historical Significance**: Represents a formal regulatory requirement by BSI enforcing post-quantum cryptography in IPsec and SSH, marking a shift from voluntary guidance to mandatory compliance for sensitive data.
- **Implementation Timeline Dates**: 2026: mandate for hybrid IPsec and SSH for sensitive communications
- **Successor Events & Dependencies**: Alignment with IETF ipsecme and curdle working group drafts; adoption of ML-KEM in IKEv2 and SSH
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record BSI TR-02102-3; timeline dimensions extracted separately

---

## Germany:BSI — Full PQC Transition — Standalone Algorithms Requir

- **Reference ID**: Germany:BSI — Full PQC Transition — Standalone Algorithms Requir
- **Title**: Full PQC Transition — Standalone Algorithms Requir
- **Authors**: See document
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: No text extracted from source document prevents classification; title suggests a requirement for standalone algorithms but lacks context.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## European Union:EC — Cryptographic Inventory Mandate

- **Reference ID**: European Union:EC — Cryptographic Inventory Mandate
- **Title**: Cryptographic Inventory Mandate
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: Updated
- **Main Topic**: EU public sector entities and operators of essential services are mandated to complete a cryptographic asset inventory by December 2026.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Deadline pushed from end-2025 to December 2026 for cryptographic asset inventory completion.
- **Applicable Regions / Bodies**: Regions: EU; Bodies: NIS Cooperation Group
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: EU PQC Recommendation; NIS Cooperation Group Roadmap v1.1
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EU public sector entities must complete a comprehensive cryptographic asset inventory; Operators of essential services are subject to the same inventory mandate; The deadline for inventory completion has been extended to December 2026; The NIS Cooperation Group Roadmap v1.1 governs this timeline adjustment.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Policy Maker; Security Architect
- **Implementation Prerequisites**: Comprehensive cryptographic asset inventory
- **Relevant PQC Today Features**: Compliance; Migrate; Assess; Timeline; pqc-governance
- **Phase Classification Rationale**: The document explicitly states a "Mandate" and notes that a deadline was "pushed" to December 2026, indicating a specific compliance endpoint.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from initial planning to a revised execution phase for inventory completion, enabling subsequent migration steps based on asset identification.
- **Historical Significance**: Represents an extension of the EU's first major PQC inventory mandate deadline, reflecting the complexity of public sector cryptographic asset discovery.
- **Implementation Timeline Dates**: December 2026: deadline for comprehensive cryptographic asset inventory; end-2025: original deadline pushed to December 2026
- **Successor Events & Dependencies**: None detected

---

## United States:NIST — NIST SP 800-208 Published (LMS/XMSS)

- **Reference ID**: United States:NIST — NIST SP 800-208 Published (LMS/XMSS)
- **Title**: NIST SP 800-208 Published (LMS/XMSS)
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2020-10-29
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NIST SP 800-208 recommends stateful hash-based signature schemes LMS and XMSS along with their multi-tree variants HSS and XMSS MT.
- **PQC Algorithms Covered**: LMS, XMSS, HSS, XMSS MT
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST
- **Leaders Contributions Mentioned**: David Cooper (NIST); Daniel Apon (NIST); Quynh Dang (NIST); Michael Davidson (NIST); Morris Dworkin (NIST); Carl Miller (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NIST has published a recommendation for stateful hash-based signature schemes; The standard covers LMS and XMSS algorithms with multi-tree variants; These algorithms are mandated by NSA CNSA 2.0 according to the description; This is the first NIST PQC-adjacent standard in the timeline
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: stateful-signatures; digital-id; code-signing; algorithms; compliance-strategy
- **Phase Classification Rationale**: The document is titled "Recommendation for Stateful Hash-Based Signature Schemes" and represents a final publication by NIST, indicating the formalization of algorithm specifications.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Long-Term (3-5yr, planning horizon)
- **Phase Transition Narrative**: Moves from Draft to Final publication — signals formal recommendation for stateful hash-based signatures.
- **Historical Significance**: This is the first NIST PQC-adjacent standard and the earliest entry in the timeline for these algorithms.
- **Implementation Timeline Dates**: 12/11/19: SP 800-208 (Draft); 10/29/20: SP 800-208 (Final)
- **Successor Events & Dependencies**: None detected

---

## Global:OASIS — PKCS#11 v3.2 Committee Specification Draft Publish

- **Reference ID**: Global:OASIS — PKCS#11 v3.2 Committee Specification Draft Publish
- **Title**: PKCS#11 v3.2 Committee Specification Draft Publish
- **Authors**: See document
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: This document defines the PKCS #11 Cryptoki interface specification version 3.2, including data types, functions, and mechanisms for cryptographic token management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valerie Fenwick (Chair); Robert Relyea (Chair); Dieter Bong (Editor); Greg Scott (Editor); Tony Cox (Previous Editor); Tim Hudson (Related Work Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; WTLS; TLS (implied via WTLS and X.509 context); SSH (not explicitly named but x3dh is a Signal protocol component often used in messaging, though text only lists x3dh as a mechanism)
- **Infrastructure Layers**: HSM; Key Management; PKI
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4; BCP 14; RFC 2119; RFC 8174
- **Classical Algorithms Referenced**: RSA; DSA; ECDSA; EdDSA; XEdDSA; Diffie-Hellman; HMAC; AES; SHA-1; Triple Diffie-Hellman (x3dh); Double Ratchet
- **Key Takeaways**: The specification defines a standard interface for cryptographic tokens including object types and functions; It covers mechanisms for RSA, DSA, Elliptic Curve, and Diffie-Hellman algorithms; The document includes support for modern key derivation schemes like x3dh and Double Ratchet; Implementations must adhere to OASIS IPR Policy under RF on RAND Terms; Machine-readable content in plain text files prevails over prose narrative in case of discrepancy
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: X9.42 Diffie-Hellman hybrid key derivation
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: C or C++ compiler support for structure packing and pointer-related macros; Subscription to OASIS TC public comment list for feedback; Adherence to OASIS IPR Policy
- **Relevant PQC Today Features**: Algorithms; hsm-pqc; pki-workshop; crypto-agility; tls-basics
- **Phase Classification Rationale**: The document is labeled as a "Committee Specification Draft 01" dated 16 April 2025, indicating it is in the standardization drafting phase rather than a final mandate or research paper.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from previous version 3.1 to a new draft specification, enabling vendors to implement updated cryptographic mechanisms and object types in HSMs and tokens.
- **Historical Significance**: Represents the latest evolution of the PKCS #11 standard, incorporating modern key exchange protocols like x3dh and Double Ratchet into the interface definition.
- **Implementation Timeline Dates**: 16 April 2025
- **Successor Events & Dependencies**: Requires finalization by the OASIS PKCS 11 TC; Supersedes PKCS #11 Specification Version 3.1

---

## Global:CA/Browser Forum — Ballot SMC013 ML-DSA for S/MIME Adopted

- **Reference ID**: Global:CA/Browser Forum — Ballot SMC013 ML-DSA for S/MIME Adopted
- **Title**: Ballot SMC013 ML-DSA for S/MIME Adopted
- **Authors**: CA/Browser Forum S/MIME Certificate Working Group
- **Publication Date**: 2025-08-22
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Ballot SMC013 enables ML-DSA and ML-KEM post-quantum algorithms in S/MIME certificates through updated Baseline Requirements.
- **PQC Algorithms Covered**: ML-DSA, ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Adopted August 22, 2025; intended to enable experimentation by Certificate Issuers
- **Applicable Regions / Bodies**: Bodies: CA/Browser Forum, U.S. National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Stephen Davidson (proposed ballot); Andreas Henschel (endorsed); Martijn Katerbarg (endorsed); Client Wilson (endorsed Ballot SMC014); Ashish Dhiman (endorsed Ballot SMC014)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: S/MIME
- **Infrastructure Layers**: PKI, Certificate Issuers, Certificate Consumers
- **Standardization Bodies**: CA/Browser Forum, U.S. National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Baseline Requirements for the Issuance and Management of Publicly-Trusted S/MIME Certificates (S/MIME BR v1.0.11), CA/Browser Forum Intellectual Property Rights Policy (v1.3)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Ballot SMC013 enables single-key/non-hybrid PQC certificates for S/MIME; The ballot specifies ML-DSA and ML-KEM algorithms standardized by NIST; Adoption requires two-thirds of Certificate Issuer votes and 50% plus one of Certificate Consumer votes; Root programs may impose additional requirements on PQC use; No IPR Exclusion Notices were filed during the review period
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Single-key/non-hybrid PQC certificates that do not rely upon pre-quantum algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Certificate Issuer, Certificate Consumer
- **Implementation Prerequisites**: Adoption of S/MIME Baseline Requirements v1.0.11; adherence to CA/Browser Forum Bylaws 2.3(6) and 2.3(7); potential additional requirements from Root programs
- **Relevant PQC Today Features**: email-signing, pki-workshop, algorithms, compliance, leaders
- **Phase Classification Rationale**: The document details the formal adoption of Ballot SMC013 by the CA/Browser Forum, establishing baseline requirements for ML-DSA and ML-KEM in S/MIME certificates. This represents a Standardization phase event as it codifies specific PQC algorithms into industry governance rules for certificate issuance.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from algorithm standardization by NIST to formal industry adoption, enabling experimentation with single-key/non-hybrid PQC certificates in the S/MIME ecosystem.
- **Historical Significance**: This is the first time a Web PKI governance body has formally adopted PQC algorithms for certificate issuance, marking a shift from theoretical standards to operational baseline requirements.
- **Implementation Timeline Dates**: 2025-07-21: Start of Review Period; 2025-08-20: End of Review Period; 2025-08-22: Ballot Adopted
- **Successor Events & Dependencies**: Publication of S/MIME BR v.1.0.11; experimentation by Certificate Issuers with PQC certificates; potential additional requirements imposed by Root programs
- **Extraction Note**: Base enrichment reused from library record CA-B-Forum-Ballot-SMC013; timeline dimensions extracted separately

---

## Global:3GPP SA3 — TR 33.841 PQC Study Item Approved

- **Reference ID**: Global:3GPP SA3 — TR 33.841 PQC Study Item Approved
- **Title**: TR 33.841 PQC Study Item Approved
- **Authors**: 3GPP Security Working Group SA3
- **Publication Date**: 2025-05-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Study on preparing for the transition to Post Quantum Cryptography in 3GPP by integrating standalone or hybrid PQC algorithms into existing 5G security protocols.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: 3GPP
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKEv2
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: 3GPP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Study covers integration of standalone or hybrid PQC algorithms into 5G security protocols; Focus includes TLS, IPSec, and IKEv2; References TR 33.841 PQC Study for further details
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQC integration
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security; hybrid-crypto; tls-basics; vpn-ssh-pqc
- **Phase Classification Rationale**: The document describes the approval of a study item to prepare protocols for transition, indicating an initial research and standardization phase rather than mandatory implementation.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Telecommunications; Technology
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from general quantum threat awareness to specific 3GPP standardization activities for hybrid PQC integration in 5G.
- **Historical Significance**: Represents the first 3GPP standardization activity explicitly addressing quantum-resistant mobile network security.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Hybrid PQC integration for TLS, IPSec, and IKEv2; 5G network infrastructure updates
- **Extraction Note**: Base enrichment reused from library record 3GPP-PQC-Study-2025; timeline dimensions extracted separately

---

## International:GRI — Quantum Threat Timeline Report 2025

- **Reference ID**: International:GRI — Quantum Threat Timeline Report 2025
- **Title**: Quantum Threat Timeline Report 2025
- **Authors**: Global Risk Institute
- **Publication Date**: 2026-03-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Annual expert survey (26 global experts) projecting the probability and timeline of a cryptographically-relevant quantum computer (CRQC). 2025 results show significant acceleration: 28–49% probability within 10 years (up from 19–34% in 2024), 51–70% within 15 years. Majority now consider a CRQC by 2035 quite likely.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically-relevant quantum computer (CRQC); Harvest Now Decrypt Later (HNDL); Harvest Now Fail Later (HNFL); quantum factoring threat to RSA and ECC
- **Migration Timeline Info**: 28–49% probability of CRQC within 10 years (by 2036); 51–70% within 15 years (by 2041); 5–15% within 5 years (by 2031); majority of experts consider CRQC by 2035 quite likely. Significant upward shift from 2024 survey.
- **Applicable Regions / Bodies**: Global; Canada (GRI headquartered); North America leads quantum race per expert consensus
- **Leaders Contributions Mentioned**: Dr. Michele Mosca, Co-Founder & CEO, evolutionQ Inc.; Dr. Marco Piani, Senior Research Analyst, evolutionQ Inc.; Global Risk Institute (GRI)
- **PQC Products Mentioned**: evolutionQ BasejumpQDN; evolutionQ BasejumpSKI (referenced via evolutionQ conflict-of-interest disclosure)
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST (referenced re: PQC standards adoption)
- **Compliance Frameworks Referenced**: Canadian federal IT PQC migration mandate (April 2026 deadline); EU Coordinated PQC Transition Roadmap; NSA CNSA 2.0
- **Classical Algorithms Referenced**: RSA-2048; ECC; standard public-key cryptography
- **Key Takeaways**: The quantum threat to cybersecurity is closer than previously expected — 28–49% probability within 10 years is a substantial increase from 19–34% in 2024; experts now widely consider a CRQC by 2035 quite likely; HNDL attacks make immediate PQC migration urgent regardless of exact timeline; organizations may unknowingly be exposed to an intolerable level of risk requiring urgent action; covert research may accelerate timelines beyond what public data suggests.
- **Security Levels & Parameters**: RSA-2048 used as CRQC benchmark target (break in 24 hours)
- **Hybrid & Transition Approaches**: Proactive quantum-safe migration recommended; hybrid PQC approaches cited as near-term path; Mosca inequality framework (shelf-life + migration time vs. quantum threat time)
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Cyber-risk managers; Security Architect; Policy Maker; Executive
- **Implementation Prerequisites**: Cryptographic inventory; quantum risk assessment (QRA); migration timeline planning based on Mosca inequality
- **Relevant PQC Today Features**: Timeline; Threats; quantum-threats; pqc-risk-management; migration-program; data-asset-sensitivity; pqc-business-case
- **Phase Classification Rationale**: This document represents a Research phase event as it presents the results of an annual expert survey assessing the probability and timeline of cryptographically relevant quantum computers (CRQC). It focuses on threat assessment and expert consensus rather than implementation mandates or technical specifications.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: This report transitions the discourse from theoretical risk assessment to urgent action planning by highlighting an accelerated threat timeline, enabling organizations to move toward immediate mitigation strategies.
- **Historical Significance**: This milestone marks a significant acceleration in expert consensus regarding the CRQC timeline compared to 2024, with a majority now considering a CRQC by 2035 quite likely. It serves as a critical data point for updating global cybersecurity risk models and organizational preparedness strategies.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: Base enrichment reused from library record GRI-Quantum-Threat-Timeline-2025; timeline dimensions extracted separately

---

## Global:IBM — IBM Next-Gen Processor Development

- **Reference ID**: Global:IBM — IBM Next-Gen Processor Development
- **Title**: IBM Next-Gen Processor Development
- **Authors**: International Business Machines Corporation
- **Publication Date**: 2025-12-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: IBM is advancing development of a next-generation modular quantum processor with high-efficiency quantum error correction targeting early 2026 testing milestones.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Testing milestones targeted for early 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IBM is developing a modular quantum processor; The processor incorporates features for high-efficiency quantum error correction; Testing milestones are targeted for early 2026
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Algorithms; Leaders
- **Phase Classification Rationale**: The document describes the advancement of processor development and targets future testing milestones, indicating an active research and development phase rather than a finalized standard or deployment.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from conceptual design to hardware development; enables early 2026 testing of quantum error correction features.
- **Historical Significance**: Represents a specific corporate milestone in the development of modular quantum processors with high-efficiency error correction capabilities.
- **Implementation Timeline Dates**: Early 2026: testing milestones
- **Successor Events & Dependencies**: Enables testing of high-efficiency quantum error correction features; contingent on processor development completion.
- **Extraction Note**: No source text available

---

## Global:IBM — IBM Kookaburra Processor Released

- **Reference ID**: Global:IBM — IBM Kookaburra Processor Released
- **Title**: IBM Kookaburra Processor Released
- **Authors**: International Business Machines Corporation
- **Publication Date**: 2026-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: IBM releases the Kookaburra, a modular 1386-qubit processor combining quantum memory with logic operations.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IBM has released the Kookaburra processor; The processor features 1386 qubits; It combines quantum memory with logic operations; No PQC algorithms or migration strategies are discussed in this text.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 1386-qubit processor
- **Target Audience**: Researcher; Technology
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: quantum-threats; Algorithms; Leaders
- **Phase Classification Rationale**: The document describes the release of a new hardware processor, which represents a proof-of-concept or early demonstration phase in quantum computing capabilities rather than a finalized standard or mandate.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from theoretical research to hardware demonstration, enabling further testing of quantum memory and logic integration.
- **Historical Significance**: Represents the release of IBM's first modular 1386-qubit processor designed for encoded information processing.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Global:IBM — IBM Quantum Advantage Target

- **Reference ID**: Global:IBM — IBM Quantum Advantage Target
- **Title**: IBM Quantum Advantage Target
- **Authors**: International Business Machines Corporation
- **Publication Date**: 2026-12-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: IBM targets achieving and verifying quantum advantage by demonstrating verifiable speed-ups over classical computing for meaningful tasks.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IBM aims to demonstrate verifiable speed-ups over classical computing; The focus is on achieving quantum advantage for meaningful tasks; Verification of quantum advantage is a stated target.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: quantum-threats; pqc-business-case; Algorithms
- **Phase Classification Rationale**: The document describes a target to achieve and verify quantum advantage, which represents an exploratory research phase focused on demonstrating speed-ups rather than implementing standards.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: This event represents a research milestone that enables future verification of quantum capabilities but does not yet signal a transition to standardization or deployment.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Global:Microsoft — Microsoft QSP Roadmap Published

- **Reference ID**: Global:Microsoft — Microsoft QSP Roadmap Published
- **Title**: Microsoft QSP Roadmap Published
- **Authors**: Microsoft Corporation
- **Publication Date**: 2025-08-20
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Microsoft-QSP-Roadmap-2025; timeline dimensions extracted separately

---

## Global:Microsoft — Core Infrastructure Transition

- **Reference ID**: Global:Microsoft — Core Infrastructure Transition
- **Title**: Core Infrastructure Transition
- **Authors**: Microsoft Corporation
- **Publication Date**: 2026-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly describes an acceleration of the QSP transition for core infrastructure starting in 2026, indicating active migration activities rather than planning or research.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Technology; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from preparation to active implementation of QSP for core infrastructure services including signing and network services.
- **Historical Significance**: Represents a major vendor commitment to integrate post-quantum cryptography into foundational cloud and enterprise platforms starting in 2026.
- **Implementation Timeline Dates**: 2026: transition starts; 2027: Windows Azure M365 integration begins
- **Successor Events & Dependencies**: Windows Azure M365 integration beginning 2027
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Microsoft-QSP-Roadmap-2025; timeline dimensions extracted separately

---

## Global:Microsoft — Early Quantum-Safe Adoption

- **Reference ID**: Global:Microsoft — Early Quantum-Safe Adoption
- **Title**: Early Quantum-Safe Adoption
- **Authors**: Microsoft Corporation
- **Publication Date**: 2025-08-20
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Microsoft-QSP-Roadmap-2025; timeline dimensions extracted separately

---

## Global:Microsoft — Microsoft Full PQC Transition

- **Reference ID**: Global:Microsoft — Microsoft Full PQC Transition
- **Title**: Microsoft Full PQC Transition
- **Authors**: Microsoft Corporation
- **Publication Date**: 2025-08-20
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly states the completion of a full transition to quantum-ready standards ahead of government deadlines, marking a definitive endpoint for migration efforts.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Transitions from legacy cryptographic standards to full quantum-ready implementation across all products and services.
- **Historical Significance**: Represents a major milestone where a leading technology provider completed its PQC transition two years ahead of the 2035 government deadline.
- **Implementation Timeline Dates**: 2035: government deadlines; Two years ahead of 2035: Microsoft completion
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Microsoft-QSP-Roadmap-2025; timeline dimensions extracted separately

---

## Global:PQShield — Post-Quantum VPN Research Initiated

- **Reference ID**: Global:PQShield — Post-Quantum VPN Research Initiated
- **Title**: Post-Quantum VPN Research Initiated
- **Authors**: PQShield Ltd
- **Publication Date**: 2026-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: PQShield initiates research into Post-Quantum VPNs and expands formal verification efforts for real-world FHE operations.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: PQShield is initiating new research into Post-Quantum VPNs; Formal verification efforts for real-world FHE operations are being expanded; No specific algorithms or timelines were provided in the text.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vpn-ssh-pqc; research; algorithms; pqc-risk-management
- **Phase Classification Rationale**: The document explicitly states that PQShield "initiates new research" and "expands formal verification efforts," indicating an exploratory phase focused on investigation rather than deployment.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; Academic
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: This event represents the initiation of a research phase that may enable future standardization or product development for Post-Quantum VPNs and FHE.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Global:NXP/PQShield — Quantum-Safe Secure Element Pilot

- **Reference ID**: Global:NXP/PQShield — Quantum-Safe Secure Element Pilot
- **Title**: Quantum-Safe Secure Element Pilot
- **Authors**: NXP Semiconductors with PQShield
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NXP begins sampling a secure-element pilot incorporating a PQShield quantum-safe core in Q3 2025.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Milestones: Q3 2025: NXP begins sampling secure-element pilot
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: PQShield quantum-safe core; NXP secure-element pilot
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Secure Element
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NXP is initiating a pilot for quantum-safe secure elements; The pilot incorporates the PQShield quantum-safe core; Sampling of the pilot begins in Q3 2025
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Algorithms; vendor-risk; iot-ot-pqc
- **Phase Classification Rationale**: The document explicitly describes a "pilot" program where NXP begins "sampling" the product, indicating an exploratory proof-of-concept phase rather than full commercial deployment.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from research/development to pilot sampling; enables early evaluation of quantum-safe secure elements in hardware.
- **Historical Significance**: Represents an early commercial sampling event for a secure element integrating a third-party quantum-safe core, signaling market readiness for PQC hardware integration.
- **Implementation Timeline Dates**: Q3 2025: NXP begins sampling secure-element pilot
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Australia:ASD — Initial PQC Planning Guide

- **Reference ID**: Australia:ASD — Initial PQC Planning Guide
- **Title**: Initial PQC Planning Guide
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2022-07-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document title "Initial PQC Planning Guide" and description stating it is "guidance" indicate a non-mandatory advisory phase; however, no text content exists to confirm specific rationale.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Australia:ASD — Migration Planning Phase

- **Reference ID**: Australia:ASD — Migration Planning Phase
- **Title**: Migration Planning Phase
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Organizations develop refined PQC transition plans accounting for security goals, risk tolerances, and data value.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must account for security goals in transition plans; Risk tolerances must be evaluated during migration planning; Data value assessment is required for refined PQC strategies.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program; pqc-risk-management; data-asset-sensitivity; compliance-strategy
- **Phase Classification Rationale**: The document describes the development of a refined transition plan based on security goals and risk tolerances, which characterizes the initial assessment and planning stage of the Discovery phase.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: This event enables the move from high-level awareness to a refined, actionable transition plan tailored to organizational risk and data value.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Australia:ASD — PQC Planning Guide Updated

- **Reference ID**: Australia:ASD — PQC Planning Guide Updated
- **Title**: PQC Planning Guide Updated
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; Assess; pqc-governance
- **Phase Classification Rationale**: The document title and description indicate the publication of updated guidance, which aligns with a Guidance phase event providing strategic direction rather than a mandatory mandate.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Australia:ASD — Critical Systems Migration Start

- **Reference ID**: Australia:ASD — Critical Systems Migration Start
- **Title**: Critical Systems Migration Start
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Implementation of PQC algorithms begins with most critical and sensitive systems.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Implementation of PQC algorithms should begin with critical systems; Sensitive systems are the priority for initial migration; No specific timeline or algorithm details provided in this summary.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document title "Critical Systems Migration Start" and description explicitly state that implementation begins with critical systems, indicating the start of a migration phase.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Critical Infrastructure
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from planning to initial execution by targeting critical and sensitive systems first.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Australia:ASD — Full Migration Phase

- **Reference ID**: Australia:ASD — Full Migration Phase
- **Title**: Full Migration Phase
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Complete transition to ASD-approved PQC algorithms across all systems.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Complete transition to ASD-approved PQC algorithms is required; Migration applies across all systems; No specific timeline or algorithm details provided in text.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: ASD-approved PQC algorithms
- **Relevant PQC Today Features**: Migrate; migration-program; compliance-strategy; pqc-governance
- **Phase Classification Rationale**: The document title "Full Migration Phase" and description "Complete transition" explicitly define this as a migration event.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: Represents the final stage of transitioning to ASD-approved PQC algorithms across all systems.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Australia:ASD — Traditional Crypto Prohibited

- **Reference ID**: Australia:ASD — Traditional Crypto Prohibited
- **Title**: Traditional Crypto Prohibited
- **Authors**: Australian Signals Directorate
- **Publication Date**: 2025-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: RSA; ECDSA; ECDH
- **Key Takeaways**: Cease use of traditional asymmetric cryptography; Full transition to PQC required; Transition timeline is 5 years ahead of US/UK
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; Algorithms
- **Phase Classification Rationale**: The document title "Traditional Crypto Prohibited" and description "Cease use" indicate a mandatory stop date for legacy algorithms, classifying it as a Deadline phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Moves from traditional asymmetric cryptography usage to a full PQC transition state.
- **Historical Significance**: Represents a directive to prohibit traditional crypto 5 years ahead of US/UK timelines, signaling an accelerated adoption mandate.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Canada:CCCS — Departmental Planning Phase

- **Reference ID**: Canada:CCCS — Departmental Planning Phase
- **Title**: Departmental Planning Phase
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: The document explicitly describes the development of initial migration plans by federal departments, which characterizes the planning and assessment activities typical of a Discovery phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: This phase enables the transition from initial planning to the execution of PQC migration strategies within federal departments.
- **Historical Significance**: This milestone marks a formalized requirement for federal entities to initiate structured Post-Quantum Cryptography migration planning by 2026.
- **Implementation Timeline Dates**: April 2026: Federal departments must develop initial departmental PQC migration plans
- **Successor Events & Dependencies**: Execution of developed PQC migration plans; None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## Canada:CCCS — Departmental PQC Migration Plans Due

- **Reference ID**: Canada:CCCS — Departmental PQC Migration Plans Due
- **Title**: Departmental PQC Migration Plans Due
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: The document explicitly sets a submission deadline of April 2026 for initial PQC migration plans and mandates ongoing annual reporting. This establishes a fixed compliance endpoint rather than an exploratory or voluntary phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from planning to execution by requiring formal submission of migration strategies and initiating annual progress tracking.
- **Historical Significance**: Represents a critical federal enforcement milestone where departments must formalize their PQC readiness, marking the shift from guidance to actionable compliance.
- **Implementation Timeline Dates**: April 2026: initial PQC migration plans due; Annual: progress reporting thereafter
- **Successor Events & Dependencies**: Annual progress reporting; Inclusion of PQC vendor support clauses in new IT procurements
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## Canada:CCCS — High Priority Migration Phase

- **Reference ID**: Canada:CCCS — High Priority Migration Phase
- **Title**: High Priority Migration Phase
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: The document explicitly describes the migration of high priority government systems and mandates annual progress reporting, which defines a Migration phase event.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Annual progress reporting
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## Canada:CCCS — High Priority Systems Complete

- **Reference ID**: Canada:CCCS — High Priority Systems Complete
- **Title**: High Priority Systems Complete
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## Canada:CCCS — Remaining Systems Migration

- **Reference ID**: Canada:CCCS — Remaining Systems Migration
- **Title**: Remaining Systems Migration
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: The document title explicitly states "Remaining Systems Migration," indicating a focus on moving non-classified government systems to new standards. This aligns with the execution stage of replacing legacy cryptographic implementations.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## Canada:CCCS — Full GC Migration Complete

- **Reference ID**: Canada:CCCS — Full GC Migration Complete
- **Title**: Full GC Migration Complete
- **Authors**: Canadian Centre for Cyber Security
- **Publication Date**: 2025-06-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Roadmap and guidance for the Government of Canada to migrate non-classified IT systems to post-quantum cryptography by 2035.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest now, decrypt later (HNDL) threat; quantum computing threat to cryptography
- **Migration Timeline Info**: April 2026: Develop an initial departmental PQC migration plan; End of 2031: Completion of PQC migration of high priority systems; End of 2035: Completion of PQC migration of remaining systems
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Canadian Centre for Cyber Security, Treasury Board of Canada Secretariat, Shared Services Canada, Communications Security Establishment Canada
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security modules; smart cards; hardware tokens; cloud service provider; contracted IT platforms; network appliances; server racks; desktops; laptops; mobile telephones; printers; voice over Internet Protocol telephony
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Cryptographic Module Validation Program; ITSP 40.111; ITSP.40.062; ITSM.40.001
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must develop a departmental PQC migration plan by April 2026; High priority systems protecting confidentiality in transit must be migrated by end of 2031 due to HNDL threats; Procurement policies should include clauses requiring PQC support compliant with Cyber Centre recommendations; Financial planning must account for system replacement and staffing impacts while leveraging existing IT lifecycles; An inventory of all cryptographic usage across hardware, software, and cloud assets is required before transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; composite certificates not mentioned but crypto agility explicitly recommended for future configuration changes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Directors and managers of IT systems in federal departments and agencies; decision makers accountable for the migration to PQC; Designated Official for Cyber Security (DOCS); PQC Migration Executive Lead; PQC Migration Technical Lead
- **Implementation Prerequisites**: establishment of a committee with senior management representation; identification of a dedicated migration lead; development of a departmental PQC migration plan; creation of an inventory of systems employing cryptography; procurement clauses ensuring vendor support for PQC compliant with ITSP 40.111; certification of cryptographic modules by the Cryptographic Module Validation Program
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, pqc-governance, migration-program, crypto-agility, hsm-pqc, vendor-risk
- **Phase Classification Rationale**: The document explicitly states the completion of a migration project, marking the final deadline for Government of Canada non-classified systems. This represents the conclusion of a mandated transition phase rather than an ongoing process.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Transitions from active migration execution to post-migration operational status for non-classified systems.
- **Historical Significance**: Marks the full realization of PQC adoption across all non-classified Government of Canada systems, serving as a major national milestone in cryptographic modernization.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Canada CSE PQC Guidance; timeline dimensions extracted separately

---

## China:CAC — NGCC Algorithm Evaluation

- **Reference ID**: China:CAC — NGCC Algorithm Evaluation
- **Title**: NGCC Algorithm Evaluation
- **Authors**: Cyberspace Administration of China
- **Publication Date**: 2025-02-18
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The NGCC program evaluates submitted algorithms for security, performance, and implementation feasibility.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The NGCC program evaluates submitted algorithms; Evaluation criteria include security, performance, and implementation feasibility; No specific algorithms or timelines are provided in the text.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Assess; pqc-risk-management
- **Phase Classification Rationale**: The document describes an evaluation program for submitted algorithms, which aligns with the research and analysis phase of algorithm development.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: This event represents an ongoing evaluation process that enables the selection of algorithms for future standardization or adoption.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Czech Republic:NUKIB — Encryption Migration Complete

- **Reference ID**: Czech Republic:NUKIB — Encryption Migration Complete
- **Title**: Encryption Migration Complete
- **Authors**: National Cyber and Information Security Agency
- **Publication Date**: 2023-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: The document explicitly sets a completion target for encryption migration by 2027 and an immediate requirement for firmware/software signing, defining clear end-points for action.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Transitions from planning or partial implementation to full operational completion of key establishment and encryption migration.
- **Historical Significance**: Establishes a definitive 2027 milestone for the completion of core cryptographic migration efforts, marking a critical juncture in PQC adoption history.
- **Implementation Timeline Dates**: 2027: Complete migration for key establishment and encryption; As soon as possible: Firmware/software signing
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## European Union:NIS CG — Coordinated Roadmap v1.1

- **Reference ID**: European Union:NIS CG — Coordinated Roadmap v1.1
- **Title**: Coordinated Roadmap v1.1
- **Authors**: NIS Cooperation Group
- **Publication Date**: 2025-06-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The EU NIS Cooperation Group issued a coordinated implementation roadmap and timeline for the transition to Post-Quantum Cryptography across EU Member States.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing identified as a threat to cryptographic algorithms protecting confidentiality and authenticity of data
- **Migration Timeline Info**: Commission published Recommendation on 11 April 2024; document issued 23 June 2025
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: EU NIS Cooperation Group, Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must implement recommendations for a synchronised transition to PQC; Stakeholders need to be informed on the quantum threat to cryptography; A work stream on PQC was established with the NIS Cooperation Group; The roadmap provides harmonized timelines and priority sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: Establishment of a work stream on PQC with the NIS Cooperation Group; Implementation of recommendations for synchronised transition
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record EU-NIS-CG-Roadmap-v1.1; timeline dimensions extracted separately

---

## European Union:EC — Member State Strategy Initiation

- **Reference ID**: European Union:EC — Member State Strategy Initiation
- **Title**: Member State Strategy Initiation
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The EU NIS Cooperation Group issued a coordinated implementation roadmap and timeline for the transition to Post-Quantum Cryptography across EU Member States.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing identified as a threat to cryptographic algorithms protecting confidentiality and authenticity of data
- **Migration Timeline Info**: Commission published Recommendation on 11 April 2024; document issued 23 June 2025
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: EU NIS Cooperation Group, Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must implement recommendations for a synchronised transition to PQC; Stakeholders need to be informed on the quantum threat to cryptography; A work stream on PQC was established with the NIS Cooperation Group; The roadmap provides harmonized timelines and priority sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: Establishment of a work stream on PQC with the NIS Cooperation Group; Implementation of recommendations for synchronised transition
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, pqc-governance
- **Phase Classification Rationale**: The document explicitly sets a specific end date for the initiation of national strategies, defining a clear deadline for action.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from strategic planning to the formal initiation of national PQC transition strategies.
- **Historical Significance**: Establishes a unified EU-wide deadline for Member States to begin their post-quantum cryptography transition efforts.
- **Implementation Timeline Dates**: end of 2026: initiate national PQC transition strategies
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record EU-NIS-CG-Roadmap-v1.1; timeline dimensions extracted separately

---

## European Union:EC — High-Risk Systems Secured

- **Reference ID**: European Union:EC — High-Risk Systems Secured
- **Title**: High-Risk Systems Secured
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The EU NIS Cooperation Group issued a coordinated implementation roadmap and timeline for the transition to Post-Quantum Cryptography across EU Member States.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing identified as a threat to cryptographic algorithms protecting confidentiality and authenticity of data
- **Migration Timeline Info**: Commission published Recommendation on 11 April 2024; document issued 23 June 2025
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: EU NIS Cooperation Group, Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must implement recommendations for a synchronised transition to PQC; Stakeholders need to be informed on the quantum threat to cryptography; A work stream on PQC was established with the NIS Cooperation Group; The roadmap provides harmonized timelines and priority sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: Establishment of a work stream on PQC with the NIS Cooperation Group; Implementation of recommendations for synchronised transition
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, pqc-governance
- **Phase Classification Rationale**: The document explicitly sets a 2030 target date for securing critical infrastructure and high-risk systems with PQC, defining a clear endpoint for compliance. This establishes a definitive deadline rather than an ongoing process or exploratory phase.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Critical Infrastructure; High-Risk Systems
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: None detected
- **Historical Significance**: This milestone marks a projected global target for the full integration of PQC into critical infrastructure by 2030. It represents a strategic goal for securing high-risk systems against future quantum threats.
- **Implementation Timeline Dates**: 2030: Critical infrastructure and high-risk systems secured with PQC
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record EU-NIS-CG-Roadmap-v1.1; timeline dimensions extracted separately

---

## European Union:EC — Full EU PQC Transition

- **Reference ID**: European Union:EC — Full EU PQC Transition
- **Title**: Full EU PQC Transition
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The EU NIS Cooperation Group issued a coordinated implementation roadmap and timeline for the transition to Post-Quantum Cryptography across EU Member States.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computing identified as a threat to cryptographic algorithms protecting confidentiality and authenticity of data
- **Migration Timeline Info**: Commission published Recommendation on 11 April 2024; document issued 23 June 2025
- **Applicable Regions / Bodies**: Regions: EU Member States; Bodies: EU NIS Cooperation Group, Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Member States must implement recommendations for a synchronised transition to PQC; Stakeholders need to be informed on the quantum threat to cryptography; A work stream on PQC was established with the NIS Cooperation Group; The roadmap provides harmonized timelines and priority sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: Establishment of a work stream on PQC with the NIS Cooperation Group; Implementation of recommendations for synchronised transition
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record EU-NIS-CG-Roadmap-v1.1; timeline dimensions extracted separately

---

## France:ANSSI — Phase 1 - Pre-Quantum Security

- **Reference ID**: France:ANSSI — Phase 1 - Pre-Quantum Security
- **Title**: Phase 1 - Pre-Quantum Security
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: ANSSI presents France's position on PQC transition, advocating hybrid schemes and providing phased guidance for government and regulated entities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, BetaGouv, Direction interministérielle du numérique
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid post-quantum/classical schemes are the primary migration path; A phased approach is recommended for transition; Guidance applies to French government and regulated entities
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid post-quantum/classical schemes; Phased approach guidance
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, migration-program, pqc-governance, compliance-strategy
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-Position-2022; timeline dimensions extracted separately

---

## France:ANSSI — CEA-Leti CESTI PQC Accreditation

- **Reference ID**: France:ANSSI — CEA-Leti CESTI PQC Accreditation
- **Title**: CEA-Leti CESTI PQC Accreditation
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-09-29
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: CEA-Leti becomes the first CESTI accredited by ANSSI to evaluate PQC solutions.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ANSSI, CESTI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CEA-Leti is the first evaluation center accredited by ANSSI for PQC; Accreditation enables formal evaluation of PQC solutions; Event occurred on September 29, 2025
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Compliance; Assess; Leaders
- **Phase Classification Rationale**: The document describes an accreditation event by a national security body (ANSSI) for an evaluation center, signaling the formalization of PQC assessment capabilities.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Technology; Government
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from research/development to formal accreditation for evaluation, enabling certified testing of PQC solutions.
- **Historical Significance**: Marks the first time a CESTI has been accredited by ANSSI specifically for evaluating PQC solutions.
- **Implementation Timeline Dates**: September 29, 2025
- **Successor Events & Dependencies**: Enables CEA-Leti to begin evaluating PQC solutions under ANSSI accreditation.
- **Extraction Note**: No source text available

---

## France:ANSSI — First PQC Security Visas Issued

- **Reference ID**: France:ANSSI — First PQC Security Visas Issued
- **Title**: First PQC Security Visas Issued
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-10-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: ANSSI issued the first French PQC security certifications for Thales and Samsung hardware products.
- **PQC Algorithms Covered**: lattice-based algorithms
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Sept 29: Thales Smartcard MultiApp 5.2 Premium PQC certified; Oct 1: Samsung S3SSE2A microcontroller certified
- **Applicable Regions / Bodies**: France; ANSSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: Thales Smartcard MultiApp 5.2 Premium PQC; Samsung S3SSE2A microcontroller
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ANSSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: France has issued its first PQC security certifications; Certified products include smartcards and microcontrollers; Both certified products utilize lattice-based algorithms; Certifications were issued in late September and early October
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Compliance; Algorithms; Timeline; digital-id; hsm-pqc
- **Phase Classification Rationale**: The document describes the issuance of security certifications by a national body (ANSSI), representing a formal validation step in the standardization and adoption lifecycle.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Technology; Government
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from algorithm development to certified product availability, enabling secure deployment of PQC in hardware.
- **Historical Significance**: Marks the first issuance of French PQC security certifications for commercial hardware products.
- **Implementation Timeline Dates**: Sept 29; Oct 1
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## France:ANSSI — PG-083 Cryptographic Guide Update (Planned)

- **Reference ID**: France:ANSSI — PG-083 Cryptographic Guide Update (Planned)
- **Title**: PG-083 Cryptographic Guide Update (Planned)
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-10-07
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: ANSSI FAQ providing guidance on post-quantum cryptography algorithm selection, hybrid approaches, migration timelines, and practical steps for French organizations.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Start inventory immediately; PQC obligations for product qualification from 2027; unreasonable to buy non-PQC products after 2030; guide updates expected by end of 2025.
- **Applicable Regions / Bodies**: Regions: France, European Union; Bodies: ANSSI, Commission européenne
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI/IGC, systèmes embarqués
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: Référentiel général de sécurité, dispositif SAIV, Visas de sécurité ANSSI
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must start a cryptographic inventory immediately to identify critical data and usage cases; Hybridation is essential for short and medium term except for hash-based signatures; It will be unreasonable to purchase products without PQC after 2030; Regulatory obligations for PQC in product qualification begin in 2027.
- **Security Levels & Parameters**: IND-CCA2
- **Hybrid & Transition Approaches**: Hybridation (combining post-quantum and pre-quantum algorithms), CatKDF, CasKDF, crypto-agilité, signature concatenation, non-séparabilité
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory; identification of critical data and usage cases; contact suppliers for roadmaps; renewal calendar planning; awareness of side-channel and fault injection attacks in embedded systems.
- **Relevant PQC Today Features**: Timeline, hybrid-crypto, crypto-agility, pki-workshop, iot-ot-pqc, compliance-strategy
- **Phase Classification Rationale**: The document outlines ANSSI's plan to update cryptographic guides to include PQC, representing a strategic guidance phase rather than an immediate enforcement mandate.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from legacy cryptographic guidance to a PQC-inclusive framework, enabling future compliance and migration planning.
- **Historical Significance**: Marks ANSSI's commitment to integrating post-quantum cryptography into national standards by the end of 2025.
- **Implementation Timeline Dates**: End of 2025: update of Guide des mécanismes cryptographiques (PG-083) and algorithm selection guide
- **Successor Events & Dependencies**: Publication of updated PG-083; None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-FAQ-2025; timeline dimensions extracted separately

---

## France:ANSSI — Phase 2 - Hybridization Required

- **Reference ID**: France:ANSSI — Phase 2 - Hybridization Required
- **Title**: Phase 2 - Hybridization Required
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: ANSSI presents France's position on PQC transition, advocating hybrid schemes and providing phased guidance for government and regulated entities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, BetaGouv, Direction interministérielle du numérique
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid post-quantum/classical schemes are the primary migration path; A phased approach is recommended for transition; Guidance applies to French government and regulated entities
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid post-quantum/classical schemes; Phased approach guidance
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, migration-program, pqc-governance, compliance-strategy
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-Position-2022; timeline dimensions extracted separately

---

## France:ANSSI — IPsec DR Referential Update (Planned)

- **Reference ID**: France:ANSSI — IPsec DR Referential Update (Planned)
- **Title**: IPsec DR Referential Update (Planned)
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-10-07
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: ANSSI FAQ providing guidance on post-quantum cryptography algorithm selection, hybrid approaches, migration timelines, and practical steps for French organizations.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Start inventory immediately; PQC obligations for product qualification from 2027; unreasonable to buy non-PQC products after 2030; guide updates expected by end of 2025.
- **Applicable Regions / Bodies**: Regions: France, European Union; Bodies: ANSSI, Commission européenne
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI/IGC, systèmes embarqués
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: Référentiel général de sécurité, dispositif SAIV, Visas de sécurité ANSSI
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must start a cryptographic inventory immediately to identify critical data and usage cases; Hybridation is essential for short and medium term except for hash-based signatures; It will be unreasonable to purchase products without PQC after 2030; Regulatory obligations for PQC in product qualification begin in 2027.
- **Security Levels & Parameters**: IND-CCA2
- **Hybrid & Transition Approaches**: Hybridation (combining post-quantum and pre-quantum algorithms), CatKDF, CasKDF, crypto-agilité, signature concatenation, non-séparabilité
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory; identification of critical data and usage cases; contact suppliers for roadmaps; renewal calendar planning; awareness of side-channel and fault injection attacks in embedded systems.
- **Relevant PQC Today Features**: Timeline, hybrid-crypto, crypto-agility, pki-workshop, iot-ot-pqc, compliance-strategy
- **Phase Classification Rationale**: The document outlines a planned revision of an IPsec referential to include PQC requirements, representing future guidance rather than current enforcement.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government; Technology
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from existing IPsec standards to a future state incorporating PQC requirements within the ANSSI referential.
- **Historical Significance**: Marks a planned milestone for integrating post-quantum cryptography into French national security guidelines for IPsec protocols.
- **Implementation Timeline Dates**: 2026: Expected revision of IPsec DR referential
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-FAQ-2025; timeline dimensions extracted separately

---

## France:ANSSI — PQC Qualification Requirement

- **Reference ID**: France:ANSSI — PQC Qualification Requirement
- **Title**: PQC Qualification Requirement
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2025-10-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: PQC integration is mandatory for cryptographic solutions entering the ANSSI qualification process starting in 2027.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Starting 2027: PQC integration mandatory for certain product types in ANSSI qualification.
- **Applicable Regions / Bodies**: Bodies: ANSSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: PQC integration is mandatory for ANSSI qualification starting 2027; Requirement applies to at least certain product types; Organizations must prepare cryptographic solutions for this deadline.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Developer
- **Implementation Prerequisites**: PQC integration in cryptographic solutions; ANSSI qualification process adherence.
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; pqc-governance
- **Phase Classification Rationale**: The document explicitly states a mandatory requirement starting in 2027, establishing a specific deadline for compliance.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from voluntary or undefined PQC status to a mandatory requirement for ANSSI qualification.
- **Historical Significance**: Represents a specific national mandate by ANSSI requiring PQC integration for product qualification starting in 2027.
- **Implementation Timeline Dates**: 2027: PQC integration mandatory for certain product types entering ANSSI qualification process.
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## France:ANSSI — Phase 3 - Standalone PQC Optional

- **Reference ID**: France:ANSSI — Phase 3 - Standalone PQC Optional
- **Title**: Phase 3 - Standalone PQC Optional
- **Authors**: Agence nationale de la sécurité des systèmes d'information
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: ANSSI presents France's position on PQC transition, advocating hybrid schemes and providing phased guidance for government and regulated entities.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, BetaGouv, Direction interministérielle du numérique
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid post-quantum/classical schemes are the primary migration path; A phased approach is recommended for transition; Guidance applies to French government and regulated entities
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid post-quantum/classical schemes; Phased approach guidance
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, migration-program, pqc-governance, compliance-strategy
- **Phase Classification Rationale**: The document marks a transition where standalone PQC becomes an acceptable option rather than a requirement, indicating a shift in migration strategy. This represents a Migration phase event as it defines the conditions under which organizations can begin adopting PQC-only solutions.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from a state where standalone PQC is not acceptable to one where it becomes an optional choice for implementation.
- **Historical Significance**: This milestone signifies the point in 2030 when regulatory frameworks begin permitting the exclusive use of Post-Quantum Cryptography without hybrid requirements. It marks a critical juncture in the evolution from legacy or hybrid systems to standalone quantum-resistant standards.
- **Implementation Timeline Dates**: 2030: PQC alone becomes acceptable
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record ANSSI-PQC-Position-2022; timeline dimensions extracted separately

---

## G7:G7 CEG — G7 Statement on Quantum Computing

- **Reference ID**: G7:G7 CEG — G7 Statement on Quantum Computing
- **Title**: G7 Statement on Quantum Computing
- **Authors**: G7 Cyber Expert Group
- **Publication Date**: 2024-09-25
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Germany:BSI — Critical Applications PQC — Hybrid No Longer Required

- **Reference ID**: Germany:BSI — Critical Applications PQC — Hybrid No Longer Required
- **Title**: Critical Applications PQC — Hybrid No Longer Required
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-31
- **Last Updated**: Not specified
- **Document Status**: Updated
- **Main Topic**: Critical applications must be protected by standalone PQC algorithms by the end of 2030 per BSI TR-02102-1, making hybrid approaches optional rather than mandatory.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: End of 2030: standalone PQC algorithms permitted without requiring hybrid for sensitive and critical applications
- **Applicable Regions / Bodies**: Bodies: BSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: BSI
- **Compliance Frameworks Referenced**: BSI TR-02102-1
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Hybrid is no longer the mandatory minimum for sensitive data from 2030; Standalone PQC algorithms are permitted for critical applications by end of 2030; Hybrid remains acceptable but optional after 2030
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid (classical + PQC) remains acceptable but is no longer the mandatory minimum
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Compliance; hybrid-crypto; migration-program
- **Phase Classification Rationale**: The document specifies a definitive end date (end of 2030) by which standalone PQC is permitted and hybrid is no longer mandatory, establishing a clear regulatory deadline.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Critical Infrastructure; All Sectors
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Moves from a phase where hybrid was the mandatory minimum to a phase where standalone PQC is permitted for sensitive data.
- **Historical Significance**: Marks the point where BSI TR-02102-1 allows standalone PQC algorithms without requiring hybrid combinations for critical applications.
- **Implementation Timeline Dates**: End of 2030: standalone PQC algorithms permitted without requiring hybrid; January 2025: BSI TR-02102-1 publication
- **Successor Events & Dependencies**: Enables deployment of standalone PQC algorithms for sensitive and critical applications.
- **Extraction Note**: No source text available

---

## Israel:INCD — PQC Readiness Guide Published

- **Reference ID**: Israel:INCD — PQC Readiness Guide Published
- **Title**: PQC Readiness Guide Published
- **Authors**: Israel National Cyber Directorate
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Israel:INCD/BOI — Inventory & Planning Phase

- **Reference ID**: Israel:INCD/BOI — Inventory & Planning Phase
- **Title**: Inventory & Planning Phase
- **Authors**: Israel National Cyber Directorate / Bank of Israel
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Italy:ACN — PQC Guidance Published

- **Reference ID**: Italy:ACN — PQC Guidance Published
- **Title**: PQC Guidance Published
- **Authors**: Agenzia per la Cybersicurezza Nazionale
- **Publication Date**: 2024-07-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Japan:NISC — PQC Migration Planning

- **Reference ID**: Japan:NISC — PQC Migration Planning
- **Title**: PQC Migration Planning
- **Authors**: National center of Incident readiness and Strategy for Cybersecurity
- **Publication Date**: 2025-03-02
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: The document describes preparatory activities such as planning and guideline preparation following standardization, which characterizes the initial discovery of migration requirements.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from NIST standardization to the preparation of detailed guidelines by CRYPTREC.
- **Historical Significance**: Marks the shift from algorithm standardization to the development of national implementation guidelines by CRYPTREC.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Publication of detailed guidelines by CRYPTREC
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Japan:NEC/NICT — QKD High-Speed Data Integration Demo

- **Reference ID**: Japan:NEC/NICT — QKD High-Speed Data Integration Demo
- **Title**: QKD High-Speed Data Integration Demo
- **Authors**: NEC with NICT and Toshiba
- **Publication Date**: 2025-09-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NEC, NICT, and Toshiba unveiled an integrated system combining QKD with high-speed data transmission in large-capacity optical networks.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NEC, NICT, and Toshiba demonstrated the first integrated QKD and high-speed data system; The system operates within large-capacity optical networks; No specific PQC algorithms were mentioned in this QKD demonstration.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd; 5g-security; vendor-risk
- **Phase Classification Rationale**: The document describes a demonstration of an integrated system, indicating an exploratory or research phase rather than a formal migration mandate.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Telecommunications; Technology
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from theoretical QKD concepts to practical integration with high-speed data transmission in optical networks.
- **Historical Significance**: Represents the world's first integrated system for QKD and high-speed data transmission unveiled by NEC, NICT, and Toshiba.
- **Implementation Timeline Dates**: September 2025
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Japan:NISC — Critical Systems Migration

- **Reference ID**: Japan:NISC — Critical Systems Migration
- **Title**: Critical Systems Migration
- **Authors**: National center of Incident readiness and Strategy for Cybersecurity
- **Publication Date**: 2025-10-06
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: migration-program; qkd
- **Phase Classification Rationale**: The document title explicitly states "Critical Systems Migration" and the description outlines a target for migrating government systems using a dual-track approach.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## New Zealand:GCSB/NCSC — NZISM v3.8 Updated

- **Reference ID**: New Zealand:GCSB/NCSC — NZISM v3.8 Updated
- **Title**: NZISM v3.8 Updated
- **Authors**: Government Communications Security Bureau / NCSC
- **Publication Date**: 2024-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## New Zealand:GCSB/NCSC — Planning Phase

- **Reference ID**: New Zealand:GCSB/NCSC — Planning Phase
- **Title**: Planning Phase
- **Authors**: Government Communications Security Bureau / NCSC
- **Publication Date**: 2024-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## New Zealand:GCSB/NCSC — Transition Phase

- **Reference ID**: New Zealand:GCSB/NCSC — Transition Phase
- **Title**: Transition Phase
- **Authors**: Government Communications Security Bureau / NCSC
- **Publication Date**: 2024-09-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: The document explicitly states that the transition to PQC begins across government agencies, marking the start of a migration phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from pre-migration planning to active implementation starting in 2026-27.
- **Historical Significance**: This milestone marks the official commencement of PQC adoption across government agencies, setting a precedent for broader sector migration.
- **Implementation Timeline Dates**: 2026-27: transition begins
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Singapore:CSA/GovTech/IMDA — Quantum-Safe Handbook and Quantum Readiness Index Released

- **Reference ID**: Singapore:CSA/GovTech/IMDA — Quantum-Safe Handbook and Quantum Readiness Index Released
- **Title**: Quantum-Safe Handbook and Quantum Readiness Index Released
- **Authors**: Cyber Security Agency / GovTech / IMDA
- **Publication Date**: 2025-10-23
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: A draft handbook providing a four-pillar framework for Critical Information Infrastructure owners to prepare for quantum-safe migration.
- **PQC Algorithms Covered**: SLH-DSA, XMSS, LMS
- **Quantum Threats Addressed**: Cryptanalytically Relevant Quantum Computer (CRQC), Shor's algorithm, Grover's algorithm, Q-day
- **Migration Timeline Info**: Expert estimates place the horizon for Q-day within the next 5-10 years; migration is a multi-year endeavour executed in phases.
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: CSA, GovTech, IMDA
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, SSH, IPSEC, S/MIME
- **Infrastructure Layers**: Key establishment, identity management, access control, electronic signatures, ICS, SCADA
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, ECDH, DSA, DH, ECDSA, AES, SHA-1, SHA-2, SHA-3
- **Key Takeaways**: Organizations should start preparation immediately as Q-day is a matter of when not if; migration requires significant resources and time so rushing implementation may cause first-mover disadvantages; focus on no-regrets actions while monitoring evolving solutions; quantum threats affect confidentiality, integrity, and availability of systems and data.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Critical Information Infrastructure owners
- **Implementation Prerequisites**: Cryptographic asset discovery; risk prioritisation; phased migration planning; post-migration monitoring; multi-year roadmap development
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, pqc-governance
- **Phase Classification Rationale**: The document releases a draft handbook and readiness index specifically for public consultation, providing a migration framework rather than enforcing immediate compliance.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Critical Infrastructure; Government
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from initial awareness to structured planning by enabling CII owners to begin cryptographic asset discovery and risk prioritization.
- **Historical Significance**: Represents a coordinated effort by CSA, GovTech, and IMDA to establish a standardized four-pillar PQC migration framework for critical infrastructure owners.
- **Implementation Timeline Dates**: Oct 23 2025: public consultation start; Dec 31 2025: public consultation end
- **Successor Events & Dependencies**: Finalization of Quantum-Safe Handbook; Finalization of Quantum Readiness Index; Public feedback incorporation
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record SG-Quantum-Safe-Handbook-2025; timeline dimensions extracted separately

---

## South Korea:MSIT — Pilot Transition Phase

- **Reference ID**: South Korea:MSIT — Pilot Transition Phase
- **Title**: Pilot Transition Phase
- **Authors**: Ministry of Science and ICT
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## South Korea:MSIT — Full PQC Roadmap Complete

- **Reference ID**: South Korea:MSIT — Full PQC Roadmap Complete
- **Title**: Full PQC Roadmap Complete
- **Authors**: Ministry of Science and ICT
- **Publication Date**: 2025-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Spain:CCN — Four-Phase PQC Approach

- **Reference ID**: Spain:CCN — Four-Phase PQC Approach
- **Title**: Four-Phase PQC Approach
- **Authors**: Centro Criptológico Nacional
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Spain:CCN — PQC Transition Period

- **Reference ID**: Spain:CCN — PQC Transition Period
- **Title**: PQC Transition Period
- **Authors**: Centro Criptológico Nacional
- **Publication Date**: 2022-01-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Taiwan:MODA — Five-Year PQC Plan

- **Reference ID**: Taiwan:MODA — Five-Year PQC Plan
- **Title**: Five-Year PQC Plan
- **Authors**: Ministry of Digital Affairs
- **Publication Date**: 2024-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## Taiwan:MODA — Interim Quantum-Safe Milestone

- **Reference ID**: Taiwan:MODA — Interim Quantum-Safe Milestone
- **Title**: Interim Quantum-Safe Milestone
- **Authors**: Ministry of Digital Affairs
- **Publication Date**: 2024-01-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Summary of post-quantum cryptography government initiatives, algorithms under consideration, and migration timelines across 30+ countries as of March 2025.
- **PQC Algorithms Covered**: ML-KEM, Classic McEliece, FrodoKEM, AIMer, HAETAE, SMAUG-T, NTRU+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Australia: Complete transition by 2030; Canada: Introduce standards-based PQC from 2025-26; Czech Republic: Migrate by 2027; France: Transition from 2024; New Zealand: Transition from 2026-27; South Korea: Pilot transition plan 2025-2028, completion 2035; Spain: Four phase approach today to post-2030; United States: Implement 2023-2033
- **Applicable Regions / Bodies**: Australia, Canada, China, Czech Republic, European Union, France, Germany, Israel, Italy, Japan, Netherlands, New Zealand, Singapore, South Korea, Spain, United Kingdom, United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CRYPTREC, CAICT, NICCS, NÚKIB, ENISA, European Commission, ANSSI, BSI, NCSC, ACN, MAS, MSIT, CCN.ES, AIVD, TNO, CWI, NZISM
- **Compliance Frameworks Referenced**: CNSA20, HR7375, EO-14144, NSM-10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Governments are setting specific transition deadlines ranging from 2024 to 2035; Most countries are monitoring or adopting NIST standards while some like South Korea and China have domestic algorithm selections; Financial services sectors face specific requirements for quantum risk management and inventory planning; Hybrid mode deployment is recommended by the Netherlands for TLS; Ongoing monitoring is required due to rapidly evolving government guidance.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid mode for TLS
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: cryptographic inventory; initial plan; standards-based PQC adoption; pilot transition plan
- **Relevant PQC Today Features**: Timeline, Algorithms, Compliance, Migrate, Assess
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record GSMA-PQC-Country-Survey-2025; timeline dimensions extracted separately

---

## United Kingdom:NCSC — Discovery & Planning Phase

- **Reference ID**: United Kingdom:NCSC — Discovery & Planning Phase
- **Title**: Discovery & Planning Phase
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2025-03-20
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: UK NCSC guidance outlining a three-phase PQC migration timeline with sector-specific advice for government and CNI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Phase 1 by 2028 for discovery and planning; Phase 2 from 2028 to 2031 for active migration of priority systems; Phase 3 by 2035 for complete PQC migration.
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete discovery and planning by 2028; Priority systems require active migration between 2028 and 2031; Full PQC migration must be achieved by 2035; Guidance includes specific timelines for UK government and CNI sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Migrate, Assess, migration-program, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-Migration-Timelines-2025; timeline dimensions extracted separately

---

## United Kingdom:NCSC — Priority Migration Phase

- **Reference ID**: United Kingdom:NCSC — Priority Migration Phase
- **Title**: Priority Migration Phase
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2025-03-20
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: UK NCSC guidance outlining a three-phase PQC migration timeline with sector-specific advice for government and CNI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Phase 1 by 2028 for discovery and planning; Phase 2 from 2028 to 2031 for active migration of priority systems; Phase 3 by 2035 for complete PQC migration.
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete discovery and planning by 2028; Priority systems require active migration between 2028 and 2031; Full PQC migration must be achieved by 2035; Guidance includes specific timelines for UK government and CNI sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Migrate, Assess, migration-program, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-Migration-Timelines-2025; timeline dimensions extracted separately

---

## United Kingdom:NCSC — Full Migration Phase

- **Reference ID**: United Kingdom:NCSC — Full Migration Phase
- **Title**: Full Migration Phase
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2025-03-20
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: UK NCSC guidance outlining a three-phase PQC migration timeline with sector-specific advice for government and CNI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Phase 1 by 2028 for discovery and planning; Phase 2 from 2028 to 2031 for active migration of priority systems; Phase 3 by 2035 for complete PQC migration.
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete discovery and planning by 2028; Priority systems require active migration between 2028 and 2031; Full PQC migration must be achieved by 2035; Guidance includes specific timelines for UK government and CNI sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Migrate, Assess, migration-program, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-Migration-Timelines-2025; timeline dimensions extracted separately

---

## United Kingdom:NCSC — Full PQC Compliance

- **Reference ID**: United Kingdom:NCSC — Full PQC Compliance
- **Title**: Full PQC Compliance
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2025-03-20
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: UK NCSC guidance outlining a three-phase PQC migration timeline with sector-specific advice for government and CNI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Phase 1 by 2028 for discovery and planning; Phase 2 from 2028 to 2031 for active migration of priority systems; Phase 3 by 2035 for complete PQC migration.
- **Applicable Regions / Bodies**: Regions: United Kingdom; Bodies: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must complete discovery and planning by 2028; Priority systems require active migration between 2028 and 2031; Full PQC migration must be achieved by 2035; Guidance includes specific timelines for UK government and CNI sectors.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Migrate, Assess, migration-program, pqc-governance
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Government; Critical Infrastructure
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-Migration-Timelines-2025; timeline dimensions extracted separately

---

## United States:NSA — Software/Firmware Signing Transition

- **Reference ID**: United States:NSA — Software/Firmware Signing Transition
- **Title**: Software/Firmware Signing Transition
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: The document explicitly instructs to begin transitioning immediately and sets a 2025 target for supporting CNSA 2.0, indicating an active migration phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from legacy signing methods to CNSA 2.0 compliant software and firmware signing by 2025.
- **Historical Significance**: Establishes a concrete 2025 deadline for adopting CNSA 2.0 standards in software and firmware signing, marking a critical step in PQC governance.
- **Implementation Timeline Dates**: 2025: support and prefer CNSA 2.0
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NIST/NSA — Cryptographic Inventory

- **Reference ID**: United States:NIST/NSA — Cryptographic Inventory
- **Title**: Cryptographic Inventory
- **Authors**: National Institute of Standards and Technology / NSA
- **Publication Date**: 2022-05-04
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: National Security Memorandum 10 directs U.S. federal agencies to inventory cryptographic systems and transition to quantum-resistant cryptography by 2035 while promoting leadership in quantum information science.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptanalytically relevant quantum computer (CRQC)
- **Migration Timeline Info**: Goal of mitigating quantum risk as much as feasible by 2035; first sets of standards expected by 2024; deprecation timeline proposed within 90 days of standard release with a goal to move systems off vulnerable cryptography within a decade.
- **Applicable Regions / Bodies**: Regions: United States; Bodies: National Institute of Standards and Technology (NIST), National Security Agency (NSA), Cybersecurity and Infrastructure Security Agency (CISA), Office of Management and Budget (OMB), National Cyber Director, Office of Science and Technology Policy, Federal Civilian Executive Branch (FCEB) Agencies.
- **Leaders Contributions Mentioned**: President Joe Biden; Vice President Kamala Harris; First Lady Dr. Jill Biden; Second Gentleman Douglas Emhoff; Secretary of Commerce; Secretary of Homeland Security; Director of NIST; Director of NSA; Director of CISA; Director of OMB; National Cyber Director; Assistant to the President for National Security Affairs (APNSA).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public-key cryptography; digital signatures; system administrator protocols; non-security software and firmware; High Value Assets; High Impact Systems.
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); technical standards bodies.
- **Compliance Frameworks Referenced**: National Quantum Initiative Act (Public Law 115-368); National Defense Authorization Act for Fiscal Year 2022 (Public Law 117-81).
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal agencies must inventory all currently deployed cryptographic systems excluding National Security Systems; NIST and NSA are developing technical standards for quantum-resistant cryptography expected by 2024; The United States aims to mitigate quantum risk as much as feasible by 2035; Agencies must establish a Migration to Post-Quantum Cryptography Project at the National Cybersecurity Center of Excellence; Cryptographic agility is central to reducing transition time and allowing seamless updates.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: cryptographic agility; interoperable quantum-resistant cryptography; migration planning; inventorying vulnerable systems.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer, Security Architect, CISO, Operations
- **Implementation Prerequisites**: Inventory of IT systems vulnerable to CRQCs; identification of key information technology assets to prioritize; development of migration plans addressing most significant risks first; coordination with the National Quantum Coordination Office.
- **Relevant PQC Today Features**: Timeline, Threats, Compliance, Migrate, Assess, Leaders, crypto-agility, pqc-risk-management, migration-program, pqc-governance
- **Phase Classification Rationale**: The document explicitly describes the performance of a comprehensive cryptographic inventory, which is the foundational activity of the Discovery phase; it references specific tools (ACDI) and guidance (NSM-10) to initiate this assessment.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: Enables the transition from Discovery to Assessment by establishing a baseline of current cryptographic usage across federal agencies.
- **Historical Significance**: Represents the formalization of inventory requirements for federal agencies under NSM-10, marking a structured start to the PQC migration lifecycle.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: ACDI tools; NSM-10 compliance
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record NSM-10; timeline dimensions extracted separately

---

## United States:NSA — Web/Cloud Services Transition

- **Reference ID**: United States:NSA — Web/Cloud Services Transition
- **Title**: Web/Cloud Services Transition
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: The document explicitly outlines a transition requirement to support and prefer CNSA 2.0 standards by a specific year, indicating an active migration phase. It mandates a shift in web and cloud service configurations toward post-quantum cryptography readiness.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from legacy cryptographic standards to CNSA 2.0 compliance for web browsers, servers, and cloud services.
- **Historical Significance**: This milestone establishes a concrete deadline for the technology sector to adopt NIST's post-quantum cryptography standards in critical internet infrastructure.
- **Implementation Timeline Dates**: 2025: Support and prefer CNSA 2.0
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NSA — Traditional Networking Transition

- **Reference ID**: United States:NSA — Traditional Networking Transition
- **Title**: Traditional Networking Transition
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: The document explicitly outlines a transition requirement to support and prefer CNSA 2.0 standards by a specific future date, indicating an active migration phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Technology; Telecommunications; Critical Infrastructure
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions traditional networking equipment from legacy cryptographic standards to CNSA 2.0 compliance.
- **Historical Significance**: Represents a critical deadline for upgrading VPNs and routers to post-quantum secure standards within the specified timeframe.
- **Implementation Timeline Dates**: 2026: Support and prefer CNSA 2.0
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NSA — Operating Systems Transition

- **Reference ID**: United States:NSA — Operating Systems Transition
- **Title**: Operating Systems Transition
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: The document explicitly mandates a transition to CNSA 2.0 standards by a specific year, representing a clear migration directive from legacy cryptographic suites.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Technology
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions operating systems from current cryptographic standards to CNSA 2.0 compliance.
- **Historical Significance**: Establishes a definitive 2027 deadline for operating system vendors to adopt post-quantum cryptography aligned with US government standards.
- **Implementation Timeline Dates**: 2027: Support and prefer CNSA 2.0
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:CISA — ACDI Deployment Phase

- **Reference ID**: United States:CISA — ACDI Deployment Phase
- **Title**: ACDI Deployment Phase
- **Authors**: Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2024-09-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: CISA strategy outlining the approach for Federal Civilian Executive Branch agencies to adopt automated cryptography discovery and inventory tools for assessing Post-Quantum Cryptography migration progress.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: Data expected to remain mission-sensitive in 2035; annual submission of inventory required
- **Applicable Regions / Bodies**: United States; Federal Civilian Executive Branch (FCEB); Cybersecurity and Infrastructure Security Agency (CISA); Office of Management and Budget (OMB); Office of the National Cyber Director (ONCD); National Institute of Standards and Technology (NIST); National Security Agency
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure; cloud-based information systems; on-premises information systems; database systems; file systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act of 2014 (FISMA); Federal Information Processing Standard 199 (FIPS 199); Memorandum 2302 (M-23-02); National Security Memorandum 10
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Agencies must inventory active cryptographic systems using automated tools where possible and manual means for embedded or custom software; Three specific data items (algorithm, service provided, key length) can be collected via ACDI or CDM tools while six other items require manual collection; Integration of ACDI tools with the Continuous Diagnostics and Mitigation (CDM) Program aims to reduce resource requirements for inventory generation; Vendors may simplify inventory processes by advertising product roadmaps for PQC-hybrid or PQC-only modes; The strategy applies to high impact systems, High Value Assets, and systems containing data sensitive in 2035.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC-hybrid mode; PQC-only mode
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Operations; Policy Maker
- **Implementation Prerequisites**: Automated Cryptography Discovery and Inventory (ACDI) tools; Continuous Diagnostics and Mitigation (CDM) Program integration; CyberScope for reporting; Manual tracking for embedded cryptography or customized applications
- **Relevant PQC Today Features**: Assess; Migrate; Compliance; Threats; Migration-program
- **Phase Classification Rationale**: The document explicitly describes the deployment of Automated Cryptographic Discovery and Inventory (ACDI) tools to complete cryptographic inventories, which is the core activity of the Discovery phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: Enables the transition from initial planning to active inventory completion as part of the CISA strategy.
- **Historical Significance**: Represents a key operational step where federal agencies begin executing the Automated Cryptographic Discovery and Inventory strategy mandated by CISA.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Completion of cryptographic inventories; None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-CISA-ACDI-Strategy-2024; timeline dimensions extracted separately

---

## United States:NSA — Large PKI Systems Migration

- **Reference ID**: United States:NSA — Large PKI Systems Migration
- **Title**: Large PKI Systems Migration
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NIST — HQC Standard Finalized (Expected)

- **Reference ID**: United States:NIST — HQC Standard Finalized (Expected)
- **Title**: HQC Standard Finalized (Expected)
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2025-03-11
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The expected publication of the final standard incorporating the HQC algorithm approximately one year after the draft.
- **PQC Algorithms Covered**: HQC
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Final standard expected approximately one year after draft
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Final HQC standard expected within one year of draft; Standardization process is nearing completion; No specific implementation dates provided in text
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Algorithms; Standardization
- **Phase Classification Rationale**: The document describes the finalization of a standard for the HQC algorithm, indicating a transition from draft to formal publication.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: Near-Term
- **Phase Transition Narrative**: Moves from Draft Standardization to Final Standardization — signals the imminent availability of a finalized HQC specification.
- **Historical Significance**: Represents the anticipated completion of the standardization process for the HQC algorithm, marking a key milestone in post-quantum cryptography adoption.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Enables final adoption of HQC; contingent on draft publication date
- **Extraction Note**: No source text available

---

## United States:NIST — 112-bit Security Deprecated

- **Reference ID**: United States:NIST — 112-bit Security Deprecated
- **Title**: 112-bit Security Deprecated
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2024-11-12
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Deprecation of 112-bit security strength algorithms and mandatory migration to 128-bit minimum or approved PQC algorithms for federal systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Disallowed in federal systems after 2035
- **Applicable Regions / Bodies**: Bodies: NIST; Regions: United States (implied by "federal systems" and NIST reference)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST IR 8547 (draft)
- **Classical Algorithms Referenced**: RSA-2048; DH-2048; ECDH P-256; AES-256; SHA-384
- **Key Takeaways**: Algorithms at 112-bit security strength are deprecated per NIST IR 8547 draft; Systems must migrate to 128-bit minimum or approved PQC algorithms; 112-bit algorithms will be disallowed in federal systems after 2035
- **Security Levels & Parameters**: 112-bit security strength; 128-bit minimum; RSA-2048; DH-2048; ECDH P-256; AES-256; SHA-384+
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: Migration to 128-bit minimum or approved PQC algorithms
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; Algorithms; pqc-risk-management
- **Phase Classification Rationale**: The document explicitly states that specific algorithms are "Disallowed in federal systems after 2035," establishing a hard deadline for compliance.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from deprecation warning to mandatory enforcement; signals the end of support for 112-bit algorithms in federal environments.
- **Historical Significance**: Represents a formal NIST directive setting a hard cutoff date for legacy cryptographic strengths in US federal systems.
- **Implementation Timeline Dates**: 2035: Disallowed in federal systems
- **Successor Events & Dependencies**: Requires migration to 128-bit minimum or approved PQC algorithms; None detected
- **Extraction Note**: No source text available

---

## United States:NSA — CNSA 2.0 Exclusive - Network/Signing

- **Reference ID**: United States:NSA — CNSA 2.0 Exclusive - Network/Signing
- **Title**: CNSA 2.0 Exclusive - Network/Signing
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Defense; Technology
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NSA — NSS Quantum Resistant Majority

- **Reference ID**: United States:NSA — NSS Quantum Resistant Majority
- **Title**: NSS Quantum Resistant Majority
- **Authors**: National Security Agency
- **Publication Date**: 2024-12-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: The vast majority of cryptography in National Security Systems should be quantum resistant.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Vast majority of cryptography in National Security Systems should be quantum resistant; No specific algorithms or timelines provided; No implementation details available
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Compliance; Migration-program
- **Phase Classification Rationale**: The document uses the word "should" to describe a requirement for National Security Systems, indicating a guidance or recommendation rather than a legally binding mandate with a specific date.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Defense; Government
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Signals a strategic direction for National Security Systems to adopt quantum resistance without defining a specific transition mechanism or timeline.
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## United States:NSA — CNSA 2.0 Exclusive - OS/Web/Cloud

- **Reference ID**: United States:NSA — CNSA 2.0 Exclusive - OS/Web/Cloud
- **Title**: CNSA 2.0 Exclusive - OS/Web/Cloud
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Technology; Government
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NSA — Full CNSA 2.0 Transition Complete

- **Reference ID**: United States:NSA — Full CNSA 2.0 Transition Complete
- **Title**: Full CNSA 2.0 Transition Complete
- **Authors**: National Security Agency
- **Publication Date**: 2022-09-07
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NSA releases CNSA 2.0 specifying quantum-resistant algorithm requirements and transition deadlines for US National Security Systems.
- **PQC Algorithms Covered**: ML-KEM-1024, ML-DSA-87, LMS, XMSS, SLH-DSA
- **Quantum Threats Addressed**: cryptanalytically-relevant quantum computer (CRQC)
- **Migration Timeline Info**: 2030-2033 transition deadlines for US national security systems
- **Applicable Regions / Bodies**: United States; National Security Agency (NSA); National Security Systems (NSS)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **Classical Algorithms Referenced**: public-key systems; asymmetric cryptography
- **Key Takeaways**: Organizations must plan, prepare and budget for transition to QR algorithms; CRQC poses a threat to current public-key systems; Transition deadlines are set between 2030 and 2033 for NSS; CNSA 2.0 mandates specific quantum-resistant algorithms for different use cases
- **Security Levels & Parameters**: ML-KEM-1024, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Algorithms; Migration
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: None detected
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record US-NSA-CNSA-2.0-2022; timeline dimensions extracted separately

---

## United States:NSA — CNSA 1.0 Compliance Deadline for NSS

- **Reference ID**: United States:NSA — CNSA 1.0 Compliance Deadline for NSS
- **Title**: CNSA 1.0 Compliance Deadline for NSS
- **Authors**: National Security Agency
- **Publication Date**: 2025-12-31
- **Last Updated**: Not specified
- **Document Status**: In Progress
- **Main Topic**: National Security Systems must achieve CNSA 1.0 compliance or submit a waiver by the end of the year, with non-compliant systems having six months to reach CNSA 2.0 compliance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: End of year deadline for CNSA 1.0 compliance or waiver; 6-month window for non-compliant systems to achieve CNSA 2.0 compliance or request waiver.
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: CNSA 1.0; CNSA 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: All existing National Security Systems must be CNSA 1.0 compliant or submit a waiver by year-end; Non-compliant systems have a six-month window to achieve CNSA 2.0 compliance; Waiver requests are an alternative path for systems unable to meet immediate compliance; CNSA 2.0 is the target standard for systems failing initial CNSA 1.0 requirements.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Compliance; Timeline; Migration-program; pqc-governance
- **Phase Classification Rationale**: The document explicitly states a "Compliance Deadline" requiring action by the "end of year" and sets a subsequent 6-month window for further compliance, fitting the definition of a mandatory deadline event.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Defense; Government
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from current state to mandatory CNSA 1.0 compliance or waiver status, enabling a subsequent transition phase toward CNSA 2.0 for non-compliant systems within six months.
- **Historical Significance**: Represents a strict enforcement point for National Security Systems to adopt the Commercial National Security Algorithm suite, marking a critical step in federal cryptographic modernization.
- **Implementation Timeline Dates**: End of year; 6 months
- **Successor Events & Dependencies**: Requires achievement of CNSA 2.0 compliance or submission of a waiver request within six months for systems not meeting CNSA 1.0 standards.
- **Extraction Note**: No source text available

---

## United States:Microsoft — NIST PQC Algorithms in Windows Platform

- **Reference ID**: United States:Microsoft — NIST PQC Algorithms in Windows Platform
- **Title**: NIST PQC Algorithms in Windows Platform
- **Authors**: Microsoft Corporation
- **Publication Date**: 2025-11-01
- **Last Updated**: Not specified
- **Document Status**: Completed
- **Main Topic**: The document is a Microsoft Security website navigation and blog feed listing various cybersecurity products, threat intelligence reports, and AI security articles, but does not contain the specific Quantum Safe Program roadmap described in the title.
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document announces the general availability of NIST PQC algorithms in Windows 11 and Windows Server 2025, enabling enterprise adoption which characterizes the Migration phase.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from algorithm standardization to platform-level implementation, enabling enterprise PQC adoption.
- **Historical Significance**: This milestone marks the integration of ML-KEM and ML-DSA into major operating systems, facilitating widespread enterprise migration.
- **Implementation Timeline Dates**: November 2025
- **Successor Events & Dependencies**: Enterprise PQC adoption; None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record Microsoft-QSP-Roadmap-2025; timeline dimensions extracted separately

---

## United States:CISA — Federal PQC Procurement Guidance

- **Reference ID**: United States:CISA — Federal PQC Procurement Guidance
- **Title**: Federal PQC Procurement Guidance
- **Authors**: Cybersecurity and Infrastructure Security Agency
- **Publication Date**: 2026-01-23
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: CISA provides updated lists of hardware and software product categories where post-quantum cryptography (PQC) products are widely available or transitioning, in response to Executive Order 14306.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, HMS, XMSS, XMSSMT
- **Quantum Threats Addressed**: cryptographically relevant quantum computer (CRQC)
- **Migration Timeline Info**: By December 1, 2025, CISA shall release and regularly update a list of product categories with widely available PQC products; organizations should plan acquisitions to procure only PQC-capable products in listed categories.
- **Applicable Regions / Bodies**: United States; Cybersecurity and Infrastructure Security Agency (CISA); National Security Agency (NSA); General Services Administration (GSA); Federal Civilian Executive Branch (FCEB)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public key infrastructure (PKI); Hardware security modules (HSM); Key establishment; Digital signatures
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS) 203; Federal Information Processing Standards (FIPS) 204; Federal Information Processing Standards (FIPS) 205; NISTSP 800-208; Executive Order 14306
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should acquire only PQC-capable products in categories listed as widely available; Table 3 lists categories where manufacturer implementation of PQC is encouraged but not yet widely available; Products must support PQC for key establishment and digital signatures to be fully quantum resistant; Operational technology (OT) and internet of things (IoT) devices are out of scope for these specific lists.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Organizations may need to use non-PQC algorithms for a time for interoperability reasons even after procuring PQC products; CISA will move product categories from Table 3 to Table 2 as they mature their capabilities and transition to PQC.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Procurement Officer, Policy Maker
- **Implementation Prerequisites**: Products must implement PQC for core features and all secondary functionality such as software updates; Organizations must plan acquisitions in accordance with typical procurement policies and procedures.
- **Relevant PQC Today Features**: Compliance, Migrate, Assess, Algorithms, stateful-signatures
- **Phase Classification Rationale**: The document represents a Guidance phase as it issues federal buying guidance directing agencies to acquire PQC-capable products in specific categories. It outlines procurement requirements rather than technical implementation standards or final mandates for all sectors.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Government; Technology
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial standardization to active procurement enforcement, enabling the shift toward PQC-capable infrastructure in federal agencies.
- **Historical Significance**: This milestone marks the operationalization of Executive Order 14306 by directing federal agencies to begin acquiring only PQC-capable products in widely available categories. It establishes a concrete procurement baseline for government technology modernization.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Transitioning networking and identity management systems; acquisition of PQC-capable cloud services, collaboration tools, browsers, and endpoint security
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record CISA-PQC-CATEGORY-LIST-2026; timeline dimensions extracted separately

---

## Hong Kong:HKMA — Fintech Promotion Blueprint: Quantum Preparedness Index

- **Reference ID**: Hong Kong:HKMA — Fintech Promotion Blueprint: Quantum Preparedness Index
- **Title**: Fintech Promotion Blueprint: Quantum Preparedness Index
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2026-02-03
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Hong Kong Monetary Authority launched a Fintech Promotion Blueprint featuring a Quantum Preparedness Index to assess banking sector readiness for Post-Quantum Cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Mr Arthur Yuen, Deputy Chief Executive of the HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: High-Performance Computing
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA will develop a Quantum Preparedness Index to assess banking sector PQC readiness; The Blueprint establishes Data Excellence and Cyber Resilience as foundational pillars for managing advanced technology risks; Four flagship projects including the Quantum Preparedness Index will be launched in the coming months; The initiative aims to guide practical support throughout the PQC transition journey
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess, Leaders, pqc-governance, migration-program, pqc-risk-management
- **Phase Classification Rationale**: The document describes the unveiling of a blueprint and index by a regulatory body to set measurable migration targets, which constitutes a policy-setting event. It establishes a framework for assessing readiness rather than enforcing immediate technical implementation.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from general awareness to structured assessment and target setting for the banking sector.
- **Historical Significance**: Represents a regulatory initiative by HKMA to formalize PQC readiness assessment specifically tailored for small and medium-sized banks within the fintech ecosystem.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record HKMA-Fintech-Blueprint-2026; timeline dimensions extracted separately

---

## Hong Kong:HKMA — Financial Sector PQC Planning

- **Reference ID**: Hong Kong:HKMA — Financial Sector PQC Planning
- **Title**: Financial Sector PQC Planning
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2026-02-03
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Hong Kong Monetary Authority launched a Fintech Promotion Blueprint featuring a Quantum Preparedness Index to assess banking sector readiness for Post-Quantum Cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Mr Arthur Yuen, Deputy Chief Executive of the HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: High-Performance Computing
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA will develop a Quantum Preparedness Index to assess banking sector PQC readiness; The Blueprint establishes Data Excellence and Cyber Resilience as foundational pillars for managing advanced technology risks; Four flagship projects including the Quantum Preparedness Index will be launched in the coming months; The initiative aims to guide practical support throughout the PQC transition journey
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess, Leaders, pqc-governance, migration-program, pqc-risk-management
- **Phase Classification Rationale**: The document describes the development of preparedness plans and cryptographic inventories, which are foundational discovery activities; it also notes that industry consultation on adoption guidelines is currently underway.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Enables the transition from initial planning and inventory assessment to the development of formal adoption guidelines through industry consultation.
- **Historical Significance**: Represents a sector-specific milestone where financial institutions align with the HKMA Fintech 2030 Quantum Preparedness Index to initiate structured quantum readiness.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Finalization of PQC adoption guidelines; completion of cryptographic inventories
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record HKMA-Fintech-Blueprint-2026; timeline dimensions extracted separately

---

## India:DST/NQM — CII PQC Foundations Deadline

- **Reference ID**: India:DST/NQM — CII PQC Foundations Deadline
- **Title**: CII PQC Foundations Deadline
- **Authors**: Department of Science and Technology National Quantum Mission
- **Publication Date**: 2026-02-04
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: India DST Task Force report outlining a phased roadmap for migrating to Post-Quantum Cryptography under the National Quantum Mission with milestones through 2033.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL); Shor's algorithm; Grover's algorithm; Q-Day
- **Migration Timeline Info**: CII foundations by 2027; high-priority systems by 2028; full CII by 2029; nationwide by 2033
- **Applicable Regions / Bodies**: Regions: India; Bodies: Department of Science and Technology (DST), National Quantum Mission (NQM), Centre for Development of Telematics (C-DOT), Telecommunication Engineering Centre (TEC), Data Security Council of India (DSCI)
- **Leaders Contributions Mentioned**: Dr. Rajkumar Upadhyay, CEO, C-DOT, chaired the Task Force; Mr. Kamal Kumar Agarwal, DDG, QT, TEC, chaired Sub-Group 1 for standards and testing; Mr. Vinayak Godse, CEO, DSCI, chaired Sub-Group 2 for quantum resiliency and migration
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI systems; National Evaluation and Testing infrastructure; national testbeds; Quantum Key Distribution (QKD) backbone
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Indian Standards
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); symmetric encryption; cryptographic hash functions
- **Key Takeaways**: India must establish CII foundations by 2027 and achieve nationwide PQC adoption by 2033; Organizations should launch PQC/hybrid solution pilots in high-priority systems immediately; A National PQC Testing & Certification Program is required to validate quantum-safe products; Long-term confidential data faces immediate risk from Harvest Now, Decrypt Later attacks; Migration requires progressive adoption of indigenously developed quantum-safe products while maintaining global interoperability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC/hybrid solution pilots; hybrid PQC–QKD solutions; crypto agility; phased transition to PQC
- **Performance & Size Considerations**: Average cost of a data breach is 4.44 million USD; 15% increase in breach costs since 2020
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher, Operations
- **Implementation Prerequisites**: Cryptographic inventory; establishment of National Evaluation and Testing infrastructure; development of PQC-ready PKI systems; creation of national testbeds for hybrid solutions
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; qkd; crypto-agility; migration-program; pqc-governance; digital-id
- **Phase Classification Rationale**: The document explicitly sets a mandatory deadline for PQC adoption foundations and operational testing labs by December 2026. It enforces immediate action through mandatory CBOM submissions for critical sectors.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Defense; Telecommunications; Energy; Government; Critical Infrastructure
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Transitions from foundational planning to mandatory operational readiness and compliance submission.
- **Historical Significance**: Establishes a concrete 2026 deadline for critical infrastructure sectors to have PQC foundations and certified testing labs operational.
- **Implementation Timeline Dates**: December 2026: Testing labs (TEC STQC BIS) to be operational; Immediate: Mandatory CBOM submissions begin
- **Successor Events & Dependencies**: Operational testing labs (TEC STQC BIS); Mandatory CBOM submissions
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record India-DST-NQM-Roadmap; timeline dimensions extracted separately

---

## India:DST/NQM — National PQC Migration

- **Reference ID**: India:DST/NQM — National PQC Migration
- **Title**: National PQC Migration
- **Authors**: Department of Science and Technology National Quantum Mission
- **Publication Date**: 2026-02-04
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: India DST Task Force report outlining a phased roadmap for migrating to Post-Quantum Cryptography under the National Quantum Mission with milestones through 2033.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL); Shor's algorithm; Grover's algorithm; Q-Day
- **Migration Timeline Info**: CII foundations by 2027; high-priority systems by 2028; full CII by 2029; nationwide by 2033
- **Applicable Regions / Bodies**: Regions: India; Bodies: Department of Science and Technology (DST), National Quantum Mission (NQM), Centre for Development of Telematics (C-DOT), Telecommunication Engineering Centre (TEC), Data Security Council of India (DSCI)
- **Leaders Contributions Mentioned**: Dr. Rajkumar Upadhyay, CEO, C-DOT, chaired the Task Force; Mr. Kamal Kumar Agarwal, DDG, QT, TEC, chaired Sub-Group 1 for standards and testing; Mr. Vinayak Godse, CEO, DSCI, chaired Sub-Group 2 for quantum resiliency and migration
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI systems; National Evaluation and Testing infrastructure; national testbeds; Quantum Key Distribution (QKD) backbone
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Indian Standards
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); symmetric encryption; cryptographic hash functions
- **Key Takeaways**: India must establish CII foundations by 2027 and achieve nationwide PQC adoption by 2033; Organizations should launch PQC/hybrid solution pilots in high-priority systems immediately; A National PQC Testing & Certification Program is required to validate quantum-safe products; Long-term confidential data faces immediate risk from Harvest Now, Decrypt Later attacks; Migration requires progressive adoption of indigenously developed quantum-safe products while maintaining global interoperability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC/hybrid solution pilots; hybrid PQC–QKD solutions; crypto agility; phased transition to PQC
- **Performance & Size Considerations**: Average cost of a data breach is 4.44 million USD; 15% increase in breach costs since 2020
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher, Operations
- **Implementation Prerequisites**: Cryptographic inventory; establishment of National Evaluation and Testing infrastructure; development of PQC-ready PKI systems; creation of national testbeds for hybrid solutions
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; qkd; crypto-agility; migration-program; pqc-governance; digital-id
- **Phase Classification Rationale**: The document explicitly outlines a phased migration strategy with specific deadlines for CII systems and all sectors to achieve quantum-safe status. It details the transition from current cryptographic standards to hybrid PQC and QKD solutions.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Critical Infrastructure; All Sectors
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from legacy cryptographic systems to a fully quantum-safe state via hybrid PQC and QKD integration.
- **Historical Significance**: Establishes a definitive national timeline requiring full quantum safety for all sectors by 2033, marking a shift from voluntary adoption to enforced migration.
- **Implementation Timeline Dates**: 2028: high-priority CII systems; 2029: full CII quantum-safe; 2033: all sectors
- **Successor Events & Dependencies**: Hybrid PQC plus QKD for high-assurance applications; Quantum-safe requirements integrated into procurement
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record India-DST-NQM-Roadmap; timeline dimensions extracted separately

---

## India:DST/NQM — Full Nationwide PQC Adoption

- **Reference ID**: India:DST/NQM — Full Nationwide PQC Adoption
- **Title**: Full Nationwide PQC Adoption
- **Authors**: Department of Science and Technology National Quantum Mission
- **Publication Date**: 2026-02-04
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: India DST Task Force report outlining a phased roadmap for migrating to Post-Quantum Cryptography under the National Quantum Mission with milestones through 2033.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL); Shor's algorithm; Grover's algorithm; Q-Day
- **Migration Timeline Info**: CII foundations by 2027; high-priority systems by 2028; full CII by 2029; nationwide by 2033
- **Applicable Regions / Bodies**: Regions: India; Bodies: Department of Science and Technology (DST), National Quantum Mission (NQM), Centre for Development of Telematics (C-DOT), Telecommunication Engineering Centre (TEC), Data Security Council of India (DSCI)
- **Leaders Contributions Mentioned**: Dr. Rajkumar Upadhyay, CEO, C-DOT, chaired the Task Force; Mr. Kamal Kumar Agarwal, DDG, QT, TEC, chaired Sub-Group 1 for standards and testing; Mr. Vinayak Godse, CEO, DSCI, chaired Sub-Group 2 for quantum resiliency and migration
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI systems; National Evaluation and Testing infrastructure; national testbeds; Quantum Key Distribution (QKD) backbone
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Indian Standards
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Cryptography (ECC); symmetric encryption; cryptographic hash functions
- **Key Takeaways**: India must establish CII foundations by 2027 and achieve nationwide PQC adoption by 2033; Organizations should launch PQC/hybrid solution pilots in high-priority systems immediately; A National PQC Testing & Certification Program is required to validate quantum-safe products; Long-term confidential data faces immediate risk from Harvest Now, Decrypt Later attacks; Migration requires progressive adoption of indigenously developed quantum-safe products while maintaining global interoperability
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: PQC/hybrid solution pilots; hybrid PQC–QKD solutions; crypto agility; phased transition to PQC
- **Performance & Size Considerations**: Average cost of a data breach is 4.44 million USD; 15% increase in breach costs since 2020
- **Target Audience**: Policy Maker, Security Architect, Compliance Officer, Researcher, Operations
- **Implementation Prerequisites**: Cryptographic inventory; establishment of National Evaluation and Testing infrastructure; development of PQC-ready PKI systems; creation of national testbeds for hybrid solutions
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; qkd; crypto-agility; migration-program; pqc-governance; digital-id
- **Phase Classification Rationale**: None detected
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: None detected
- **Phase Transition Narrative**: None detected
- **Historical Significance**: None detected
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record India-DST-NQM-Roadmap; timeline dimensions extracted separately

---

## Malaysia:NACSA — National PQC Migration Plan Published

- **Reference ID**: Malaysia:NACSA — National PQC Migration Plan Published
- **Title**: National PQC Migration Plan Published
- **Authors**: National Cyber Security Agency of Malaysia
- **Publication Date**: 2025-10-28
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The PKI Consortium's Post-Quantum Cryptography Conference 2025 in Kuala Lumpur concluded with an urgent global call to migrate to quantum-resistant encryption and the announcement of Malaysia's national PQC roadmap.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computers rendering today's encryption obsolete; compromise of financial systems, national defense, healthcare, and transportation within minutes; exposure of vast data stores and critical infrastructure
- **Migration Timeline Info**: Conference held 28-30 October 2025; next conference in Germany in 2026; urgent call to act now before quantum computers make data unsafe
- **Applicable Regions / Bodies**: Regions: Malaysia, ASEAN, Southeast Asia, Germany; Bodies: PKI Consortium, Ministry of Digital Malaysia, National Cyber Security Agency (NACSA)
- **Leaders Contributions Mentioned**: Paul van Brouwershaven (Chair of the PKI Consortium and its Post-Quantum Cryptography Working Group); Chris Bailey (Board and Executive Council Chair of the PKI Consortium)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Public Key Infrastructure (PKI), critical infrastructure, Internet of Things (IoT)
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must begin replacing vulnerable cryptography immediately to safeguard the digital economy; Malaysia has launched a National Post-Quantum Cryptography Readiness Roadmap for ASEAN; The PKI Consortium introduced the Post-Quantum Cryptography Maturity Model (PQCMM) to assess preparedness; Global coordination is required across government, industry, and academia to accelerate migration; High-risk sectors like healthcare and IoT require specific protection strategies
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Cryptographic agility; migration planning; system-wide cryptographic migrations
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Policy Maker, Government Leaders, Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Migrate, Assess, Leaders, Threats, Timeline, pki-workshop, iot-ot-pqc
- **Phase Classification Rationale**: The document describes the publication of a National PQC Migration Plan and the launch of a proof-of-concept program by government bodies, which constitutes a policy-level governance event.
- **Regulatory Mandate Level**: None detected
- **Sector / Industry Applicability**: Government; All Sectors
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from planning to the exploratory phase via the launch of the PQC Sandbox 2025 proof-of-concept program.
- **Historical Significance**: This milestone positions Malaysia as an ASEAN leader in PQC adoption through the formal publication of a national migration plan spanning 2025 to 2030.
- **Implementation Timeline Dates**: 2025: launch of PQC Sandbox 2025; 2030: end of National PQC Migration Plan period
- **Successor Events & Dependencies**: Launch of PQC Sandbox 2025 proof-of-concept program; execution of National PQC Migration Plan (2025-2030)
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record PKI-Consortium-PQC-2025; timeline dimensions extracted separately

---

## Germany:BSI — Full PQC Transition — Standalone Algorithms Required

- **Reference ID**: Germany:BSI — Full PQC Transition — Standalone Algorithms Required
- **Title**: Full PQC Transition — Standalone Algorithms Required
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-31
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly sets 2035 as the target year requiring standalone PQC algorithms and defines a transition from hybrid to standalone configurations. This establishes a definitive endpoint for the hybrid migration phase.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from permitting hybrid configurations starting in 2030 to requiring standalone PQC algorithms by 2035.
- **Historical Significance**: This milestone marks the final deadline for replacing classical cryptography with standalone post-quantum algorithms in sensitive systems under BSI guidelines.
- **Implementation Timeline Dates**: 2030: hybrid configurations permitted; 2035: standalone PQC required
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record BSI TR-02102; timeline dimensions extracted separately

---

## European Union:EC — High-Priority System Migration Begins

- **Reference ID**: European Union:EC — High-Priority System Migration Begins
- **Title**: High-Priority System Migration Begins
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: EU PQC Recommendation sets 2027 as the start date for high-priority system migration and 2030 for full completion of critical infrastructure migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Begin PQC migration of high-priority systems by 2027; complete full migration of critical infrastructure and high-risk systems by 2030
- **Applicable Regions / Bodies**: Regions: EU; Bodies: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: High-priority systems handling critical data with long confidentiality requirements must begin PQC migration by 2027; Full migration of critical infrastructure and high-risk systems is required by 2030; The EU has established a specific timeline for PQC adoption in critical sectors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document explicitly sets 2027 as the target for beginning migration and 2030 for completion, establishing fixed deadlines for action.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: Critical Infrastructure
- **Migration Urgency & Priority**: Critical Deadline
- **Phase Transition Narrative**: Moves from planning to active execution of PQC migration for high-priority systems starting in 2027, leading to full completion by 2030.
- **Historical Significance**: Represents a formal EU recommendation establishing specific years for the commencement and conclusion of PQC migration for critical infrastructure.
- **Implementation Timeline Dates**: 2027: begin PQC migration of high-priority systems; 2030: complete full migration of critical infrastructure and high-risk systems
- **Successor Events & Dependencies**: None detected
- **Extraction Note**: No source text available

---

## Singapore:MAS — Financial Sector PQC Migration Plans Due

- **Reference ID**: Singapore:MAS — Financial Sector PQC Migration Plans Due
- **Title**: Financial Sector PQC Migration Plans Due
- **Authors**: Monetary Authority of Singapore
- **Publication Date**: 2024-02-20
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Monetary Authority of Singapore advisory requiring financial institutions to develop quantum risk management programs and conduct cryptographic inventory assessments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Singapore; Bodies: Monetary Authority of Singapore
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Financial institutions must develop quantum risk management programs; Cryptographic inventory assessments are mandated; PQC planning timelines are established for the financial sector
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, CISO, Security Architect
- **Implementation Prerequisites**: Develop quantum risk management programs; Conduct cryptographic inventory assessments
- **Relevant PQC Today Features**: pqc-risk-management, compliance-strategy, migration-program, assess
- **Phase Classification Rationale**: The document explicitly sets a 2028 deadline for regulated financial institutions to submit PQC migration plans, marking a definitive compliance endpoint. It follows a structured sequence of risk assessments and inventories leading up to this submission requirement.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from initial risk assessments and cryptographic inventories completed by 2026 to the formal submission of detailed migration plans.
- **Historical Significance**: Represents a key regulatory milestone where financial institutions in Singapore must formalize their quantum-safe strategies under MAS guidance.
- **Implementation Timeline Dates**: 2026: initial risk assessments and cryptographic inventories; 2028: submit detailed PQC migration plans
- **Successor Events & Dependencies**: Initial risk assessments (2026); Cryptographic inventories (2026)
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record SG-MAS-Quantum-Advisory-2024; timeline dimensions extracted separately

---

## Hong Kong:HKMA — PQC Readiness Assessment Required

- **Reference ID**: Hong Kong:HKMA — PQC Readiness Assessment Required
- **Title**: PQC Readiness Assessment Required
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2026-02-03
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Hong Kong Monetary Authority launched a Fintech Promotion Blueprint featuring a Quantum Preparedness Index to assess banking sector readiness for Post-Quantum Cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Mr Arthur Yuen, Deputy Chief Executive of the HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: High-Performance Computing
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA will develop a Quantum Preparedness Index to assess banking sector PQC readiness; The Blueprint establishes Data Excellence and Cyber Resilience as foundational pillars for managing advanced technology risks; Four flagship projects including the Quantum Preparedness Index will be launched in the coming months; The initiative aims to guide practical support throughout the PQC transition journey
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess, Leaders, pqc-governance, migration-program, pqc-risk-management
- **Phase Classification Rationale**: The document explicitly mandates a formal assessment completion by 2027, establishing a fixed regulatory deadline for regulated banks.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial awareness to formal assessment and roadmap submission phases.
- **Historical Significance**: Represents a specific regulatory enforcement point for the HKMA Fintech 2030 framework requiring cryptographic inventory and migration planning.
- **Implementation Timeline Dates**: 2027: complete formal quantum preparedness assessment; 2030: framework target year
- **Successor Events & Dependencies**: Cryptographic inventory CBOM submission; Preliminary migration roadmap submission
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record HKMA-Fintech-Blueprint-2026; timeline dimensions extracted separately

---

## Hong Kong:HKMA — Financial Sector PQC Migration Complete

- **Reference ID**: Hong Kong:HKMA — Financial Sector PQC Migration Complete
- **Title**: Financial Sector PQC Migration Complete
- **Authors**: Hong Kong Monetary Authority
- **Publication Date**: 2026-02-03
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: The Hong Kong Monetary Authority launched a Fintech Promotion Blueprint featuring a Quantum Preparedness Index to assess banking sector readiness for Post-Quantum Cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Hong Kong; Bodies: Hong Kong Monetary Authority
- **Leaders Contributions Mentioned**: Mr Arthur Yuen, Deputy Chief Executive of the HKMA
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: High-Performance Computing
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HKMA will develop a Quantum Preparedness Index to assess banking sector PQC readiness; The Blueprint establishes Data Excellence and Cyber Resilience as foundational pillars for managing advanced technology risks; Four flagship projects including the Quantum Preparedness Index will be launched in the coming months; The initiative aims to guide practical support throughout the PQC transition journey
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess, Leaders, pqc-governance, migration-program, pqc-risk-management
- **Phase Classification Rationale**: The document explicitly sets a 2030 completion target for PQC migration across regulated financial institutions, defining a clear endpoint for the transition effort.
- **Regulatory Mandate Level**: Mandatory
- **Sector / Industry Applicability**: Finance; Banking
- **Migration Urgency & Priority**: Long-Term (3-5yr)
- **Phase Transition Narrative**: Transitions from current legacy cryptographic systems to full Post-Quantum Cryptography compliance by the 2030 deadline.
- **Historical Significance**: Represents a coordinated regional regulatory milestone aligning Hong Kong, Singapore, and international bodies on a unified PQC adoption timeline for the financial sector.
- **Implementation Timeline Dates**: 2030: completion of PQC migration for all regulated financial institutions
- **Successor Events & Dependencies**: Alignment with MAS Singapore and BIS guidance; None detected
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record HKMA-Fintech-Blueprint-2026; timeline dimensions extracted separately

---

## United States:NIST — 112-bit Security Algorithms Fully Disallowed

- **Reference ID**: United States:NIST — 112-bit Security Algorithms Fully Disallowed
- **Title**: 112-bit Security Algorithms Fully Disallowed
- **Authors**: National Institute of Standards and Technology
- **Publication Date**: 2024-11-12
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: NIST IR 8547 establishes a 2035 deadline to fully disallow 112-bit security algorithms in federal systems.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: 2030: deprecation (no new use); 2035: full disallowance of existing use for 112-bit algorithms
- **Applicable Regions / Bodies**: United States; federal systems
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-2048; DH-2048; ECDH P-256
- **Key Takeaways**: 112-bit security algorithms are fully disallowed by 2035 in federal systems; New use of these algorithms is prohibited starting 2030; Systems must migrate to 128-bit minimum or approved PQC algorithms; RSA-2048, DH-2048, and ECDH P-256 are explicitly targeted for disallowance
- **Security Levels & Parameters**: 112-bit security strength; 128-bit minimum
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Policy Maker
- **Implementation Prerequisites**: Migration to 128-bit minimum or approved PQC algorithms
- **Relevant PQC Today Features**: Timeline; Compliance; Migrate; Algorithms; migration-program
- **Phase Classification Rationale**: The document explicitly sets a "disallowance deadline" for 2035, marking the end of permitted use for specific algorithms. It distinguishes this from a 2030 deprecation date where new use is already prohibited.
- **Regulatory Mandate Level**: Mandatory (legally required, directive/mandate language)
- **Sector / Industry Applicability**: Government
- **Migration Urgency & Priority**: Critical Deadline (specific compliance deadline with year)
- **Phase Transition Narrative**: Moves from deprecation of new use in 2030 to full prohibition of existing use by 2035, forcing complete migration.
- **Historical Significance**: Establishes a definitive end-of-life date for 112-bit security strength algorithms in US federal systems under NIST IR 8547.
- **Implementation Timeline Dates**: 2030: deprecation (no new use); 2035: disallowance deadline
- **Successor Events & Dependencies**: Requires migration to 128-bit minimum or approved PQC algorithms; None detected
- **Extraction Note**: No source text available

---

## United Kingdom:NCSC — PQC Whitepaper Published

- **Reference ID**: United Kingdom:NCSC — PQC Whitepaper Published
- **Title**: PQC Whitepaper Published
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2023-11-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: None detected
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
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected
- **Phase Classification Rationale**: The document is explicitly titled as guidance and outlines actions for organizations to begin preparing for PQC transition; it assesses the landscape rather than enforcing compliance.
- **Regulatory Mandate Level**: Recommended
- **Sector / Industry Applicability**: All Sectors
- **Migration Urgency & Priority**: Near-Term (1-3yr)
- **Phase Transition Narrative**: Transitions from initial awareness to active preparation by endorsing a hybrid approach and outlining specific organizational actions.
- **Historical Significance**: Represents the first major UK guidance on PQC transition, establishing a national framework for organizations to begin their migration efforts.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Adoption of NIST final standards; organizational preparation actions
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record UK-NCSC-PQC-Whitepaper-2024; timeline dimensions extracted separately

---

## Global:OASIS — PKCS#11 v3.2 Committee Specification Draft Published

- **Reference ID**: Global:OASIS — PKCS#11 v3.2 Committee Specification Draft Published
- **Title**: PKCS#11 v3.2 Committee Specification Draft Published
- **Authors**: Organization for the Advancement of Structured Information Standards
- **Publication Date**: 2025-04-16
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: PKCS #11 Specification Version 3.2 defines data types, functions, and mechanisms for post-quantum cryptography including ML-KEM, ML-DSA, and SLH-DSA within the Cryptoki interface.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valerie Fenwick (Chair); Robert Relyea (Chair); Dieter Bong (Editor); Greg Scott (Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, WTLS
- **Infrastructure Layers**: HSM, Key Management
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA, EdDSA, XEdDSA, Diffie-Hellman, AES, SHA-1, HMAC
- **Key Takeaways**: PKCS #11 v3.2 introduces native support for ML-KEM, ML-DSA, and SLH-DSA mechanisms; New functions C_EncapsulateKey and C_DecapsulateKey enable KEM operations; New key types CKK_ML_KEM, CKK_ML_DSA, and CKK_SLH_DSA are defined; Attributes CKA_PARAMETER_SET, CKA_ENCAPSULATE, CKA_DECAPSULATE, and CKA_SEED support PQC key management; The specification supersedes PKCS #11 Specification Version 3.1
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: C or C++ compiler; PKCS #11 header files (pkcs11.h, pkcs11f.h, pkcs11t.h)
- **Relevant PQC Today Features**: Algorithms, hsm-pqc, crypto-agility, tls-basics, pki-workshop
- **Phase Classification Rationale**: The document describes the publication of a Committee Specification Draft by the OASIS PKCS#11 Technical Committee, which is a formal step in defining a standard interface for post-quantum mechanisms. This represents the Standardization phase as it establishes the technical specifications for HSM support of NIST PQC algorithms.
- **Regulatory Mandate Level**: Informational
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Transitions from algorithm standardization to interface standardization, enabling the next phase of HSM implementation and integration.
- **Historical Significance**: This is the first major HSM interface standard to explicitly support NIST PQC algorithms, marking a critical milestone for hardware security module adoption of post-quantum cryptography.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Finalization of PKCS#11 v3.2; Implementation of C_EncapsulateKey/C_DecapsulateKey functions in HSMs
- **Extraction Note**: No source text available
- **Extraction Note**: Base enrichment reused from library record PKCS11-V32-OASIS; timeline dimensions extracted separately

---

## Global:TCG — TPM 2.0 PQC Library Specification Draft

- **Reference ID**: Global:TCG — TPM 2.0 PQC Library Specification Draft
- **Title**: TPM 2.0 PQC Library Specification Draft
- **Authors**: Trusted Computing Group
- **Publication Date**: 2025-07-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Trusted Computing Group publishes a draft update to the TPM 2.0 Library Specification incorporating post-quantum cryptography with hybrid support.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Hardware root of trust
- **Standardization Bodies**: Trusted Computing Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: TPM 2.0 Library Specification is being updated to include PQC; The update incorporates hybrid classical and post-quantum support; Changes affect hardware root of trust in billions of devices
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid classical+PQ support
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto; hsm-pqc; pki-workshop; iot-ot-pqc; migration-program
- **Phase Classification Rationale**: The document represents a Standardization phase event as it is a draft specification update published by the Trusted Computing Group to incorporate algorithms into the TPM 2.0 standard.
- **Regulatory Mandate Level**: Voluntary
- **Sector / Industry Applicability**: Technology; All Sectors
- **Migration Urgency & Priority**: Exploratory
- **Phase Transition Narrative**: Moves from research concepts to formal specification drafting, enabling hardware root of trust updates for billions of devices.
- **Historical Significance**: This draft marks the integration of post-quantum cryptography into the TPM 2.0 standard, affecting a massive global installed base of computing devices.
- **Implementation Timeline Dates**: None detected
- **Successor Events & Dependencies**: Enables hardware root of trust updates in billions of computing devices; Requires finalization of the V1.85 specification draft.
- **Extraction Note**: No source text available

---
