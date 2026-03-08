# Developer Quantum Impact

## Overview

The Developer Quantum Impact module provides software engineers with a concrete, code-level understanding of how post-quantum cryptography migration affects their day-to-day work. It covers the six most impactful technical disruptions — library API transitions, signature and key size explosions, TLS handshake growth, CI/CD signing pipeline changes, hybrid algorithm complexity, and testing gaps — alongside a hands-on self-assessment of which code paths need remediation and a structured skill gap roadmap. Content is calibrated for developers who write crypto library calls, build TLS-connected services, or maintain CI/CD pipelines.

## Key Concepts

- **Library API Transitions** — OpenSSL 3.x EVP API (via oqsprovider), Bouncy Castle 1.80+ PQC provider, liboqs C/Python/Go/Rust bindings, and `@oqs/liboqs-js` for browser WASM; migration from `RSA_generate_key` / `EC_KEY_new_by_curve_name` patterns to `EVP_PKEY_CTX_new_from_name(ctx, "ML-DSA-65", NULL)` and equivalent provider-aware calls
- **Signature Size Explosion** — ML-DSA-44 signature: 2,420 bytes; ML-DSA-65 signature: 3,309 bytes; ML-DSA-87 signature: 4,627 bytes; SLH-DSA-SHAKE-128f signature: 17,088 bytes — compared to ECDSA P-256: 64 bytes; JWT tokens using ML-DSA-65 produce headers exceeding 8 KB, breaking many HTTP header size limits and API gateway defaults
- **Key Size Growth** — ML-KEM-512 public key: 800 bytes; ML-KEM-768 public key: 1,184 bytes; ML-KEM-1024 public key: 1,568 bytes; ML-DSA-65 public key: 1,952 bytes; all larger than typical RSA-2048 (256 bytes) or ECDSA P-256 (64 bytes) public keys
- **TLS Handshake Size Growth** — classical TLS 1.3 handshake: ~5 KB; hybrid TLS (X25519MLKEM768): ~15 KB; pure PQC TLS: ~25 KB; handshake latency P99 increases from ~12ms (classical) to ~28ms (X25519MLKEM768 hybrid) to ~35ms (pure PQC); MTU fragmentation and load balancer timeout adjustments required
- **X25519MLKEM768** — the IETF-standardized (RFC draft) hybrid KEM combining X25519 and ML-KEM-768; Google Chrome default since 2024; TLS 1.3 key_share group ID 0x11ec; the recommended migration target for TLS key exchange
- **Code Signing Pipeline Changes** — cosign (Sigstore) roadmap targets ML-DSA-65 in 2026; Notation (CNCF) beta ML-DSA support via AWS Crypto plugin (2025); GPG/OpenPGP (RFC 9580) ML-DSA support in 2026; Docker Content Trust (Notary v1) has no PQC roadmap and should be migrated immediately
- **Hybrid KDF Combiners** — X-Wing (ML-KEM-768 + X25519 with HKDF combiner, draft-connolly-cfrg-xwing); SP 800-227 hybrid KEM combiner (KDF(ss_classical || ss_pqc || pk_classical || pk_pqc)); dual-algorithm code paths must handle failures in either algorithm branch independently
- **JWT/JOSE PQC Headers** — IANA JOSE algorithm IDs for ML-DSA: `ML-DSA-44`, `ML-DSA-65`, `ML-DSA-87` (IETF draft-ietf-jose-fully-specified-algorithms); JWT with ML-DSA-65 signature: base64url(3,309 bytes) = ~4,413 chars in the `sig` field alone; many frameworks cap HTTP header size at 8 KB total
- **ACVP Test Vectors** — NIST Automated Cryptographic Validation Protocol provides official algorithm test vectors for ML-KEM, ML-DSA, and SLH-DSA; existing RSA/ECDSA test suites do not cover PQC-specific edge cases (encapsulation failure modes, parameter set validation, deterministic vs. hedged signing)

## Workshop / Interactive Activities

The workshop has 3 interactive steps:

1. **Threat Impact Explorer** — six-panel technical briefing: library migration API diff (before/after code snippets), signature size impact calculator (input: algorithm + payload size → output: JWT size, HTTP header usage, storage overhead), TLS handshake size estimator with per-protocol comparison, code signing tool migration matrix (cosign/Notation/GPG timelines), hybrid KDF combiner walkthrough, and ACVP test vector gap analysis by algorithm category
2. **Self-Assessment Survey** — nine-criterion developer readiness check covering: TLS client/server code in codebase, JWT/JOSE token generation or validation, direct crypto library calls (OpenSSL, BouncyCastle, JCA/JCE), CI/CD artifact signing, hardware crypto device integration (HSM/TPM/YubiKey), X.509 certificate generation, key storage and key rotation code, TLS protocol negotiation and cipher suite configuration, PKCS#11 provider interfaces; outputs affected code areas with prioritized remediation order
3. **Skill Gap Roadmap** — three-domain skill gap assessment: Algorithm Knowledge (ML-KEM API patterns, ML-DSA API patterns, hybrid KDF combiners, ACVP test vector usage), Protocol Integration (TLS 1.3 hybrid group negotiation, JWT PQC algorithm headers, PKCS#11 v3.2 CKM_ML_DSA / CKM_ML_KEM mechanisms), Library & Build System (oqsprovider configuration, Bouncy Castle PQC provider, liboqs bindings, dependency version scanning for quantum-vulnerable packages); generates a personalized learning path with linked modules

## Related Standards

- FIPS 203 (ML-KEM, Module-Lattice-Based Key-Encapsulation Mechanism)
- FIPS 204 (ML-DSA, Module-Lattice-Based Digital Signature Standard)
- FIPS 205 (SLH-DSA, Stateless Hash-Based Digital Signature Standard)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners)
- RFC 9580 (OpenPGP — ML-DSA support in 2026)
- RFC 8446 (TLS 1.3 — key_share extension, hybrid group negotiation)
- IETF draft-connolly-cfrg-xwing (X-Wing hybrid KEM combiner)
- IETF draft-ietf-tls-mlkem (ML-KEM in TLS 1.3)
- IETF draft-ietf-jose-fully-specified-algorithms (ML-DSA JOSE algorithm IDs)
- PKCS#11 v3.2 (OASIS — CKM_ML_DSA, CKM_ML_KEM mechanism definitions)
- NIST ACVP (Automated Cryptographic Validation Protocol — ML-KEM/ML-DSA/SLH-DSA test vectors)

## Cross-References

- `crypto-dev-apis` — JCA/JCE, OpenSSL EVP, PKCS#11, CNG, Bouncy Castle API patterns across 7 languages
- `tls-basics` — TLS cipher suite fundamentals, hybrid KEM group negotiation, certificate chain size
- `api-security-jwt` — JWT algorithm migration, JOSE draft ML-DSA header sizes, API gateway configuration
- `code-signing` — binary/package/container signing migration (cosign, Notation, GPG)
- `kms-pqc` — key wrapping, envelope encryption, provider API differences (AWS KMS, HashiCorp Vault)
- `platform-eng-pqc` — CI/CD pipeline crypto inventory, OPA/Kyverno policy enforcement, container signing
- `hsm-pqc` — PKCS#11 interface patterns, HSM PQC capability matrix, key generation and storage
