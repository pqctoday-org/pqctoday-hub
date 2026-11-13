// SPDX-License-Identifier: AGPL-3.0-only
import { SAMPLE_JWT_PAYLOAD } from './constants'
import {
  base64urlDecode,
  base64urlEncode,
  decodeJWT,
  generateJwsKeyPair,
  signJWS,
  toAkpJwk,
  verifyJWS,
  type AkpJwk,
} from './jwtUtils'

export const DEFAULT_DPOP_SAMPLE_TARGET = 'https://api.example.com/resource'
const encoder = new TextEncoder()
const bytes = (value: string) => encoder.encode(value).byteLength

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeDpopSampleTarget(value: string): string {
  let target: URL
  try {
    target = new URL(value.trim())
  } catch {
    throw new Error('Enter an absolute HTTP(S) sample target without a query or fragment')
  }
  if (!['https:', 'http:'].includes(target.protocol) || value.includes('?') || value.includes('#'))
    throw new Error('Enter an absolute HTTP(S) sample target without a query or fragment')
  return target.href
}

function sampleClock(): number {
  const { iat, exp } = SAMPLE_JWT_PAYLOAD
  if (
    typeof iat !== 'number' ||
    !Number.isSafeInteger(iat) ||
    typeof exp !== 'number' ||
    exp <= iat
  )
    throw new Error('The historical sample clock is not defined')
  return iat
}

async function sha256url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return base64urlEncode(new Uint8Array(digest))
}

function publicAkp(value: unknown, allowKid: boolean): AkpJwk {
  if (
    !isRecord(value) ||
    value.kty !== 'AKP' ||
    value.alg !== 'ML-DSA-65' ||
    typeof value.pub !== 'string' ||
    Object.keys(value).some(
      (name) => !['kty', 'alg', 'pub', ...(allowKid ? ['kid'] : [])].includes(name)
    ) ||
    (allowKid && value.kid !== undefined && typeof value.kid !== 'string')
  )
    throw new Error('The named sample requires a minimal public-only ML-DSA-65 AKP JWK')
  const key = base64urlDecode(value.pub)
  if (key.length !== 1952 || base64urlEncode(key) !== value.pub)
    throw new Error('The sample public key is not a canonical 1,952-byte ML-DSA-65 key')
  return {
    kty: 'AKP',
    alg: 'ML-DSA-65',
    pub: value.pub,
    ...(typeof value.kid === 'string' ? { kid: value.kid } : {}),
  }
}

function compact(token: string) {
  const parts = token.split('.')
  if (
    parts.length !== 3 ||
    parts.some(
      (part) => !/^[A-Za-z0-9_-]+$/.test(part) || base64urlEncode(base64urlDecode(part)) !== part
    )
  )
    throw new Error('Malformed compact sample JWS')
  const decoded = decodeJWT(token)
  const headerPart = parts.at(0),
    payloadPart = parts.at(1),
    signaturePart = parts.at(2)
  if (!decoded || !headerPart || !payloadPart || !signaturePart)
    throw new Error('Malformed compact sample JWS')
  const signature = base64urlDecode(signaturePart)
  if (decoded.header.alg !== 'ML-DSA-65' || signature.length !== 3309)
    throw new Error('The sample requires an actual ML-DSA-65 signature')
  return {
    ...decoded,
    headerPart,
    payloadPart,
    signaturePart,
    signature,
    headerJson: new TextDecoder().decode(base64urlDecode(headerPart)),
    payloadJson: new TextDecoder().decode(base64urlDecode(payloadPart)),
  }
}

export interface DpopSampleArtifacts {
  proof: string
  accessToken: string
  asPublicJwk: AkpJwk
  target: string
}

