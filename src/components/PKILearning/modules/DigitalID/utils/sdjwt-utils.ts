// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { PemConverter } from '@peculiar/x509'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import type { CryptoKey, CredentialAttribute } from '../types'
import type { CryptoProvider } from './crypto-provider'
import { assertSigningSelection, isHsmBackedKey } from './hsm-crypto-provider'

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

/** Canonical public members shared by issuance and synchronous wallet-key selection. */
export function sampleHolderPublicJwk(key: CryptoKey): JsonWebKey {
  assertSigningSelection(key.algorithm, key.curve)
  const ed = key.algorithm === 'EdDSA'
  let bytes: Uint8Array
  if (isHsmBackedKey(key)) {
    if (
      key.publicKey.length === 0 ||
      key.publicKey.length % 2 !== 0 ||
      !/^[0-9a-f]+$/i.test(key.publicKey)
    ) {
      throw new Error('Invalid sample holder public-key hex')
    }
    const encoded = Uint8Array.from(key.publicKey.match(/../g)!, (part) => parseInt(part, 16))
    bytes = ed ? encoded : new Uint8Array(AsnConvert.parse(encoded, OctetString).buffer)
  } else {
    const decoded = PemConverter.decode(atob(key.publicKey))
    if (decoded.length !== 1) throw new Error('Expected one sample holder public key')
    const spki = AsnConvert.parse(decoded[0]!, SubjectPublicKeyInfo)
    const expectedAlgorithm = new AlgorithmIdentifier({
      algorithm: ed ? '1.3.101.112' : '1.2.840.10045.2.1',
      ...(ed
        ? {}
        : {
            parameters: (key.curve === 'P-384'
              ? new Uint8Array([6, 5, 43, 129, 4, 0, 34])
              : new Uint8Array([6, 8, 42, 134, 72, 206, 61, 3, 1, 7])
            ).buffer,
          }),
    })
    if (!spki.algorithm.isEqual(expectedAlgorithm))
      throw new Error('Sample holder SPKI does not match the selected algorithm')
    bytes = new Uint8Array(spki.subjectPublicKey)
  }
  const width = key.curve === 'P-384' ? 48 : 32
  if (bytes.length !== (ed ? 32 : 1 + 2 * width) || (!ed && bytes[0] !== 4)) {
    throw new Error('Sample holder public key does not match the selected curve')
  }
  return ed
    ? { kty: 'OKP', crv: 'Ed25519', x: toBase64Url(bytes) }
    : {
        kty: 'EC',
        crv: key.curve,
        x: toBase64Url(bytes.slice(1, 1 + width)),
        y: toBase64Url(bytes.slice(1 + width)),
      }
}

async function holderPublicJwk(key: CryptoKey): Promise<JsonWebKey> {
  const jwk = sampleHolderPublicJwk(key)
  const algorithm =
    key.algorithm === 'EdDSA' ? { name: 'Ed25519' } : { name: 'ECDSA', namedCurve: key.curve! }
  // Validate the actual point before issuance. Public members follow RFC 7518
  // (EC coordinates) or RFC 8037 (OKP), never encoded PEM text in x.
  await crypto.subtle.importKey('jwk', jwk, algorithm, true, ['verify'])
  return jwk
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
    // cnf records the actual sample holder public key; possession still requires
    // verification of the holder's key-binding signature.
    payload.cnf = {
      jwk: await holderPublicJwk(holderKey),
    }
  }

  const header = {
    alg: issuerKey.algorithm,
    typ: 'dc+sd-jwt',
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
