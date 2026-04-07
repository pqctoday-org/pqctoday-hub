### What This Is About

Post-quantum digital signatures are enormously bloated. While an older ECDSA signature is just 64 bytes, a quantum-safe ML-DSA-44 signature is 2,420 bytes. Merkle Tree Certificates (MTCs) solve this "certificate bloat" problem by replacing heavy, per-certificate signatures with a single, highly efficient batch-signing architecture.

### Why It Matters

Massive PQC signatures break constrained internet clients, degrade connection setup times, and drastically increase bandwidth costs for TLS handshakes. Under the MTC architecture, a Certificate Authority (CA) signs a single Merkle Tree root hash covering millions of certificates. Clients receive a compact "inclusion proof" instead of a massive signature.

### The Key Takeaway

Merkle Tree Certificates offer a massive size reduction for PQC algorithms—60% with standalone ML-DSA-44 certificates (which carry cosignatures) and up to 92% with landmark certificates (which carry no signatures at all). By moving to inclusion proofs and hash recomputation, MTCs provide a viable, standardized (IETF PLANTS) path to deploying PQC certificates on the public internet without destroying performance.

### What's Happening

The IETF PLANTS working group is actively standardizing Merkle Tree Certificates, positioning them as the primary solution for deploying quantum-safe authentication on the public internet without the crippling bandwidth costs of full PQC certificate chains.
