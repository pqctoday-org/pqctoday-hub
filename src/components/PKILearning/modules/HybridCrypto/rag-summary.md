# Hybrid and Composite Cryptography

## Overview

The Hybrid Cryptography module teaches how to combine classical and post-quantum algorithms for defense in depth during the quantum transition period. It covers why hybrid approaches are recommended (or mandated) by agencies like ANSSI and NIST, explains seven X.509 certificate formats (pure PQC ML-DSA, pure PQC SLH-DSA, composite dual-algorithm, alt-sig/catalyst, related certificates, pure ML-KEM, and composite ML-KEM) plus chameleon certificates as a historical design, details hybrid KEM construction (X25519MLKEM768), and describes composite signature structures. The module addresses the fundamental dilemma that PQC algorithms are newer and less battle-tested than classical ones, yet HNDL threats make waiting dangerous.

## Key Concepts

- **Hybrid cryptography** combines classical and PQC algorithms so that security holds even if one component is broken
- **ANSSI mandate** requires hybrid mode during the PQC transition; PQC-only is not acceptable until algorithms mature (exception: hash-based signatures like SLH-DSA, LMS, XMSS may be standalone)
- **NIST SP 800-227** §1 frames hybrid key exchange as an _interim measure_ during the PQC transition and recommends it for TLS and other protocols; §4 specifies implementation requirements (implicit rejection, constant-time decapsulation, DRBG quality, side-channel resistance); migration to pure PQC is driven by algorithm maturation rather than calendar deadlines alone
- **SP 800-227 approved KEM parameter sets**: ML-KEM-512 → NIST Category 1 (AES-128 equivalent, constrained/IoT, short-lived sessions); ML-KEM-768 → Category 3 (AES-192 equivalent, default for TLS 1.3 and most internet traffic); ML-KEM-1024 → Category 5 (AES-256 equivalent, CNSA 2.0 and high-assurance/federal systems). HNDL risk and data-retention window should drive the choice — ciphertext that must stay secret past ~2035 should use Category 3 or 5
- **Hybrid combiner construction (SP 800-227 + SP 800-56C-Rev2)**: concatenation order is fixed per protocol (TLS 1.3 hybrid drafts use `classical_ss || pqc_ss`); SP 800-56C permits either HKDF (HMAC-based extractor with SHA-256/384/512) or KMAC128/256 as the combiner; dual-PRF assumption means the combined secret is safe as long as _either_ input looks uniform to the attacker, so a future break of ML-KEM or of X25519 alone does not break the session key; domain separation via unique context labels per protocol is mandatory to prevent cross-protocol replay
- **SP 800-227 §4 implementation requirements**: implicit rejection (FIPS 203 §7.1) returns a pseudorandom key on decapsulation failure instead of an error, making chosen-ciphertext probing useless; constant-time decapsulation is required for FIPS validation (execution time/memory access/branch behaviour must not depend on secret bits or ciphertext validity); encapsulation must use an approved SP 800-90A/B/C DRBG for the 32-byte `m` — weak RNG collapses ML-KEM security to zero; hybrid side-channel hardening must cover both halves (a timing leak in X25519 or ML-KEM-768 compromises the combined session key)
- **CNSA 2.0** (NSA) mandates PQC adoption for national security systems by 2030, with hybrid key exchange required during the transition window
- **RFC 9794** standardizes terminology for hybrid schemes — "composite" (single OID, both-must-verify) vs "non-composite" (parallel independent algorithms); establishes "PQ/T" (Post-Quantum / Traditional) naming
- **Subject key vs. certificate signature**: the subject public-key algorithm and the certificate-signature algorithm are independent. An ML-KEM key cannot sign, so an ML-KEM certificate is always issued by a separate signing-capable CA (ML-DSA, ECDSA, RSA). The ML-KEM subject key performs encapsulation/decapsulation; the issuer key signs the certificate
- **Seven certificate formats in the main comparison** (five signature formats + two KEM formats):
  - **Pure PQC (ML-DSA)** — standard single-algorithm X.509 using ML-DSA signatures; OIDs standardized in RFC 9881; the workshop is tested with OpenSSL 3.6.3
  - **Pure PQC (SLH-DSA)** — hash-based signature X.509 certificates; OIDs in RFC 9909; ANSSI allows standalone use without hybrid
  - **Composite (dual-algorithm)** — single composite OID identifies the algorithm pair; both signatures must verify; defined in draft-ietf-lamps-pq-composite-sigs-19, approved and in the RFC Editor queue (no RFC number yet)
  - **Alt-Sig / Catalyst** — classical primary cert with PQC key and signature in X.509 extensions (SubjectAltPublicKeyInfo 2.5.29.72, AltSignatureAlgorithm 2.5.29.73, AltSignatureValue 2.5.29.74); legacy verifiers ignore the extensions; defined in ITU-T X.509 (2019) §7.2.2 and §9.8; relying-party policy decides whether one or both signatures must verify
  - **Related Certificates (RFC 9763)** — a NEW certificate (Cert B) carries a RelatedCertificate extension holding the hash of the complete final DER of an EXISTING certificate (Cert A); the binding is one-way and Cert A is never modified; the CA issues Cert B only after a relatedCertRequest proves possession of Cert A's key; a protocol may use either certificate or both — RFC 9763 does not require both
  - **Pure PQC KEM (ML-KEM, RFC 9935)** — an ML-KEM public key in X.509; if keyUsage is present, keyEncipherment must be the only bit; the certificate is CA-issued, never self-signed; the key is used e.g. in CMS KEMRecipientInfo (RFC 9629, ML-KEM in CMS: RFC 9936)
  - **Composite KEM** — ML-KEM plus a classical KEM under one OID, ML-KEM first; defined in draft-ietf-lamps-pq-composite-kem-21, in IESG Evaluation (still an Internet-Draft)
