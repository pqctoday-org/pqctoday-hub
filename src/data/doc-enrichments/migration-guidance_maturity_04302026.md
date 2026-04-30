---
generated: 2026-04-30
category: Technical Standards
document_count: 12
requirement_count: 46
---

## CoT-Decrypting-Future-PQC-Timelines-2026

- **Source**: Decrypting the Future: Global Timelines for Post-Quantum Cryptography and Why They Matter
- **URL**: https://www.charteroftrust.com/wp-content/uploads/2026/04/20260115_PQC-Decrypting-the-Future_FINAL-1.pdf
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Establish a risk-driven transition strategy for PQC, prioritizing sectors with long-lived data and systems based on sectoral characteristics and data retention obligations.
  - _T2 Risk-Informed · all_: Define sectoral prioritization for PQC migration based on data sensitivity, system lifecycle, and potential impact on national or public safety interests.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify and catalog assets most dependent on long-term cryptographic protection, including long-lived data, systems, and archival backups across high-priority sectors.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Address the 'harvest now, decrypt later' threat by prioritizing the protection of data requiring multi-decade confidentiality, such as financial records and patient data.
  - _T2 Risk-Informed · software_: Plan for PQC migration in systems with long operational lifecycles (10-40 years), accounting for the complexity of retrofitting embedded technologies and slow-evolving infrastructure.

## HSBC-InfoSecGlobal-Thales-CryptographicInventory-2025

- **Source**: Cryptographic Inventory: Deriving Value Today, Preparing for Tomorrow
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Integrate cryptographic risk management into Enterprise Risk Management (ERM) frameworks to align mitigation with business risk.
  - _T2 Risk-Informed · all_: Define accountability and responsibility for cryptographic assets to ensure proper ownership and management of the cryptographic estate.
- **Inventory**:
  - _T2 Risk-Informed · all_: Establish a comprehensive cryptographic inventory to identify assets, assess vulnerabilities, and prioritize risk mitigation efforts for quantum readiness.
  - _T3 Repeatable · all_: Implement automated cryptographic discovery processes to maintain a dynamic inventory, as manual methods are insufficient for complex estates.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Prioritize mitigation actions based on the status of the cryptographic estate to address vulnerabilities posing significant business risks.

## IETF RFC 5656

- **Source**: Elliptic Curve Algorithm Integration in the Secure Shell Transport Layer
- **URL**: https://www.rfc-editor.org/rfc/rfc5656
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Implement the specified ECC public key format and ECDH key exchange methods to ensure protocol compliance and interoperability.
  - _T3 Repeatable · software_: Use SHA2 family hash functions for message hashing in ECDSA signatures, selecting the specific hash based on curve size.
- **Governance**:
  - _T2 Risk-Informed · all_: Configure systems to control cryptographic function through policy settings, enabling or disabling specific algorithms as required.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Validate all received elliptic curve public keys immediately upon receipt; terminate the key exchange process if validation fails.

## IETF RFC 9701

- **Source**: SD-JWT for Verifiable Credentials
- **URL**: https://www.rfc-editor.org/rfc/rfc9701
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · software_: Define and enforce RS-specific policies for data release, algorithm selection, and credential management to ensure authorized access and privacy compliance.
- **Inventory**:
  - _T2 Risk-Informed · keys_: Maintain an inventory of client credentials, authentication methods, and cryptographic configurations (signing/encryption algorithms) for each Resource Server.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Provision and manage encryption keys and algorithms for Resource Servers, supporting dynamic updates via client registration metadata.

## IETF RFC 9763

- **Source**: Related Certificates for Giving Expression to Multiple Algorithm Trust
- **URL**: https://www.rfc-editor.org/rfc/rfc9763
- **Requirement count**: 7
- **Governance**:
  - _T2 Risk-Informed · certificates_: Define local policy for determining sufficient freshness of the request time in related certificate requests.
  - _T2 Risk-Informed · certificates_: Establish local policy regarding the suitability of related certificates, such as remaining validity period, before issuance.
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Validate related certificate path and verify signature ownership before issuing new certificate with RelatedCertificate extension.
  - _T3 Repeatable · certificates_: Ensure related certificate contains matching key usage and extended key usage OIDs before inclusion in the new certificate.
  - _T3 Repeatable · certificates_: Verify freshness of the request time and confirm the related certificate is valid at the time of issuance.
  - _T3 Repeatable · certificates_: Restrict RelatedCertificate extension to end-entity certificates only; do not include in intermediate or root certificates.
  - _T3 Repeatable · certificates_: Do not mark the RelatedCertificate extension as critical to preserve interoperability during hybrid authentication transitions.

