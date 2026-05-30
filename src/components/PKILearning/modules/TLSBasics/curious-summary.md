### What This Is About

TLS 1.3 secured the internet by enforcing modern forward secrecy and 1-RTT handshakes. Upgrading it for PQC involves integrating lattice-based Key Encapsulation Mechanisms (ML-KEM) and signatures (ML-DSA). But deploying PQC during the transition period introduces a new threat: active downgrade attacks.

### Why It Matters

Post-quantum algorithms demand much larger ciphertexts and keys than classical ECDH (like X25519). Notably, replacing classical certs with ML-DSA certificate chains adds several kilobytes to every handshake, threatening the scalability of billions of daily web connections.

But there is also an active security risk during the transition: an attacker positioned between a client and server can strip the ML-KEM entry from the client's key exchange list, forcing both sides to fall back to quantum-vulnerable ECDH — even when both endpoints fully support PQC. This is the quantum downgrade attack, analyzed by Bas Westerbaan (Cloudflare Research).

### The Key Takeaway

The industry is already deploying "Hybrid" key exchange (X25519MLKEM768) to protect traffic from Harvest-Now-Decrypt-Later attacks. But hybrid alone isn't enough: an attacker can downgrade a hybrid-capable connection back to classical-only. The layered defense is: PQ Lock (browser caches "this server does PQC"), then PQC Continuity — a server-signed promise with a duration (the "downgrade limit") that clients enforce even across browser restarts.

### What's Happening

Major browsers and CDN providers are already deploying hybrid key exchange (X25519MLKEM768) in production TLS 1.3. Cloudflare's Bas Westerbaan and the IETF are standardizing downgrade protections (`draft-sheffer-tls-pqc-continuity`) while the IETF PLANTS working group develops Merkle Tree Certificates to address both certificate bloat and rollback detection at internet scale.
