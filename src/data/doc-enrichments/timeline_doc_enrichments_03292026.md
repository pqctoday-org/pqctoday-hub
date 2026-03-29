---
generated: 2026-03-29
collection: timeline
documents_processed: 1
enrichment_method: manual-claude
---

## United States:Google — Google PQC Migration 2029 Timeline

- **Reference ID**: United States:Google — Google PQC Migration 2029 Timeline
- **Title**: Quantum frontiers may be closer than they appear
- **Authors**: Heather Adkins (VP, Security Engineering); Sophie Schmieg (Senior Staff Cryptography Engineer)
- **Publication Date**: 2026-03-25
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Google announces an ambitious 2029 target for complete PQC migration across all products and services, adjusting its threat model to prioritize authentication and digital signature protection alongside encryption.
- **PQC Algorithms Covered**: ML-DSA (FIPS 204); ML-KEM (FIPS 203)
- **Quantum Threats Addressed**: Store-now-decrypt-later (SNDL/HNDL) attacks; Cryptographically Relevant Quantum Computer (CRQC); quantum factoring
- **Migration Timeline Info**: 2029 target for full PQC migration; authentication services prioritized; builds on February 2026 Cloud ML-KEM and Chrome MTC deployments
- **Applicable Regions / Bodies**: Regions: United States (Google global); Bodies: NIST
- **Leaders Contributions Mentioned**: Heather Adkins (VP Security Engineering, Google); Sophie Schmieg (Senior Staff Cryptography Engineer, Google)
- **PQC Products Mentioned**: Google Chrome (PQC support); Google Cloud (ML-KEM network encryption); Android 17 (ML-DSA digital signatures); Chrome Merkle Tree Certificates (MTC) program
- **Protocols Covered**: TLS (implicit via Chrome and Cloud PQC); digital signatures (ML-DSA)
- **Infrastructure Layers**: Mobile OS (Android 17); Web browser (Chrome); Cloud infrastructure (Google Cloud); Authentication services
- **Standardization Bodies**: NIST (FIPS 203, FIPS 204)
- **Compliance Frameworks Referenced**: NIST PQC standards (FIPS 203 ML-KEM, FIPS 204 ML-DSA)
- **Classical Algorithms Referenced**: RSA (implicit, being replaced); ECDSA (implicit, being replaced); X.509 certificate chains (being supplemented by MTC)
- **Key Takeaways**: Google sets the most aggressive PQC migration deadline among major tech companies at 2029; Threat model adjustment prioritizes authentication and digital signatures alongside encryption; Android 17 is the first mobile OS to integrate ML-DSA for PQC digital signature protection; Store-now-decrypt-later attacks make encryption migration urgent today while digital signature migration must complete before CRQC arrival; Google recommends other engineering teams adjust their threat models to prioritize authentication services
- **Security Levels & Parameters**: NIST security levels implied via ML-DSA and ML-KEM standard parameter sets
- **Hybrid & Transition Approaches**: Phased migration building on existing Chrome PQC and Cloud ML-KEM deployments; hybrid classical+PQC period implied through 2029
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; CTO; CISO; Policy Maker
- **Implementation Prerequisites**: NIST FIPS 203 and FIPS 204 compliant implementations; Chrome PQC support; Cloud ML-KEM infrastructure; Android platform integration
- **Relevant PQC Today Features**: migration-program; pqc-risk-management; quantum-threats; hybrid-crypto; code-signing
- **Phase Classification Rationale**: This is a formal migration phase announcement spanning 2026-2029, building on prior research and POC deployments (Chrome PQC, Cloud ML-KEM) and setting a concrete completion target.
- **Regulatory Mandate Level**: Voluntary (industry self-imposed)
- **Sector / Industry Applicability**: Technology; All Sectors (Google infrastructure underpins global internet services)
- **Migration Urgency & Priority**: Near-Term (1-3yr, active planning required)
- **Phase Transition Narrative**: Moves from deployment of individual PQC components (Chrome KEM, Cloud ML-KEM, MTC) to a comprehensive migration program with a 2029 completion target covering all products and services including authentication.
- **Historical Significance**: First major tech company to announce a concrete sub-5-year PQC migration completion date (2029). Signals a significant shift in industry urgency driven by advances in quantum computing hardware, error correction, and factoring resource estimates.
- **Implementation Timeline Dates**: 2026: Android 17 ML-DSA integration; 2026-02: Cloud ML-KEM default and Chrome MTC program; 2029: Full PQC migration target
- **Successor Events & Dependencies**: Builds on February 2026 Google Cloud ML-KEM and Chrome MTC announcements; Requires continued NIST standardization progress; May drive industry-wide acceleration of PQC timelines; Chrome Quantum-resistant Root Store (CQRS) planned Q3 2027.

---
