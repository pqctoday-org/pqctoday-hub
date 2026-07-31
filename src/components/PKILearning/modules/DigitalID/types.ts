// SPDX-License-Identifier: GPL-3.0-only
export interface UserProfile {
  legalName: string
  birthDate: string // ISO 8601
  nationality: string // ISO 3166-1 alpha-2
  address: string
}

export type KeyCurve = 'P-256' | 'P-384' | 'Ed25519'
export type KeyAlgorithm = 'ES256' | 'ES384' | 'EdDSA'

export interface CryptoKey {
  id: string
  type: 'P-256' | 'P-384' | 'Ed25519' | 'RSA-2048'
  algorithm?: string
  curve?: string
  publicKey: string // Hex or PEM
  privateKey?: string // Hex or PEM
  created: string
  usage: 'SIGN' | 'ENC' | 'ALL'
  status: 'ACTIVE' | 'REVOKED'
  meta?: unknown // Store handle or other metadata
}

export interface CredentialAttribute {
  name: string
  value: string | number | boolean
  type?: string
}

export interface VerifiableCredential {
  id: string
  type: string[] // e.g., ["VerifiableCredential", "EuropeanHealthID"]
  issuer: string
  issuanceDate: string
  expirationDate?: string
  credentialSubject: Record<string, unknown>
  proof?: {
    type: string
    created: string
    verificationMethod: string
    proofPurpose: string
    jws: string
  }
  // `dc+sd-jwt` replaced `vc+sd-jwt` in draft-ietf-oauth-sd-jwt-vc (Nov 2024),
  // to avoid colliding with the W3C-registered `vc` subtype. OpenID4VCI 1.0
  // Final uses `dc+sd-jwt` exclusively.
  format?: 'mso_mdoc' | 'dc+sd-jwt' | 'jwt_vc'
  raw?: string
}

export interface WalletInstance {
  id: string
  owner: {
    legalName: string
    birthDate: string
    nationality: string
    address: string
  }
  keys: CryptoKey[]
  credentials: VerifiableCredential[]
  history: ActivityLog[]
}

export interface ActivityLog {
  id: string
  timestamp: string
  type: 'ISSUANCE' | 'PRESENTATION' | 'AUTH' | 'SIGNING'
  actor: string
  details: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  metadata?: unknown
}

// --- Protocol Types ---

/**
 * One issuer-signed data element, kept verbatim (salt included) so the holder
 * can present a subset later. ISO 18013-5 §9.1.2.4 — the verifier re-hashes
 * exactly these bytes and matches the result against the signed MSO, which is
 * only possible if `random` survives issuance.
 */
export interface IssuerSignedItem {
  digestID: number
  /** base64 of the 16-byte salt */
  random: string
  elementIdentifier: string
  elementValue: unknown
}

export interface MsoMdoc {
  docType: string
  namespaces: Record<string, Record<string, unknown>>
  /** Present on mdocs issued from 2026-07-31; absent on older stored credentials. */
  issuerSignedItems?: IssuerSignedItem[]
  mobileSecurityObject: {
    version: string
    digestAlgorithm: string
    docType: string
    validityInfo: {
      signed: string
      validFrom: string
      validUntil: string
    }
    deviceKeyInfo: {
      deviceKey: unknown // Public key JWK/COSE
    }
    /**
     * digestID -> salted hash of the element, per namespace. `createMdoc` has
     * always written this (it is what the issuer's COSE_Sign1 actually covers)
     * but the type omitted it, so nothing downstream could read the digests
     * back to verify a selective disclosure. Declared 2026-07-31.
     */
    valueDigests?: Record<string, Record<string, unknown>>
  }
  issuerSignature: string
}

export interface OpenID4VCI_CredentialOffer {
  credential_issuer: string
  credential_configuration_ids: string[]
  grants: {
    authorization_code?: {
      issuer_state?: string
    }
    'urn:ietf:params:oauth:grant-type:pre-authorized_code'?: {
      'pre-authorized_code': string
      user_pin_required?: boolean
    }
  }
}

export interface OpenID4VP_AuthorizationRequest {
  response_type: string
  client_id: string
  response_uri: string
  nonce: string
  presentation_definition?: unknown // Simple JSON object for now, or strict Type if needed
  scope?: string
}

export interface CSC_CredentialsListRequest {
  userID: string
  credentialInfo: boolean
}

export interface StatusList {
  purpose: 'revocation' | 'suspension'
  encodedList: string // GZIP + Base64
  index: number
}
