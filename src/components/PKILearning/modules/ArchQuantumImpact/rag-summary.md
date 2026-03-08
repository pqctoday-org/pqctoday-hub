# Architect Quantum Impact

## Overview

The Architect Quantum Impact module addresses the structural design decisions that determine whether a system can migrate to post-quantum cryptography gracefully or requires full re-architecture. It covers six high-impact architectural concerns — KMS and HSM migration complexity, certificate chain size explosion, hybrid algorithm path design, algorithm selection for constrained and general environments, TLS handshake latency budgets, and crypto-agility debt — alongside a nine-criterion architecture self-assessment and a guided Architecture Design Lab. Content is calibrated for solution architects, security architects, and principal engineers who design multi-system cryptographic infrastructure.

## Key Concepts

- **KMS Migration Complexity** — key wrapping hierarchies must be redesigned to accommodate ML-KEM-768/1024 ciphertexts (1,088/1,568 bytes vs. RSA-OAEP 256 bytes); HSM firmware upgrades are required for hardware-backed PQC key generation — not all current HSM models have PQC firmware available; key wrapping with ML-KEM requires re-encryption of all existing DEKs under new PQC KEKs (envelope re-encryption at scale)
- **Certificate Chain Size Explosion** — classical leaf + intermediate + root chain: ~3 KB; hybrid chain (dual-algorithm X.509 v3 with composite or chameleon cert): ~6–8 KB; pure ML-DSA-65 chain: ~12–14 KB; IoT/DTLS constrained environments where classical chain fits in 1.5 KB MTU will require fragmentation or alternative cert delivery for PQC chains; OCSP stapling must be sized for ML-DSA responses
- **Hybrid Architecture Design** — dual-algorithm code paths must handle independent failure modes (classical succeeds, PQC fails; PQC succeeds, classical fails); fallback logic must be deliberate, not silent; hybrid KEM combiners (X-Wing, SP 800-227 pattern) must concatenate shared secrets through a domain-separated KDF to prevent downgrade attacks; hybrid certificate formats: Composite X.509 (draft-ounsworth-pq-composite-sigs), Chameleon Certificates (RFC 9162 extension), and dual-cert approaches each have different operational tradeoffs
- **Algorithm Selection Decision Tree** — constrained devices (IoT, smart cards, embedded): FN-DSA-512 (Falcon-512) preferred — compact signature (666 bytes), but requires Gaussian sampling (careful implementation); ML-DSA-44 for signing when implementation simplicity matters more than size; ML-KEM-512 for key exchange on constrained devices; general servers/cloud: ML-DSA-65 for signing, ML-KEM-768 for KEM; high-assurance/long-lived: ML-DSA-87, ML-KEM-1024, SLH-DSA-SHAKE-256s
- **TLS Handshake Latency Budgets** — TLS 1.3 handshake latency (P50/P99): classical P-256: 4ms/12ms; X25519MLKEM768 hybrid: 9ms/28ms; pure ML-KEM-768: 12ms/35ms; architects must audit SLA contracts — any SLA with <50ms API response times needs explicit PQC performance budget allocation; CDN and load balancer session ticket sizes also grow (2–4× classical)
- **Crypto-Agility Debt** — hardcoded algorithm identifiers (OID strings, JCA algorithm names, cipher suite constants) embedded in configuration files, database schema, or wire protocols create migration blockers; crypto-agile systems abstract algorithm selection behind a policy interface; CBOM (Cryptographic Bill of Materials) — machine-readable inventory of all cryptographic dependencies (analogous to SBOM); CycloneDX CBOM schema is the current draft standard
- **HSM PQC Maturity Tiers** — Tier 1 (firmware GA): Thales Luna Network HSM 7.x (ML-DSA, ML-KEM), Utimaco Q-Safe, IBM 4769; Tier 2 (beta/limited): Entrust nShield Edge (ML-DSA beta), AWS CloudHSM (ML-KEM preview); Tier 3 (roadmap only): Azure Dedicated HSM, Google Cloud HSM; architects must map their HSM tier against their migration timeline before committing to hardware-backed PQC key storage
- **DTLS 1.3 with ML-KEM** — IoT and UDP-based protocols (CoAP, QUIC, DTLS) face additional constraints: DTLS record size limits, handshake fragmentation, retransmit buffers for large PQC Certificate messages; DTLS 1.3 + ML-KEM-512 is the current recommended path for constrained IoT; QUIC with X25519MLKEM768 is available in Cloudflare, Chrome, and BoringSSL
- **Crypto-Agility CBOM** — architects should mandate CBOM generation in build pipelines; CycloneDX cbom component type identifies algorithm, key length, and usage context; CBOM enables automated policy enforcement (OPA/Kyverno) and accelerates future algorithm transitions by providing a machine-readable migration target list

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **Threat Impact Explorer** — six-panel architectural briefing: KMS/HSM migration complexity matrix (by HSM vendor tier and key hierarchy depth), certificate chain size calculator (input: cert count + algorithm + chain depth → output: total chain size, MTU fragmentation risk, OCSP response size), hybrid architecture decision flowchart (KEM combiner selection, fallback logic patterns, dual-cert vs. composite cert tradeoffs), algorithm selection decision tree (constrained vs. general vs. high-assurance use cases), TLS performance budget calculator (input: P99 SLA → output: algorithm feasibility, headroom), and crypto-agility debt scanner pattern library
2. **Self-Assessment Survey** — nine-criterion architecture readiness evaluation covering: PKI design and certificate issuance ownership, KMS/HSM integration and key hierarchy design, multi-protocol system design (TLS + DTLS + QUIC + SSH), crypto abstraction layer presence in current architecture, IoT or embedded device architecture, long-lived certificate systems (>2 year validity), HSM integration patterns (PKCS#11, vendor SDK), cloud-native deployments (Kubernetes, service mesh, managed key services), zero-trust architecture designs (mTLS everywhere, short-lived certificates); outputs an architectural risk tier with system-specific remediation priorities
3. **Architecture Design Lab** — guided design exercise producing a PQC migration architecture document; sections: (1) CBOM inventory template with algorithm classification (vulnerable / hybrid-ready / pure-PQC), (2) HSM PQC capability matrix for the organization's HSM fleet, (3) certificate chain size analysis by system segment, (4) algorithm selection worksheet per system tier, (5) hybrid architecture pattern selection (composite cert / dual-cert / X-Wing KEM / SP 800-227 KEM combiner), (6) crypto-agility gap assessment with hardcoded algorithm inventory; exports as structured Markdown

## Related Standards

- FIPS 203 (ML-KEM — parameter sets: ML-KEM-512, ML-KEM-768, ML-KEM-1024)
- FIPS 204 (ML-DSA — parameter sets: ML-DSA-44, ML-DSA-65, ML-DSA-87)
- FIPS 205 (SLH-DSA — 12 parameter sets including SLH-DSA-SHAKE-128f, SLH-DSA-SHAKE-256s)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners)
- NIST SP 800-208 (Recommendation for Stateful Hash-Based Signature Schemes — LMS/XMSS)
- IETF draft-ounsworth-pq-composite-sigs (Composite X.509 signatures)
- IETF draft-connolly-cfrg-xwing (X-Wing hybrid KEM combiner)
- IETF draft-ietf-tls-mlkem (ML-KEM in TLS 1.3 — X25519MLKEM768 group)
- CycloneDX CBOM (Cryptographic Bill of Materials schema)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
- DTLS 1.3 (RFC 9147 — transport layer security for constrained environments)

## Cross-References

- `kms-pqc` — KMS provider PQC landscape, KMIP v2.1, envelope encryption patterns
- `hsm-pqc` — HSM PQC capability matrix, PKCS#11 v3.2 CKM_ML_DSA/CKM_ML_KEM, key hierarchy design
- `hybrid-crypto` — hybrid certificate formats (Composite, Chameleon, dual-cert), hybrid KEM combiners
- `tls-basics` — TLS handshake fundamentals, hybrid group negotiation, certificate chain delivery
- `iot-ot-pqc` — DTLS 1.3 PQC for IoT, constrained device algorithm selection, CoAP + ML-KEM
- `crypto-agility` — crypto-agility frameworks, CBOM generation, algorithm abstraction layer patterns
- `pki-workshop` — PKI hierarchy design, certificate lifecycle, OCSP/CRL sizing for PQC
- `migration-program` — phased migration planning, dependency mapping, rollback procedures