- **Historical design — Chameleon Certificates**: a single cert with a DeltaCertificateDescriptor extension encoding the differences needed to rebuild a paired cert; draft-bonnell-lamps-chameleon-certs-07 is an expired individual draft never adopted by the LAMPS working group; kept for study only and not recommended for new deployments
- **Watchlist**: FN-DSA (planned FIPS 206, not yet final) has an IETF certificate draft, draft-ietf-lamps-fn-dsa-certificates, whose OIDs are still TBD — no deployable FN-DSA certificate exists yet
- **X25519MLKEM768** — the leading hybrid KEM combining Curve25519 ECDH with ML-KEM-768; already deployed in Chrome, Cloudflare, and AWS; combined shared secret derived via KDF(X25519_ss || ML-KEM_ss)
- **Other hybrid KEM variants**: SecP256r1MLKEM768 (P-256 + ML-KEM-768, FIPS-approved classical curve), SecP384r1MLKEM1024 (P-384 + ML-KEM-1024, NIST Level 5)
- **Composite signatures** combine ML-DSA with ECDSA or Ed25519 in a single operation; both must verify; single OID simplifies handling; prevents downgrade attacks
- **Size trade-offs**: composite signatures are approximately 3.4 KB versus 72 bytes for ECDSA alone
- **Hybrid KEMs in TLS 1.3**: X25519MLKEM768 integrates via the key_share extension; ClientHello key_share grows from 32 bytes (X25519) to 1,216 bytes (38× increase); may push ClientHello beyond a single TCP packet; ML-KEM-768 encap/decap adds ~0.1–0.3 ms per handshake; real-world measurements show <1% latency increase at P50
- **Hybrid TLS negotiation downgrade risk**: during the transition period an active MITM adversary can strip the ML-KEM entry from the ClientHello key_share, forcing the server to fall back to classical X25519 — even when both endpoints support hybrid; this threat is addressed at the TLS protocol layer by PQ Lock and PQC Continuity (`draft-sheffer-tls-pqc-continuity`), covered in depth in the TLS 1.3 Basics module; composite signatures (single composite OID) prevent the analogous downgrade of authentication because both signature halves must verify together

## Workshop / Interactive Activities

The workshop has 5 hands-on steps:

