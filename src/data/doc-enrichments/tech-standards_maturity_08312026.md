---
generated: 2026-08-31
category: Technical Standards
document_count: 4
requirement_count: 19
---

## Cross-Issuer-ZKP-Federation-for-Post-Quantum-Agentic-Payment
- **Source**: Cross-Issuer ZKP Federation for Post-Quantum Agentic Payment Credentials
- **URL**: https://datatracker.ietf.org/doc/draft-hopley-x402-federation-zkp/
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Configure the validator to perform full cryptographic range proof verification via the ATB ZKP service if structural validation is insufficient.
- **Governance**:
    - _T2 Risk-Informed · keys_: Maintain a registry of trusted issuer public keys and reject credentials from issuers not explicitly listed in this registry.
    - _T2 Risk-Informed · keys_: Share the validator's HMAC secret across all instances via a secrets manager rather than using per-instance secrets.
    - _T2 Risk-Informed · software_: Configure the validator to enforce issuer-DID uniqueness if distinct issuers are required for cross-issuer composition.
    - _T2 Risk-Informed · software_: Configure the validator to require cross-issuer evidence (min_issuers > 1) to demonstrate cross-issuer composition capabilities.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Rotate the validator's HMAC signing key regularly and revoke outstanding tokens by advancing the token's version upon rotation.

## FIPS 203
- **Source**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure cryptographic modules implementing ML-KEM are designed and built securely, as conformance to the standard alone does not guarantee implementation security.
    - _T3 Repeatable · software_: Ensure the overall system implementation provides an acceptable level of security, as using a conforming product does not guarantee overall system security.
    - _T3 Repeatable · software_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations complying with this standard.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Guard against the disclosure of the decapsulation key, shared secret key, and randomness used by parties to maintain security guarantees.

## FIPS 204
- **Source**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure cryptographic modules implementing the standard are designed and built in a secure manner by the implementer.
    - _T3 Repeatable · libraries_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a responsible authority to ensure the overall implementation provides an acceptable level of security.
    - _T2 Risk-Informed · keys_: Guard against the disclosure of private keys to maintain the security of the digital signature system.
    - _T2 Risk-Informed · keys_: Restrict digital signature key pairs from being used for purposes other than digital signatures.

## Post-Quantum-Credential-Binding-for-x402-Agentic-Payment-Aut
- **Source**: Post-Quantum Credential Binding for x402 Agentic Payment Authorization
- **URL**: https://datatracker.ietf.org/doc/draft-hopley-x402-pqc-credential-binding/
- **Requirement count**: 4
- **Inventory**:
    - _T2 Risk-Informed · keys_: Maintain a trusted-key registry for issuers to verify public key hashes against credential envelopes before signature verification.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Rotate Falcon-1024 signing keys at least annually to manage key lifecycle and support versioning via the key_id field.
- **Observability**:
    - _T2 Risk-Informed · software_: Track issued session token nonces to detect and reject replayed tokens, ensuring real-time detection of unauthorized reuse.
    - _T2 Risk-Informed · software_: Track cumulative spend per agent in-process and reject requests when the limit is exceeded to enforce policy constraints.
