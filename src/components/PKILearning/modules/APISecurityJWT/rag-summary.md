# API Security & JWT with PQC Module

This module covers the migration of JSON Web Token (JWT) infrastructure to post-quantum cryptography and the JWT validation practices that migration depends on. JWTs carry OpenID Connect ID tokens, JWT-format OAuth 2.0 access tokens (RFC 9068), client assertions and DPoP proofs. The widely deployed asymmetric JWT signature algorithms -- RS256 (RSA), ES256 (ECDSA P-256) and EdDSA (Ed25519) -- rely on problems Shor's algorithm would solve on a cryptographically relevant quantum computer (CRQC); none is broken today. The module teaches ML-DSA signing (FIPS 204, RFC 9964), the draft SLH-DSA and composite signatures, and how ML-KEM (FIPS 203) enters JWE through HPKE.

## Key Concepts

- **JWT/JWS/JWE fundamentals**: JWT (RFC 7519), JWS signing (RFC 7515), JWE encryption (RFC 7516); a JWS is header.payload.signature, base64url-encoded and readable by anyone holding it
- **Quantum exposure of current algorithms**: RS256, ES256, EdDSA and ECDH-ES would fall to Shor's algorithm on a CRQC; HMAC-based HS256 is symmetric, and Grover's algorithm only reduces its effective strength, so a 256-bit key remains adequate
- **Two different threats**: signed JWTs are a FORGERY risk, not harvest-now-decrypt-later -- their claims are not encrypted, and the danger is a CRQC recovering a signing key that verifiers still trust, so key trust lifetime (JWKS rotation, pinned keys, long-term signature evidence) is what matters. HNDL applies to JWE using ECDH-ES and to the TLS channel that carries bearer tokens
- **Refresh tokens** are usually opaque handles looked up by the authorization server; a quantum computer cannot forge them unless they are themselves signed tokens
- **PQC JWT signing with ML-DSA**: RFC 9964 (May 2026) registers ML-DSA-44/65/87 and the AKP JWK type (32-byte seed private key). ML-DSA-44 is NIST category 2 (2,420 B signature), ML-DSA-65 category 3 (3,309 B; this module's default example, not a NIST recommendation), ML-DSA-87 category 5 (4,627 B; the level CNSA 2.0 requires)
- **SLH-DSA for JOSE**: draft-ietf-cose-sphincs-plus-10 (AD Evaluation) registers only SLH-DSA-SHA2-128s and SLH-DSA-SHAKE-128s; other parameter sets are not JOSE algorithms
- **Composite (PQ/T hybrid) signatures**: draft-ietf-jose-pq-composite-sigs-04 -- one alg (e.g. ML-DSA-65-Ed25519), the ML-DSA signature followed directly by the traditional one, both over a domain-separated message representative M'; both must verify
- **PQC encryption for JWE**: goes through HPKE -- draft-ietf-jose-hpke-encrypt (RFC Editor queue) plus the ML-KEM and ML-KEM+X25519 suites in draft-ietf-jose-hpke-pq-pqt; the HPKE suite fixes the KDF and AEAD (SHAKE256 and AES-256-GCM for the ML-KEM suites). In Integrated Encryption the header carries only "alg" (e.g. HPKE-12 = ML-KEM-768, HPKE-9 = ML-KEM-768 + X25519) with no "enc" and no "ek"; the JWE Encrypted Key is the HPKE encapsulated secret and the IV and tag are empty. An earlier direct-KEM JOSE draft (draft-ietf-jose-pqc-kem) was narrowed to COSE in -06
- **What migration changes**: the token format and compact serialization stay the same and the alg value changes, but keys (AKP JWKs, ~1.3-2.6 KB public keys), per-key algorithm allowlists, size limits, library support and the classical-key retirement plan all change too
- **Validation basics PQC does not change (RFC 8725, RFC 9700, RFC 9068)**: pin the algorithm to the key and reject "none" or unexpected algs; resolve keys from a configured JWKS, never an unvetted jku/x5u; validate iss, aud, exp, nbf (and jti for replay); use explicit typing such as typ "at+jwt"; in a nested JWT validate both layers; keep decoding, signature verification, claims validation and authorization separate. New registrations are fully specified (RFC 9864), so alg alone names the algorithm and parameters
- **Token size implications**: an ML-DSA-65 JWT is ~4.7 KB vs ~300 B for ES256 (the signature alone is ~51x larger); it uses most of a common 8 KB header limit and does not fit a ~4 KB cookie -- keep tokens server-side behind an opaque session cookie or use reference tokens, and measure real limits
- **OAuth 2.0 / OIDC migration**: coordinated changes across authorization servers (JWKS, token issuance), resource servers (verification, allowlists, header limits) and clients (token storage, DPoP key binding)

## Workshop Activities

1. **JWT Inspector**: Decode a JWT and see what its header claims; the algorithm class shown is what the token declares, not proof of protection
2. **PQC JWT Signing**: Sign and verify JWTs with ML-DSA (RFC 9964 vectors), SLH-DSA (draft-ietf-cose-sphincs-plus-10 vectors) and composite algorithms; compare sizes
3. **Hybrid JWT**: Build a real nested JWT (ES256 inner token as the payload of an ML-DSA-65 outer JWT, cty "JWT", both layers verified) or a composite ML-DSA-65-Ed25519 JWT checked against draft-ietf-jose-pq-composite-sigs-04's published examples
4. **JWE Encryption**: Encrypt and decrypt a JWT payload as an HPKE JWE with HPKE-12 (ML-KEM-768) or HPKE-9 (ML-KEM-768 + X25519, the X-Wing hybrid), either in the browser or entirely inside SoftHSM3 (PKCS#11 CKM_HPKE with the SHAKE256 key schedule and AES-256-GCM on a non-extractable key), and decrypt the published example of draft-ietf-jose-hpke-pq-pqt-01 (labeled experimental: work-in-progress draft)
5. **Token Size Analyzer**: Compare JWT sizes across signing algorithms and their impact on headers, cookies and bandwidth
6. **Attack Lab**: Issue a real ML-DSA-65 access token and try "alg": "none", edited claims, a token for another API, an expired token and an ID token used as an access token; a strict RFC 8725 validator (algorithm pinned to the key, then iss, aud, exp and typ) rejects every attack, while a naive verifier that trusts the header and checks no claims accepts four of the five

## Related Standards

- RFC 7519 (JWT), RFC 7515 (JWS), RFC 7516 (JWE), RFC 7517 (JWK), RFC 7518 (JWA)
- RFC 9964 (ML-DSA for JOSE and COSE), RFC 9864 (Fully-Specified Algorithms for JOSE and COSE)
- draft-ietf-cose-sphincs-plus-10 (SLH-DSA), draft-ietf-jose-pq-composite-sigs-04 (composite signatures)
- draft-ietf-jose-hpke-encrypt and draft-ietf-jose-hpke-pq-pqt (PQ encryption for JWE)
- RFC 8725 (JWT Best Current Practices), RFC 9700 (OAuth 2.0 Security BCP), RFC 9068 (JWT access tokens)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- OAuth 2.0 (RFC 6749), OpenID Connect Core 1.0, RFC 9449 (DPoP)
