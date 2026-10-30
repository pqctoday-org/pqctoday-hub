### What This Is About

TLS 1.3 secured the internet by enforcing modern forward secrecy and 1-RTT handshakes. Upgrading it for PQC involves integrating lattice-based Key Encapsulation Mechanisms (ML-KEM) and signatures (ML-DSA). Running old and new algorithms side by side during the transition also creates a new question: could a connection end up classical-only when both sides support PQC?

### Why It Matters

Post-quantum algorithms demand much larger ciphertexts and keys than classical ECDH (like X25519). Notably, replacing classical certs with ML-DSA certificate chains adds several kilobytes to every handshake, threatening the scalability of billions of daily web connections.

TLS 1.3 signs and MACs the whole handshake, so an attacker who deletes the post-quantum option from the client's message is detected and the connection fails. The real downgrade risks are elsewhere: products that retry without post-quantum after a failed attempt, clients that don't know whether a server supports PQC, and settings that accept a classical-only connection.

### The Key Takeaway

The industry is already deploying "Hybrid" key exchange (X25519MLKEM768) to protect traffic from Harvest-Now-Decrypt-Later attacks. To stop deliberate fallbacks from being abused, clients can remember that a server supported PQC on a previous visit. Browsers do this locally ("PQ Lock"), and PQC Continuity is an individual Internet-Draft (one proposal, not adopted by the TLS working group) for a TLS extension that lets a client cache a server's declared commitment to present PQC or composite certificates for a specified duration. Neither can protect the very first visit.

### What's Happening

Major browsers and CDN providers are already deploying hybrid key exchange (X25519MLKEM768) in production TLS 1.3, and the IETF published it as RFC 10024. Downgrade-memory proposals such as `draft-sheffer-tls-pqc-continuity` are still individual drafts under discussion, while the IETF PLANTS working group develops Merkle Tree Certificates to address certificate bloat.