## IETF-RFC-8555

- **Source**: RFC 8555: Automatic Certificate Management Environment (ACME)
- **URL**: https://www.rfc-editor.org/rfc/rfc8555
- **Requirement count**: 4
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Automate certificate issuance, domain validation, and installation to eliminate manual toil and reduce deployment time.
  - _T3 Repeatable · certificates_: Implement automated mechanisms for certificate revocation as part of the standard certificate management protocol.
  - _T3 Repeatable · certificates_: Enable automated deactivation of authorizations and accounts to manage the end-of-life for cryptographic assets.
  - _T3 Repeatable · keys_: Support automated account key rollover to facilitate secure key rotation without manual intervention.

## IETF-SD-JWT-Draft

- **Source**: Selective Disclosure for JWTs (SD-JWT) — draft-ietf-oauth-selective-disclosure-jwt
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-oauth-selective-disclosure-jwt/
- **Requirement count**: 2
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Establish processes for the distribution and rotation of issuer signature verification keys to maintain trust and security.
  - _T2 Risk-Informed · keys_: Implement key pair generation and lifecycle management procedures for SD-JWT issuance and key binding.

## RFC 9019

- **Source**: A Firmware Update Architecture for Internet of Things (SUIT)
- **URL**: https://www.rfc-editor.org/rfc/rfc9019.html
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T3 Repeatable · keys_: Ensure trust anchor stores resist unauthorized modification, insertion, or deletion to maintain the integrity of the cryptographic root of trust.
  - _T3 Repeatable · software_: Enforce authentication and integrity protection for all firmware images using manifests to prevent installation of malicious or untrusted code.
- **Governance**:
  - _T2 Risk-Informed · all_: Define roles for Author, Device Operator, and Trust Provisioning Authority to establish ownership of firmware update processes and trust anchor distribution.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Implement automated, unattended firmware update mechanisms to ensure timely patching of vulnerabilities without manual intervention.

## draft-ietf-cose-dilithium

- **Source**: ML-DSA for JOSE and COSE
- **URL**: https://www.ietf.org/archive/id/draft-ietf-cose-dilithium-11.html
- **Requirement count**: 3
- **Assurance / FIPS**:
  - _T3 Repeatable · keys_: Validate all algorithm-related key parameters before use, including verifying the 32-byte seed length for ML-DSA private keys.
  - _T3 Repeatable · keys_: Treat ML-DSA seeds with the same safeguards as private keys, as they can be used to compute the private key.
  - _T3 Repeatable · keys_: Use skEncode and skDecode algorithms when expanding the priv parameter using KeyGen_internal to ensure correct key handling.

## draft-ietf-lamps-cert-binding-for-multi-auth

- **Source**: X.509 Certificate Extension for Binding to Multiple Authentication Algorithms
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-lamps-cert-binding-for-multi-auth/
- **Requirement count**: 3
- **Inventory**:
  - _T2 Risk-Informed · certificates_: Define local policy for determining the freshness of certificate binding requests and the suitability of related certificates for hybrid authentication.
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Implement automated CA validation of related certificate ownership via signature verification and path validation before issuing hybrid-bound certificates.
  - _T3 Repeatable · certificates_: Enforce freshness checks on certificate binding requests using BinaryTime to prevent replay attacks during the issuance of related certificates.

## draft-ietf-pquip-pqc-hsm-constrained-03

- **Source**: Adapting Constrained Devices for Post-Quantum Cryptography
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-pquip-pqc-hsm-constrained/
- **Requirement count**: 5
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Plan for backup and recovery of cryptographic seeds and private keys to address hardware failures or device end-of-life.
  - _T2 Risk-Informed · keys_: Use strong symmetric encryption (e.g., AES key-wrap) to encrypt seeds or private keys before export to protect against unauthorized access.
  - _T2 Risk-Informed · keys_: Safeguard seeds with the same level of protection as private keys, storing them securely within a cryptographic module.
  - _T2 Risk-Informed · keys_: Discard derived private keys immediately after use if using a seed-only storage model to minimize memory exposure.
  - _T3 Repeatable · keys_: Ensure encryption and decryption of seeds and private keys occur entirely within cryptographic modules to reduce exposure risk.

## draft-sfluhrer-ssh-mldsa

- **Source**: SSH Support of ML-DSA
- **URL**: https://www.ietf.org/archive/id/draft-sfluhrer-ssh-mldsa-05.html
- **Requirement count**: 1
- **Assurance / FIPS**:
  - _T2 Risk-Informed · libraries_: Continuously re-evaluate cryptographic algorithms to ensure they provide the expected level of security against emerging threats.
