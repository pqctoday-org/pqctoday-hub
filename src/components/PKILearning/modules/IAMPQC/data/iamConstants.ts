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
    currentAlgorithm: 'HMAC-SHA256 (TOTP/HOTP), ECDSA (FIDO2)',
    quantumRisk: 'medium',
    migrationPriority: 'medium',
    pqcReplacement: 'ML-DSA-44 for FIDO2 attestation; HMAC unchanged',
    notes: 'TOTP/HOTP (symmetric HMAC) is quantum-safe; FIDO2 WebAuthn attestation needs PQC',
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
    currentAlgorithm: 'AES-256-CTS + RSA (PKINIT)',
    quantumRisk: 'critical',
    migrationPriority: 'immediate',
    pqcReplacement: 'AES-256 (retain) + ML-KEM for PKINIT key exchange',
    notes: 'Service tickets encrypted with session keys; PKINIT RSA is the critical HNDL vector',
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
    signingAlgorithm: 'AES-256-CTS-HMAC-SHA384 (session key wrapped via RSA PKINIT)',
    pqcReplacement: 'AES-256 retained; ML-KEM-768 for PKINIT encapsulation',
    signatureSize: { classical: 256, pqc: 1088 },
    quantumRisk: 'critical',
    notes: 'Long-lived tickets (10h default) present HNDL attack surface; PKINIT is the RSA vector',
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
    keyExchangeAlgorithm: 'RSA-2048 (PKINIT), DH (Kerberos pre-auth)',
    authAlgorithm: 'AES-256-CTS-HMAC-SHA384, RC4-HMAC (legacy)',
    quantumScore: 9,
    vulnerabilities: [
      'PKINIT uses RSA-2048 — quantum-vulnerable key exchange',
      'Kerberos TGTs (10h) and service tickets (10h) are long-lived HNDL targets',
      'NTLM uses MD4 hashing and has no forward secrecy; captured challenge-responses are a classical weakness, not a quantum one',
      'LDAP bind over plaintext leaks credentials; LDAPS needs PQC TLS update',
      'AS-REP roasting targets pre-authentication bypasses, exposing RSA-encrypted tickets',
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
      'Future TPM with PQC-capable firmware (TCG PQC profile, forthcoming); interim: hybrid RSA+ML-DSA device certificates',
    migrationComplexity: 'high',
    description:
      'Device attestation certificates must migrate to PQC. TPM hardware replacement cycle (5-7 years) makes this a long-lead item. Prioritize high-value endpoint fleet.',
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
      'TLS sessions carrying identity tokens must use quantum-safe key exchange. Hybrid TLS is available in Chrome, OpenSSL 3.x, and major load balancers now.',
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
      'Kerberos TGTs (10h) and service tickets (10h) encrypted with RSA PKINIT session keys. A quantum computer decrypting captured traffic could forge arbitrary tickets, breaking the entire domain.',
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

export const ZERO_TRUST_MIGRATION_YEARS = ['2025', '2026', '2027', '2028'] as const
export type MigrationYear = (typeof ZERO_TRUST_MIGRATION_YEARS)[number]
