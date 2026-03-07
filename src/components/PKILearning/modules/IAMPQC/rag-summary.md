# Identity & Access Management with PQC

Module covering PQC migration for enterprise IAM systems including JWT/SAML token signing, Active Directory, and zero trust identity.

## Key Topics

- JWT, SAML, OIDC token signing migration to ML-DSA (FIPS 204)
- Active Directory, LDAP, Kerberos quantum vulnerabilities and HNDL risk scores
- IAM vendor roadmaps: Okta, Microsoft Entra, PingFederate, ForgeRock, CyberArk, HashiCorp Vault, Keycloak
- Zero trust identity architecture with PQC across five pillars
- Harvest Now, Decrypt Later (HNDL) risk for Kerberos tickets, SAML assertions, and JWT refresh tokens

## Workshop Steps

1. IAM Crypto Inventory — audit 8 components by quantum risk level and migration priority
2. Token Migration Lab — compare RS256/ES256 vs ML-DSA-44/65/87 signature sizes and header changes
3. Directory Services Analyzer — AD/LDAP/Azure AD HNDL risk scoring and attack scenario analysis
4. Vendor Readiness Scorer — score IAM vendors across token signing, MFA, API security, roadmap dimensions
5. Zero Trust Identity Architect — assign migration years to 5 identity pillars and generate a phased roadmap

## Algorithms Covered

- ML-DSA-44 (FIPS 204, NIST Level 2) — short-lived tokens, OAuth2 access tokens
- ML-DSA-65 (FIPS 204, NIST Level 3) — enterprise IAM, SAML, OIDC ID tokens
- ML-DSA-87 (FIPS 204, NIST Level 5) — government/NSS, CNSA 2.0
- ML-KEM-768 (FIPS 203) — hybrid TLS for LDAPS, MSAL, Kerberos PKINIT
- SLH-DSA (FIPS 205) — stateless audit log signing

## Regulatory Context

- CNSA 2.0: NSS must use ML-DSA-87 by 2027
- NIST IR 8547: deprecate RSA/ECDSA in IAM tokens after 2030
- PCI DSS v4.0.1: cryptographic inventory required (Req. 12.3.3)
- DORA (EU): ICT risk management including IAM cryptographic risk
