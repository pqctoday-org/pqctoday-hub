# PKI Workshop Module

The PKI Workshop is a hands-on learning module that teaches Public Key Infrastructure fundamentals and post-quantum cryptography migration through interactive certificate operations. Learners build complete certificate chains in-browser using OpenSSL WASM, progressing through six structured workshop steps that mirror real-world PKI workflows. The module covers X.509v3 certificate structure (RFC 5280), trust models (hierarchical, bridge CA, web of trust), digital signature mechanics, and the critical challenge of migrating long-lived Root CA certificates to quantum-resistant algorithms.

## Key Concepts

- Public Key Infrastructure (PKI) framework: Certificate Authorities, Registration Authorities, end entities, and trust hierarchies defined by ITU-T X.509 and RFC 5280
- X.509v3 certificate structure: version, serial number, signature algorithm, issuer, validity, subject, Subject Public Key Info, and extensions (Key Usage, Basic Constraints, SAN, CRL Distribution Points)
- Certificate lifecycle: key generation, CSR creation (PKCS#10 / RFC 2986), CA signing, certificate parsing, and revocation (CRL per RFC 5280 Section 5, OCSP per RFC 6960)
- Classical vs PQC algorithms: RSA/ECDSA signatures (quantum-vulnerable via Shor's algorithm) vs ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) post-quantum replacements
- Hybrid and composite certificates: combining classical and PQC algorithms during the transition. Backward compatibility depends on the format — Alt-Sig/Catalyst and the classical certificate of a Related Certificates pair keep a classical signature a legacy validator can still verify (Chameleon, an expired individual draft, is historical only); COMPOSITE certificates do not (both components must verify, and a validator without composite support cannot parse the key at all).
- Merkle Tree Certificates (MTCs): draft-ietf-plants-merkle-tree-certs in the IETF PLANTS working group batches certificates into a Merkle tree, replacing per-certificate PQ signatures with compact inclusion proofs (384–736 bytes). With ML-DSA-44, a leaf + one intermediate plus the CertificateVerify signature is 9,884 B of keys and signatures (2 × 1,312 + 3 × 2,420, no SCTs or metadata); a landmark MTC needs 4,468 B (leaf key + CertificateVerify + 736 B proof)
- PQC migration challenges: certificate size growth (ML-DSA-87 public keys ~2,592 bytes vs ~91 bytes (SPKI) for ECDSA P-256), constrained device support, cross-signed trust chains, and CNSA 2.0 milestones (2030 for exclusive software/firmware signing and traditional networking; current FAQ version 2.2 mandates CNSA 2.0 algorithms for NSS by 2031 unless otherwise noted)

## Workshop Activities

- **Step 1 -- Generate CSR**: Create a Certificate Signing Request using a generated key pair via OpenSSL WASM
- **Step 2 -- Create Root CA**: Generate a self-signed Root Certificate Authority
- **Step 3 -- Certificate Issuance**: Use the Root CA to sign the CSR, completing a certificate chain
- **Step 4 -- Parse Certificate**: Inspect generated certificate fields and extensions
- **Step 5 -- Revocation (CRL)**: Generate a Certificate Revocation List for the Root CA
- **Step 6 -- MTC Comparison**: Compare traditional certificate chains with Merkle Tree Certificates, analyzing size and handshake overhead

## Related Standards

- RFC 5280 (X.509v3 certificates and CRL profile), RFC 2986 (PKCS#10 CSR), RFC 6960 (OCSP), RFC 9810 (CMP, obsoletes RFC 4210) (CMP enrollment)
- FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), NIST IR 8547 (PQC transition guidance), NIST SP 800-131A Rev 2 (algorithm deprecation)
- CNSA 2.0 (NSA PQC timeline), IETF draft-ietf-plants-merkle-tree-certs (Merkle Tree Certificates; replaced draft-davidben-tls-merkle-tree-certs)
