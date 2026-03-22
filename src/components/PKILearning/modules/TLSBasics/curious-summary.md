### What This Is About

TLS 1.3 secured the internet by enforcing modern forward secrecy and 1-RTT handshakes. Upgrading it for PQC involves integrating lattice-based Key Encapsulation Mechanisms (ML-KEM) and signatures (ML-DSA).

### Why It Matters

Post-quantum algorithms demand much larger ciphertexts and keys than classical ECDH (like X25519). Notably, replacing classical certs with ML-DSA certificate chains adds several kilobytes to every handshake, threatening the scalability of billions of daily web connections.

### The Key Takeaway

The industry is already deploying "Hybrid" key exchange (X25519MLKEM768) to protect traffic from Harvest-Now-Decrypt-Later attacks. To solve the signature bloat problem, engineers are developing Merkle Tree Certificates (MTCs) to replace heavy certificate chains with lightweight proofs.
