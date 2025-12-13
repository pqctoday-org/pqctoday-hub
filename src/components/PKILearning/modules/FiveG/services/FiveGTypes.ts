export interface FiveGTestVectors {
  profileA?: { hnPriv: string; ephPriv: string; zEcdh?: string }
  profileB?: { hnPriv: string; ephPriv: string; zEcdh?: string }
  profileC?: { zEcdh: string; zKem: string }
  milenage?: { k: string; op: string; rand: string }
}

export interface FiveGPhase {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
}

export interface FiveGState {
  profile?: 'A' | 'B' | 'C'
  sharedSecretHex?: string
  kEncHex?: string
  kMacHex?: string
  encryptedMSINHex?: string

  macTagHex?: string
  ephemeralPubKeyHex?: string
  ciphertextHex?: string // For PQC KEM
  // Stored Hex Keys for Robustness (Fixing OpenSSL File Logic)
  hnPrivHex?: string
  hnPubHex?: string
  ephPrivHex?: string
  ephPubHex?: string

  // Decoded SUPI parts
  mcc?: string
  mnc?: string
}

export interface AKAChallenge {
  rand: string
  autn: string
}

export interface AKAResponse {
  res: string
  ck: string
  ik: string
  auts?: string
}
