---
generated: 2026-05-07
collection: library
documents_processed: 1
enrichment_method: ollama-qwen3.6:27b
---

## ProjectEleven-Quantum-Threat-Blockchains-2026

- **Reference ID**: ProjectEleven-Quantum-Threat-Blockchains-2026
- **Title**: The Quantum Threat to Blockchains: 2026 Report
- **Authors**: Project Eleven (Alex Pruden; Conor Deegan)
- **Publication Date**: 2026-05-05
- **Last Updated**: 2026-05-06
- **Document Status**: Released
- **Main Topic**: Comprehensive analysis of quantum threats to blockchain systems, including Q-Day projections, cryptographic vulnerabilities, and migration recommendations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computer (CRQC); Shor's algorithm; Harvest Now Decrypt Later (implied by "trillions of dollars currently secured... will be vulnerable" and urgency to migrate before Q-Day)
- **Migration Timeline Info**: Q-Day likely by 2030–2033; migration may take the better part of a decade
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Alex Pruden (CEO, Project Eleven); Conor Deegan (CTO, Project Eleven); John Preskill (Caltech researcher); Dolev Bluvstein (Oratomic researcher); Peter Shor (mathematical physicist who showed quantum computer could factor large numbers)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: BIP-32 HD wallet
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-2048; ECC-256; secp256k1; ECDSA
- **Key Takeaways**: Migration to post-quantum cryptography is imperative for blockchain security; Q-Day is projected between 2030 and 2033, requiring urgent action; Blockchain migration is structurally harder than centralized systems due to static keys and distributed nature; Resource estimates for breaking elliptic curve cryptography have collapsed, reducing required logical qubits to roughly 1,200; Waiting for Q-Day risks insufficient time for PQC selection, testing, and deployment
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 1,200 logical qubits required to break ECC; nine minutes runtime on superconducting hardware; 10,000 reconfigurable atomic qubits for Shor's algorithm; 105-qubit Willow processor
- **Target Audience**: CISO; Security Architect; Blockchain Operators; Digital Asset Custodians
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; digital-assets; pqc-risk-management; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Migration may take the better part of a decade; distributed nature of blockchain networks makes migration harder; static public keys hold funds for years or decades with no recovery mechanism
- **Financial & Business Impact**: Trillions of dollars currently secured under existing classical cryptographic schemes will be vulnerable
- **Organizational Readiness**: None detected
- **Source Document**: The%20Quantum%20Threat%20to%20Blockchains%20-%202026%20Report.pdf (56,780,875 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T22:46:37

---

## QuantumFinanceBoardroom-Ganguly-PQC-Ch24-2026

- **Reference ID**: QuantumFinanceBoardroom-Ganguly-PQC-Ch24-2026
- **Title**: Post Quantum Cryptography (Chapter 24, A Portrait of Quantum Technologies in Finance)
- **Authors**: Santanu Ganguly; The Quantum Finance Boardroom (ed. Oswaldo Zapata)
- **Publication Date**: 2026-05-06
- **Last Updated**: 2026-05-06
- **Document Status**: Released
- **Main Topic**: Overview of Post-Quantum Cryptography fundamentals, NIST standardization, algorithm selection, and the threat landscape including Harvest Now Decrypt Later and QKD limitations.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium, Sphincs+, FALCON, SIKE, Rainbow
- **Quantum Threats Addressed**: Harvest now, decrypt later (HNDL); quantum computer attacks on asymmetric encryption; future quantum capabilities
- **Migration Timeline Info**: NIST released first finalized standards in August 2024; quantum computer with sufficient power not expected for at least another decade
- **Applicable Regions / Bodies**: United Kingdom; Bodies: NIST (National Institute of Standards and Technology), NCSC (National Cyber Security Centre), The Quantum Finance Boardroom
- **Leaders Contributions Mentioned**: Santanu Ganguly (author, field-tested PQC in UK telecom, published papers/patents); John Preskill (open-sourced quantum computing notes); Ward Beullens (demonstrated practical key recovery attack on Rainbow); Oswaldo Zapata (editor of monograph)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cloud based roll out; SDN (Software Defined Networking); PKI (implied via public/private key discussion); Key Management (implied via key exchange)
- **Standardization Bodies**: NIST (National Institute of Standards and Technology)
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, FIPS 206
- **Classical Algorithms Referenced**: RSA, Elliptic Curve Cryptography (ECC), Symmetric Key encryption, Pre-shared Key
- **Key Takeaways**: Organizations should build crypto inventories and introduce crypto-agile architectures to allow algorithm replacement without major redesign; Sensitive data with long retention periods is exposed to Harvest Now Decrypt Later threats requiring immediate assessment; QKD is not endorsed for government/military or commercial replacement of public key solutions by NCSC UK due to lack of standardization and distance limitations; NIST finalized ML-KEM, ML-DSA, and SLH-DSA standards in August 2024 providing a foundation for enterprise planning; Previous NIST candidates like SIKE and Rainbow were broken by classical computers, highlighting the importance of rigorous validation
- **Security Levels & Parameters**: 2048-bit encryption; 2048 bits (for factorization problem); 50km-60km (QKD transmission limit)
- **Hybrid & Transition Approaches**: Hybrid classical-quantum crypto; Crypto-agile architectures; Migration from quantum-vulnerable public-key cryptography
- **Performance & Size Considerations**: SIKE broken in roughly 62 minutes on a single-core PC; Rainbow broken on a laptop; CRYSTALS-Kyber has comparatively small encryption keys and speed of operation; FALCON provides smaller signatures than Dilithium; SPHINCS+ is larger and slower than other signature algorithms
- **Target Audience**: Security Architect; CISO; Researcher; Policy Maker
- **Implementation Prerequisites**: Crypto inventories; Crypto-agile architectures; Assessment of cryptographic landscape
- **Relevant PQC Today Features**: pqc-risk-management; crypto-agility; qkd; migration-program; pqc-business-case
- **Implementation Attack Surface**: Harvest now, decrypt later (HNDL); Key interception during transit; Side-channel attacks implied by QKD observation principles
- **Cryptographic Discovery & Inventory**: Build crypto inventories; Assess cryptographic landscape
- **Testing & Validation Methods**: Field testing; Practical key recovery attack demonstration
- **QKD Protocols & Quantum Networking**: Quantum Key Distribution (QKD); QKD-satellite; QKD networks; Optical repeaters; Photon particle manipulation
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Migration from existing encryption; Do not bake algorithms into systems yet as they could change; Phased approach implied by NIST guidance
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Assess cryptographic landscape; Build crypto inventories; Strategic risk management priority
- **Source Document**: QuantumFinanceBoardroom-Ganguly-PQC-Ch24-2026.pdf (1,074,703 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:03:15

---

## CSA-CryptoNews-May2026

- **Reference ID**: CSA-CryptoNews-May2026
- **Title**: CSA Crypto News — May 2026
- **Authors**: Cloud Security Alliance (Dhananjoy Dey)
- **Publication Date**: 2026-05-01
- **Last Updated**: 2026-05-05
- **Document Status**: Released
- **Main Topic**: A monthly digest curating 35 news items on post-quantum cryptography developments, including migration frameworks, hardware innovations, and accelerated Q-Day timelines.
- **PQC Algorithms Covered**: ML-KEM, Falcon
- **Quantum Threats Addressed**: Harvest Now Decrypt Later, quantum attacks on wireless medical devices, breaking of asymmetric crypto, physical hacking attempts, power side-channel attacks, voltage glitch attacks
- **Migration Timeline Info**: 2029: Google and Cloudflare targets for full post-quantum security; 2030: Researchers say quantum computers could be ready; 2026: Year mattering for quantum security
- **Applicable Regions / Bodies**: India (PSBs); Bodies: Cloud Security Alliance, NIST, MIT, Cisco, Meta, Solana Foundation, Google, Cloudflare, Yubico, CryptoNext Security, Perpetuals, Lithic, Cryptsoft, Quantum XChange, QSE, PQShield, Microchip, ID Quantique SA
- **Leaders Contributions Mentioned**: Dhananjoy Dey (Compiler); Bruno Huttner (Editorial author, Chair of QSS WG); Clare Scott (Author); Seoyoon Jang (Lead author of MIT chip paper); Saurav Maji (Co-author); Rashmi Agrawal (Visiting scholar); Hyemin Stella Lee (Co-author); Eunseok Lee (Co-author); Giovanni Traverso (Co-author); Anantha Chandrakasan (Senior author); Christian Chisholm (Author); Filippo Valsorda (Cryptologist)
- **PQC Products Mentioned**: MIT microchip (ASIC), Cisco quantum-safe architecture, PQShield, Microchip Post-Quantum-Ready Root of Trust Controllers, Yubico post-quantum security solutions, CryptoNext Security NIST Quantum-Safe Certification, Perpetuals Quantum-Resilience-as-a-Service, Lithic cryptographic proof systems, Cryptsoft hybrid post quantum cryptography authentication token, Quantum XChange Phio TX Management Console, QSE Enterprise Post-Quantum Migration Platform (QPA v2)
- **Protocols Covered**: SSH, TLS/HTTPS, NETCONF, gRPC, MACsec, IPsec, IKEv2, Model Context Protocol Transport
- **Infrastructure Layers**: Management Plane, Control Plane, Data Plane, OSI model layers (Layer 2, Layer 3, Layer 4+), chipset, firmware, root of trust, key management (secret keys)
- **Standardization Bodies**: NIST, IEEE
- **Compliance Frameworks Referenced**: NIST Quantum-Safe Certification
- **Classical Algorithms Referenced**: AES-128, Grover algorithm
- **Key Takeaways**: Transition to quantum-safe must occur before Q-Day to prevent infrastructure breakdown; AES-128 remains safe from Grover's algorithm due to sequential processing constraints; Hybrid key exchange and crypto agility are critical for phased migration without rearchitecting; Resource-constrained devices require specialized hardware solutions like ASICs to implement PQC efficiently; Q-Day timeline is accelerating, potentially arriving by 2029 or 2030
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Key Exchange, hybrid post quantum cryptography authentication, crypto agility, phased rollout, dual PQC schemes for robustness
- **Performance & Size Considerations**: 20x to 60x higher energy efficiency than other PQC techniques; PQC complexity increases power consumption by two or three orders of magnitude; chip size about the size of a very fine needle tip
- **Target Audience**: CISO, Security Architect, Developer, Policy Maker, Operations
- **Implementation Prerequisites**: Cryptographic inventory; PKI upgrade path; hardware upgrades for constrained devices; adoption of hybrid key exchange; crypto agility implementation
- **Relevant PQC Today Features**: Timeline, Threats, Migrate, Algorithms, hybrid-crypto, crypto-agility, iot-ot-pqc, pqc-risk-management, migration-program
- **Implementation Attack Surface**: Power side-channel attacks, voltage glitch attacks, physical hacking attempts, Harvest Now Decrypt Later, quantum-capable forgery
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: On-chip true random number generator
- **Constrained Device & IoT Suitability**: Wireless biomedical devices (pacemakers, insulin pumps), ingestible biosensors, industrial sensors, smart inventory tags, resource-constrained edge devices
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Phased quantum readiness plan; moving from awareness to execution; no overnight transition; hybrid paths to avoid rearchitecting
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Moving from awareness to execution; need for immediate action; CISOs becoming buyers; governance via working groups (QSS WG)
- **Source Document**: CSA-CryptoNews-May2026.pdf (1,635,291 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:07:32

---

## Cisco-Quantum-Safe-Architecture-2026

- **Reference ID**: Cisco-Quantum-Safe-Architecture-2026
- **Title**: From Strategy to Architecture: How Cisco Is Building a Quantum-Safe Future
- **Authors**: Cisco
- **Publication Date**: 2026-04-30
- **Last Updated**: 2026-04-30
- **Document Status**: Released
- **Main Topic**: Cisco outlines its two-pillar quantum-safe architecture strategy, integrating PQC into secure communications across network planes and embedding quantum-resistant trust into hardware, firmware, and the boot process.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, LMS, XMSS
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; Harvest Now, Decrypt Later (HNDL); quantum-capable forgery; attacks on system integrity
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Christian Chisholm (Senior Director, Strategy and Planning, Security and Trust Organization)
- **PQC Products Mentioned**: Cisco Secure Routers; Cisco Smart Switches; Cisco Firewalls; Trust Anchor Module (TAm)
- **Protocols Covered**: SSH; TLS/HTTPS; NETCONF; gRPC; MACsec; IPsec; IKEv2
- **Infrastructure Layers**: PKI; Key Management Systems; Secure Boot; Hardware Root of Trust; Firmware; Chipset
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Diffie-Hellman
- **Key Takeaways**: Protect all three network planes (Management, Control, Data) against quantum risks, not just data in transit; Embed quantum-resistant trust directly into firmware and hardware via secure boot to prevent platform compromise; Use hybrid key exchange combining PQC (e.g., ML-KEM) with classical algorithms for transitional security; Implement multi-stage secure boot using hash-based signatures (LMS/XMSS) for root of trust and ML-DSA for OS verification; Leverage hardware Trust Anchor Modules to securely store PQC keys and attest device identity throughout its lifecycle
- **Security Levels & Parameters**: ML-DSA-87
- **Hybrid & Transition Approaches**: Hybrid Key Exchange (PQC combined with classical Diffie-Hellman); Enhanced Pre-Shared Keys (PPK); Crypto-agility framework
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Network Engineer; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto; crypto-agility; tls-basics; vpn-ssh-pqc; pki-workshop; hsm-pqc; code-signing; vendor-risk; migration-program
- **Implementation Attack Surface**: Compromised device boot sequence; forged signatures in chain of trust; compromised platform integrity
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: Quantum Key Distribution (QKD) platforms mentioned as external key management systems
- **QRNG & Entropy Sources**: Certifiable entropy source for strong key generation provided by Trust Anchor Module
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Security embedded at manufacturing time; vendor PQC roadmap maturity implied by Cisco's internal strategy
- **Deployment & Migration Complexity**: Phased transition supported by crypto-agility; no overnight transition required; integration across communication planes and hardware layers
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Two-pillar response strategy (Secure Communications and Secure Products); internal clarity on quantum readiness framework
- **Source Document**: Cisco-Quantum-Safe-Architecture-2026.html (81,476 bytes, 11,087 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:31:56

---

## PQShield-4-Quantum-Threats-Enterprises-2026

- **Reference ID**: PQShield-4-Quantum-Threats-Enterprises-2026
- **Title**: PQShield: 4 Quantum Threats Enterprises Must Address Now
- **Authors**: PQShield (via Quantum Zeitgeist)
- **Publication Date**: 2026-04-30
- **Last Updated**: 2026-04-30
- **Document Status**: Released
- **Main Topic**: PQShield identifies four immediate quantum threats enterprises must address, including harvest-now-decrypt-later attacks and inadequate crypto-agility, recommending prioritized PQC migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: harvest-now-decrypt-later attacks; vulnerable key exchange in TLS; insecure firmware signing; inadequate crypto-agility
- **Migration Timeline Info**: Experts expect cryptographically relevant quantum computers to emerge within the next 10 to 15 years; transition is a sustained, multi-year process
- **Applicable Regions / Bodies**: Bodies: US National Security Agency; World Economic Forum
- **Leaders Contributions Mentioned**: Dr. Donovan: futurist and technology writer covering the quantum revolution
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; VPNs
- **Infrastructure Layers**: operational technology; critical infrastructure; industrial control systems; automotive platforms; embedded devices; telecommunications networks; cloud infrastructure; Internet of Things devices
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; elliptic curve cryptography
- **Key Takeaways**: Prioritize PQC migration starting with key establishment to mitigate harvest-now-decrypt-later risks; Assess current cryptographic usage and inventory vulnerable systems before remediation; Implement crypto-agility to handle evolving standards and avoid vendor lock-in; Optimize implementations for constrained environments like IoT and industrial control systems to manage performance overhead; Coordinate with supply chain vendors to ensure ecosystem-wide post-quantum readiness
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto-agility; phased rollout; phased approach to full post-quantum security
- **Performance & Size Considerations**: Post-quantum algorithms introduce additional overhead in computation, bandwidth, and storage; larger key and signature sizes increase data transmission volumes and network congestion; marginal delays can have substantial consequences in high-frequency trading and real-time data analytics
- **Target Audience**: CISO; Security Architect; Compliance Officer; Operations
- **Implementation Prerequisites**: cryptographic inventory; assessment of vulnerable systems; coordination between security, IT, engineering, and compliance teams; hardware acceleration; algorithmic optimization
- **Relevant PQC Today Features**: Threats; Migrate; Assess; crypto-agility; vendor-risk; migration-program; pqc-risk-management; iot-ot-pqc
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: identifying vulnerable systems; quantifying the effort required for remediation; assessing current cryptographic usage
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: Internet of Things devices; automotive systems; industrial control networks; devices with limited processing power and memory; highly optimized implementations
- **Supply Chain & Vendor Risk**: cascading effect of cryptographic upgrades; single point of vulnerability within the extended supply chain; prioritizing suppliers who demonstrate a clear commitment to post-quantum security; factoring cryptographic agility into procurement decisions
- **Deployment & Migration Complexity**: substantial undertaking in systems integration; ripple effect across entire IT ecosystems; lengthy equipment lifecycles; comprehensive overhauls rather than simple software patches; phased rollout; multi-year process
- **Financial & Business Impact**: cost of inaction far outweighs the complexities of proactive security measures; substantial investment required for widespread adoption
- **Organizational Readiness**: defined strategy; practical implementation; firm commitment to long-term resilience; meticulous coordination between teams; strategic deployment based on data sensitivity
- **Source Document**: PQShield-4-Quantum-Threats-Enterprises-2026.html (145,405 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:34:21

---

## GopherSecurity-PQC-Agility-MCP-2026

- **Reference ID**: GopherSecurity-PQC-Agility-MCP-2026
- **Title**: Post-Quantum Cryptographic Agility in Model Context Protocol Transport
- **Authors**: Gopher Security
- **Publication Date**: 2026-04-29
- **Last Updated**: 2026-04-29
- **Document Status**: Released
- **Main Topic**: Technical analysis of integrating post-quantum cryptographic agility into Model Context Protocol (MCP) transport layers to protect AI infrastructure against quantum threats.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, Dilithium
- **Quantum Threats Addressed**: Harvest now, decrypt later; Cryptographically relevant quantum computers (CRQCs); Downgrade attacks; Man-in-the-middle interception; Puppet attacks
- **Migration Timeline Info**: NIST Post-Quantum Cryptography standards finalized in 2024; Hypothetical scenario set in 2029
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Edward Zhou: CEO & Co-Founder of Gopher Security, leading the development of Post-Quantum cybersecurity technologies and solutions
- **PQC Products Mentioned**: Gopher Security
- **Protocols Covered**: Model Context Protocol (MCP); TLS (implied via handshake/TLS vulnerabilities context); P2P tunnels
- **Infrastructure Layers**: Transport layer; MCP Proxy; Deep Packet Inspection (DPI); Micro-segmentation
- **Standardization Bodies**: NIST; Cloud Security Alliance (CSA)
- **Compliance Frameworks Referenced**: SOC 2; GDPR
- **Classical Algorithms Referenced**: RSA; ECC
- **Key Takeaways**: Implement hybrid handshakes combining classical algorithms with ML-KEM to mitigate harvest now decrypt later risks; Separate transport layer from encryption primitives to enable cryptographic agility without downtime; Use YAML-based policies to enforce PQC requirements and block legacy cipher connections; Sign audit trails with ML-DSA to ensure long-term integrity and compliance in a post-quantum world; Map all MCP servers and clients to eliminate blind spots in shadow AI tool usage
- **Security Levels & Parameters**: ML-KEM-768; ML-DSA-65
- **Hybrid & Transition Approaches**: Hybrid handshakes; Double wrap (classical RSA/ECC alongside ML-KEM); Rolling updates; Graceful downgrade support
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Compliance Officer; Developer
- **Implementation Prerequisites**: Cryptographic inventory of MCP servers and clients; YAML-based policy configuration; MCP Proxy deployment for DPI; Automated credential rotation
- **Relevant PQC Today Features**: crypto-agility; hybrid-crypto; compliance-strategy; pqc-risk-management; api-security-jwt
- **Implementation Attack Surface**: Downgrade attacks; Man-in-the-middle interception; Puppet attacks; Latency spikes indicating interception
- **Cryptographic Discovery & Inventory**: Mapping every MCP server and client; Identifying shadow AI tools; Crypto-agility scanning
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Rolling updates; Zero downtime migration; Phased rollout via proxy
- **Financial & Business Impact**: Average breach cost is $4.88 million (IBM 2024 Cost of a Data Breach Report)
- **Organizational Readiness**: Automation of credential rotation; Governance via YAML policies; Auditability for SOC 2/GDPR
- **Source Document**: GopherSecurity-PQC-Agility-MCP-Transport-2026.html (149,498 bytes, 12,753 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:36:29

---

## QuantumInsider-Why-2026-Matters-QS

- **Reference ID**: QuantumInsider-Why-2026-Matters-QS
- **Title**: Why 2026 Matters for Quantum Security
- **Authors**: The Quantum Insider
- **Publication Date**: 2026-04-28
- **Last Updated**: 2026-04-28
- **Document Status**: Released
- **Main Topic**: The document analyzes why 2026 is a pivotal year for quantum security, driven by reduced qubit estimates for breaking encryption, finalized NIST standards, and approaching government migration deadlines.
- **PQC Algorithms Covered**: HQC
- **Quantum Threats Addressed**: Harvest now, decrypt later; breaking modern encryption; practical attacks on RSA and elliptic curve cryptography
- **Migration Timeline Info**: NIST guidance suggests phasing out quantum-vulnerable algorithms after 2030 and disallowing them after 2035; NSA CNSA 2.0 requires quantum-safe systems by January 2027; Cloudflare and Google target 2029 for full post-quantum security
- **Applicable Regions / Bodies**: United States; NIST; FBI; CISA; NSA; UK’s National Cyber Security Centre; FS-ISAC
- **Leaders Contributions Mentioned**: Craig Gidney (estimated qubit requirements for RSA-2048 factoring); Martin Ekerå (estimated qubit requirements for RSA-2048 factoring); Luke Preskey (CRO, contact for Year of Quantum Security 2026); Mohib Ur Rehman (author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; iMessage
- **Infrastructure Layers**: TLS certificates; VPNs; firmware; hardware modules; third-party dependencies; PKI (implied via digital certificates)
- **Standardization Bodies**: NIST; NSA
- **Compliance Frameworks Referenced**: NIST IR 8547; CNSA 2.0; Quantum Computing Cybersecurity Preparedness Act
- **Classical Algorithms Referenced**: RSA; RSA-2048; elliptic curve cryptography; secp256k1
- **Key Takeaways**: Organizations must begin cryptographic discovery and inventory immediately to understand exposure; Migration timelines are compressing due to reduced qubit estimates for breaking RSA and ECC; Regulatory deadlines such as NSA's 2027 requirement and NIST's 2030/2035 phases mandate action; Early adoption allows for controlled implementation while delayed action faces resource constraints and tighter timelines; The "harvest now, decrypt later" threat necessitates protecting data with long confidentiality horizons
- **Security Levels & Parameters**: 2048-bit RSA; 256-bit problem (elliptic curve); 105 qubits (Google Willow); 20 million physical qubits (2019 estimate); under 1 million physical qubits (2025 estimate); under 100,000 physical qubits (2026 QLDPC estimate); under 500,000 physical qubits (2026 ECC estimate); 1,200 logical qubits; 1,450 logical qubits; 90 million Toffoli gates; 70 million Toffoli gates
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory; understanding current cryptographic deployments; identifying vulnerable algorithms; planning replacement or updates
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Assess; pqc-risk-management; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Cryptographic discovery and inventory; knowing the extent, location, and use of current cryptography; identifying where vulnerable algorithms are deployed; infrastructure inventory
- **Testing & Validation Methods**: Implementation, testing, and validation (general mention); piloting post-quantum systems
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Supply chain dependencies; vendor capacity; skilled talent constraints; consulting resources constraints; third-party dependencies
- **Deployment & Migration Complexity**: Cryptographic transitions typically take years; legacy systems; embedded infrastructure; phased rollouts; controlled implementation; compressed timelines under external pressure
- **Financial & Business Impact**: Costs and resource constraints expected to increase; increased competition for specialized resources; greater operational risk; contractual and regulatory consequences
- **Organizational Readiness**: Governance prerequisites (implied via regulatory compliance); dedicated crypto team (implied via skilled talent constraints); change management scope (implied via migration complexity); estimated planning horizon (years); maturity assessment (implied via inventory and risk modeling)
- **Source Document**: QuantumInsider-Why-2026-Matters-QS.html (285,625 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:38:35

---

## QuantumInsider-QS-Threats-Solutions-2026

- **Reference ID**: QuantumInsider-QS-Threats-Solutions-2026
- **Title**: Quantum Security: Threats, Solutions, And The Race To Protect Data
- **Authors**: The Quantum Insider
- **Publication Date**: 2026-04-27
- **Last Updated**: 2026-04-27
- **Document Status**: Released
- **Main Topic**: Overview of the quantum security landscape, including threats like harvest-now-decrypt-later, PQC standardization, QKD, and organizational migration strategies.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+, FALCON
- **Quantum Threats Addressed**: Harvest-Now-Decrypt-Later, Shor’s algorithm, Grover’s algorithm, fault-tolerant quantum computer
- **Migration Timeline Info**: Cryptographic transitions historically take 10-20 years; NSA deadlines 2025-2033 with full NSS quantum resistance by 2035; Cloudflare and Google target full migration by 2029; Apple integrated PQC in early 2024
- **Applicable Regions / Bodies**: Regions: United States, China, European Union, South Korea, Japan, Singapore; Bodies: NIST, NSA, CISA, ETSI, Federal Reserve, Vanderbilt’s Institute of National Security
- **Leaders Contributions Mentioned**: Doug Adams (described HNDL situation at Vanderbilt Quantum Forum); Charles Bennett and Gilles Brassard (proposed BB84 protocol in 1984)
- **PQC Products Mentioned**: PQ3 protocol, IonQ hardware, SEALSQ post-quantum semiconductors, BTQ Technologies quantum-resistant blockchain security, PQShield PQC implementations, ID Quantique QKD systems, Toshiba QKD systems, QuantumCTek QKD systems, Microsoft open-source PQC libraries
- **Protocols Covered**: TLS, VPN, HTTPS, BB84, PQ3
- **Infrastructure Layers**: PKI (implied via digital signatures/certificates context), Key Management (implied via key exchange), Cloud KMS (implied via Azure), embedded devices, IoT, automotive applications, blockchain
- **Standardization Bodies**: NIST, ETSI
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, FIPS 206, CNSA 2.0
- **Classical Algorithms Referenced**: RSA, RSA-2048, ECDSA, elliptic curve cryptography, Diffie-Hellman, AES, AES-128, AES-256, SHA-1, SHA-2
- **Key Takeaways**: Organizations must conduct a cryptographic inventory to identify deployed algorithms and data confidentiality requirements; Hybrid approaches combining classical and post-quantum algorithms are recommended during transition; Cryptographic agility should be built into new deployments to facilitate future updates; Harvest-now-decrypt-later attacks create immediate urgency for protecting long-lived sensitive data; Migration planning for large enterprises typically spans 5-10 years
- **Security Levels & Parameters**: RSA-2048, AES-128, AES-256, 1024-bit RSA, 2048-bit RSA, 64-bit key equivalent (for AES-128 under quantum attack), 32-byte ECC key, 1,184 bytes ML-KEM public key
- **Hybrid & Transition Approaches**: Hybrid approaches combining classical and post-quantum algorithms, cryptographic agility
- **Performance & Size Considerations**: ML-KEM public keys approximately 1,184 bytes; ECC key 32 bytes; RSA-2048 breakable in hours by fault-tolerant quantum computer; AES-128 weakened to 64-bit equivalent; Quantum resource estimates for RSA-2048 dropped from 20 million to fewer than 100,000 physical qubits
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Cryptographic inventory; risk assessment; cryptographic agility in new deployments; post-quantum readiness in procurement specifications
- **Relevant PQC Today Features**: Threats, Migrate, Assess, Algorithms, qkd, crypto-agility, migration-program, pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Cryptographic inventory; cataloging cryptography usage across TLS/SSL, VPNs, encrypted databases, digital signatures, authentication systems, and embedded devices
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: BB84; fiber-based QKD; satellite-based QKD; EuroQCI; point-to-point topology; photon loss over distance; no-cloning theorem
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: IoT and automotive applications; embedded systems; constrained devices; semiconductors
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Migration spans 5-10 years; historically 10-20 years for global infrastructure; more complex than SHA-1 to SHA-2 or RSA key size transitions; requires prioritization based on data sensitivity and adversary capability
- **Financial & Business Impact**: Storage costs have fallen making HNDL economically feasible for nation-states; infrastructure cost justification for QKD; no specific breach cost baselines or ROI projections mentioned
- **Organizational Readiness**: Governance prerequisites (NSA mandates, NIST guidance); dedicated planning horizon (5-10 years for enterprises); risk assessment based on data confidentiality lifetime; cryptographic agility as a readiness factor
- **Source Document**: QuantumInsider-QS-Threats-Solutions-2026.html (291,257 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:41:18

---

## Microchip-TS1800-PQC-RootOfTrust-2026

- **Reference ID**: Microchip-TS1800-PQC-RootOfTrust-2026
- **Title**: Microchip Expands Family of Post-Quantum-Ready Root of Trust Controllers
- **Authors**: Microchip Technology (via Embedded Computing Design)
- **Publication Date**: 2026-01-01
- **Last Updated**: 2026-01-01
- **Document Status**: Released
- **Main Topic**: Microchip Technology announces the TS1800 and TS50x post-quantum-ready root-of-trust controller family with hardware-embedded PQC for IoT, automotive, and embedded systems.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: TS1800; TS50x
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Root of Trust
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Microchip has expanded its root-of-trust controller family with TS1800 and TS50x models; These controllers feature hardware-embedded PQC at the silicon level; The devices support ML-KEM and ML-DSA algorithms; The solution enables true crypto-agility in constrained devices; Target applications include IoT, automotive, and embedded systems
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Operations
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: iot-ot-pqc; crypto-agility; Algorithms
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: IoT; automotive; embedded systems; constrained devices
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: Microchip-TS1800-PQC-RootOfTrust-2026.html (22,096 bytes, 1,551 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:44:35

---

## ITPro-Monetizing-Quantum-Shift-PQC-2026

- **Reference ID**: ITPro-Monetizing-Quantum-Shift-PQC-2026
- **Title**: Monetizing the Quantum Shift: 11 PQC Channel Opportunities
- **Authors**: ITPro / Cloud Security Alliance
- **Publication Date**: 2026-04-28
- **Last Updated**: 2026-04-28
- **Document Status**: Released
- **Main Topic**: Analysis of 11 business channel opportunities for technology vendors and MSSPs emerging from the post-quantum cryptography migration wave.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now, Decrypt Later (HNDL) attacks; quantum machines breaking encryption
- **Migration Timeline Info**: NIST mandates deprecation of current algorithms by 2030 to 2035; quantum machines capable of breaking encryption within the next decade
- **Applicable Regions / Bodies**: Regions: UK; Bodies: NCSC, NIST
- **Leaders Contributions Mentioned**: Todd Beldham: Founder and CTO at Unsung Limited, specializing in PKI and cryptographic security, leading a team of specialist consultants on PKI strategy and PQC readiness
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; VPN; SAML; OIDC; OAuth; mTLS
- **Infrastructure Layers**: PKI; Key Management; HSM; Cloud KMS; Crypto-service gateways; Certificate authorities; OCSP; Identity gateways; Load balancers; API gateways; Web proxies; Email security; Storage encryption; Database TDE; Backup and archiving
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: ISO 27001; Cyber Essentials Plus; Digital Outcomes and Specialists 7; Cyber Security Services 3
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Channel partners should position themselves as sovereign risk advisers to help clients navigate the complex cryptographic transition; Organizations must conduct deep-dive crypto inventories and key lifecycle mapping to identify vulnerable spots before regulatory mandates; Hybrid classical plus PQC schemes should be implemented to enable transition without breaking existing applications; Partners should capitalize on initiatives like the NCSC’s PQC pilot to build comprehensive migration plans across the entire estate; Adversaries are actively executing Harvest Now, Decrypt Later attacks, making immediate action necessary for regulated clients
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid classical plus PQC schemes; Hybrid TLS; Hybrid and PQC models for IAM/SSO; Crypto-agility; Composite certificates (implied by "hybrid and PQC for internal PKI")
- **Performance & Size Considerations**: None detected
- **Target Audience**: Channel Partners; MSPs; VARs; Resellers; CISOs; Security Architects
- **Implementation Prerequisites**: Crypto inventories; Key lifecycle mapping; PQC risk assessments; Understanding of existing cryptographic implementations; Partnership with specialist firms; Investment in domain understanding
- **Relevant PQC Today Features**: pqc-business-case; pqc-risk-management; migration-program; crypto-agility; hsm-pqc; pki-workshop; kms-pqc; compliance-strategy; vendor-risk
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Crypto inventories; Key lifecycle mapping; Algorithm enumeration (implied by "what algorithms are in use"); Certificate inventory (implied by PKI modernization)
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: IoT (mentioned in context of PKI and code signing)
- **Supply Chain & Vendor Risk**: Third-party vendors (mentioned in context of migration plans); Vendor solutions (mentioned as requirement for partners)
- **Deployment & Migration Complexity**: Multi-year journey; Phased transition (assess, roadmap, execute); Breaking existing systems (risk to be avoided); Backward compatibility (maintaining existing applications)
- **Financial & Business Impact**: Revenue opportunities for channel partners; Market demand driven by board-level pressure; Compliance timelines accelerating buying decisions
- **Organizational Readiness**: Lack of centralized inventory; Patchwork of cryptographic implementations; Limited documentation; Need for board-level PQC transition plans; Willingness to invest in understanding the domain
- **Source Document**: ITPro-Monetizing-Quantum-Shift-PQC-2026.html (881,553 bytes, 11,270 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:45:47

---

## QCReport-QDay-Accelerated-Timeline-2026

- **Reference ID**: QCReport-QDay-Accelerated-Timeline-2026
- **Title**: Q-Day: Accelerated Timeline Across Wider Attack Surface — Executive Summary
- **Authors**: Quantum Computing Report
- **Publication Date**: 2026-04-25
- **Last Updated**: 2026-04-25
- **Document Status**: Released
- **Main Topic**: Executive summary of a report assessing the accelerated timeline for Q-Day, highlighting that ECC-256 is vulnerable earlier than RSA-2048 due to algorithmic and architectural advances.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Q-Day; offline/retrospective attacks
- **Migration Timeline Info**: GQI assesses the timeline for ECC-256 Q-day for offline/retrospective attacks to be most likely 2032 with a reasonable worst case of just 3 years from today; many leading nation-states have set in motion plans for a transition to quantum safe alternatives by 2035
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dr. David Shaw (GQI’s Chief Analyst, wrote the 44 page report)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Internet and corporate VPN cybersecurity protocols
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-2048; ECC-256
- **Key Takeaways**: Organizations should urgently focus on plans for transition to post quantum cryptography; adopt crypto agile solutions; users with sensitive security needs should consider additional high assurance comms solutions as a complementary layer of security; investors and end-users should reassess roadmaps and portfolio plans due to the potential for modest gigaquop systems to establish momentum
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agile solutions; additional high assurance comms solutions as a complementary layer of security
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Policy Maker; Investor; Developer; End-user
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; crypto-agility; pqc-risk-management; pqc-business-case
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Capacity to manage the additional complexity; transition to post quantum cryptography
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: QCReport-QDay-Accelerated-Timeline-2026.html (120,630 bytes, 5,578 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:48:15

---

## ArsTechnica-Ransomware-Quantum-Safe-2026

- **Reference ID**: ArsTechnica-Ransomware-Quantum-Safe-2026
- **Title**: In a First, a Ransomware Family Is Confirmed to Be Quantum-Safe
- **Authors**: Ars Technica
- **Publication Date**: 2026-04-23
- **Last Updated**: 2026-04-23
- **Document Status**: Released
- **Main Topic**: Ars Technica reports on the Kyber ransomware family, the first confirmed to use post-quantum cryptography (ML-KEM) for key encapsulation, primarily as a marketing tactic to intimidate victims rather than for practical security benefits.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Shor’s algorithm; quantum computers breaking RSA and ECC
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Dan Goodin (Senior Security Editor, author); Brett Callow (managing director at FTI Consulting, confirmed first case of ransomware using PQC); Anna Širokova (Rapid7 senior security researcher, reverse-engineered Kyber, analyzed marketing motives)
- **PQC Products Mentioned**: Kyber ransomware; Kyber1024 libraries; Rust libraries for Kyber1024
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve (ECC); AES-256; AES-128
- **Key Takeaways**: Ransomware actors are adopting PQC primarily for psychological marketing to intimidate non-technical decision-makers into paying ransoms; Implementing PQC in ransomware requires relatively little effort due to available, well-documented libraries; The use of PQC in ransomware does not provide practical security benefits against current decryption methods, as quantum computers capable of breaking classical crypto are years away; Incident response teams must recognize that PQC usage in ransomware complicates traditional key recovery even with access to command-and-control infrastructure
- **Security Levels & Parameters**: ML-KEM1024; 4096-bit RSA keys
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Incident Response Professional
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; pqc-risk-management; pqc-business-case
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Reverse-engineering
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: ArsTechnica-Ransomware-Quantum-Safe-2026.html (151,743 bytes, 6,633 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:49:50

---

## QuantumInsider-AES128-Safe-Quantum-2026

- **Reference ID**: QuantumInsider-AES128-Safe-Quantum-2026
- **Title**: Cryptologist Finds AES-128 Likely Safe from Quantum Attack
- **Authors**: The Quantum Insider
- **Publication Date**: 2026-04-21
- **Last Updated**: 2026-04-21
- **Document Status**: Released
- **Main Topic**: Analysis of research concluding that AES-128 remains secure against quantum attacks due to practical resource constraints on Grover's algorithm, suggesting symmetric encryption does not require immediate migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Grover's algorithm; Shor's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: National Institute of Standards and Technology (NIST); Germany’s Federal Office for Information Security
- **Leaders Contributions Mentioned**: Filippo Valsorda: Cryptography researcher who published a blog post analyzing the practical limits of Grover's algorithm on AES-128; Matt Swayne: Author of the Insider Brief article summarizing the research
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Germany’s Federal Office for Information Security
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-128; RSA; elliptic-curve cryptography
- **Key Takeaways**: Focus post-quantum migration efforts on public-key cryptography rather than symmetric encryption; AES-128 remains secure against quantum attacks due to high resource requirements for Grover's algorithm; Updating symmetric key sizes is unnecessary and may introduce compatibility issues; Quantum risk to public-key systems is nearer-term than risk to symmetric encryption
- **Security Levels & Parameters**: 128-bit symmetric keys; 2⁶⁴ operations (theoretical Grover speedup); 2⁴⁷ parallel quantum systems (estimated requirement); 2¹⁰⁴.⁵ total operations (estimated cost)
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 2⁴⁷ parallel quantum systems required for attack; 2¹⁰⁴.⁵ total computational cost; 2⁷⁸.⁵ factor more expensive than breaking elliptic-curve cryptography
- **Target Audience**: Security Architect; CISO; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; Migrate; pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Compatibility issues; fragmentation of standards; interoperability complications
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: QuantumInsider-AES128-Safe-Quantum-2026.html (272,972 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:51:27

---

## QuantumZeitgeist-CryptoNext-NIST-Cert-2026

- **Reference ID**: QuantumZeitgeist-CryptoNext-NIST-Cert-2026
- **Title**: CryptoNext Security First in EU With Full NIST Quantum-Safe Certification
- **Authors**: Quantum Zeitgeist / CryptoNext Security
- **Publication Date**: 2026-04-14
- **Last Updated**: 2026-04-14
- **Document Status**: Released
- **Main Topic**: CryptoNext Security becomes the first EU company to achieve full NIST quantum-safe certification for ML-KEM, ML-DSA, and SLH-DSA implementations integrated into ProvenRun’s ProvenHSM.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium, Falcon
- **Quantum Threats Addressed**: future quantum computer attacks; quantum-enabled attacks
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: European Union; Bodies: NIST
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: C-Pqc library; ProvenHSM
- **Protocols Covered**: None detected
- **Infrastructure Layers**: hardware security module; HSM
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST Quantum-Safe certification; FIPS compliance; NIST CAVP Certification
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CryptoNext Security is the first EU company with full NIST quantum-safe certification for ML-KEM, ML-DSA, and SLH-DSA; The certified algorithms are integrated into ProvenRun’s ProvenHSM to create a crypto-agile hardware security module; The certification validates both algorithm correctness and their integration into physical hardware; This solution aims to protect critical infrastructure against future quantum computing threats; Organizations can use this certified module to upgrade security infrastructure before widespread quantum capabilities emerge
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: crypto-agile system; crypto-agile solution
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; CISO; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hsm-pqc; compliance; crypto-agility; Algorithms
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: NIST CAVP Certification; testing by NIST for correctness and security
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: QuantumZeitgeist-CryptoNext-NIST-Cert-2026.html (137,436 bytes, 9,481 extracted chars)
- **Extraction Timestamp**: 2026-05-07T23:53:18

---
