---
generated: 2026-03-30
collection: csc_050
documents_processed: 10
enrichment_method: ollama-qwen3.5:27b
---

## Ericsson Quantum-Safe 5G

- **Category**: 5G & Telecom Security
- **Product Name**: Ericsson Quantum-Safe 5G
- **Product Brief**: Research evaluation of replacing conventional cryptographic algorithms with post-quantum alternatives in the 5G Core.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: Experimental simulation environment evaluating PQC integration in 5G Core registration/deregistration. Uses hybrid schemes combining conventional and PQC algorithms. Tested KEMs: BIKE, FrodoKEM. Tested Signatures: ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon (FN-DSA). Also evaluated secp256r1 and RSA for comparison.
- **PQC Migration Priority**: High
- **Crypto Primitives**: BIKE, FrodoKEM, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon (FN-DSA), secp256r1, RSA, TLS
- **Key Management Model**: Hybrid schemes combining conventional and post-quantum algorithms; PKI-based framework for dynamic authentication.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, microservice-oriented core architecture (5GC) with virtualized network functions (VNFs).
- **Infrastructure Layer**: Network
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-12-23
- **FIPS Validated**: No
- **Primary Platforms**: 5G Core (5GC), Virtualized Network Functions (VNFs)
- **Target Industries**: Telecom, Service Providers
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Evaluation of NIST standardization process algorithms; adoption of hybrid schemes promoted by standardization bodies; transition expected within coming years.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon (FN-DSA), RSA, secp256r1
- **Authoritative Source URL**: arXiv:2512.20243v1

---

## Nokia Quantum-Safe Networks

- **Category**: 5G & Telecom Security
- **Product Name**: Nokia Quantum-Safe Networks
- **Product Brief**: A network security solution area by Nokia designed to protect networks against quantum threats.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document mentions "Quantum-safe networks" as a solution area and discusses harnessing quantum technologies for security. It references a blog titled "Get ahead of the quantum threat with a quantum-safe network strategy" and news about rising cryptographic demands, but does not state specific algorithms, production status, or implementation details.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Network
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Telecommunication providers, Mission-critical enterprises, AI and cloud providers, Defense, Energy, Public sector
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Mentions a "quantum-safe network strategy" and preparing for rising cryptographic demands; no specific algorithm choices or timelines provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Samsung Networks 5G Core

- **Category**: 5G & Telecom Security
- **Product Name**: Samsung 5G Core
- **Product Brief**: Cloud-native, 3GPP-compliant 5G core network platform supporting NSA/SA, network slicing, and MEC.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any related migration plans. It focuses on cloud-native architecture, NFV, and 3GPP standards.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, micro-services based, stateless, Service-Based Architecture (SBA)
- **Infrastructure Layer**: Network, Cloud
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Vol.1
- **Release Date**: 2019-04 (Context: Commercialization of service mentioned as April 2019; document date not explicitly stated as a release date)
- **FIPS Validated**: No
- **Primary Platforms**: Cloud-native environment, micro-services, containers
- **Target Industries**: Telecommunications, Mobile Operators
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---

## Mavenir Cloud RAN

- **Category**: 5G & Telecom Security
- **Product Name**: Mavenir Cloud RAN
- **Product Brief**: Not stated (Document is a research paper evaluating PQC in 5G Core, not a product datasheet)
- **PQC Support**: Partial (with scope) - Evaluated in simulation environment for 5G Core; hybrid schemes used.
- **PQC Capability Description**: The document describes a simulation study replacing conventional algorithms with PQC alternatives in the 5G Core. Algorithms evaluated include BIKE and FrodoKEM (KEMs), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), and Falcon (FN). Hybridized versions combining conventional and PQC algorithms were used. Results show measurable but small performance impact on bandwidth and latency, confirming technical feasibility without inherent issues.
- **PQC Migration Priority**: High - Document highlights "harvest now, decrypt later" risks and the critical need to preemptively integrate PQC into 5G Core due to reliance on PKI vulnerable to Shor's algorithm.
- **Crypto Primitives**: RSA, Diffie-Hellman, secp256r1 (referred to as secp2561 in text), AES, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon, BIKE, FrodoKEM.
- **Key Management Model**: Hybrid schemes combining conventional and post-quantum algorithms; PKI-based framework for dynamic authentication and scalable key management; TLS handshake negotiation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, microservice-oriented core architecture (5GC); Virtualized Network Functions (VNFs).
- **Infrastructure Layer**: Network
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-12-23 (Document date)
- **FIPS Validated**: No
- **Primary Platforms**: 5G Core (5GC), Virtualized Network Functions (VNFs), Service-Based Architecture (SBA).
- **Target Industries**: 5G & Telecom Security, Mobile Network Operators.
- **Regulatory Status**: Mentions encouragement/requirements from European Commission, BSI (Germany), NCSC (UK), IETF, and NIST; no specific product licenses or charters stated.
- **PQC Roadmap Details**: Transition expected within coming years; adoption of NIST standards (ML-DSA, SLH-DSA, Falcon, BIKE, FrodoKEM); use of hybrid schemes promoted by standardization bodies.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Current: RSA, ECDSA (implied via secp256r1). Planned/Evaluated: ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon (FN-DSA).
- **Authoritative Source URL**: Not stated (arXiv ID: 2512.20243v1)

