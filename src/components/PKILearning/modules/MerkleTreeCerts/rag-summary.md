# Merkle Tree Certificates Module

This module addresses the certificate bloat problem created by post-quantum digital signatures and teaches how Merkle Tree Certificates (MTCs) solve it. PQC signatures are dramatically larger than classical ones: an ECDSA P-256 signature is 64 bytes while ML-DSA-44 is 2,420 bytes, a 37x increase. With ML-DSA-44 throughout, a server sending a leaf and one intermediate certificate (two public keys, two certificate signatures) plus its CertificateVerify signature transmits 2 × 1,312 + 3 × 2,420 = 9,884 B of keys and signatures per handshake, before SCTs and certificate metadata (13,831 B with ML-DSA-65, 19,065 B with ML-DSA-87). That can break constrained clients and degrade connection setup times. MTCs replace individual per-certificate signatures with a batch-signing approach using Merkle trees, achieving 31–65% standalone size reduction depending on algorithm (63–65% for ML-DSA/SLH-DSA chains; ~31% for ECDSA P-256, where the saving is only ~384 bytes in absolute terms). Note that landmark mode, which removes signatures entirely, is a net LOSS for ECDSA: its 736 B landmark proof costs more than the whole classical chain it replaces.

## Key Concepts

- **Certificate bloat problem**: PQC signatures (ML-DSA) are 37x larger than ECDSA, so an ML-DSA-44 leaf + intermediate chain with its CertificateVerify signature carries 9,884 B of keys and signatures ; SCTs and certificate metadata push it past the 10 KB limit some constrained clients enforce, and ML-DSA-65/87 or longer chains add more
- **Merkle tree batch signing**: The Merkle Tree CA collects thousands of certificate assertions as leaves in a binary hash tree using SHA-256 with domain-separation prefixes (0x00 for leaves, 0x01 for internal nodes); only the root hash is signed with the CA's PQC key
- **Inclusion proofs**: Each certificate holder receives a compact chain of sibling hashes from leaf to root. Size depends only on subtree size, and draft-ietf-plants-merkle-tree-certs-07 §6.5 projects two: 384 bytes for a standalone certificate's ~2,500-certificate subtree (12 hashes x 32 bytes) and 736 bytes for a landmark subtree (23 hashes x 32 bytes)
- **Verification via hash recomputation**: The relying party hashes the certificate, combines it with each proof sibling up the tree, and checks if the computed root matches the signed root
- **MTC architecture**: Five roles per draft-ietf-plants-merkle-tree-certs Section 2.1 -- CA (maintains issuance log, builds tree, signs checkpoints/subtrees, requests cosignatures, assembles certificates), Cosigner (signs views of the log to assert correct operation, verifies append-only, optionally mirrors), Authenticating Party (TLS servers presenting certificate assertions + inclusion proofs), Relying Party (verifies certificates, maintains trusted subtrees and cosigner requirements), Monitor (watches issuance log for certificates of interest)
- **Certificate types**: Standalone (inclusion proof + cosignatures, works without predistributed state) and Landmark (inclusion proof only, no signatures, requires pre-synced trusted subtrees)
- **Tradeoffs**: Landmark certs require relying parties to pre-sync trusted subtrees periodically (not suitable for offline devices); revocation uses Revocation by Index (revoked ranges of indices per Section 7.5); trust requires meeting cosigner requirements; standalone certs work without pre-sync but carry additional cosigner signature overhead
- **IETF standardization**: Originated as draft-davidben-tls-merkle-tree-certs (draft-10, January 2026), adopted by IETF PLANTS working group as draft-ietf-plants-merkle-tree-certs (latest version -07, 7 October 2026; not yet proposed for publication); authors from Google, Cloudflare, and Geomys
- **Connection to hash-based signatures**: SLH-DSA (FIPS 205) uses a hyper-tree of XMSS trees internally (with FORS one-time signing at the leaves); LMS and XMSS use Merkle trees for one-time signing key pools; MTCs apply the same principle at the infrastructure level
- **Landmark certificates (signatureless)**: Zero signatures in the certificate — relying parties periodically pre-sync trusted landmark subtrees out-of-band (e.g. every hour per Section 6.4); the server still sends its public key and a CertificateVerify signature; inclusion proof verified against cached landmark root. Handshake size for ML-DSA-44: ~4,668 bytes (server key + CertificateVerify + 736 B proof + metadata), about 56% smaller than a 10,522-byte leaf-plus-intermediate chain; a standalone certificate with one CA cosignature is ~6,736 bytes, about 36% smaller
- **MTC as downgrade detection layer** (Westerbaan/Cloudflare): Because every MTC issuance is recorded in the public transparency log, any future absence of an MTC-backed cert for a previously enrolled domain is visible — monitors can flag a sudden reversion to classical X.509 as a potential rollback attack; this is distinct from the size-reduction motivation and makes MTC adoption a security property, not just a performance optimization
- **Chrome Quantum-Resistant Root Store (CQRS) coexistence**: Chrome's CQRS enables the browser to validate PQC certificates via a parallel root store that runs alongside (not replacing) the existing Web PKI root store; servers can present an MTC-backed PQC cert to CQRS-capable browsers while falling back to classical X.509 for legacy clients — maximum compatibility with an auditable quantum-safe path

## Workshop Activities

1. **Build Tree**: Add certificate leaves and build a Merkle tree with SHA-256 hashing interactively
2. **Inclusion Proof**: Select a leaf and generate its authentication path through the tree
3. **Verify Proof**: Walk through proof verification step-by-step and test tampering detection
4. **Size Comparison**: Compare handshake sizes between traditional X.509 chains and Merkle Tree Certificates across different algorithms

## Related Standards

- IETF draft-ietf-plants-merkle-tree-certs (Merkle Tree Certificates)
- FIPS 205 (SLH-DSA / SPHINCS+)
- NIST SP 800-208 (LMS and XMSS stateful hash-based signatures)
- RFC 9162 (Certificate Transparency v2.0 — obsoletes RFC 6962)
- Cloudflare + Chrome MTC experiment (October 2025)
