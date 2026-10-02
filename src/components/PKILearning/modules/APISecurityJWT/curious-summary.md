### What This Is About

Modern API authentication runs on JSON Web Tokens (JWT). These tokens securely pass claims using a header, payload, and a cryptographic signature (JWS) or encryption layer (JWE). Today, signed tokens mostly use classical algorithms like ES256 (ECDSA P-256) or RS256 (RSA), and encrypted ones use classical key agreement like ECDH-ES. The token's header names which algorithm protects it.

### Why It Matters

Shor's algorithm running on a future, cryptographically relevant quantum computer would break these classical mechanisms. For API security, that means an attacker could forge JWT signatures with any key verifiers still trust—impersonating users and minting OAuth 2.0 access tokens. Encrypted API traffic recorded today could be decrypted later (harvest now, decrypt later); signed tokens are not encrypted, so for them the risk is forgery, not decryption. Migrating means moving signing to ML-DSA and encryption to ML-KEM (through HPKE for JWE).

### The Key Takeaway

While the token format doesn't change, the math inside does—and it carries a large size penalty, along with new key formats and verifier policies. An ML-DSA-65 signature is 3,309 bytes compared to a 64-byte ES256 signature, representing a ~51x size increase. This enormous token size can immediately break default 8 KB HTTP headers, exceed 4 KB browser cookie limits, and spike bandwidth requirements for mobile APIs. Engineering teams must overhaul caching and session storage architectures to accommodate this PQC footprint.

### What's Happening

ML-DSA for JWS is now a standard (RFC 9964, May 2026). SLH-DSA, composite signatures and HPKE-based ML-KEM encryption for JWE are still IETF drafts, and engineering teams are prototyping PQC token flows to measure the size impact on their infrastructure.
