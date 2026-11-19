# Merkle Tree Certificates Module

This module addresses the increase in TLS authentication data that can result from post-quantum signatures and models Merkle Tree Certificates (MTCs) as one proposed design response. A raw ECDSA P-256 signature input is 64 bytes while ML-DSA-44 is 2,420 bytes. With ML-DSA-44 throughout, the example leaf-plus-intermediate chain (root already trusted) plus CertificateVerify has 2 × 1,312 + 3 × 2,420 = 9,884 B of public keys and signatures, before SCTs and certificate metadata (13,831 B with ML-DSA-65, 19,065 B with ML-DSA-87). These are model inputs, not measured end-to-end handshakes or a universal client limit. MTCs replace issuer signatures in certificates with inclusion proofs while retaining the server key and CertificateVerify. In this module’s authored authentication-component model, ML-DSA-44 is 10,522 B traditional, 6,736 B standalone (36% smaller) and 4,668 B landmark (56% smaller). ECDSA is 960 B traditional and 777 B standalone (183 B /19% smaller), but 1,065 B landmark (105 B /11% larger). The denominator includes a leaf-plus-intermediate chain, 2 SCTs ×119 B in the traditional chain, 200 B metadata per certificate, one CA cosignature standalone, and a pre-synced trusted landmark subtree. Proofs are 384 B standalone and 736 B landmark. Algorithm inputs are raw component sizes (including fixed 64 B ECDSA signatures and 65 B public points), not measured DER/TLS encodings; KEM shares, other handshake messages, records, transport and background synchronization are excluded. These are component-model comparisons, not measured handshake savings or universal reductions.

## Key Concepts

- **Certificate bloat problem**: ML-DSA-44 has a 2,420-byte signature versus the model's 64-byte raw ECDSA P-256 input. The example chain and CertificateVerify carry 9,884 B of keys and signatures before SCTs and metadata; actual client/network effects depend on implementation and transport.
- **Merkle tree batch signing**: The CA records certificate assertions in a binary hash tree using SHA-256 with domain-separation prefixes (0x00 for leaves, 0x01 for internal nodes). CAs and cosigners sign checkpoints or subtrees according to the draft's roles and relying-party policy; the workshop's signed-root flow is a teaching model.
- **Inclusion proofs**: Each certificate holder receives sibling hashes from leaf to root. The current draft-ietf-plants-merkle-tree-certs-08 §6.5 projects 384 bytes for a standalone certificate's ~3,000-certificate subtree (12 hashes × 32 bytes) and 736 bytes for a landmark-relative subtree (~5.4 million certificates; 23 hashes × 32 bytes).
- **Verification via hash recomputation**: The relying party hashes the certificate, combines it with each proof sibling up the tree, and checks if the computed root matches the signed root
- **MTC architecture**: Five roles per the active PLANTS working-group Internet-Draft §2.1: CA, Cosigner, Authenticating Party, Relying Party and Monitor. Public accessibility depends on PKI policy; the draft permits private logs for private PKIs. Monitoring detects relevant misissuance only when observers can access the log and understand the entries.
- **Certificate types**: Standalone certificates carry an inclusion proof and sufficient cosignatures for relying-party policy, and do not require predistributed subtree state. Optional landmark-relative certificates can omit certificate cosignatures when relying parties already trust the corresponding pre-synced subtree; the TLS handshake still carries the server's key and CertificateVerify signature.
- **Tradeoffs**: Landmark certs require relying parties to pre-sync trusted subtrees periodically (not suitable for offline devices); revocation uses Revocation by Index (revoked ranges of indices per Section 7.5); trust requires meeting cosigner requirements; standalone certs work without pre-sync but carry additional cosigner signature overhead
- **IETF standardization**: The current document is draft-ietf-plants-merkle-tree-certs-08 (2 November 2026), an active PLANTS working-group Internet-Draft intended for the Standards Track, not a published RFC. It states that versions -07 and -08 are wire-compatible.
- **Connection to hash-based signatures**: SLH-DSA (FIPS 205) uses a hyper-tree of XMSS trees internally (with FORS one-time signing at the leaves); LMS and XMSS use Merkle trees for one-time signing key pools; MTCs apply the same principle at the infrastructure level
- **Landmark-relative example**: The modeled ML-DSA-44 authentication components total 4,668 B (server key + CertificateVerify + 736 B proof + metadata), about 56% smaller than a 10,522-byte leaf-plus-intermediate chain. The standalone model with one CA cosignature totals 6,736 B, about 36% smaller. These are model totals, not whole-handshake measurements.
- **Transparency scope**: MTC logs can let monitors inspect issuance and detect relevant misissuance under the relying party's visibility and cosigner policy. The MTC draft does not claim that absence of an MTC for a previously seen domain automatically detects fallback to classical X.509.
- **Chrome program status**: Chrome publishes a separate draft quantum-resistant root program policy and testing instructions. The early feasibility experiment backed MTC connections with a traditional trusted X.509 certificate; do not infer general production trust or universal compatibility from that test.

## Workshop Activities

1. **Build Tree**: Add certificate leaves and build a Merkle tree with SHA-256 hashing interactively
2. **Inclusion Proof**: Select a leaf and generate its authentication path through the tree
3. **Verify Proof**: Walk through proof verification step-by-step and test tampering detection
4. **Size Comparison**: Compare authored authentication-component sizes between traditional X.509 chains and Merkle Tree Certificates across different algorithms

## Related Standards

- IETF draft-ietf-plants-merkle-tree-certs (Merkle Tree Certificates)
- FIPS 205 (SLH-DSA / SPHINCS+)
- NIST SP 800-208 (LMS and XMSS stateful hash-based signatures)
- RFC 9162 (Certificate Transparency v2.0 — obsoletes RFC 6962)
- Cloudflare + Chrome MTC experiment (October 2025)
