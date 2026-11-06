// SPDX-License-Identifier: AGPL-3.0-only

// ── Types ────────────────────────────────────────────────────────────────────

export type TokenType = 'JWT' | 'SAML' | 'OIDC' | 'Kerberos' | 'OAuth2'

export type HNDLRisk = 'critical' | 'high' | 'medium' | 'low'

export type MigrationPriority = 'immediate' | 'high' | 'medium' | 'low'

export interface IAMComponent {
  id: string
  name: string
  category: string
  currentAlgorithm: string
  quantumRisk: HNDLRisk
  migrationPriority: MigrationPriority
  pqcReplacement: string
  notes: string
}

export interface IAMProtocol {
  id: string
  name: string
  tokenType: TokenType
  signingAlgorithm: string
  pqcReplacement: string
  signatureSize: { classical: number; pqc: number }
  quantumRisk: HNDLRisk
  notes: string
}

export interface DirectoryService {
  id: string
  name: string
  protocols: string[]
  keyExchangeAlgorithm: string
  authAlgorithm: string
  quantumScore: number // 1-10
  vulnerabilities: string[]
  migrationPath: string
  vendorTimeline: string
}

export interface ZeroTrustLayer {
  id: string
  name: string
  pillar: string
  currentCrypto: string
  quantumRisk: HNDLRisk
  pqcApproach: string
  migrationComplexity: 'low' | 'medium' | 'high'
  description: string
}

