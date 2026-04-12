// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoKey, CredentialAttribute } from '../types'
import type { CryptoProvider } from './crypto-provider'

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

const bytesToBase64 = (bytes: Uint8Array): string => {
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('')
  return btoa(binString)
}

const toBase64Url = (input: string | Uint8Array): string => {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Create a single disclosure
const createDisclosure = async (
  key: string,
  value: unknown,
  provider: CryptoProvider,
  onLog?: (log: string) => void
): Promise<Disclosure> => {
  const salt = toBase64Url(new TextEncoder().encode(window.crypto.randomUUID())) // Simple salt
  const rawArray = [salt, key, value]
  const raw = JSON.stringify(rawArray)
  const encoded = toBase64Url(new TextEncoder().encode(raw))
  const hash = await provider.sha256Hash(encoded, onLog)

  return { raw, encoded, hash, key, value, salt }
}

export const createSDJWT = async (
  claims: CredentialAttribute[],
  issuerKey: CryptoKey,
  holderKey: CryptoKey | undefined, // For CNF claim (key binding)
  provider: CryptoProvider,
  issuer: string = 'https://example.edu',
  vct: string = 'eu.europa.ec.eudi.diploma.1',
  onLog?: (log: string) => void
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
      const d = await createDisclosure(claim.name, claim.value, provider, onLog)
      disclosures.push(d)
      sdHashes.push(d.hash)
    }
  }

  // EUDI SD-JWT requires _sd array elements to be lexicographically sorted
  sdHashes.sort()

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
    _sd_alg: 'sha-256',
    ...plainClaims,
  }

  if (holderKey) {
    // cnf (confirmation) claim per RFC 9701 §3.1 — binds the credential to the holder's key.
    // publicKey is a hex-encoded DER SubjectPublicKeyInfo point as stored by our CryptoProvider.
    // In a production implementation this would be parsed into discrete x/y JWK coordinates;
    // here we encode the full point as the x value to preserve verifiability within the simulation.
    payload.cnf = {
      jwk: {
        kty: 'EC',
        crv: holderKey.curve,
        x: toBase64Url(holderKey.publicKey), // full DER public key point, Base64URL-encoded
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

  const signature = await provider.signData(issuerKey, signingInput, onLog)
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
  nonce: string,
  provider: CryptoProvider,
  onLog?: (log: string) => void
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
  const sdHash = await provider.sha256Hash(presentationPayload, onLog) // Hash of the presentation so far

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

  const signature = await provider.signData(holderKey, signingInput, onLog)
  const kbJwt = `${signingInput}.${signature}`

  // Final Presentation: <IssuerJWT>~<SelectedDisclosures>~<KB-JWT>
  return `${presentationPayload}${kbJwt}`
}
