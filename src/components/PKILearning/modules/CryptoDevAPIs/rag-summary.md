# Crypto Dev APIs & PQC — Module Summary

## Overview

Intermediate-level module (80 min, 8 workshop steps) covering post-quantum cryptography integration across the major cryptographic APIs and programming language ecosystems — JCA/JCE, OpenSSL EVP, PKCS#11 v3.2, Windows CNG, and language-specific PQC libraries. Teaches developers how to migrate production cryptographic code to PQC without vendor lock-in, using crypto agility patterns.

## Key Topics

- **JCA/JCE (Java Cryptography Architecture / Extension)**: Provider-based architecture — Security.addProvider() inserts pluggable crypto backends. JDK 24+ (March 2025) includes ML-KEM (JEP 496, `javax.crypto.KEM`, `KeyPairGenerator "ML-KEM"`) and ML-DSA (JEP 497, `Signature "ML-DSA"`) in the default providers; JDK 25 (September 2025) was the first LTS with them, and Oracle backported them to Oracle JDK 21.0.13 and 17.0.21 on 20 October 2026 (JDK 11 and 8 planned for the second half of 2027; other OpenJDK builds: check the vendor's release notes). On a JDK without them, or for SLH-DSA, register BouncyCastle 1.79+ as a JCA provider (`BC` or `BCFIPS`). Parameter-set strings: `"ML-KEM-768"`, `"ML-DSA-65"`. JSSE hybrid post-quantum TLS 1.3 key exchange (JEP 527, X25519MLKEM768 on by default) arrived in JDK 27 and in Oracle JDK 25.0.5 (October 2026); Oracle plans it for JDK 21 and 17 in the first half of 2027. FIPS 140-3 path: BCFIPS 2.0.0 (BouncyCastle FIPS module, Level 1 certified, Level 3 HSM integration via JCProv).
- **JCProv (Thales Luna HSM PKCS#11 JCA bridge)**: FIPS 140-3 Level 3 hardware-backed JCA provider. Wraps Luna HSM PKCS#11 v3.2 interface. ML-KEM and ML-DSA available via Luna Firmware 7.9.0+ (Client 10.9.0+). `CKM_ML_KEM` and `CKM_ML_DSA` mechanism IDs. Key generation via `C_GenerateKeyPair` with `CKK_ML_DSA`/`CKK_ML_KEM` key types. JCProv config: `com.safenet.provider.luna.LunaProvider`.
- **OpenSSL EVP API (C/C++/Rust)**: Most widely deployed crypto API. OpenSSL 3.5+ (April 2025) ships ML-KEM, ML-DSA and SLH-DSA natively in the default provider, and its default TLS key shares offer X25519MLKEM768. `oqsprovider` (Open Quantum Safe project) is only for OpenSSL before 3.5 or for algorithms that are not standardised (e.g. FN-DSA, HQC). `EVP_PKEY_CTX_new_from_name(NULL, "ML-KEM-768", NULL)` for key generation. `EVP_PKEY_encapsulate()` / `EVP_PKEY_decapsulate()` for ML-KEM. `EVP_DigestSign()` / `EVP_DigestVerify()` for ML-DSA. When oqsprovider is used, v0.7.0+ uses the FIPS 203/204/205 algorithm names.
- **PKCS#11 v3.2**: Standard C API for HSM integration. Version 3.2 adds `C_EncapsulateKey` and `C_DecapsulateKey` functions (new in v3.2 — not present in v2.40). New mechanisms: `CKM_ML_KEM_KEY_PAIR_GEN` (0x0000000f), `CKM_ML_KEM` (0x00000017), `CKM_ML_DSA_KEY_PAIR_GEN` (0x0000001c), `CKM_ML_DSA` (0x0000001d), `CKM_HASH_ML_DSA_*` pre-hash variants. New key types: `CKK_ML_KEM` (0x00000049), `CKK_ML_DSA` (0x0000004a), `CKK_SLH_DSA` (0x0000004b). Vendor status: Thales documents ML-KEM and ML-DSA from Luna firmware 7.9.0 (Client 10.9.0+); Utimaco’s Quantum Protect page lists PKCS #11 "Vendor Defined Mechanisms"; AWS CloudHSM offers a PKCS #11 version 2.40 library.
- **CNG (Windows Cryptography API: Next Generation)**: `BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_MLKEM_ALGORITHM, NULL, 0)`, then set `BCRYPT_PARAMETER_SET_NAME` before finalizing the key. ML-KEM (512/768/1024) and ML-DSA (44/65/87) generally available since November 2025 in Windows 11 24H2+ and Windows Server 2025. `BCRYPT_SLHDSA_ALGORITHM` is defined but not currently implemented by the default CNG provider; Microsoft's CNG identifiers page (updated 30 May 2026) still marks the composite identifiers as Insider Preview, while Microsoft's blog (14 July 2026 update) says composite algorithms are available in Windows 11 update KB5095093 and Windows Server 2025 update KB5099536; confirm on your build. `BCryptGenerateKeyPair`, `BCryptExportKey` with `BCRYPT_ML_KEM_PUBLIC_BLOB`. PowerShell/.NET: `[System.Security.Cryptography.MLKem]::GenerateKey([System.Security.Cryptography.MLKemAlgorithm]::MLKem768)` (.NET 10). FIPS mode in Windows: `BCryptSetProperty` with `BCRYPT_ALGORITHM_PROPERTIES` — ML-KEM/ML-DSA included in Windows FIPS provider.
- **Language ecosystems**:
  - C++ — OpenSSL 3.5+ EVP with native ML-KEM/ML-DSA/SLH-DSA (primary; oqsprovider before 3.5); liboqs C bindings wrapped via `OQS_KEM` / `OQS_SIG` structs; direct integration into existing OpenSSL TLS via `SSL_CTX_set1_groups`
  - Rust — `ml-kem` / `ml-dsa` crates (pure Rust, RustCrypto) and the `pqcrypto` crates (bindings to PQClean C code, unmaintained per their README); `aws-lc-rs` (AWS-LC Rust bindings, FIPS-validated path); `oqs` crate (liboqs Rust bindings, broadest algorithm coverage including FrodoKEM/HQC)
  - Zig — liboqs Zig bindings via `@cImport`; bare-metal friendly; used in constrained embedded targets
  - Java — JDK 24+ built-in `KeyPairGenerator.getInstance("ML-DSA")` and `KEM.getInstance("ML-KEM")`; BouncyCastle 1.79+ (lightweight classes: `org.bouncycastle.pqc.crypto.mlkem`, `mldsa` and `slhdsa` until 1.84; promoted to `org.bouncycastle.crypto` in 1.85, and the deprecated `pqc.crypto` packages were removed in 1.86) for JDKs without the built-in algorithms and for SLH-DSA, via `KeyPairGenerator.getInstance("ML-DSA-65", "BC")`
  - Python — `cryptography` (pyca) 47.0.0+ adds ML-KEM and ML-DSA when built against AWS-LC or BoringSSL, and 48.0.0+ with OpenSSL 3.5.0+ (the official wheels); `liboqs-python` (`oqs.KeyEncapsulation("ML-KEM-768")`) for SLH-DSA and non-standardised algorithms
  - Go — standard library `crypto/mlkem` (Go 1.24, Feb 2025; ML-KEM-768 and ML-KEM-1024 only, no ML-KEM-512; `crypto/tls` negotiates X25519MLKEM768 by default) and `crypto/mldsa` (Go 1.27, Aug 2026; ML-DSA also in `crypto/x509` and as TLS 1.3 signature schemes); `github.com/cloudflare/circl` for SLH-DSA and other algorithms
  - .NET — .NET 10 `System.Security.Cryptography.MLKem` (`MLKemAlgorithm.MLKem768`) and `MLDsa`; `SlhDsa` and `CompositeMLDsa` are `[Experimental]` (SYSLIB5006). All need OpenSSL 3.5+ on Linux or a Windows CNG build with PQC — check `IsSupported`. BouncyCastle C# is an alternative for older .NET or backends without PQC
- **PQC library comparison**:
  - liboqs (Open Quantum Safe) — C library, 15+ algorithms (ML-KEM/ML-DSA/SLH-DSA/FN-DSA/FrodoKEM/HQC/Classic McEliece), NIST reference implementation, not FIPS-validated, widely used for research and prototyping
  - AWS-LC — AWS fork of BoringSSL, C; the AWS-LC 3 FIPS 140-3 certificates (CMVP #5298 dynamic, #5314 static) list ML-KEM as approved, ML-DSA is not in their approved list; the older certificate #4759 (now historical) lists no PQC algorithm; used in aws-lc-rs
  - BouncyCastle — Java/.NET, full FIPS 203/204/205 implementation, BCFIPS module for FIPS 140-3 compliance, best production choice for JVM/CLR ecosystems
  - pqcrypto (Rust) — bindings to PQClean C implementations and unmaintained per their README; the published crate names `pqcrypto-kyber` / `pqcrypto-dilithium` are pre-standardisation names, and `pqcrypto-mlkem` / `pqcrypto-mldsa` also exist
  - PQClean — C reference implementations, clean code (no platform-specific optimizations, no side-channel protection claims), intended as readable reference not production backend
- **API radar scores (maturity / PQC readiness / ecosystem reach / HSM integration / compliance path)**:
  - JCA/JCE: 9 / 7 / 7 / 7 / 8 (mature API, built-in ML-KEM/ML-DSA from JDK 24, BouncyCastle for SLH-DSA, strong compliance via BCFIPS)
  - OpenSSL EVP: 8 / 8 / 9 / 6 / 8 (widest deployment, native PQC since 3.5, HSM via engine/provider gap)
  - PKCS#11 v3.2: 7 / 9 / 7 / 9 / 7 (highest HSM integration score, PQC mechanisms natively defined, lower reach due to C-only interface)
  - CNG: 8 / 7 / 8 / 8 / 9 (Windows ecosystem, ML-KEM and ML-DSA GA on Win 11 24H2+ / Server 2025, no SLH-DSA in the default provider)
- **Key design patterns**: Crypto Agility Pattern (algorithm abstraction layer — `CryptoProvider` interface with `generateKeyPair(algorithm)`, `sign(key, data)`, `encapsulate(publicKey)` — swappable without changing call sites); Provider Pattern (pluggable crypto backends registered at startup — same pattern as JCA Security.addProvider); Build vs Buy vs Open Source decision matrix (FIPS requirement → AWS-LC or BCFIPS; HSM requirement → PKCS#11 v3.2; maximum algorithm coverage → liboqs)

## Workshop Steps

1. **APIArchitectureExplorer** — Visualize the provider/plugin architecture of each API; compare abstraction layers; identify where PQC plugs in and what still changes around it (algorithm identifiers, key/signature sizes, encodings, negotiation, error paths)
2. **LanguageEcosystemComparator** — Side-by-side code comparison for ML-KEM-768 key generation and ML-DSA-65 signing across C++, Rust, Zig, Java, Python, Go, and .NET; highlight import paths and API ergonomics differences
3. **ProviderPatternWorkshop** — Implement a Crypto Agility factory pattern; configure JCA provider priority order; simulate provider failover from BCFIPS → BC when FIPS module unavailable
4. **BuildBuyAnalyzer** — Decision tree: FIPS validation required? HSM-backed? Language constraint? Algorithm coverage need? Output recommended library/API combination with justification
5. **PQCLibraryExplorer** — Interactive comparison of liboqs, AWS-LC, BouncyCastle, pqcrypto, PQClean by algorithm support matrix, FIPS status, platform support, and license
6. **PQCSupportMatrix** — Track PQC algorithm support across library versions: which version of each library first included ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA variants; identify minimum version requirements for a target stack
7. **CryptoAgilityPatterns** — Implement and compare 3 crypto agility patterns: Strategy pattern, Factory pattern, and Configuration-driven algorithm selection; analyze migration cost for each when algorithm changes
8. **MigrationDecisionLab** — Given a real-world codebase profile (language, framework, FIPS requirement, HSM presence, compliance target), generate a recommended migration path with step-by-step API change checklist

## Key Data Points

- BouncyCastle 1.79 release (30 October 2024): ML-KEM, ML-DSA (including pre-hash) and SLH-DSA (including pre-hash) added to the BC provider and the lightweight API (ML-KEM-512/768/1024, ML-DSA-44/65/87, SLH-DSA all variants)
- oqsprovider v0.7.0: uses FIPS 203/204/205 algorithm names (`ML-KEM-768` not `kyber768`) — relevant only for OpenSSL before 3.5, which lacks native PQC
- PKCS#11 v3.2 `C_EncapsulateKey` mechanism: `CKM_ML_KEM` (OID 2.16.840.1.101.3.4.4.1 for ML-KEM-512) — not backward-compatible with v2.40; requires HSM firmware update
- AWS-LC FIPS certificates: AWS-LC 3 #5298 (dynamic, June 2026) and #5314 (static, June 2026) list ML-KEM KeyGen and Encap/Decap as approved; ML-DSA is not in their approved-algorithm list. The older #4759 is historical and lists no PQC algorithm (CMVP, checked October 2026)
- .NET 10 `MLKem` and `MLDsa`: `MLKem.GenerateKey(MLKemAlgorithm.MLKem768)`, `MLDsa.GenerateKey(MLDsaAlgorithm.MLDsa65)` — no external library needed on .NET 10+ when the OS backend is OpenSSL 3.5+ or a PQC-capable Windows CNG; `SlhDsa` is `[Experimental]` (SYSLIB5006)
- Go `crypto/mlkem` standard library: shipped in Go 1.24 (released February 2025) — provides ML-KEM-768 and ML-KEM-1024 only (no ML-KEM-512); `mlkem.GenerateKey768()`; Go 1.27 (August 2026) adds `crypto/mldsa`; cloudflare/circl is still needed for SLH-DSA
- JCA algorithm string format: `"ML-KEM-768"` (hyphenated, not `"MLKEM768"` or `"kyber768"`) — JDK 24+ and BouncyCastle 1.79+ use FIPS 203 naming
- Crypto Agility pattern overhead: Strategy pattern adds ~2 µs per operation (interface dispatch) — negligible vs ML-KEM-768 keygen (~200 µs) or ML-DSA-65 sign (~700 µs)
- PQClean side-channel disclaimer: PQClean implementations explicitly disclaim constant-time guarantees on all platforms — do NOT use in production without profiling for timing leaks on target hardware

## Glossary Terms

- **JCA/JCE** — Java Cryptography Architecture / Java Cryptography Extension: provider-based pluggable crypto framework in the JDK
- **Bouncy Castle** — Open-source crypto library for Java and C# with full FIPS 203/204/205 PQC support; BCFIPS is the FIPS 140-3 validated variant
- **KSP (Key Storage Provider)** — Windows CNG abstraction for key storage backends (software, TPM, or HSM-backed)
- **CNG (Cryptography API: Next Generation)** — Windows cryptographic API replacing CAPI; `BCryptOpenAlgorithmProvider` is the primary entry point
- **JCProv** — Thales Luna HSM JCA provider bridging PKCS#11 v3.2 to Java JCA; enables FIPS 140-3 Level 3 hardware-backed JCA operations
- **oqsprovider** — Open Quantum Safe OpenSSL 3.x provider plugin; adds PQC to OpenSSL before 3.5 and non-standardised algorithms (e.g. FN-DSA) to any 3.x, via `OSSL_PROVIDER_load(NULL, "oqsprovider")`
- **RustCrypto** — Community-maintained pure-Rust cryptography crates (`sha2`, `aes`, `p256`); ML-KEM/ML-DSA via the `ml-kem` and `ml-dsa` crates (the separate `pqcrypto` crates are bindings to PQClean C code and are unmaintained)
- **Crypto Agility Pattern** — Architectural pattern using algorithm abstraction (interface/factory) so cryptographic algorithms can be swapped without changing application call sites (sizes, encodings, storage and negotiation still need review)
- **liboqs** — Open Quantum Safe C library; broadest PQC algorithm coverage (15+ algorithms); reference implementation for NIST PQC candidates; not FIPS-validated
- **PQClean** — Collection of clean, portable C reference implementations of PQC algorithms; no platform optimizations; intended as readable reference baseline
- **AWS-LC** — Amazon fork of BoringSSL with FIPS 140-3 validated modules; the AWS-LC 3 certificates (#5298, #5314) approve ML-KEM but not ML-DSA; backend for AWS SDK crypto and aws-lc-rs

## Cross-References

- `hsm-pqc` — PKCS#11 v3.2 HSM integration and C_EncapsulateKey/C_DecapsulateKey implementation detail
- `kms-pqc` — KMS-level key management for application secrets generated via these APIs
- `pki-workshop` — certificate lifecycle for ML-DSA keys generated via JCA/OpenSSL EVP
- `tls-basics` — TLS library configuration using OpenSSL EVP / JCA for PQC cipher suites
- `platform-eng-pqc` — CI/CD pipeline crypto: container signing with cosign (uses Go crypto APIs)
- `api-security-jwt` — JWT/JOSE algorithm migration using JCA and .NET System.Security.Cryptography
- `hybrid-crypto` — hybrid key exchange implementation patterns using these APIs
- Quiz: 15 questions (cda-001 through cda-015)