export interface CryptoRisk {
  tokenType: TokenType
  quantumRisk: HNDLRisk
  rationale: string
  typicalLifetime: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const IAM_COMPONENTS: IAMComponent[] = [
  {
    id: 'sso',
    name: 'Single Sign-On (SSO)',
    category: 'Authentication',
    currentAlgorithm: 'RSA-2048 / ECDSA P-256',
    quantumRisk: 'high',
    migrationPriority: 'high',
    pqcReplacement: 'ML-DSA-65',
    notes:
      'SSO tokens are long-lived signed assertions; a quantum computer that breaks the signing key could forge tokens for all downstream sessions',
  },
  {
    id: 'mfa',
    name: 'Multi-Factor Authentication (MFA)',
    category: 'Authentication',
    currentAlgorithm:
      'HMAC (TOTP/HOTP); FIDO2/WebAuthn credential signatures, ES256 (ECDSA P-256) or RS256 by default',
    quantumRisk: 'medium',
    migrationPriority: 'medium',
    pqcReplacement:
      'Illustrative: ML-DSA-44 as the FIDO2 credential signature once authenticators, browsers and relying parties support it (plus a PQC attestation chain if you use attestation); HMAC-based OTP not part of the signature migration',
    notes:
      'TOTP/HOTP use symmetric HMAC, not public-key signatures. FIDO2 has two separate signature uses: the credential key signs every login assertion (the algorithm is agreed at registration, so moving to a PQC algorithm means re-enrolling credentials), and attestation proves the authenticator model at registration and can be skipped by the relying party. WebAuthn Level 3 names no post-quantum algorithm; ML-DSA identifiers exist for JOSE and COSE (RFC 9964), but that is not authenticator or browser support',
  },
  {
    id: 'jwt-issuance',
    name: 'JWT Issuance (Authorization Server)',
    category: 'Token Management',
    currentAlgorithm: 'RS256 (RSA-2048) / ES256 (ECDSA P-256)',
    quantumRisk: 'high',
    migrationPriority: 'immediate',
    pqcReplacement: 'ML-DSA-65 (FIPS 204)',
    notes:
      'Access tokens are often cached and reused until they expire; a token forged with a broken signing key is accepted while the verifier trusts that key',
  },
  {
    id: 'saml-idp',
    name: 'SAML Identity Provider',
    category: 'Federation',
    currentAlgorithm: 'RSA-SHA256 / RSA-SHA512',
    quantumRisk: 'critical',
    migrationPriority: 'immediate',
    pqcReplacement: 'ML-DSA-65 via XML-DSig profile update',
    notes:
      'SAML assertions are signed; a quantum computer that breaks the signing key could forge assertions, and long-lived assertions and keys lengthen the window',
  },
  {
    id: 'oauth-as',
    name: 'OAuth 2.0 Authorization Server',
    category: 'Authorization',
    currentAlgorithm: 'RS256 / ES256 for token signing',
    quantumRisk: 'high',
    migrationPriority: 'high',
    pqcReplacement: 'ML-DSA-44 or ML-DSA-65',
    notes: 'PKCE and PAR reduce some attack surface but token signing must migrate',
  },
  {
    id: 'ldap',
    name: 'LDAP Directory Service',
    category: 'Directory',
    currentAlgorithm: 'TLS with RSA-2048 / ECDSA P-256',
    quantumRisk: 'high',
    migrationPriority: 'high',
    pqcReplacement: 'Hybrid TLS 1.3 with ML-KEM-768 + X25519',
    notes: 'LDAP over TLS (LDAPS); channel security drives migration priority',
  },
  {
    id: 'kerberos-kdc',
    name: 'Kerberos Key Distribution Center',
    category: 'Authentication',
    currentAlgorithm:
      'AES-256 ticket encryption (symmetric) + PKINIT (RSA signatures; RSA or DH key delivery)',
    quantumRisk: 'critical',
    migrationPriority: 'immediate',
    pqcReplacement: 'AES-256 (retain) + ML-KEM for PKINIT key delivery (illustrative target)',
    notes:
      'Tickets and session keys are symmetric. PKINIT (RFC 4556) is the public-key step: it authenticates the client with a certificate and delivers the AS reply key by Diffie-Hellman or by RSA encryption, so it is the quantum-exposed part. Recovering a reply key exposes that one client reply, not the KRBTGT long-term key',
  },
  {
    id: 'cert-auth',
    name: 'Certificate-Based Authentication (PIV/CAC)',
    category: 'Authentication',
    currentAlgorithm: 'RSA-2048 / ECDSA P-256 on card',
    quantumRisk: 'critical',
    migrationPriority: 'immediate',
    pqcReplacement: 'ML-DSA-44 or ML-DSA-65 on PQC-capable smart card',
    notes: 'Card replacement cycle makes this the longest-lead migration item; plan now',
  },
]

export const IAM_PROTOCOLS: IAMProtocol[] = [
  {
    id: 'jwt-rs256',
    name: 'JWT with RS256',
    tokenType: 'JWT',
    signingAlgorithm: 'RSA-PKCS1v15 SHA-256 (RSA-2048)',
    pqcReplacement: 'ML-DSA-65',
    signatureSize: { classical: 256, pqc: 3309 },
    quantumRisk: 'high',
    notes: 'Most common; JWK Set must include PQC public key for validation',
  },
  {
    id: 'jwt-es256',
    name: 'JWT with ES256',
    tokenType: 'JWT',
    signingAlgorithm: 'ECDSA P-256 SHA-256',
    pqcReplacement: 'ML-DSA-44',
    signatureSize: { classical: 64, pqc: 2420 },
    quantumRisk: 'high',
    notes: 'Compact signature; PQC increases by ~38x — affects token transport overhead',
  },
  {
    id: 'saml-rsa',
    name: 'SAML 2.0 XML-DSig',
    tokenType: 'SAML',
    signingAlgorithm: 'RSA-SHA256',
    pqcReplacement: 'ML-DSA-65 via XML-DSig v2.0 profile',
    signatureSize: { classical: 256, pqc: 3309 },
    quantumRisk: 'critical',
    notes: 'SAML assertions are XML; base64-encoded PQC signatures increase payload significantly',
  },
  {
    id: 'oidc-id-token',
    name: 'OIDC ID Token',
    tokenType: 'OIDC',
    signingAlgorithm: 'RS256 or ES256',
    pqcReplacement: 'ML-DSA-65 (algorithm: "ML-DSA-65" in JOSE header)',
    signatureSize: { classical: 256, pqc: 3309 },
    quantumRisk: 'high',
    notes: 'OIDC discovery doc (/.well-known/openid-configuration) must expose PQC JWKS',
  },
  {
    id: 'kerberos-ticket',
    name: 'Kerberos Service Ticket',
    tokenType: 'Kerberos',
    signingAlgorithm: 'AES-256 symmetric ticket encryption (PKINIT delivers only the AS reply key)',
    pqcReplacement: 'AES-256 retained; ML-KEM-768 for PKINIT key delivery (illustrative target)',
    signatureSize: { classical: 256, pqc: 1088 },
    quantumRisk: 'critical',
    notes:
      'The quantum-exposed step is PKINIT key delivery, not the tickets. A recovered key is useful only while the tickets it protects are valid (10 hours is the default Maximum lifetime for user ticket)',
  },
  {
    id: 'oauth2-at',
    name: 'OAuth 2.0 Access Token (JWT)',
    tokenType: 'OAuth2',
    signingAlgorithm: 'RS256 / ES256',
    pqcReplacement: 'ML-DSA-44 (shorter lifetime tokens tolerate a medium quantum risk)',
    signatureSize: { classical: 256, pqc: 2420 },
    quantumRisk: 'medium',
    notes:
      'Short-lived (1h) shortens the window in which a forged token is useful; refresh tokens need higher priority migration',
  },
]

export const DIRECTORY_SERVICES: DirectoryService[] = [
  {
    id: 'active-directory',
    name: 'Microsoft Active Directory',
    protocols: ['Kerberos v5', 'LDAP', 'NTLM', 'LDAPS', 'PKINIT'],
    keyExchangeAlgorithm:
      'PKINIT (RFC 4556): certificate signature plus Diffie-Hellman or RSA key delivery; password pre-authentication uses a password-derived symmetric key',
    authAlgorithm: 'AES256/AES128 with HMAC-SHA1, RC4-HMAC (legacy)',
    quantumScore: 9,
    vulnerabilities: [
      "PKINIT delivers the AS reply key by Diffie-Hellman or RSA encryption (RFC 4556); both are quantum-vulnerable. Recovering the reply key of one exchange exposes that client's TGT session key, not other users or the KRBTGT key",
      'Kerberos TGTs and service tickets are protected by symmetric keys; a recovered session key is useful only while its ticket is valid (10 hours is the default Maximum lifetime for user ticket and for service ticket)',
      'NTLM uses MD4 hashing and has no forward secrecy; captured challenge-responses are a classical weakness, not a quantum one',
      'LDAP bind over plaintext leaks credentials; LDAPS needs PQC TLS update',
      'AS-REP roasting is a classical password attack, not a PKINIT or quantum one: for an account with Kerberos pre-authentication disabled, anyone can request an AS-REP whose encrypted part is protected by a key derived from the account password, then guess passwords offline (RFC 4120)',
      'A Golden Ticket needs the KRBTGT long-term key, which attackers obtain by classical means such as credential dumping on a domain controller (MITRE ATT&CK T1558.001); a quantum computer adds no step to a key already stolen, and post-quantum PKINIT would not stop it',
    ],
    migrationPath:
      "This module's target design: hybrid Kerberos with ML-KEM PKINIT once Microsoft ships it (we found no published Microsoft date for PKINIT PQC); disable NTLM; enforce LDAPS with hybrid TLS 1.3",
    vendorTimeline:
      'Microsoft Entra / Windows Server PQC: no published date found (this module assumes 2026-2027)',
  },
  {
    id: 'openldap',
    name: 'OpenLDAP',
    protocols: ['LDAP', 'LDAPS', 'StartTLS', 'SASL/GSSAPI'],
    keyExchangeAlgorithm: 'TLS with RSA-2048 / ECDSA P-256',
    authAlgorithm: 'SASL/GSSAPI (delegates to Kerberos), simple bind (LDAP password)',
    quantumScore: 7,
    vulnerabilities: [
      'TLS channel uses RSA/ECDH key exchange — HNDL captures expose all LDAP traffic',
      'Simple bind passwords transmitted over TLS; quantum-broken TLS exposes them',
      'SASL/GSSAPI security depends on Kerberos channel security',
    ],
    migrationPath:
      'Update OpenSSL 3.x TLS to hybrid ML-KEM-768+X25519 for LDAPS; verify GnuTLS or NSS backend supports PQC if not using OpenSSL',
    vendorTimeline: 'OpenLDAP + OpenSSL 3.x oqsprovider: Available now (experimental)',
  },
  {
    id: 'azure-ad',
    name: 'Microsoft Entra ID (Azure AD)',
    protocols: ['OIDC', 'SAML 2.0', 'OAuth 2.0', 'WS-Federation', 'LDAPS (Entra DS)'],
    keyExchangeAlgorithm: 'RSA-2048 / ECDSA P-256 for token signing',
    authAlgorithm: 'RS256 / ES256 JWT signing; ECDH for MSAL TLS',
    quantumScore: 8,
    vulnerabilities: [
      'JWT ID tokens signed with RSA-2048 — a quantum computer that breaks the signing key can forge them (a forgery risk, not harvest-now-decrypt-later)',
      'SAML assertions are long-lived signed federation tokens — a forged assertion is accepted while the verifier trusts the signing key',
      'Refresh tokens are opaque encrypted blobs (not RSA-signed JWTs); the quantum-exposed parts are the RSA-signed access and ID tokens (forgery) and the TLS key exchange that carries them (HNDL)',
      'Entra DS LDAPS uses TLS with classical ciphers',
    ],
    migrationPath:
      "This module's target design: ML-DSA token signing for Entra ID once Microsoft offers it (we found no published Microsoft Entra PQC date or Conditional Access PQC policy); enable hybrid TLS for MSAL SDK connections",
    vendorTimeline: 'Microsoft Entra PQC: no published date found (this module assumes 2026-2027)',
  },
]

export const ZERO_TRUST_LAYERS: ZeroTrustLayer[] = [
  {
    id: 'identity-verification',
    name: 'Identity Verification',
    pillar: 'Identity',
    currentCrypto: 'RSA-2048 / ECDSA P-256 (certificates, JWT signing)',
    quantumRisk: 'critical',
    pqcApproach:
      'ML-DSA-65 for all identity assertions; hybrid certificates during transition; PQC-capable IdP',
    migrationComplexity: 'high',
    description:
      'All identity tokens (JWT, SAML, OIDC ID tokens) must be signed with PQC algorithms. This requires IdP software updates and relying party validation updates.',
  },
  {
    id: 'device-trust',
    name: 'Device Trust / Attestation',
    pillar: 'Device',
    currentCrypto: 'TPM 2.0 RSA-2048 / ECDSA P-256 endorsement keys',
    quantumRisk: 'high',
    pqcApproach:
      'TPM firmware with PQC support once your TPM vendor offers it (not verified here; check the vendor and the TCG specifications); interim: hybrid RSA+ML-DSA device certificates',
    migrationComplexity: 'high',
    description:
      'Device attestation certificates must migrate to PQC. A hardware replacement cycle (this sample plan assumes 5-7 years; use your own fleet data) makes this a long-lead item. Prioritize high-value endpoint fleet.',
  },
  {
    id: 'session-management',
    name: 'Session Management',
    pillar: 'Network',
    currentCrypto: 'TLS 1.3 with ECDH P-256 or X25519 key exchange',
    quantumRisk: 'high',
    pqcApproach:
      'Hybrid TLS 1.3 with ML-KEM-768 + X25519; enforce PFS; update session token signing to ML-DSA',
    migrationComplexity: 'medium',
    description:
      'TLS sessions carrying identity tokens need a quantum-resistant key exchange. Hybrid key exchange protects the confidentiality of the session only when the client, the server and every TLS-terminating proxy or load balancer on the path support and negotiate a hybrid group (OpenSSL 3.5 offers X25519MLKEM768 by default; test each hop). It does not change authentication: certificates and signatures stay classical until PQC certificates are deployed.',
  },
  {
    id: 'authorization',
    name: 'Authorization / Policy Enforcement',
    pillar: 'SecSoftware',
    currentCrypto: 'RSA / ECDSA signed policy tokens; HMAC for API gateway enforcement',
    quantumRisk: 'medium',
    pqcApproach:
      'ML-DSA-44 for policy token signing; HMAC-SHA256 for enforcement (already quantum-safe at 256-bit)',
    migrationComplexity: 'medium',
    description:
      'Authorization tokens (JWTs, Macaroons, capability tokens) need PQC signing. API gateway enforcement via HMAC is already quantum-safe if 256-bit keys are used.',
  },
  {
    id: 'audit',
    name: 'Audit Log Integrity',
    pillar: 'Data',
    currentCrypto: 'RSA-2048 / ECDSA P-256 for log signing; HMAC for integrity',
    quantumRisk: 'medium',
    pqcApproach:
      'SLH-DSA or ML-DSA for tamper-evident log signing; existing HMAC chains may be sufficient',
    migrationComplexity: 'low',
    description:
      'Audit log signing ensures non-repudiation. SLH-DSA stateless signatures are well-suited for high-volume log signing. HMAC-based integrity chains (256-bit) are already quantum-safe.',
  },
]

export const CRYPTO_RISKS: CryptoRisk[] = [
  {
    tokenType: 'Kerberos',
    quantumRisk: 'critical',
    rationale:
      "Tickets are encrypted with symmetric keys. The quantum-exposed step is PKINIT (RFC 4556), which delivers the AS reply key by Diffie-Hellman or RSA encryption. Breaking it for a captured exchange yields that client's reply key and TGT session key, which let an attacker act as that one client until the ticket expires. Forging tickets for any account, a Golden Ticket, additionally needs the KRBTGT long-term key, which a PKINIT break does not give.",
    typicalLifetime: '10 hours (AD default)',
  },
  {
    tokenType: 'SAML',
    quantumRisk: 'critical',
    rationale:
      'SAML assertions are signed. A quantum computer that breaks the signing key could forge assertions that grant federated access to all relying parties; long-lived assertions (hours to days) lengthen the window. This is a forgery risk, not harvest-now-decrypt-later.',
    typicalLifetime: '1-8 hours (configurable)',
  },
  {
    tokenType: 'JWT',
    quantumRisk: 'high',
    rationale:
      'JWTs are signed and commonly cached and reused for their full validity period. A forged JWT is accepted while the verifier trusts the signing key, so the risk is forgery, not harvest-now-decrypt-later. Refresh tokens (weeks/months) give the longest window; access tokens (1h) a shorter but still significant one.',
    typicalLifetime: 'Access: 1h; Refresh: 7-90 days',
  },
  {
    tokenType: 'OIDC',
    quantumRisk: 'high',
    rationale:
      'OIDC ID tokens carry identity claims and are signed, not encrypted. A quantum computer that breaks the issuer signing key could forge identity assertions to all OIDC relying parties that trust the issuer. This is a forgery risk, not harvest-now-decrypt-later.',
    typicalLifetime: '1-24 hours',
  },
  {
    tokenType: 'OAuth2',
    quantumRisk: 'medium',
    rationale:
      'Short-lived access tokens (1h) shorten the window in which a forged token is useful, but long-lived refresh tokens are critical. Client credentials and device flow tokens may have longer lifetimes requiring priority migration.',
    typicalLifetime: 'Access: 1h; Refresh: 14-90 days',
  },
]

export const SIGNATURE_SIZE_DATA = {
  RS256: { bytes: 256, timingMs: 1.0, label: 'RS256 (RSA-2048)' },
  ES256: { bytes: 64, timingMs: 0.5, label: 'ES256 (ECDSA P-256)' },
  'ML-DSA-44': { bytes: 2420, timingMs: 1.8, label: 'ML-DSA-44 (NIST Level 2)' },
  'ML-DSA-65': { bytes: 3309, timingMs: 2.1, label: 'ML-DSA-65 (NIST Level 3)' },
  'ML-DSA-87': { bytes: 4627, timingMs: 3.0, label: 'ML-DSA-87 (NIST Level 5)' },
} as const

export type SigningAlgorithm = keyof typeof SIGNATURE_SIZE_DATA

// Relative years counted from when the learner starts, so the sample plan never reads as a published calendar.
export const ZERO_TRUST_MIGRATION_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'] as const
export type MigrationYear = (typeof ZERO_TRUST_MIGRATION_YEARS)[number]
