# Hybrid and Composite Cryptography

## Overview

The Hybrid Cryptography module teaches how to combine classical and post-quantum algorithms for defense in depth during the quantum transition period. It covers why hybrid approaches are recommended (or mandated) by agencies like ANSSI and NIST, explains six X.509 certificate format approaches (pure PQC ML-DSA, pure PQC SLH-DSA, composite dual-algorithm, alt-sig/catalyst, related certificates, and chameleon), details hybrid KEM construction (X25519MLKEM768), and describes composite signature structures. The module addresses the fundamental dilemma that PQC algorithms are newer and less battle-tested than classical ones, yet HNDL threats make waiting dangerous.

## Key Concepts

- **Hybrid cryptography** combines classical and PQC algorithms so that security holds even if one component is broken
- **ANSSI mandate** requires hybrid mode during the PQC transition; PQC-only is not acceptable until algorithms mature (exception: hash-based signatures like SLH-DSA, LMS, XMSS may be standalone)
- **NIST SP 800-227** §1 frames hybrid key exchange as an _interim measure_ during the PQC transition and recommends it for TLS and other protocols; §4 specifies implementation requirements (implicit rejection, constant-time decapsulation, DRBG quality, side-channel resistance); migration to pure PQC is driven by algorithm maturation rather than calendar deadlines alone
- **SP 800-227 approved KEM parameter sets**: ML-KEM-512 → NIST Category 1 (AES-128 equivalent, constrained/IoT, short-lived sessions); ML-KEM-768 → Category 3 (AES-192 equivalent, default for TLS 1.3 and most internet traffic); ML-KEM-1024 → Category 5 (AES-256 equivalent, CNSA 2.0 and high-assurance/federal systems). HNDL risk and data-retention window should drive the choice — ciphertext that must stay secret past ~2035 should use Category 3 or 5
- **Hybrid combiner construction (SP 800-227 + SP 800-56C-Rev2)**: concatenation order is fixed per protocol (TLS 1.3 hybrid drafts use `classical_ss || pqc_ss`); SP 800-56C permits either HKDF (HMAC-based extractor with SHA-256/384/512) or KMAC128/256 as the combiner; dual-PRF assumption means the combined secret is safe as long as _either_ input looks uniform to the attacker, so a future break of ML-KEM or of X25519 alone does not break the session key; domain separation via unique context labels per protocol is mandatory to prevent cross-protocol replay
- **SP 800-227 §4 implementation requirements**: implicit rejection (FIPS 203 §7.1) returns a pseudorandom key on decapsulation failure instead of an error, making chosen-ciphertext probing useless; constant-time decapsulation is required for FIPS validation (execution time/memory access/branch behaviour must not depend on secret bits or ciphertext validity); encapsulation must use an approved SP 800-90A/B/C DRBG for the 32-byte `m` — weak RNG collapses ML-KEM security to zero; hybrid side-channel hardening must cover both halves (a timing leak in X25519 or ML-KEM-768 compromises the combined session key)
- **CNSA 2.0** (NSA) mandates PQC adoption for national security systems by 2030, with hybrid key exchange required during the transition window
- **RFC 9794** standardizes terminology for hybrid schemes — "composite" (single OID, both-must-verify) vs "non-composite" (parallel independent algorithms); establishes "PQ/T" (Post-Quantum / Traditional) naming
- **Six certificate format approaches**:
  - **Pure PQC (ML-DSA)** — standard single-algorithm X.509 using ML-DSA signatures; OIDs standardized in RFC 9881; ready today in OpenSSL 3.x
  - **Pure PQC (SLH-DSA)** — hash-based signature X.509 certificates; OIDs in RFC 9909; ANSSI allows standalone use without hybrid
  - **Composite (dual-algorithm)** — single composite OID identifies the algorithm pair; both signatures must verify; defined in draft-ietf-lamps-pq-composite-sigs; strongest security model
  - **Alt-Sig / Catalyst** — classical primary cert with PQC key and signature in X.509 extensions (SubjectAltPublicKeyInfo 2.5.29.72, AltSignatureAlgorithm 2.5.29.73, AltSignatureValue 2.5.29.74); legacy verifiers ignore extensions; defined in draft-ietf-lamps-cert-binding-for-multi-auth
  - **Related Certificates (RFC 9763)** — two separate independent certificates bound by a SHA-256 hash in a RelatedCertificate extension; each certificate is independently valid; full backward compatibility
  - **Chameleon Certificates** — single cert with a DeltaCertificateDescriptor extension encoding differences to reconstruct a partner cert; more space-efficient than related certs; defined in draft-bonnell-lamps-chameleon-certs
