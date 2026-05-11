---
generated: 2026-03-05
collection: timeline
documents_processed: 9
enrichment_method: ollama-qwen3.5:27b
---

## Canada:ISED — PQC Best Practices Published

- **Reference ID**: Canada:ISED — PQC Best Practices Published
- **Title**: PQC Best Practices Published
- **Authors**: Innovation, Science and Economic Development Canada
- **Publication Date**: 2023-06-12
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: Canadian National Quantum-Readiness Best Practices and Guidelines providing a framework for organizations to assess quantum risks and prioritize PQC migration.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Breakdown of public-key cryptography by fault-tolerant quantum computers; weakening of symmetric key cryptography; risks to personal information, financial systems, utility grids, infrastructure, and national security.
- **Migration Timeline Info**: NIST on-track to publish first set of PQC standards in 2024; transition expected over many years; planning required now as changes are still years away.
- **Applicable Regions / Bodies**: Regions: Canada; Bodies: Innovation, Science and Economic Development Canada (ISED), Canadian Forum for Digital Infrastructure Resilience (CFDIR), Quantum-Readiness Working Group (QRWG), Bank of Canada, U.S. National Institute of Standards and Technology (NIST).
- **Leaders Contributions Mentioned**: Hisham El-Bihbety (CISO – Bank of Canada) introduced the document; Michele Mosca cited regarding cybersecurity in an era with quantum computers.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Secure Socket Layer (SSL), Transport Layer Security (TLS), Kerberos, sFTP.
- **Infrastructure Layers**: PKI/CAs, Key Management (key transport, key-wrapping, initialization vectors), Authentication processes, Digital signatures.
- **Standardization Bodies**: U.S. National Institute of Standards and Technology (NIST).
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must migrate systems to quantum-safe cryptography before large-scale quantum computers are built; Critical Infrastructure owners should plan an orderly transition over the next few years; Hybrid cryptography standards and technology are included as new content; Third-party vendors should be assessed using PQC roadmap questions; Cryptographic agility is essential for future migration.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid cryptography standards and technology; cryptographic-agility; composite certificates (implied via Annex H title "Overview of Hybrid Cryptography").
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO, Security Architect, Compliance Officer, Policy Maker, Operations, Researcher.
- **Implementation Prerequisites**: Inventory of cryptography use cases; engagement with QSC vendors or third parties; assessment of quantum risks; development of PQC roadmap questions for ICT vendors.
- **Relevant PQC Today Features**: Threats, Migrate, Assess, hybrid-crypto, crypto-agility, vendor-risk, pqc-governance, migration-program, pqc-business-case

---

## United Kingdom:NCSC — PQC White Paper Updated

- **Reference ID**: United Kingdom:NCSC — PQC White Paper Updated
- **Title**: PQC White Paper Updated
- **Authors**: National Cyber Security Centre
- **Publication Date**: 2024-08-01
- **Last Updated**: Not specified
- **Document Status**: Validated
- **Main Topic**: NCSC updates its PQC White Paper to endorse NIST quantum-safe algorithms, becoming the first major jurisdiction to reflect these standards.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: NCSC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NCSC has updated its PQC White Paper; The update endorses NIST quantum-safe algorithms; NCSC is the first major jurisdiction to reflect NIST algorithms in this context
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Compliance, Leaders
- **Extraction Note**: No source text available

---

## Global:Ethereum Foundation — Vitalik Buterin Publishes PQ Defense Roadmap

- **Reference ID**: Global:Ethereum Foundation — Vitalik Buterin Publishes PQ Defense Roadmap
- **Title**: Vitalik Buterin Publishes PQ Defense Roadmap
- **Authors**: Ethereum Foundation
- **Publication Date**: 2026-02-26
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Vitalik Buterin outlines a roadmap to protect Ethereum from quantum computing threats by addressing vulnerabilities in consensus, data availability, accounts, and zero-knowledge proofs.
- **PQC Algorithms Covered**: hash-based signatures, Winternitz, STARK aggregation
- **Quantum Threats Addressed**: long-term risks posed by quantum computers; breaking digital signatures and cryptographic systems
- **Migration Timeline Info**: Targets Hegota upgrade H2 2026
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Vitalik Buterin outlined a roadmap to protect the blockchain from quantum threats; Margaux Nijkerk reported on the roadmap; Nikhilesh De edited the article; Davide Crapis sees the network acting as a coordination and verification layer in an AI-mediated world
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EIP-8141, BLS, KZG commitments
- **Infrastructure Layers**: validator signatures, data availability system, wallet signatures, zero-knowledge proofs, validation frames
- **Standardization Bodies**: Ethereum Foundation
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: BLS, ECDSA, KZG commitments
- **Key Takeaways**: Ethereum must transition from BLS to hash-based signatures for validator consensus; EIP-8141 enables native account abstraction to support quantum-safe signature schemes; KZG commitments require significant engineering work to replace with quantum-safe alternatives; validation frames can bundle multiple proofs into a single compressed proof to reduce verification costs
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: EIP-8141 allows accounts to switch to different types of signatures in the future; validation frames allow bundling many signatures and proofs into a single combined proof
- **Performance & Size Considerations**: quantum-safe zero-knowledge proofs are currently far more expensive to verify on Ethereum
- **Target Audience**: Developer, Security Architect, Researcher, Policy Maker
- **Implementation Prerequisites**: significant behind-the-scenes engineering work required for KZG replacement; adoption of EIP-8141 for account flexibility
- **Relevant PQC Today Features**: Timeline, Threats, Algorithms, Leaders, digital-assets, crypto-agility

---

## United States:Google — Google Cloud ML-KEM Default and Chrome MTC Program

