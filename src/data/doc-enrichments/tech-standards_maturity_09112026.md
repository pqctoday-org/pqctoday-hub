---
generated: 2026-09-11
category: Technical Standards
document_count: 5
requirement_count: 23
---

## HQC Specification
- **Source**: Hamming Quasi-Cyclic (HQC) Algorithm Specification
- **URL**: https://pqc-hqc.org/doc/hqc_specifications_2025_08_22.pdf
- **Requirement count**: 1
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Verify the integrity of received decapsulation keys by checking the seedKEM component to ensure the keypair is valid and unaltered.

## RFC 9629
- **Source**: Using Key Encapsulation Mechanism (KEM) Algorithms in CMS
- **URL**: https://www.rfc-editor.org/rfc/rfc9629.html
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Implementations must verify that the kekLength value in KEMRecipientInfo is consistent with the key-encryption algorithm identified in the wrap field.
    - _T2 Risk-Informed · software_: Implementations must ensure that all KDF inputs (IKM, L, info) influence the output of the key derivation function to prevent weak key derivation.
- **Governance**:
    - _T2 Risk-Informed · certificates_: Ensure recipient X.509 certificates used for KEM operations assert the keyEncipherment bit in the key usage extension to validate key purpose.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Recipients must generate KEM key pairs in advance and make the public key available to originators, typically via a certificate, to support store-and-forward encryption.

## RFC 9708
- **Source**: Use of the HSS/LMS Hash-Based Signature Algorithm in CMS
- **URL**: https://www.rfc-editor.org/rfc/rfc9708.html
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Use adequate pseudorandom number generators (PRNGs) for private key and signature generation, adhering to RFC 4086 guidance to prevent key reproduction attacks.
- **Governance**:
    - _T2 Risk-Informed · certificates_: Configure X.509 certificate key usage extensions for HSS/LMS public keys to include only permitted values (digitalSignature, nonRepudiation, keyCertSign, cRLSign) and exclude others.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Generate each LMS key pair independently of all other key pairs in the HSS tree to maintain cryptographic isolation.
    - _T3 Repeatable · keys_: Track which leaf nodes in the HSS/LMS tree have been used to prevent one-time key reuse; ensure integrity of this tracking data during storage and virtual machine operations.
    - _T3 Repeatable · keys_: Ensure that each LM-OTS private key is used to generate a signature only one time and cannot be used for any other purpose.

## RFC 9810
- **Source**: Certificate Management Protocol (CMP)
- **URL**: https://www.rfc-editor.org/rfc/rfc9810.html
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Generate nonces and private keys from cryptographically secure random input to prevent security failures caused by inadequate PRNGs.
    - _T3 Repeatable · keys_: Verify that key pair parameters received from the CA are acceptable and that the response message is authenticated to prevent substitution attacks.
- **Governance**:
    - _T2 Risk-Informed · certificates_: Exercise special care and strict authorization controls when approving certificate requests containing Extended Key Usage (EKU) extensions due to the sensitive nature of authorization delegation.
    - _T2 Risk-Informed · keys_: Ensure the entropy of shared secret information protecting centrally generated key pairs is not less than the security strength of that key pair.
    - _T2 Risk-Informed · keys_: Limit shared secret information with low security strength, such as human-generated passwords, to a single PKI management operation.
    - _T2 Risk-Informed · keys_: Avoid reusing the CA certificate signing key for other purposes, such as protecting CMP responses or TLS connections, to minimize exposure.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Support the production of Certificate Revocation Lists (CRLs) by allowing certified end entities to make requests for the revocation of certificates.
    - _T3 Repeatable · certificates_: Produce empty versions of each CRL before issuing any certificates to ensure periodic revocation data availability for newly established CAs.
    - _T3 Repeatable · keys_: Implement mechanisms to regularly update any key pair without affecting other key pairs to ensure independent rotation capabilities.

## TCG-TPM-V185-Part0
- **Source**: TCG TPM 2.0 Library Specification V185 — Part 0: Introduction
- **URL**: https://trustedcomputinggroup.org/wp-content/uploads/Trusted-Platform-Module-2.0-Library-Part-0-Introduction_Version-185_pub.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Verify that TPMs and platforms are certified by external entities to ensure they are genuine, compliant with specifications, and that roots of trust are properly implemented.
- **Governance**:
    - _T2 Risk-Informed · keys_: Maintain a documented hierarchy of attestations (Endorsement, Platform, Attestation Key) to verify the authenticity and compliance of TPMs and platform roots of trust.
- **Inventory**:
    - _T2 Risk-Informed · software_: Query TPM capabilities (algorithms, commands, parameters) using standard commands to maintain an accurate inventory of supported cryptographic features and key creation capabilities.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Monitor and plan for the deprecation of cryptographic algorithms (e.g., TDES, SHA1) and commands, migrating to modern alternatives before they are removed from future specification versions.
