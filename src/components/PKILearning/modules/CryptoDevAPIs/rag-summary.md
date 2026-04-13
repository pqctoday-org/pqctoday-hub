# Crypto Dev APIs & PQC — Module Summary

## Overview

Intermediate-level module (120 min, 8 workshop steps) covering post-quantum cryptography integration across the major cryptographic APIs and programming language ecosystems — JCA/JCE, OpenSSL EVP, PKCS#11 v3.2, Windows CNG, and language-specific PQC libraries. Teaches developers how to migrate production cryptographic code to PQC without vendor lock-in, using crypto agility patterns.

## Key Topics

- **JCA/JCE (Java Cryptography Architecture / Extension)**: Provider-based architecture — Security.addProvider() inserts pluggable crypto backends. Standard JDK 21+ does not include ML-KEM/ML-DSA; requires BouncyCastle 1.78+ as JCA provider (`BC` or `BCFIPS`). Key types: `MLKEMPublicKey`, `MLDSAPrivateKey`. Algorithm strings: `"ML-KEM-768"`, `"ML-DSA-65"`. Java 17 → 21 migration recommended before PQC addition. FIPS 140-3 path: BCFIPS 2.0.0 (BouncyCastle FIPS module, Level 1 certified, Level 3 HSM integration via JCProv).
- **JCProv (Thales Luna HSM PKCS#11 JCA bridge)**: FIPS 140-3 Level 3 hardware-backed JCA provider. Wraps Luna HSM PKCS#11 v3.2 interface. ML-KEM and ML-DSA available via Luna 7.7+ firmware. `CKM_ML_KEM` and `CKM_ML_DSA` mechanism IDs. Key generation via `C_GenerateKeyPair` with `CKK_ML_DSA`/`CKK_ML_KEM` key types. JCProv config: `com.safenet.provider.luna.LunaProvider`.
- **OpenSSL EVP API (C/C++/Rust)**: Most widely deployed crypto API. OpenSSL 3.x EVP layer is provider-based — `oqsprovider` (Open Quantum Safe project) adds ML-KEM, ML-DSA, SLH-DSA, FN-DSA. `EVP_PKEY_CTX_new_from_name(NULL, "ML-KEM-768", NULL)` for key generation. `EVP_PKEY_encapsulate()` / `EVP_PKEY_decapsulate()` for ML-KEM. `EVP_DigestSign()` / `EVP_DigestVerify()` for ML-DSA. oqsprovider v0.7.0+ required for FIPS 203/204/205 algorithm names.
- **PKCS#11 v3.2**: Standard C API for HSM integration. Version 3.2 adds `C_EncapsulateKey` and `C_DecapsulateKey` functions (new in v3.2 — not present in v2.40). New mechanism: `CKM_ML_KEM` (0x00000094), `CKM_ML_DSA` (0x00000095), `CKM_HASH_ML_DSA_*` pre-hash variants. New key types: `CKK_ML_DSA` (0x00000048), `CKK_ML_KEM` (0x00000049). HSM vendors with PKCS#11 v3.2 PQC support: Thales Luna 7.7+, AWS CloudHSM (roadmap 2026), Utimaco Se-Series.
- **CNG (Windows Cryptography API: Next Generation)**: `BCryptOpenAlgorithmProvider(phAlgorithm, L"ML-KEM", NULL, 0)`. ML-KEM-512/768/1024 available in Windows 11 24H2+ and Windows Server 2025. `BCryptGenerateKeyPair`, `BCryptExportKey` with `BCRYPT_ML_KEM_PUBLIC_BLOB`. PowerShell: `[System.Security.Cryptography.MLKem768]::GenerateKey()` (.NET 9+). FIPS mode in Windows: `BCryptSetProperty` with `BCRYPT_ALGORITHM_PROPERTIES` — ML-KEM/ML-DSA included in Windows FIPS provider.
- **Language ecosystems**:
  - C++ — OpenSSL EVP + oqsprovider (primary); liboqs C bindings wrapped via `OQS_KEM` / `OQS_SIG` structs; direct integration into existing OpenSSL TLS via `SSL_CTX_set1_groups`
  - Rust — `pqcrypto` crate (pure-Rust ML-KEM/ML-DSA via PQClean bindings); `aws-lc-rs` (AWS-LC Rust bindings, FIPS-validated path); `oqs` crate (liboqs Rust bindings, broadest algorithm coverage including FrodoKEM/HQC)
  - Zig — liboqs Zig bindings via `@cImport`; bare-metal friendly; used in constrained embedded targets
  - Java — BouncyCastle 1.78+ (`org.bouncycastle.pqc.crypto.mlkem`, `org.bouncycastle.pqc.crypto.mldsa`); JCA provider swap pattern with `KeyPairGenerator.getInstance("ML-DSA-65", "BC")`
  - Python — `pyoqs` (liboqs Python wrapper, `oqs.KEM("ML-KEM-768")`); `cryptography` library 42+ (ML-KEM via OpenSSL 3.x + oqsprovider backend); `pqcrypto` PyPI package
  - Go — `github.com/cloudflare/circl` (ML-KEM, NTRU, FrodoKEM); `aws-lc-go` (AWS-LC Go bindings, ML-KEM/ML-DSA); standard library `crypto/mlkem` planned for Go 1.24
  - .NET — `System.Security.Cryptography.MLKem768` (ML-KEM in .NET 9, GA); ML-DSA planned .NET 10; BouncyCastle C# 2.3+ for full coverage today
- **PQC library comparison**:
  - liboqs (Open Quantum Safe) — C library, 15+ algorithms (ML-KEM/ML-DSA/SLH-DSA/FN-DSA/FrodoKEM/HQC/Classic McEliece), NIST reference implementation, not FIPS-validated, widely used for research and prototyping
  - AWS-LC — AWS fork of BoringSSL, C, FIPS 140-3 validated (Certificate #4759), ML-KEM-768 default for TLS, ML-DSA-65 signing, used in aws-lc-rs and aws-lc-go
  - BouncyCastle — Java/.NET, full FIPS 203/204/205 implementation, BCFIPS module for FIPS 140-3 compliance, best production choice for JVM/CLR ecosystems
  - pqcrypto (Rust) — pure-Rust via PQClean reference code, no C FFI, no unsafe in core paths, suitable for `no_std` embedded Rust; note: published crate names `pqcrypto-kyber` / `pqcrypto-dilithium` are pre-standardisation names — they wrap ML-KEM (FIPS 203) and ML-DSA (FIPS 204) respectively
  - PQClean — C reference implementations, clean code (no platform-specific optimizations, no side-channel protection claims), intended as readable reference not production backend
- **API radar scores (maturity / PQC readiness / ecosystem reach / HSM integration / compliance path)**:
  - JCA/JCE: 9 / 6 / 7 / 7 / 8 (mature API, PQC via BouncyCastle provider, strong compliance via BCFIPS)
  - OpenSSL EVP: 8 / 8 / 9 / 6 / 8 (widest deployment, oqsprovider adds PQC, HSM via engine/provider gap)
  - PKCS#11 v3.2: 7 / 9 / 7 / 9 / 7 (highest HSM integration score, PQC mechanisms natively defined, lower reach due to C-only interface)
  - CNG: 8 / 7 / 8 / 8 / 9 (Windows ecosystem, ML-KEM GA in Win 11 24H2, highest compliance score for FedRAMP Windows environments)
- **Key design patterns**: Crypto Agility Pattern (algorithm abstraction layer — `CryptoProvider` interface with `generateKeyPair(algorithm)`, `sign(key, data)`, `encapsulate(publicKey)` — swappable without changing call sites); Provider Pattern (pluggable crypto backends registered at startup — same pattern as JCA Security.addProvider); Build vs Buy vs Open Source decision matrix (FIPS requirement → AWS-LC or BCFIPS; HSM requirement → PKCS#11 v3.2; maximum algorithm coverage → liboqs)

## Workshop Steps

1. **APIArchitectureExplorer** — Visualize the provider/plugin architecture of each API; compare abstraction layers; identify where PQC plugs in without application code changes
2. **LanguageEcosystemComparator** — Side-by-side code comparison for ML-KEM-768 key generation and ML-DSA-65 signing across C++, Rust, Zig, Java, Python, Go, and .NET; highlight import paths and API ergonomics differences
3. **ProviderPatternWorkshop** — Implement a Crypto Agility factory pattern; configure JCA provider priority order; simulate provider failover from BCFIPS → BC when FIPS module unavailable
4. **BuildBuyAnalyzer** — Decision tree: FIPS validation required? HSM-backed? Language constraint? Algorithm coverage need? Output recommended library/API combination with justification
5. **PQCLibraryExplorer** — Interactive comparison of liboqs, AWS-LC, BouncyCastle, pqcrypto, PQClean by algorithm support matrix, FIPS status, platform support, and license
6. **PQCSupportMatrix** — Track PQC algorithm support across library versions: which version of each library first included ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA variants; identify minimum version requirements for a target stack
7. **CryptoAgilityPatterns** — Implement and compare 3 crypto agility patterns: Strategy pattern, Factory pattern, and Configuration-driven algorithm selection; analyze migration cost for each when algorithm changes
8. **MigrationDecisionLab** — Given a real-world codebase profile (language, framework, FIPS requirement, HSM presence, compliance target), generate a recommended migration path with step-by-step API change checklist

## Key Data Points

- BouncyCastle 1.78 release: first Java library with complete FIPS 203/204/205 implementation (ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA all variants)
- oqsprovider v0.7.0: uses FIPS 203/204/205 algorithm names (`ML-KEM-768` not `kyber768`) — required for standards-compliant OpenSSL integration
- PKCS#11 v3.2 `C_EncapsulateKey` mechanism: `CKM_ML_KEM` (OID 2.16.840.1.101.3.4.4.1 for ML-KEM-512) — not backward-compatible with v2.40; requires HSM firmware update
- AWS-LC FIPS certificate: #4759 (NIST CMVP) — covers ML-KEM-768 and ML-DSA-65; only widely available open-source C library with FIPS validation for PQC (as of early 2026)
- .NET 9 `MLKem768` GA: `System.Security.Cryptography.MLKem768.GenerateKey()` — no external library needed on .NET 9+ for ML-KEM; ML-DSA planned .NET 10 (2025)
- Go `crypto/mlkem` standard library: planned Go 1.24 (released February 2025) — `mlkem.GenerateKey768()`; cloudflare/circl remains necessary for ML-DSA and SLH-DSA
- JCA algorithm string format: `"ML-KEM-768"` (hyphenated, not `"MLKEM768"` or `"kyber768"`) — BouncyCastle 1.78+ and BCFIPS 2.0+ use FIPS 203 naming
- Crypto Agility pattern overhead: Strategy pattern adds ~2 µs per operation (interface dispatch) — negligible vs ML-KEM-768 keygen (~200 µs) or ML-DSA-65 sign (~700 µs)
- PQClean side-channel disclaimer: PQClean implementations explicitly disclaim constant-time guarantees on all platforms — do NOT use in production without profiling for timing leaks on target hardware

## Glossary Terms

- **JCA/JCE** — Java Cryptography Architecture / Java Cryptography Extension: provider-based pluggable crypto framework in the JDK
- **Bouncy Castle** — Open-source crypto library for Java and C# with full FIPS 203/204/205 PQC support; BCFIPS is the FIPS 140-3 validated variant
- **KSP (Key Storage Provider)** — Windows CNG abstraction for key storage backends (software, TPM, or HSM-backed)
- **CNG (Cryptography API: Next Generation)** — Windows cryptographic API replacing CAPI; `BCryptOpenAlgorithmProvider` is the primary entry point
- **JCProv** — Thales Luna HSM JCA provider bridging PKCS#11 v3.2 to Java JCA; enables FIPS 140-3 Level 3 hardware-backed JCA operations
- **oqsprovider** — Open Quantum Safe OpenSSL 3.x provider plugin; adds ML-KEM, ML-DSA, SLH-DSA, FN-DSA via `OSSL_PROVIDER_load(NULL, "oqsprovider")`
- **RustCrypto** — Community-maintained pure-Rust cryptography crates (`sha2`, `aes`, `p256`); ML-KEM/ML-DSA via `pqcrypto` crate built on PQClean
- **Crypto Agility Pattern** — Architectural pattern using algorithm abstraction (interface/factory) so cryptographic algorithms can be swapped without changing application call sites
- **liboqs** — Open Quantum Safe C library; broadest PQC algorithm coverage (15+ algorithms); reference implementation for NIST PQC candidates; not FIPS-validated
- **PQClean** — Collection of clean, portable C reference implementations of PQC algorithms; no platform optimizations; intended as readable reference baseline
- **AWS-LC** — Amazon fork of BoringSSL with FIPS 140-3 validation (#4759); includes ML-KEM-768 and ML-DSA-65; backend for AWS SDK crypto and aws-lc-rs/aws-lc-go

## Cross-References

- `hsm-pqc` — PKCS#11 v3.2 HSM integration and C_EncapsulateKey/C_DecapsulateKey implementation detail
- `kms-pqc` — KMS-level key management for application secrets generated via these APIs
- `pki-workshop` — certificate lifecycle for ML-DSA keys generated via JCA/OpenSSL EVP
- `tls-basics` — TLS library configuration using OpenSSL EVP / JCA for PQC cipher suites
- `platform-eng-pqc` — CI/CD pipeline crypto: container signing with cosign (uses Go crypto APIs)
- `api-security-jwt` — JWT/JOSE algorithm migration using JCA and .NET System.Security.Cryptography
- `hybrid-crypto` — hybrid key exchange implementation patterns using these APIs
- Quiz: 15 questions (cda-001 through cda-015)
