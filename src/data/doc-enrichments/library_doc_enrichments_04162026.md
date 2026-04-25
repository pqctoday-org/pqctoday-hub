---
generated: 2026-04-16
collection: library
documents_processed: 415
enrichment_method: ollama-qwen3.5:27b
---

## BSI TR-02102-1

- **Reference ID**: BSI TR-02102-1
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
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
- **Extraction Note**: No source text available
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: BSI_TR-02102.pdf (56,314 bytes, no text extracted)
- **Extraction Timestamp**: 2026-04-16T16:08:06

---

## arXiv-2603-01091-HNDL-Rekeying

- **Reference ID**: arXiv-2603-01091-HNDL-Rekeying
- **Title**: Quantifying Harvest-Now-Decrypt-Later Threats: An Empirical Analysis of Rekeying Defences
- **Authors**: perlab-uc3m; Universidad Carlos III de Madrid
- **Publication Date**: 2025-03-03
- **Last Updated**: 2025-03-03
- **Document Status**: Preprint
- **Main Topic**: Empirical analysis of harvest-now-decrypt-later attack economics across TLS 1.2, TLS 1.3, QUIC, and SSH to quantify adversarial storage costs and evaluate rekeying defenses.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest-now decrypt-later; Cryptographically Relevant Quantum Computer; Shor's algorithm
- **Migration Timeline Info**: NIST finalized first three PQC standards in August 2024; Microsoft targets full ecosystem transition by 2033; Q-Day estimated in 2030–2040 window with 50% probability of breaking RSA-2048 within 15 years
- **Applicable Regions / Bodies**: United States; Europe; Bodies: NIST, NSA, ANSSI, BSI, NLNCSA, ETSI, IETF
- **Leaders Contributions Mentioned**: Javier Blanco-Romero; Florina Almenares Mendoza; Carlos García Rubio; Celeste Campo; Daniel Díaz Sánchez; Mosca; Piani; Kagai; Cremers; Dowling; Danezis; Wittneben
- **PQC Products Mentioned**: hndl-dev simulator
- **Protocols Covered**: TLS 1.2; TLS 1.3; QUIC; SSH; iMessage PQ3 protocol
- **Infrastructure Layers**: Backbone fiber taps; Internet Service Provider cooperation; Data-center presence; Cloud archive pricing; Load Balancers
- **Standardization Bodies**: NIST; IETF; ETSI
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: RSA; ECC; DH; DHE; ECDHE; AES; chacha20-poly1305
- **Key Takeaways**: Retaining intercepted traffic is economically trivial, shifting defense focus to increasing decryption costs; Aggressive rekeying and larger key exchange parameters multiply quantum computations required by adversaries; Encrypted Client Hello forces indiscriminate bulk collection to inflate adversary storage archives; TLS 1.3 and QUIC lack in-band ephemeral rekeying, creating a critical protocol gap for defense-in-depth
- **Security Levels & Parameters**: RSA-2048; Level 3 messaging security (Apple PQ3); NIST L1-L5 not explicitly detailed beyond standard names
- **Hybrid & Transition Approaches**: Hybrid key exchange; Hybrid post-quantum Transport Layer Security
- **Performance & Size Considerations**: Petabyte-scale archival costs collapsed by roughly 95% since 2010; 68 exabytes of global data traffic in 2024; Negligible bandwidth overhead for SSH rekeying
- **Target Audience**: Security Architect; Researcher; Policy Maker; CISO
- **Implementation Prerequisites**: Open-source simulation pipeline hndl-dev; Encrypted Client Hello support; SSH RekeyLimit configuration; Larger key exchange parameters
- **Relevant PQC Today Features**: Threats, Migrate, Assess, tls-basics, vpn-ssh-pqc, pqc-risk-management, hybrid-crypto, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: open-source simulation pipeline, formal verification of hybrid protocol transitions, computational proof in the multi-stage key exchange model, symbolic analysis
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: hybrid key exchange in production, migration timelines, full ecosystem transition by 2033, defense in depth with current infrastructure, absence of in-band ephemeral rekeying in TLS 1.3 and QUIC, IETF standardizing in-band rekeying for TLS 1.3 and QUIC
- **Financial & Business Impact**: storage costs collapsed by roughly 95% since 2010, adversary data retention costs, state intelligence budgets, per-session storage accounting, quantum computational cost metric
- **Organizational Readiness**: None detected
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: arXiv-2603-01091-HNDL-Rekeying.html (318,007 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-16T16:08:39

---