/** Checks only this named historical sample, not a general OAuth server or replay/time-window policy. */
export async function inspectDpopProofSample(
  artifacts: DpopSampleArtifacts,
  isCurrent: () => boolean = () => true
) {
  const current = () => {
    if (!isCurrent()) throw new Error('Sample measurement canceled')
  }
  current()
  const target = normalizeDpopSampleTarget(artifacts.target)
  const proof = compact(artifacts.proof)
  const access = compact(artifacts.accessToken)
  const clientJwk = publicAkp(proof.header.jwk, false)
  const asJwk = publicAkp(artifacts.asPublicJwk, true)
  if (
    proof.header.typ !== 'dpop+jwt' ||
    access.header.typ !== 'JWT' ||
    access.header.kid !== 'sample-as' ||
    asJwk.kid !== 'sample-as' ||
    access.header.jwk !== undefined ||
    asJwk.pub === clientJwk.pub
  )
    throw new Error(
      'The sample must keep its AS key reference and independent DPoP public key distinct'
    )
  const proofCheck = await verifyJWS({
    token: artifacts.proof,
    publicKey: base64urlDecode(clientJwk.pub),
    backend: 'noble',
  })
  current()
  if (proofCheck.valid !== true) throw new Error('The actual DPoP sample signature did not verify')
  const accessCheck = await verifyJWS({
    token: artifacts.accessToken,
    publicKey: base64urlDecode(asJwk.pub),
    backend: 'noble',
  })
  current()
  if (accessCheck.valid !== true)
    throw new Error('The actual access-token sample signature did not verify')
  const expectedClaims = new Map(Object.entries(access.payload))
  for (const [name, value] of Object.entries(SAMPLE_JWT_PAYLOAD)) {
    if (JSON.stringify(expectedClaims.get(name)) !== JSON.stringify(value))
      throw new Error('The access token differs from the declared historical sample claims')
  }
  if (
    typeof proof.payload.jti !== 'string' ||
    proof.payload.jti.length === 0 ||
    proof.payload.htm !== 'GET' ||
    proof.payload.htu !== target ||
    proof.payload.iat !== sampleClock()
  )
    throw new Error('The proof differs from the declared method, target or historical sample clock')
  // RFC9964§6 fixes the required AKP thumbprint members and their lexical order.
  const thumbprintJson = JSON.stringify({
    alg: clientJwk.alg,
    kty: clientJwk.kty,
    pub: clientJwk.pub,
  })
  const jkt = await sha256url(thumbprintJson)
  current()
  const ath = await sha256url(artifacts.accessToken)
  current()
  if (!isRecord(access.payload.cnf) || access.payload.cnf.jkt !== jkt || proof.payload.ath !== ath)
    throw new Error('The actual access token, proof and client public-key binding do not match')

  const authorizationLine = `Authorization: DPoP ${artifacts.accessToken}\r\n`
  const proofLine = `DPoP: ${artifacts.proof}\r\n`
  const headerLines = authorizationLine + proofLine
  const publicJwkJson = JSON.stringify(proof.header.jwk)
  const measurements = {
    publicKeyBytes: base64urlDecode(clientJwk.pub).length,
    publicKeyBase64urlBytes: bytes(clientJwk.pub),
    publicJwkJsonBytes: bytes(publicJwkJson),
    headerJsonBytes: bytes(proof.headerJson),
    headerSegmentBytes: bytes(proof.headerPart),
    payloadJsonBytes: bytes(proof.payloadJson),
    payloadSegmentBytes: bytes(proof.payloadPart),
    signatureBytes: proof.signature.length,
    signatureSegmentBytes: bytes(proof.signaturePart),
    dotsBytes: 2,
    compactProofBytes: bytes(artifacts.proof),
    accessTokenBytes: bytes(artifacts.accessToken),
    authorizationLineBytes: bytes(authorizationLine),
    proofLineBytes: bytes(proofLine),
    headerLinesBytes: bytes(headerLines),
  }
  if (
    measurements.compactProofBytes !==
    measurements.headerSegmentBytes +
      measurements.payloadSegmentBytes +
      measurements.signatureSegmentBytes +
      2
  )
    throw new Error('The serialized proof and measured segments differ')
  current()
  return {
    ...artifacts,
    target,
    clientJwk,
    publicJwkJson,
    asJwksJson: JSON.stringify({ keys: [asJwk] }),
    headerJson: proof.headerJson,
    payloadJson: proof.payloadJson,
    authorizationLine,
    proofLine,
    headerLines,
    sampleClock: new Date(sampleClock() * 1000).toISOString(),
    measurements,
  }
}

export type DpopProofSample = Awaited<ReturnType<typeof inspectDpopProofSample>>

/** Real existing Noble/JOSE operations; only public artifacts leave this function. */
export async function generateDpopProofSample(
  inputTarget: string,
  isCurrent: () => boolean = () => true
): Promise<DpopProofSample> {
  const current = () => {
    if (!isCurrent()) throw new Error('Sample measurement canceled')
  }
  const target = normalizeDpopSampleTarget(inputTarget)
  current()
  const client = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
  current()
  const asKey = await generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
  current()
  const clientJwk = toAkpJwk(client)
  const asPublicJwk = toAkpJwk(asKey, { kid: 'sample-as' })
  if (!clientJwk || !asPublicJwk)
    throw new Error('The existing JOSE helper did not produce the sample public JWKs')
  const jkt = await sha256url(
    JSON.stringify({ alg: clientJwk.alg, kty: clientJwk.kty, pub: clientJwk.pub })
  )
  current()
  const access = await signJWS({
    alg: 'ML-DSA-65',
    header: { kid: 'sample-as' },
    payload: { ...SAMPLE_JWT_PAYLOAD, cnf: { jkt } },
    keyPair: asKey,
    backend: 'noble',
  })
  current()
  const ath = await sha256url(access.token)
  current()
  const signed = await signJWS({
    alg: 'ML-DSA-65',
    header: { typ: 'dpop+jwt', jwk: clientJwk },
    payload: { jti: crypto.randomUUID(), htm: 'GET', htu: target, iat: sampleClock(), ath },
    keyPair: client,
    backend: 'noble',
  })
  current()
  return inspectDpopProofSample(
    { proof: signed.token, accessToken: access.token, asPublicJwk, target },
    isCurrent
  )
}
