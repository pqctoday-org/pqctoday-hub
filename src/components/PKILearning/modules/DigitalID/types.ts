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
  format?: 'mso_mdoc' | 'vc+sd-jwt' | 'jwt_vc'
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

export interface MsoMdoc {
  docType: string
  namespaces: Record<string, Record<string, unknown>>
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