---

## NEC 5G Core

- **Category**: 5G & Telecom Security
- **Product Name**: NEC 5G Core
- **Product Brief**: Fully cloud-native architecture for flexible scaling and auto-healing in 4G/5G converged core networks.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: The document describes a research simulation evaluating the replacement of conventional algorithms with PQC alternatives (BIKE, FrodoKEM, ML-DSA/Dilithium, SLH-DSA/SPHINCS+, Falcon/FN-DSA) in a 5G Core environment. It concludes the 5G Core is technically able to support PQC without substantial impact on usability, but does not state that the commercial product currently ships with these features enabled.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, secp256r1 (referred to as secp2561 in text), TLS, OAuth 2.0, BIKE, FrodoKEM, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon (FN-DSA)
- **Key Management Model**: Public Key Infrastructure (PKI)-based framework for dynamic authentication and scalable key management; hybridization of conventional and post-quantum algorithms.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, microservice-oriented core architecture with virtualized network functions (VNFs).
- **Infrastructure Layer**: Network
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Cloud-native environment, virtualized network functions (VNFs)
- **Target Industries**: Telecommunications, 5G & Telecom Security
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Research indicates transition is expected within coming years; evaluation of hybrid schemes using NIST-standardized algorithms (BIKE, FrodoKEM, ML-DSA, SLH-DSA, Falcon) in simulation environments.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA, secp256r1, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Falcon (FN-DSA)
- **Authoritative Source URL**: Not stated

---

## Rakuten Symphony (Symworld)

- **Category**: 5G & Telecom Security
- **Product Name**: Rakuten Symphony (Symworld)
- **Product Brief**: Cloud-native telecom solutions including Open RAN, OSS, and enterprise internet services.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the provided text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-native, hyperconverged Kubernetes for the Stateful Edge
- **Infrastructure Layer**: Network, Cloud
- **License Type**: Proprietary (inferred from "End User License Agreement" and commercial context)
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No mention
- **Primary Platforms**: Cloud-native, Kubernetes
- **Target Industries**: Telecom, Enterprise
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Source filename provided: Rakuten_Symphony__Symworld__doc1.html)

---

## JetBrains TeamCity 2026.1

- **Category**: Supply Chain & DevSecOps
- **Product Name**: TeamCity On-Premises
- **Product Brief**: A continuous integration and build management server with a roadmap for version 2026.1.
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated in the document.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: 2025.11
- **Release Date**: Not stated (Only "22 November 2025" is mentioned as a date for the Release Cycle article, not a product release)
- **FIPS Validated**: No mention
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Text mentions "visit our website" but does not provide the specific URL)

---

## GitHub Copilot Security

- **Category**: Supply Chain & DevSecOps
- **Product Name**: GitHub Actions
- **Product Brief**: CI/CD platform with a 2026 roadmap focusing on secure defaults, policy controls, and supply chain hardening.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It focuses on supply chain security, dependency locking, and workflow execution policies.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2026-03-26
- **FIPS Validated**: No
- **Primary Platforms**: GitHub Actions (CI/CD runners)
- **Target Industries**: Enterprise software, DevSecOps
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.blog/news-and-insights/product/whats-coming-to-our-github-actions-2026-security-roadmap/ (Inferred from context, but exact URL not explicitly in text; text source is GitHub_Copilot_Security.html)

---

## Veracode Platform

- **Category**: Supply Chain & DevSecOps
- **Product Name**: Veracode Platform
- **Product Brief**: Unified visibility, AI-driven prioritization, and integrated tools to detect, understand, and remediate application vulnerabilities.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document focuses on Static Application Security Testing (SAST), Dynamic Analysis (DAST), and Software Composition Analysis (SCA) but contains no mention of Post-Quantum Cryptography algorithms, implementations, or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (mentions IDEs, CI/CD pipelines, and cloud-native stacks generally)
- **Target Industries**: Financial Services, Government – Public Sector, Healthcare, Retail & Commerce, Energy
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Unknown

---

## Checkmarx One

- **Category**: Supply Chain & DevSecOps
- **Product Name**: Checkmarx One
- **Product Brief**: Not stated (Document contains only cookie consent information)
- **PQC Support**: No mention
- **PQC Capability Description**: Not stated. The provided text consists exclusively of a cookie consent banner and a list of cookies used for tracking, analytics, and functionality; it contains no information regarding cryptographic implementations or Post-Quantum Cryptography.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application (as per user prompt context, though not explicitly defined in the text)
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No mention
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---
