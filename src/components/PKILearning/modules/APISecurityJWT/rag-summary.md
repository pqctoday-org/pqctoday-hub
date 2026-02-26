# API Security & JWT with PQC Module

This module covers the migration of JSON Web Token (JWT) infrastructure to post-quantum cryptography. JWTs are the foundation of modern API authentication, used in OAuth 2.0 access tokens, OpenID Connect ID tokens, and DPoP proofs. Every JWT signing algorithm in production today -- RS256 (RSA), ES256 (ECDSA P-256), and EdDSA (Ed25519) -- relies on mathematical problems that Shor's algorithm solves efficiently on a quantum computer. The module teaches PQC replacements for both JWT signing (ML-DSA via FIPS 204) and JWT encryption key agreement (ML-KEM via FIPS 203).

## Key Concepts

- **JWT/JWS/JWE fundamentals**: JWT compact serialization (RFC 7519), JWS signing (RFC 7515), JWE encryption (RFC 7516); three-part structure of base64url-encoded header, payload, and signature
- **Quantum vulnerability of current JWT algorithms**: RS256, ES256, EdDSA all broken by Shor's algorithm; ECDH-ES key agreement equally vulnerable; HMAC-based algorithms (HS256) remain quantum-safe but require shared secrets
- **Harvest-now-decrypt-later (HNDL) for JWTs**: Attackers can capture signed JWTs today and forge signatures once quantum computers arrive; especially concerning for long-lived tokens (refresh tokens, long-expiry ID tokens)
- **PQC JWT signing with ML-DSA**: IETF draft-ietf-jose-pqc defines new alg values; ML-DSA-44 (NIST Level 2, 2,420 B sig), ML-DSA-65 (Level 3, 3,309 B sig, recommended for general use), ML-DSA-87 (Level 5, 4,627 B sig)
- **PQC JWT key agreement with ML-KEM**: Replaces ECDH-ES in JWE; uses KEM encapsulation instead of Diffie-Hellman; ML-KEM.Encaps produces ciphertext and shared secret, then HKDF derives the Content Encryption Key
- **JOSE header changes**: Only the alg field changes (e.g., ES256 to ML-DSA-65); JOSE framework designed for algorithm agility
- **Token size implications**: ML-DSA-65 JWT is ~4.7 KB vs ~300 B for ES256 (16x increase); challenges with 8 KB HTTP header limits, 4 KB cookie limits, mobile bandwidth; DPoP with two PQC JWTs could exceed header limits
- **OAuth 2.0 / OIDC migration**: Coordinated changes needed across authorization servers (JWKS endpoints, token issuance), resource servers (signature verification, header size limits), and client applications (token storage, DPoP proofs)

## Workshop Activities

1. **JWT Inspector**: Decode and inspect JWT structure with algorithm vulnerability analysis; paste any JWT to see header, payload, and signature breakdown
2. **PQC JWT Signing**: Sign and verify JWTs with ML-DSA algorithms interactively; compare output sizes across security levels
3. **Hybrid JWT**: Create backwards-compatible JWTs with dual classical + PQC signatures for migration scenarios
4. **JWE Encryption**: Encrypt JWT payloads using ML-KEM key agreement with AES-GCM content encryption
5. **Token Size Analyzer**: Compare JWT sizes across all signing algorithms with visual bar charts; analyze impact on HTTP headers, cookies, and bandwidth

## Related Standards

- RFC 7519 (JWT), RFC 7515 (JWS), RFC 7516 (JWE), RFC 7518 (JWA)
- IETF draft-ietf-jose-pqc (PQC algorithms for JOSE)
- FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA)
- OAuth 2.0 (RFC 6749), OpenID Connect Core 1.0
- RFC 9449 (DPoP - Demonstrating Proof of Possession)
