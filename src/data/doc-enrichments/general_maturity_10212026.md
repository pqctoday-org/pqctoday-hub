---
generated: 2026-10-21
category: Technical Standards
document_count: 4
requirement_count: 17
---

## ECCG-ACM-v3-Draft-2026
- **Source**: ECCG Agreed Cryptographic Mechanisms version 3 — draft for public review
- **URL**: https://certification.enisa.europa.eu/document/download/9993abb8-5f27-47d0-bdb2-f6f284cd5141_en?filename=20260507-acm-draft.pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · keys_: Do not use MAC schemes with key sizes smaller than 192 bits in contexts requiring resistance against quantum computer attacks.
    - _T2 Risk-Informed · keys_: Ensure the pseudo-random function used in PBKDF2 is an agreed mechanism to maintain security integrity.
    - _T2 Risk-Informed · keys_: Use a strong random number generator with strong cryptographic post-processing, enhanced backward security, and regular reseeding for DSA signature generation.

## RFC 10042
- **Source**: RFC 10042: Post-Quantum/Traditional Hybrid Key Exchange with ML-KEM for SSH
- **URL**: https://www.rfc-editor.org/rfc/rfc10042.html
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Use specified encodings for K_PQ, K_CL, and K to prevent side-channel attacks.
    - _T3 Repeatable · software_: Check C_INIT length against expected public key lengths before encapsulation.
    - _T3 Repeatable · software_: Perform encapsulation key checks defined in FIPS 203 Section 7.2.
    - _T3 Repeatable · software_: Check S_REPLY length against expected key and ciphertext lengths before decapsulation.
    - _T3 Repeatable · software_: Process ECDH and X25519 public keys with validity and length checks per RFC 5656 and RFC 8731.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Generate ephemeral key exchange keypairs for ECDH and ML-KEM per connection.
    - _T3 Repeatable · keys_: Prohibit the reuse of randomness in the generation of ML-KEM ciphertexts.
    - _T3 Repeatable · software_: Derive encryption keys from the shared secret K according to RFC 4253 Section 7.2.

## draft-ietf-cose-hpke-pq-pqt-01
- **Source**: COSE HPKE PQ & PQ/T Algorithm Registrations (draft-ietf-cose-hpke-pq-pqt-01)
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-cose-hpke-pq-pqt/
- **Requirement count**: 1
- **Governance**:
    - _T3 Repeatable · keys_: Ensure all recipients in a COSE_Encrypt structure using Key Encryption algorithms employ quantum-resistant Key Management algorithms to prevent HNDL attacks.

## draft-ietf-lamps-pq-composite-kem-23
- **Source**: Composite ML-KEM for use in X.509 Public Key Infrastructure (draft-ietf-lamps-pq-composite-kem-23)
- **URL**: https://www.ietf.org/archive/id/draft-ietf-lamps-pq-composite-kem-23.html
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · certificates_: Check both component keys independently for revocation status when performing revocation checks on a composite key.
    - _T2 Risk-Informed · libraries_: Focus implementation effort on id-MLKEM768-X25519-SHA3-256 and id-MLKEM768-ECDH-P256-SHA3-256 for applications without specific regulatory or legacy constraints.
    - _T3 Repeatable · keys_: Prohibit the use of component keys of a composite private key in any other type of key or as a standalone key.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Clear all buffers containing key material and forward errors to the caller when a component primitive fails during KeyGen, Encaps, or Decaps.
    - _T3 Repeatable · keys_: Generate RSA component keys strictly at 2048-bit, 3072-bit, or 4096-bit sizes; intermediate sizes are not acceptable.
