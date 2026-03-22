### What This Is About

Post-quantum digital signatures are enormously bloated. While an older ECDSA signature is just 64 bytes, a quantum-safe ML-DSA-44 signature is 2,420 bytes. Merkle Tree Certificates (MTCs) solve this "certificate bloat" problem by replacing heavy, per-certificate signatures with a single, highly efficient batch-signing architecture.

### Why It Matters

Massive PQC signatures break constrained internet clients, degrade connection setup times, and drastically increase bandwidth costs for TLS handshakes. Under the MTC architecture, a Certificate Authority (CA) signs a single Merkle Tree root hash covering millions of certificates. Clients receive a compact "inclusion proof" instead of a massive signature.

### The Key Takeaway

Merkle Tree Certificates offer a massive size reduction—up to 62% savings for ML-DSA chains. By moving to inclusion proofs and hash recomputation, MTCs provide a viable, standardized (IETF PLANTS) path to deploying PQC certificates on the public internet without destroying performance.
