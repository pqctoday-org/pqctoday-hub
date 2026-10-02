---
generated: 2026-10-01
category: Technical Standards
document_count: 7
requirement_count: 40
---

## RFC-9068
- **Source**: JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens
- **URL**: https://www.rfc-editor.org/rfc/rfc9068.html
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Resource servers MUST validate the signature of all incoming JWT access tokens using the algorithm specified in the JWT alg Header Parameter.
    - _T3 Repeatable · software_: Resource servers MUST reject any JWT in which the value of alg is none.
    - _T3 Repeatable · software_: Resource servers MUST verify that the typ header value is at+jwt or application/at+jwt and reject tokens carrying any other value.
    - _T3 Repeatable · software_: Resource servers MUST validate that the aud claim contains a resource indicator value corresponding to an identifier the resource server expects for itself.
    - _T3 Repeatable · software_: Resource servers MUST ensure the current time is before the time represented by the exp claim.
    - _T3 Repeatable · software_: Resource servers MUST use the keys provided by the authorization server for signature validation.
    - _T3 Repeatable · software_: Resource servers MUST handle validation errors by including the error code invalid_token in the response.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Authorization servers MUST include RS256 among their supported signature algorithms for JWT access tokens.
    - _T3 Repeatable · keys_: Authorization servers SHOULD use OAuth 2.0 Authorization Server Metadata to advertise signing keys via jwks_uri and issuer values.
    - _T3 Repeatable · software_: Authorization servers MUST NOT issue a JWT access token if the authorization granted by the token would be ambiguous.
    - _T3 Repeatable · software_: Authorization servers MUST use a distinct identifier as an aud claim value to uniquely identify access tokens issued for distinct resources.

## RFC-9864
- **Source**: Fully-Specified Algorithms for JSON Object Signing and Encryption (JOSE) and CBOR Object Signing and Encryption (COSE)
- **URL**: https://www.rfc-editor.org/rfc/rfc9864.html
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Utilize fully-specified algorithm identifiers in new deployments in preference to deprecated polymorphic identifiers, unless documented operational or regulatory requirements prevent migration.
    - _T3 Repeatable · all_: Prohibit the use of algorithm identifiers designated as 'Prohibited' and the functionality they reference.
    - _T3 Repeatable · all_: Ensure that the 'alg' value in JOSE encryption specifies all parameters for key establishment or derives them from the 'enc' value, and that the 'enc' value specifies all parameters for symmetric encryption.
    - _T3 Repeatable · all_: Ensure that the outer 'alg' value in COSE encryption specifies all parameters for key establishment, and the inner 'alg' value specifies all parameters for symmetric encryption.

## SAND2022-1118
- **Source**: Distributed Energy Resource Cybersecurity Standards Development - Final Project Report (SAND2022-1118)
- **URL**: https://www.osti.gov/servlets/purl/1843109
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · certificates_: Use X.509v3 Digital Certificates for identification and authentication, with signing keys generated using RSA, ECDSA, or EdDSA.
    - _T3 Repeatable · keys_: Use Advanced Encryption Standard (AES) with GCM or CCM modes for bulk traffic encryption, explicitly prohibiting Electronic Codebook (ECB) mode.
    - _T3 Repeatable · keys_: Derive ephemeral symmetric keys using Diffie-Hellman Ephemeral or Elliptic Curve Diffie-Hellman Ephemeral.
    - _T3 Repeatable · libraries_: Adopt modern cipher suites possessing strong capabilities and avoid proprietary security technologies.
    - _T3 Repeatable · software_: Require at least TLS 1.2 and recommend TLS 1.3 for all DER communications.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a single root of trust for all utilities, DER aggregators, and OEM vendors with a neutral, 3rd-party-operated root CA.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Require key management through PKI with certificate revocation.

## Security-Considerations-for-ML-DSA
- **Source**: Security Considerations for ML-DSA
- **URL**: https://www.ietf.org/archive/id/draft-connolly-cfrg-ml-dsa-security-considerations-02.txt
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · keys_: Assess side-channel attack possibilities and use implementations resistant to such leakage.
    - _T2 Risk-Informed · keys_: Use hedged signing mode to mitigate fault injection and side-channel attacks.
    - _T2 Risk-Informed · keys_: Use available randomness sources for signing rather than falling back to deterministic signing on constrained platforms.
    - _T2 Risk-Informed · keys_: Define a fixed context string for a given protocol's use case to prevent cross-protocol attacks.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Zeroize signing keys when no longer needed to prevent later compromise.
    - _T2 Risk-Informed · keys_: Securely delete cached expanded signing key material when no longer needed.

## UK-PSTI-Regs-2023-1007
- **Source**: The Product Security and Telecommunications Infrastructure (Security Requirements for Relevant Connectable Products) Regulations 2023
- **URL**: https://www.legislation.gov.uk/uksi/2023/1007/pdfs/uksi_20231007_en.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Publish a point of contact for security issue reporting and specify timelines for acknowledgment and status updates.
    - _T2 Risk-Informed · all_: Publish the defined support period for security updates, ensuring it is accessible, clear, and free of charge.
    - _T2 Risk-Informed · all_: Retain a copy of the statement of compliance for the longer of 10 years or the defined support period.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Ensure passwords are unique per product or user-defined, and not derived from incremental counters or public identifiers without encryption.
    - _T2 Risk-Informed · software_: Provide security updates for the duration of the defined support period and publish any extensions to this period.

## US-FCC-24-26-Cyber-Trust-Mark
- **Source**: FCC 24-26 Report and Order: Cybersecurity Labeling for Internet of Things (U.S. Cyber Trust Mark)
- **URL**: https://docs.fcc.gov/public/attachments/FCC-24-26A1.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Obtain accreditation pursuant to all requirements associated with ISO/IEC 17065 for conformity assessment bodies certifying products, processes, and services.
- **Governance**:
    - _T2 Risk-Informed · all_: File an application with the Commission that includes a description of the organization structure and an explanation of how it will avoid personal and organizational conflict when processing applications.
    - _T2 Risk-Informed · all_: Demonstrate cybersecurity expertise, industry knowledge of IoT labeling requirements, and expert knowledge of NIST cybersecurity guidance and FCC rules associated with product compliance testing.
    - _T2 Risk-Informed · all_: Demonstrate the ability to securely handle large volumes of information and demonstrate internal security practices.

## draft-ietf-lake-pqsuites
- **Source**: Quantum-Resistant Cipher Suites for EDHOC (LAKE WG)
- **URL**: https://www.ietf.org/archive/id/draft-ietf-lake-pqsuites-01.txt
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Implementations MUST follow the side-channel requirements given in the specifications of ML-KEM and ML-DSA.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Generate a new encapsulation/decapsulation key pair for each LAKE session.
    - _T3 Repeatable · keys_: ML-KEM keys used for ephemeral key exchange MUST be freshly generated for each LAKE protocol session.
