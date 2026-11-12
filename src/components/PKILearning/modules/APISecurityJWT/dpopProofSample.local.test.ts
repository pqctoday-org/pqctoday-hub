// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, webcrypto } from 'node:crypto'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { SAMPLE_JWT_PAYLOAD } from './constants'
import * as jose from './jwtUtils'
import {
  DEFAULT_DPOP_SAMPLE_TARGET,
  generateDpopProofSample,
  inspectDpopProofSample,
  normalizeDpopSampleTarget,
  type DpopProofSample,
} from './dpopProofSample'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
afterAll(() => vi.unstubAllGlobals())
afterEach(() => vi.restoreAllMocks())
const hash = (value: string) => createHash('sha256').update(value).digest('base64url')
const utf8 = (value: string) => Buffer.byteLength(value, 'utf8')
let actual: DpopProofSample
beforeAll(async () => {
  actual = await generateDpopProofSample(DEFAULT_DPOP_SAMPLE_TARGET)
})

function independent(token: string) {
  const [headerPart, payloadPart, signaturePart] = token.split('.')
  if (!headerPart || !payloadPart || !signaturePart) throw new Error('Missing actual JWS segment')
  return {
    headerPart,
    payloadPart,
    signaturePart,
    headerJson: Buffer.from(headerPart, 'base64url').toString('utf8'),
    payloadJson: Buffer.from(payloadPart, 'base64url').toString('utf8'),
    signature: Buffer.from(signaturePart, 'base64url'),
  }
}

// Counterexamples are genuinely signed with the existing implementation, not
// string mutations that would prove only a signature mismatch.
async function signedFixture(
  change: 'jwk' | 'private' | 'ath' | 'cnf' | 'method' | 'target' | 'key'
) {
  const client = await jose.generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
  const asKey = await jose.generateJwsKeyPair({ alg: 'ML-DSA-65', backend: 'noble' })
  const clientJwk = jose.toAkpJwk(client)
  const asPublicJwk = jose.toAkpJwk(asKey, { kid: 'sample-as' })
  if (!clientJwk || !asPublicJwk) throw new Error('Actual sample JWK missing')
  const jkt = hash(JSON.stringify({ alg: clientJwk.alg, kty: clientJwk.kty, pub: clientJwk.pub }))
  const access = await jose.signJWS({
    alg: 'ML-DSA-65',
    header: { kid: 'sample-as' },
    payload: { ...SAMPLE_JWT_PAYLOAD, cnf: { jkt: change === 'cnf' ? 'A'.repeat(43) : jkt } },
    keyPair: asKey,
    backend: 'noble',
  })
  const header: Record<string, unknown> = { typ: 'dpop+jwt', jwk: clientJwk }
  if (change === 'jwk') delete header.jwk
  if (change === 'private') header.jwk = { ...clientJwk, priv: 'not-a-public-member' }
  const payload = {
    jti: 'single-contrary-sample',
    htm: change === 'method' ? 'POST' : 'GET',
    htu: change === 'target' ? 'https://api.example.com/other' : DEFAULT_DPOP_SAMPLE_TARGET,
    iat: SAMPLE_JWT_PAYLOAD.iat,
    ath: change === 'ath' ? 'A'.repeat(43) : hash(access.token),
  }
  const signer = change === 'key' ? asKey : client
  const proof = await jose.signJWS({
    alg: 'ML-DSA-65',
    header,
    payload,
    keyPair: signer,
    backend: 'noble',
  })
  // The altered-claim cases have real valid signatures, including wrong binding.
  expect(
    (await jose.verifyJWS({ token: proof.token, publicKey: signer.publicKey, backend: 'noble' }))
      .valid
  ).toBe(true)
  return {
    proof: proof.token,
    accessToken: access.token,
    asPublicJwk,
    target: DEFAULT_DPOP_SAMPLE_TARGET,
  }
}

