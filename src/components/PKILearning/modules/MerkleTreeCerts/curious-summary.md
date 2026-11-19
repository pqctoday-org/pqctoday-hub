### What This Is About

Post-quantum signatures can make TLS authentication messages larger. Merkle Tree Certificates (MTCs) are an IETF PLANTS working-group proposal that replaces issuer signatures carried in individual certificates with log inclusion proofs. A TLS handshake still carries the server's public key and CertificateVerify signature.

### Why It Matters

Larger authentication messages may affect clients or networks with strict size, memory, or latency limits. The effect depends on the chain, signature algorithms, client, and transport. This module's byte comparisons are an explicit component model, not measured whole-handshake performance.

MTCs also integrate issuance logging. Their transparency value depends on relying-party cosigner policy, log access, and monitoring. The current draft does not say that a fallback to a classical certificate is automatically detected just because a domain previously used an MTC.

### The Key Takeaway

For the module's stated leaf-plus-intermediate example, ML-DSA-44 has 10,522 B of modeled authentication components in the traditional chain, 6,736 B with a standalone MTC, and 4,668 B with a landmark-relative MTC. The standalone format carries cosignatures; the landmark-relative format can omit certificate cosignatures when the relying party has pre-synced the trusted subtree. The TLS handshake still carries the server key and CertificateVerify signature. These are modeled bytes, not a universal percentage of total handshake traffic.

### What's Happening

As of 18 November 2026, the latest document is [draft-ietf-plants-merkle-tree-certs-08](https://datatracker.ietf.org/doc/html/draft-ietf-plants-merkle-tree-certs-08), published 2 November. It is an active working-group Internet-Draft intended for the Standards Track, not an RFC. Versions -07 and -08 are wire-compatible. Chrome has published draft quantum-resistant root-program policy and test guidance; its early feasibility experiment backed MTC connections with a traditional trusted X.509 certificate. Those testing materials do not establish general production trust or deployment to all Chrome users.
