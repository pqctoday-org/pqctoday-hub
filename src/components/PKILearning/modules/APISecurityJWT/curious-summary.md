### What This Is About

Modern API authentication runs on JSON Web Tokens (JWT). These tokens securely pass claims using a header, payload, and a cryptographic signature (JWS) or encryption layer (JWE). Today, every token in production is signed using classical algorithms like ES256 (ECDSA P-256) or RS256 (RSA), and encrypted using classical key agreement methods like ECDH-ES. The JOSE standard allows exactly which algorithm generates the token's protective layer.

### Why It Matters

Shor's algorithm running on a future quantum computer breaks these classical mechanisms outright. For API security, this means adversaries could instantly forge JWT signatures—allowing them to seamlessly impersonate any user, bypass authorization boundaries, and forge OAuth 2.0 access tokens. Similarly, encrypted API traffic could be decrypted retroactively via HNDL attacks. Migrating to PQC requires swapping these algorithms inside the JOSE headers to ML-DSA (for signing) and ML-KEM (for encapsulation).

### The Key Takeaway

While the JSON framework doesn't change, the math inside does—and it carries a massive size penalty. An ML-DSA-65 signature is 3,309 bytes compared to a 64-byte ES256 signature, representing a ~51x size increase. This enormous token size can immediately break default 8 KB HTTP headers, exceed 4 KB browser cookie limits, and spike bandwidth requirements for mobile APIs. Engineering teams must overhaul caching and session storage architectures to accommodate this PQC footprint.
