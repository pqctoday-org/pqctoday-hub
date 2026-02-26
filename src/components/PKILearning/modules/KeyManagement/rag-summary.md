# Key Management and HSM Module

The Key Management and HSM module teaches enterprise cryptographic key lifecycle management, Hardware Security Module (HSM) operations, and the challenges of migrating key infrastructure to post-quantum cryptography. Built around NIST SP 800-57 guidance, the module covers all seven key lifecycle stages, PKCS#11 HSM interfaces, PQC-specific key management challenges (larger keys, algorithm separation, dual-key management), Key Encapsulation Mechanisms (KEMs) vs classical key exchange, stateful vs stateless signature trade-offs, hybrid and composite certificates, key backup and recovery, side-channel considerations, and enterprise KMS architecture.

## Key Concepts

- Seven-stage key lifecycle per NIST SP 800-57: Generation, Distribution, Storage, Usage, Rotation, Archival, and Destruction
- HSM fundamentals: FIPS 140-3 security levels (Level 1 through Level 4), tamper-resistant hardware boundaries, and the PKCS#11 API (C_GenerateKeyPair, C_Sign, C_Verify, C_WrapKey, C_UnwrapKey)
- PQC key size explosion: ML-KEM-768 public keys at 1,184 bytes and ML-DSA-65 public keys at 1,952 bytes versus RSA-2048 at 256 bytes
- Algorithm separation: PQC enforces strict separation between ML-KEM (key establishment only) and ML-DSA (signatures only), unlike RSA which served both purposes
- KEMs vs key exchange: ML-KEM produces a fixed 32-byte shared secret via Encaps/Decaps (non-interactive), replacing interactive DH/ECDH key exchange; PKCS#11 maps this through C_WrapKey/C_UnwrapKey as a two-step KEK derivation
- Dual-key management during hybrid transition: every entity needs both classical and PQC key pairs, doubling key inventory and complicating rotation
- Composite certificates (IETF draft): single certificate with both classical and PQC keys/signatures; both must validate
- Key backup: M-of-N splitting, HSM cloning for high availability, and quantum-safe key escrow envelopes
- Side-channel attack surfaces: lattice-based algorithms (NTT, polynomial multiplication) require constant-time implementations; ML-DSA hedged signing mode protects against fault injection
- HSM PQC readiness: vendor status for Thales Luna 7, Entrust nShield 5, Utimaco, Marvell, AWS CloudHSM, and Azure Dedicated HSM

## Workshop Activities

- **Step 1 -- Key Lifecycle Demo**: Walk through all seven stages of the key lifecycle with PQC impact analysis at each stage
- **Step 2 -- HSM Simulator**: Step through simulated PKCS#11 operations for PQC key management, including key generation, signing, verification, and wrapping
- **Step 3 -- Rotation Planner**: Plan a PQC key rotation strategy for a fictional enterprise with 500 certificates, balancing migration timelines and operational constraints

## Related Standards

- NIST SP 800-57 Part 1 Rev 5 (key management recommendations), NIST SP 800-208 (stateful hash-based signatures)
- FIPS 140-3 (HSM security validation levels), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA)
- PKCS#11 (Cryptoki HSM API standard), KMIP (Key Management Interoperability Protocol)
- CNSA 2.0 (NSA PQC adoption timeline for national security systems)
