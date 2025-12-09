import type { CryptoKey, CredentialAttribute } from '../types'
import { signData, sha256Hash, bytesToBase64 } from './crypto-utils'
import { utf8ToBytes } from '@noble/hashes/utils.js'

interface Disclosure {
  raw: string // The full JSON array [salt, key, value] stringified
  encoded: string // Base64URL encoded raw
  hash: string // SHA-256 hash of encoded
  key: string
  value: unknown
  salt: string
}

export interface SdJwtVc {
  issuerJwt: string
  disclosures: Disclosure[]
  raw: string // <jwt>~<d1>~<d2>...~
}

const toBase64Url = (str: string): string => {
  return bytesToBase64(utf8ToBytes(str)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Create a single disclosure
const createDisclosure = (key: string, value: unknown): Disclosure => {
  const salt = toBase64Url(window.crypto.randomUUID()) // Simple salt
  const rawArray = [salt, key, value]
  const raw = JSON.stringify(rawArray)
  const encoded = toBase64Url(raw)
  const hash = sha256Hash(encoded)

  return { raw, encoded, hash, key, value, salt }
}

export const createSDJWT = async (
  claims: CredentialAttribute[],
  issuerKey: CryptoKey,
  holderKey?: CryptoKey, // For CNF claim (key binding)
  issuer: string = 'https://example.edu',
  vct: string = 'eu.europa.ec.eudi.diploma.1'
): Promise<SdJwtVc> => {
  const disclosures: Disclosure[] = []
  const sdHashes: string[] = []
  const plainClaims: Record<string, unknown> = {}

  // Process claims - assume all are selectively disclosable for this educational tool
  // In reality, some might be plain claims in the JWT
  for (const claim of claims) {
    if (claim.type === 'plain') {
      plainClaims[claim.name] = claim.value
    } else {
      const d = createDisclosure(claim.name, claim.value)
      disclosures.push(d)
      sdHashes.push(d.hash)
    }
  }

  // Construct Issuer JWT Payload
  const now = Math.floor(Date.now() / 1000)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    iss: issuer,
    sub: holderKey ? `user-wallet:${holderKey.id.substring(0, 8)}` : 'user-wallet-123',
    iat: now,
    exp: now + 365 * 24 * 60 * 60,
    vct: vct,
    _sd: sdHashes,
    ...plainClaims,
  }

  if (holderKey) {
    payload.cnf = {
      jwk: {
        kty: 'EC',
        crv: holderKey.curve,
        x: '...', // Simplified
        y: '...',
      },
    }
  }

  const header = {
    alg: issuerKey.algorithm,
    typ: 'vc+sd-jwt',
  }

  // Sign JWT
  // Simplified JWT construction: Header.Payload.Signature
  const encodedHeader = toBase64Url(JSON.stringify(header))
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const signature = await signData(issuerKey, signingInput)
  const issuerJwt = `${signingInput}.${signature}`

  // Construct final SD-JWT string: <IssuerJWT>~<Disclosure1>~<Disclosure2>~...~
  const raw = [issuerJwt, ...disclosures.map((d) => d.encoded), ''].join('~')

  return {
    issuerJwt,
    disclosures,
    raw,
  }
}

export const createPresentation = async (
  sdJwtVc: SdJwtVc,
  selectedClaimKeys: string[],
  holderKey: CryptoKey,
  audience: string,
  nonce: string
): Promise<string> => {
  // 1. Filter disclosures
  const selectedDisclosures = sdJwtVc.disclosures.filter((d) => selectedClaimKeys.includes(d.key))

  // 2. Create Key Binding JWT (KB-JWT)
  // It must sign over the hash of the SD-JWT (reconstructed with only selected disclosures)
  // But standard usually signs over the SD-Hash (hash of the issuer JWT + disclosures part)
  // For simple V2.0: KB-JWT signs nonce, aud, iat AND a hash of the SD-JWT parts used.

  // Reconstruct the presentation string without KB-JWT first
  const presentationPayload = [
    sdJwtVc.issuerJwt,
    ...selectedDisclosures.map((d) => d.encoded),
    '',
  ].join('~')
  const sdHash = sha256Hash(presentationPayload) // Hash of the presentation so far

  const kbHeader = {
    typ: 'kb+jwt',
    alg: holderKey.algorithm,
  }

  const now = Math.floor(Date.now() / 1000)
  const kbPayload = {
    iat: now,
    aud: audience,
    nonce: nonce,
    sd_hash: sdHash,
  }

  const encodedHeader = toBase64Url(JSON.stringify(kbHeader))
  const encodedPayload = toBase64Url(JSON.stringify(kbPayload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const signature = await signData(holderKey, signingInput)
  const kbJwt = `${signingInput}.${signature}`

  // Final Presentation: <IssuerJWT>~<SelectedDisclosures>~<KB-JWT>
  return `${presentationPayload}${kbJwt}`
}
