# Crypto Agility and Architecture Patterns

## Overview

The Crypto Agility module teaches how to design systems that can rapidly swap cryptographic algorithms, protocols, and implementations without significant code or infrastructure changes. Crypto agility is NIST's top recommendation for PQC transition preparedness. The module covers three dimensions of agility (algorithm, protocol, and implementation), three architecture patterns (provider model, service mesh, and external KMS/HSM), the Cryptographic Bill of Materials (CBOM) concept for discovering all crypto assets in an organization, and a 7-phase PQC migration framework aligned with NIST IR 8547, CISA guidance, and NSA CNSA 2.0 timelines. It also presents real-world case studies from Cloudflare, Google Chrome, and Apple iMessage.

## Key Concepts

- **Crypto agility** is the ability to rapidly switch cryptographic algorithms, protocols, and implementations without significant application code changes
- **Three dimensions of agility**:
  - **Algorithm agility** — swap algorithms (RSA to ML-KEM) via configuration, not code rewrites
  - **Protocol agility** — support multiple protocol versions simultaneously (TLS 1.2/1.3, hybrid key exchange)
  - **Implementation agility** — switch between crypto providers (OpenSSL, BoringSSL, AWS-LC) without application changes
- **Three architecture patterns**:
  - **Provider Model** — applications use abstraction APIs (JCA, OpenSSL Providers) and swap backends via config
  - **Service Mesh / Proxy** — crypto for data-in-transit (mTLS) offloaded to infrastructure proxies (Envoy, Istio); zero app code changes
  - **External KMS / HSM** — crypto operations outsourced to a central service (AWS KMS, Azure Key Vault); upgrading the KMS upgrades the enterprise
- **CBOM (Cryptographic Bill of Materials)** — uses the CycloneDX standard to inventory all cryptographic algorithms, key sizes, usage locations, security levels, and compliance requirements across an organization
- **CBOM generation tools**: IBM Quantum Safe Explorer, Keyfactor CBOM Generator, InfoSec Global AgileSec, Cryptosense Analyzer, manual audit and code scanning
- **7-Phase Migration Framework**: (1) Assessment and Inventory, (2) Risk Prioritization, (3) Preparation and Tooling, (4) Testing and Validation, (5) Hybrid Migration, (6) Production Deployment, (7) Monitoring
- **Industry case studies**: Cloudflare enabled hybrid PQC key exchange (X25519MLKEM768) with approximately 4% TLS handshake time increase; Google Chrome enabled hybrid PQC by default in Chrome 124, upgraded to standardized X25519MLKEM768 in Chrome 131; Apple iMessage adopted PQ3 protocol (P-256 ECDH + Kyber-1024 initial keys, Kyber-768 rekeying ratchet — both now standardized as ML-KEM-1024 / ML-KEM-768 per FIPS 203) in iOS 17.4

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **Abstraction Layer Demo** — interactive demonstration of how algorithm-agnostic APIs enable instant backend swaps; select different crypto providers and see how the same API calls produce results from different algorithm implementations
2. **CBOM Scanner** — scan a sample enterprise architecture to discover and catalog all quantum-vulnerable cryptographic algorithms in use; produces a CycloneDX-format CBOM with risk assessments
3. **Migration Planning Exercise** — walk through the 7-phase PQC migration framework step by step, making decisions about prioritization, tooling selection, and deployment strategy
4. **Agility Readiness Assessment** — score your organization across four crypto agility dimensions (Algorithm Agility, Protocol Agility, Implementation Agility, Inventory & Visibility); each dimension has three yes/partial/no questions with actionable guidance; produces an overall maturity rating (Not Started → Foundational → Developing → Advanced) and highlights the weakest dimension as the recommended focus area

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
- CISA Post-Quantum Cryptography Initiative
- CycloneDX CBOM Specification
- NIST SP 800-227
