# Hybrid and Composite Cryptography

## Overview

The Hybrid Cryptography module teaches how to combine classical and post-quantum algorithms for defense in depth during the quantum transition period. It covers why hybrid approaches are recommended (or mandated) by agencies like ANSSI and NIST, explains three X.509 certificate format approaches (pure PQC, composite dual-algorithm, and parallel/alt-sig), details hybrid KEM construction (X25519MLKEM768), and describes composite signature structures. The module addresses the fundamental dilemma that PQC algorithms are newer and less battle-tested than classical ones, yet HNDL threats make waiting dangerous.

## Key Concepts

- **Hybrid cryptography** combines classical and PQC algorithms so that security holds even if one component is broken
- **ANSSI mandate** requires hybrid mode during the PQC transition; PQC-only is not acceptable until algorithms mature (exception: hash-based signatures like SLH-DSA, LMS, XMSS may be standalone)
- **NIST SP 800-227** recommends hybrid key exchange for TLS and other protocols during the transition
- **Three certificate format approaches**:
  - **Pure PQC** — standard single-algorithm X.509 using PQC signatures; ML-DSA OIDs standardized in RFC 9881, SLH-DSA/LMS in RFC 9802; ready today in OpenSSL 3.x
  - **Composite (dual-algorithm)** — single composite OID identifies the algorithm pair; both signatures must verify; defined in draft-ietf-lamps-pq-composite-sigs-14; strongest security model
  - **Parallel (alt-sig)** — PQC primary signature with classical key/signature in X.509 extensions (OIDs 2.5.29.73/74); maximizes backward compatibility
- **X25519MLKEM768** — the leading hybrid KEM combining Curve25519 ECDH with ML-KEM-768; already deployed in Chrome, Cloudflare, and AWS; combined shared secret derived via KDF(X25519_ss || ML-KEM_ss)
- **Other hybrid KEM variants**: SecP256r1MLKEM768 (P-256 + ML-KEM-768, FIPS-approved classical curve), SecP384r1MLKEM1024 (P-384 + ML-KEM-1024, NIST Level 5)
- **Composite signatures** combine ML-DSA with ECDSA or Ed25519 in a single operation; both must verify; single OID simplifies handling; prevents downgrade attacks
- **Size trade-offs**: composite signatures are approximately 3.4 KB versus 72 bytes for ECDSA alone

## Workshop / Interactive Activities

The workshop has 3 hands-on steps:

1. **Hybrid Key Generation** — generate and compare classical, pure PQC, and hybrid key pairs, observing key size differences across categories
2. **Hybrid Encryption and Signing Demo** — perform KEM encapsulation and digital signature operations in hybrid mode, comparing classical and PQC outputs
3. **Composite Certificate Viewer** — inspect and compare classical X.509 certificates, pure PQC certificates (RFC 9881), and composite certificate formats with ASN.1 structure visualization

## Related Standards

- RFC 9881 (ML-DSA OIDs in X.509)
- RFC 9802 (SLH-DSA and LMS OIDs in X.509)
- draft-ietf-lamps-pq-composite-sigs (Composite Signatures)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms)
- FIPS 203 (ML-KEM)
- ANSSI Hybrid Cryptography Guidance
