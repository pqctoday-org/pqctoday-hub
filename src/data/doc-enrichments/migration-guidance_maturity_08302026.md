---
generated: 2026-08-30
category: Technical Standards
document_count: 5
requirement_count: 28
---

## HSBC-InfoSecGlobal-Thales-CryptographicInventory-2025
- **Source**: Cryptographic Inventory: Deriving Value Today, Preparing for Tomorrow
- **URL**: https://www.ventures.hsbc.com/-/media/ventures/250602-cryptographic-inventory-deriving-value-today-preparing-for-tomorrow-2025.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Define accountability and responsibility for cryptographic assets, ensuring technology and business leadership recognize the strategic value of the inventory.
- **Inventory**:
    - _T2 Risk-Informed · all_: Establish a comprehensive cryptographic inventory to identify assets, assess key quality, and evaluate protection levels for risk mitigation.
    - _T2 Risk-Informed · all_: Integrate cryptographic inventory data into Enterprise Risk Management (ERM) frameworks to prioritize mitigation based on business risk.
    - _T3 Repeatable · all_: Utilize automation to create and maintain a dynamic cryptographic inventory, addressing the complexity and pervasiveness of cryptographic assets.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop prioritized transition plans for migrating to quantum-resistant cryptography, addressing the multi-year nature of the undertaking.

## IETF RFC 9701
- **Source**: JSON Web Token (JWT) Response for OAuth Token Introspection
- **URL**: https://www.rfc-editor.org/rfc/rfc9701
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · software_: Maintain credentials and configuration data for each resource server to manage trust relationships and authorization policies.
    - _T2 Risk-Informed · software_: Restrict the use of client credentials by a resource server to only the calls it requires, such as limiting access to the token introspection endpoint.
    - _T2 Risk-Informed · software_: Determine, based on RS-specific policy, what identity claims to return in the token introspection response.
    - _T2 Risk-Informed · software_: Ensure the release of any privacy-sensitive data is legally based.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Configure signing and encryption algorithms for JWT responses using registered client metadata parameters.
- **Observability**:
    - _T2 Risk-Informed · software_: Publish supported algorithms for signing and encrypting JWT introspection responses via authorization server metadata.

## IETF RFC 9763
- **Source**: Related Certificates for Giving Expression to Multiple Algorithm Trust
- **URL**: https://www.rfc-editor.org/rfc/rfc9763
- **Requirement count**: 7
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Verify that the related certificate is valid at the time of issuance of the new certificate.
    - _T3 Repeatable · certificates_: Validate related certificate path and verify signature ownership before issuing new certificate with Related Certificate extension.
    - _T3 Repeatable · certificates_: Ensure related certificate contains matching key usage and extended key usage OIDs as the newly issued certificate.
    - _T3 Repeatable · certificates_: Include Related Certificate extension only in end-entity certificates, not in intermediate or root CA certificates.
    - _T3 Repeatable · certificates_: Do not mark the Related Certificate extension as critical to ensure interoperability.
    - _T3 Repeatable · certificates_: Use the hash algorithm indicated by the related certificate's signature OID for the Related Certificate extension hash.
    - _T3 Repeatable · certificates_: RA must only allow previously issued certificates to be referenced in the related Cert Request attribute to enable CA signature verification.

## Microsoft-QSP-Roadmap-2025
- **Source**: Microsoft Quantum Safe Program (QSP) — Product Roadmap to 2033
- **URL**: https://www.microsoft.com/en-us/security/blog/
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Define ownership, scope, and milestones for a multi-year cryptography transition strategy.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create and maintain a living cryptographic inventory to identify, prioritize, and modernize dependencies.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Implement hardware-backed key protection and updated certificate lifetimes for critical trust anchors.
    - _T2 Risk-Informed · keys_: Standardize key management and rotation to enable safe adoption of new cryptographic standards.
    - _T2 Risk-Informed · libraries_: Eliminate hard-coded algorithms and make cryptographic settings configurable outside of the application.
    - _T2 Risk-Informed · software_: Build crypto-agility into new systems so future standards shifts are updates, not fire drills.
    - _T2 Risk-Informed · software_: Adopt modern standards such as TLS 1.3 as a baseline across client and server systems.

## draft-ietf-lamps-cert-binding-for-multi-auth
- **Source**: X.509 Certificate Extension for Binding to Multiple Authentication Algorithms
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-lamps-cert-binding-for-multi-auth/
- **Requirement count**: 3
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Define local policies for determining the suitability of related certificates, including criteria for validity period remaining, during the certificate issuance workflow.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Implement automated CA validation of related certificate ownership via signature verification and path validation before issuing new certificates with RelatedCertificate extensions.
    - _T3 Repeatable · certificates_: Enforce freshness checks on certificate request timestamps during the issuance process to prevent replay attacks when binding multiple authentication algorithms.
