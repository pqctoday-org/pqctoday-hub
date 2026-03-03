# Merkle Tree Certificates Module

This module addresses the certificate bloat problem created by post-quantum digital signatures and teaches how Merkle Tree Certificates (MTCs) solve it. PQC signatures are dramatically larger than classical ones: an ECDSA P-256 signature is 64 bytes while ML-DSA-44 is 2,420 bytes, a 37x increase. A typical PQC TLS certificate chain adds 18-36 KB of overhead, breaking constrained clients and degrading connection setup times. MTCs replace individual per-certificate signatures with a batch-signing approach using Merkle trees, achieving 27–64% size reduction depending on algorithm (62–64% for ML-DSA chains).

## Key Concepts

- **Certificate bloat problem**: PQC signatures (ML-DSA) are 37x larger than ECDSA, causing 18-36 KB TLS chain overhead that breaks constrained clients with 10 KB limits
- **Merkle tree batch signing**: A Merkle Tree CA (MTCA) collects thousands of certificate assertions as leaves in a binary hash tree using SHA-256 with domain-separation prefixes (0x00 for leaves, 0x01 for internal nodes); only the root hash is signed with the CA's PQC key
- **Inclusion proofs**: Each certificate holder receives a compact chain of sibling hashes from leaf to root; proof is 736 bytes for a batch of ~4.4 million certificates (23 sibling hashes x 32 bytes)
- **Verification via hash recomputation**: The relying party hashes the certificate, combines it with each proof sibling up the tree, and checks if the computed root matches the signed root
- **MTC architecture**: Three roles -- MTCA (builds tree, signs root, collects cosignatures, distributes proofs), Transparency Service (serves per-certificate log; signing is per-batch — one cosigner signature covers a subtree of millions of entries), and Authenticating Parties (TLS servers presenting certificate assertions + inclusion proofs)
- **Tradeoffs**: Clients must sync signed subtrees periodically; not suitable for fully offline verification; revocation uses index-range exclusion lists; trust requires cosigner quorum
- **IETF standardization**: Originated as draft-davidben-tls-merkle-tree-certs (draft-10, January 2026), adopted by IETF PLANTS working group; authors from Google, Cloudflare, and Geomys
- **Connection to hash-based signatures**: SLH-DSA (FIPS 205) uses a hyper-tree of XMSS trees internally (with FORS one-time signing at the leaves); LMS and XMSS use Merkle trees for one-time signing key pools; MTCs apply the same principle at the infrastructure level
- **Signatureless certificates**: Zero embedded signatures — relying parties pre-sync hourly landmark subtrees out-of-band; inclusion proof verified against cached landmark root. Size: ~936 bytes for ML-DSA-44 (92% reduction vs traditional 12,272 bytes)

## Workshop Activities

1. **Build Tree**: Add certificate leaves and build a Merkle tree with SHA-256 hashing interactively
2. **Inclusion Proof**: Select a leaf and generate its authentication path through the tree
3. **Verify Proof**: Walk through proof verification step-by-step and test tampering detection
4. **Size Comparison**: Compare handshake sizes between traditional X.509 chains and Merkle Tree Certificates across different algorithms

## Related Standards

- IETF draft-ietf-plants-merkle-tree-certs (Merkle Tree Certificates)
- FIPS 205 (SLH-DSA / SPHINCS+)
- NIST SP 800-208 (LMS and XMSS stateful hash-based signatures)
- RFC 6962 (Certificate Transparency)
- Cloudflare + Chrome MTC experiment (October 2025)