describe('complete real DPoP proof measurement', () => {
  it('keeps the named default byte counts used by the lesson and quiz reproducible', () => {
    expect(actual.measurements).toEqual({
      publicKeyBytes: 1952, publicKeyBase64urlBytes: 2603, publicJwkJsonBytes: 2643,
      headerJsonBytes: 2686, headerSegmentBytes: 3582, payloadJsonBytes: 168,
      payloadSegmentBytes: 224, signatureBytes: 3309, signatureSegmentBytes: 4412,
      dotsBytes: 2, compactProofBytes: 8220, accessTokenBytes: 4791,
      authorizationLineBytes: 4813, proofLineBytes: 8228, headerLinesBytes: 13041,
    })
  })

  it('independently counts nested JSON/base64, two field lines and both real key bindings', () => {
    const proof = independent(actual.proof),
      access = independent(actual.accessToken)
    const header = JSON.parse(proof.headerJson)
    const claims = JSON.parse(proof.payloadJson)
    const accessClaims = JSON.parse(access.payloadJson)
    const jwk = header.jwk
    expect(jwk.kty).toBe('AKP')
    expect(jwk.alg).toBe('ML-DSA-65')
    expect(Object.keys(jwk).sort()).toEqual(['alg', 'kty', 'pub'])
    expect(Buffer.from(jwk.pub, 'base64url')).toHaveLength(1952)
    expect(proof.signature).toHaveLength(3309)
    expect(
      ml_dsa65.verify(
        Uint8Array.from(proof.signature),
        Uint8Array.from(Buffer.from(proof.headerPart + '.' + proof.payloadPart)),
        Uint8Array.from(Buffer.from(jwk.pub, 'base64url'))
      )
    ).toBe(true)
    expect(
      ml_dsa65.verify(
        Uint8Array.from(access.signature),
        Uint8Array.from(Buffer.from(access.headerPart + '.' + access.payloadPart)),
        Uint8Array.from(Buffer.from(actual.asPublicJwk.pub, 'base64url'))
      )
    ).toBe(true)
    expect(jwk.pub).not.toBe(actual.asPublicJwk.pub)
    expect(JSON.parse(access.headerJson).jwk).toBeUndefined()
    expect(claims.ath).toBe(hash(actual.accessToken))
    expect(accessClaims.cnf.jkt).toBe(
      hash(JSON.stringify({ alg: jwk.alg, kty: jwk.kty, pub: jwk.pub }))
    )
    expect(actual.measurements).toEqual({
      publicKeyBytes: 1952,
      publicKeyBase64urlBytes: utf8(jwk.pub),
      publicJwkJsonBytes: utf8(JSON.stringify(jwk)),
      headerJsonBytes: utf8(proof.headerJson),
      headerSegmentBytes: utf8(proof.headerPart),
      payloadJsonBytes: utf8(proof.payloadJson),
      payloadSegmentBytes: utf8(proof.payloadPart),
      signatureBytes: 3309,
      signatureSegmentBytes: utf8(proof.signaturePart),
      dotsBytes: 2,
      compactProofBytes: utf8(actual.proof),
      accessTokenBytes: utf8(actual.accessToken),
      authorizationLineBytes: utf8('Authorization: DPoP ' + actual.accessToken + '\r\n'),
      proofLineBytes: utf8('DPoP: ' + actual.proof + '\r\n'),
      headerLinesBytes: utf8(
        'Authorization: DPoP ' + actual.accessToken + '\r\nDPoP: ' + actual.proof + '\r\n'
      ),
    })
    expect(actual.measurements.authorizationLineBytes - actual.measurements.accessTokenBytes).toBe(
      22
    )
    expect(actual.measurements.proofLineBytes - actual.measurements.compactProofBytes).toBe(8)
    expect(actual.headerLines).toBe(actual.authorizationLine + actual.proofLine)
    expect(actual.sampleClock).toBe('2025-01-01T00:00:00.000Z')
  })

  it('measures a longer actual target without confusing raw, JSON and base64 lengths', async () => {
    const changed = await generateDpopProofSample(
      'https://api.example.com/' + 'resource/'.repeat(20)
    )
    const proof = independent(changed.proof)
    expect(changed.measurements.compactProofBytes).toBeGreaterThan(
      actual.measurements.compactProofBytes
    )
    expect(changed.measurements.signatureBytes).toBe(actual.measurements.signatureBytes)
    expect(changed.measurements.headerJsonBytes).toBe(actual.measurements.headerJsonBytes)
    expect(proof.payloadPart.length).toBe(Math.ceil((utf8(proof.payloadJson) * 4) / 3))
    expect(proof.headerPart.length).toBe(Math.ceil((utf8(proof.headerJson) * 4) / 3))
    expect(changed.measurements.proofLineBytes).toBe(utf8('DPoP: ' + changed.proof + '\r\n'))
  })

  it.each(['jwk', 'private', 'ath', 'cnf', 'method', 'target', 'key'] as const)(
    'rejects a genuinely signed contrary %s sample',
    async (change) => {
      await expect(inspectDpopProofSample(await signedFixture(change))).rejects.toThrow()
    }
  )
  it('rejects malformed or signature-mutated public artifacts', async () => {
    await expect(inspectDpopProofSample({ ...actual, proof: 'a.b' })).rejects.toThrow()
    const parts = actual.proof.split('.')
    const sig = Buffer.from(parts.at(2) ?? '', 'base64url')
    const first = sig.at(0)
    if (first === undefined) throw new Error('Actual signature missing')
    sig.set([first ^ 1], 0)
    const proof = parts.slice(0, 2).join('.') + '.' + sig.toString('base64url')
    await expect(inspectDpopProofSample({ ...actual, proof })).rejects.toThrow(
      /signature did not verify/
    )
  })
  it.each([
    'https://api.example.com/resource?x=1',
    'https://api.example.com/resource#x',
    'not a URL',
  ])('rejects an unsupported sample target %s before generation', (target) => {
    expect(() => normalizeDpopSampleTarget(target)).toThrow(/sample target/)
  })
  it('stops after the first actual key operation when the run is invalidated', async () => {
    const keygen = vi.spyOn(jose, 'generateJwsKeyPair')
    let checks = 0
    await expect(
      generateDpopProofSample(DEFAULT_DPOP_SAMPLE_TARGET, () => ++checks < 2)
    ).rejects.toThrow(/canceled/)
    expect(keygen).toHaveBeenCalledTimes(1)
  })
})
