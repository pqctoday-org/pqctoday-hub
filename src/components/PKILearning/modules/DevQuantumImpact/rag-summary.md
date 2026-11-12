# Developer Quantum Impact

## Overview

Developer Quantum Impact connects six descriptive threat scenarios to skill self-ratings, a phased action checklist and a nine-item exposure checklist. Separate linked tools support token sizing, TLS configuration experiments, API migration examples, signing, hybrid key derivation and test-vector input analysis. Use the examples to choose checks to perform with your own development tools.

## Key Concepts

- **Library API Transitions** — OpenSSL EVP API (PQC native since OpenSSL 3.5; oqsprovider only for 3.2-3.4), Bouncy Castle 1.79+ PQC provider, liboqs C/Python/Go/Rust bindings, and `@oqs/liboqs-js` for browser WASM; migration from `RSA_generate_key` / `EC_KEY_new_by_curve_name` patterns to `EVP_PKEY_CTX_new_from_name(ctx, "ML-DSA-65", NULL)` and equivalent provider-aware calls
- **Signature Size Explosion** — ML-DSA-44 signature: 2,420 bytes; ML-DSA-65 signature: 3,309 bytes; ML-DSA-87 signature: 4,627 bytes; SLH-DSA-SHAKE-128f signature: 17,088 bytes — compared to ECDSA P-256: 64 bytes
- **Key Size Growth** — ML-KEM-512 public key: 800 bytes; ML-KEM-768 public key: 1,184 bytes; ML-KEM-1024 public key: 1,568 bytes; ML-DSA-65 public key: 1,952 bytes; all larger than typical RSA-2048 (256 bytes) or ECDSA P-256 (64 bytes) public keys
- **TLS Handshake Size Growth** — classical TLS 1.3 handshake: ~5 KB; hybrid TLS (X25519MLKEM768): ~15 KB; pure PQC TLS: ~25 KB; handshake latency P99 increases from ~12ms (classical) to ~28ms (X25519MLKEM768 hybrid) to ~35ms (pure PQC); MTU fragmentation and load balancer timeout adjustments required
- **X25519MLKEM768** — the IETF-standardized (RFC draft) hybrid KEM combining X25519 and ML-KEM-768; Google Chrome default since 2024; TLS 1.3 key_share group ID 0x11ec; the recommended migration target for TLS key exchange
- **Code Signing Pipeline Changes** — cosign (Sigstore) and Notation (CNCF) are exploring PQC signing (no committed versions or dates yet); ML-DSA for OpenPGP is standardized in RFC 9980 (Post-Quantum Cryptography in OpenPGP, June 2026; updates RFC 9580, which itself contains no ML-DSA); Docker Content Trust and the Notary v1 service are being retired (full shutdown 8 December 2026; Docker names Sigstore/Cosign and Notation as the alternatives)
- **Hybrid KDF Combiners** — X-Wing (ML-KEM-768 + X25519 with HKDF combiner, draft-connolly-cfrg-xwing); SP 800-227 hybrid KEM combiner (KDF(ss_classical || ss_pqc || pk_classical || pk_pqc)); dual-algorithm code paths must handle failures in either algorithm branch independently
- **JWT/JOSE PQC Headers** — IANA JOSE algorithm IDs for ML-DSA: `ML-DSA-44`, `ML-DSA-65`, `ML-DSA-87` (RFC 9964, ML-DSA for JOSE and COSE); JWT with ML-DSA-65 signature: base64url(3,309 bytes) = 4,412 characters (unpadded) in the signature segment alone; many frameworks cap HTTP header size at 8 KB total
- **ACVP Test Vectors** — ACVP (the Automated Cryptographic Validation Protocol) is how NIST's ACVTS issues algorithm test vectors for ML-KEM, ML-DSA, and SLH-DSA, with public samples in the usnistgov/ACVP-Server repository (passing a sample is not a CAVP validation); existing RSA/ECDSA test suites do not cover PQC-specific edge cases (encapsulation failure modes, parameter set validation, deterministic vs. hedged signing)

## Workshop / Interactive Activities

The workshop has four steps:

1. **Why It Matters** — six expandable descriptive impact/scenario cards. Use them to identify code areas to investigate; the cards do not inspect your code or contain sizing calculators.
2. **What to Learn** — self-rate skills, compare your ratings with the role's targets, and follow linked learning modules.
3. **How to Act** — select phased action items and quick wins; export your checklist as Markdown. Checked items record your selections, not completed production migration work.
4. **Skill Self-Assessment** — a nine-item exposure checklist. Use the declared work areas to decide which topics to revisit; this is not a source-code scan or measured readiness assessment.

### Separate sample tools for the next decision

- [Token Size Analyzer](/learn/api-security-jwt?tab=workshop&step=4): edit a sample JSON payload and compare compact JWT and Authorization header-line bytes across algorithms against an entered line budget. Use the result to plan full-request tests in your own stack; it does not measure every header or your proxy's limits.
- [TLS 1.3 Simulator](/playground/tls-simulator): configure sample client/server groups, cipher suites and identities, then inspect the interaction. Use it to plan interoperability cases, not predict production P99 latency or fragmentation.
- [Hybrid KEM + ECDH](/playground/hybrid-encrypt): follow sample X25519 and ML-KEM operations and the HKDF combination of their secrets. Map those calls to your integration; the sample does not choose a protocol profile or audit your failure handling.
- [VectorSet Anatomy (on a computer)](/learn/acvp-lab-workflow?tab=workshop&step=1): parse two pinned prompt examples and predict which supplied inputs standard PKCS#11 can carry, group by group. This step runs no engine and does not establish universal test coverage or validation.
- [API Migration Decision Lab](/learn/crypto-dev-apis?tab=workshop&step=7): inspect migration paths, before/after library examples and steps. Map the calls to your code; the example is not a scanned or tested patch for your application.
- [Code-signing sample](/learn/code-signing?tab=workshop&step=0): follow sample binary signing and verification, distinguishing a live run from explicitly illustrative mode. Use this to plan your pipeline tests; it is not a cosign/Notation/GPG release-timeline matrix.

## Related Standards

- FIPS 203 (ML-KEM, Module-Lattice-Based Key-Encapsulation Mechanism)
- FIPS 204 (ML-DSA, Module-Lattice-Based Digital Signature Standard)
- FIPS 205 (SLH-DSA, Stateless Hash-Based Digital Signature Standard)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms — hybrid KEM combiners)
- RFC 9980 (Post-Quantum Cryptography in OpenPGP — ML-DSA / ML-KEM / SLH-DSA)
- RFC 9846 (TLS 1.3, obsoletes RFC 8446 — key_share extension, hybrid group negotiation)
- IETF draft-connolly-cfrg-xwing (X-Wing hybrid KEM combiner)
- IETF draft-ietf-tls-mlkem (ML-KEM in TLS 1.3)
- RFC 9964 (ML-DSA for JOSE and COSE: ML-DSA JOSE algorithm IDs)
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
