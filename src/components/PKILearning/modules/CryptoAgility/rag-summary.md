# Crypto Agility and Architecture Patterns

## Overview

The Crypto Agility module teaches how to design systems that can switch cryptographic algorithms, protocols, and implementations with as little change as possible to the applications that use them. Callers can be insulated from the primitive, but credentials, encodings, key/signature/ciphertext sizes, negotiation, storage, rollback and tests still change with each algorithm. NIST devotes a white paper, CSWP 39 (Considerations for Achieving Crypto Agility), to it. The module covers three dimensions of agility (algorithm, protocol, and implementation), three architecture patterns (provider model, service mesh, and external KMS/HSM), the Cryptographic Bill of Materials (CBOM) concept for discovering all crypto assets in an organization, and a 7-phase PQC migration framework aligned with NIST IR 8547, CISA guidance, and NSA CNSA 2.0 timelines. It also presents real-world case studies from Cloudflare, Google Chrome, and Apple iMessage.

## Key Concepts

- **Crypto agility** is the ability to switch cryptographic algorithms, protocols, and implementations without rewriting the applications that call them
- **Three dimensions of agility**:
  - **Algorithm agility** — select algorithms in configuration rather than hard-coding them; moving from RSA encryption to ML-KEM still changes the call pattern (a KEM cannot encrypt data directly — NIST SP 800-227) and key and ciphertext sizes
  - **Protocol agility** — support multiple protocol versions simultaneously (TLS 1.2/1.3, hybrid key exchange)
  - **Implementation agility** — switch between crypto providers (OpenSSL, BoringSSL, AWS-LC) without changing application call sites
- **Three architecture patterns**:
  - **Provider Model** — applications use abstraction APIs (JCA, OpenSSL Providers) and select backends in config, per application
  - **Service Mesh / Proxy** — crypto for data-in-transit (mTLS) offloaded to infrastructure proxies (Envoy, Istio); no crypto code changes for the application behind the proxy
  - **External KMS / HSM** — crypto operations outsourced to a central service (AWS KMS, Azure Key Vault); callers are insulated from the primitive, but each caller still adopts new key types, handles larger outputs and is tested — upgrading the service does not migrate the enterprise instantly
- **CBOM (Cryptographic Bill of Materials)** — uses the CycloneDX standard to inventory all cryptographic algorithms, key sizes, usage locations, security levels, and compliance requirements across an organization
- **CBOM generation tools**: IBM Quantum Safe Explorer, Keyfactor CBOM Generator, InfoSec Global AgileSec, Cryptosense Analyzer, manual audit and code scanning
- **7-Phase Migration Framework**: (1) Assessment and Inventory, (2) Risk Prioritization, (3) Preparation and Tooling, (4) Testing and Validation, (5) Hybrid Migration, (6) Production Deployment, (7) Monitoring
- **Industry case studies**: Chrome reports about a 4% slowdown in TLS handshake time from deploying post-quantum key agreement (Cloudflare, 2025); Google Chrome enabled hybrid PQC by default in Chrome 124, upgraded to standardized X25519MLKEM768 in Chrome 131; Apple iMessage adopted PQ3 protocol (P-256 ECDH + Kyber-1024 initial keys and a Kyber-768 rekeying ratchet — Kyber-1024 is ML-KEM-1024-level per FIPS 203) in iOS 17.4

## Workshop / Interactive Activities

The workshop has 4 interactive steps:

1. **Abstraction Layer Demo** — interactive demonstration of how algorithm-agnostic APIs keep call sites unchanged when the backend changes, and what still changes around them; select different crypto providers and see how the same API calls produce results from different algorithm implementations
2. **CBOM Scanner** — scan a sample enterprise architecture to discover and catalog all quantum-vulnerable cryptographic algorithms in use; produces a CycloneDX-format CBOM with risk assessments
3. **Migration Planning Exercise** — walk through the 7-phase PQC migration framework step by step, making decisions about prioritization, tooling selection, and deployment strategy
4. **Agility Readiness Assessment** — score your organization across four crypto agility dimensions (Algorithm Agility, Protocol Agility, Implementation Agility, Inventory & Visibility); each dimension has three yes/partial/no questions with actionable guidance; produces an overall maturity rating (Not Started → Foundational → Developing → Advanced) and highlights the weakest dimension as the recommended focus area

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
- CISA Post-Quantum Cryptography Initiative
- CycloneDX CBOM Specification
- NIST SP 800-227
