---
generated: 2026-04-23
collection: library
documents_processed: 1
enrichment_method: ollama-qwen3.5:27b
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
- **Implementation Attack Surface**: side-channel vulnerabilities, bugs in implementations
- **Cryptographic Discovery & Inventory**: Crypto Visibility service, automated discovery of cryptographic primitives, developer reporting, mapping cryptography usage across the organization
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: applications with public keys baked into hardware, long lifespans of deployed applications
- **Supply Chain & Vendor Risk**: external dependencies on HSM and CPU vendors, third-party library trust (LibOQS), open-source vs proprietary (Open Quantum Safe consortium)
- **Deployment & Migration Complexity**: PQC Migration Levels (PQ-Unaware, PQ-Aware, PQ-Ready, PQ-Hardened, PQ-Enabled), phased rollout over a multi-year process, prioritization of high/medium/low risk applications, external dependencies blocking migration
- **Financial & Business Impact**: cost efficiency principle, avoiding unnecessary expenditure, balancing investment with risk mitigation
- **Organizational Readiness**: PQC Migration Levels maturity assessment, dedicated crypto team (Meta cryptographers), governance via prioritization criteria and cryptographic inventory
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: Meta-PQC-Migration-2026.html (126,436 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-23T08:49:45

---