1. **Hybrid Key Generation** — generate and compare classical, pure PQC, and hybrid key pairs, observing key size differences across categories
2. **Hybrid Encryption and Signing Demo** — perform KEM encapsulation and digital signature operations in hybrid mode, comparing classical and PQC outputs
3. **Hybrid CA Setup** — set up a hybrid certificate authority with both classical and PQC keys
4. **Hybrid Certificate Formats** — generate and compare seven X.509 formats: Pure PQC (ML-DSA-65), Pure PQC (SLH-DSA-128s), Composite (ML-DSA-65 + ECDSA), Alt-Sig/Catalyst (ECDSA primary + ML-DSA extensions), Related Certs (RFC 9763), Pure ML-KEM-768 (RFC 9935) and Composite ML-KEM; Chameleon is available separately under Historical designs
5. **Certificate Inspector** — deep-dive into generated certificates with Tree, Raw, and Size views; also inspect real IETF Hackathon reference certificates from the pqc-certificates test vector repository

## IETF Reference Certificates

The Certificate Inspector (Step 5) includes a toggle to view real DER-encoded hybrid certificates from trusted sources. Five test vectors are embedded:

- **Composite (MLDSA65-ECDSA-P256-SHA512)** — OID 1.3.6.1.5.5.7.6.45, generated by Bouncy Castle (IETF Hackathon r5); demonstrates composite OID backward incompatibility (OpenSSL shows "UNKNOWN")
- **Alt-Sig / Catalyst (ECDSA-P256 + ML-DSA-44 alt-sig)** — generated by Bouncy Castle (IETF Hackathon r5); uses alt-sig extensions 2.5.29.72 (SubjectAltPublicKeyInfo), 2.5.29.73 (AltSignatureAlgorithm), 2.5.29.74 (AltSignatureValue); classical primary with PQC in extensions
- **Pure ML-DSA-65** — OID 2.16.840.1.101.3.4.3.18, generated by OpenSSL 3.5 (IETF Hackathon r5); reference for FIPS 204 cert format
- **Pure SLH-DSA-SHA2-128s** — OID 2.16.840.1.101.3.4.3.20, from RFC 9909 Appendix C.3; hash-based signature cert (8,241 bytes); ANSSI-approved for standalone use
- **Chameleon (ECDSA-P256 outer + ML-DSA-44 delta)** — historical design (expired draft); generated by Bouncy Castle (IETF Hackathon r5); uses DeltaCertificateDescriptor extension 2.16.840.1.114027.80.6.1

Note: No official test vector exists for Related Certificates (RFC 9763) — the format is purely structural (a binding hash in an extension), not a cryptographic algorithm, so no KAT is applicable. The workshop generates RFC 9763 pairs programmatically.

## Related Standards

- RFC 9881 (ML-DSA OIDs in X.509)
- RFC 9802 (LMS/XMSS stateful hash-based signature OIDs in X.509)
- RFC 9909 (SLH-DSA stateless hash-based signature OIDs in X.509)
- RFC 9763 (Related Certificates for PKI)
- draft-ietf-lamps-pq-composite-sigs-19 (Composite Signatures, RFC Editor queue)
- RFC 9935 (ML-KEM OIDs in X.509)
- draft-ietf-lamps-pq-composite-kem-21 (Composite ML-KEM, IESG Evaluation)
- RFC 9629 (CMS KEMRecipientInfo) and RFC 9936 (ML-KEM in CMS)
- ITU-T X.509 (2019) §7.2.2 and §9.8 — Alt-Sig / Catalyst extensions (2.5.29.72/73/74)
- draft-bonnell-lamps-chameleon-certs-07 (Chameleon Certificates — expired individual draft, historical)
- draft-ietf-lamps-fn-dsa-certificates (FN-DSA in X.509 — WG draft, OIDs TBD; watchlist)
- RFC 9794 (Terminology for Post-Quantum Traditional Hybrid Schemes)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms)
- CNSA 2.0 (NSA Commercial National Security Algorithm Suite 2.0)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- ANSSI Hybrid Cryptography Guidance
- [IETF Hackathon pqc-certificates](https://github.com/IETF-Hackathon/pqc-certificates)
