---
generated: 2026-08-30
category: Certification Schemes
document_count: 6
requirement_count: 32
---

## ANSSI PQC Position Paper
- **Source**: Avis de l'ANSSI sur la Migration Vers la Cryptographie
- **URL**: https://cyber.gouv.fr/sites/default/files/2022/04/anssi-avis-migration-vers-la-cryptographie-post-quantique.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Mandate hybridization of post-quantum and pre-quantum algorithms for products requiring protection beyond 2030.
    - _T2 Risk-Informed · libraries_: Use highest available NIST security levels (preferably 5 or 3) for PQC algorithms and avoid modifying normalized parameters.
    - _T2 Risk-Informed · libraries_: Implement IND-CCA secure versions of KEMs and use ephemeral keys to prevent decryption failure oracle attacks.
    - _T2 Risk-Informed · libraries_: Protect the internal state of stateful signature algorithms (XMSS/LMS) against integrity loss and replay attacks.
    - _T2 Risk-Informed · libraries_: Dimension symmetric primitives to provide at least AES-256 and SHA2-384 equivalent security levels for post-quantum resilience.
- **Governance**:
    - _T2 Risk-Informed · all_: Include quantum threat in risk analysis and define a progressive transition strategy for cryptographic products.

## BSI TR-02102-1
- **Source**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Ensure random number generators comply with updated AIS 20/31 standards, specifically regarding DRG.3 and NTG.1 usage.
    - _T2 Risk-Informed · libraries_: Remove PTG.2 random generators from general use as they are no longer recommended.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Maintain cryptographic mechanisms with key lengths providing at least 120 bits of security level.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Discontinue sole use of classical asymmetric mechanisms and implement hybridization with quantum-safe mechanisms as per BSI recommendations.
    - _T2 Risk-Informed · keys_: Plan for the discontinuation of DSA recommendations effective from 2029 and migrate to recommended alternatives.

## BSI TR-02102-2
- **Source**: Cryptographic Mechanisms: Recommendations for TLS
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-2.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Validate that all TLS mechanisms meet the 120-bit security level defined in TR-02102-1.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Enforce retirement of TLS 1.2 by end of 2031 and TLS 1.0/1.1 immediately; mandate TLS 1.3 preference.
    - _T3 Repeatable · software_: Retire DSA and DHE cipher suites by end of 2029; retire RSA PKCS#1 v1.5 signatures immediately.
    - _T3 Repeatable · software_: Plan migration to quantum-safe key agreement mechanisms; sole classical key agreement ends 2031.
- **Observability**:
    - _T2 Risk-Informed · software_: Monitor for side-channel vulnerabilities (timing, power) and implement countermeasures as identified by experts.

## BSI TR-02102-3
- **Source**: Cryptographic Mechanisms: Recommendations for IPsec
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-3.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Identify and mitigate side-channel vulnerabilities in cryptographic implementations by involving experts during development.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish security policies defining cryptographic algorithms, parameters, and modes of operation for IPsec and IKEv2 deployments.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Define and enforce SA lifetimes and rekeying procedures for IPsec and IKEv2 security associations based on BSI recommendations.
    - _T2 Risk-Informed · keys_: Manage the lifecycle of ephemeral keys and ensure proper handling during key derivation and exchange processes.

## BSI TR-02102-4
- **Source**: Cryptographic Mechanisms: Recommendations for SSH
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-4.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Ensure key exchange implementations for diffie-hellman-group-exchange-sha256 use a prime p of at least 3000 bits and generator order of at least 2^250.
    - _T2 Risk-Informed · software_: Ensure key exchange implementations for diffie-hellman-group-exchange-sha256 use a safe prime p.
    - _T2 Risk-Informed · software_: Ensure ECDH key exchange methods use the corresponding SHA-2 hash function based on curve bit length as per RFC 5656.
    - _T2 Risk-Informed · software_: Ensure diffie-hellman-group-exchange-sha256 uses SHA-256 for the key derivation pseudo-random function (PRF).
- **Governance**:
    - _T2 Risk-Informed · software_: Configure SSH applications to prioritize recommended strong algorithms and deprioritize or disable weak/obsolete algorithms from the specification.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Retire SSH-1 protocol implementations due to known cryptographic vulnerabilities; enforce SSH-2 usage.
    - _T2 Risk-Informed · software_: Retire classical-only key agreement mechanisms by end of 2031; migrate to quantum-safe hybrid mechanisms.
    - _T2 Risk-Informed · software_: Retire DSA algorithm recommendations from the end of 2029.
    - _T2 Risk-Informed · software_: Retire HMAC-SHA-1 usage in SSH implementations.

## ENISA PQC Guidelines
- **Source**: Post-Quantum Cryptography: Current State and Quantum Mitigation
- **URL**: https://www.enisa.europa.eu/publications/post-quantum-cryptography-current-state-and-quantum-mitigation
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Perform risk and cost-benefit analysis before implementing hybrid PQC or pre-shared key mixing strategies to mitigate quantum threats.
- **Inventory**:
    - _T1 Partial · keys_: Identify data requiring long-term confidentiality to protect against retrospective decryption by future quantum computers.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Adopt a transition strategy that waits for national authorities to standardize PQC algorithms and provide a defined transition path.
