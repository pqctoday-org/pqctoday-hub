# Merkle Tree Certificates Module

This module addresses the certificate bloat problem created by post-quantum digital signatures and teaches how Merkle Tree Certificates (MTCs) solve it. PQC signatures are dramatically larger than classical ones: an ECDSA P-256 signature is 64 bytes while ML-DSA-44 is 2,420 bytes, a 37x increase. A typical PQC TLS certificate chain adds 18-36 KB of overhead, breaking constrained clients and degrading connection setup times. MTCs replace individual per-certificate signatures with a batch-signing approach using Merkle trees, achieving 27–64% size reduction depending on algorithm (62–64% for ML-DSA chains).

## Key Concepts

- **Certificate bloat problem**: PQC signatures (ML-DSA) are 37x larger than ECDSA, causing 18-36 KB TLS chain overhead that breaks constrained clients with 10 KB limits
- **Merkle tree batch signing**: The Merkle Tree CA collects thousands of certificate assertions as leaves in a binary hash tree using SHA-256 with domain-separation prefixes (0x00 for leaves, 0x01 for internal nodes); only the root hash is signed with the CA's PQC key
- **Inclusion proofs**: Each certificate holder receives a compact chain of sibling hashes from leaf to root; proof is 736 bytes for a batch of ~4.4 million certificates (23 sibling hashes x 32 bytes)
- **Verification via hash recomputation**: The relying party hashes the certificate, combines it with each proof sibling up the tree, and checks if the computed root matches the signed root
- **MTC architecture**: Five roles per draft-ietf-plants-merkle-tree-certs Section 2.1 -- CA (maintains issuance log, builds tree, signs checkpoints/subtrees, requests cosignatures, assembles certificates), Cosigner (signs views of the log to assert correct operation, verifies append-only, optionally mirrors), Authenticating Party (TLS servers presenting certificate assertions + inclusion proofs), Relying Party (verifies certificates, maintains trusted subtrees and cosigner requirements), Monitor (watches issuance log for certificates of interest)
- **Certificate types**: Standalone (inclusion proof + cosignatures, works without predistributed state) and Landmark (inclusion proof only, no signatures, requires pre-synced trusted subtrees)
- **Tradeoffs**: Landmark certs require relying parties to pre-sync trusted subtrees periodically (not suitable for offline devices); revocation uses Revocation by Index (revoked ranges of indices per Section 7.5); trust requires meeting cosigner requirements; standalone certs work without pre-sync but carry additional cosigner signature overhead
- **IETF standardization**: Originated as draft-davidben-tls-merkle-tree-certs (draft-10, January 2026), adopted by IETF PLANTS working group as draft-ietf-plants-merkle-tree-certs (currently draft-02, March 2026); authors from Google, Cloudflare, and Geomys
- **Connection to hash-based signatures**: SLH-DSA (FIPS 205) uses a hyper-tree of XMSS trees internally (with FORS one-time signing at the leaves); LMS and XMSS use Merkle trees for one-time signing key pools; MTCs apply the same principle at the infrastructure level
- **Landmark certificates (signatureless)**: Zero embedded signatures — relying parties periodically pre-sync trusted landmark subtrees out-of-band (e.g. every hour per Section 6.4); inclusion proof verified against cached landmark root. Size: ~936 bytes for ML-DSA-44 (92% reduction vs traditional 12,272 bytes)

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