- **Reference ID**: United States:Google — Google Cloud ML-KEM Default and Chrome MTC Program
- **Title**: Google Cloud ML-KEM Default and Chrome MTC Program
- **Authors**: Google LLC
- **Publication Date**: 2026-02-06
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Google announces default ML-KEM deployment in Cloud and a Chrome Merkle Tree Certificates program with Cloudflare to replace X.509 chains, alongside policy recommendations for the quantum era.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); store now, decrypt later attacks; breaking public-key cryptosystems
- **Migration Timeline Info**: Chrome Quantum-resistant Root Store (CQRS) planned Q3 2027; Google preparing for post-quantum world since 2016; NIST standards announced in 2024
- **Applicable Regions / Bodies**: Bodies: National Institute Standards & Technology (NIST); Google; Cloudflare
- **Leaders Contributions Mentioned**: Kent Walker, President of Global Affairs, Google & Alphabet; Hartmut Neven, Founder and Lead, Google Quantum AI
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; HTTPS
- **Infrastructure Layers**: Certificate authorities; Cloud network encryption; global networks
- **Standardization Bodies**: National Institute Standards & Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; 2048-bit RSA
- **Key Takeaways**: Google is deploying ML-KEM by default for all Cloud network encryption; Chrome and Cloudflare are launching a Merkle Tree Certificates program to replace X.509 chains with compact Merkle proofs; Policymakers should promote cloud-first modernization to leverage provider PQC capabilities; Governments must drive society-wide momentum for critical infrastructure sectors like energy and healthcare; Ongoing dialogue with experts is essential as CRQC arrival timelines are uncertain
- **Security Levels & Parameters**: 2048-bit RSA
- **Hybrid & Transition Approaches**: Crypto agility; replacing X.509 chains with compact Merkle proofs; migrating legacy systems to the cloud
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; CISO; Security Architect; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: merkle-tree-certs, crypto-agility, tls-basics, pki-workshop, migration-program

---

## Germany:BSI — Hybrid TLS Required for Classified Communications

- **Reference ID**: Germany:BSI — Hybrid TLS Required for Classified Communications
- **Title**: Hybrid TLS Required for Classified Communications
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-31
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: BSI TR-02102-2 mandates hybrid TLS combining classical and PQC algorithms for classified communications by 2025.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Classified communications require hybrid TLS by 2025; non-classified systems should adopt as soon as practical.
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: BSI
- **Compliance Frameworks Referenced**: BSI TR-02102-2
- **Classical Algorithms Referenced**: ECDH
- **Key Takeaways**: Classified communications must use hybrid TLS by 2025; Non-classified systems should adopt hybrid TLS as soon as practical; Hybrid TLS must combine classical ECDH and PQC ML-KEM.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid TLS combining classical and PQC
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Compliance; hybrid-crypto; tls-basics; migration-program
- **Extraction Note**: No source text available

---

## Germany:BSI — Hybrid IPsec and SSH Required

- **Reference ID**: Germany:BSI — Hybrid IPsec and SSH Required
- **Title**: Hybrid IPsec and SSH Required
- **Authors**: Bundesamt für Sicherheit in der Informationstechnik
- **Publication Date**: 2025-01-31
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: BSI TR-02102-3 and TR-02102-4 mandate hybrid IPsec and SSH with ML-KEM for sensitive communications by 2026.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: By 2026: hybrid IPsec and hybrid SSH required for sensitive communications
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IPsec, IKEv2, SSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: BSI TR-02102-3, BSI TR-02102-4
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must implement hybrid IPsec with ML-KEM by 2026; Sensitive communications require hybrid SSH with ML-KEM; Alignment with IETF ipsecme and curdle working group drafts is necessary; BSI TR-02102-3 and TR-02102-4 set the mandate for these protocols
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: hybrid IPsec, hybrid SSH
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: vpn-ssh-pqc, compliance, timeline, algorithms, hybrid-crypto
- **Extraction Note**: No source text available

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
- **Extraction Note**: No source text available

---

## European Union:EC — Cryptographic Inventory Mandate

- **Reference ID**: European Union:EC — Cryptographic Inventory Mandate
- **Title**: Cryptographic Inventory Mandate
- **Authors**: European Commission
- **Publication Date**: 2024-04-11
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: EU PQC Recommendation mandates a comprehensive cryptographic asset inventory by end of 2025 for EU public sector entities and operators of essential services.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: End of 2025: Complete comprehensive cryptographic asset inventory as first phase of coordinated PQC transition roadmap
- **Applicable Regions / Bodies**: Regions: EU; Bodies: European Commission, Directorate-General for Communications Networks, Content and Technology
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: EU PQC Recommendation (April 2024)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EU public sector entities must complete a cryptographic asset inventory by end of 2025; Operators of essential services are required to participate in the coordinated PQC transition roadmap; The inventory serves as the first phase of the transition process
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Coordinated PQC transition roadmap
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Policy Maker, Security Architect
- **Implementation Prerequisites**: Comprehensive cryptographic asset inventory
- **Relevant PQC Today Features**: Timeline, Compliance, Migrate, Assess, pqc-governance

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
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, NSA
- **Leaders Contributions Mentioned**: David Cooper (NIST), Daniel Apon (NIST), Quynh Dang (NIST), Michael Davidson (NIST), Morris Dworkin (NIST), Carl Miller (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: NIST has published SP 800-208 standardizing LMS and XMSS; Both algorithms are mandated by NSA CNSA 2.0; The recommendation covers stateful hash-based signature schemes including multi-tree variants; This is the first NIST PQC-adjacent standard
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: stateful-signatures, algorithms, compliance, leaders, merkle-tree-certs

---
