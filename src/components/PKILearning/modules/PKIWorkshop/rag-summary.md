# PKI Workshop Module

The PKI Workshop is a hands-on learning module that teaches Public Key Infrastructure fundamentals and post-quantum cryptography migration through interactive certificate operations. Learners build complete certificate chains in-browser using OpenSSL WASM, progressing through six structured workshop steps that mirror real-world PKI workflows. The module covers X.509v3 certificate structure (RFC 5280), trust models (hierarchical, bridge CA, web of trust), digital signature mechanics, and the critical challenge of migrating long-lived Root CA certificates to quantum-resistant algorithms.

## Key Concepts

- Public Key Infrastructure (PKI) framework: Certificate Authorities, Registration Authorities, end entities, and trust hierarchies defined by ITU-T X.509 and RFC 5280
- X.509v3 certificate structure: version, serial number, signature algorithm, issuer, validity, subject, Subject Public Key Info, and extensions (Key Usage, Basic Constraints, SAN, CRL Distribution Points)
- Certificate lifecycle: key generation, CSR creation (PKCS#10 / RFC 2986), CA signing, certificate parsing, and revocation (CRL per RFC 5280 Section 5, OCSP per RFC 6960)
- Classical vs PQC algorithms: RSA/ECDSA signatures (quantum-vulnerable via Shor's algorithm) vs ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) post-quantum replacements
- Hybrid and composite certificates: combining classical and PQC algorithms in a single certificate for backward compatibility during the transition period
- Merkle Tree Certificates (MTCs): IETF draft-davidben-tls-merkle-tree-certs proposal by Google and Cloudflare that batches certificates into a Merkle tree, replacing per-certificate PQ signatures with compact inclusion proofs (~736 bytes vs ~12.3 KB for traditional PQC chains)
- PQC migration challenges: certificate size growth (ML-DSA-87 public keys ~2,592 bytes vs 294 bytes for ECDSA P-256), constrained device support, cross-signed trust chains, and CNSA 2.0 deadline of 2030 for PQC-only PKI

## Workshop Activities

- **Step 1 -- Generate CSR**: Create a Certificate Signing Request using a generated key pair via OpenSSL WASM
- **Step 2 -- Create Root CA**: Generate a self-signed Root Certificate Authority
- **Step 3 -- Certificate Issuance**: Use the Root CA to sign the CSR, completing a certificate chain
- **Step 4 -- Parse Certificate**: Inspect generated certificate fields and extensions
- **Step 5 -- Revocation (CRL)**: Generate a Certificate Revocation List for the Root CA
- **Step 6 -- MTC Comparison**: Compare traditional certificate chains with Merkle Tree Certificates, analyzing size and handshake overhead

## Related Standards

- RFC 5280 (X.509v3 certificates and CRL profile), RFC 2986 (PKCS#10 CSR), RFC 6960 (OCSP), RFC 4210 (CMP enrollment)
- FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), NIST IR 8547 (PQC transition guidance), NIST SP 800-131A Rev 2 (algorithm deprecation)
- CNSA 2.0 (NSA PQC timeline), IETF draft-davidben-tls-merkle-tree-certs (Merkle Tree Certificates)