- **X25519MLKEM768** — the leading hybrid KEM combining Curve25519 ECDH with ML-KEM-768; already deployed in Chrome, Cloudflare, and AWS; combined shared secret derived via KDF(X25519_ss || ML-KEM_ss)
- **Other hybrid KEM variants**: SecP256r1MLKEM768 (P-256 + ML-KEM-768, FIPS-approved classical curve), SecP384r1MLKEM1024 (P-384 + ML-KEM-1024, NIST Level 5)
- **Composite signatures** combine ML-DSA with ECDSA or Ed25519 in a single operation; both must verify; single OID simplifies handling; prevents downgrade attacks
- **Size trade-offs**: composite signatures are approximately 3.4 KB versus 72 bytes for ECDSA alone
- **Hybrid KEMs in TLS 1.3**: X25519MLKEM768 integrates via the key_share extension; ClientHello key_share grows from 32 bytes (X25519) to 1,216 bytes (38× increase); may push ClientHello beyond a single TCP packet; ML-KEM-768 encap/decap adds ~0.1–0.3 ms per handshake; real-world measurements show <1% latency increase at P50

## Workshop / Interactive Activities

The workshop has 5 hands-on steps:

1. **Hybrid Key Generation** — generate and compare classical, pure PQC, and hybrid key pairs, observing key size differences across categories
2. **Hybrid Encryption and Signing Demo** — perform KEM encapsulation and digital signature operations in hybrid mode, comparing classical and PQC outputs
3. **Hybrid CA Setup** — set up a hybrid certificate authority with both classical and PQC keys
4. **Hybrid Certificate Formats** — generate and compare six X.509 approaches: Pure PQC (ML-DSA-65), Pure PQC (SLH-DSA-128s), Composite (ML-DSA-65 + ECDSA), Alt-Sig/Catalyst (ECDSA primary + ML-DSA extensions), Related Certs (RFC 9763), and Chameleon Certificates
5. **Certificate Inspector** — deep-dive into generated certificates with Tree, Raw, and Size views; also inspect real IETF Hackathon reference certificates from the pqc-certificates test vector repository

## IETF Reference Certificates

The Certificate Inspector (Step 5) includes a toggle to view real DER-encoded hybrid certificates from trusted sources. Five test vectors are embedded:

- **Composite (MLDSA65-ECDSA-P256-SHA512)** — OID 1.3.6.1.5.5.7.6.45, generated by Bouncy Castle (IETF Hackathon r5); demonstrates composite OID backward incompatibility (OpenSSL shows "UNKNOWN")
- **Alt-Sig / Catalyst (ECDSA-P256 + ML-DSA-44 alt-sig)** — generated by Bouncy Castle (IETF Hackathon r5); uses alt-sig extensions 2.5.29.72 (SubjectAltPublicKeyInfo), 2.5.29.73 (AltSignatureAlgorithm), 2.5.29.74 (AltSignatureValue); classical primary with PQC in extensions
- **Pure ML-DSA-65** — OID 2.16.840.1.101.3.4.3.18, generated by OpenSSL 3.5 (IETF Hackathon r5); reference for FIPS 204 cert format
- **Pure SLH-DSA-SHA2-128s** — OID 2.16.840.1.101.3.4.3.20, from RFC 9909 Appendix C.3; hash-based signature cert (8,241 bytes); ANSSI-approved for standalone use
- **Chameleon (ECDSA-P256 outer + ML-DSA-44 delta)** — generated by Bouncy Castle (IETF Hackathon r5); uses DeltaCertificateDescriptor extension 2.16.840.1.114027.80.6.1

Note: No official test vector exists for Related Certificates (RFC 9763) — the format is purely structural (a binding hash in an extension), not a cryptographic algorithm, so no KAT is applicable. The workshop generates RFC 9763 pairs programmatically.

## Related Standards

- RFC 9881 (ML-DSA OIDs in X.509)
- RFC 9802 (LMS/XMSS stateful hash-based signature OIDs in X.509)
- RFC 9909 (SLH-DSA stateless hash-based signature OIDs in X.509)
- RFC 9763 (Related Certificates for PKI)
- draft-ietf-lamps-pq-composite-sigs (Composite Signatures)
- draft-ietf-lamps-cert-binding-for-multi-auth (Alt-Sig / Catalyst)
- draft-bonnell-lamps-chameleon-certs (Chameleon Certificates)
- RFC 9794 (Terminology for Post-Quantum Traditional Hybrid Schemes)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms)
- CNSA 2.0 (NSA Commercial National Security Algorithm Suite 2.0)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- ANSSI Hybrid Cryptography Guidance
- [IETF Hackathon pqc-certificates](https://github.com/IETF-Hackathon/pqc-certificates)
