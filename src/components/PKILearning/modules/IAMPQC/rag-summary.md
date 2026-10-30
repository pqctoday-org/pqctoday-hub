# Identity & Access Management with PQC

Module covering PQC migration for enterprise IAM systems including JWT/SAML token signing, Active Directory, and zero trust identity.

## Key Topics

- JWT, SAML, OIDC token signing migration to ML-DSA (FIPS 204)
- Active Directory, LDAP, Kerberos quantum vulnerabilities and quantum risk scores
- IAM vendor roadmaps: Okta, Microsoft Entra, PingFederate, ForgeRock, CyberArk, HashiCorp Vault, Keycloak
- Zero trust identity architecture with PQC across five pillars
- Harvest Now, Decrypt Later (HNDL) risk for Kerberos PKINIT exchanges and the TLS channels that carry identity traffic; signed JWT, SAML and OIDC tokens carry a forgery risk, not an HNDL risk (NIST IR 8547)
- **Identity Proxy Architecture**: Bridging PQC-migrated Identity Providers (IdP) with classical Service Providers (SP) by translating SAML signatures (ML-DSA to RSA).

## Workshop Steps

1. IAM Crypto Inventory — audit 8 components by quantum risk level and migration priority
2. Token Migration Lab — compare RS256/ES256 vs ML-DSA-44/65/87 signature sizes and header changes
3. Directory Services Analyzer — AD/LDAP/Azure AD quantum risk scoring and attack scenario analysis
4. Vendor Readiness Scorer — score IAM vendors across token signing, MFA, API security, roadmap dimensions
5. Zero Trust Identity Architect — assign migration years to 5 identity pillars and generate a phased roadmap
6. Identity Proxy Simulator — test authentication flows by translating ML-DSA SAML assertions into classical RSA assertions for legacy downstream apps.

## Algorithms Covered

- ML-DSA-44 (FIPS 204, NIST Level 2) — short-lived tokens, OAuth2 access tokens
- ML-DSA-65 (FIPS 204, NIST Level 3) — enterprise IAM, SAML, OIDC ID tokens
- ML-DSA-87 (FIPS 204, NIST Level 5) — government/NSS, CNSA 2.0
- ML-KEM-768 (FIPS 203) — hybrid TLS for LDAPS, MSAL, Kerberos PKINIT
- SLH-DSA (FIPS 205) — stateless audit log signing

## Regulatory Context

- CNSA 2.0: the NSA FAQ (v2.2, October 2026) quotes CNSSP 15 as requiring CNSA 2.0 algorithms in all new NSS acquisitions by 1 January 2027 and mandating their use by 31 December 2031, unless otherwise noted; ML-DSA-87 is the signature algorithm for general signing, with LMS or XMSS for software and firmware signing
- NIST IR 8547 (final, October 2026; systems that follow NIST standards): deprecates quantum-vulnerable RSA/ECDSA/EdDSA signatures at every key size of 112-bit security and up (RSA-2048 and RSA-3072, used to sign many IAM tokens, included) after 2030 and disallows them after 2035
- PCI DSS v4.0.1: cryptographic inventory required (Req. 12.3.3)
- DORA (EU): ICT risk management including IAM cryptographic risk
